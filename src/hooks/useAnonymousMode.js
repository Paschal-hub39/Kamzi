import { useState, useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const ANONYMOUS_NAMES = [
  'Shadow', 'Ghost', 'Phantom', 'Whisper', 'Echo',
  'Cipher', 'Nova', 'Vortex', 'Nebula', 'Quasar',
  'Raven', 'Wraith', 'Specter', 'Enigma', 'Mirage'
];

const ANONYMOUS_AVATARS = [
  '🎭', '👻', '🦊', '🐺', '🦉',
  '🐍', '🦋', '🐙', '🦄', '🐉',
  '🌙', '⭐', '🔥', '💎', '🌊'
];

export function useAnonymousMode() {
  const [anonymousId, setAnonymousId] = useState(null);

  const generateAnonymousIdentity = useCallback(() => {
    const name = ANONYMOUS_NAMES[Math.floor(Math.random() * ANONYMOUS_NAMES.length)];
    const avatar = ANONYMOUS_AVATARS[Math.floor(Math.random() * ANONYMOUS_AVATARS.length)];
    const id = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    const identity = { id, name, avatar, realUser: null };
    setAnonymousId(identity);
    return identity;
  }, []);

  const enableAnonymousInGroup = useCallback(async (chatId, userId) => {
    const identity = generateAnonymousIdentity();
    identity.realUser = userId; // Store mapping securely server-side in production
    
    await updateDoc(doc(db, 'chats', chatId), {
      [`anonymousUsers.${userId}`]: identity
    });
    
    return identity;
  }, [generateAnonymousIdentity]);

  const getAnonymousDisplay = useCallback((chatId, userId, anonymousMap) => {
    if (!anonymousMap || !anonymousMap[userId]) return null;
    return anonymousMap[userId];
  }, []);

  return {
    anonymousId,
    generateAnonymousIdentity,
    enableAnonymousInGroup,
    getAnonymousDisplay
  };
}

