import { useState, useEffect, createContext, useContext, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit,
  getDoc,
  setDoc,
  serverTimestamp,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

// ─────────────────────────────────────────────
// FIREBASE CONFIG (User Provided)
// ─────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyB70ReKYbqe5SuAckFlvXjiS3EcxUzlrBM",
  authDomain: "kamzi-da8e7.firebaseapp.com",
  projectId: "kamzi-da8e7",
  storageBucket: "kamzi-da8e7.firebasestorage.app",
  messagingSenderId: "665454312767",
  appId: "1:665454312767:web:24b63d76e692bc3904278a",
  measurementId: "G-EYV1LX4SY2"
};

// ─────────────────────────────────────────────
// INITIALIZE FIREBASE SERVICES
// ─────────────────────────────────────────────
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const messaging = getMessaging(app);

// Enable offline persistence for Firestore
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence enabled in first tab only');
  } else if (err.code === 'unimplemented') {
    console.warn('Browser does not support offline persistence');
  }
});

// ─────────────────────────────────────────────
// CONTEXTS
// ─────────────────────────────────────────────
const AuthContext = createContext(null);
const ChatContext = createContext(null);
const UIContext = createContext(null);

// ─────────────────────────────────────────────
// AUTH PROVIDER
// ─────────────────────────────────────────────
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch extended profile from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        } else {
          // Create initial profile
          const initialProfile = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'Anonymous',
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL || '',
            vibeStatus: '',
            ghostMode: false,
            premium: false,
            streaks: {},
            createdAt: serverTimestamp(),
            lastSeen: serverTimestamp()
          };
          await setDoc(userDocRef, initialProfile);
          setUserProfile(initialProfile);
        }
        
        // Update presence
        await setDoc(userDocRef, { lastSeen: serverTimestamp() }, { merge: true });
        setUser(firebaseUser);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const register = (email, password) => createUserWithEmailAndPassword(auth, email, password);
  const googleSignIn = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };
  const logout = () => signOut(auth);
  const updateUserProfile = (updates) => updateProfile(auth.currentUser, updates);

  const value = {
    user,
    userProfile,
    loading,
    login,
    register,
    googleSignIn,
    logout,
    updateUserProfile,
    auth,
    db,
    storage
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// ─────────────────────────────────────────────
// CHAT PROVIDER
// ─────────────────────────────────────────────
function ChatProvider({ children }) {
  const { user, db } = useAuth();
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatsList, setChatsList] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});

  // Subscribe to user's chats list
  useEffect(() => {
    if (!user) return;

    const chatsQuery = query(
      collection(db, 'userChats', user.uid, 'chats'),
      orderBy('lastMessageTime', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const chats = [];
      snapshot.forEach((doc) => {
        chats.push({ id: doc.id, ...doc.data() });
      });
      setChatsList(chats);
    });

    return () => unsubscribe();
  }, [user, db]);

  // Subscribe to active chat messages
  useEffect(() => {
    if (!user || !activeChat) {
      setMessages([]);
      return;
    }

    const messagesQuery = query(
      collection(db, 'chats', activeChat.id, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(200)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        msgs.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        });
      });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [user, activeChat, db]);

  const sendMessage = async (chatId, messageData) => {
    if (!user) return;
    
    const messageRef = collection(db, 'chats', chatId, 'messages');
    const newMessage = {
      ...messageData,
      senderId: user.uid,
      timestamp: serverTimestamp(),
      edited: false,
      editHistory: [],
      reactions: {},
      deleted: false,
      selfDestruct: null,
      blurred: false
    };

    await setDoc(doc(messageRef), newMessage);
    
    // Update last message in chat metadata
    const chatRef = doc(db, 'userChats', user.uid, 'chats', chatId);
    await setDoc(chatRef, {
      lastMessage: messageData.text?.substring(0, 100) || 'Media',
      lastMessageTime: serverTimestamp(),
      lastSenderId: user.uid
    }, { merge: true });
  };

  const markAsRead = async (chatId) => {
    if (!user) return;
    const chatRef = doc(db, 'userChats', user.uid, 'chats', chatId);
    await setDoc(chatRef, { unreadCount: 0 }, { merge: true });
  };

  const value = {
    activeChat,
    setActiveChat,
    messages,
    chatsList,
    typingUsers,
    unreadCounts,
    sendMessage,
    markAsRead
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
};

// ─────────────────────────────────────────────
// UI / LAYOUT PROVIDER
// ─────────────────────────────────────────────
function UIProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [mobileView, setMobileView] = useState('chats'); // 'chats' | 'chat' | 'profile'
  const [theme, setTheme] = useState('dark');
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notif) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, ...notif }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const value = {
    sidebarOpen,
    setSidebarOpen,
    rightPanelOpen,
    setRightPanelOpen,
    mobileView,
    setMobileView,
    theme,
    setTheme,
    notifications,
    addNotification
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
}

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within UIProvider');
  return context;
};

// ─────────────────────────────────────────────
// LAZY LOADED COMPONENTS (Code Splitting)
// ─────────────────────────────────────────────
const LoginPage = lazy(() => import('./components/Auth/LoginPage'));
const RegisterPage = lazy(() => import('./components/Auth/RegisterPage'));
const ChatLayout = lazy(() => import('./components/Layout/ChatLayout'));
const VoiceRooms = lazy(() => import('./components/Social/VoiceRoom'));
const TempRoomsList = lazy(() => import('./components/Social/TempChatRoom'));
const ProfilePage = lazy(() => import('./components/Auth/ProfilePage'));
const SettingsPage = lazy(() => import('./components/Auth/SettingsPage'));

// ─────────────────────────────────────────────
// PROTECTED ROUTE WRAPPER
// ─────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// ─────────────────────────────────────────────
// MAIN APP COMPONENT
// ─────────────────────────────────────────────
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ChatProvider>
          <UIProvider>
            <AppContent />
          </UIProvider>
        </ChatProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

function AppContent() {
  const { user } = useAuth();
  const { theme } = useUI();

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && user) {
      Notification.requestPermission();
    }
  }, [user]);

  // FCM Token registration
  useEffect(() => {
    if (!user) return;
    
    const registerFCM = async () => {
      try {
        const token = await getToken(messaging, {
          vapidKey: 'YOUR_VAPID_KEY_HERE' // Replace with your VAPID key
        });
        if (token) {
          await setDoc(doc(db, 'users', user.uid), { fcmToken: token }, { merge: true });
        }
      } catch (err) {
        console.warn('FCM registration failed:', err);
      }
    };

    registerFCM();

    // Handle foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message:', payload);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500" />
        </div>
      }>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" />} />
          
          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <ChatLayout />
            </ProtectedRoute>
          } />
          <Route path="/voice-rooms" element={
            <ProtectedRoute>
              <VoiceRooms />
            </ProtectedRoute>
          } />
          <Route path="/temp-rooms" element={
            <ProtectedRoute>
              <TempRoomsList />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
                               // ─── CONTINUED FROM PART 1 ───
// Line 301+

// ─────────────────────────────────────────────
// ENCRYPTION CONTEXT (E2E)
// ─────────────────────────────────────────────
const EncryptionContext = createContext(null);

function EncryptionProvider({ children }) {
  const { user } = useAuth();
  const [keyPair, setKeyPair] = useState(null);
  const [sharedSecrets, setSharedSecrets] = useState({});

  // Generate ECDH key pair on mount
  useEffect(() => {
    if (!user) return;
    
    const generateKeys = async () => {
      try {
        const pair = await window.crypto.subtle.generateKey(
          { name: 'ECDH', namedCurve: 'P-256' },
          true,
          ['deriveKey', 'deriveBits']
        );
        setKeyPair(pair);
        
        // Store public key in Firestore for others to grab
        const pubKeyJwk = await window.crypto.subtle.exportKey('jwk', pair.publicKey);
        await setDoc(doc(db, 'userKeys', user.uid), { 
          publicKey: pubKeyJwk,
          updatedAt: serverTimestamp() 
        }, { merge: true });
      } catch (err) {
        console.error('Key generation failed:', err);
      }
    };

    generateKeys();
  }, [user]);

  // Derive shared secret with another user
  const getSharedSecret = async (otherUserId) => {
    if (sharedSecrets[otherUserId]) return sharedSecrets[otherUserId];

    try {
      const otherKeyDoc = await getDoc(doc(db, 'userKeys', otherUserId));
      if (!otherKeyDoc.exists()) return null;

      const theirPublicKey = await window.crypto.subtle.importKey(
        'jwk',
        otherKeyDoc.data().publicKey,
        { name: 'ECDH', namedCurve: 'P-256' },
        false,
        []
      );

      const shared = await window.crypto.subtle.deriveKey(
        { name: 'ECDH', public: theirPublicKey },
        keyPair.privateKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      setSharedSecrets(prev => ({ ...prev, [otherUserId]: shared }));
      return shared;
    } catch (err) {
      console.error('Shared secret derivation failed:', err);
      return null;
    }
  };

  const encryptMessage = async (text, recipientId) => {
    const secret = await getSharedSecret(recipientId);
    if (!secret) return null;

    const encoder = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      secret,
      encoder.encode(text)
    );

    return {
      cipher: Array.from(new Uint8Array(encrypted)),
      iv: Array.from(iv)
    };
  };

  const decryptMessage = async (cipherObj, senderId) => {
    const secret = await getSharedSecret(senderId);
    if (!secret) return null;

    try {
      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(cipherObj.iv) },
        secret,
        new Uint8Array(cipherObj.cipher)
      );
      return new TextDecoder().decode(decrypted);
    } catch (err) {
      console.error('Decryption failed:', err);
      return '[Encrypted Message]';
    }
  };

  return (
    <EncryptionContext.Provider value={{ encryptMessage, decryptMessage, getSharedSecret }}>
      {children}
    </EncryptionContext.Provider>
  );
}

export const useEncryption = () => {
  const context = useContext(EncryptionContext);
  if (!context) throw new Error('useEncryption must be used within EncryptionProvider');
  return context;
};

// ─────────────────────────────────────────────
// AI CONTEXT (Smart Replies, Summarize, Mood, Translate)
// ─────────────────────────────────────────────
const AIContext = createContext(null);

function AIProvider({ children }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [mood, setMood] = useState(null);
  const API_KEY = import.meta.env.VITE_OPENAI_KEY || '';

  const callAI = async (messages, systemPrompt) => {
    if (!API_KEY) return null;
    setIsProcessing(true);
    
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          max_tokens: 500
        })
      });
      
      const data = await res.json();
      return data.choices?.[0]?.message?.content || null;
    } catch (err) {
      console.error('AI call failed:', err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const getSmartReplies = async (recentMessages) => {
    const text = recentMessages.map(m => `${m.senderId}: ${m.text}`).join('\n');
    const prompt = 'You are a helpful assistant. Based on this conversation, suggest 3 short, natural reply options (max 6 words each). Return ONLY a JSON array of strings.';
    const result = await callAI([{ role: 'user', content: text }], prompt);
    
    try {
      return JSON.parse(result || '[]');
    } catch {
      return ['👍', 'Interesting...', 'Tell me more'];
    }
  };

  const summarizeChat = async (messages) => {
    const text = messages.map(m => m.text).join('\n');
    const prompt = 'Summarize this conversation in 3 bullet points. Be concise.';
    return await callAI([{ role: 'user', content: text }], prompt);
  };

  const detectMood = async (recentMessages) => {
    const text = recentMessages.map(m => m.text).join(' ');
    const prompt = 'Analyze the tone of this conversation. Return ONLY one of: calm, excited, heated, sad, romantic, professional. No explanation.';
    const result = await callAI([{ role: 'user', content: text }], prompt);
    
    const detected = result?.toLowerCase().trim() || 'calm';
    setMood(detected);
    return detected;
  };

  const translateMessage = async (text, targetLang) => {
    const prompt = `Translate the following to ${targetLang}. Return ONLY the translation, no quotes or explanation.`;
    return await callAI([{ role: 'user', content: text }], prompt);
  };

  const handleSlashCommand = async (command, args) => {
    switch(command) {
      case '/plan':
        return await callAI(
          [{ role: 'user', content: args }],
          'You are an event planner. Create a structured plan with: date, time, location, budget estimate, and checklist. Format with emojis.'
        );
      case '/study':
        return await callAI(
          [{ role: 'user', content: args }],
          'You are a study assistant. Create a quiz with 5 questions, answers, and a shared notes template. Format cleanly.'
        );
      case '/trip':
        return await callAI(
          [{ role: 'user', content: args }],
          'You are a travel planner. Suggest: destinations, budget breakdown, packing list, and itinerary. Include map links if possible.'
        );
      default:
        return 'Unknown command. Try /plan, /study, or /trip';
    }
  };

  return (
    <AIContext.Provider value={{
      isProcessing,
      mood,
      getSmartReplies,
      summarizeChat,
      detectMood,
      translateMessage,
      handleSlashCommand
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

// ─────────────────────────────────────────────
// PRIVACY CONTEXT (Ghost Mode, Screenshots, Self-Destruct)
// ─────────────────────────────────────────────
const PrivacyContext = createContext(null);

function PrivacyProvider({ children }) {
  const { user, userProfile } = useAuth();
  const [ghostMode, setGhostMode] = useState(false);
  const [screenshotDetected, setScreenshotDetected] = useState(false);
  const [selfDestructTimers, setSelfDestructTimers] = useState({});

  // Load ghost mode from profile
  useEffect(() => {
    if (userProfile?.ghostMode !== undefined) {
      setGhostMode(userProfile.ghostMode);
    }
  }, [userProfile]);

  // Screenshot detection via visibility + canvas overlay trick
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        // User switched apps/tabs — potential screenshot
        setScreenshotDetected(true);
        setTimeout(() => setScreenshotDetected(false), 3000);
      }
    };

    // Additional: detect PrintScreen key
    const handleKeyDown = (e) => {
      if (e.key === 'PrintScreen' || (e.ctrlKey && e.key === 's')) {
        e.preventDefault();
        setScreenshotDetected(true);
        setTimeout(() => setScreenshotDetected(false), 5000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleGhostMode = async () => {
    if (!user) return;
    const newMode = !ghostMode;
    setGhostMode(newMode);
    await setDoc(doc(db, 'users', user.uid), { ghostMode: newMode }, { merge: true });
  };

  const setSelfDestruct = (messageId, seconds) => {
    setSelfDestructTimers(prev => ({ ...prev, [messageId]: seconds }));
    
    setTimeout(async () => {
      // Delete from Firestore
      await setDoc(
        doc(db, 'chats', activeChat?.id, 'messages', messageId),
        { deleted: true, text: '⌛ This message self-destructed' },
        { merge: true }
      );
      setSelfDestructTimers(prev => {
        const next = { ...prev };
        delete next[messageId];
        return next;
      });
    }, seconds * 1000);
  };

  const value = {
    ghostMode,
    toggleGhostMode,
    screenshotDetected,
    setScreenshotDetected,
    selfDestructTimers,
    setSelfDestruct
  };

  return (
    <PrivacyContext.Provider value={value}>
      {children}
    </PrivacyContext.Provider>
  );
}

export const usePrivacy = () => {
  const context = useContext(PrivacyContext);
  if (!context) throw new Error('usePrivacy must be used within PrivacyProvider');
  return context;
};

// ─────────────────────────────────────────────
// CONTEXT-AWARE ENGINE (KILLER FEATURE)
// ─────────────────────────────────────────────
const ContextAwareContext = createContext(null);

function ContextAwareProvider({ children }) {
  const { messages, activeChat } = useChat();
  const [detectedContext, setDetectedContext] = useState(null);
  const [suggestedTools, setSuggestedTools] = useState([]);

  // Context detection keywords + scoring
  const CONTEXT_PATTERNS = {
    trip: {
      keywords: ['flight', 'hotel', 'travel', 'vacation', 'booking', 'passport', 'airport', 'trip'],
      tools: ['🗺️ Maps', '💰 Budget Planner', '📋 Itinerary', '🏨 Hotel Search'],
      color: 'bg-blue-500'
    },
    argument: {
      keywords: ['wrong', 'never', 'always', 'hate', 'angry', 'mad', 'stupid', 'ridiculous', 'whatever'],
      tools: ['😤 Cool-Down Timer', '🧘 Breathing Exercise', '🗣️ Mediator Bot', '⏸️ Pause Chat'],
      color: 'bg-red-500'
    },
    study: {
      keywords: ['exam', 'homework', 'study', 'test', 'quiz', 'assignment', 'lecture', 'notes'],
      tools: ['📝 Shared Notes', '❓ Quiz Mode', '⏱️ Pomodoro Timer', '📚 Flashcards'],
      color: 'bg-purple-500'
    },
    planning: {
      keywords: ['plan', 'schedule', 'meet', 'event', 'party', 'dinner', 'weekend', 'tomorrow'],
      tools: ['📅 Calendar', '✅ Task List', '📍 Location Share', '⏰ Reminder'],
      color: 'bg-green-500'
    },
    romantic: {
      keywords: ['love', 'miss you', 'date', 'dinner', 'movie', 'cute', 'beautiful', 'heart'],
      tools: ['💕 Mood Music', '🎬 Movie Picks', '🍽️ Restaurant Finder', '🌹 Surprise Ideas'],
      color: 'bg-pink-500'
    }
  };

  useEffect(() => {
    if (!messages.length) {
      setDetectedContext(null);
      setSuggestedTools([]);
      return;
    }

    // Analyze last 10 messages
    const recentText = messages.slice(-10).map(m => m.text?.toLowerCase() || '').join(' ');
    let bestMatch = null;
    let highestScore = 0;

    Object.entries(CONTEXT_PATTERNS).forEach(([context, data]) => {
      const score = data.keywords.reduce((acc, keyword) => {
        return acc + (recentText.includes(keyword) ? 1 : 0);
      }, 0);
      
      if (score > highestScore && score >= 2) {
        highestScore = score;
        bestMatch = { type: context, ...data };
      }
    });

    if (bestMatch !== detectedContext) {
      setDetectedContext(bestMatch);
      setSuggestedTools(bestMatch?.tools || []);
    }
  }, [messages]);

  const dismissContext = () => {
    setDetectedContext(null);
    setSuggestedTools([]);
  };

  return (
    <ContextAwareContext.Provider value={{
      detectedContext,
      suggestedTools,
      dismissContext,
      CONTEXT_PATTERNS
    }}>
      {children}
    </ContextAwareContext.Provider>
  );
}

export const useContextAware = () => {
  const context = useContext(ContextAwareContext);
  if (!context) throw new Error('useContextAware must be used within ContextAwareProvider');
  return context;
};

// ─────────────────────────────────────────────
// THEME CONTEXT (Global + Per-Contact)
// ─────────────────────────────────────────────
const ThemeContext = createContext(null);

function ThemeProvider({ children }) {
  const { user } = useAuth();
  const [globalTheme, setGlobalTheme] = useState('dark');
  const [chatThemes, setChatThemes] = useState({});

  // Load saved themes from Firestore
  useEffect(() => {
    if (!user) return;
    
    const loadThemes = async () => {
      const docRef = doc(db, 'userThemes', user.uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setChatThemes(snap.data().chats || {});
        setGlobalTheme(snap.data().global || 'dark');
      }
    };
    
    loadThemes();
  }, [user]);

  const setChatTheme = async (chatId, theme) => {
    if (!user) return;
    const updated = { ...chatThemes, [chatId]: theme };
    setChatThemes(updated);
    await setDoc(doc(db, 'userThemes', user.uid), { 
      chats: updated,
      global: globalTheme 
    }, { merge: true });
  };

  const getActiveTheme = (chatId) => {
    return chatThemes[chatId] || globalTheme;
  };

  const themes = {
    dark: { bg: 'bg-gray-900', bubble: 'bg-green-700', text: 'text-white' },
    light: { bg: 'bg-gray-50', bubble: 'bg-green-500', text: 'text-gray-900' },
    ocean: { bg: 'bg-blue-950', bubble: 'bg-cyan-600', text: 'text-white' },
    sunset: { bg: 'bg-orange-950', bubble: 'bg-orange-600', text: 'text-white' },
    forest: { bg: 'bg-green-950', bubble: 'bg-emerald-600', text: 'text-white' },
    midnight: { bg: 'bg-indigo-950', bubble: 'bg-violet-600', text: 'text-white' }
  };

  return (
    <ThemeContext.Provider value={{
      globalTheme,
      setGlobalTheme,
      chatThemes,
      setChatTheme,
      getActiveTheme,
      themes
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

// ─────────────────────────────────────────────
// NOTIFICATION COMPONENT
// ─────────────────────────────────────────────
function NotificationToast() {
  const { notifications } = useUI();
  
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notif => (
        <div 
          key={notif.id}
          className={`px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
            notif.type === 'error' ? 'bg-red-600' : 
            notif.type === 'success' ? 'bg-green-600' : 'bg-blue-600'
          } text-white max-w-sm`}
        >
          <p className="font-medium">{notif.title}</p>
          {notif.message && <p className="text-sm opacity-90">{notif.message}</p>}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// SCREENSHOT DETECTION OVERLAY
// ─────────────────────────────────────────────
function ScreenshotOverlay() {
  const { screenshotDetected } = usePrivacy();
  
  if (!screenshotDetected) return null;
  
  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center animate-pulse">
      <div className="text-center">
        <div className="text-6xl mb-4">📸⚠️</div>
        <h2 className="text-2xl font-bold text-white mb-2">Screenshot Detected!</h2>
        <p className="text-gray-300">This conversation is private. The other user has been notified.</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// UPDATED APP COMPONENT WITH ALL PROVIDERS
// ─────────────────────────────────────────────
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <EncryptionProvider>
          <AIProvider>
            <PrivacyProvider>
              <ContextAwareProvider>
                <ThemeProvider>
                  <ChatProvider>
                    <UIProvider>
                      <AppContent />
                    </UIProvider>
                  </ChatProvider>
                </ThemeProvider>
              </ContextAwareProvider>
            </PrivacyProvider>
          </AIProvider>
        </EncryptionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

// ─── AppContent continues from Part 1, enhanced ───
function AppContent() {
  const { user } = useAuth();
  const { theme } = useUI();
  const { screenshotDetected } = usePrivacy();

  // Theme application
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  // Notification permission + FCM
  useEffect(() => {
    if ('Notification' in window && user) {
      Notification.requestPermission();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    const registerFCM = async () => {
      try {
        const token = await getToken(messaging, {
          vapidKey: 'YOUR_VAPID_KEY_HERE'
        });
        if (token) {
          await setDoc(doc(db, 'users', user.uid), { fcmToken: token }, { merge: true });
        }
      } catch (err) {
        console.warn('FCM registration failed:', err);
      }
    };

    registerFCM();
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message:', payload);
    });

    return () => unsubscribe();
  }, [user]);

  // Ghost mode: don't update lastSeen if active
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      const profile = await getDoc(doc(db, 'users', user.uid));
      if (!profile.data()?.ghostMode) {
        await setDoc(doc(db, 'users', user.uid), { lastSeen: serverTimestamp() }, { merge: true });
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <ScreenshotOverlay />
      <NotificationToast />
      
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500" />
        </div>
      }>
        <Routes>
          <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <ChatLayout />
            </ProtectedRoute>
          } />
          <Route path="/voice-rooms" element={
            <ProtectedRoute>
              <VoiceRooms />
            </ProtectedRoute>
          } />
          <Route path="/temp-rooms" element={
            <Prot/>
