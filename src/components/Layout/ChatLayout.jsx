import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { useUI } from '../../contexts/UIContext';
import { useTheme } from '../../contexts/ThemeContext';
import Sidebar from './Sidebar';
import ChatWindow from '../ChatCore/ChatWindow';
import RightPanel from './RightPanel';
import MessageInput from '../ChatCore/MessageInput';
import MobileNav from './MobileNav';
import NotificationToast from '../UI/NotificationToast';
import ScreenshotOverlay from '../Privacy/ScreenshotOverlay';

export default function ChatLayout() {
  const { user } = useAuth();
  const { activeChat } = useChat();
  const { sidebarOpen, rightPanelOpen, mobileView, theme } = useUI();
  const { getActiveTheme, themes } = useTheme();
  const currentTheme = activeChat ? getActiveTheme(activeChat.id) : theme;
  const themeStyles = themes[currentTheme] || themes.dark;

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (isMobile) {
    return (
      <div className={`h-screen flex flex-col ${themeStyles.bg} ${themeStyles.text} overflow-hidden`}>
        <NotificationToast />
        <ScreenshotOverlay />
        
        {mobileView === 'chats' && (
          <div className="flex-1 overflow-hidden">
            <Sidebar mobile />
          </div>
        )}
        
        {mobileView === 'chat' && activeChat && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <ChatHeader mobile />
            <div className="flex-1 overflow-hidden">
              <ChatWindow />
            </div>
            <MessageInput />
          </div>
        )}
        
        <MobileNav />
      </div>
    );
  }

  return (
    <div className={`h-screen flex ${themeStyles.bg} ${themeStyles.text} overflow-hidden`}>
      <NotificationToast />
      <ScreenshotOverlay />
      
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 flex-shrink-0 overflow-hidden`}>
        <Sidebar />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeChat ? (
          <>
            <ChatHeader />
            <div className="flex-1 overflow-hidden">
              <ChatWindow />
            </div>
            <MessageInput />
          </>
        ) : (
          <EmptyState themeStyles={themeStyles} />
        )}
      </div>

      {/* Right Panel */}
      <div className={`${rightPanelOpen ? 'w-80' : 'w-0'} transition-all duration-300 flex-shrink-0 overflow-hidden`}>
        <RightPanel />
      </div>
    </div>
  );
}

function ChatHeader({ mobile }) {
  const { activeChat, setActiveChat, typingUsers } = useChat();
  const { setMobileView, setRightPanelOpen, rightPanelOpen } = useUI();
  const { getActiveTheme, themes } = useTheme();
  const theme = getActiveTheme(activeChat?.id);
  const styles = themes[theme] || themes.dark;

  if (!activeChat) return null;

  const otherUser = activeChat.participants?.find(p => p !== user?.uid);
  const isTyping = typingUsers[otherUser];

  return (
    <div className={`${styles.surface} border-b ${styles.border} px-4 py-3 flex items-center justify-between`}>
      <div className="flex items-center gap-3">
        {mobile && (
          <button 
            onClick={() => setMobileView('chats')}
            className="p-2 rounded-full hover:bg-white/10"
          >
            ←
          </button>
        )}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-lg font-bold">
            {activeChat.groupName?.[0] || otherUser?.[0] || '?'}
          </div>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900" />
        </div>
        <div>
          <h3 className="font-semibold">{activeChat.groupName || 'Chat'}</h3>
          <p className={`text-xs ${styles.textMuted}`}>
            {isTyping ? 'typing...' : 'online'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          ⋮
        </button>
      </div>
    </div>
  );
}

function EmptyState({ themeStyles }) {
  const { setMobileView } = useUI();
  
  return (
    <div className={`flex-1 flex flex-col items-center justify-center ${themeStyles.bg}`}>
      <div className="text-6xl mb-4">💬</div>
      <h2 className="text-2xl font-bold mb-2">Welcome to Kamzi</h2>
      <p className={`${themeStyles.textMuted} text-center max-w-md mb-6`}>
        Select a chat or start a new conversation to begin messaging with end-to-end encryption.
      </p>
      <button 
        onClick={() => setMobileView('chats')}
        className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full font-medium hover:opacity-90 transition-opacity"
      >
        Start Chatting
      </button>
    </div>
  );
}
