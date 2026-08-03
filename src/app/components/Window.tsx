import React, { useState, useRef } from "react";
import Draggable from "react-draggable";
import Image from "next/image";
import Notepad from "@/app/components/applications/Notepad";
import Chatbot from "@/app/components/applications/Chatbot";
import Chatroom from "@/app/components/applications/Chatroom";

let globalZIndex = 1000;

export default function Window({
  id,
  name,
  onClose,
  displayName,
}: {
  id: string;
  name: string;
  displayName: string;
  onClose: () => void;
}) {
  const [zIndex, setZIndex] = useState(globalZIndex);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const nodeRef = useRef(null);

  const bringToFront = () => {
    globalZIndex += 1;
    setZIndex(globalZIndex);
  };

  const onDrag = (e: any, data: { x: number; y: number }) => {
    setPosition({ x: data.x, y: data.y });
  };

  const renderApp = () => {
    switch (name) {
      case "Notepad":
        return <Notepad />;
      case "Chatbot":
        return <Chatbot />;
      case "Chatroom":
        return <Chatroom displayName={displayName} />;
      default:
        return null;
    }
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      handle=".bg-window-top"
      cancel=".bg-taskbar-bg"
      position={position}
      onStart={bringToFront}
      onDrag={onDrag}
      onMouseDown={bringToFront}
    >
      <div
        ref={nodeRef}
        style={{
          position: "absolute",
          zIndex: zIndex,
          backgroundColor: "white",
          border: "1px solid black",
        }}
      >
        <div className="bg-window-top cursor-default select-none w-80 flex justify-between items-center px-2">
          <span className="text-white">{name}</span>
          <div
            onClick={onClose}
            className="group bg-taskbar-bg border-2 border-b-black border-r-black text-s w-5 h-5 cursor-default flex items-center justify-center active:border-b-white active:border-r-white active:border-t-black active:border-l-black"
          >
            <div className="flex items-center justify-center font-bold border-b-2 border-r-2 w-4 h-4 border-gray-500 group-active:border-t-2 group-active:border-l-2 group-active:border-gray-500 group-active:border-b-0 group-active:border-r-0">
              <Image
                src="/x-button.png"
                alt="Close"
                width={10}
                height={10}
                draggable={false}
              />
            </div>
          </div>
        </div>
        <div>{renderApp()}</div>
      </div>
    </Draggable>
  );
}
