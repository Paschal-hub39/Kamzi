import { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { db } from '../firebase';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { user } = useAuth();
  const [globalTheme, setGlobalTheme] = useState('dark');
  const [chatThemes, setChatThemes] = useState({});

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const snap = await getDoc(doc(db, 'userThemes', user.uid));
      if (snap.exists()) {
        setChatThemes(snap.data().chats || {});
        setGlobalTheme(snap.data().global || 'dark');
      }
    };
    load();
  }, [user]);

  const saveThemes = async (updates) => {
    if (!user) return;
    await setDoc(doc(db, 'userThemes', user.uid), updates, { merge: true });
  };

  const setChatTheme = async (chatId, themeKey) => {
    const updated = { ...chatThemes, [chatId]: themeKey };
    setChatThemes(updated);
    await saveThemes({ chats: updated });
  };

  const setGlobal = async (themeKey) => {
    setGlobalTheme(themeKey);
    await saveThemes({ global: themeKey });
  };

  const getActiveTheme = (chatId) => chatThemes[chatId] || globalTheme;

  const themes = {
    dark: {
      name: 'Midnight',
      bg: 'bg-gray-900',
      surface: 'bg-gray-800',
      bubbleMe: 'bg-violet-600',
      bubbleOther: 'bg-gray-700',
      text: 'text-white',
      textMuted: 'text-gray-400',
      accent: 'text-violet-400',
      border: 'border-gray-700',
      input: 'bg-gray-800 border-gray-600'
    },
    light: {
      name: 'Daylight',
      bg: 'bg-gray-50',
      surface: 'bg-white',
      bubbleMe: 'bg-violet-500',
      bubbleOther: 'bg-gray-200',
      text: 'text-gray-900',
      textMuted: 'text-gray-500',
      accent: 'text-violet-600',
      border: 'border-gray-200',
      input: 'bg-white border-gray-300'
    },
    ocean: {
      name: 'Ocean',
      bg: 'bg-slate-950',
      surface: 'bg-slate-900',
      bubbleMe: 'bg-cyan-600',
      bubbleOther: 'bg-slate-800',
      text: 'text-white',
      textMuted: 'text-slate-400',
      accent: 'text-cyan-400',
      border: 'border-slate-700',
      input: 'bg-slate-800 border-slate-600'
    },
    sunset: {
      name: 'Sunset',
      bg: 'bg-orange-950',
      surface: 'bg-orange-900',
      bubbleMe: 'bg-orange-500',
      bubbleOther: 'bg-orange-800',
      text: 'text-white',
      textMuted: 'text-orange-300',
      accent: 'text-yellow-400',
      border: 'border-orange-800',
      input: 'bg-orange-900 border-orange-700'
    },
    forest: {
      name: 'Forest',
      bg: 'bg-emerald-950',
      surface: 'bg-emerald-900',
      bubbleMe: 'bg-emerald-500',
      bubbleOther: 'bg-emerald-800',
      text: 'text-white',
      textMuted: 'text-emerald-300',
      accent: 'text-lime-400',
      border: 'border-emerald-800',
      input: 'bg-emerald-900 border-emerald-700'
    },
    kamzi: {
      name: 'Kamzi',
      bg: 'bg-[#0a0a0a]',
      surface: 'bg-[#1a1a2e]',
      bubbleMe: 'bg-gradient-to-r from-violet-600 to-purple-500',
      bubbleOther: 'bg-[#16213e]',
      text: 'text-white',
      textMuted: 'text-gray-400',
      accent: 'text-violet-400',
      border: 'border-violet-900/50',
      input: 'bg-[#1a1a2e] border-violet-800'
    }
  };

  return (
    <ThemeContext.Provider value={{
      globalTheme,
      setGlobal: setGlobal,
      chatThemes,
      setChatTheme,
      getActiveTheme,
      themes,
      allThemeKeys: Object.keys(themes)
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

