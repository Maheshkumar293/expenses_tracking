import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, Mic } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Header({ title }) {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-30 px-4 py-3 sm:px-6 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          {title || 'Dashboard'}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/voice-expense"
          className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-md shadow-red-500/20"
        >
          <Mic size={15} className="animate-pulse" />
          <span className="hidden sm:inline">Voice Expense</span>
        </Link>

        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/20 border border-blue-400/30">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight">{user.name}</p>
                <p className="text-[10px] text-blue-600 font-semibold leading-tight">@{user.username}</p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign out"
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
