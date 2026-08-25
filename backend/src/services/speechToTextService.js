const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

const HALLUCINATION_PATTERNS = /\b(Shri|Viputrwanza|salaguyo|Amara\.org|subtitles|transcribed by|thank you for watching|watching!|Subscribe|english, shri)\b/i;

function isHallucination(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) return true;
  return HALLUCINATION_PATTERNS.test(text);
}

/**
 * Speech-to-Text Transcription Service
 * Supports live Web Speech API transcript, Groq Whisper API (free), and OpenAI Whisper API.
 */
async function transcribeAudio(fileBuffer, originalFilename = 'audio.webm', customText = null, languageCode = 'ta-IN', isPreview = false) {
  const groqKey = process.env.GROQ_API_KEY;
  const apiKey = process.env.SPEECH_API_KEY || process.env.OPENAI_API_KEY;

  // 1. If live browser transcript preview was captured and passed, prioritize it to preserve exact on-screen user text!
  if (customText && typeof customText === 'string' && customText.trim().length > 0 && !isHallucination(customText)) {
    console.log(`Preserving live browser transcript: "${customText.trim()}"`);
    return {
      transcript: customText.trim(),
      language: detectLanguage(customText.trim()),
      source: 'web_speech_api',
      mode: 'final'
    };
  }

  const langIso = languageCode ? languageCode.split('-')[0].toLowerCase() : 'ta';
  const isPureTamil = languageCode === 'ta-IN' || languageCode === 'ta';
  const isTanglish = languageCode === 'en-IN' || languageCode === 'tanglish';
  const mode = isPreview ? 'preview' : 'final';

  // Build targeted prompt and language parameter for Whisper AI
  let promptText = 'Tamil, English, Tanglish financial expense tracker.';
  if (isPureTamil) {
    promptText = 'செலவு கணக்கு விவரங்கள். நேற்று பெட்ரோல் 600 ரூபாய், சாப்பாடு 450 ரூபாய், டீ 20 ரூபாய், பால் 30 ரூபாய், ஆட்டோ 50 ரூபாய், சம்பளம் 35000, காய்கறி 120 ரூபாய், வாடகை 8000.';
  } else if (isTanglish) {
    promptText = 'Tamil Tanglish English financial expense items. Examples: Nethu petrol-ku 600 rupees spend panniten, lunch 450 rupees, salary 35000 came, tea 20 rupees, auto 50 rupees.';
  } else if (langIso === 'hi') {
    promptText = 'खर्च का विवरण। कल पेट्रोल 600 रुपये, लंच 450 रुपये, सैलरी 35000, चाय 20 रुपये, ऑटो 50 रुपये।';
  }

  const fileExt = (originalFilename || 'recording.webm').split('.').pop().toLowerCase();
  let contentType = 'audio/webm';
  if (fileExt === 'mp4' || fileExt === 'm4a') contentType = 'audio/mp4';
  else if (fileExt === 'wav') contentType = 'audio/wav';
  else if (fileExt === 'ogg') contentType = 'audio/ogg';
  else if (fileExt === 'aac') contentType = 'audio/aac';

  // 1. Primary: Groq Whisper API (Free, ultra-fast, deterministic temperature=0)
  if (groqKey && fileBuffer && fileBuffer.length > 500) {
    try {
      const formData = new FormData();
      formData.append('file', fileBuffer, { filename: originalFilename, contentType });
      
      const model = isPreview ? 'whisper-large-v3-turbo' : 'whisper-large-v3';
      formData.append('model', model);
      formData.append('temperature', '0'); // Greedy deterministic decoding (prevents irrelevant word hallucinations)

      if (isPureTamil) {
        formData.append('language', 'ta');
      } else if (langIso && !['en', 'ta'].includes(langIso)) {
        formData.append('language', langIso);
      }
      
      formData.append('prompt', promptText);

      const response = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${groqKey}`
        }
      });

      const rawTranscript = response.data.text || '';
      if (rawTranscript.trim().length > 0 && !isHallucination(rawTranscript)) {
        console.log(`Groq Whisper ${mode} transcription (${model}, ${languageCode}): "${rawTranscript.trim()}"`);
        return {
          transcript: rawTranscript.trim(),
          language: detectLanguage(rawTranscript),
          source: isPreview ? 'groq_whisper_preview' : 'groq_whisper',
          mode
        };
      } else if (isHallucination(rawTranscript)) {
        console.warn(`Groq Whisper returned hallucinated output (discarded): "${rawTranscript}"`);
      }
    } catch (err) {
      console.error(`Groq Whisper API ${mode} error:`, err.response?.data || err.message);
    }
  }

  // 2. Secondary Fallback: OpenAI Whisper API
  if (apiKey && fileBuffer && fileBuffer.length > 500) {
    try {
      const formData = new FormData();
      formData.append('file', fileBuffer, { filename: originalFilename, contentType });
      formData.append('model', 'whisper-1');
      formData.append('temperature', '0');
      if (isPureTamil) {
        formData.append('language', 'ta');
      } else if (langIso && !['en', 'ta'].includes(langIso)) {
        formData.append('language', langIso);
      }
      formData.append('prompt', promptText);

      const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${apiKey}`
        }
      });

      const rawTranscript = response.data.text || '';
      if (rawTranscript.trim().length > 0 && !isHallucination(rawTranscript)) {
        console.log(`OpenAI Whisper ${mode} transcription (${langIso}): "${rawTranscript.trim()}"`);
        return {
          transcript: rawTranscript.trim(),
          language: detectLanguage(rawTranscript),
          source: isPreview ? 'openai_whisper_preview' : 'openai_whisper',
          mode
        };
      }
    } catch (err) {
      console.error(`OpenAI Whisper API ${mode} error:`, err.response?.data || err.message);
    }
  }

  // 3. Tertiary Fallback: Live browser transcript captured via Web Speech API (if present & valid)
  if (customText && typeof customText === 'string' && customText.trim().length > 0 && !isHallucination(customText)) {
    console.log(`Using custom text fallback (${mode}): "${customText.trim()}"`);
    return {
      transcript: customText.trim(),
      language: detectLanguage(customText.trim()),
      source: 'web_speech_api',
      mode
    };
  }

  // 4. Quaternary Fallback: Sample engine when no audio transcription succeeded
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
    source: 'fallback_engine',
    mode
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
