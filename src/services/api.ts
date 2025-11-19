import axios from 'axios';
import { Platform } from 'react-native';
import { UserData, LoginData } from '../types/types';

// Configure base URL based on where the app is running
const getBaseURL = () => {
    if (Platform.OS === 'web') {
        return 'http://localhost:5000/api';
    } else {
        return 'http://192.168.18.160:5000/api';
    }
};

const BASE_URL = getBaseURL();

console.log('🔧 API Configuration:');
console.log('📡 Base URL:', BASE_URL);
console.log('📱 Platform:', Platform.OS);

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const baseURL = config.baseURL || 'unknown';
        const url = config.url || 'unknown';
        console.log('🚀 Making API request to:', baseURL + url);
        return config;
    },
    (error) => {
        console.log('❌ Request setup error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        console.log('✅ API Response Success:', response.status);
        return response;
    },
    (error) => {
        console.log('❌ API Error:', error.message);
        console.log('🔧 Error code:', error.code);

        if (error.response) {
            throw new Error(error.response.data.message || `Server error: ${error.response.status}`);
        } else if (error.request) {
            throw new Error(`Cannot connect to server at ${BASE_URL}. Check if backend is running.`);
        } else {
            throw new Error('Request configuration error: ' + error.message);
        }
    }
);

// Auth API methods - now with simple types
export const authAPI = {
    registerClient: (userData: UserData) => api.post('/auth/register', userData),
    registerOperational: (userData: UserData) => api.post('/auth/register-operational', userData),
    login: (loginData: LoginData) => api.post('/auth/login', loginData),
    testConnection: () => api.get('/test'),
};

export default api;