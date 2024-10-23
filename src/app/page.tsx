"use client";
import { useState } from "react";
import Taskbar from "@/app/components/Taskbar";
import DesktopIcon from "@/app/components/DesktopIcon";
import Window from "@/app/components/Window";
import notepadIcon from "@/../public/icons/notepad.png";
import chatbotIcon from "@/../public/icons/chatbot.png";
import chatroomIcon from "@/../public/icons/chatroom.png";

interface WindowInfo {
  id: string;
  name: string;
}

export default function Home() {
  const [windows, setWindows] = useState<WindowInfo[]>([]);

  const handleCloseWindow = (id: string) => {
    setWindows(windows.filter((window) => window.id !== id));
  };

  const handleOpenWindow = (name: string) => {
    const newWindow: WindowInfo = {
      id: `${name}-${Date.now()}`,
      name: name,
    };
    setWindows([...windows, newWindow]);
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-win95-teal">
      <div className="flex flex-col items-start flex-wrap gap-4 p-4">
        <DesktopIcon
          icon={notepadIcon}
          name="Notepad"
          onDoubleClick={() => handleOpenWindow("Notepad")}
        />
        <DesktopIcon
          icon={chatbotIcon}
          name="Chatbot"
          onDoubleClick={() => handleOpenWindow("Chatbot")}
        />
        <DesktopIcon
          icon={chatroomIcon}
          name="Chatroom"
          onDoubleClick={() => handleOpenWindow("Chatroom")}
        />
        {windows.map((window) => (
          <Window
            key={window.id}
            id={window.id}
            name={window.name}
            onClose={() => handleCloseWindow(window.id)}
          />
        ))}
      </div>
      <Taskbar />
    </div>
  );
}
