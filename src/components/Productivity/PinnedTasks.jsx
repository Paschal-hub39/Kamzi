import { useState } from 'react';
import { doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { useTheme } from '../../contexts/ThemeContext';
import { db } from '../../firebase';

export default function PinnedTasks({ chatId }) {
  const { user } = useAuth();
  const { activeChat } = useChat();
  const { getActiveTheme, themes } = useTheme();
  const [tasks, setTasks] = useState([
    { id: '1', text: 'Book flight tickets', done: false, priority: 'high', assignedTo: null },
    { id: '2', text: 'Reserve hotel', done: true, priority: 'medium', assignedTo: null }
  ]);
  const [newTask, setNewTask] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const theme = getActiveTheme(chatId);
  const styles = themes[theme] || themes.dark;

  const addTask = async () => {
    if (!newTask.trim()) return;
    const task = {
      id: `task_${Date.now()}`,
      text: newTask,
      done: false,
      priority: 'medium',
      createdBy: user?.uid,
      createdAt: serverTimestamp(),
      assignedTo: null
    };
    setTasks(prev => [...prev, task]);
    setNewTask('');
    setShowAdd(false);
  };

  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const priorityColors = {
    high: 'text-red-400 border-red-500/30',
    medium: 'text-yellow-400 border-yellow-500/30',
    low: 'text-green-400 border-green-500/30'
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold flex items-center gap-2">
          <span>📌</span>
          Pinned Tasks
        </h4>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="text-xs text-violet-400 hover:text-violet-300"
        >
          + Add
        </button>
      </div>

      {showAdd && (
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="New task..."
            className={`flex-1 px-3 py-2 rounded-lg ${styles.input} text-sm focus:outline-none focus:ring-2 focus:ring-violet-500`}
          />
          <button onClick={addTask} className="px-3 py-2 bg-violet-600 rounded-lg hover:bg-violet-500">
            ✓
          </button>
        </div>
      )}

      <div className="space-y-2">
        {tasks.map(task => (
          <div 
            key={task.id}
            className={`flex items-center gap-3 p-3 rounded-lg bg-white/5 border ${task.done ? 'border-white/5 opacity-50' : priorityColors[task.priority]}`}
          >
            <button
              onClick={() => toggleTask(task.id)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                task.done ? 'bg-green-500 border-green-500' : 'border-gray-500'
              }`}
            >
              {task.done && <span className="text-white text-xs">✓</span>}
            </button>
            
            <span className={`flex-1 text-sm ${task.done ? 'line-through text-gray-500' : ''}`}>
              {task.text}
            </span>

            {task.assignedTo && (
              <span className="text-xs bg-white/10 px-2 py-1 rounded-full">
                👤 {task.assignedTo}
              </span>
            )}

            <button 
              onClick={() => deleteTask(task.id)}
              className="text-gray-500 hover:text-red-400"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      {tasks.length > 0 && (
        <div className="mt-2 text-xs text-gray-500 flex justify-between">
          <span>{tasks.filter(t => t.done).length}/{tasks.length} done</span>
          <span>{Math.round((tasks.filter(t => t.done).length / tasks.length) * 100)}%</span>
        </div>
      )}
    </div>
  );
}
