import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 45000, // 45s — Render free tier cold starts can take 30-50s
});

// ── Request: attach JWT token ──
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ht_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ── Response: handle 401, retries for timeouts, and extract error messages ──
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Auto-retry on timeout or network errors (max 2 retries)
    const isRetryable =
      (error.code === 'ECONNABORTED' || !error.response) &&
      config &&
      (!config._retryCount || config._retryCount < 2);

    if (isRetryable) {
      config._retryCount = (config._retryCount || 0) + 1;

      // Brief pause before retry (1s first, 2s second)
      await new Promise((r) => setTimeout(r, config._retryCount * 1000));

      return api(config);
    }

    // On 401, redirect to login — but NOT if the request itself was a login attempt
    // (so the login page can show the "invalid credentials" error instead of reloading)
    const isLoginRequest =
      config?.url?.includes('/auth/login') ||
      config?.url?.includes('/auth/student-login');

    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('ht_token');
      localStorage.removeItem('ht_user');
      window.location.href = '/login';
    }

    // Provide user-friendly error messages
    let message;
    if (error.code === 'ECONNABORTED') {
      message = 'Server is taking too long to respond. Please try again.';
    } else if (!error.response) {
      message = 'Unable to reach the server. Check your internet connection.';
    } else {
      message =
        error.response?.data?.message ||
        error.message ||
        'Something went wrong';
    }

    error.message = message;

    return Promise.reject(error);
  }
);

// ── Warm-up ping: wake the server on page load (Render cold start) ──
// Fire-and-forget — no need to await or handle errors
if (BASE_URL.includes('render.com') || BASE_URL.includes('onrender.com')) {
  fetch(`${BASE_URL}/api/health`, { method: 'GET', mode: 'cors' }).catch(() => {});
}

export default api;