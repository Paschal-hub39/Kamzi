import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// ─────────────────────────────────────────────
// YOUR FIREBASE CONFIG
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
// INITIALIZE APP & SERVICES
// ─────────────────────────────────────────────
const app = initializeApp(firebaseConfig);

// Analytics (web only)
const analytics = getAnalytics(app);

// Authentication
const auth = getAuth(app);
auth.useDeviceLanguage();

// Firestore (database)
const db = getFirestore(app);

// Firebase Storage (files, images, voice notes)
const storage = getStorage(app);

// Cloud Messaging (push notifications)
const messaging = getMessaging(app);

// Cloud Functions (for server-side AI, payment webhooks, etc.)
const functions = getFunctions(app);

// ─────────────────────────────────────────────
// OFFLINE PERSISTENCE (Firestore)
// ─────────────────────────────────────────────
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence enabled in first tab only');
  } else if (err.code === 'unimplemented') {
    console.warn('Browser does not support offline persistence');
  }
});

// ─────────────────────────────────────────────
// EMULATORS (uncomment for local dev)
// ─────────────────────────────────────────────
// if (import.meta.env.DEV) {
//   connectAuthEmulator(auth, 'http://localhost:9099');
//   connectFirestoreEmulator(db, 'localhost', 8080);
//   connectStorageEmulator(storage, 'localhost', 9199);
//   connectFunctionsEmulator(functions, 'localhost', 5001);
// }

// ─────────────────────────────────────────────
// FCM HELPERS
// ─────────────────────────────────────────────
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

if (!VAPID_KEY && import.meta.env.DEV) {
  console.warn('⚠️ VITE_FIREBASE_VAPID_KEY not found in .env — push notifications disabled');
}

const requestFCMToken = async () => {
  if (!VAPID_KEY) return null;
  
  try {
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    return token;
  } catch (err) {
    console.error('FCM token error:', err);
    return null;
  }
};

const onForegroundMessage = (callback) => {
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};

// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────
export {
  app,
  analytics,
  auth,
  db,
  storage,
  messaging,
  functions,
  requestFCMToken,
  onForegroundMessage
};

export default app;
