import React, { useState } from 'react';
import VoiceRecorderCard from '../components/voice/VoiceRecorderCard';
import ConfirmationCard from '../components/voice/ConfirmationCard';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export function VoiceExpense() {
  const navigate = useNavigate();
  const [detectedExpense, setDetectedExpense] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(null);

  const handleDetectedExpense = (parsedData) => {
    setSavedSuccess(null);
    setDetectedExpense(parsedData);
  };

  const handleConfirmed = (savedTx) => {
    setDetectedExpense(null);
    setSavedSuccess(savedTx);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {savedSuccess ? (
        <div className="bg-gray-900 border border-green-500/40 rounded-3xl p-8 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in">
          <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400 mx-auto">
            <CheckCircle2 size={36} />
          </div>
          <h3 className="text-2xl font-bold text-white">Expense Saved Successfully!</h3>
          <p className="text-sm text-gray-300">
            Recorded <span className="font-bold text-green-400">₹{savedSuccess.amount}</span> under{' '}
            <span className="font-semibold text-white">{savedSuccess.description || 'Expense'}</span>.
          </p>

          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => setSavedSuccess(null)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
            >
              Record Another
            </button>
            <button
              onClick={() => navigate('/transactions')}
              className="bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold px-5 py-2.5 rounded-xl text-sm border border-gray-700 flex items-center gap-1.5"
            >
              View Transactions <ArrowRight size={16} />
            </button>
          </div>
        </div>
      ) : detectedExpense ? (
        <ConfirmationCard
          detectedExpense={detectedExpense}
          onConfirmed={handleConfirmed}
          onCancel={() => setDetectedExpense(null)}
        />
      ) : (
        <VoiceRecorderCard onDetectedExpense={handleDetectedExpense} />
      )}
    </div>
  );
}

export default VoiceExpense;
