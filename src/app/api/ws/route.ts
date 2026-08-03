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

/** Rejects handshakes from other sites. Same-origin only, since the page and the socket share a host. */
function isSameOrigin(requestHeaders: Headers) {
  const origin = requestHeaders.get("origin");
  if (!origin) return true; // Non-browser clients don't send it.

  try {
    return new URL(origin).host === requestHeaders.get("host");
  } catch {
    return false;
  }
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
  if (!isSameOrigin(requestHeaders)) {
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

      try {
        const history = await readHistory();
        history.forEach((message) => ws.send(JSON.stringify(message)));
      } catch (error) {
        console.error("Failed to replay history:", error);
      }

      ws.on("message", async (data: WebSocketData) => {
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
      });

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
