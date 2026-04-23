import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const API_KEY = import.meta.env.VITE_OPENAI_KEY || '';
const API_URL = 'https://api.openai.com/v1/chat/completions';

// Validate key presence
if (!API_KEY && import.meta.env.DEV) {
  console.warn('⚠️ VITE_OPENAI_KEY not found in .env — AI features disabled');
}

// Centralized AI calls with usage tracking
async function callAI(messages, systemPrompt, maxTokens = 500) {
  if (!API_KEY) {
    console.warn('OpenAI API key not configured');
    return null;
  }

  const startTime = performance.now();
  
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        max_tokens: maxTokens,
        temperature: 0.7
      })
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(`AI API error ${res.status}: ${error.error?.message || res.statusText}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;

    // Log usage (optional: track per-user for billing)
    await logUsage('openai', data.usage?.total_tokens || 0, performance.now() - startTime);

    return content;
  } catch (err) {
    console.error('AI call failed:', err);
    return null;
  }
}

async function logUsage(provider, tokens, latencyMs) {
  try {
    await setDoc(doc(db, 'aiUsage', `${provider}_${Date.now()}`), {
      provider,
      tokens,
      latencyMs,
      timestamp: serverTimestamp()
    });
  } catch (e) {
    // Silent fail - don't block chat on logging errors
  }
}

// ─── EXPORTED API FUNCTIONS ───

export const getSmartReplies = async (recentMessages) => {
  const text = recentMessages.slice(-10).map(m => `${m.senderId}: ${m.text}`).join('\n');
  const result = await callAI(
    [{ role: 'user', content: text }],
    'You are a helpful assistant. Based on this conversation, suggest 3 short, natural reply options (max 6 words each). Return ONLY a JSON array of strings.'
  );
  try {
    return JSON.parse(result || '[]');
  } catch {
    return ['👍', 'Interesting...', 'Tell me more'];
  }
};

export const summarizeChat = async (messages) => {
  const text = messages.map(m => m.text).join('\n');
  return await callAI(
    [{ role: 'user', content: text }],
    'Summarize this conversation in 3 bullet points. Be concise.',
    300
  );
};

export const detectMood = async (recentMessages) => {
  const text = recentMessages.map(m => m.text).join(' ');
  const result = await callAI(
    [{ role: 'user', content: text }],
    'Analyze the tone of this conversation. Return ONLY one of: calm, excited, heated, sad, romantic, professional. No explanation.',
    50
  );
  return result?.toLowerCase().trim() || 'calm';
};

export const translateMessage = async (text, targetLang = 'en') => {
  return await callAI(
    [{ role: 'user', content: text }],
    `Translate the following to ${targetLang}. Return ONLY the translation, no quotes or explanation.`,
    300
  );
};

export const handleSlashCommand = async (command, args) => {
  const prompts = {
    '/plan': 'You are an event planner. Create a structured plan with: date, time, location, budget estimate, and checklist. Format with emojis.',
    '/study': 'You are a study assistant. Create a quiz with 5 questions, answers, and a shared notes template. Format cleanly.',
    '/trip': 'You are a travel planner. Suggest: destinations, budget breakdown, packing list, and itinerary. Include map links if possible.',
    '/budget': 'Create a budget breakdown with categories, estimates, and savings tips. Format as a clean list.',
    '/recipe': 'Suggest a recipe based on the ingredients mentioned. Include prep time, steps, and tips.'
  };

  const systemPrompt = prompts[command] || 'Provide helpful information about the request.';
  return await callAI([{ role: 'user', content: args }], systemPrompt, 600);
};

export const generateVibeStatus = async (mood) => {
  const result = await callAI(
    [{ role: 'user', content: `Current mood: ${mood}` }],
    'Generate a short, catchy vibe status (max 5 words) and an emoji. Return format: "status | emoji"',
    50
  );
  return result || 'Chillin | 😎';
};

