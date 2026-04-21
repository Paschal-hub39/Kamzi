import { useState, useEffect, useCallback } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export function useSelfDestruct() {
  const [activeTimers, setActiveTimers] = useState({});

  const setSelfDestruct = useCallback((chatId, messageId, seconds) => {
    const timerId = `${chatId}_${messageId}`;
    
    setActiveTimers(prev => ({
      ...prev,
      [timerId]: { seconds, startTime: Date.now(), chatId, messageId }
    }));

    const timeout = setTimeout(async () => {
      try {
        await updateDoc(
          doc(db, 'chats', chatId, 'messages', messageId),
          {
            deleted: true,
            text: '⌛ This message self-destructed',
            selfDestructed: true,
            destructedAt: serverTimestamp()
          }
        );
        
        setActiveTimers(prev => {
          const next = { ...prev };
          delete next[timerId];
          return next;
        });
      } catch (err) {
        console.error('Self-destruct failed:', err);
      }
    }, seconds * 1000);

    return () => clearTimeout(timeout);
  }, []);

  const getRemainingTime = useCallback((chatId, messageId) => {
    const timer = activeTimers[`${chatId}_${messageId}`];
    if (!timer) return 0;
    
    const elapsed = (Date.now() - timer.startTime) / 1000;
    return Math.max(0, timer.seconds - elapsed);
  }, [activeTimers]);

  return {
    activeTimers,
    setSelfDestruct,
    getRemainingTime,
    isSelfDestructing: (chatId, messageId) => !!activeTimers[`${chatId}_${messageId}`]
  };
}
