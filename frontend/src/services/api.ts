import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle auth errors
let isRedirecting = false;
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isRedirecting) {
      // Only redirect for actual auth failures (expired token),
      // not for in-page API calls that can be handled by components.
      const isLoginEndpoint = error.config?.url?.includes('/auth/');
      if (!isLoginEndpoint) {
        isRedirecting = true;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Use a small delay to prevent redirect storms
        setTimeout(() => {
          window.location.href = '/';
          isRedirecting = false;
        }, 100);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
