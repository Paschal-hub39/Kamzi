import { createContext, useContext, useState, useCallback } from 'react';

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [mobileView, setMobileView] = useState('chats'); // 'chats' | 'chat' | 'profile' | 'settings'
  const [notifications, setNotifications] = useState([]);
  const [modals, setModals] = useState({});

  const addNotification = useCallback((notif) => {
    const id = Date.now() + Math.random();
    const newNotif = { id, type: 'info', duration: 5000, ...notif };
    setNotifications(prev => [...prev, newNotif]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, newNotif.duration);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const openModal = useCallback((name, props = {}) => {
    setModals(prev => ({ ...prev, [name]: { open: true, ...props } }));
  }, []);

  const closeModal = useCallback((name) => {
    setModals(prev => ({ ...prev, [name]: { ...prev[name], open: false } }));
  }, []);

  const isModalOpen = useCallback((name) => !!modals[name]?.open, [modals]);

  return (
    <UIContext.Provider value={{
      sidebarOpen,
      setSidebarOpen,
      rightPanelOpen,
      setRightPanelOpen,
      mobileView,
      setMobileView,
      notifications,
      addNotification,
      removeNotification,
      modals,
      openModal,
      closeModal,
      isModalOpen
    }}>
      {children}
    </UIContext.Provider>
  );
}

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within UIProvider');
  return context;
};

