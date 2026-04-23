import { useState, useEffect } from 'react';
import { usePrivacy } from '../../contexts/PrivacyContext';

const TIMER_OPTIONS = [
  { label: '5s', value: 5 },
  { label: '30s', value: 30 },
  { label: '1m', value: 60 },
  { label: '5m', value: 300 },
  { label: '1h', value: 3600 }
];

export default function SelfDestructTimer({ onSelect, selected }) {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        className={`p-2 rounded-full ${
          selected ? 'bg-yellow-500/20 text-yellow-400' : 'hover:bg-white/10 text-gray-400'
        }`}
        title="Self-destruct timer"
      >
        ⏳
      </button>

      {showOptions && (
        <div className="absolute bottom-full mb-2 right-0 bg-gray-800 rounded-xl shadow-2xl p-3 w-40 border border-gray-700 z-50">
          <p className="text-xs text-gray-500 mb-2">Self-destruct after:</p>
          <div className="grid grid-cols-2 gap-1">
            {TIMER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onSelect(opt.value); setShowOptions(false); }}
                className={`px-2 py-1.5 rounded-lg text-xs ${
                  selected === opt.value ? 'bg-yellow-500/20 text-yellow-400' : 'hover:bg-white/5 text-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {selected && (
            <button
              onClick={() => { onSelect(null); setShowOptions(false); }}
              className="w-full mt-2 py-1 text-xs text-red-400 hover:bg-red-500/10 rounded-lg"
            >
              Remove timer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
