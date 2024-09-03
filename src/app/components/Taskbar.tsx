import StartMenuButton from "./StartMenuButton";
import { useState } from "react";
import StartMenu from "./StartMenu";

export default function Taskbar() {
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const toggleStartMenu = () => setIsStartMenuOpen(!isStartMenuOpen);

  return (
    <div className="bg-taskbar-bg h-9 w-full fixed bottom-0 flex items-center px-2 overflow-visible select-none border-t-2">
      <StartMenuButton onClick={toggleStartMenu} isOpen={isStartMenuOpen} />
      <StartMenu
        isOpen={isStartMenuOpen}
        onClose={() => setIsStartMenuOpen(false)}
      />
    </div>
  );
}
