import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL
    || (import.meta.env.DEV ? 'http://localhost:3000/api' : '/api');

const api = axios.create({
    baseURL: API_URL
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const auth = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    me: () => api.get('/auth/me'),
    updateMe: (data) => api.put('/auth/me', data)
};

export const clients = {
    list: () => api.get('/clients'),
    create: (data) => api.post('/clients', data),
    update: (id, data) => api.put(`/clients/${id}`, data),
    delete: (id) => api.delete(`/clients/${id}`)
};

export const budgets = {
    list: () => api.get('/budgets'),
    get: (id) => api.get(`/budgets/${id}`),
    create: (data) => api.post('/budgets', data),
    update: (id, data) => api.put(`/budgets/${id}`, data),
    delete: (id) => api.delete(`/budgets/${id}`)
};

export const actions = {
    downloadPDF: (id) => {
        return api.get(`/actions/budgets/${id}/pdf`, { responseType: 'blob' });
    },
    getWhatsAppLink: (id) => api.get(`/actions/budgets/${id}/whatsapp`),
    getActivationLink: () => api.get('/actions/activation/whatsapp')
};

export default api;
