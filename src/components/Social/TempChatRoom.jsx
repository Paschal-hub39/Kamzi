import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useTempRoom } from '../../hooks/useTempRoom';
import { useAnonymousMode } from '../../hooks/useAnonymousMode';

export default function TempRoomsList() {
  const { user } = useAuth();
  const { tempRooms, createTempRoom, joinTempRoom, activeRoom, setActiveRoom, toggleAnonymous } = useTempRoom();
  const { getActiveTheme, themes } = useTheme();
  const [showCreate, setShowCreate] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [duration, setDuration] = useState(24);
  const [maxUsers, setMaxUsers] = useState(50);

  const theme = getActiveTheme();
  const styles = themes[theme] || themes.dark;

  const handleCreate = async () => {
    if (!newRoomName.trim()) return;
    const roomId = await createTempRoom(newRoomName, duration, maxUsers);
    setNewRoomName('');
    setShowCreate(false);
  };

  const formatRemaining = (expiresAt) => {
    if (!expiresAt) return 'Expired';
    const diff = expiresAt - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${mins}m left`;
  };

  return (
    <div className={`h-screen flex flex-col ${styles.bg} ${styles.text}`}>
      {/* Header */}
      <div className={`${styles.surface} border-b ${styles.border} px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span>⏳</span>
              Temporary Rooms
            </h1>
            <p className={`text-sm ${styles.textMuted} mt-1`}>
              Chats that disappear after a set time
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full font-medium hover:opacity-90"
          >
            + Create Room
          </button>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className={`${styles.surface} rounded-2xl max-w-md w-full p-6 border ${styles.border}`}>
            <h3 className="text-lg font-bold mb-4">Create Temp Room</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Room Name</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g., Friday Night Plans"
                  className={`w-full px-4 py-2 rounded-lg ${styles.input} focus:outline-none focus:ring-2 focus:ring-violet-500`}
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">
                  Duration: {duration} hours
                </label>
                <input
                  type="range"
                  min="1"
                  max="72"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full accent-violet-500"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1h</span>
                  <span>24h</span>
                  <span>72h</span>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">Max Participants</label>
                <div className="flex gap-2">
                  {[10, 25, 50, 100].map(n => (
                    <button
                      key={n}
                      onClick={() => setMaxUsers(n)}
                      className={`px-3 py-1 rounded-lg text-sm ${
                        maxUsers === n ? 'bg-violet-600 text-white' : 'bg-white/5 text-gray-400'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:opacity-90"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rooms List */}
      <div className="flex-1 overflow-y-auto p-6">
        {tempRooms.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">⏳</div>
            <h3 className="text-xl font-semibold mb-2">No active temp rooms</h3>
            <p className={styles.textMuted}>Create one to start a disappearing conversation</p>
          </div>
        ) : (
          <div className="grid gap-4 max-w-2xl">
            {tempRooms.map(room => (
              <div
                key={room.id}
                onClick={() => setActiveRoom(room)}
                className={`${styles.surface} rounded-xl p-4 border ${styles.border} hover:border-violet-500/50 cursor-pointer transition-all`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">{room.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    room.anonymousMode ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'
                  }`}>
                    {room.anonymousMode ? '👻 Anonymous' : '👤 Public'}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>👥 {room.participants?.length || 0}/{room.maxParticipants}</span>
                  <span className="text-yellow-400">⏱️ {formatRemaining(room.remainingTime)}</span>
                  <span>📅 {new Date(room.createdAt?.toDate?.()).toLocaleDateString()}</span>
                </div>

                {activeRoom?.id === room.id && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <TempRoomChat room={room} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TempRoomChat({ room }) {
  const { user } = useAuth();
  const { anonymousId, generateAnonymousIdentity } = useAnonymousMode();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (room.anonymousMode && !anonymousId) {
      generateAnonymousIdentity();
    }
  }, [room.anonymousMode]);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg = {
      id: Date.now(),
      text: input,
      sender: room.anonymousMode ? anonymousId?.name : user?.displayName,
      avatar: room.anonymousMode ? anonymousId?.avatar : user?.photoURL,
      timestamp: new Date(),
      isAnonymous: room.anonymousMode
    };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
  };

  return (
    <div className="space-y-3">
      <div className="h-48 overflow-y-auto space-y-2 bg-black/20 rounded-lg p-3">
        {messages.map(msg => (
          <div key={msg.id} className="flex items-start gap-2">
            <span className="text-lg">{msg.avatar || '👤'}</span>
            <div>
              <span className="text-xs text-violet-400 font-medium">{msg.sender}</span>
              <p className="text-sm">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-gray-700 focus:outline-none focus:border-violet-500 text-sm"
        />
        <button 
          onClick={handleSend}
          className="px-4 py-2 bg-violet-600 rounded-lg hover:bg-violet-500"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
