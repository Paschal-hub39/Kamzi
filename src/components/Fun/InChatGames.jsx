import { useState } from 'react';
import { getRandomTrivia, getRandomDare, createLudoGame } from '../../api/games';

export default function InChatGames({ onClose }) {
  const [activeGame, setActiveGame] = useState(null);
  const [trivia, setTrivia] = useState(null);
  const [dare, setDare] = useState(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);

  const startTrivia = () => {
    setTrivia(getRandomTrivia());
    setAnswered(false);
    setActiveGame('trivia');
  };

  const startDare = () => {
    setDare(getRandomDare());
    setActiveGame('dare');
  };

  const answerTrivia = (option) => {
    if (answered) return;
    setAnswered(true);
    if (option === trivia.a) {
      setScore(s => s + 1);
    }
  };

  if (activeGame === 'trivia') {
    return (
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold">🎯 Trivia</h4>
          <span className="text-sm text-violet-400">Score: {score}</span>
        </div>
        
        <p className="text-sm mb-3">{trivia.q}</p>
        
        <div className="space-y-2">
          {trivia.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => answerTrivia(opt)}
              disabled={answered}
              className={`w-full p-2 rounded-lg text-sm text-left ${
                answered 
                  ? opt === trivia.a 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        {answered && (
          <button 
            onClick={startTrivia}
            className="w-full mt-3 py-2 bg-violet-600 rounded-lg text-sm hover:bg-violet-500"
          >
            Next Question
          </button>
        )}
        
        <button onClick={onClose} className="w-full mt-2 text-xs text-gray-500 hover:text-white">
          Close
        </button>
      </div>
    );
  }

  if (activeGame === 'dare') {
    return (
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 text-center">
        <h4 className="font-bold mb-3">😈 Dare</h4>
        <p className="text-sm mb-4">{dare}</p>
        <div className="flex gap-2">
          <button 
            onClick={startDare}
            className="flex-1 py-2 bg-violet-600 rounded-lg text-sm hover:bg-violet-500"
          >
            New Dare
          </button>
          <button 
            onClick={onClose}
            className="flex-1 py-2 bg-white/5 rounded-lg text-sm hover:bg-white/10"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <h4 className="font-bold mb-3">🎮 Games</h4>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={startTrivia}
          className="p-3 rounded-lg bg-white/5 hover:bg-white/10 text-center"
        >
          <span className="text-2xl block mb-1">🎯</span>
          <span className="text-sm">Trivia</span>
        </button>
        <button
          onClick={startDare}
          className="p-3 rounded-lg bg-white/5 hover:bg-white/10 text-center"
        >
          <span className="text-2xl block mb-1">😈</span>
          <span className="text-sm">Dare</span>
        </button>
        <button
          onClick={() => setActiveGame('ludo')}
          className="p-3 rounded-lg bg-white/5 hover:bg-white/10 text-center opacity-50 cursor-not-allowed"
        >
          <span className="text-2xl block mb-1">🎲</span>
          <span className="text-sm">Ludo</span>
        </button>
        <button
          onClick={onClose}
          className="p-3 rounded-lg bg-white/5 hover:bg-white/10 text-center"
        >
          <span className="text-2xl block mb-1">✕</span>
          <span className="text-sm">Close</span>
        </button>
      </div>
    </div>
  );
}
