import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, getCurrentUser, logout as clearToken } from '../services/auth.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const userData = getCurrentUser();
      if (userData) setUser(userData);
      else localStorage.removeItem('token');
    }
    setLoading(false);
  }, []);

  const login = async (email, password, role) => {
    const data = await apiLogin(email, password, role);
    if (data.token) { localStorage.setItem('token', data.token); setUser(data.user); }
    return data;
  };

  const register = async (userData) => {
    const data = await apiRegister(userData);
    if (data.token) { localStorage.setItem('token', data.token); setUser(data.user); }
    return data;
  };

  const logout = () => { clearToken(); setUser(null); };

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);