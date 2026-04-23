import { usePrivacy } from '../../contexts/PrivacyContext';

export default function ScreenshotOverlay() {
  const { screenshotDetected } = usePrivacy();

  if (!screenshotDetected) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-pulse">
      <div className="text-center max-w-md px-6">
        <div className="text-8xl mb-6 animate-bounce">📸⚠️</div>
        <h2 className="text-3xl font-bold text-white mb-4">Screenshot Detected!</h2>
        <p className="text-gray-300 text-lg mb-2">
          This conversation is protected by end-to-end encryption.
        </p>
        <p className="text-red-400 font-medium">
          The other participants have been notified.
        </p>
        <div className="mt-8 flex justify-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
          <div className="w-3 h-3 bg-red-500 rounded-full animate-ping delay-100" />
          <div className="w-3 h-3 bg-red-500 rounded-full animate-ping delay-200" />
        </div>
      </div>
    </div>
  );
}

