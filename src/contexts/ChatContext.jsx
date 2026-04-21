import { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  setDoc,
  serverTimestamp,
  addDoc,
  updateDoc,
  deleteDoc,
  where
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { db } from '../firebase';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatsList, setChatsList] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});

  // Subscribe to user's chats
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'userChats', user.uid, 'chats'),
      orderBy('lastMessageTime', 'desc'),
      limit(50)
    );

    const unsub = onSnapshot(q, (snap) => {
      const chats = [];
      snap.forEach((doc) => chats.push({ id: doc.id, ...doc.data() }));
      setChatsList(chats);
    });

    return () => unsub();
  }, [user]);

  // Subscribe to active chat messages
  useEffect(() => {
    if (!user || !activeChat) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'chats', activeChat.id, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(200)
    );

    const unsub = onSnapshot(q, (snap) => {
      const msgs = [];
      snap.forEach((doc) => {
        const data = doc.data();
        msgs.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        });
      });
      setMessages(msgs);
    });

    return () => unsub();
  }, [user, activeChat]);

  const sendMessage = async (chatId, messageData) => {
    if (!user) return;

    const newMessage = {
      ...messageData,
      senderId: user.uid,
      senderName: user.displayName || 'Anonymous',
      senderPhoto: user.photoURL || '',
      timestamp: serverTimestamp(),
      edited: false,
      editHistory: [],
      reactions: {},
      deleted: false,
      selfDestruct: null,
      blurred: messageData.sensitive || false,
      encrypted: messageData.encrypted || false
    };

    await addDoc(collection(db, 'chats', chatId, 'messages'), newMessage);

    const chatRef = doc(db, 'userChats', user.uid, 'chats', chatId);
    await setDoc(chatRef, {
      lastMessage: messageData.text?.substring(0, 100) || 'Media',
      lastMessageTime: serverTimestamp(),
      lastSenderId: user.uid
    }, { merge: true });
  };

  const editMessage = async (chatId, messageId, newText) => {
    const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
    const msgSnap = await getDoc(msgRef);
    if (!msgSnap.exists()) return;

    const oldText = msgSnap.data().text;
    await updateDoc(msgRef, {
      text: newText,
      edited: true,
      editHistory: [...(msgSnap.data().editHistory || []), { text: oldText, editedAt: serverTimestamp() }]
    });
  };

  const deleteMessage = async (chatId, messageId) => {
    await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
      deleted: true,
      text: '🗑️ This message was deleted'
    });
  };

  const addReaction = async (chatId, messageId, emoji) => {
    const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
    const reactions = { [`reactions.${user.uid}`]: emoji };
    await updateDoc(msgRef, reactions);
  };

  const setTyping = async (chatId, isTyping) => {
    if (!user) return;
    await setDoc(doc(db, 'chats', chatId, 'typing', user.uid), {
      isTyping,
      timestamp: serverTimestamp()
    }, { merge: true });
  };

  const markAsRead = async (chatId) => {
    if (!user) return;
    await setDoc(doc(db, 'userChats', user.uid, 'chats', chatId), { unreadCount: 0 }, { merge: true });
  };

  const createChat = async (participantIds, isGroup = false, groupName = '') => {
    const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const allParticipants = [...new Set([...participantIds, user.uid])];

    await setDoc(doc(db, 'chats', chatId), {
      participants: allParticipants,
      isGroup,
      groupName: isGroup ? groupName : '',
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      admins: [user.uid]
    });

    // Add to each participant's chat list
    for (const pid of allParticipants) {
      await setDoc(doc(db, 'userChats', pid, 'chats', chatId), {
        chatId,
        unreadCount: pid === user.uid ? 0 : 1,
        lastMessage: 'Chat created',
        lastMessageTime: serverTimestamp(),
        pinned: false,
        muted: false
      });
    }

    return chatId;
  };

  return (
    <ChatContext.Provider value={{
      activeChat,
      setActiveChat,
      messages,
      chatsList,
      typingUsers,
      unreadCounts,
      sendMessage,
      editMessage,
      deleteMessage,
      addReaction,
      setTyping,
      markAsRead,
      createChat
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
};

