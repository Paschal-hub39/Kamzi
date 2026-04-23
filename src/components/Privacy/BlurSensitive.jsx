import { useState } from 'react';

export default function BlurSensitive({ children, isSensitive, onReveal }) {
  const [revealed, setRevealed] = useState(false);

  if (!isSensitive || revealed) {
    return children;
  }

  return (
    <div 
      className="relative cursor-pointer select-none"
      onClick={() => { setRevealed(true); onReveal?.(); }}
    >
      <div className="blur-lg brightness-50 pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <span className="text-3xl">🔒</span>
          <p className="text-sm text-gray-300 mt-2">Tap to reveal</p>
          <p className="text-xs text-gray-500">Sensitive content</p>
        </div>
      </div>
    </div>
  );
}
