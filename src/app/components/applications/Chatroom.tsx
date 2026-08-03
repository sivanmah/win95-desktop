import { useEffect, useRef, useState, FormEvent } from "react";
import Cookies from "js-cookie";
import { Message } from "@/types/chat";
import ColorPicker from "../ui/ColorPicker";

export default function Chatroom({ displayName }: { displayName: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  };

  const sendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // No sender here on purpose — the server stamps it from the display-name cookie, so a client can't claim to be someone else.
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          content: input,
          nameColor: Cookies.get("display-name-color") || "text-blue-500",
        }),
      );
    }

    setInput("");
  };

  useEffect(() => {
    scrollToBottom();

    if (!socketRef.current) {
      console.log("Setting up WebSocket connection...");
      const socket = new WebSocket("wss://win95-sivan.duckdns.org/ws");

      socketRef.current = socket;

      const keepAliveInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "keepalive" }));
        }
      }, 30000); // Send keepalive every 10 seconds

      socket.addEventListener("open", () => {
        console.log("Connected to WebSocket server");
      });

      socket.addEventListener("message", async (event: MessageEvent) => {
        console.log("Message from server (raw data):", event.data);

        let receivedMessage: Message;
        if (event.data instanceof Blob) {
          const text = await event.data.text();
          receivedMessage = JSON.parse(text);
        } else {
          receivedMessage = JSON.parse(event.data);
        }

        setMessages((prevMessages) => [...prevMessages, receivedMessage]);
      });

      // Cleanup function to run on component unmount
      return () => {
        console.log("Cleaning up WebSocket connection...");
        clearInterval(keepAliveInterval);
        socket.close();
        socketRef.current = null; // Optional: reset the ref to null
      };
    }
  }, []);

  return (
    <div className="flex flex-col h-80 w-80 bg-taskbar-bg">
      <div className="flex-grow overflow-y-scroll m-2 p-2 border border-gray-700 bg-white">
        {messages.map((msg, i) => (
          <div key={i}>
            <span>
              <span className={msg.nameColor}>{msg.sender}: </span>
              {msg.content}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage}>
        <div className="p-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full p-2 border border-gray-700 outline-none"
            placeholder="Type a message..."
            autoFocus
          />
          <div className="flex justify-between items-center mt-2">
            <button
              type="submit"
              className="group mt-2 bg-taskbar-bg border-2 border-b-black border-r-black w-20 h-6 cursor-default flex items-center justify-center active:border-b-white active:border-r-white active:border-t-black active:border-l-black"
            >
              <div className="select-none flex items-center justify-center font-bold border-b-2 border-r-2 w-20 h-5 border-gray-500 group-active:border-t-2 group-active:border-l-2 group-active:border-gray-500 group-active:border-b-0 group-active:border-r-0">
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
