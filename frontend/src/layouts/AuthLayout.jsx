import React from 'react';
import { Outlet } from 'react-router-dom';
import { Mic } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 border border-blue-400/30">
          <Mic className="text-white" size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">VoxExpense</h1>
          <p className="text-xs text-blue-600 font-bold">Voice-First Financial Tracker</p>
        </div>
      </div>
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl shadow-xl shadow-slate-200/60 p-6 sm:p-8">
        <Outlet />
      </div>
    </div>
  );
}

export default AuthLayout;
