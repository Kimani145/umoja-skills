import axios from 'axios';

// Ensure the configured URL always ends with /api to prevent 404s
const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const baseURL = rawUrl.replace(/\/+$/, '').endsWith('api')
  ? rawUrl.replace(/\/+$/, '')
  : `${rawUrl.replace(/\/+$/, '')}/api`;

console.log('[axios] Configured baseURL:', baseURL);

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  console.log('[axios.request] Outgoing:', {
    method: config.method?.toUpperCase(),
    url: config.url,
    hasToken: !!token,
  });
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401: attempt refresh, else logout
api.interceptors.response.use(
  (res) => {
    console.log('[axios.response] Success:', {
      method: res.config.method?.toUpperCase(),
      url: res.config.url,
      status: res.status,
      dataType: typeof res.data,
      hasData: !!res.data,
    });
    return res;
  },
  async (error) => {
    console.error('[axios.response] Error:', {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      contentType: error.response?.headers?.['content-type'],
      dataType: typeof error.response?.data,
    });

    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          console.log('[axios.response] Attempting token refresh...');
          const { data } = await axios.post(
            `${baseURL}/auth/token/refresh/`,
            { refresh }
          );
          localStorage.setItem('access_token', data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          console.log('[axios.response] Token refreshed, retrying original request');
          return api(original);
        } catch (refreshError) {
          console.error('[axios.response] Token refresh failed, clearing auth');
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        console.error('[axios.response] No refresh token, clearing auth');
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
