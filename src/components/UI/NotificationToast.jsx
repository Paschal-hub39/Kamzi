import { useUI } from '../../contexts/UIContext';

export default function NotificationToast() {
  const { notifications, removeNotification } = useUI();

  if (!notifications.length) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {notifications.map(notif => (
        <div
          key={notif.id}
          onClick={() => removeNotification(notif.id)}
          className={`pointer-events-auto px-4 py-3 rounded-xl shadow-2xl transform transition-all duration-300 animate-slide-in-right max-w-sm cursor-pointer ${
            notif.type === 'error' ? 'bg-red-600' :
            notif.type === 'success' ? 'bg-green-600' :
            notif.type === 'warning' ? 'bg-yellow-600' :
            'bg-violet-600'
          } text-white border border-white/10`}
        >
          <div className="flex items-start gap-3">
            <span className="text-lg">
              {notif.type === 'error' ? '❌' :
               notif.type === 'success' ? '✅' :
               notif.type === 'warning' ? '⚠️' : 'ℹ️'}
            </span>
            <div className="flex-1">
              <p className="font-medium text-sm">{notif.title}</p>
              {notif.message && (
                <p className="text-xs opacity-90 mt-0.5">{notif.message}</p>
              )}
            </div>
            <button className="text-white/60 hover:text-white">✕</button>
          </div>
          
          {/* Progress bar */}
          <div className="mt-2 h-0.5 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white/60 rounded-full animate-shrink"
              style={{ animationDuration: `${notif.duration}ms` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
