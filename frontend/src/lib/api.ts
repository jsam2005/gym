import axios from 'axios';

// Automatically use production API URL in production mode
// In production, API is served from same origin (Vercel)
const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === 'production' || import.meta.env.PROD
    ? '/api'  // Same origin - backend serves frontend
    : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// API Methods
export const clientAPI = {
  getAll: (params?: any) => api.get('/clients', { params }),
  getActive: () => api.get('/clients', { params: { status: 'active' } }),
  getInactive: () => api.get('/clients', { params: { status: 'inactive' } }),
  getById: (id: string) => api.get(`/clients/${id}`),
  getStats: () => api.get('/clients/stats'),
  create: (data: any) => api.post('/clients', data),
  update: (id: string, data: any) => api.put(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
  renew: (id: string, data: any) => api.post(`/clients/${id}/renew`, data),
  syncToDevice: (id: string) => api.post(`/clients/${id}/sync-device`),
};

export const packageAPI = {
  getAll: () => api.get('/packages'),
  getById: (id: string) => api.get(`/packages/${id}`),
  create: (data: any) => api.post('/packages', data),
  update: (id: string, data: any) => api.put(`/packages/${id}`, data),
  delete: (id: string) => api.delete(`/packages/${id}`),
};

export const biometricAPI = {
  // Device management
  testConnection: () => api.get('/biometric/device/test'),
  
  // Migration
  migrateUsers: () => api.post('/biometric/migrate'),
  
  // Client registration & enrollment
  registerClient: (data: { clientId: string }) => api.post('/biometric/register', data),
  enrollFingerprint: (data: { clientId: string; fingerIndex?: number }) => api.post('/biometric/enroll', data),
  
  // Access control
  updateSchedule: (data: { clientId: string; accessSchedule: any[] }) => api.put('/biometric/schedule', data),
  toggleAccess: (clientId: string, data: { enabled: boolean }) => api.put(`/biometric/toggle/${clientId}`, data),
  deleteFromDevice: (clientId: string) => api.delete(`/biometric/client/${clientId}`),
  
  // Logs & monitoring
  getAllLogs: (params?: any) => api.get('/biometric/logs', { params }),
  getClientLogs: (clientId: string, params?: any) => api.get(`/biometric/logs/${clientId}`, { params }),
  getDashboard: () => api.get('/biometric/dashboard'),
};

export const accessLogAPI = {
  getLogs: (params?: any) => api.get('/biometric/logs', { params }),
  getStats: () => api.get('/biometric/dashboard'),
};

export const etimetrackAPI = {
  getRealtimeLogs: (params?: any) => api.get('/etimetrack/logs/realtime', { params }),
};

export const settingsAPI = {
  // Profile
  getProfile: () => api.get('/settings/profile'),
  updateProfile: (data: any) => api.put('/settings/profile', data),
  uploadPhoto: (formData: FormData) => api.post('/settings/profile/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // Password
  changePassword: (data: any) => api.post('/settings/password/change', data),
  
  // Notifications
  updateNotifications: (data: any) => api.put('/settings/notifications', data),
  
  // Gym
  getGymSettings: () => api.get('/settings/gym'),
  updateGymInfo: (data: any) => api.put('/settings/gym', data),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export const billingAPI = {
  getClients: () => api.get('/billing/clients'),
  getPendingOverdue: () => api.get('/billing/pending-overdue'),
  getPaymentHistory: () => api.get('/billing/payments'),
  getUpcomingPayments: () => api.get('/billing/upcoming'),
  getSummary: () => api.get('/billing/summary'),
};

