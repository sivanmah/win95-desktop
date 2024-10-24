import { createServer } from "http";
import { parse } from "url";
import next from "next";
import WebSocket, { WebSocketServer } from "ws";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  server.listen(3000, (err) => {
    if (err) throw err;
    console.log("Server is ready on http://localhost:3000");
  });
});

const wsServer = new WebSocketServer({ port: 8080 });

wsServer.on("connection", (ws) => {
  console.log("WebSocket connection established");
  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  ws.on("message", (message) => {
    wsServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
});
