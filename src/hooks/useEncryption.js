import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';

export function useEncryption() {
  const { user } = useAuth();
  const [keyPair, setKeyPair] = useState(null);
  const [sharedSecrets, setSharedSecrets] = useState({});
  const workerRef = useRef(null);

  // Initialize Web Crypto key pair
  useEffect(() => {
    if (!user) return;
    
    const initKeys = async () => {
      try {
        const pair = await window.crypto.subtle.generateKey(
          { name: 'ECDH', namedCurve: 'P-256' },
          true,
          ['deriveKey', 'deriveBits']
        );
        setKeyPair(pair);

        // Store public key
        const pubKeyJwk = await window.crypto.subtle.exportKey('jwk', pair.publicKey);
        await setDoc(doc(db, 'userKeys', user.uid), {
          publicKey: pubKeyJwk,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.error('Key generation failed:', err);
      }
    };

    initKeys();

    // Init worker
    workerRef.current = new Worker(new URL('../workers/encryption.worker.js', import.meta.url));
    
    return () => {
      workerRef.current?.terminate();
    };
  }, [user]);

  const getSharedSecret = useCallback(async (otherUserId) => {
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
  }, [keyPair, sharedSecrets]);

  const encryptMessage = useCallback(async (text, recipientId) => {
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
  }, [getSharedSecret]);

  const decryptMessage = useCallback(async (cipherObj, senderId) => {
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
  }, [getSharedSecret]);

  return { encryptMessage, decryptMessage, getSharedSecret, keyPair };
}
