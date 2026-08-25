import api from './api';

export const voiceService = {
  async transcribeAudio(audioBlob, textSimulation = null, language = null, isPreview = false) {
    const formData = new FormData();
    if (audioBlob) {
      const type = audioBlob.type || '';
      let filename = 'recording.webm';
      if (type.includes('mp4') || type.includes('m4a')) filename = 'recording.mp4';
      else if (type.includes('aac')) filename = 'recording.aac';
      else if (type.includes('wav')) filename = 'recording.wav';
      else if (type.includes('ogg')) filename = 'recording.ogg';

      formData.append('audio', audioBlob, filename);
    }
    if (textSimulation) {
      formData.append('text', textSimulation);
    }
    if (language) {
      formData.append('language', language);
    }
    if (isPreview) {
      formData.append('isPreview', 'true');
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
