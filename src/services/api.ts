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
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Helper function to convert file to base64
const convertFileToBase64 = (fileUri: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function() {
            const reader = new FileReader();
            reader.onloadend = function() {
                resolve(reader.result as string);
            };
            reader.onerror = reject;
            reader.readAsDataURL(xhr.response);
        };
        xhr.onerror = reject;
        xhr.open('GET', fileUri);
        xhr.responseType = 'blob';
        xhr.send();
    });
};


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
    registerClient: (userData: {
        title: string;
        first_name: string;
        last_name: string;
        email: string;
        phone_number: string;
        region: string;
        persal_id: string;
        department_id: string;
        user_type: "Magistrate" | "DOJCD_User";
        network_provider: string;
        contract_duration_months: number | undefined;
        contract_end_date: string | undefined;
        invoice_data: any;
        invoice_filename: any;
        password: string
    }) => api.post('/auth/register', userData),
    registerOperational: (userData: UserData) => api.post('/auth/register-operational', userData),
    login: (loginData: LoginData) => api.post('/auth/login', loginData),

    uploadInvoice: async (file: any): Promise<any> => {
        try {
            // Convert file to base64
            const base64Data = await convertFileToBase64(file.uri);

            const uploadData: UploadInvoiceData = {
                file_data: base64Data,
                filename: file.name || 'invoice',
                mime_type: file.mimeType || 'application/octet-stream'
            };

            return api.post('/auth/upload-invoice', uploadData);
        } catch (error) {
            console.error('Error converting file to base64:', error);
            throw new Error('Failed to process invoice file');
        }
    },

    testConnection: () => api.get('/test'),
};

export const adminAPI = {

    getAllUsers: () => api.post('/admin/users'),
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