import { useState, useRef, useEffect } from 'react';

export function useVoiceRecorder() {
  const [status, setStatus] = useState('idle'); // 'idle' | 'recording' | 'stopped' | 'processing' | 'error'
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);

  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, [audioUrl]);

  const startRecording = async (languageCode = 'en-IN') => {
    setErrorMessage(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setLiveTranscript('');
    audioChunksRef.current = [];

    // 1. Initialize Browser Web Speech Recognition with Selected Language
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = languageCode || 'en-IN';

        recognition.onresult = (event) => {
          let current = '';
          for (let i = 0; i < event.results.length; i++) {
            current += event.results[i][0].transcript;
          }
          if (current.trim()) {
            setLiveTranscript(current.trim());
          }
        };

        recognition.onerror = (e) => {
          console.warn('Web Speech Recognition note:', e.error);
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (e) {
        console.warn('Speech Recognition setup exception:', e);
      }
    }

    // 2. Initialize MediaRecorder audio blob capture
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported in this browser environment');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setStatus('stopped');
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100);
      setStatus('recording');
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const resetRecorder = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setStatus('idle');
    setRecordingTime(0);
    setAudioBlob(null);
    setLiveTranscript('');
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setErrorMessage(null);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    status,
    setStatus,
    recordingTime,
    formattedTime: formatTime(recordingTime),
    audioBlob,
    audioUrl,
    liveTranscript,
    errorMessage,
    startRecording,
    stopRecording,
    resetRecorder
  };
}

export default useVoiceRecorder;
