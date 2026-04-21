import { useState, useCallback } from 'react';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export function useMiniApps(chatId) {
  const [activeMiniApp, setActiveMiniApp] = useState(null);
  const [miniAppData, setMiniAppData] = useState(null);

  const launchMiniApp = useCallback(async (appType, initialData = {}) => {
    const appId = `mini_${Date.now()}`;
    const miniApp = {
      id: appId,
      type: appType,
      data: initialData,
      createdAt: serverTimestamp(),
      responses: []
    };

    await setDoc(doc(db, 'chats', chatId, 'miniApps', appId), miniApp);
    setActiveMiniApp(appType);
    setMiniAppData(miniApp);
    return miniApp;
  }, [chatId]);

  const createPoll = useCallback(async (question, options) => {
    return launchMiniApp('poll', {
      question,
      options: options.map(opt => ({ text: opt, votes: 0, voters: [] })),
      totalVotes: 0,
      closed: false
    });
  }, [launchMiniApp]);

  const createForm = useCallback(async (title, fields) => {
    return launchMiniApp('form', {
      title,
      fields: fields.map(f => ({ label: f, type: 'text', required: false })),
      responses: []
    });
  }, [launchMiniApp]);

  const createCountdown = useCallback(async (title, targetDate) => {
    return launchMiniApp('countdown', {
      title,
      targetDate: targetDate.toISOString(),
      started: true
    });
  }, [launchMiniApp]);

  const votePoll = useCallback(async (appId, optionIndex, userId) => {
    const appRef = doc(db, 'chats', chatId, 'miniApps', appId);
    const snap = await getDoc(appRef);
    if (!snap.exists()) return;

    const data = snap.data().data;
    const option = data.options[optionIndex];
    
    if (option.voters.includes(userId)) return; // Already voted

    option.votes += 1;
    option.voters.push(userId);
    data.totalVotes += 1;

    await updateDoc(appRef, { data });
  }, [chatId]);

  const submitForm = useCallback(async (appId, responses) => {
    const appRef = doc(db, 'chats', chatId, 'miniApps', appId);
    await updateDoc(appRef, {
      'data.responses': [...(miniAppData?.data.responses || []), responses]
    });
  }, [chatId, miniAppData]);

  const closeMiniApp = useCallback(() => {
    setActiveMiniApp(null);
    setMiniAppData(null);
  }, []);

  return {
    activeMiniApp,
    miniAppData,
    launchMiniApp,
    createPoll,
    createForm,
    createCountdown,
    votePoll,
    submitForm,
    closeMiniApp
  };
}
