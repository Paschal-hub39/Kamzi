import { useState } from 'react';

const EMOJI_GROUPS = {
  recent: ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥'],
  faces: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘'],
  hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖'],
  hands: ['👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👋'],
  objects: ['🎉', '🎊', '🎁', '🎈', '🎀', '🕯️', '📌', '📍', '✂️', '🗑️', '🔒', '🔓', '🔑', '🗝️', '🔨', '🪛']
};

export default function ReactionPicker({ onSelect, onClose }) {
  const [activeGroup, setActiveGroup] = useState('recent');
  const [customSticker, setCustomSticker] = useState(null);

  return (
    <div className="bg-gray-800 rounded-2xl shadow-2xl p-3 w-64 border border-gray-700">
      {/* Tabs */}
      <div className="flex gap-1 mb-2 overflow-x-auto">
        {Object.keys(EMOJI_GROUPS).map(group => (
          <button
            key={group}
            onClick={() => setActiveGroup(group)}
            className={`px-2 py-1 rounded-lg text-xs capitalize ${
              activeGroup === group ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-white/5'
            }`}
          >
            {group}
          </button>
        ))}
      </div>

      {/* Emoji Grid */}
      <div className="grid grid-cols-8 gap-1 mb-2">
        {EMOJI_GROUPS[activeGroup].map(emoji => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg text-lg"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Custom Sticker Upload */}
      <div className="border-t border-gray-700 pt-2">
        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer hover:text-white">
          <span>📎</span>
          <span>Upload custom sticker</span>
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={(e) => {
              // Handle sticker upload
              const file = e.target.files[0];
              if (file) setCustomSticker(URL.createObjectURL(file));
            }}
          />
        </label>
        {customSticker && (
          <button 
            onClick={() => onSelect(customSticker)}
            className="mt-2 w-12 h-12 rounded-lg overflow-hidden"
          >
            <img src={customSticker} alt="custom" className="w-full h-full object-cover" />
          </button>
        )}
      </div>

      <button onClick={onClose} className="w-full mt-2 text-xs text-gray-500 hover:text-white">
        Close
      </button>
    </div>
  );
}
