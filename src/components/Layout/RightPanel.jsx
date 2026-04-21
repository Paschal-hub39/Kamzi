import { useChat } from '../../contexts/ChatContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useContextAware } from '../../hooks/useContextAware';
import { useMiniApps } from '../../hooks/useMiniApps';
import ContextAwarePanel from '../AI/ContextAwarePanel';
import FileHub from '../Productivity/FileHub';
import SharedTodo from '../Productivity/SharedTodo';
import ChatThemePicker from '../Fun/ChatThemePicker';

export default function RightPanel() {
  const { activeChat } = useChat();
  const { getActiveTheme, themes } = useTheme();
  const { detectedContext, suggestedTools } = useContextAware();
  const { activeMiniApp } = useMiniApps(activeChat?.id);
  
  const theme = getActiveTheme(activeChat?.id);
  const styles = themes[theme] || themes.dark;

  if (!activeChat) {
    return (
      <div className={`h-full ${styles.surface} flex items-center justify-center ${styles.textMuted}`}>
        Select a chat to see details
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${styles.surface} border-l ${styles.border} overflow-y-auto`}>
      {/* Context-Aware Section (KILLER FEATURE) */}
      {detectedContext && (
        <ContextAwarePanel context={detectedContext} tools={suggestedTools} />
      )}

      {/* Chat Info */}
      <div className="p-4 border-b border-gray-700/50">
        <h3 className="font-bold mb-2">Chat Info</h3>
        <div className="space-y-2 text-sm">
          <p className={styles.textMuted}>Created {activeChat.createdAt?.toDate?.().toLocaleDateString()}</p>
          <p className={styles.textMuted}>{activeChat.participants?.length || 0} participants</p>
          {activeChat.isGroup && (
            <p className={styles.textMuted}>Group chat</p>
          )}
        </div>
      </div>

      {/* Mini App Active */}
      {activeMiniApp && (
        <div className="p-4 border-b border-gray-700/50">
          <h3 className="font-bold mb-2">Active App</h3>
          <div className="bg-white/5 rounded-lg p-3">
            {activeMiniApp}
          </div>
        </div>
      )}

      {/* Tools */}
      <div className="flex-1 space-y-4 p-4">
        <FileHub chatId={activeChat.id} />
        <SharedTodo chatId={activeChat.id} />
        <ChatThemePicker chatId={activeChat.id} />
      </div>

      {/* Encryption Status */}
      <div className="p-4 border-t border-gray-700/50">
        <div className="flex items-center gap-2 text-green-400 text-sm">
          <span>🔒</span>
          <span>End-to-end encrypted</span>
        </div>
      </div>
    </div>
  );
}
