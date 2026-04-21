import { useState, useCallback } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export function useEditHistory() {
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleHistory = useCallback(() => {
    setShowHistory(prev => !prev);
  }, []);

  const editMessage = useCallback(async (chatId, messageId, newText) => {
    setLoading(true);
    try {
      const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
      const msgSnap = await getDoc(msgRef);
      
      if (!msgSnap.exists()) throw new Error('Message not found');

      const oldData = msgSnap.data();
      const historyEntry = {
        text: oldData.text,
        editedAt: new Date().toISOString(),
        editedBy: oldData.senderId
      };

      await updateDoc(msgRef, {
        text: newText,
        edited: true,
        editHistory: [...(oldData.editHistory || []), historyEntry],
        lastEditedAt: serverTimestamp()
      });

      return true;
    } catch (err) {
      console.error('Edit failed:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    showHistory,
    toggleHistory,
    editMessage,
    loading
  };
}

