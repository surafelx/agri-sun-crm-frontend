import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
export const TOKEN_KEY = 'agrisun_crm_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      removeToken();
      window.location.href = '/auth';
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────────────────────
export const auth = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/change-password', { currentPassword, newPassword }),
};

// ── Customers ─────────────────────────────────────────────────────────────────
export const customers = {
  list:   (params?: Record<string, any>) => api.get('/customers', { params }),
  get:    (id: string) => api.get(`/customers/${id}`),
  create: (data: any) => api.post('/customers', data),
  update: (id: string, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
  installations: (id: string) => api.get(`/customers/${id}/installations`),
};

// ── Installations ─────────────────────────────────────────────────────────────
export const installations = {
  list:   (params?: Record<string, any>) => api.get('/installations', { params }),
  get:    (id: string) => api.get(`/installations/${id}`),
  create: (data: any) => api.post('/installations', data),
  update: (id: string, data: any) => api.put(`/installations/${id}`, data),
  delete: (id: string) => api.delete(`/installations/${id}`),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboard = {
  stats:              () => api.get('/dashboard/stats'),
  byStatus:           () => api.get('/dashboard/installations-by-status'),
  byRegion:           () => api.get('/dashboard/customers-by-region'),
  monthlyInstallations: () => api.get('/dashboard/monthly-installations'),
};
