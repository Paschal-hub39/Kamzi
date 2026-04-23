import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useVibeStatus } from '../../hooks/useVibeStatus';
import { useTheme } from '../../contexts/ThemeContext';
import VibeStatusComposer from '../Social/VibeStatus';
import GhostModeToggle from '../Privacy/GhostModeToggle';

export default function ProfilePage() {
  const { user, userProfile, logout, updateUserProfile } = useAuth();
  const { myVibe } = useVibeStatus();
  const { getActiveTheme, themes } = useTheme();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');

  const theme = getActiveTheme();
  const styles = themes[theme] || themes.dark;

  const handleSave = async () => {
    await updateUserProfile({ displayName });
    setEditing(false);
  };

  return (
    <div className={`min-h-screen ${styles.bg} ${styles.text}`}>
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className={`${styles.surface} rounded-2xl p-6 border ${styles.border} mb-6`}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-4xl font-bold">
              {user?.displayName?.[0] || 'K'}
            </div>
            <div className="flex-1">
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className={`px-3 py-2 rounded-lg ${styles.input} text-lg font-bold`}
                  />
                  <button onClick={handleSave} className="text-green-400">✓</button>
                  <button onClick={() => setEditing(false)} className="text-red-400">✕</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{user?.displayName || 'Kamzi User'}</h1>
                  <button onClick={() => setEditing(true)} className="text-gray-500 hover:text-white">✏️</button>
                </div>
              )}
              <p className={styles.textMuted}>{user?.email}</p>
              {myVibe && (
                <div className="mt-2">
                  <VibeStatusComposer />
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-xl bg-white/5">
              <p className="text-2xl font-bold">128</p>
              <p className="text-xs text-gray-500">Chats</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5">
              <p className="text-2xl font-bold">42</p>
              <p className="text-xs text-gray-500">Streaks</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5">
              <p className="text-2xl font-bold">7</p>
              <p className="text-xs text-gray-500">Days Active</p>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className={`${styles.surface} rounded-2xl p-6 border ${styles.border} mb-6`}>
          <h2 className="text-lg font-bold mb-4">🔐 Privacy</h2>
          <GhostModeToggle />
        </div>

        {/* Preferences */}
        <div className={`${styles.surface} rounded-2xl p-6 border ${styles.border}`}>
          <h2 className="text-lg font-bold mb-4">⚙️ Preferences</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Notifications</p>
                <p className="text-xs text-gray-500">Push alerts for messages</p>
              </div>
              <button className="w-12 h-6 bg-violet-600 rounded-full relative">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto-Translate</p>
                <p className="text-xs text-gray-500">Real-time message translation</p>
              </div>
              <button className="w-12 h-6 bg-gray-600 rounded-full relative">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
              </button>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full mt-6 py-3 bg-red-600/20 border border-red-600/50 text-red-400 rounded-xl hover:bg-red-600/30"
        >
          🚪 Log Out
        </button>
      </div>
    </div>
  );
}
