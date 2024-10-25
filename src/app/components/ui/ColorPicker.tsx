import { useState } from "react";
import ColorSwatch from "./ColorSwatch";

export default function ColorPicker({ displayName }: { displayName: string }) {
  const [selectedColor, setSelectedColor] = useState("text-blue-500");

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    console.log(color);
  };

  return (
    <div className="border-2 border-black p-1 flex gap-1 items-center">
      <div className="flex flex-col text-sm cursor-default select-none">
        <span>Name color:</span>
        <span className={selectedColor}>{displayName}</span>
      </div>
      <div className="grid grid-cols-4 grid-rows-2 gap-1 w-fit">
        <ColorSwatch
          text="text-blue-500"
          bg="bg-blue-500"
          onSelect={handleColorSelect}
        />
        <ColorSwatch
          text="text-red-500"
          bg="bg-red-500"
          onSelect={handleColorSelect}
        />
        <ColorSwatch
          text="text-green-500"
          bg="bg-green-500"
          onSelect={handleColorSelect}
        />
        <ColorSwatch
          text="text-pink-500"
          bg="bg-pink-500"
          onSelect={handleColorSelect}
        />
        <ColorSwatch
          text="text-gray-500"
          bg="bg-gray-500"
          onSelect={handleColorSelect}
        />
        <ColorSwatch
          text="text-yellow-500"
          bg="bg-yellow-500"
          onSelect={handleColorSelect}
        />
        <ColorSwatch
          text="text-purple-500"
          bg="bg-purple-500"
          onSelect={handleColorSelect}
        />
        <ColorSwatch
          text="text-orange-500"
          bg="bg-orange-500"
          onSelect={handleColorSelect}
        />
      </div>
    </div>
  );
}
