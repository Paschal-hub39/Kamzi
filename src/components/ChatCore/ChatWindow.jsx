import { useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { useTheme } from '../../contexts/ThemeContext';
import { usePrivacy } from '../../contexts/PrivacyContext';
import { useContextAware } from '../../hooks/useContextAware';
import MessageBubble from './MessageBubble';
import MoodIndicator from '../AI/MoodIndicator';
import SmartReplyBar from '../AI/SmartReplyBar';
import ContextAwareBanner from '../AI/ContextAwareBanner';

export default function ChatWindow() {
  const { user } = useAuth();
  const { messages, activeChat, typingUsers } = useChat();
  const { getActiveTheme, themes } = useTheme();
  const { blurAllSensitive } = usePrivacy();
  const { detectedContext } = useContextAware();
  const bottomRef = useRef(null);

  const theme = getActiveTheme(activeChat?.id);
  const styles = themes[theme] || themes.dark;

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const otherTyping = Object.entries(typingUsers).filter(([uid, typing]) => 
    uid !== user?.uid && typing
  );

  return (
    <div className={`flex-1 overflow-y-auto px-4 py-4 space-y-2 ${styles.bg}`}>
      {/* Context-Aware Banner */}
      {detectedContext && <ContextAwareBanner />}

      {/* Date separator */}
      <div className="flex justify-center my-4">
        <span className={`text-xs ${styles.textMuted} bg-white/5 px-3 py-1 rounded-full`}>
          Today
        </span>
      </div>

      {/* Messages */}
      {messages.map((msg, index) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isMe={msg.senderId === user?.uid}
          showAvatar={index === 0 || messages[index - 1]?.senderId !== msg.senderId}
          blurSensitive={blurAllSensitive}
        />
      ))}

      {/* Typing Indicator */}
      {otherTyping.length > 0 && (
        <div className="flex items-center gap-2 text-gray-500 text-sm ml-12">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span>typing...</span>
        </div>
      )}

      {/* Mood Detection */}
      <MoodIndicator />

      {/* Smart Reply Suggestions */}
      <SmartReplyBar />

      <div ref={bottomRef} />
    </div>
  );
}
