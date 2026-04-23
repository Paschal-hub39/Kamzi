import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function SharedTodo({ chatId }) {
  const { user } = useAuth();
  const { getActiveTheme, themes } = useTheme();
  const [todos, setTodos] = useState([
    { id: '1', text: 'Buy snacks', done: false, assignee: 'Alex', dueDate: '2026-04-25' },
    { id: '2', text: 'Prepare playlist', done: true, assignee: 'Sam', dueDate: '2026-04-24' }
  ]);
  const [newTodo, setNewTodo] = useState('');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [showForm, setShowForm] = useState(false);

  const theme = getActiveTheme(chatId);
  const styles = themes[theme] || themes.dark;

  const addTodo = () => {
    if (!newTodo.trim()) return;
    setTodos(prev => [...prev, {
      id: `todo_${Date.now()}`,
      text: newTodo,
      done: false,
      assignee: assignee || 'Unassigned',
      dueDate: dueDate || null
    }]);
    setNewTodo('');
    setAssignee('');
    setDueDate('');
    setShowForm(false);
  };

  const toggleTodo = (id) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const isOverdue = (date) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold flex items-center gap-2">
          <span>✅</span>
          Shared To-Do
        </h4>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="text-xs text-violet-400 hover:text-violet-300"
        >
          + Add
        </button>
      </div>

      {showForm && (
        <div className="space-y-2 mb-3 p-3 bg-white/5 rounded-lg">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Task description..."
            className={`w-full px-3 py-2 rounded-lg ${styles.input} text-sm focus:outline-none focus:ring-2 focus:ring-violet-500`}
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="Assignee"
              className={`flex-1 px-3 py-2 rounded-lg ${styles.input} text-sm`}
            />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={`flex-1 px-3 py-2 rounded-lg ${styles.input} text-sm`}
            />
          </div>
          <button 
            onClick={addTodo}
            className="w-full py-2 bg-violet-600 rounded-lg text-sm hover:bg-violet-500"
          >
            Add Task
          </button>
        </div>
      )}

      <div className="space-y-2">
        {todos.map(todo => (
          <div 
            key={todo.id}
            className={`flex items-center gap-3 p-3 rounded-lg bg-white/5 ${
              isOverdue(todo.dueDate) && !todo.done ? 'border border-red-500/30' : ''
            }`}
          >
            <button
              onClick={() => toggleTodo(todo.id)}
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                todo.done ? 'bg-green-500 border-green-500' : 'border-gray-500'
              }`}
            >
              {todo.done && <span className="text-white text-xs">✓</span>}
            </button>
            
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${todo.done ? 'line-through text-gray-500' : ''}`}>
                {todo.text}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">
                  👤 {todo.assignee}
                </span>
                {todo.dueDate && (
                  <span className={`text-xs ${
                    isOverdue(todo.dueDate) && !todo.done ? 'text-red-400' : 'text-gray-500'
                  }`}>
                    📅 {new Date(todo.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
