import React, { useState, useEffect } from 'react';
import TransactionCard from '../components/transactions/TransactionCard';
import ExpenseForm from '../components/transactions/ExpenseForm';
import transactionService from '../services/transactionService';
import categoryService from '../services/categoryService';
import accountService from '../services/accountService';
import { Search, Plus, Loader2, ArrowUpDown } from 'lucide-react';

export function Transactions() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals / Editing state
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchFilteredTransactions();
  }, [search, selectedCategory, selectedAccount, selectedType, sortOrder]);

  const fetchInitialData = async () => {
    try {
      const [catRes, accRes] = await Promise.all([
        categoryService.getCategories(),
        accountService.getAccounts()
      ]);
      setCategories(catRes.categories || []);
      setAccounts(accRes.accounts || []);
    } catch (e) {
      console.error('Error fetching filter options', e);
    }
  };

  const fetchFilteredTransactions = async () => {
    setLoading(true);
    try {
      const res = await transactionService.getTransactions({
        search: search || undefined,
        category_id: selectedCategory || undefined,
        account_id: selectedAccount || undefined,
        type: selectedType || undefined,
        limit: 100
      });

      let list = res.transactions || [];
      if (sortOrder === 'asc') {
        list.reverse();
      }
      setTransactions(list);
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await transactionService.deleteTransaction(id);
      fetchFilteredTransactions();
    } catch (err) {
      alert('Failed to delete transaction');
    }
  };

  return (
    <div className="space-y-6">
      {isAddingNew || editingTransaction ? (
        <ExpenseForm
          initialData={editingTransaction}
          onSuccess={() => {
            setIsAddingNew(false);
            setEditingTransaction(null);
            fetchFilteredTransactions();
          }}
          onCancel={() => {
            setIsAddingNew(false);
            setEditingTransaction(null);
          }}
        />
      ) : (
        <>
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900">All Transactions</h2>
              <p className="text-xs text-slate-500 font-semibold">Search, filter, edit, or delete records</p>
            </div>
            <button
              onClick={() => setIsAddingNew(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Plus size={18} />
              Add Transaction
            </button>
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-4 space-y-3 shadow-md shadow-slate-200/40">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search description, merchant, or notes..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                />
              </div>

              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold flex items-center gap-1.5 shrink-0"
              >
                <ArrowUpDown size={14} />
                {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
              </button>
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
              >
                <option value="">All Types (Expense, Income, Transfer)</option>
                <option value="expense">Expense Only</option>
                <option value="income">Income Only</option>
                <option value="transfer">Transfer Only</option>
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
              >
                <option value="">All Accounts</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Transactions List */}
          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 size={32} className="animate-spin text-blue-600" />
              </div>
            ) : transactions.length > 0 ? (
              transactions.map((t) => (
                <TransactionCard
                  key={t.id}
                  transaction={t}
                  onEdit={(item) => setEditingTransaction(item)}
                  onDelete={handleDelete}
                />
              ))
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs">
                <p className="text-slate-500 font-semibold">No transactions matching your search criteria.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Transactions;
