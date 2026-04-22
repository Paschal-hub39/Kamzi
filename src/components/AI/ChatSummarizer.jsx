import { useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAI } from '../../contexts/AIContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function ChatSummarizer() {
  const { messages, activeChat } = useChat();
  const { summarizeChat, isProcessing } = useAI();
  const { getActiveTheme, themes } = useTheme();
  const [summary, setSummary] = useState('');
  const [showModal, setShowModal] = useState(false);

  const theme = getActiveTheme(activeChat?.id);
  const styles = themes[theme] || themes.dark;

  const handleSummarize = async () => {
    if (!messages.length) return;
    const last50 = messages.slice(-50);
    const result = await summarizeChat(last50);
    setSummary(result || 'No summary available.');
    setShowModal(true);
  };

  return (
    <>
      <button
        onClick={handleSummarize}
        disabled={isProcessing || messages.length < 5}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
          messages.length < 5 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:bg-white/10'
        } ${styles.textMuted}`}
        title="Summarize last 50 messages"
      >
        <span>📝</span>
        <span>Summarize</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className={`${styles.surface} rounded-2xl max-w-lg w-full p-6 border ${styles.border} shadow-2xl`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span>🧠</span>
                Chat Summary
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="prose prose-invert max-w-none">
              {isProcessing ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {summary.split('\n').map((line, i) => (
                    <p key={i} className="mb-2">{line}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between text-xs text-gray-500">
              <span>Based on last {Math.min(messages.length, 50)} messages</span>
              <button 
                onClick={() => navigator.clipboard.writeText(summary)}
                className="text-violet-400 hover:text-violet-300"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
