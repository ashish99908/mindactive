import api from './api.js';

export const login = async (email, password, role) => {
  const res = await api.post('/auth/login', { email, password, role });
  return res.data;
};

export const register = async (userData) => {
  const res = await api.post('/auth/register', userData);
  return res.data;
};

export const getCurrentUser = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { id: payload.userId, role: payload.role, patientId: payload.patientId };
  } catch { return null; }
};

export const logout = () => localStorage.removeItem('token');