export default function StartMenu({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-8 left-0 w-64 bg-gray-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-gray-800 shadow-lg">
      <div className="bg-blue-800 h-full w-8 absolute left-0 top-0"></div>
      <ul className="ml-10 py-2">
        <li
          className="px-4 py-2 hover:bg-blue-600 hover:text-white cursor-pointer"
          onClick={() => {
            // onAppClick("notepad");
            onClose();
          }}
        >
          Notepad
        </li>
        {/* Add more menu items as needed */}
      </ul>
    </div>
  );
}
