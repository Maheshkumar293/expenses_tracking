import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ReceiptText, Mic, Wallet, PiggyBank, BarChart3, Settings, PlusCircle, Sparkles } from 'lucide-react';

export function Sidebar() {
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/transactions', label: 'Transactions', icon: ReceiptText },
    { to: '/voice-expense', label: 'Voice Expense', icon: Mic, highlight: true },
    { to: '/add-expense', label: 'Add Manual', icon: PlusCircle },
    { to: '/accounts', label: 'Accounts', icon: Wallet },
    { to: '/budgets', label: 'Budgets', icon: PiggyBank },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col h-screen sticky top-0 hidden md:flex shadow-xs">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 border border-blue-400/30">
          <Mic className="text-white" size={22} />
        </div>
        <div>
          <h2 className="font-black text-lg text-slate-900 tracking-tight flex items-center gap-1">
            VoxExpense <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded font-mono font-bold">v1.0</span>
          </h2>
          <p className="text-[11px] text-slate-400 font-medium">Voice Financial Tracker</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                    : item.highlight
                    ? 'text-red-600 bg-red-50/80 border border-red-200/70 hover:bg-red-100'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                }`
              }
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-2xl p-3.5 border border-slate-200/80 text-xs text-slate-600 shadow-inner">
          <p className="font-bold text-blue-700 mb-1 flex items-center gap-1">
            <Sparkles size={13} /> Speak Naturally
          </p>
          <p className="italic font-mono text-[11px] text-slate-700">"Nethu petrol-ku 600 rupees spend panniten"</p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
