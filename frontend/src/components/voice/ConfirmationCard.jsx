import React, { useState, useEffect, useRef } from 'react';
import transactionService from '../../services/transactionService';
import accountService from '../../services/accountService';
import categoryService from '../../services/categoryService';
import { Check, Edit2, X, Sparkles, Loader2, Tag, Calendar, Wallet, FileText } from 'lucide-react';

export function ConfirmationCard({ detectedExpense, onConfirmed, onCancel }) {
  const [isEditing, setIsEditing] = useState(
    Boolean(detectedExpense?.manualAmountFocus || !detectedExpense?.amount)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const amountInputRef = useRef(null);

  // Editable form fields
  const [amount, setAmount] = useState(detectedExpense?.amount || '');
  const [type, setType] = useState(detectedExpense?.type || 'expense');
  const [categoryName, setCategoryName] = useState(detectedExpense?.category_name || detectedExpense?.category || 'Transport');
  const [categoryId, setCategoryId] = useState(detectedExpense?.category_id || null);
  const [date, setDate] = useState(() => {
    if (detectedExpense?.date === 'yesterday') {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  });
  const [description, setDescription] = useState(detectedExpense?.description || 'Expense');
  const [accountId, setAccountId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(detectedExpense?.payment_method || 'UPI');
  const [notes, setNotes] = useState(detectedExpense?.notes || '');

  useEffect(() => {
    fetchAccountsAndCategories();
    if (amountInputRef.current) {
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 100);
    }
  }, []);

  const fetchAccountsAndCategories = async () => {
    try {
      const accData = await accountService.getAccounts();
      setAccounts(accData.accounts || []);
      if (accData.accounts && accData.accounts.length > 0) {
        setAccountId(accData.accounts[0].id);
      }

      const catData = await categoryService.getCategories();
      setCategories(catData.categories || []);
    } catch (e) {
      console.error('Failed to load accounts/categories for confirmation', e);
    }
  };

  const handleSave = async () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid amount (e.g. 150).');
      if (amountInputRef.current) amountInputRef.current.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        amount: numAmount,
        type,
        category_id: categoryId,
        category_name: categoryName,
        account_id: accountId ? parseInt(accountId) : null,
        transaction_date: date,
        description,
        payment_method: paymentMethod || null,
        notes,
        source: detectedExpense?.source || 'voice',
        transcription: detectedExpense?.transcription || null
      };

      const result = await transactionService.createTransaction(payload);
      onConfirmed(result.transaction);
    } catch (err) {
      console.error('Failed to confirm transaction:', err);
      alert(err.response?.data?.error || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border-2 border-blue-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-blue-900/10 max-w-lg mx-auto relative overflow-hidden animate-in fade-in zoom-in duration-300">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <div className="flex items-center gap-2 text-blue-600">
          <Sparkles size={22} className="animate-pulse" />
          <h3 className="font-black text-xl text-slate-900">Expense Review & Save</h3>
        </div>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {detectedExpense?.transcription && (
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 mb-6 text-xs text-slate-700">
          <span className="text-blue-700 font-bold uppercase tracking-wider block mb-1">Voice Recognized Description</span>
          <p className="font-bold text-slate-900 text-sm">"{detectedExpense.transcription}"</p>
        </div>
      )}

      {/* Structured Card Content */}
      <div className="space-y-4">
        {/* Amount (Highlighted light blue box for manual entry) */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 p-4 rounded-2xl border-2 border-blue-500/50 shadow-md">
          <label className="block text-xs text-blue-700 font-black uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Enter Amount (₹)</span>
            <span className="text-[10px] text-blue-600 font-bold bg-blue-100 px-2 py-0.5 rounded">Required</span>
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-2xl font-black text-blue-600">₹</span>
            <input
              ref={amountInputRef}
              type="number"
              step="any"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-white border border-blue-400 rounded-xl pl-9 pr-4 py-2.5 text-2xl font-black text-slate-900 focus:outline-none focus:border-blue-600 shadow-inner"
            />
          </div>
        </div>

        {/* Category & Description */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-bold uppercase flex items-center gap-1">
              <Tag size={12} /> Category
            </span>
            <select
              value={categoryName}
              onChange={(e) => {
                setCategoryName(e.target.value);
                const found = categories.find(c => c.name.toLowerCase() === e.target.value.toLowerCase());
                if (found) setCategoryId(found.id);
              }}
              className="mt-1 w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm text-slate-900 font-bold focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-bold uppercase flex items-center gap-1">
              <FileText size={12} /> Item Description
            </span>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-sm text-slate-900 font-bold focus:outline-none"
            />
          </div>
        </div>

        {/* Date & Account */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-bold uppercase flex items-center gap-1">
              <Calendar size={12} /> Date
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-sm text-slate-900 font-bold focus:outline-none"
            />
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-bold uppercase flex items-center gap-1">
              <Wallet size={12} /> Account
            </span>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="mt-1 w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-sm text-slate-900 font-bold focus:outline-none"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (₹{acc.current_balance})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 pt-4 border-t border-slate-100 flex items-center gap-3">
        <button
          onClick={onCancel}
          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl text-sm transition-all border border-slate-200"
        >
          Cancel
        </button>

        <button
          onClick={handleSave}
          disabled={isSubmitting}
          className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer"
        >
          {isSubmitting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <Check size={18} />
              Confirm & Save
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default ConfirmationCard;
