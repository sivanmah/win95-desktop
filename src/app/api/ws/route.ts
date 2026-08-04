import { cookies, headers } from "next/headers";
import {
  experimental_upgradeWebSocket,
  type WebSocket,
  type WebSocketData,
} from "@vercel/functions";
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from "unique-names-generator";
import { NAME_COLORS, toColorKey } from "@/lib/colors";
import {
  CHAT_CHANNEL,
  appendToHistory,
  ensureSubscribed,
  getPublisher,
  readHistory,
} from "@/lib/redis";
import type { Message } from "@/types/chat";

const MAX_CONTENT_LENGTH = 500;
const MAX_PAYLOAD_BYTES = 4096;

// Sockets held by *this* function instance. Other instances have their own, which
// is why every broadcast goes through Redis rather than straight to this set.
const localSockets = new Set<WebSocket>();

const OPEN = 1;

function fanOutToLocalSockets(raw: string) {
  localSockets.forEach((socket) => {
    if (socket.readyState === OPEN) socket.send(raw);
  });
}

function generateDisplayName() {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    separator: "",
    style: "capital",
  });
}

const LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function isLoopback(host: string) {
  return LOOPBACK_HOSTNAMES.has(host.replace(/:\d+$/, "").toLowerCase());
}

/**
 * Rejects handshakes from other sites.
 *
 * Deliberately not a comparison against a single header. Upgrades reach this
 * function through a proxy that rewrites both `host` and `x-forwarded-host` to
 * its own socket address -- under `vercel dev` they are literally "[::1]:3000"
 * while the browser's Origin is "localhost:3000" -- so any one header is an
 * unreliable stand-in for the host the browser actually asked for. Instead,
 * collect every host that could legitimately serve this app and check Origin
 * against the set.
 *
 * A browser cannot forge any of these: the WebSocket API sends no custom
 * headers, and Origin is set by the browser itself.
 */
function isAllowedOrigin(requestHeaders: Headers) {
  const origin = requestHeaders.get("origin");
  if (!origin) return true; // Non-browser clients don't send it.

  let originHost: string;
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    return false;
  }

  // Local development, where the proxy hides the real host entirely.
  if (process.env.VERCEL_ENV !== "production" && isLoopback(originHost)) {
    return true;
  }

  const allowed = new Set(
    [
      requestHeaders.get("x-forwarded-host"),
      requestHeaders.get("host"),
      // Set by Vercel; covers the production domain, this deployment's own
      // URL, and the branch alias.
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
      process.env.VERCEL_URL,
      process.env.VERCEL_BRANCH_URL,
    ]
      .filter((host): host is string => Boolean(host))
      .map((host) => host.toLowerCase())
  );

  return allowed.has(originHost);
}

/** Token bucket per connection. A connection stays pinned to one instance, so in-memory is fine. */
function createRateLimiter(limit = 10, windowMs = 10_000) {
  let windowStart = Date.now();
  let used = 0;

  return function allow() {
    const now = Date.now();
    if (now - windowStart > windowMs) {
      windowStart = now;
      used = 0;
    }
    if (used >= limit) return false;
    used += 1;
    return true;
  };
}

export async function GET() {
  const requestHeaders = await headers();
  if (!isAllowedOrigin(requestHeaders)) {
    return new Response("Forbidden", { status: 403 });
  }

  // Identity is resolved here, from the httpOnly cookie middleware.ts set on the
  // page request. Clients never get to say who they are.
  const cookieStore = await cookies();
  const displayName =
    cookieStore.get("display-name")?.value || generateDisplayName();

  return experimental_upgradeWebSocket(
    async (ws) => {
      const allow = createRateLimiter();

      localSockets.add(ws);
      ensureSubscribed(fanOutToLocalSockets);

      async function handleMessage(data: WebSocketData) {
        let incoming;
        try {
          incoming = JSON.parse(data.toString());
        } catch {
          return;
        }

        if (incoming?.type === "keepalive") return;
        if (typeof incoming?.content !== "string") return;

        const content = incoming.content.trim().slice(0, MAX_CONTENT_LENGTH);
        if (!content) return;
        if (!allow()) return;

        const message: Message = {
          id: crypto.randomUUID(),
          sender: displayName,
          content,
          // toColorKey is total, so this is always one of the palette hexes.
          nameColor: NAME_COLORS[toColorKey(incoming.nameColor)],
          timestamp: new Date().toISOString(),
        };

        try {
          await appendToHistory(message);
          // Published, not sent directly -- our own subscription delivers it back
          // to us, so every client receives it by the same path.
          await getPublisher().publish(CHAT_CHANNEL, JSON.stringify(message));
        } catch (error) {
          console.error("Failed to broadcast message:", error);
        }
      }

      // Attached synchronously, before the history await below. `ws` drops
      // events that have no listener, so registering after the await would
      // silently discard anything sent during that round trip.
      let replayed = false;
      const buffered: WebSocketData[] = [];

      ws.on("message", (data: WebSocketData) => {
        if (!replayed) {
          buffered.push(data);
          return;
        }
        void handleMessage(data);
      });

      try {
        const history = await readHistory();
        history.forEach((message) => ws.send(JSON.stringify(message)));
      } catch (error) {
        console.error("Failed to replay history:", error);
      }

      // Ordered after the replay so a client never sees its own message before
      // the backlog it was replying to.
      replayed = true;
      for (const data of buffered) {
        await handleMessage(data);
      }
      buffered.length = 0;

      ws.on("close", () => {
        localSockets.delete(ws);
      });

      ws.on("error", (error: Error) => {
        console.error("WebSocket error:", error);
        localSockets.delete(ws);
      });
    },
    { maxPayload: MAX_PAYLOAD_BYTES }
  );
}
