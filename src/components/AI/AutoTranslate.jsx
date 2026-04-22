import { useState } from 'react';
import { useAI } from '../../contexts/AIContext';
import { useTheme } from '../../contexts/ThemeContext';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇧🇷' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' }
];

export default function AutoTranslate({ messageText, onTranslate }) {
  const { translateMessage, isProcessing } = useAI();
  const [targetLang, setTargetLang] = useState('en');
  const [translated, setTranslated] = useState(null);
  const [showLangs, setShowLangs] = useState(false);

  const handleTranslate = async () => {
    if (!messageText || targetLang === 'en') return;
    const result = await translateMessage(messageText, targetLang);
    setTranslated(result);
    onTranslate?.(result);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowLangs(!showLangs)}
        className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
      >
        <span>🌐</span>
        <span>Translate</span>
      </button>

      {showLangs && (
        <div className="absolute bottom-full mb-2 right-0 bg-gray-800 rounded-xl shadow-2xl p-3 w-48 border border-gray-700 z-50">
          <p className="text-xs text-gray-500 mb-2">Translate to:</p>
          <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => {
                  setTargetLang(lang.code);
                  setShowLangs(false);
                  handleTranslate();
                }}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${
                  targetLang === lang.code ? 'bg-violet-600 text-white' : 'hover:bg-white/5 text-gray-300'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {translated && (
        <div className="mt-1 text-xs text-gray-400 border-l-2 border-violet-500 pl-2">
          <span className="text-violet-400">Translated:</span> {translated}
        </div>
      )}

      {isProcessing && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <div className="w-3 h-3 border border-violet-500 border-t-transparent rounded-full animate-spin" />
          <span>Translating...</span>
        </div>
      )}
    </div>
  );
}
