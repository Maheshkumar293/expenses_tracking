import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ReceiptText, Mic, PiggyBank, Menu } from 'lucide-react';

export function BottomNav() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-slate-200 px-3 py-2 shadow-lg">
      <div className="flex items-center justify-around">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[11px] font-bold transition-colors ${
              isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`
          }
        >
          <LayoutDashboard size={20} />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/transactions"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[11px] font-bold transition-colors ${
              isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`
          }
        >
          <ReceiptText size={20} />
          <span>Transactions</span>
        </NavLink>

        {/* Prominent Mic Action */}
        <NavLink
          to="/voice-expense"
          className="-mt-5 flex flex-col items-center"
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-red-500/30 border-4 border-slate-50 active:scale-95 transition-transform">
            <Mic size={26} className="animate-pulse" />
          </div>
          <span className="text-[10px] font-extrabold text-red-600 mt-0.5">Voice</span>
        </NavLink>

        <NavLink
          to="/budgets"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[11px] font-bold transition-colors ${
              isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`
          }
        >
          <PiggyBank size={20} />
          <span>Budgets</span>
        </NavLink>

        <NavLink
          to="/accounts"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[11px] font-bold transition-colors ${
              isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`
          }
        >
          <Menu size={20} />
          <span>Accounts</span>
        </NavLink>
      </div>
    </div>
  );
}

export default BottomNav;
