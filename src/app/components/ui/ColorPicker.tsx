import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import ColorSwatch from "./ColorSwatch";
import { NAME_COLORS, DEFAULT_COLOR_KEY, toColorKey } from "@/lib/colors";

type ColorKey = keyof typeof NAME_COLORS;

const COLOR_KEYS = Object.keys(NAME_COLORS) as ColorKey[];

export default function ColorPicker({ displayName }: { displayName: string }) {
  const [selectedKey, setSelectedKey] = useState<ColorKey>(DEFAULT_COLOR_KEY);

  useEffect(() => {
    const saved = Cookies.get("display-name-color");
    if (saved) {
      setSelectedKey(toColorKey(saved));
    }
  }, []);

  const handleColorSelect = (colorKey: string) => {
    const key = toColorKey(colorKey);
    setSelectedKey(key);
    // The key, not the class -- the class never crosses the wire.
    Cookies.set("display-name-color", key, { expires: 30 });
  };

  return (
    <div className="border-2 border-black p-1 flex gap-1 items-center">
      <div className="flex flex-col text-sm cursor-default select-none">
        <span>Name color:</span>
        <span style={{ color: NAME_COLORS[selectedKey] }}>{displayName}</span>
      </div>
      <div className="grid grid-cols-4 grid-rows-2 gap-1 w-fit">
        {COLOR_KEYS.map((colorKey) => (
          <ColorSwatch
            key={colorKey}
            colorKey={colorKey}
            color={NAME_COLORS[colorKey]}
            onSelect={handleColorSelect}
          />
        ))}
      </div>
    </div>
  );
}
