import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { db } from '../firebase';

const PrivacyContext = createContext(null);

export function PrivacyProvider({ children }) {
  const { user, userProfile } = useAuth();
  const [ghostMode, setGhostMode] = useState(false);
  const [screenshotDetected, setScreenshotDetected] = useState(false);
  const [selfDestructTimers, setSelfDestructTimers] = useState({});
  const [blurAllSensitive, setBlurAllSensitive] = useState(true);

  useEffect(() => {
    if (userProfile?.ghostMode !== undefined) setGhostMode(userProfile.ghostMode);
    if (userProfile?.blurSensitive !== undefined) setBlurAllSensitive(userProfile.blurSensitive);
  }, [userProfile]);

  // Screenshot detection
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) triggerScreenshotAlert();
    };

    const handleKeyDown = (e) => {
      if (e.key === 'PrintScreen' || (e.ctrlKey && e.key === 's') || (e.metaKey && e.shiftKey && e.key === '3')) {
        e.preventDefault();
        triggerScreenshotAlert();
      }
    };

    // Canvas-based detection (overlay trick)
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '99999';
    canvas.style.opacity = '0.01';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const detectScreenshot = () => {
      try {
        ctx.drawImage(document.documentElement, 0, 0);
        // If this fails or behaves weirdly, potential screenshot tool
      } catch {
        triggerScreenshotAlert();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('keydown', handleKeyDown);
    const interval = setInterval(detectScreenshot, 2000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('keydown', handleKeyDown);
      clearInterval(interval);
      canvas.remove();
    };
  }, []);

  const triggerScreenshotAlert = useCallback(() => {
    setScreenshotDetected(true);
    // Notify other user in active chat
    if (user && activeChat) {
      // Firestore notification logic here
    }
    setTimeout(() => setScreenshotDetected(false), 5000);
  }, [user]);

  const toggleGhostMode = async () => {
    if (!user) return;
    const newMode = !ghostMode;
    setGhostMode(newMode);
    await setDoc(doc(db, 'users', user.uid), { ghostMode: newMode }, { merge: true });
  };

  const toggleBlurSensitive = async () => {
    if (!user) return;
    const newBlur = !blurAllSensitive;
    setBlurAllSensitive(newBlur);
    await setDoc(doc(db, 'users', user.uid), { blurSensitive: newBlur }, { merge: true });
  };

  const setSelfDestruct = (messageId, seconds, chatId) => {
    setSelfDestructTimers(prev => ({ ...prev, [messageId]: seconds }));
    
    setTimeout(async () => {
      await setDoc(
        doc(db, 'chats', chatId, 'messages', messageId),
        { deleted: true, text: '⌛ This message self-destructed', selfDestructed: true },
        { merge: true }
      );
      setSelfDestructTimers(prev => {
        const next = { ...prev };
        delete next[messageId];
        return next;
      });
    }, seconds * 1000);
  };

  return (
    <PrivacyContext.Provider value={{
      ghostMode,
      toggleGhostMode,
      screenshotDetected,
      setScreenshotDetected,
      selfDestructTimers,
      setSelfDestruct,
      blurAllSensitive,
      toggleBlurSensitive
    }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export const usePrivacy = () => {
  const context = useContext(PrivacyContext);
  if (!context) throw new Error('usePrivacy must be used within PrivacyProvider');
  return context;
};
