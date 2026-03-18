import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/api/users/register', data),
  login: (data) => api.post('/api/users/login', data),
  getProfile: () => api.get('/api/users/profile'),
  updateProfile: (data) => api.put('/api/users/profile', data),
};

export const accountAPI = {
  create: (data) => api.post('/api/accounts', data),
  getMyAccounts: () => api.get('/api/accounts/my'),
  getById: (id) => api.get(`/api/accounts/${id}`),
  getByNumber: (num) => api.get(`/api/accounts/number/${num}`),
};

export const transactionAPI = {
  deposit: (data) => api.post('/api/transactions/deposit', data),
  withdraw: (data) => api.post('/api/transactions/withdraw', data),
  transfer: (data) => api.post('/api/transactions/transfer', data),
  getMyTransactions: (params) => api.get('/api/transactions/my', { params }),
  getAccountTransactions: (accountId, params) => api.get(`/api/transactions/account/${accountId}`, { params }),
};

export const loanAPI = {
  getTypes: () => api.get('/api/loans/types'),
  apply: (data) => api.post('/api/loans/apply', data),
  getMyLoans: () => api.get('/api/loans/my'),
  getById: (id) => api.get(`/api/loans/${id}`),
  repay: (id, data) => api.post(`/api/loans/${id}/repay`, data),
  getRepayments: (id) => api.get(`/api/loans/${id}/repayments`),
};

export const notificationAPI = {
  getMy: (params) => api.get('/api/notifications/my', { params }),
  markRead: (id) => api.patch(`/api/notifications/${id}/read`),
  markAllRead: () => api.patch('/api/notifications/read-all'),
  delete: (id) => api.delete(`/api/notifications/${id}`),
};

export default api;
