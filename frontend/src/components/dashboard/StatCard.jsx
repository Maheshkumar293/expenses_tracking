import React from 'react';

export function StatCard({ title, amount, subtitle, icon: Icon, color = 'blue' }) {
  const colorStyles = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    red: 'bg-rose-50 border-rose-200 text-rose-600',
    green: 'bg-emerald-50 border-emerald-200 text-emerald-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600'
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-md shadow-slate-200/40 relative overflow-hidden flex flex-col justify-between hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-2xl border ${colorStyles[color] || colorStyles.blue}`}>
            <Icon size={20} />
          </div>
        )}
      </div>

      <div>
        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          ₹{typeof amount === 'number' ? amount.toLocaleString('en-IN') : amount}
        </h3>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-1 font-semibold">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

export default StatCard;
