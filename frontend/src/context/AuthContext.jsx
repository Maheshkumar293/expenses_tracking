import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setLoading(true);
    try {
      const data = await authService.getMe();
      setUser(data.user);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (identifier, password) => {
    setError(null);
    try {
      const data = await authService.login(identifier, password);
      setUser(data.user);
      return data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to login';
      setError(msg);
      throw new Error(msg);
    }
  };

  const register = async (username, email, password, name) => {
    setError(null);
    try {
      const data = await authService.register(username, email, password, name);
      setUser(data.user);
      return data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to register';
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updateProfile = async (name, email) => {
    const data = await authService.updateProfile(name, email);
    setUser(data.user);
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, updateProfile, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
