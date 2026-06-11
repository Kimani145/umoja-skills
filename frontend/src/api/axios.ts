import axios from 'axios';

// Ensure the configured URL always ends with /api to prevent 404s
const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const baseURL = rawUrl.replace(/\/+$/, '').endsWith('api')
  ? rawUrl.replace(/\/+$/, '')
  : `${rawUrl.replace(/\/+$/, '')}/api`;

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401: attempt refresh, else logout
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post(
            `${baseURL}/auth/token/refresh/`,
            { refresh }
          );
          localStorage.setItem('access_token', data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
