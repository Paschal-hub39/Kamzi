import { useStreaks } from '../../hooks/useStreaks';

export default function StreakCounter({ contactId }) {
  const { getStreakStatus } = useStreaks();
  const { count, status } = getStreakStatus(contactId);

  if (count < 2) return null;

  const statusColors = {
    active: 'from-orange-500 to-red-500',
    at_risk: 'from-yellow-500 to-orange-500',
    broken: 'from-gray-500 to-gray-600'
  };

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r ${statusColors[status]} text-white text-xs`}>
      <span>🔥</span>
      <span className="font-bold">{count}</span>
      <span className="text-white/80">day streak</span>
      {status === 'at_risk' && <span className="ml-1">⚠️</span>}
    </div>
  );
}
