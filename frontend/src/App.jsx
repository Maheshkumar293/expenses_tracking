import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import AddExpense from './pages/AddExpense';
import VoiceExpense from './pages/VoiceExpense';
import Budgets from './pages/Budgets';
import Accounts from './pages/Accounts';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children }) {
  const { user, loading } = React.useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col justify-center items-center">
        <Loader2 size={40} className="animate-spin text-blue-500 mb-3" />
        <p className="text-xs text-gray-400 font-medium">Loading VoxExpense...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicAuthRoute({ children }) {
  const { user, loading } = React.useContext(AuthContext);

  if (loading) return null;

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route
            element={
              <PublicAuthRoute>
                <AuthLayout />
              </PublicAuthRoute>
            }
          >
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Protected Application Routes */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/voice-expense" element={<VoiceExpense />} />
            <Route path="/add-expense" element={<AddExpense />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
