import React from 'react';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import BottomNav from '../components/common/BottomNav';
import { Outlet, useLocation } from 'react-router-dom';

export function MainLayout() {
  const location = useLocation();

  const getPageTitle = (path) => {
    switch (path) {
      case '/dashboard': return 'Dashboard';
      case '/transactions': return 'Transactions';
      case '/voice-expense': return 'Voice Expense';
      case '/add-expense': return 'Add Expense';
      case '/accounts': return 'Accounts & Balances';
      case '/budgets': return 'Budgets';
      case '/analytics': return 'Analytics & Insights';
      case '/settings': return 'Settings';
      default: return 'VoxExpense';
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        <Header title={getPageTitle(location.pathname)} />
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

export default MainLayout;
