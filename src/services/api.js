import axios from 'axios';

// -----------------------------
// API URL
// -----------------------------
// Use environment variable if set, otherwise fallback to your deployed backend
export const API_URL = import.meta.env.VITE_API_URL || "https://driverconnect.onrender.com/api";

// Base URL without `/api` for generating absolute URLs
export const API_BASE = API_URL.replace(/\/?api$/, '');

// -----------------------------
// Axios instance
// -----------------------------
const api = axios.create({
    baseURL: API_URL
});

// Add token to all requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// -----------------------------
// Auth Service
// -----------------------------
export const authService = {
    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
};

// -----------------------------
// Job Service
// -----------------------------
export const jobService = {
    getJobs: () => api.get('/jobs'),
    createJob: (jobData) => api.post('/jobs', jobData),
    applyForJob: (jobId) => api.post(`/jobs/${jobId}/apply`),
    updateApplication: (jobId, applicationId, status) =>
        api.put(`/jobs/${jobId}/applications/${applicationId}`, { status }),
    updateJobStatus: (jobId, status) => api.put(`/jobs/${jobId}/status`, { status }),
    deleteJob: (jobId) => api.delete(`/jobs/${jobId}`)
};

// -----------------------------
// Profile Service
// -----------------------------
export const profileService = {
    getMyProfile: () => api.get('/profile'),
    upsertMyProfile: (data) => api.post('/profile', data)
};

// -----------------------------
// Upload Service
// -----------------------------
export const uploadService = {
    uploadFile: async (file) => {
        const form = new FormData();
        form.append('file', file);

        const res = await api.post('/upload/single', form, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        const rel = res.data.url || '';
        const abs = rel.startsWith('http') ? rel : `${API_BASE}${rel}`;
        return { ...res.data, url: abs };
    }
};

// -----------------------------
// Admin Service
// -----------------------------
export const adminService = {
    getStats: () => api.get('/admin/stats')
};
