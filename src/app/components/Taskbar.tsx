import { useRef, useState } from "react";
import { useOnClickOutside } from "@/lib/hooks/useOnClickOutside";
import StartMenu from "./StartMenu";
import StartMenuButton from "./StartMenuButton";

export default function Taskbar() {
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const toggleStartMenu = () => setIsStartMenuOpen(!isStartMenuOpen);

  const containerRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(containerRef, () => {
    if (isStartMenuOpen) setIsStartMenuOpen(false);
  });

  return (
    <div className="bg-taskbar-bg h-9 w-full fixed bottom-0 flex items-center px-2 overflow-visible select-none border-t-2">
      <div ref={containerRef} className="flex h-full items-center">
        {" "}
        <StartMenuButton onClick={toggleStartMenu} isOpen={isStartMenuOpen} />
        <StartMenu
          isOpen={isStartMenuOpen}
          onClose={() => setIsStartMenuOpen(false)}
        />
      </div>
    </div>
  );
}
