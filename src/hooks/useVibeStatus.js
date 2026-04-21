import { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';

const PRESET_VIBES = [
  { text: 'Chillin', emoji: '😎', color: 'from-blue-500 to-cyan-500' },
  { text: 'In the zone', emoji: '🎯', color: 'from-violet-500 to-purple-500' },
  { text: 'Vibing', emoji: '🎵', color: 'from-pink-500 to-rose-500' },
  { text: 'Focused', emoji: '🧠', color: 'from-emerald-500 to-teal-500' },
  { text: 'Energized', emoji: '⚡', color: 'from-yellow-500 to-orange-500' },
  { text: 'Mysterious', emoji: '🌙', color: 'from-indigo-500 to-blue-600' },
  { text: 'Feeling lucky', emoji: '🍀', color: 'from-green-500 to-emerald-600' },
  { text: 'On fire', emoji: '🔥', color: 'from-red-500 to-orange-600' }
];

export function useVibeStatus() {
  const { user } = useAuth();
  const [myVibe, setMyVibe] = useState(null);
  const [friendVibes, setFriendVibes] = useState({});

  // Subscribe to own vibe
  useEffect(() => {
    if (!user) return;
    
    const unsub = onSnapshot(doc(db, 'vibeStatus', user.uid), (snap) => {
      if (snap.exists()) setMyVibe(snap.data());
    });
    
    return () => unsub();
  }, [user]);

  const setVibe = useCallback(async (vibeData) => {
    if (!user) return;
    
    const vibe = {
      ...vibeData,
      updatedAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h expiry
    };
    
    await setDoc(doc(db, 'vibeStatus', user.uid), vibe, { merge: true });
    setMyVibe(vibe);
  }, [user]);

  const setPresetVibe = useCallback((index) => {
    const preset = PRESET_VIBES[index];
    if (preset) setVibe(preset);
  }, [setVibe]);

  const generateAIVibe = useCallback(async (mood) => {
    // In production: call AI API
    const aiVibes = {
      calm: { text: 'Peaceful', emoji: '🧘', color: 'from-blue-400 to-indigo-400' },
      excited: { text: 'Hyped', emoji: '🤩', color: 'from-yellow-400 to-pink-500' },
      heated: { text: 'Fired up', emoji: '😤', color: 'from-red-500 to-orange-500' },
      sad: { text: 'Reflective', emoji: '🌧️', color: 'from-gray-500 to-blue-500' },
      romantic: { text: 'Dreamy', emoji: '💫', color: 'from-pink-400 to-rose-400' },
      professional: { text: 'Grinding', emoji: '💼', color: 'from-slate-500 to-gray-500' }
    };
    
    const vibe = aiVibes[mood] || aiVibes.calm;
    setVibe(vibe);
    return vibe;
  }, [setVibe]);

  const subscribeToFriendVibe = useCallback((friendId) => {
    const unsub = onSnapshot(doc(db, 'vibeStatus', friendId), (snap) => {
      if (snap.exists()) {
        setFriendVibes(prev => ({
          ...prev,
          [friendId]: snap.data()
        }));
      }
    });
    return unsub;
  }, []);

  const clearVibe = useCallback(async () => {
    if (!user) return;
    await setDoc(doc(db, 'vibeStatus', user.uid), {
      text: '',
      emoji: '',
      color: '',
      cleared: true,
      updatedAt: serverTimestamp()
    });
    setMyVibe(null);
  }, [user]);

  return {
    myVibe,
    friendVibes,
    presetVibes: PRESET_VIBES,
    setVibe,
    setPresetVibe,
    generateAIVibe,
    subscribeToFriendVibe,
    clearVibe
  };
}

