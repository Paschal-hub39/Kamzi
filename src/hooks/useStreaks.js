import { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, getDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';

export function useStreaks() {
  const { user } = useAuth();
  const [streaks, setStreaks] = useState({});
  const [loading, setLoading] = useState(true);

  // Subscribe to streaks
  useEffect(() => {
    if (!user) return;
    
    const unsub = onSnapshot(doc(db, 'streaks', user.uid), (snap) => {
      if (snap.exists()) {
        setStreaks(snap.data().contacts || {});
      }
      setLoading(false);
    });
    
    return () => unsub();
  }, [user]);

  const checkAndUpdateStreak = useCallback(async (contactId) => {
    if (!user) return { streak: 0, maintained: false };

    const streakRef = doc(db, 'streaks', user.uid);
    const snap = await getDoc(streakRef);
    const data = snap.exists() ? snap.data().contacts || {} : {};
    
    const contactStreak = data[contactId] || { count: 0, lastMessageDate: null };
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    let newCount = contactStreak.count;
    let maintained = false;

    if (contactStreak.lastMessageDate === today) {
      // Already messaged today
      maintained = true;
    } else if (contactStreak.lastMessageDate === yesterday) {
      // Continue streak
      newCount += 1;
      maintained = true;
    } else {
      // Streak broken or new
      newCount = 1;
    }

    const updated = {
      ...data,
      [contactId]: {
        count: newCount,
        lastMessageDate: today,
        longestStreak: Math.max(newCount, contactStreak.longestStreak || 0),
        updatedAt: serverTimestamp()
      }
    };

    await setDoc(streakRef, { contacts: updated }, { merge: true });
    setStreaks(updated);
    
    return { streak: newCount, maintained };
  }, [user]);

  const getStreakStatus = useCallback((contactId) => {
    const streak = streaks[contactId];
    if (!streak) return { count: 0, status: 'none' };
    
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (streak.lastMessageDate === today) return { count: streak.count, status: 'active' };
    if (streak.lastMessageDate === yesterday) return { count: streak.count, status: 'at_risk' };
    return { count: 0, status: 'broken' };
  }, [streaks]);

  return {
    streaks,
    loading,
    checkAndUpdateStreak,
    getStreakStatus
  };
}

