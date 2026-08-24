import React, { useState, useEffect } from 'react';
import StatCard from '../components/dashboard/StatCard';
import TransactionCard from '../components/transactions/TransactionCard';
import transactionService from '../services/transactionService';
import accountService from '../services/accountService';
import { Link } from 'react-router-dom';
import { Mic, TrendingDown, TrendingUp, PiggyBank, ArrowRight, PlusCircle, PieChart as PieIcon, BarChart3, LineChart as LineIcon, Wallet, Building, CreditCard, Smartphone, ShieldCheck } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar, Legend, RadialBarChart, RadialBar } from 'recharts';

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);

  // Metrics
  const [todaySpending, setTodaySpending] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [savings, setSavings] = useState(0);

  // Chart datasets
  const [dailyData, setDailyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [accountData, setAccountData] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [totalNetWorth, setTotalNetWorth] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [txRes, accRes] = await Promise.all([
        transactionService.getTransactions({ limit: 100 }),
        accountService.getAccounts()
      ]);

      const txList = txRes.transactions || [];
      const accList = accRes.accounts || [];

      setTransactions(txList);
      setAccounts(accList);

      calculateMetrics(txList, accList);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (txList, accList) => {
    const now = new Date();
    const todayDateStr = now.toDateString();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let todayTotal = 0;
    let mExpense = 0;
    let mIncome = 0;

    const catMap = {};
    const dateMap = {};

    txList.forEach(t => {
      const amount = parseFloat(t.amount) || 0;
      let tDate = new Date();
      if (t.transaction_date) {
        tDate = new Date(t.transaction_date);
      }

      const isToday = tDate.toDateString() === todayDateStr;
      const isThisMonth = tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;

      if (t.type === 'expense' && isToday) {
        todayTotal += amount;
      }

      if (t.type === 'expense') {
        if (isThisMonth) mExpense += amount;

        const catName = t.category_name || t.category || 'Other';
        catMap[catName] = (catMap[catName] || 0) + amount;

        const dateKey = tDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        dateMap[dateKey] = (dateMap[dateKey] || 0) + amount;
      } else if (t.type === 'income') {
        if (isThisMonth) mIncome += amount;
      }
    });

    if (mExpense === 0 && txList.some(t => t.type === 'expense')) {
      mExpense = txList.filter(t => t.type === 'expense').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    }
    if (mIncome === 0 && txList.some(t => t.type === 'income')) {
      mIncome = txList.filter(t => t.type === 'income').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    }

    setTodaySpending(todayTotal);
    setMonthlyExpenses(mExpense);
    setMonthlyIncome(mIncome);
    setSavings(mIncome - mExpense);

    // 1. Solid Pie Chart Data
    const CATEGORY_COLORS = ['#ef4444', '#2563eb', '#f59e0b', '#ec4899', '#8b5cf6', '#10b981', '#06b6d4', '#64748b'];
    const formattedCatData = Object.keys(catMap).map((cat, idx) => ({
      name: cat,
      value: catMap[cat],
      color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
    }));
    setCategoryData(formattedCatData);

    // 2. Line Chart Daily Data
    const formattedDaily = Object.keys(dateMap).map(dateStr => ({
      date: dateStr,
      spending: dateMap[dateStr]
    })).reverse();

    if (formattedDaily.length === 0) {
      formattedDaily.push({ date: 'Today', spending: todayTotal });
    }
    setDailyData(formattedDaily);

    // 3. Account Distribution & Share Progress
    const totalAssets = accList.reduce((sum, a) => sum + (parseFloat(a.current_balance) || 0), 0);
    setTotalNetWorth(totalAssets);

    const ACC_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    const formattedAccData = accList.map((a, idx) => {
      const bal = parseFloat(a.current_balance || 0);
      const share = totalAssets > 0 ? Math.round((bal / totalAssets) * 100) : 0;
      return {
        id: a.id,
        name: a.name,
        type: a.type,
        balance: bal,
        share,
        color: ACC_COLORS[idx % ACC_COLORS.length],
        fill: ACC_COLORS[idx % ACC_COLORS.length]
      };
    });
    setAccountData(formattedAccData);

    // 4. Income vs Expense Comparison
    setComparisonData([
      { name: 'This Month', Income: mIncome, Expense: mExpense }
    ]);
  };

  const getAccountIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'cash': return Wallet;
      case 'bank': return Building;
      case 'credit_card': return CreditCard;
      case 'wallet': return Smartphone;
      default: return ShieldCheck;
    }
  };

  return (
    <div className="space-y-8">
      {/* Rich Hero Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-blue-600/20 relative overflow-hidden">
        <div className="space-y-2 text-center md:text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider">
            <Mic size={14} className="animate-pulse" /> Voice-First Active
          </span>
          <h2 className="text-2xl sm:text-3xl font-black">Record expenses hands-free</h2>
          <p className="text-sm text-blue-100 max-w-lg font-medium">
            Select language and speak naturally: <span className="font-mono text-white font-bold bg-white/10 px-2 py-0.5 rounded">"Petrol for bike"</span> or <span className="font-mono text-white font-bold bg-white/10 px-2 py-0.5 rounded">"Lunch with colleagues"</span>.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/voice-expense"
            className="bg-white hover:bg-slate-100 text-blue-600 font-extrabold px-6 py-3.5 rounded-2xl flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all text-sm cursor-pointer"
          >
            <Mic size={20} className="text-red-500" />
            Voice Recorder
          </Link>
          <Link
            to="/add-expense"
            className="bg-white/15 hover:bg-white/25 text-white font-bold px-4 py-3.5 rounded-2xl flex items-center gap-2 border border-white/20 text-sm transition-all"
          >
            <PlusCircle size={18} />
            Manual
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Today's Spending"
          amount={todaySpending}
          subtitle="Spent today"
          icon={TrendingDown}
          color="red"
        />
        <StatCard
          title="Monthly Expenses"
          amount={monthlyExpenses}
          subtitle="Total expenses"
          icon={TrendingDown}
          color="purple"
        />
        <StatCard
          title="Monthly Income"
          amount={monthlyIncome}
          subtitle="Total income"
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Net Savings"
          amount={savings}
          subtitle="Income minus expenses"
          icon={PiggyBank}
          color={savings >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Recharts Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Monthly Spending Trend LINE CHART */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-md shadow-slate-200/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <LineIcon size={18} className="text-rose-500" /> Daily Spending Line Chart
            </h3>
            <span className="text-xs font-bold text-slate-400">Timeline</span>
          </div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 600 }}
                  formatter={(value) => [`₹${value}`, 'Spending']}
                />
                <Line
                  type="monotone"
                  dataKey="spending"
                  stroke="#ef4444"
                  strokeWidth={3.5}
                  dot={{ r: 5, fill: '#ef4444', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 8, stroke: '#ef4444', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category Breakdown SOLID PIE CHART */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-md shadow-slate-200/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <PieIcon size={18} className="text-blue-600" /> Category Breakdown Pie Chart
            </h3>
            <span className="text-xs font-bold text-slate-400">Expenses</span>
          </div>
          <div style={{ width: '100%', height: 280 }} className="flex items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="45%"
                    outerRadius={85}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 600 }}
                    formatter={(val) => [`₹${val}`, 'Amount']}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: '#64748b', fontSize: '12px', fontWeight: 600 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400 py-8">
                <PieIcon size={36} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold">Record your first expense to view category distribution!</p>
              </div>
            )}
          </div>
        </div>

        {/* Chart 3: Income vs Expense Comparison BarChart */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-md shadow-slate-200/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <BarChart3 size={18} className="text-emerald-600" /> Income vs Expense Comparison
            </h3>
            <span className="text-xs font-bold text-slate-400">Overview</span>
          </div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 600 }}
                  formatter={(val) => [`₹${val}`]}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
                <Bar dataKey="Income" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Expense" fill="#ef4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Visual 4: Account Assets Breakdown & Share Card Widget */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-md shadow-slate-200/50 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Wallet size={18} className="text-blue-600" /> Account Asset Breakdown
              </h3>
              <span className="text-xs text-slate-500 font-bold">
                Total Liquid Net Worth: <span className="text-blue-600 font-extrabold">₹{totalNetWorth.toLocaleString('en-IN')}</span>
              </span>
            </div>
            <Link to="/accounts" className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
              Manage <ArrowRight size={14} />
            </Link>
          </div>

          <div className="space-y-3.5 overflow-y-auto max-h-[220px] pr-1">
            {accountData.map((acc) => {
              const AccIcon = getAccountIcon(acc.type);
              return (
                <div key={acc.id} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-xs text-blue-600">
                        <AccIcon size={16} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{acc.name}</h4>
                        <span className="text-[10px] text-slate-400 font-bold capitalize">{acc.type}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-black text-slate-900 text-sm">₹{acc.balance.toLocaleString('en-IN')}</p>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        {acc.share}% share
                      </span>
                    </div>
                  </div>

                  {/* Share Progress Bar */}
                  <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(acc.share, 100)}%`, backgroundColor: acc.color }}
                    ></div>
                  </div>
                </div>
              );
            })}

            {accountData.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-6">No financial accounts set up yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-md shadow-slate-200/50 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900">Recent Transactions</h3>
          <Link to="/transactions" className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
            View All <ArrowRight size={14} />
          </Link>
        </div>

        <div className="space-y-3">
          {transactions.slice(0, 5).map((t) => (
            <TransactionCard key={t.id} transaction={t} />
          ))}
          {transactions.length === 0 && (
            <p className="text-sm text-slate-400 italic text-center py-6">
              No transactions recorded yet. Tap 🎙️ to add your first expense!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
