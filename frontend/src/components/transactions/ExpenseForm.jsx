import React, { useState, useEffect } from 'react';
import accountService from '../../services/accountService';
import categoryService from '../../services/categoryService';
import transactionService from '../../services/transactionService';
import { Save, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ExpenseForm({ initialData = null, onSuccess, onCancel }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [type, setType] = useState(initialData?.type || 'expense');
  const [amount, setAmount] = useState(initialData?.amount || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [categoryId, setCategoryId] = useState(initialData?.category_id || '');
  const [accountId, setAccountId] = useState(initialData?.account_id || '');
  const [paymentMethod, setPaymentMethod] = useState(initialData?.payment_method || 'UPI');
  const [transactionDate, setTransactionDate] = useState(
    initialData?.transaction_date
      ? new Date(initialData.transaction_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(initialData?.notes || '');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [accRes, catRes] = await Promise.all([
        accountService.getAccounts(),
        categoryService.getCategories()
      ]);
      setAccounts(accRes.accounts || []);
      if (!accountId && accRes.accounts?.length > 0) {
        setAccountId(accRes.accounts[0].id);
      }

      setCategories(catRes.categories || []);
      if (!categoryId && catRes.categories?.length > 0) {
        setCategoryId(catRes.categories[0].id);
      }
    } catch (err) {
      console.error('Failed to load form data:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        type,
        amount: parseFloat(amount),
        description: description || 'Expense',
        category_id: categoryId ? parseInt(categoryId) : null,
        account_id: accountId ? parseInt(accountId) : null,
        payment_method: paymentMethod,
        transaction_date: transactionDate,
        notes,
        source: 'manual'
      };

      if (initialData?.id) {
        await transactionService.updateTransaction(initialData.id, payload);
      } else {
        await transactionService.createTransaction(payload);
      }

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/transactions');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-6 max-w-xl mx-auto shadow-xl shadow-slate-200/50">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h3 className="text-xl font-black text-slate-900">
          {initialData ? 'Edit Transaction' : 'Add Manual Transaction'}
        </h3>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1"
          >
            <ArrowLeft size={14} /> Back
          </button>
        )}
      </div>

      {/* Type Selector */}
      <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
        <button
          type="button"
          onClick={() => setType('expense')}
          className={`py-2.5 rounded-xl font-black text-sm transition-all ${
            type === 'expense'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 font-bold'
          }`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => setType('income')}
          className={`py-2.5 rounded-xl font-black text-sm transition-all ${
            type === 'income'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 font-bold'
          }`}
        >
          Income
        </button>
        <button
          type="button"
          onClick={() => setType('transfer')}
          className={`py-2.5 rounded-xl font-black text-sm transition-all ${
            type === 'transfer'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 font-bold'
          }`}
        >
          Transfer
        </button>
      </div>

      {/* Amount Input */}
      <div>
        <label className="block text-xs font-black text-slate-700 uppercase mb-2">Amount (₹)</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">₹</span>
          <input
            type="number"
            step="any"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-4 py-3 text-2xl font-black text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Description & Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-extrabold text-slate-700 uppercase mb-2">Description</label>
          <input
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Lunch, Petrol, Rent"
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-700 uppercase mb-2">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Account & Payment Method */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-extrabold text-slate-700 uppercase mb-2">Account</label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} (Balance: ₹{acc.current_balance})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-700 uppercase mb-2">Payment Method</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
          >
            <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
            <option value="Cash">Cash</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Debit Card">Debit Card</option>
            <option value="Net Banking">Net Banking</option>
            <option value="Wallet">Wallet</option>
          </select>
        </div>
      </div>

      {/* Date */}
      <div>
        <label className="block text-xs font-extrabold text-slate-700 uppercase mb-2">Date</label>
        <input
          type="date"
          value={transactionDate}
          onChange={(e) => setTransactionDate(e.target.value)}
          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-extrabold text-slate-700 uppercase mb-2">Notes (Optional)</label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add extra notes..."
          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-extrabold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-base shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
      >
        {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
        {initialData ? 'Update Transaction' : 'Save Transaction'}
      </button>
    </form>
  );
}

export default ExpenseForm;
