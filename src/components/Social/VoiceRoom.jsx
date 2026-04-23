import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { createPeerConnection, getLocalStream } from '../../api/voice';

export default function VoiceRooms() {
  const { user } = useAuth();
  const { getActiveTheme, themes } = useTheme();
  const [rooms, setRooms] = useState([
    { id: '1', name: 'Chill Vibes 🎵', participants: 12, topic: 'Music & Life' },
    { id: '2', name: 'Tech Talk 💻', participants: 8, topic: 'AI & Future' },
    { id: '3', name: 'Late Night 🌙', participants: 23, topic: 'Open mic' }
  ]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const peerConnections = useRef({});

  const theme = getActiveTheme();
  const styles = themes[theme] || themes.dark;

  const joinRoom = async (room) => {
    try {
      const stream = await getLocalStream();
      setLocalStream(stream);
      setActiveRoom(room);
      
      // In production: connect to signaling server, create WebRTC mesh
      // This is a simplified version
      
    } catch (err) {
      console.error('Failed to join voice room:', err);
    }
  };

  const leaveRoom = () => {
    localStream?.getTracks().forEach(t => t.stop());
    Object.values(peerConnections.current).forEach(pc => pc.close());
    setLocalStream(null);
    setActiveRoom(null);
    setPeers({});
  };

  const toggleMute = () => {
    localStream?.getAudioTracks().forEach(t => {
      t.enabled = isMuted;
    });
    setIsMuted(!isMuted);
  };

  if (activeRoom) {
    return (
      <div className={`h-screen flex flex-col ${styles.bg} ${styles.text}`}>
        {/* Room Header */}
        <div className={`${styles.surface} border-b ${styles.border} px-6 py-4`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span>🎙️</span>
                {activeRoom.name}
              </h1>
              <p className={`text-sm ${styles.textMuted}`}>{activeRoom.topic}</p>
            </div>
            <button
              onClick={leaveRoom}
              className="px-4 py-2 bg-red-600 rounded-full hover:bg-red-500"
            >
              Leave Room
            </button>
          </div>
        </div>

        {/* Participants Grid */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {/* Self */}
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex flex-col items-center justify-center relative">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl">
                {user?.displayName?.[0] || '👤'}
              </div>
              <p className="mt-3 font-medium">You</p>
              <p className="text-xs text-white/60">{isMuted ? '🔇 Muted' : '🎤 Live'}</p>
              
              {isMuted && (
                <div className="absolute top-3 right-3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  🔇
                </div>
              )}
            </div>

            {/* Mock participants */}
            {Array.from({ length: activeRoom.participants - 1 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-white/5 flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-3xl">
                  {String.fromCharCode(65 + i)}
                </div>
                <p className="mt-3 font-medium">User {i + 1}</p>
                <p className="text-xs text-gray-400">🎤 Live</p>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className={`${styles.surface} border-t ${styles.border} px-6 py-4`}>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={toggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${
                isMuted ? 'bg-red-600' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {isMuted ? '🔇' : '🎤'}
            </button>
            
            <button
              onClick={() => setIsDeafened(!isDeafened)}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${
                isDeafened ? 'bg-red-600' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {isDeafened ? '🎧' : '🔊'}
            </button>

            <button className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-2xl">
              ✋
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col ${styles.bg} ${styles.text}`}>
      <div className={`${styles.surface} border-b ${styles.border} px-6 py-4`}>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span>🎙️</span>
          Voice Rooms
        </h1>
        <p className={`text-sm ${styles.textMuted} mt-1`}>Join live audio conversations</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid gap-4 max-w-2xl">
          {rooms.map(room => (
            <div
              key={room.id}
              className={`${styles.surface} rounded-xl p-5 border ${styles.border} hover:border-violet-500/50 transition-all`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{room.name}</h3>
                  <p className={`text-sm ${styles.textMuted} mt-1`}>{room.topic}</p>
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
                    <span>👥 {room.participants} listening</span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Live
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => joinRoom(room)}
                  className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full font-medium hover:opacity-90"
                >
                  Join Room
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
