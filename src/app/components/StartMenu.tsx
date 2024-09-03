import { useState } from "react";
import clsx from "clsx";

export default function StartMenu() {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const toggleStartMenu = () => {
    setIsOpen(!isOpen);
    console.log("Start Menu is", isOpen ? "closed" : "open");
  };

  return (
    <button
      className={clsx(
        "border-2 border-b-black border-r-black text-s w-18 cursor-default",
        {
          "border-b-white border-r-white border-t-black border-l-black": isOpen, // Apply this class when isOpen is true
          "border-b-black border-r-black": !isOpen, // Apply this class when isOpen is false
        }
      )}
    >
      <div
        className={clsx("flex items-center justify-center gap-x-1 font-bold", {
          "border-t-2 border-l-2 border-gray-500": isOpen, // Apply this class when isOpen is true
          "border-b-2 border-r-2 border-gray-500": !isOpen, // Apply this class when isOpen is false
        })}
        onClick={toggleStartMenu}
      >
        {/* eslint-disable-next-line */}
        <img src="/startmenu.png" alt="Start Menu" width="24em" />
        Start
      </div>
    </button>
  );
}
