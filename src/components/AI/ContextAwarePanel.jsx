import { useContextAware } from '../../hooks/useContextAware';
import { useTheme } from '../../contexts/ThemeContext';

export default function ContextAwarePanel({ context, tools }) {
  const { activateTool, dismissContext } = useContextAware();
  const { getActiveTheme, themes } = useTheme();
  const theme = getActiveTheme();
  const styles = themes[theme] || themes.dark;

  if (!context) return null;

  return (
    <div className={`mb-4 p-4 rounded-xl bg-gradient-to-r ${context.color} bg-opacity-10 border border-white/10`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-bold text-white flex items-center gap-2">
            <span>🎯</span>
            Context Detected: {context.type.charAt(0).toUpperCase() + context.type.slice(1)}
          </h4>
          <p className="text-sm text-white/80 mt-1">{context.suggestion}</p>
        </div>
        <button 
          onClick={dismissContext}
          className="text-white/60 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {tools.map((tool, index) => (
          <button
            key={index}
            onClick={() => activateTool(tool.action)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm text-white"
          >
            <span>{tool.icon}</span>
            <span>{tool.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
