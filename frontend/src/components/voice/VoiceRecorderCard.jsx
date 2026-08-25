import React, { useState } from 'react';
import useVoiceRecorder from '../../hooks/useVoiceRecorder';
import voiceService from '../../services/voiceService';
import transactionService from '../../services/transactionService';
import { Mic, Square, Loader2, Sparkles, Send, Volume2, Globe, CheckSquare, Square as CheckboxSquare } from 'lucide-react';

export function VoiceRecorderCard({ onDetectedExpense }) {
  const {
    status,
    setStatus,
    formattedTime,
    audioBlob,
    audioUrl,
    liveTranscript,
    setLiveTranscript,
    livePreviewNote,
    errorMessage,
    startRecording,
    stopRecording,
    resetRecorder
  } = useVoiceRecorder();

  const [selectedLanguage, setSelectedLanguage] = useState('ta-IN');
  const [manualAmountMode, setManualAmountMode] = useState(true);
  const [naturalText, setNaturalText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const languages = [
    { code: 'ta-IN', name: '🇮🇳 Tamil (தமிழ்)' },
    { code: 'en-IN', name: '🇬🇧 Tanglish / English (India)' },
    { code: 'hi-IN', name: '🇮🇳 Hindi (हिंदी)' },
    { code: 'te-IN', name: '🇮🇳 Telugu (తెలుగు)' },
    { code: 'ml-IN', name: '🇮🇳 Malayalam (മലയാളം)' },
    { code: 'kn-IN', name: '🇮🇳 Kannada (கன்னட)' },
    { code: 'en-US', name: '🇺🇸 English (US)' }
  ];

  const handleStartRecording = () => {
    startRecording(selectedLanguage);
  };

  const handleProcessAudio = async (blobToUse = audioBlob) => {
    setIsProcessing(true);
    setStatus('processing');
    try {
      // Pass liveTranscript if present to preserve exact on-screen recognized text
      const transcribeRes = await voiceService.transcribeAudio(blobToUse, liveTranscript || null, selectedLanguage, false);
      const transcriptText = transcribeRes.transcript || liveTranscript;

      if (setLiveTranscript && transcriptText) {
        setLiveTranscript(transcriptText);
      }

      const parseRes = await voiceService.parseTranscript(transcriptText);

      onDetectedExpense({
        ...parseRes.parsed,
        description: transcriptText || parseRes.parsed.description || 'Voice Expense',
        amount: manualAmountMode ? (parseRes.parsed.amount || '') : (parseRes.parsed.amount || 0),
        transcription: transcriptText,
        source: 'voice',
        manualAmountFocus: manualAmountMode
      });
      setStatus('idle');
    } catch (err) {
      console.error('Error processing voice:', err);
      setStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessText = async (e) => {
    e.preventDefault();
    if (!naturalText.trim()) return;

    setIsProcessing(true);
    setStatus('processing');
    try {
      const res = await transactionService.parseText(naturalText);
      onDetectedExpense({
        ...res.parsed,
        description: naturalText,
        amount: manualAmountMode ? (res.parsed.amount || '') : (res.parsed.amount || 0),
        transcription: naturalText,
        source: 'text',
        manualAmountFocus: manualAmountMode
      });
      setNaturalText('');
      setStatus('idle');
    } catch (err) {
      console.error('Error processing text:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="glass-card border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-200/50 relative overflow-hidden">
      {/* Background Glowing Ambient Light */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-red-400/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="text-center max-w-lg mx-auto relative z-10">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} className="animate-pulse" /> Voice Engine Active
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
          Voice Expense Tracker
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mb-6 font-medium leading-relaxed">
          Select your language, speak your expense item, and enter the amount.
        </p>

        {/* Language Selector Dropdown */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 text-left shadow-inner">
          <div className="flex items-center justify-between gap-3 mb-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Globe size={15} className="text-blue-600" /> Select Speech Language
            </label>
            <span className="text-[10px] text-green-700 font-bold bg-green-100/80 px-2 py-0.5 rounded border border-green-200">
              ⚡ AI Live Preview · Groq Whisper
            </span>
          </div>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-600 shadow-xs transition-colors"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>

          {/* Mode toggle checkbox */}
          <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between">
            <label
              onClick={() => setManualAmountMode(!manualAmountMode)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none"
            >
              {manualAmountMode ? (
                <CheckSquare size={16} className="text-blue-600" />
              ) : (
                <CheckboxSquare size={16} className="text-slate-400" />
              )}
              <span>Voice for Description, enter Amount manually</span>
            </label>
          </div>
        </div>

        {/* Microphone Interactive Area */}
        <div className="flex flex-col items-center justify-center my-6">
          {status === 'recording' ? (
            <div className="flex flex-col items-center">
              <button
                onClick={stopRecording}
                className="w-32 h-32 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-xl shadow-red-500/40 animate-pulse-glow cursor-pointer hover:scale-105 active:scale-95 transition-all border-4 border-white"
              >
                <Square size={40} className="fill-current" />
              </button>

              <div className="mt-6 flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping"></span>
                <span className="text-red-600 font-black text-lg tracking-wider">🔴 Listening...</span>
                <span className="font-mono text-slate-900 text-lg font-black ml-2 bg-white px-4 py-1 rounded-2xl border border-slate-200 shadow-sm">
                  {formattedTime}
                </span>
              </div>

              {liveTranscript ? (
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-xs text-blue-900 max-w-sm shadow-xs">
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block mb-0.5">
                    Live Preview ({selectedLanguage})
                  </span>
                  <p className="font-bold text-slate-900 text-sm">"{liveTranscript}"</p>
                </div>
              ) : livePreviewNote ? (
                <div className="mt-3 bg-amber-50 border border-amber-200/80 rounded-xl px-4 py-2 text-xs text-amber-900 max-w-sm shadow-xs">
                  <p className="font-medium text-amber-800 text-[11px]">
                    ℹ️ {livePreviewNote}
                  </p>
                </div>
              ) : null}

              {/* Wave Bar Visualizer */}
              <div className="flex items-center gap-1.5 mt-4 h-8">
                <div className="w-2 bg-gradient-to-t from-red-600 to-rose-500 rounded-full animate-wave-1"></div>
                <div className="w-2 bg-gradient-to-t from-red-600 to-rose-500 rounded-full animate-wave-2"></div>
                <div className="w-2 bg-gradient-to-t from-red-600 to-rose-500 rounded-full animate-wave-3"></div>
                <div className="w-2 bg-gradient-to-t from-red-600 to-rose-500 rounded-full animate-wave-4"></div>
                <div className="w-2 bg-gradient-to-t from-red-600 to-rose-500 rounded-full animate-wave-5"></div>
              </div>
            </div>
          ) : isProcessing ? (
            <div className="flex flex-col items-center py-6">
              <div className="w-28 h-28 rounded-full bg-blue-50 border-2 border-blue-600 flex items-center justify-center text-blue-600 animate-spin shadow-lg shadow-blue-500/10">
                <Loader2 size={48} />
              </div>
              <p className="mt-6 text-blue-700 font-bold text-base flex items-center gap-2">
                <Sparkles size={18} className="animate-pulse" />
                Processing your expense...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <button
                onClick={handleStartRecording}
                className="w-32 h-32 rounded-full bg-gradient-to-tr from-red-600 via-rose-500 to-red-600 text-white flex items-center justify-center shadow-xl shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105 active:scale-95 transition-all cursor-pointer border-4 border-white group"
              >
                <Mic size={52} className="group-hover:rotate-12 transition-transform duration-300" />
              </button>
              <p className="mt-4 font-black text-slate-800 text-base tracking-tight">
                🎙️ Tap Microphone to Speak in {languages.find(l => l.code === selectedLanguage)?.name.split(' ')[1]}
              </p>
            </div>
          )}
        </div>

        {audioUrl && status === 'stopped' && !isProcessing && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 my-6 space-y-3 shadow-md text-left">
            {liveTranscript && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block mb-1">
                  Live Browser Preview ({selectedLanguage})
                </span>
                <p className="font-bold text-slate-900 text-sm">"{liveTranscript}"</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Volume2 className="text-blue-600 shrink-0" size={20} />
                <audio src={audioUrl} controls className="h-8 max-w-[200px]" />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleProcessAudio(audioBlob)}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  Use Voice Description
                </button>
                <button
                  onClick={resetRecorder}
                  className="text-xs text-slate-500 hover:text-slate-900 px-3 py-2 font-semibold"
                >
                  Retake
                </button>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <p className="text-xs text-rose-600 mt-2 bg-rose-50 p-3 rounded-xl border border-rose-200 font-bold">
            {errorMessage}
          </p>
        )}

        {/* Natural Language Text Form Option */}
        <div className="mt-8 pt-6 border-t border-slate-200 text-left">
          <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
            Or Type Expense Description
          </label>
          <form onSubmit={handleProcessText} className="flex gap-2">
            <input
              type="text"
              value={naturalText}
              onChange={(e) => setNaturalText(e.target.value)}
              placeholder="e.g., Petrol / Lunch with friends / House Rent"
              className="flex-1 bg-white border border-slate-300 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-xs transition-colors"
            />
            <button
              type="submit"
              disabled={!naturalText.trim() || isProcessing}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-3 rounded-2xl flex items-center justify-center font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default VoiceRecorderCard;
