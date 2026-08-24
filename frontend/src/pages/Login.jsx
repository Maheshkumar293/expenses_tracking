import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Loader2, Lock, User } from 'lucide-react';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      await login(identifier, password);
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-black text-slate-900 text-center mb-1">Welcome Back</h2>
      <p className="text-xs text-slate-500 font-semibold text-center mb-6">Sign in to track your expenses by voice</p>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-xl mb-4 font-bold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Username or Email</label>
          <div className="relative">
            <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. nethu or user@example.com"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer mt-6"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
          Sign In
        </button>
      </form>

      <div className="mt-6 text-center text-xs font-semibold text-slate-500">
        Don't have an account?{' '}
        <Link to="/register" className="text-blue-600 font-extrabold hover:underline">
          Create Account
        </Link>
      </div>
    </div>
  );
}

export default Login;
