import { useUI } from '../../contexts/UIContext';
import { useChat } from '../../contexts/ChatContext';

export default function MobileNav() {
  const { mobileView, setMobileView } = useUI();
  const { activeChat } = useChat();

  const navItems = [
    { id: 'chats', icon: '💬', label: 'Chats' },
    { id: 'voice', icon: '🎙️', label: 'Voice' },
    { id: 'temp', icon: '⏳', label: 'Temp' },
    { id: 'profile', icon: '👤', label: 'Me' }
  ];

  return (
    <div className="bg-gray-900 border-t border-gray-800 flex justify-around items-center h-16 px-2">
      {navItems.map(item => (
        <button
          key={item.id}
          onClick={() => setMobileView(item.id)}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg ${
            mobileView === item.id ? 'text-violet-400' : 'text-gray-500'
          }`}
        >
          <span className="text-xl">{item.icon}</span>
          <span className="text-xs">{item.label}</span>
          {item.id === 'chats' && activeChat && (
            <span className="absolute top-2 right-20 w-2 h-2 bg-violet-500 rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}
