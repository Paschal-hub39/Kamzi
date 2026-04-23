import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useUI } from '../../contexts/UIContext';

export default function SettingsPage() {
  const { user, userProfile } = useAuth();
  const { globalTheme, setGlobal, themes } = useTheme();
  const { addNotification } = useUI();
  const [activeSection, setActiveSection] = useState('appearance');

  const sections = [
    { id: 'appearance', icon: '🎨', name: 'Appearance' },
    { id: 'notifications', icon: '🔔', name: 'Notifications' },
    { id: 'privacy', icon: '🔐', name: 'Privacy & Security' },
    { id: 'data', icon: '💾', name: 'Data & Storage' },
    { id: 'about', icon: 'ℹ️', name: 'About' }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-800 p-4">
        <h2 className="text-xl font-bold mb-6">Settings</h2>
        <div className="space-y-1">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left ${
                activeSection === section.id ? 'bg-violet-600/20 text-violet-400' : 'hover:bg-white/5'
              }`}
            >
              <span>{section.icon}</span>
              <span>{section.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 max-w-2xl">
        {activeSection === 'appearance' && (
          <div>
            <h3 className="text-2xl font-bold mb-6">Appearance</h3>
            
            <div className="mb-6">
              <h4 className="font-medium mb-3">Theme</h4>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(themes).map(([key, theme]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setGlobal(key);
                      addNotification({ title: 'Theme updated', type: 'success' });
                    }}
                    className={`p-4 rounded-xl border-2 text-center ${
                      globalTheme === key ? 'border-violet-500 bg-violet-500/10' : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full mx-auto mb-2 bg-gradient-to-br ${theme.bubbleMe}`} />
                    <p className="text-sm font-medium">{theme.name}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Font Size</h4>
              <div className="flex gap-3">
                {['Small', 'Medium', 'Large'].map(size => (
                  <button key={size} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm">
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'about' && (
          <div>
            <h3 className="text-2xl font-bold mb-6">About Kamzi</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
                  <span className="text-3xl font-bold">K</span>
                </div>
                <div>
                  <p className="font-bold text-lg">Kamzi</p>
                  <p className="text-sm text-gray-500">Version 1.0.0</p>
                  <p className="text-xs text-gray-600 mt-1">Built with React + Firebase</p>
                </div>
              </div>
              
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-sm text-gray-400">
                  Kamzi is an AI-powered messaging platform with end-to-end encryption, 
                  context-aware chats, and vibe status. Connect securely, chat freely, be yourself.
                </p>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 py-2 bg-white/5 rounded-lg text-sm hover:bg-white/10">
                  📋 Terms of Service
                </button>
                <button className="flex-1 py-2 bg-white/5 rounded-lg text-sm hover:bg-white/10">
                  🔒 Privacy Policy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
