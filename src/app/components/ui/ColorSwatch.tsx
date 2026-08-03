export default function ColorSwatch({
  colorKey,
  color,
  onSelect,
}: {
  colorKey: string;
  color: string;
  onSelect: (colorKey: string) => void;
}) {
  return (
    <div
      className="border-black border-2 p-2"
      style={{ backgroundColor: color }}
      onClick={() => onSelect(colorKey)}
    ></div>
  );
}
