import { useTheme } from '../../contexts/ThemeContext';

export default function ChatThemePicker({ chatId }) {
  const { getActiveTheme, setChatTheme, themes, allThemeKeys } = useTheme();
  const currentTheme = getActiveTheme(chatId);

  return (
    <div>
      <h4 className="font-semibold mb-3 flex items-center gap-2">
        <span>🎨</span>
        Chat Theme
      </h4>
      
      <div className="grid grid-cols-3 gap-2">
        {allThemeKeys.map(key => {
          const theme = themes[key];
          return (
            <button
              key={key}
              onClick={() => setChatTheme(chatId, key)}
              className={`p-3 rounded-xl text-center transition-all ${
                currentTheme === key 
                  ? 'ring-2 ring-violet-500 bg-white/10' 
                  : 'hover:bg-white/5'
              }`}
            >
              <div className={`w-8 h-8 rounded-full mx-auto mb-1 bg-gradient-to-br ${theme.bubbleMe}`} />
              <span className="text-xs">{theme.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
