import axios from 'axios';
import { Platform } from 'react-native';
import {UserData, LoginData, UploadInvoiceData, UpdateUserStatusData} from '../types/types';


const DEV_BACKEND_URL = ' https://latrice-untremolant-robert.ngrok-free.dev/api';

// Configure base URL based on where the app is running
const getBaseURL = () => {
    if (Platform.OS === 'web') {
        return 'http://localhost:5000/api';
    } else {
        // return 'http://192.168.137.1:5000/api';
        // return 'http://192.168.18.160:5000/api';
        return DEV_BACKEND_URL;
    }
};

const BASE_URL = getBaseURL();

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Helper function to convert file to base64
// const convertFileToBase64 = (fileUri: string): Promise<string> => {
//     return new Promise((resolve, reject) => {
//         const xhr = new XMLHttpRequest();
//         xhr.onload = function() {
//             const reader = new FileReader();
//             reader.onloadend = function() {
//                 resolve(reader.result as string);
//             };
//             reader.onerror = reject;
//             reader.readAsDataURL(xhr.response);
//         };
//         xhr.onerror = reject;
//         xhr.open('GET', fileUri);
//         xhr.responseType = 'blob';
//         xhr.send();
//     });
// };


// Request interceptor
api.interceptors.request.use(
    (config) => {
        const baseURL = config.baseURL || 'unknown';
        const url = config.url || 'unknown';
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
    registerClient: async (userData: UserData, invoiceFile?: any): Promise<any> => {
        try {
            const formData = new FormData();

            // Append all user data fields
            Object.keys(userData).forEach(key => {
                const value = (userData as any)[key];
                if (value !== undefined && value !== null) {
                    formData.append(key, value.toString());
                }
            });

            // Append file if existsb
            if (invoiceFile) {
                const fileObject = {
                    uri: invoiceFile.uri,
                    name: invoiceFile.name || 'invoice',
                    type: invoiceFile.type || invoiceFile.mimeType || 'application/pdf',
                };

                formData.append('invoice_file', fileObject as any);
            }

            const response = await api.post('/auth/register', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return response.data;
        } catch (error: any) {
            console.error('Registration error:', error);
            throw new Error(error.message || 'Registration failed');
        }
    },
    registerOperational: (userData: UserData) => api.post('/auth/register-operational', userData),
    login: (loginData: LoginData) => api.post('/auth/login', loginData),

    testConnection: () => api.get('/test'),
};

export const adminAPI = {

    getAllUsers: () => api.get('/admin/all-users'),
    // Fetch all registered users from the database
    getAllClientUsers: () => api.get('/admin/client-users'),
    getClientUserById: (id: number) => api.get(`/admin/client-users/${id}`),
    updateClientUserStatus: (id: number, data: UpdateUserStatusData) =>
        api.patch(`/admin/client-users/${id}/status`, data),

    // Operational Users
    getAllOperationalUsers: () => api.get('/admin/operational-users'),
    getOperationalUserById: (id: number) => api.get(`/admin/operational-users/${id}`),

    // Statistics & Dashboard
    getUserStatistics: () => api.get('/admin/statistics'),
    getDashboardData: () => api.get('/admin/dashboard'),
    getRecentRegistrations: () => api.get('/admin/recent-registrations'),

    // Search
    searchUsers: (query: string) => api.get(`/admin/search?query=${query}`),

    // Admin Login (uses operational login)
    loginAdmin: (loginData: LoginData) => api.post('/auth/login-operational', loginData),};

export default api;