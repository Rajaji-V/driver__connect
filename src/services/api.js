import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const API_BASE = API_URL.replace(/\/?api$/, '');

// Create axios instance with base URL
const api = axios.create({
    baseURL: API
});

// Add token to requests if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

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

export const jobService = {
    getJobs: () => api.get('/jobs'),
    createJob: (jobData) => api.post('/jobs', jobData),
    applyForJob: (jobId) => api.post(`/jobs/${jobId}/apply`),
    updateApplication: (jobId, applicationId, status) => 
        api.put(`/jobs/${jobId}/applications/${applicationId}`, { status }),
    updateJobStatus: (jobId, status) => api.put(`/jobs/${jobId}/status`, { status }),
    deleteJob: (jobId) => api.delete(`/jobs/${jobId}`),
};

export const profileService = {
    getMyProfile: () => api.get('/profile'),
    upsertMyProfile: (data) => api.post('/profile', data),
};

export const uploadService = {
    uploadFile: async (file) => {
        const form = new FormData();
        form.append('file', file);
        const res = await api.post('/upload/single', form, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        const rel = res.data.url || '';
        const abs = rel.startsWith('http') ? rel : `${API_BASE}${rel}`;
        return { ...res.data, url: abs }; // ensure absolute url
    }
};

export const adminService = {
    getStats: () => api.get('/admin/stats'),
};