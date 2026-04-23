import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const PREMIUM_FEATURES = [
  { icon: '🎨', name: 'Exclusive Themes', desc: 'Unlock all custom themes' },
  { icon: '🤖', name: 'Advanced AI', desc: 'GPT-4 powered responses' },
  { icon: '🔊', name: 'Voice Cloning', desc: 'AI voice for your assistant' },
  { icon: '📊', name: 'Analytics', desc: 'Chat insights & patterns' },
  { icon: '🌐', name: 'Unlimited Translation', desc: 'All languages, no limits' },
  { icon: '💼', name: 'Business Tools', desc: 'Invoices, contracts, reports' }
];

const PLANS = [
  { name: 'Monthly', price: '$4.99', period: 'month' },
  { name: 'Yearly', price: '$39.99', period: 'year', save: '33%' },
  { name: 'Lifetime', price: '$99.99', period: 'once', save: 'Best value' }
];

export default function PremiumGate({ feature, onClose, onSubscribe }) {
  const { user } = useAuth();
  const { getActiveTheme, themes } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState(1);
  
  const theme = getActiveTheme();
  const styles = themes[theme] || themes.dark;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className={`${styles.surface} rounded-2xl max-w-md w-full p-6 border ${styles.border} shadow-2xl`}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">
            💎
          </div>
          <h3 className="text-2xl font-bold">Upgrade to Premium</h3>
          <p className={`text-sm ${styles.textMuted} mt-1`}>
            Unlock {feature || 'all premium features'}
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {PREMIUM_FEATURES.map((f, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
              <span className="text-xl">{f.icon}</span>
              <div>
                <p className="text-sm font-medium">{f.name}</p>
                <p className="text-xs text-gray-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2 mb-6">
          {PLANS.map((plan, i) => (
            <button
              key={i}
              onClick={() => setSelectedPlan(i)}
              className={`w-full p-3 rounded-xl border-2 text-left flex items-center justify-between ${
                selectedPlan === i 
                  ? 'border-violet-500 bg-violet-500/10' 
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div>
                <p className="font-medium">{plan.name}</p>
                <p className="text-xs text-gray-500">Billed {plan.period}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{plan.price}</p>
                {plan.save && (
                  <span className="text-xs text-green-400">{plan.save}</span>
                )}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => onSubscribe?.(PLANS[selectedPlan])}
          className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl font-bold hover:opacity-90 mb-3"
        >
          Subscribe Now
        </button>

        <button
          onClick={onClose}
          className="w-full py-2 text-sm text-gray-500 hover:text-white"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}

