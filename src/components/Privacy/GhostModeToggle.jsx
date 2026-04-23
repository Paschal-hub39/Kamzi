import { usePrivacy } from '../../contexts/PrivacyContext';

export default function GhostModeToggle() {
  const { ghostMode, toggleGhostMode } = usePrivacy();

  return (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
      <div className="flex items-center gap-3">
        <span className="text-2xl">👻</span>
        <div>
          <h4 className="font-medium">Ghost Mode</h4>
          <p className="text-xs text-gray-400">
            {ghostMode 
              ? 'Hidden from online status & read receipts' 
              : 'Others can see when you read messages'}
          </p>
        </div>
      </div>
      
      <button
        onClick={toggleGhostMode}
        className={`relative w-14 h-8 rounded-full transition-colors ${
          ghostMode ? 'bg-violet-600' : 'bg-gray-600'
        }`}
      >
        <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform ${
          ghostMode ? 'translate-x-7' : 'translate-x-1'
        }`} />
      </button>
    </div>
  );
}

