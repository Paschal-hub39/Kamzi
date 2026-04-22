import { useEffect, useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAI } from '../../contexts/AIContext';

const MOOD_CONFIG = {
  calm: { emoji: '😌', color: 'bg-blue-500', label: 'Calm', gradient: 'from-blue-500 to-cyan-500' },
  excited: { emoji: '🤩', color: 'bg-yellow-500', label: 'Excited', gradient: 'from-yellow-500 to-orange-500' },
  heated: { emoji: '😤', color: 'bg-red-500', label: 'Getting Heated', gradient: 'from-red-500 to-orange-600' },
  sad: { emoji: '😢', color: 'bg-indigo-500', label: 'Somber', gradient: 'from-indigo-500 to-blue-600' },
  romantic: { emoji: '🥰', color: 'bg-pink-500', label: 'Romantic', gradient: 'from-pink-500 to-rose-500' },
  professional: { emoji: '💼', color: 'bg-slate-500', label: 'Professional', gradient: 'from-slate-500 to-gray-500' }
};

export default function MoodIndicator() {
  const { messages } = useChat();
  const { detectMood, currentMood } = useAI();
  const [showIndicator, setShowIndicator] = useState(false);
  const [moodHistory, setMoodHistory] = useState([]);

  useEffect(() => {
    if (messages.length < 3) {
      setShowIndicator(false);
      return;
    }

    const recent = messages.slice(-10);
    const timer = setTimeout(async () => {
      const mood = await detectMood(recent);
      if (mood && mood !== 'calm') {
        setShowIndicator(true);
        setMoodHistory(prev => [...prev.slice(-4), { mood, time: Date.now() }]);
        
        // Auto-hide after 10s
        setTimeout(() => setShowIndicator(false), 10000);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [messages, detectMood]);

  const config = MOOD_CONFIG[currentMood] || MOOD_CONFIG.calm;

  if (!showIndicator) return null;

  return (
    <div className="flex justify-center my-2">
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${config.gradient} text-white text-sm shadow-lg animate-pulse`}>
        <span className="text-lg">{config.emoji}</span>
        <span className="font-medium">{config.label}</span>
        
        {/* Mood trend dots */}
        <div className="flex gap-1 ml-2">
          {moodHistory.map((h, i) => (
            <span 
              key={i} 
              className={`w-2 h-2 rounded-full ${MOOD_CONFIG[h.mood]?.color || 'bg-gray-500'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
