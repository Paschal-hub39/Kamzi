import { useState, useEffect, useCallback } from 'react';
import { onMessage, getToken } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { messaging, db } from '../firebase';

export function useNotifications() {
  const { user } = useAuth();
  const [fcmToken, setFcmToken] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Register FCM token
  useEffect(() => {
    if (!user) return;

    const registerFCM = async () => {
      try {
        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
        });
        
        if (token) {
          setFcmToken(token);
          await setDoc(doc(db, 'users', user.uid), { fcmToken: token }, { merge: true });
        }
      } catch (err) {
        console.warn('FCM registration failed:', err);
      }
    };

    registerFCM();
  }, [user]);

  // Listen to foreground messages
  useEffect(() => {
    const unsub = onMessage(messaging, (payload) => {
      const notification = {
        id: Date.now(),
        title: payload.notification?.title || 'New message',
        body: payload.notification?.body,
        data: payload.data,
        timestamp: new Date()
      };
      
      setNotifications(prev => [notification, ...prev]);
      
      // Show browser notification if permitted
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.body,
          icon: '/icons/kamzi-icon-192.png',
          badge: '/icons/kamzi-icon-72.png',
          tag: payload.data?.chatId
        });
      }
    });

    return () => unsub();
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return {
    fcmToken,
    notifications,
    clearNotifications,
    removeNotification,
    unreadCount: notifications.length
  };
}
