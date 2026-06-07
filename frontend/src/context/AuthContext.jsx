import { createContext, useContext, useState, useEffect } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('ht_token');
    const savedUser  = localStorage.getItem('ht_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const _persist = (data) => {
    localStorage.setItem('ht_token', data.token);
    localStorage.setItem('ht_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  // Staff login (email + password)
  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    return _persist(data);
  };

  // Student login (roll no + password)
  const studentLogin = async (rollNo, password) => {
    const data = await authApi.studentLogin(rollNo, password);
    return _persist(data);
  };

  const logout = () => {
    localStorage.removeItem('ht_token');
    localStorage.removeItem('ht_user');
    setToken(null);
    setUser(null);
  };

  const isAdmin   = user?.role === 'admin';
  const isStudent = user?.role === 'student';
  const isStaff   = user?.role === 'admin' || user?.role === 'warden';

  return (
    <AuthContext.Provider value={{ user, token, login, studentLogin, logout, isAdmin, isStudent, isStaff }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
