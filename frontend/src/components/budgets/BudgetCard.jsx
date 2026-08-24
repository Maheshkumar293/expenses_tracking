import React from 'react';
import { AlertCircle } from 'lucide-react';

export function BudgetCard({ budget, onDelete }) {
  const percentage = budget.percentage || 0;
  const isOver = percentage >= 100;
  const isNear = percentage >= 80 && !isOver;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-sm"
            style={{ backgroundColor: budget.category_color || '#2563eb' }}
          >
            {budget.category_name ? budget.category_name.charAt(0) : 'B'}
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 text-base">{budget.category_name}</h4>
            <span className="text-xs text-slate-500 font-semibold capitalize">{budget.period} Budget</span>
          </div>
        </div>

        {onDelete && (
          <button
            onClick={() => onDelete(budget.id)}
            className="text-xs text-slate-400 hover:text-rose-600 transition-colors p-1 font-bold"
          >
            Remove
          </button>
        )}
      </div>

      <div>
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-sm font-bold text-slate-700">
            ₹{budget.spent.toLocaleString('en-IN')} / ₹{budget.amount.toLocaleString('en-IN')}
          </span>
          <span className={`text-sm font-black ${isOver ? 'text-rose-600' : isNear ? 'text-amber-600' : 'text-emerald-600'}`}>
            {percentage}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200 p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isOver ? 'bg-rose-500' : isNear ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>
      </div>

      {isOver && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200 font-bold">
          <AlertCircle size={14} />
          <span>Budget limit exceeded!</span>
        </div>
      )}
    </div>
  );
}

export default BudgetCard;
