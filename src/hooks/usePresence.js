import { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { usePrivacy } from '../contexts/PrivacyContext';
import { db } from '../firebase';

export function usePresence(chatId = null) {
  const { user } = useAuth();
  const { ghostMode } = usePrivacy();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [lastSeen, setLastSeen] = useState({});

  // Update own presence
  useEffect(() => {
    if (!user || ghostMode) return;

    const updatePresence = async () => {
      await setDoc(doc(db, 'presence', user.uid), {
        online: true,
        lastSeen: serverTimestamp(),
        currentChat: chatId || null,
        lastActive: serverTimestamp()
      }, { merge: true });
    };

    updatePresence();
    const interval = setInterval(updatePresence, 30000);

    // Set offline on unload
    const handleUnload = () => {
      setDoc(doc(db, 'presence', user.uid), {
        online: false,
        lastSeen: serverTimestamp()
      }, { merge: true });
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
      handleUnload();
    };
  }, [user, chatId, ghostMode]);

  // Subscribe to chat participants presence
  useEffect(() => {
    if (!chatId) return;

    const unsub = onSnapshot(doc(db, 'chats', chatId), (snap) => {
      if (!snap.exists()) return;
      
      const participants = snap.data().participants || [];
      const online = [];
      const lastSeenMap = {};

      participants.forEach(async (uid) => {
        if (uid === user?.uid) return;
        
        const presenceRef = doc(db, 'presence', uid);
        const presenceSnap = await getDoc(presenceRef);
        
        if (presenceSnap.exists()) {
          const data = presenceSnap.data();
          if (data.online) online.push(uid);
          lastSeenMap[uid] = data.lastSeen?.toDate() || null;
        }
      });

      setOnlineUsers(online);
      setLastSeen(lastSeenMap);
    });

    return () => unsub();
  }, [chatId, user]);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!chatId) return;

    const typingRef = doc(db, 'chats', chatId, 'typing');
    const unsub = onSnapshot(typingRef, (snap) => {
      const typing = [];
      snap.forEach((doc) => {
        const data = doc.data();
        if (data.isTyping && doc.id !== user?.uid) {
          typing.push(doc.id);
        }
      });
      setTypingUsers(typing);
    });

    return () => unsub();
  }, [chatId, user]);

  const setTyping = useCallback(async (isTyping) => {
    if (!user || !chatId) return;
    await setDoc(doc(db, 'chats', chatId, 'typing', user.uid), {
      isTyping,
      timestamp: serverTimestamp()
    }, { merge: true });
  }, [user, chatId]);

  return {
    onlineUsers,
    typingUsers,
    lastSeen,
    setTyping,
    isOnline: (uid) => onlineUsers.includes(uid)
  };
}

