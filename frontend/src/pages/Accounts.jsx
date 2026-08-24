import React, { useState, useEffect } from 'react';
import AccountCard from '../components/accounts/AccountCard';
import accountService from '../services/accountService';
import { Plus, Wallet, Loader2, X } from 'lucide-react';

export function Accounts() {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState('bank');
  const [initialBalance, setInitialBalance] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await accountService.getAccounts();
      setAccounts(res.accounts || []);
    } catch (e) {
      console.error('Failed to load accounts', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await accountService.createAccount({
        name: name.trim(),
        type,
        initial_balance: parseFloat(initialBalance) || 0
      });
      setShowAddModal(false);
      setName('');
      setInitialBalance('');
      fetchAccounts();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create account');
    }
  };

  const handleDeleteAccount = async (id) => {
    if (!window.confirm('Delete this account?')) return;
    try {
      await accountService.deleteAccount(id);
      fetchAccounts();
    } catch (e) {
      alert('Failed to delete account');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Accounts & Balances</h2>
          <p className="text-xs text-slate-500 font-semibold">Calculated dynamically from real transactions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer"
        >
          <Plus size={18} />
          Add Account
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 size={32} className="animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {accounts.map((acc) => (
            <AccountCard key={acc.id} account={acc} onDelete={handleDeleteAccount} />
          ))}
          {accounts.length === 0 && (
            <div className="col-span-full bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-xs">
              <Wallet size={40} className="mx-auto text-slate-400" />
              <p className="text-slate-600 font-semibold">No accounts found.</p>
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-lg text-slate-900">New Financial Account</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Account Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. SBI Bank, Paytm Wallet, Cash"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="bank">Bank Account</option>
                  <option value="cash">Cash</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="wallet">UPI / Digital Wallet</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Initial Opening Balance (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm shadow-md shadow-blue-600/20 transition-all"
              >
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Accounts;
