import { createContext, useContext, useState, useCallback } from 'react';
import * as aiAPI from '../api/ai';

const AIContext = createContext(null);

export function AIProvider({ children }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentMood, setCurrentMood] = useState('calm');

  const withLoading = async (fn) => {
    setIsProcessing(true);
    try {
      return await fn();
    } finally {
      setIsProcessing(false);
    }
  };

  const getSmartReplies = useCallback((messages) => 
    withLoading(() => aiAPI.getSmartReplies(messages)), []);

  const summarizeChat = useCallback((messages) => 
    withLoading(() => aiAPI.summarizeChat(messages)), []);

  const detectMood = useCallback(async (messages) => {
    const mood = await withLoading(() => aiAPI.detectMood(messages));
    if (mood) setCurrentMood(mood);
    return mood;
  }, []);

  const translateMessage = useCallback((text, targetLang) => 
    aiAPI.translateMessage(text, targetLang), []);

  const handleSlashCommand = useCallback((command, args) => 
    withLoading(() => aiAPI.handleSlashCommand(command, args)), []);

  const generateVibeStatus = useCallback((mood) => 
    aiAPI.generateVibeStatus(mood), []);

  return (
    <AIContext.Provider value={{
      isProcessing,
      currentMood,
      getSmartReplies,
      summarizeChat,
      detectMood,
      translateMessage,
      handleSlashCommand,
      generateVibeStatus
    }}>
      {children}
    </AIContext.Provider>
  );
}

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) throw new Error('useAI must be used within AIProvider');
  return context;
};

