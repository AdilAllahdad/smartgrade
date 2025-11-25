import axios from 'axios';
import { API_URL } from '../config/api.config';

// Export API_BASE_URL for backward compatibility
export const API_BASE_URL = API_URL;

// Create an axios instance with default config
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor
api.interceptors.request.use(
    (config) => {
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

// Add response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle session expiry
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return Promise.reject(new Error('Your session has expired. Please log in again.'));
        }

        // Handle other errors
        const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
        return Promise.reject(new Error(errorMessage));
    }
);

// User Registration
export const registerUser = async (userData) => {
    try {
        const response = await api.post('/auth/register', userData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export default api;
