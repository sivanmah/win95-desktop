import { useEffect, useRef, useState, FormEvent } from "react";
import { Message } from "@/types/chat";

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

    const message: Message = {
      sender: displayName,
      content: input,
      timestamp: new Date(),
    };

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }

    setInput("");
  };

  useEffect(() => {
    scrollToBottom();
    if (!socketRef.current) {
      console.log("Setting up WebSocket connection...");
      const socket = new WebSocket("ws://localhost:8080");
      socketRef.current = socket;

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

      socket.addEventListener("close", () => {
        console.log("WebSocket connection closed.");
      });

      return () => {
        if (
          socketRef.current &&
          socketRef.current.readyState === WebSocket.OPEN
        ) {
          console.log("Cleaning up WebSocket connection...");
          socketRef.current.close();
        }
      };
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-80 w-80 bg-taskbar-bg">
      <div className="flex-grow overflow-y-scroll m-2 p-2 border border-gray-700 bg-white">
        {messages.map((msg, i) => (
          <div key={i}>
            <span>
              <span className="text-blue-700">{msg.sender}: </span>
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
          />
          <button
            type="submit"
            className="group mt-2 bg-taskbar-bg border-2 border-b-black border-r-black w-20 h-6 cursor-default flex items-center justify-center active:border-b-white active:border-r-white active:border-t-black active:border-l-black"
          >
            <div className="select-none flex items-center justify-center font-bold border-b-2 border-r-2 w-20 h-5 border-gray-500 group-active:border-t-2 group-active:border-l-2 group-active:border-gray-500 group-active:border-b-0 group-active:border-r-0">
              Send
            </div>
          </button>
        </div>
      </form>
    </div>
  );
}
