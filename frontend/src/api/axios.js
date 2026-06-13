import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
});

// ── Request: attach JWT token ──
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ht_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ── Response: handle 401 and extract error messages ──
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ht_token');
      localStorage.removeItem('ht_user');
      window.location.href = '/login';
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong';

    error.message = message;

    return Promise.reject(error);
  }
);

export default api;