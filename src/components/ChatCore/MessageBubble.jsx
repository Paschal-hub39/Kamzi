import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { useTheme } from '../../contexts/ThemeContext';
import { usePrivacy } from '../../contexts/PrivacyContext';
import { useEditHistory } from '../../hooks/useEditHistory';
import { useEncryption } from '../../hooks/useEncryption';
import ReactionPicker from './ReactionPicker';
import EditHistoryModal from './EditHistoryModal';

export default function MessageBubble({ message, isMe, showAvatar, blurSensitive }) {
  const { user } = useAuth();
  const { addReaction, activeChat } = useChat();
  const { getActiveTheme, themes } = useTheme();
  const { blurAllSensitive, selfDestructTimers } = usePrivacy();
  const { showHistory, toggleHistory, editMessage } = useEditHistory();
  const { decryptMessage } = useEncryption();
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [decryptedText, setDecryptedText] = useState(null);
  const [showReactions, setShowReactions] = useState(false);
  const [blurred, setBlurred] = useState(message.blurred || blurAllSensitive);

  const theme = getActiveTheme(activeChat?.id);
  const styles = themes[theme] || themes.dark;

  // Decrypt if encrypted
  useState(() => {
    if (message.encrypted && !decryptedText) {
      decryptMessage(message.encryptedData, message.senderId).then(setDecryptedText);
    }
  });

  const displayText = decryptedText || message.text;
  const isDeleted = message.deleted;
  const isSelfDestructing = selfDestructTimers[`${activeChat?.id}_${message.id}`];
  const hasReactions = message.reactions && Object.keys(message.reactions).length > 0;

  const handleEdit = async () => {
    if (!editText.trim() || editText === message.text) {
      setIsEditing(false);
      return;
    }
    await editMessage(activeChat.id, message.id, editText);
    setIsEditing(false);
  };

  const handleReaction = (emoji) => {
    addReaction(activeChat.id, message.id, emoji);
    setShowReactions(false);
  };

  if (isDeleted) {
    return (
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} opacity-50`}>
        <div className={`px-4 py-2 rounded-2xl max-w-[70%] ${styles.bubbleOther} text-gray-500 text-sm italic`}>
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar for others */}
      {!isMe && showAvatar && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-sm font-bold mr-2 flex-shrink-0 self-end">
          {message.senderName?.[0] || '?'}
        </div>
      )}
      {!isMe && !showAvatar && <div className="w-8 mr-2 flex-shrink-0" />}

      <div className="relative max-w-[70%]">
        {/* Message Content */}
        <div 
          className={`px-4 py-2 rounded-2xl ${
            isMe 
              ? `${styles.bubbleMe} rounded-br-sm` 
              : `${styles.bubbleOther} rounded-bl-sm`
          } ${blurred ? 'blur-sm cursor-pointer select-none' : ''}`}
          onClick={() => blurred && setBlurred(false)}
        >
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
                className="bg-transparent border-b border-white/50 focus:outline-none text-white"
                autoFocus
              />
              <button onClick={handleEdit} className="text-green-400">✓</button>
              <button onClick={() => setIsEditing(false)} className="text-red-400">✕</button>
            </div>
          ) : (
            <>
              {blurred ? (
                <div className="flex items-center gap-2 text-gray-400">
                  <span>🔒</span>
                  <span className="text-sm">Tap to reveal</span>
                </div>
              ) : (
                <>
                  <p className="text-sm leading-relaxed">{displayText}</p>
                  {message.edited && <span className="text-xs opacity-50 ml-1">(edited)</span>}
                </>
              )}
            </>
          )}

          {/* Self-destruct timer */}
          {message.selfDestruct && !message.selfDestructed && (
            <div className="flex items-center gap-1 mt-1 text-xs text-yellow-400">
              <span>⏳</span>
              <span>{message.selfDestruct}s</span>
            </div>
          )}

          {/* Voice note */}
          {message.voiceNote && (
            <div className="flex items-center gap-2 mt-1">
              <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">▶️</button>
              <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white/60 w-1/3" />
              </div>
              <span className="text-xs">{message.voiceDuration || '0:00'}</span>
            </div>
          )}

          {/* Transcription */}
          {message.transcription && (
            <p className="text-xs text-white/70 mt-1 italic border-l-2 border-white/20 pl-2">
              "{message.transcription}"
            </p>
          )}
        </div>

        {/* Reactions */}
        {hasReactions && (
          <div className={`flex gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
            {Object.entries(message.reactions).map(([uid, emoji]) => (
              <span key={uid} className="text-sm bg-white/10 rounded-full px-1.5 py-0.5">
                {emoji}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        {showActions && !isEditing && (
          <div className={`absolute ${isMe ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} top-0 flex flex-col gap-1 p-1`}>
            <button 
              onClick={() => setShowReactions(true)}
              className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-sm shadow-lg"
            >
              😊
            </button>
            {isMe && (
              <>
                <button 
                  onClick={() => { setEditText(message.text); setIsEditing(true); }}
                  className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-sm shadow-lg"
                >
                  ✏️
                </button>
                <button 
                  onClick={toggleHistory}
                  className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-sm shadow-lg"
                >
                  📜
                </button>
              </>
            )}
            <button 
              onClick={() => { /* Reply logic */ }}
              className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-sm shadow-lg"
            >
              ↩️
            </button>
          </div>
        )}

        {/* Reaction Picker */}
        {showReactions && (
          <div className="absolute z-50 top-full mt-2 left-1/2 -translate-x-1/2">
            <ReactionPicker onSelect={handleReaction} onClose={() => setShowReactions(false)} />
          </div>
        )}

        {/* Edit History Modal */}
        {showHistory && message.editHistory?.length > 0 && (
          <EditHistoryModal history={message.editHistory} onClose={toggleHistory} />
        )}

        {/* Timestamp */}
        <div className={`text-xs text-gray-500 mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
          {message.timestamp?.toLocaleTimeString?.([], { hour: '2-digit', minute: '2-digit' })}
          {isMe && (
            <span className="ml-1">
              {message.read ? '✓✓' : message.delivered ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
