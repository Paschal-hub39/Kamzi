import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { storage } from '../../firebase';

export default function FileHub({ chatId }) {
  const { user } = useAuth();
  const { getActiveTheme, themes } = useTheme();
  const [files, setFiles] = useState([
    { id: '1', name: 'trip_itinerary.pdf', size: '2.4 MB', type: 'pdf', url: '#', uploadedBy: 'Alex', date: '2026-04-20' },
    { id: '2', name: 'budget_sheet.xlsx', size: '156 KB', type: 'sheet', url: '#', uploadedBy: 'Sam', date: '2026-04-21' },
    { id: '3', name: 'hotel_booking.png', size: '1.1 MB', type: 'image', url: '#', uploadedBy: 'You', date: '2026-04-22' }
  ]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const theme = getActiveTheme(chatId);
  const styles = themes[theme] || themes.dark;

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    
    try {
      const storageRef = ref(storage, `chats/${chatId}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      setFiles(prev => [...prev, {
        id: `file_${Date.now()}`,
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        type: file.type.split('/')[0],
        url,
        uploadedBy: user?.displayName || 'You',
        date: new Date().toISOString().split('T')[0]
      }]);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleUpload(file);
  };

  const fileIcons = {
    pdf: '📄',
    image: '🖼️',
    video: '🎬',
    audio: '🎵',
    sheet: '📊',
    default: '📎'
  };

  return (
    <div className="mb-4">
      <h4 className="font-semibold mb-3 flex items-center gap-2">
        <span>📁</span>
        File Hub
      </h4>

      <div 
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-4 text-center mb-3 transition-colors ${
          dragOver ? 'border-violet-500 bg-violet-500/10' : 'border-gray-700'
        }`}
      >
        <p className="text-sm text-gray-400">
          {uploading ? 'Uploading...' : 'Drop files here or click to upload'}
        </p>
        <input
          type="file"
          onChange={(e) => handleUpload(e.target.files[0])}
          className="hidden"
          id={`file-upload-${chatId}`}
        />
        <label 
          htmlFor={`file-upload-${chatId}`}
          className="inline-block mt-2 px-4 py-2 bg-white/5 rounded-lg text-sm cursor-pointer hover:bg-white/10"
        >
          Select File
        </label>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {files.map(file => (
          <a
            key={file.id}
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
          >
            <span className="text-2xl">{fileIcons[file.type] || fileIcons.default}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate group-hover:text-violet-400 transition-colors">{file.name}</p>
              <p className="text-xs text-gray-500">
                {file.size} • {file.uploadedBy} • {file.date}
              </p>
            </div>
            <span className="text-gray-500 group-hover:text-white">⬇️</span>
          </a>
        ))}
      </div>
    </div>
  );
}
