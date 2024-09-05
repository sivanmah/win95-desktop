import { useState, useEffect, useRef } from "react";

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

const SYSTEM_MESSAGE: Message = {
  role: "system",
  content:
    "You are an AI assistant with knowledge typical of a well-informed person in December 1995. Respond as if current events and common knowledge are those of 1995. Use period-appropriate terminology and references. If unsure about a fact, err on the side of older information. Don't acknowledge or speculate about post-1995 events. Keep responses concise, using no more than 3 sentences. If asked about anything you suspect is post-1995, say 'I'm not familiar with that information.'",
};
export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([SYSTEM_MESSAGE]);
  const [input, setInput] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async () => {
    if (input.trim() === "") return;

    const newMessages = [
      ...messages,
      { role: "user" as const, content: input },
    ];
    setMessages(newMessages);
    setInput("");

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const data = await response.json();
      setMessages([...newMessages, data.reply]);
    } catch (error) {
      console.error("Error:", error);
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Sorry, I encountered an error." },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-80 w-80 bg-taskbar-bg">
      <div className="flex-grow overflow-y-scroll m-2 p-2 border border-gray-700 bg-white">
        {messages.slice(1).map((message, index) => (
          <div key={index}>
            <span>
              {message.role === "user" ? (
                <span className="text-blue-700 font-bold">User: </span>
              ) : (
                <span className="text-red-700 font-bold">Bot: </span>
              )}
              {message.content}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="w-full p-2 border border-gray-700 outline-none"
          placeholder="Type a message..."
        />
        <div
          onClick={sendMessage}
          className="group mt-2 bg-taskbar-bg border-2 border-b-black border-r-black w-20 h-6 cursor-default flex items-center justify-center active:border-b-white active:border-r-white active:border-t-black active:border-l-black"
        >
          <div className="select-none flex items-center justify-center font-bold border-b-2 border-r-2 w-20 h-5 border-gray-500 group-active:border-t-2 group-active:border-l-2 group-active:border-gray-500 group-active:border-b-0 group-active:border-r-0">
            Send
          </div>
        </div>
      </div>
    </div>
  );
}
