import { useState, useEffect, useCallback } from 'react';
import { useChat } from '../contexts/ChatContext';

const CONTEXT_PATTERNS = {
  trip: {
    keywords: ['flight', 'hotel', 'travel', 'vacation', 'booking', 'passport', 'airport', 'trip', 'destination', 'itinerary'],
    tools: [
      { icon: '🗺️', name: 'Maps', action: 'open_maps' },
      { icon: '💰', name: 'Budget Planner', action: 'open_budget' },
      { icon: '📋', name: 'Itinerary', action: 'open_itinerary' },
      { icon: '🏨', name: 'Hotels', action: 'search_hotels' }
    ],
    color: 'from-blue-500 to-cyan-500',
    suggestion: 'Planning a trip? I can help with maps, budget, and itinerary!'
  },
  argument: {
    keywords: ['wrong', 'never', 'always', 'hate', 'angry', 'mad', 'stupid', 'ridiculous', 'whatever', 'annoying', 'frustrated'],
    tools: [
      { icon: '😤', name: 'Cool-Down', action: 'start_cooldown' },
      { icon: '🧘', name: 'Breathe', action: 'breathing_exercise' },
      { icon: '🗣️', name: 'Mediate', action: 'mediator_bot' },
      { icon: '⏸️', name: 'Pause', action: 'pause_chat' }
    ],
    color: 'from-red-500 to-orange-500',
    suggestion: 'This conversation is getting heated. Want to cool down?'
  },
  study: {
    keywords: ['exam', 'homework', 'study', 'test', 'quiz', 'assignment', 'lecture', 'notes', 'revision', 'textbook'],
    tools: [
      { icon: '📝', name: 'Shared Notes', action: 'open_notes' },
      { icon: '❓', name: 'Quiz Mode', action: 'start_quiz' },
      { icon: '⏱️', name: 'Pomodoro', action: 'start_pomodoro' },
      { icon: '📚', name: 'Flashcards', action: 'open_flashcards' }
    ],
    color: 'from-violet-500 to-purple-500',
    suggestion: 'Study session detected! Let\'s get productive.'
  },
  planning: {
    keywords: ['plan', 'schedule', 'meet', 'event', 'party', 'dinner', 'weekend', 'tomorrow', 'tonight', 'gathering'],
    tools: [
      { icon: '📅', name: 'Calendar', action: 'open_calendar' },
      { icon: '✅', name: 'Tasks', action: 'open_tasks' },
      { icon: '📍', name: 'Location', action: 'share_location' },
      { icon: '⏰', name: 'Reminder', action: 'set_reminder' }
    ],
    color: 'from-green-500 to-emerald-500',
    suggestion: 'Let\'s get this event planned perfectly!'
  },
  romantic: {
    keywords: ['love', 'miss you', 'date', 'dinner', 'movie', 'cute', 'beautiful', 'heart', 'crush', 'relationship'],
    tools: [
      { icon: '💕', name: 'Mood Music', action: 'play_music' },
      { icon: '🎬', name: 'Movies', action: 'suggest_movies' },
      { icon: '🍽️', name: 'Restaurants', action: 'find_restaurants' },
      { icon: '🌹', name: 'Ideas', action: 'surprise_ideas' }
    ],
    color: 'from-pink-500 to-rose-500',
    suggestion: 'Feeling the love? Let me help set the mood!'
  },
  business: {
    keywords: ['invoice', 'payment', 'client', 'project', 'deadline', 'meeting', 'contract', 'proposal'],
    tools: [
      { icon: '📄', name: 'Invoice', action: 'create_invoice' },
      { icon: '📊', name: 'Report', action: 'generate_report' },
      { icon: '🤝', name: 'Contract', action: 'draft_contract' },
      { icon: '📅', name: 'Schedule', action: 'schedule_meeting' }
    ],
    color: 'from-slate-500 to-gray-500',
    suggestion: 'Business mode activated. Let\'s close this deal!'
  }
};

export function useContextAware() {
  const { messages } = useChat();
  const [detectedContext, setDetectedContext] = useState(null);
  const [suggestedTools, setSuggestedTools] = useState([]);
  const [contextScore, setContextScore] = useState(0);

  useEffect(() => {
    if (!messages.length) {
      setDetectedContext(null);
      setSuggestedTools([]);
      setContextScore(0);
      return;
    }

    const recentText = messages.slice(-15).map(m => m.text?.toLowerCase() || '').join(' ');
    let bestMatch = null;
    let highestScore = 0;

    Object.entries(CONTEXT_PATTERNS).forEach(([context, data]) => {
      const score = data.keywords.reduce((acc, keyword) => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        const matches = (recentText.match(regex) || []).length;
        return acc + matches;
      }, 0);

      if (score > highestScore && score >= 2) {
        highestScore = score;
        bestMatch = { type: context, ...data };
      }
    });

    if (bestMatch && bestMatch.type !== detectedContext?.type) {
      setDetectedContext(bestMatch);
      setSuggestedTools(bestMatch.tools);
      setContextScore(highestScore);
    } else if (!bestMatch) {
      setDetectedContext(null);
      setSuggestedTools([]);
      setContextScore(0);
    }
  }, [messages, detectedContext]);

  const dismissContext = useCallback(() => {
    setDetectedContext(null);
    setSuggestedTools([]);
  }, []);

  const activateTool = useCallback((toolAction) => {
    console.log('Activating tool:', toolAction);
    // Tool activation logic handled by parent component
    return toolAction;
  }, []);

  return {
    detectedContext,
    suggestedTools,
    contextScore,
    dismissContext,
    activateTool,
    hasContext: !!detectedContext
  };
}

