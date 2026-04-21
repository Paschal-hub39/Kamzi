import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { useUI } from '../../contexts/UIContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useStreaks } from '../../hooks/useStreaks';
import { useVibeStatus } from '../../hooks/useVibeStatus';

export default function Sidebar({ mobile }) {
  const { user, userProfile, logout } = useAuth();
  const { chatsList, activeChat, setActiveChat, unreadCounts } = useChat();
  const { setMobileView, addNotification } = useUI();
  const { getActiveTheme, themes } = useTheme();
  const { getStreakStatus } = useStreaks();
  const { myVibe } = useVibeStatus();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all | groups | temp

  const theme = getActiveTheme(activeChat?.id);
  const styles = themes[theme] || themes.dark;

  const filteredChats = chatsList.filter(chat => {
    const matchesSearch = (chat.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' ? true : 
      filter === 'groups' ? chat.isGroup : 
      filter === 'temp' ? chat.isTemp : true;
    return matchesSearch && matchesFilter;
  });

  const handleChatSelect = (chat) => {
    setActiveChat(chat);
    if (mobile) setMobileView('chat');
  };

  return (
    <div className={`h-full flex flex-col ${styles.surface} border-r ${styles.border}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-lg font-bold">
              {user?.displayName?.[0] || 'K'}
            </div>
            <div>
              <h2 className="font-bold">{user?.displayName || 'Kamzi User'}</h2>
              {myVibe && (
                <p className="text-xs text-violet-400 flex items-center gap-1">
                  {myVibe.emoji} {myVibe.text}
                </p>
              )}
            </div>
          </div>
          <button 
            onClick={() => addNotification({ title: 'Settings', message: 'Opening settings...' })}
            className="p-2 rounded-full hover:bg-white/10"
          >
            ⚙️
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full px-4 py-2 rounded-full ${styles.input} text-sm focus:outline-none focus:ring-2 focus:ring-violet-500`}
          />
          <span className="absolute right-3 top-2.5 text-gray-500">🔍</span>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-3">
          {['all', 'groups', 'temp'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs capitalize ${
                filter === f ? 'bg-violet-600 text-white' : 'bg-white/10 text-gray-400'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.map(chat => {
          const streak = getStreakStatus(chat.id);
          const unread = unreadCounts[chat.id] || 0;
          
          return (
            <button
              key={chat.id}
              onClick={() => handleChatSelect(chat)}
              className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors ${
                activeChat?.id === chat.id ? 'bg-white/10 border-l-2 border-violet-500' : ''
              }`}
            >
              <div className="relative flex-shrink-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg ${
                  chat.isGroup 
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-500' 
                    : 'bg-gradient-to-br from-violet-500 to-purple-600'
                }`}>
                  {(chat.name || chat.groupName || '?')[0]}
                </div>
                {chat.online && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900" />
                )}
              </div>
              
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium truncate">{chat.name || chat.groupName || 'Unknown'}</h4>
                  <span className="text-xs text-gray-500">
                    {chat.lastMessageTime?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className={`text-sm truncate ${unread > 0 ? 'text-white font-medium' : 'text-gray-400'}`}>
                    {chat.lastMessage || 'No messages'}
                  </p>
                  <div className="flex items-center gap-1">
                    {streak.count > 2 && (
                      <span className="text-xs" title={`${streak.count} day streak`}>🔥{streak.count}</span>
                    )}
                    {unread > 0 && (
                      <span className="bg-violet-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-700/50 flex justify-around">
        <button onClick={() => {}} className="p-2 rounded-full hover:bg-white/10" title="New Chat">✏️</button>
        <button onClick={() => {}} className="p-2 rounded-full hover:bg-white/10" title="Voice Rooms">🎙️</button>
        <button onClick={() => {}} className="p-2 rounded-full hover:bg-white/10" title="Temp Rooms">⏳</button>
        <button onClick={logout} className="p-2 rounded-full hover:bg-white/10" title="Logout">🚪</button>
      </div>
    </div>
  );
}
