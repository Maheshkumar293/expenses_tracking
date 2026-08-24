import api from './api';

export const voiceService = {
  async transcribeAudio(audioBlob, textSimulation = null, language = null) {
    const formData = new FormData();
    if (audioBlob) {
      formData.append('audio', audioBlob, 'recording.webm');
    }
    if (textSimulation) {
      formData.append('text', textSimulation);
    }
    if (language) {
      formData.append('language', language);
    }

    const response = await api.post('/voice/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async parseTranscript(transcript) {
    const response = await api.post('/voice/parse', { transcript });
    return response.data;
  }
};

export default voiceService;
