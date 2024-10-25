import { useState } from "react";

export default function ColorSwatch({
  text,
  bg,
  onSelect,
}: {
  text: string;
  bg: string;
  onSelect: (color: string) => void;
}) {
  return (
    <div
      className={`border-black border-2 ${bg} p-2`}
      onClick={() => onSelect(text)}
    ></div>
  );
}
