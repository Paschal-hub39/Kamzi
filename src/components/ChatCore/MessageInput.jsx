import { useState, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';
import { usePrivacy } from '../../contexts/PrivacyContext';
import { useEncryption } from '../../hooks/useEncryption';
import { useVoiceTranscription } from '../../hooks/useVoiceTranscription';
import { useMiniApps } from '../../hooks/useMiniApps';

export default function MessageInput() {
  const { user } = useAuth();
  const { activeChat, sendMessage, setTyping } = useChat();
  const { getActiveTheme, themes } = useTheme();
  const { handleSlashCommand } = useAI();
  const { blurAllSensitive } = usePrivacy();
  const { encryptMessage } = useEncryption();
  const { isTranscribing, transcript, startTranscription, stopTranscription } = useVoiceTranscription();
  const { launchMiniApp } = useMiniApps(activeChat?.id);
  
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [showMiniApps, setShowMiniApps] = useState(false);
  const [sensitive, setSensitive] = useState(false);
  const [encrypt, setEncrypt] = useState(false);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const theme = getActiveTheme(activeChat?.id);
  const styles = themes[theme] || themes.dark;

  const handleTyping = useCallback(() => {
    setTyping(activeChat?.id, true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(activeChat?.id, false);
    }, 3000);
  }, [activeChat, setTyping]);

  const handleSend = async () => {
    if (!text.trim() || !activeChat) return;

    // Slash commands
    if (text.startsWith('/')) {
      const [command, ...argsArr] = text.split(' ');
      const args = argsArr.join(' ');
      const response = await handleSlashCommand(command, args);
      
      await sendMessage(activeChat.id, {
        text: response,
        isSystem: true,
        command: command
      });
      setText('');
      return;
    }

    let messageData = {
      text: text.trim(),
      sensitive: sensitive || blurAllSensitive,
      encrypted: encrypt
    };

    // Encrypt if enabled
    if (encrypt) {
      const otherUser = activeChat.participants.find(p => p !== user.uid);
      const encrypted = await encryptMessage(text.trim(), otherUser);
      if (encrypted) {
        messageData.encryptedData = encrypted;
        messageData.text = '🔐 Encrypted message';
      }
    }

    await sendMessage(activeChat.id, messageData);
    setText('');
    setSensitive(false);
    setEncrypt(false);
    setShowCommands(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const slashCommands = [
    { cmd: '/plan', desc: 'Plan an event', icon: '📅' },
    { cmd: '/study', desc: 'Study mode', icon: '📚' },
    { cmd: '/trip', desc: 'Trip planner', icon: '✈️' },
    { cmd: '/budget', desc: 'Budget tool', icon: '💰' },
    { cmd: '/recipe', desc: 'Find recipe', icon: '🍳' }
  ];

  const miniAppOptions = [
    { type: 'poll', name: 'Poll', icon: '📊' },
    { type: 'form', name: 'Form', icon: '📝' },
    { type: 'countdown', name: 'Countdown', icon: '⏳' }
  ];

  if (!activeChat) return null;

  return (
    <div className={`${styles.surface} border-t ${styles.border} px-4 py-3`}>
      {/* Slash Command Suggestions */}
      {text.startsWith('/') && showCommands && (
        <div className="mb-2 bg-gray-800 rounded-lg overflow-hidden">
          {slashCommands.filter(c => c.cmd.startsWith(text.split(' ')[0])).map(cmd => (
            <button
              key={cmd.cmd}
              onClick={() => { setText(cmd.cmd + ' '); inputRef.current?.focus(); }}
              className="w-full px-4 py-2 flex items-center gap-3 hover:bg-white/5 text-left"
            >
              <span>{cmd.icon}</span>
              <span className="font-mono text-violet-400">{cmd.cmd}</span>
              <span className="text-sm text-gray-400">{cmd.desc}</span>
            </button>
          ))}
        </div>
      )}

      {/* Mini Apps Drawer */}
      {showMiniApps && (
        <div className="mb-2 flex gap-2">
          {miniAppOptions.map(app => (
            <button
              key={app.type}
              onClick={() => { launchMiniApp(app.type); setShowMiniApps(false); }}
              className="px-3 py-2 bg-white/10 rounded-lg flex items-center gap-2 hover:bg-white/20"
            >
              <span>{app.icon}</span>
              <span className="text-sm">{app.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Attach */}
        <button 
          onClick={() => setShowMiniApps(!showMiniApps)}
          className="p-2 rounded-full hover:bg-white/10 flex-shrink-0"
        >
          📎
        </button>

        {/* Input */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => { setText(e.target.value); handleTyping(); }}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            rows={1}
            className={`w-full px-4 py-2 rounded-2xl ${styles.input} resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 max-h-32`}
            style={{ minHeight: '40px' }}
          />
          
          {/* Quick toggles */}
          <div className="absolute right-2 bottom-2 flex gap-1">
            <button 
              onClick={() => setSensitive(!sensitive)}
              className={`text-xs px-2 py-1 rounded-full ${sensitive ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-gray-500'}`}
            >
              🔒
            </button>
            <button 
              onClick={() => setEncrypt(!encrypt)}
              className={`text-xs px-2 py-1 rounded-full ${encrypt ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-500'}`}
            >
              🔐
            </button>
          </div>
        </div>

        {/* Voice / Send */}
        {text.trim() ? (
          <button 
            onClick={handleSend}
            className="p-3 rounded-full bg-violet-600 hover:bg-violet-500 flex-shrink-0"
          >
            ➤
          </button>
        ) : (
          <button 
            onMouseDown={() => { setIsRecording(true); startTranscription(); }}
            onMouseUp={() => { setIsRecording(false); stopTranscription(); }}
            onTouchStart={() => { setIsRecording(true); startTranscription(); }}
            onTouchEnd={() => { setIsRecording(false); stopTranscription(); }}
            className={`p-3 rounded-full flex-shrink-0 ${isRecording ? 'bg-red-600' : 'bg-white/10 hover:bg-white/20'}`}
          >
            🎙️
          </button>
        )}
      </div>

      {/* Voice transcript preview */}
      {transcript && (
        <div className="mt-2 text-sm text-gray-400 flex items-center gap-2">
          <span>🎤 {transcript}</span>
          <button onClick={() => { setText(transcript); }} className="text-violet-400">Use</button>
        </div>
      )}
    </div>
  );
}
