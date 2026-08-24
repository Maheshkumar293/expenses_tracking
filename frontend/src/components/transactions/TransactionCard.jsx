import React from 'react';
import { Edit, Trash2, Tag, Calendar, Wallet } from 'lucide-react';

export function TransactionCard({ transaction, onEdit, onDelete }) {
  const isExpense = transaction.type === 'expense';
  const isIncome = transaction.type === 'income';

  const formatSource = (src) => {
    if (src === 'voice') return { label: '🎙️ Voice', color: 'bg-rose-50 text-rose-600 border-rose-200' };
    if (src === 'text') return { label: '⌨ Text', color: 'bg-purple-50 text-purple-600 border-purple-200' };
    return { label: '📝 Manual', color: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  const srcInfo = formatSource(transaction.source);

  return (
    <div className="bg-white border border-slate-200/90 hover:border-blue-300 rounded-2xl p-4 transition-all shadow-xs hover:shadow-md group">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-white shrink-0 shadow-sm"
            style={{ backgroundColor: transaction.category_color || '#2563eb' }}
          >
            {transaction.category_name ? transaction.category_name.charAt(0).toUpperCase() : 'T'}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-slate-900 text-base truncate">{transaction.description}</h4>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold ${srcInfo.color}`}>
                {srcInfo.label}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <Tag size={12} className="text-slate-400" />
                {transaction.category_name || 'General'}
              </span>
              {transaction.account_name && (
                <span className="flex items-center gap-1 font-medium text-slate-600">
                  <Wallet size={12} className="text-slate-400" />
                  {transaction.account_name}
                </span>
              )}
              <span className="flex items-center gap-1 font-medium text-slate-400">
                <Calendar size={12} />
                {new Date(transaction.transaction_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className={`font-black text-lg ${isIncome ? 'text-emerald-600' : isExpense ? 'text-rose-600' : 'text-blue-600'}`}>
              {isIncome ? '+' : '-'}₹{parseFloat(transaction.amount || 0).toLocaleString('en-IN')}
            </p>
            {transaction.payment_method && (
              <span className="text-[10px] text-slate-400 font-semibold block">
                via {transaction.payment_method}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                onClick={() => onEdit(transaction)}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit size={16} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(transaction.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TransactionCard;
