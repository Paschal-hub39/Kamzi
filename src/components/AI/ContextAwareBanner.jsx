import { useContextAware } from '../../hooks/useContextAware';

export default function ContextAwareBanner() {
  const { detectedContext, dismissContext } = useContextAware();

  if (!detectedContext) return null;

  return (
    <div className="flex justify-center my-2 animate-fade-in">
      <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r ${detectedContext.color} text-white text-sm shadow-lg`}>
        <span>🎯</span>
        <span className="font-medium">
          This looks like a <strong>{detectedContext.type}</strong> conversation
        </span>
        <button 
          onClick={dismissContext}
          className="ml-2 text-white/70 hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
