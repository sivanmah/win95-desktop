import Draggable from "react-draggable";
import Notepad from "@/app/components/applications/Notepad";
import Image from "next/image";

export default function Window({
  name,
  onClose,
}: {
  name: string;
  onClose: () => void;
}) {
  return (
    <Draggable handle=".bg-window-top" cancel=".bg-taskbar-bg">
      <div>
        <div className="bg-window-top cursor-default select-none w-80 flex justify-between items-center px-2">
          <span className="text-white">{name}</span>
          <div className="bg-taskbar-bg border-2 border-b-black border-r-black text-s w-5 h-5 cursor-default flex items-center justify-center active:border-b-white active:border-r-white active:border-t-black active:border-l-black">
            <div
              className="flex items-center justify-center font-bold border-b-2 border-r-2 w-4 h-4 border-gray-500 active:border-t-2 active:border-l-2 active:border-gray-500 active:border-b-0 active:border-r-0"
              onClick={onClose}
            >
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
        <div>{name === "Notepad" && <Notepad />}</div>
      </div>
    </Draggable>
  );
}
