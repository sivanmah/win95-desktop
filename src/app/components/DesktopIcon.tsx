import Image, { StaticImageData } from "next/image";

interface DesktopIconProps {
  icon: StaticImageData;
  name: string;
  onDoubleClick: (name: string) => void;
}

export default function DesktopIcon({
  icon,
  name,
  onDoubleClick,
}: DesktopIconProps) {
  return (
    <div
      onDoubleClick={() => onDoubleClick(name)}
      className="flex flex-col items-center gap-y-1 cursor-default select-none"
    >
      <div className="w-12 h-12">
        <Image src={icon} alt={`${name} icon`} width={48} draggable={false} />
      </div>
      <span className="text-xs text-white">{name}</span>
    </div>
  );
}
