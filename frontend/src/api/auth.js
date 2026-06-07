import api from './axios';

export const login = async (email, password) => {
  const { data } = await api.post('/api/auth/login', { email, password });
  return data;
};

export const register = async (name, email, password, role) => {
  const { data } = await api.post('/api/auth/register', { name, email, password, role });
  return data;
};

export const studentLogin = async (rollNo, password) => {
  const { data } = await api.post('/api/auth/student-login', { rollNo, password });
  return data;
};
