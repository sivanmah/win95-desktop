import { useState } from "react";

export default function ColorPicker({ displayName }: { displayName: string }) {
  const [color, setColor] = useState("#000000");

  const selectColor = (color: string) => {
    setColor(color);
    console.log(color);
  };

  const getBorderClass = (divColor: string) => {
    return color === divColor ? "border-4" : "border-2";
  };

  return (
    <div className="border-2 border-black p-1 flex gap-1 items-center">
      <div className="flex flex-col text-sm cursor-default select-none">
        <span>Name color:</span>
        <span style={{ color }}>{displayName}</span>
      </div>
      <div
        className={`${getBorderClass("#3b82f6")} border-black bg-blue-500 p-2`}
        onClick={() => selectColor("#3b82f6")}
      ></div>
      <div
        className={`${getBorderClass("#ef4444")} border-black bg-red-500 p-2`}
        onClick={() => selectColor("#ef4444")}
      ></div>
      <div
        className={`${getBorderClass("#22c55e")} border-black bg-green-500 p-2`}
        onClick={() => selectColor("#22c55e")}
      ></div>
      <div
        className={`${getBorderClass("#ec4899")} border-black bg-pink-500 p-2`}
        onClick={() => selectColor("#ec4899")}
      ></div>
    </div>
  );
}
