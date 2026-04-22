import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { useAI } from '../../contexts/AIContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function SmartReplyBar() {
  const { user } = useAuth();
  const { messages, activeChat, sendMessage } = useChat();
  const { getSmartReplies, isProcessing } = useAI();
  const { getActiveTheme, themes } = useTheme();
  const [suggestions, setSuggestions] = useState([]);
  const [showBar, setShowBar] = useState(false);

  const theme = getActiveTheme(activeChat?.id);
  const styles = themes[theme] || themes.dark;

  useEffect(() => {
    if (!messages.length || !activeChat) {
      setSuggestions([]);
      return;
    }

    const lastMsg = messages[messages.length - 1];
    if (lastMsg.senderId === user?.uid) {
      setSuggestions([]);
      return;
    }

    const recentMessages = messages.slice(-10);
    const timer = setTimeout(async () => {
      const replies = await getSmartReplies(recentMessages);
      if (replies.length > 0) {
        setSuggestions(replies);
        setShowBar(true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [messages, activeChat, user, getSmartReplies]);

  const handleSend = async (text) => {
    await sendMessage(activeChat.id, { text });
    setShowBar(false);
  };

  if (!showBar || !suggestions.length) return null;

  return (
    <div className={`px-4 py-2 flex gap-2 overflow-x-auto ${styles.bg}`}>
      {isProcessing ? (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <span>AI thinking...</span>
        </div>
      ) : (
        suggestions.map((reply, index) => (
          <button
            key={index}
            onClick={() => handleSend(reply)}
            className="px-4 py-2 rounded-full bg-white/5 hover:bg-violet-600/20 border border-white/10 hover:border-violet-500/50 text-sm whitespace-nowrap transition-all"
          >
            {reply}
          </button>
        ))
      )}
      <button 
        onClick={() => setShowBar(false)}
        className="text-xs text-gray-500 hover:text-white px-2"
      >
        ✕
      </button>
    </div>
  );
}
