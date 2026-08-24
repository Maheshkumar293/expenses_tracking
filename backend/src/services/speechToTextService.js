const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

/**
 * Speech-to-Text Transcription Service
 * Supports live Web Speech API transcript, Groq Whisper API (free), and OpenAI Whisper API.
 */
async function transcribeAudio(fileBuffer, originalFilename = 'audio.webm', customText = null, languageCode = 'ta') {
  // 1. If live browser transcript was captured via Web Speech API or custom text passed, return it!
  // This guarantees the exact spoken text/language seen on screen is preserved.
  if (customText && typeof customText === 'string' && customText.trim().length > 0) {
    console.log(`Using live browser Web Speech transcript: "${customText.trim()}"`);
    return {
      transcript: customText.trim(),
      language: detectLanguage(customText.trim()),
      source: 'web_speech_api'
    };
  }

  const groqKey = process.env.GROQ_API_KEY;
  const apiKey = process.env.SPEECH_API_KEY || process.env.OPENAI_API_KEY;

  // Extract ISO 639-1 2-letter language code (e.g. "ta-IN" -> "ta", "hi-IN" -> "hi")
  const langIso = languageCode ? languageCode.split('-')[0].toLowerCase() : 'ta';

  // 2. Groq Whisper API (Free, ultra-fast)
  if (groqKey && fileBuffer) {
    try {
      const formData = new FormData();
      formData.append('file', fileBuffer, { filename: originalFilename, contentType: 'audio/webm' });
      formData.append('model', 'whisper-large-v3-turbo');
      
      // Pass language code if not 'en' to prevent Whisper from translating to Hindi/English
      if (langIso && langIso !== 'en') {
        formData.append('language', langIso);
      }
      
      formData.append('prompt', 'Tamil, English, Tanglish expense tracker. Examples: Nethu petrol-ku 600 rupees, Spent 450 on lunch, salary 35000, auto 50 rupees.');

      const response = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${groqKey}`
        }
      });

      const transcript = response.data.text || '';
      console.log(`Groq Whisper transcription (${langIso}): "${transcript}"`);
      return {
        transcript,
        language: detectLanguage(transcript),
        source: 'groq_whisper'
      };
    } catch (err) {
      console.error('Groq Whisper API error:', err.response?.data || err.message);
    }
  }

  // 3. OpenAI Whisper API
  if (apiKey && fileBuffer) {
    try {
      const formData = new FormData();
      formData.append('file', fileBuffer, { filename: originalFilename, contentType: 'audio/webm' });
      formData.append('model', 'whisper-1');
      if (langIso && langIso !== 'en') {
        formData.append('language', langIso);
      }
      formData.append('prompt', 'Tamil, English, Tanglish expense tracker input.');

      const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${apiKey}`
        }
      });

      const transcript = response.data.text || '';
      return {
        transcript,
        language: detectLanguage(transcript),
        source: 'openai_whisper'
      };
    } catch (err) {
      console.error('OpenAI Whisper API error:', err.response?.data || err.message);
    }
  }

  // 4. Fallback sample engine when no API keys or live audio transcript available
  const defaultSamples = [
    "Nethu petrol-ku 600 rupees spend panniten.",
    "Spent 450 on lunch today.",
    "இன்று சம்பளம் 35000 வந்தது.",
    "Paid 1200 for electricity bill yesterday.",
    "Tea and snacks 40 rupees via UPI."
  ];

  const sampleIndex = fileBuffer ? (fileBuffer.length % defaultSamples.length) : 0;
  const transcript = defaultSamples[sampleIndex];

  return {
    transcript,
    language: detectLanguage(transcript),
    source: 'fallback_engine'
  };
}

function detectLanguage(text) {
  if (/[\u0B80-\u0BFF]/.test(text)) {
    return 'ta'; // Tamil
  } else if (/\b(nethu|panniten|vandhuchu|ku|rubai|kuduthen)\b/i.test(text)) {
    return 'tanglish'; // Tanglish (Tamil written in Latin script)
  }
  return 'en'; // English
}

module.exports = {
  transcribeAudio
};
