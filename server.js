import { createServer } from "http";
import { parse } from "url";
import next from "next";
import WebSocket, { WebSocketServer } from "ws";
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from "unique-names-generator";

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT) || 3000;
const wsPort = Number(process.env.WS_PORT) || 8080;
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`Server is ready on http://localhost:${port}`);
  });
});

const wsServer = new WebSocketServer({ port: wsPort });

function readCookie(header, name) {
  if (!header) return undefined;

  for (const pair of header.split(";")) {
    const separator = pair.indexOf("=");
    if (separator === -1) continue;
    if (pair.slice(0, separator).trim() !== name) continue;
    return decodeURIComponent(pair.slice(separator + 1).trim());
  }

  return undefined;
}

// Resolved once, from the httpOnly cookie middleware.ts set on the page request.
// Clients never get to say who they are.
function resolveDisplayName(req) {
  return (
    readCookie(req.headers.cookie, "display-name") ||
    uniqueNamesGenerator({
      dictionaries: [adjectives, colors, animals],
      separator: "",
      style: "capital",
    })
  );
}

wsServer.on("connection", (ws, req) => {
  const displayName = resolveDisplayName(req);
  console.log(`WebSocket connection established for ${displayName}`);

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  ws.on("message", (data) => {
    let incoming;
    try {
      incoming = JSON.parse(data.toString());
    } catch {
      return;
    }

    if (incoming?.type === "keepalive") return;
    if (typeof incoming?.content !== "string" || !incoming.content.trim()) {
      return;
    }

    const message = JSON.stringify({
      sender: displayName,
      content: incoming.content,
      nameColor: incoming.nameColor,
      timestamp: new Date().toISOString(),
    });

    wsServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
});
