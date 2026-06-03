import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('romyntra_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global error normaliser
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || err.message || 'Something went wrong';
    return Promise.reject(new Error(msg));
  }
);

export default api;
