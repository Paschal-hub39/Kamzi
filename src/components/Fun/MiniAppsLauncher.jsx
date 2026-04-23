import { useState } from 'react';
import { useMiniApps } from '../../hooks/useMiniApps';

export default function MiniAppsLauncher({ chatId }) {
  const { createPoll, createForm, createCountdown } = useMiniApps(chatId);
  const [showMenu, setShowMenu] = useState(false);
  const [activeForm, setActiveForm] = useState(null);

  const handlePoll = async () => {
    const question = prompt('Poll question:');
    if (!question) return;
    const options = [];
    for (let i = 0; i < 4; i++) {
      const opt = prompt(`Option ${i + 1} (leave empty to finish):`);
      if (!opt) break;
      options.push(opt);
    }
    if (options.length < 2) return;
    await createPoll(question, options);
    setShowMenu(false);
  };

  const handleCountdown = async () => {
    const title = prompt('Countdown title:');
    if (!title) return;
    const dateStr = prompt('Target date (YYYY-MM-DD HH:MM):');
    if (!dateStr) return;
    const target = new Date(dateStr);
    if (isNaN(target)) return;
    await createCountdown(title, target);
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 rounded-full hover:bg-white/10 text-gray-400"
      >
        📎
      </button>

      {showMenu && (
        <div className="absolute bottom-full mb-2 left-0 bg-gray-800 rounded-xl shadow-2xl p-3 w-48 border border-gray-700 z-50">
          <p className="text-xs text-gray-500 mb-2">Mini Apps</p>
          
          <button
            onClick={handlePoll}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-left text-sm"
          >
            <span>📊</span>
            <span>Poll</span>
          </button>
          
          <button
            onClick={() => setActiveForm('form')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-left text-sm"
          >
            <span>📝</span>
            <span>Form</span>
          </button>
          
          <button
            onClick={handleCountdown}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-left text-sm"
          >
            <span>⏳</span>
            <span>Countdown</span>
          </button>
        </div>
      )}
    </div>
  );
}

