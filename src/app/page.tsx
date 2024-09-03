"use client";

import Taskbar from "@/app/components/Taskbar";
import DesktopIcon from "@/app/components/DesktopIcon";
import Window from "@/app/components/Window";
import { useState } from "react";

export default function Home() {
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const [windowName, setWindowName] = useState("");

  const handleCloseWindow = () => {
    setIsWindowOpen(false);
  };

  const handleOpenWindow = (name: string) => {
    setIsWindowOpen(true);
    setWindowName(name);
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-win95-teal">
      <div className="flex flex-wrap gap-4 p-4">
        <DesktopIcon
          icon="notepad"
          name="Notepad"
          onDoubleClick={handleOpenWindow}
        />
        {isWindowOpen && (
          <Window name={windowName} onClose={handleCloseWindow} />
        )}
      </div>
      <Taskbar />
    </div>
  );
}
