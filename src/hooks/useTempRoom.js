import { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';

export function useTempRoom() {
  const { user } = useAuth();
  const [tempRooms, setTempRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);

  // Subscribe to user's temp rooms
  useEffect(() => {
    if (!user) return;

    const q = doc(db, 'userTempRooms', user.uid);
    const unsub = onSnapshot(q, (snap) => {
      if (snap.exists()) {
        const rooms = snap.data().rooms || {};
        const active = Object.entries(rooms)
          .filter(([_, room]) => !room.expired)
          .map(([id, room]) => ({
            id,
            ...room,
            remainingTime: room.expiresAt ? Math.max(0, room.expiresAt.toDate() - Date.now()) : 0
          }));
        setTempRooms(active);
      }
    });

    return () => unsub();
  }, [user]);

  const createTempRoom = useCallback(async (name, durationHours = 24, maxParticipants = 50) => {
    if (!user) return null;

    const roomId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

    const roomData = {
      name,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      expiresAt: serverTimestamp(expiresAt),
      durationHours,
      maxParticipants,
      participants: [user.uid],
      messages: [],
      expired: false,
      anonymousMode: false
    };

    // Create room
    await setDoc(doc(db, 'tempRooms', roomId), roomData);

    // Add to user's temp rooms
    const userRoomsRef = doc(db, 'userTempRooms', user.uid);
    const userRoomsSnap = await getDoc(userRoomsRef);
    const currentRooms = userRoomsSnap.exists() ? userRoomsSnap.data().rooms || {} : {};

    await setDoc(userRoomsRef, {
      rooms: {
        ...currentRooms,
        [roomId]: { joinedAt: serverTimestamp(), name }
      }
    }, { merge: true });

    // Set expiry timer
    setTimeout(() => expireRoom(roomId), durationHours * 60 * 60 * 1000);

    return roomId;
  }, [user]);

  const joinTempRoom = useCallback(async (roomId) => {
    if (!user) return false;

    const roomRef = doc(db, 'tempRooms', roomId);
    const roomSnap = await getDoc(roomRef);
    
    if (!roomSnap.exists()) return false;
    
    const room = roomSnap.data();
    if (room.expired || room.participants.length >= room.maxParticipants) return false;

    await updateDoc(roomRef, {
      participants: [...room.participants, user.uid]
    });

    // Add to user's rooms
    const userRoomsRef = doc(db, 'userTempRooms', user.uid);
    await setDoc(userRoomsRef, {
      rooms: { [roomId]: { joinedAt: serverTimestamp(), name: room.name } }
    }, { merge: true });

    return true;
  }, [user]);

  const expireRoom = useCallback(async (roomId) => {
    await updateDoc(doc(db, 'tempRooms', roomId), {
      expired: true,
      expiredAt: serverTimestamp()
    });

    // Cleanup after grace period
    setTimeout(async () => {
      await deleteDoc(doc(db, 'tempRooms', roomId));
    }, 60000); // Delete 1 min after expiry
  }, []);

  const toggleAnonymous = useCallback(async (roomId) => {
    const roomRef = doc(db, 'tempRooms', roomId);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;
    
    await updateDoc(roomRef, {
      anonymousMode: !snap.data().anonymousMode
    });
  }, []);

  return {
    tempRooms,
    activeRoom,
    setActiveRoom,
    createTempRoom,
    joinTempRoom,
    expireRoom,
    toggleAnonymous
  };
}
