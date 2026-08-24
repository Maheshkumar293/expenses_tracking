import React from 'react';
import { Wallet, Building, CreditCard, Smartphone, Shield } from 'lucide-react';

export function AccountCard({ account, onDelete }) {
  const getIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'cash': return Wallet;
      case 'bank': return Building;
      case 'credit_card': return CreditCard;
      case 'wallet': return Smartphone;
      default: return Shield;
    }
  };

  const Icon = getIcon(account.type);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-md flex flex-col justify-between space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-600 rounded-2xl">
            <Icon size={22} />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 text-base">{account.name}</h4>
            <span className="text-xs text-slate-500 font-semibold capitalize">{account.type} Account</span>
          </div>
        </div>

        {onDelete && (
          <button
            onClick={() => onDelete(account.id)}
            className="text-xs text-slate-400 hover:text-rose-600 font-bold p-1"
          >
            Delete
          </button>
        )}
      </div>

      <div>
        <span className="text-xs text-slate-400 uppercase font-extrabold">Current Calculated Balance</span>
        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
          ₹{parseFloat(account.current_balance || 0).toLocaleString('en-IN')}
        </h3>
        <p className="text-[11px] text-slate-500 font-semibold mt-1">
          Initial: ₹{parseFloat(account.initial_balance || 0).toLocaleString('en-IN')}
        </p>
      </div>
    </div>
  );
}

export default AccountCard;
