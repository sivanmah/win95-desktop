import clsx from "clsx";
import Image from "next/image";
import startIcon from "@/../public/startmenu.png";

export default function StartMenuButton({
  onClick,
  isOpen,
}: {
  onClick: () => void;
  isOpen: boolean;
}) {
  return (
    <button
      className={clsx(
        "border-2 border-b-black border-r-black text-s w-18 cursor-default",
        {
          "border-b-white border-r-white border-t-black border-l-black": isOpen,
          "border-b-black border-r-black": !isOpen,
        }
      )}
    >
      <div
        className={clsx("flex items-center justify-center gap-x-1 font-bold", {
          "border-t-2 border-l-2 border-gray-500": isOpen,
          "border-b-2 border-r-2 border-gray-500": !isOpen,
        })}
        onClick={onClick}
      >
        {/* eslint-disable-next-line */}
        <Image src={startIcon} alt="Start Menu" width={24} draggable={false} />
        Start
      </div>
    </button>
  );
}
