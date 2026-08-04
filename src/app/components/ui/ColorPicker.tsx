import { useSyncExternalStore } from "react";
import Cookies from "js-cookie";
import ColorSwatch from "./ColorSwatch";
import { NAME_COLORS, DEFAULT_COLOR_KEY, toColorKey } from "@/lib/colors";

type ColorKey = keyof typeof NAME_COLORS;

const COLOR_KEYS = Object.keys(NAME_COLORS) as ColorKey[];
const COLOR_COOKIE = "display-name-color";
// Cookies emit no change event of their own, so picking a colour dispatches
// this to tell every mounted picker to re-read.
const COLOR_CHANGE_EVENT = "display-name-color-change";

function subscribe(onChange: () => void) {
  window.addEventListener(COLOR_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(COLOR_CHANGE_EVENT, onChange);
}

function getSnapshot(): ColorKey {
  return toColorKey(Cookies.get(COLOR_COOKIE));
}

// There is no cookie to read while rendering on the server, so the server
// renders the default and hydration corrects it without a mismatch.
function getServerSnapshot(): ColorKey {
  return DEFAULT_COLOR_KEY;
}

export default function ColorPicker({ displayName }: { displayName: string }) {
  // Reading the cookie in an effect and calling setState is what React 19
  // flags as a cascading render; this subscribes to it as external state.
  const selectedKey = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const handleColorSelect = (colorKey: string) => {
    // The key, not the class -- the class never crosses the wire.
    Cookies.set(COLOR_COOKIE, toColorKey(colorKey), { expires: 30 });
    window.dispatchEvent(new Event(COLOR_CHANGE_EVENT));
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
