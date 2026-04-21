import { createContext, useContext, useState, useEffect } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { app, db } from '../firebase';

const AuthContext = createContext(null);
const auth = getAuth(app);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        } else {
          const initialProfile = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'Kamzi User',
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL || '',
            vibeStatus: '',
            ghostMode: false,
            premium: false,
            streaks: {},
            createdAt: serverTimestamp(),
            lastSeen: serverTimestamp(),
            fcmToken: null
          };
          await setDoc(userDocRef, initialProfile);
          setUserProfile(initialProfile);
        }
        
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
  const googleSignIn = () => signInWithPopup(auth, new GoogleAuthProvider());
  const logout = () => signOut(auth);
  const resetPassword = (email) => sendPasswordResetEmail(auth, email);
  const updateUserProfile = (updates) => updateProfile(auth.currentUser, updates);

  const value = {
    user,
    userProfile,
    loading,
    login,
    register,
    googleSignIn,
    logout,
    resetPassword,
    updateUserProfile,
    auth,
    db
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
