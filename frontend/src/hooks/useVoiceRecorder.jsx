import { useState, useRef, useEffect } from 'react';

function getSupportedMimeType() {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4;codecs=mp4a.40.2',
    'audio/mp4',
    'audio/aac',
    'audio/ogg;codecs=opus',
    'audio/wav'
  ];
  for (const type of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return '';
}

export function useVoiceRecorder() {
  const [status, setStatus] = useState('idle'); // 'idle' | 'recording' | 'stopped' | 'processing' | 'error'
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [livePreviewNote, setLivePreviewNote] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const mimeTypeRef = useRef('');

  const stopAllMedia = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch (e) {}
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopAllMedia();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async (languageCode = 'en-IN') => {
    stopAllMedia();
    setErrorMessage(null);
    setLivePreviewNote(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setLiveTranscript('');
    audioChunksRef.current = [];

    // 1. Initialize Browser Speech Recognition as optional progressive enhancement for Edge / Chrome
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
          console.warn('Web Speech API note (non-fatal):', e.error);
          if (e.error === 'network') {
            setLivePreviewNote('Live preview disabled by Brave privacy policy. Full recording will be transcribed by Groq Whisper AI.');
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (e) {
        console.warn('Speech recognition preview unavailable:', e);
        setLivePreviewNote('Live preview unsupported in this browser. Recording will be transcribed by Groq Whisper AI.');
      }
    } else {
      setLivePreviewNote('Live preview unsupported in this browser. Recording will be transcribed by Groq Whisper AI.');
    }

    // 2. MediaRecorder continuous audio capture for Mobile & Desktop
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported in this browser environment');
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true
          }
        });
      } catch (e) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      mimeTypeRef.current = mimeType;

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalMime = mimeTypeRef.current || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: finalMime });
        if (blob.size < 1000) {
          console.warn('Recorded audio blob is tiny/empty:', blob.size);
          setErrorMessage('Recording was too short or silent. Please speak clearly into microphone.');
        }
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setStatus('stopped');

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start(); // Continuous recording buffer for mobile stability
      setStatus('recording');
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Could not access microphone');
      stopAllMedia();
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
  };

  const resetRecorder = () => {
    stopAllMedia();
    setStatus('idle');
    setRecordingTime(0);
    setAudioBlob(null);
    setLiveTranscript('');
    setLivePreviewNote(null);
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
    setLiveTranscript,
    livePreviewNote,
    errorMessage,
    startRecording,
    stopRecording,
    resetRecorder
  };
}

export default useVoiceRecorder;
