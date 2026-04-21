// In-chat games data & logic

export const triviaQuestions = [
  { q: 'What planet is known as the Red Planet?', a: 'Mars', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'] },
  { q: 'What is the largest ocean on Earth?', a: 'Pacific', options: ['Atlantic', 'Indian', 'Pacific', 'Arctic'] },
  { q: 'Who painted the Mona Lisa?', a: 'Leonardo da Vinci', options: ['Michelangelo', 'Leonardo da Vinci', 'Raphael', 'Donatello'] },
  { q: 'What is the smallest prime number?', a: '2', options: ['0', '1', '2', '3'] },
  { q: 'In which year did the Titanic sink?', a: '1912', options: ['1905', '1912', '1918', '1923'] },
  { q: 'What is the chemical symbol for gold?', a: 'Au', options: ['Ag', 'Au', 'Fe', 'Cu'] },
  { q: 'Which country has the most natural lakes?', a: 'Canada', options: ['USA', 'Russia', 'Canada', 'Brazil'] },
  { q: 'What is the hardest natural substance?', a: 'Diamond', options: ['Gold', 'Iron', 'Diamond', 'Platinum'] }
];

export const darePrompts = [
  'Send a voice note saying "I love pineapple on pizza" 🍕',
  'Change your vibe status to something embarrassing for 10 minutes',
  'Send your last screenshot (if safe!) 📸',
  'Type your next message with your eyes closed',
  'Send a sticker that perfectly describes your mood right now',
  'Record a 5-second voice note of your best evil laugh 😈',
  'Send a compliment to the person above you in the chat',
  'Share your most-used emoji and explain why'
];

export const getRandomTrivia = () => {
  const q = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
  const shuffled = [...q.options].sort(() => Math.random() - 0.5);
  return { ...q, options: shuffled };
};

export const getRandomDare = () => {
  return darePrompts[Math.floor(Math.random() * darePrompts.length)];
};

// Simple Ludo game state (lightweight)
export const createLudoGame = (players) => ({
  id: `ludo_${Date.now()}`,
  players,
  currentTurn: 0,
  board: Array(4).fill(Array(4).fill(0)), // 4 players, 4 pieces each
  status: 'waiting'
});

