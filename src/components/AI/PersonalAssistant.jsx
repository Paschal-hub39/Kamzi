import { useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAI } from '../../contexts/AIContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function PersonalAssistant() {
  const { activeChat, sendMessage } = useChat();
  const { handleSlashCommand, isProcessing } = useAI();
  const { getActiveTheme, themes } = useTheme();
  const [activeTool, setActiveTool] = useState(null);
  const [toolData, setToolData] = useState(null);

  const theme = getActiveTheme(activeChat?.id);
  const styles = themes[theme] || themes.dark;

  const tools = [
    { 
      id: 'plan', 
      command: '/plan',
      icon: '📅', 
      name: 'Event Planner',
      placeholder: 'What event are you planning?',
      fields: ['Event name', 'Date', 'Location', 'Budget']
    },
    { 
      id: 'study', 
      command: '/study',
      icon: '📚', 
      name: 'Study Assistant',
      placeholder: 'What subject are you studying?',
      fields: ['Subject', 'Topic', 'Difficulty level']
    },
    { 
      id: 'trip', 
      command: '/trip',
      icon: '✈️', 
      name: 'Trip Planner',
      placeholder: 'Where do you want to go?',
      fields: ['Destination', 'Duration', 'Budget', 'Travelers']
    },
    { 
      id: 'budget', 
      command: '/budget',
      icon: '💰', 
      name: 'Budget Tool',
      placeholder: 'What do you need a budget for?',
      fields: ['Category', 'Total amount', 'Time period']
    }
  ];

  const handleToolSelect = (tool) => {
    setActiveTool(tool);
    setToolData({});
  };

  const handleSubmit = async () => {
    if (!activeTool || !toolData) return;
    
    const args = Object.values(toolData).join(', ');
    const response = await handleSlashCommand(activeTool.command, args);
    
    await sendMessage(activeChat.id, {
      text: response,
      isSystem: true,
      assistantType: activeTool.id
    });

    setActiveTool(null);
    setToolData(null);
  };

  if (!activeChat) return null;

  return (
    <div className={`${styles.surface} rounded-xl p-4 border ${styles.border}`}>
      {!activeTool ? (
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <span>🤖</span>
            Personal Assistant
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {tools.map(tool => (
              <button
                key={tool.id}
                onClick={() => handleToolSelect(tool)}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
              >
                <span className="text-2xl">{tool.icon}</span>
                <div>
                  <p className="font-medium text-sm">{tool.name}</p>
                  <p className="text-xs text-gray-500">{tool.command}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold flex items-center gap-2">
              <span>{activeTool.icon}</span>
              {activeTool.name}
            </h4>
            <button 
              onClick={() => setActiveTool(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            {activeTool.fields.map((field, index) => (
              <div key={index}>
                <label className="text-xs text-gray-400 block mb-1">{field}</label>
                <input
                  type="text"
                  value={toolData[field] || ''}
                  onChange={(e) => setToolData(prev => ({ ...prev, [field]: e.target.value }))}
                  placeholder={index === 0 ? activeTool.placeholder : ''}
                  className={`w-full px-3 py-2 rounded-lg ${styles.input} text-sm focus:outline-none focus:ring-2 focus:ring-violet-500`}
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="w-full mt-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Generate'}
          </button>
        </div>
      )}
    </div>
  );
}
