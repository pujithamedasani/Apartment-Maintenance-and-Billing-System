import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000
});

// Attach token on every request
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle auth errors globally
API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default API;

// ── Auth ──
export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  register: (data) => API.post('/auth/register', data),
  me: () => API.get('/auth/me'),
  updatePassword: (data) => API.put('/auth/update-password', data),
};

// ── Dashboard ──
export const dashboardAPI = {
  admin: () => API.get('/dashboard/admin'),
  resident: () => API.get('/dashboard/resident'),
};

// ── Users ──
export const usersAPI = {
  getAll: (params) => API.get('/users', { params }),
  getOne: (id) => API.get(`/users/${id}`),
  create: (data) => API.post('/users', data),
  update: (id, data) => API.put(`/users/${id}`, data),
  delete: (id) => API.delete(`/users/${id}`),
  updateProfile: (data) => API.put('/users/profile/update', data),
};

// ── Apartments ──
export const apartmentsAPI = {
  getAll: (params) => API.get('/apartments', { params }),
  getOne: (id) => API.get(`/apartments/${id}`),
  create: (data) => API.post('/apartments', data),
  update: (id, data) => API.put(`/apartments/${id}`, data),
  delete: (id) => API.delete(`/apartments/${id}`),
  stats: () => API.get('/apartments/stats'),
};

// ── Invoices ──
export const invoicesAPI = {
  getAll: (params) => API.get('/invoices', { params }),
  getOne: (id) => API.get(`/invoices/${id}`),
  generate: (data) => API.post('/invoices/generate', data),
  generateBulk: (data) => API.post('/invoices/generate-bulk', data),
  update: (id, data) => API.put(`/invoices/${id}`, data),
  stats: () => API.get('/invoices/stats'),
};

// ── Payments ──
export const paymentsAPI = {
  getAll: (params) => API.get('/payments', { params }),
  record: (data) => API.post('/payments', data),
  byInvoice: (invoiceId) => API.get(`/payments/invoice/${invoiceId}`),
};

// ── Complaints ──
export const complaintsAPI = {
  getAll: (params) => API.get('/complaints', { params }),
  getOne: (id) => API.get(`/complaints/${id}`),
  create: (data) => API.post('/complaints', data),
  update: (id, data) => API.put(`/complaints/${id}`, data),
  stats: () => API.get('/complaints/stats'),
};

// ── Notices ──
export const noticesAPI = {
  getAll: (params) => API.get('/notices', { params }),
  create: (data) => API.post('/notices', data),
  update: (id, data) => API.put(`/notices/${id}`, data),
  delete: (id) => API.delete(`/notices/${id}`),
};
