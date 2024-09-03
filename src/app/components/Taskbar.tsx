import StartMenuButton from "./StartMenuButton";
("@/app/components/StartMenu");

export default function Taskbar() {
  return (
    <div className="bg-taskbar-bg h-9 w-full fixed bottom-0 flex items-center px-2 overflow-visible select-none border-t-2">
      <StartMenuButton />
    </div>
  );
}
