import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useVibeStatus } from '../../hooks/useVibeStatus';
import { useAI } from '../../contexts/AIContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function VibeStatusComposer() {
  const { user } = useAuth();
  const { myVibe, presetVibes, setPresetVibe, generateAIVibe, clearVibe } = useVibeStatus();
  const { currentMood } = useAI();
  const { getActiveTheme, themes } = useTheme();
  const [showComposer, setShowComposer] = useState(false);

  const theme = getActiveTheme();
  const styles = themes[theme] || themes.dark;

  return (
    <div className="relative">
      <button
        onClick={() => setShowComposer(!showComposer)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full ${
          myVibe ? `bg-gradient-to-r ${myVibe.color} text-white` : 'bg-white/10 text-gray-400'
        } hover:opacity-90 transition-all`}
      >
        <span>{myVibe?.emoji || '✨'}</span>
        <span className="text-sm font-medium">{myVibe?.text || 'Set Vibe'}</span>
      </button>

      {showComposer && (
        <div className={`absolute top-full mt-2 right-0 ${styles.surface} rounded-2xl shadow-2xl p-4 w-72 border ${styles.border} z-50`}>
          <h4 className="font-semibold mb-3">What's your vibe?</h4>
          
          {/* Preset vibes */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {presetVibes.map((vibe, index) => (
              <button
                key={index}
                onClick={() => { setPresetVibe(index); setShowComposer(false); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-white/5 ${
                  myVibe?.text === vibe.text ? 'bg-white/10 border border-violet-500/50' : ''
                }`}
              >
                <span>{vibe.emoji}</span>
                <span>{vibe.text}</span>
              </button>
            ))}
          </div>

          {/* AI Generate */}
          <button
            onClick={async () => {
              await generateAIVibe(currentMood);
              setShowComposer(false);
            }}
            className="w-full py-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-sm font-medium hover:opacity-90 mb-2"
          >
            ✨ AI Generate from Mood
          </button>

          {/* Clear */}
          {myVibe && (
            <button
              onClick={() => { clearVibe(); setShowComposer(false); }}
              className="w-full py-2 rounded-lg bg-white/5 text-sm text-gray-400 hover:bg-white/10"
            >
              Clear Vibe
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function VibeStatusDisplay({ userId, vibe }) {
  if (!vibe) return null;

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${vibe.color} text-white text-xs`}>
      <span>{vibe.emoji}</span>
      <span className="font-medium">{vibe.text}</span>
    </div>
  );
}

