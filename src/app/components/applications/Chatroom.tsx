import { useCallback, useEffect, useRef, useState, FormEvent } from "react";
import Cookies from "js-cookie";
import { Message } from "@/types/chat";
import { toColorKey } from "@/lib/colors";
import ColorPicker from "../ui/ColorPicker";

// Same origin as the page, so this follows whatever host and port the app is
// actually served from -- localhost in dev, the real domain in production.
function chatroomSocketUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/api/ws`;
}

type Status = "connecting" | "open" | "closed";

const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

export default function Chatroom({ displayName }: { displayName: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("connecting");
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Set on unmount so the close handler doesn't reconnect a closed window.
  const unmountedRef = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  }, [messages]);

  // Vercel closes every socket when the function hits its max duration -- 5
  // minutes on Hobby -- so reconnecting is the normal case, not an error path.
  const connect = useCallback(() => {
    if (unmountedRef.current) return;

    setStatus("connecting");
    const socket = new WebSocket(chatroomSocketUrl());
    socketRef.current = socket;
    let reconnectDelay = INITIAL_RECONNECT_DELAY;

    const keepAlive = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "keepalive" }));
      }
    }, 30000);

    socket.addEventListener("open", () => {
      reconnectDelay = INITIAL_RECONNECT_DELAY;
      setStatus("open");
    });

    socket.addEventListener("message", async (event: MessageEvent) => {
      const text =
        event.data instanceof Blob ? await event.data.text() : event.data;

      let received: Message;
      try {
        received = JSON.parse(text);
      } catch {
        return;
      }

      // Reconnecting replays recent history, so drop anything already shown.
      setMessages((previous) =>
        previous.some((message) => message.id === received.id)
          ? previous
          : [...previous, received]
      );
    });

    socket.addEventListener("close", () => {
      clearInterval(keepAlive);
      if (unmountedRef.current) return;

      setStatus("closed");
      setTimeout(connect, reconnectDelay);
      reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
    });

    // 'close' always follows 'error', so reconnection is handled there.
    socket.addEventListener("error", () => socket.close());
  }, []);

  useEffect(() => {
    unmountedRef.current = false;
    connect();

    return () => {
      unmountedRef.current = true;
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [connect]);

  const sendMessage = (e: FormEvent) => {
    e.preventDefault();

    const content = input.trim();
    if (!content) return;

    const socket = socketRef.current;
    // Don't clear the box unless the message actually went somewhere.
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    // No sender here on purpose -- the server stamps it from the display-name
    // cookie, so a client can't claim to be someone else.
    socket.send(
      JSON.stringify({
        content,
        nameColor: toColorKey(Cookies.get("display-name-color")),
      })
    );
    setInput("");
  };

  const isOpen = status === "open";

  return (
    <div className="flex flex-col h-80 w-80 bg-taskbar-bg">
      <div className="flex-grow overflow-y-scroll m-2 p-2 border border-gray-700 bg-white">
        {messages.map((msg) => (
          <div key={msg.id}>
            <span>
              <span style={{ color: msg.nameColor }}>{msg.sender}: </span>
              {msg.content}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage}>
        <div className="px-2 pb-2">
          <div className="text-xs mb-1 cursor-default select-none">
            {isOpen
              ? "Connected"
              : status === "connecting"
                ? "Connecting..."
                : "Disconnected - reconnecting..."}
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full p-2 border border-gray-700 outline-none disabled:bg-gray-200 disabled:text-gray-500"
            placeholder={isOpen ? "Type a message..." : "Not connected"}
            disabled={!isOpen}
            autoFocus
          />
          <div className="flex justify-between items-center mt-2">
            <button
              type="submit"
              disabled={!isOpen}
              className="group mt-2 bg-taskbar-bg border-2 border-b-black border-r-black w-20 h-6 cursor-default flex items-center justify-center active:border-b-white active:border-r-white active:border-t-black active:border-l-black disabled:opacity-50"
            >
              <div className="select-none flex items-center justify-center font-bold border-b-2 border-r-2 w-20 h-5 border-gray-500 group-active:border-t-2 group-active:border-l-2 group-active:border-gray-500 group-active:border-b-0 group-active:border-r-0 group-disabled:border-0">
                Send
              </div>
            </button>
            <ColorPicker displayName={displayName} />
          </div>
        </div>
      </form>
    </div>
  );
}
