// Offload AI processing: transcription, summarization, mood detection
const API_KEY = self.API_KEY || '';

self.onmessage = async (e) => {
  const { action, payload } = e.data;

  try {
    switch (action) {
      case 'transcribe': {
        // Web Speech API alternative - chunk processing
        const { audioBuffer } = payload;
        // In production: send to Whisper API or process locally
        self.postMessage({ success: true, result: '[Transcription placeholder]' });
        break;
      }

      case 'summarize': {
        const { messages } = payload;
        const text = messages.map(m => m.text).join('\n');
        const summary = await callOpenAI(text, 'Summarize this conversation in 3 bullet points. Be concise.');
        self.postMessage({ success: true, result: summary });
        break;
      }

      case 'detectMood': {
        const { messages } = payload;
        const text = messages.map(m => m.text).join(' ');
        const mood = await callOpenAI(
          text,
          'Analyze the tone. Return ONLY one of: calm, excited, heated, sad, romantic, professional. No explanation.'
        );
        self.postMessage({ success: true, result: mood?.toLowerCase().trim() || 'calm' });
        break;
      }

      case 'smartReply': {
        const { messages } = payload;
        const text = messages.map(m => `${m.senderId}: ${m.text}`).join('\n');
        const replies = await callOpenAI(
          text,
          'Suggest 3 short reply options (max 6 words each). Return ONLY a JSON array of strings.'
        );
        try {
          const parsed = JSON.parse(replies || '[]');
          self.postMessage({ success: true, result: parsed });
        } catch {
          self.postMessage({ success: true, result: ['👍', 'Interesting...', 'Tell me more'] });
        }
        break;
      }

      case 'translate': {
        const { text, targetLang } = payload;
        const translated = await callOpenAI(
          text,
          `Translate to ${targetLang}. Return ONLY the translation, no quotes or explanation.`
        );
        self.postMessage({ success: true, result: translated });
        break;
      }

      default:
        self.postMessage({ success: false, error: 'Unknown AI action' });
    }
  } catch (err) {
    self.postMessage({ success: false, error: err.message });
  }
};

async function callOpenAI(userContent, systemPrompt) {
  if (!API_KEY) return null;
  
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      max_tokens: 500,
      temperature: 0.7
    })
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content || null;
}
