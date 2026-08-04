export default function StartMenu({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-8 left-0 w-64 bg-gray-300 border-2 border-t-white border-l-white border-b-black border-r-black">
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
        <li
          className="px-4 py-2 hover:bg-blue-600 hover:text-white cursor-pointer"
          onClick={() => {
            // onAppClick("notepad");
            onClose();
          }}
        >
          Chatbot
        </li>
        <li
          className="px-4 py-2 hover:bg-blue-600 hover:text-white cursor-pointer"
          onClick={() => {
            // onAppClick("notepad");
            onClose();
          }}
        >
          Chatroom
        </li>
        {/* Add more menu items as needed */}
      </ul>
    </div>
  );
}
