import React, { useState, useEffect } from 'react';
import BudgetCard from '../components/budgets/BudgetCard';
import budgetService from '../services/budgetService';
import categoryService from '../services/categoryService';
import { Plus, PiggyBank, Loader2, X } from 'lucide-react';

export function Budgets() {
  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState('monthly');

  useEffect(() => {
    fetchBudgetsData();
  }, []);

  const fetchBudgetsData = async () => {
    setLoading(true);
    try {
      const [bRes, cRes] = await Promise.all([
        budgetService.getBudgets(),
        categoryService.getCategories()
      ]);
      setBudgets(bRes.budgets || []);
      setCategories(cRes.categories || []);
      if (cRes.categories?.length > 0) {
        setSelectedCategory(cRes.categories[0].id);
      }
    } catch (err) {
      console.error('Failed to load budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    try {
      await budgetService.createBudget({
        category_id: selectedCategory,
        amount: parseFloat(amount),
        period
      });
      setShowAddModal(false);
      setAmount('');
      fetchBudgetsData();
    } catch (err) {
      alert('Failed to save budget');
    }
  };

  const handleDeleteBudget = async (id) => {
    if (!window.confirm('Delete this budget?')) return;
    try {
      await budgetService.deleteBudget(id);
      fetchBudgetsData();
    } catch (e) {
      alert('Failed to delete budget');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Monthly Budgets</h2>
          <p className="text-xs text-slate-500 font-semibold">Set category spending limits and monitor progress</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer"
        >
          <Plus size={18} />
          Create Budget
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 size={32} className="animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {budgets.map((b) => (
            <BudgetCard key={b.id} budget={b} onDelete={handleDeleteBudget} />
          ))}
          {budgets.length === 0 && (
            <div className="col-span-full bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-xs">
              <PiggyBank size={40} className="mx-auto text-slate-400" />
              <p className="text-slate-600 font-semibold">No budgets created yet.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                + Set up your first budget
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-lg text-slate-900">Create Budget Limit</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Budget Limit (₹)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 6000"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Period</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm shadow-md shadow-blue-600/20 transition-all"
              >
                Save Budget
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Budgets;
