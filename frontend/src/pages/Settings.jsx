import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import authService from '../services/authService';
import { User, Lock, Save, CheckCircle2, Shield } from 'lucide-react';

export function Settings() {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileMsg, setProfileMsg] = useState(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState(null);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    try {
      await updateProfile(name, email);
      setProfileMsg('Profile updated successfully');
    } catch (err) {
      alert('Failed to update profile');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setPasswordMsg('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to change password');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900">Account Settings</h2>
        <p className="text-xs text-slate-500 font-semibold">Manage your profile details and security</p>
      </div>

      {/* Profile Form */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-4 shadow-md shadow-slate-200/50">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <User className="text-blue-600" size={18} /> User Profile
        </h3>

        {profileMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3 rounded-xl flex items-center gap-2 font-bold">
            <CheckCircle2 size={16} /> {profileMsg}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save size={16} /> Update Profile
          </button>
        </form>
      </div>

      {/* Password Form */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-4 shadow-md shadow-slate-200/50">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Lock className="text-rose-600" size={18} /> Security & Password
        </h3>

        {passwordMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3 rounded-xl flex items-center gap-2 font-bold">
            <CheckCircle2 size={16} /> {passwordMsg}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold px-5 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Shield size={16} /> Change Password
          </button>
        </form>
      </div>
    </div>
  );
}

export default Settings;
