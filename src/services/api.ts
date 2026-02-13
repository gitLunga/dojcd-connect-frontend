import axios from 'axios';
import { Platform } from 'react-native';
import {UserData, LoginData, UploadInvoiceData, UpdateUserStatusData, CompleteProfileData, OperationalUser} from '../types/types';
import { API_URL } from '@env';  // This will now work with TypeScript

const DEV_BACKEND_URL = ' https://latrice-untremolant-robert.ngrok-free.dev/api';

// Configure base URL based on where the app is running
const getBaseURL = () => {
    if (Platform.OS === 'web') {
        return 'http://localhost:5000/api';
    } else {
        // return 'http://192.168.137.1:5000/api';
      //  return 'http://10.2.32.80:5000/api';
        // return DEV_BACKEND_URL;
         return API_URL;
    }
};

const BASE_URL = getBaseURL();

console.log('📱 Using API URL:', BASE_URL); // Helpful for debugging

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
   registerClient: async (userData: UserData): Promise<any> => {
        try {
            // Remove profile completion fields from the first step
            const { network_provider, contract_duration_months, contract_end_date, invoice_file, ...basicUserData } = userData as any;
            
            const response = await api.post('/auth/register', basicUserData);
            return response.data;
        } catch (error: any) {
            console.error('Registration error:', error);
            throw new Error(error.message || 'Registration failed');
        }
    },

    // Step 2: Complete profile with invoice upload
   // In your api.ts - the completeProfile method should look like this:
// completeProfile: async (clientUserId: number, profileData: CompleteProfileData): Promise<any> => {
//   try {
//     const formData = new FormData();
//
//     // Add profile fields
//     formData.append('network_provider', profileData.network_provider);
//     formData.append('contract_duration_months', profileData.contract_duration_months.toString());
//     formData.append('contract_end_date', profileData.contract_end_date);
//
//     // Add invoice file if exists - IMPORTANT: This needs to be a proper file object
//     if (profileData.invoice_file) {
//       // For React Native, we need to create a proper file object
//       const fileObject = {
//         uri: profileData.invoice_file.uri,
//         name: profileData.invoice_file.name,
//         type: profileData.invoice_file.type,
//       };
//
//       // The key should match what your backend expects
//       // If your backend expects 'invoice_file' use that, if 'invoice' use that
//       formData.append('invoice_file', fileObject as any);
//     }
//
//     console.log('📤 Sending FormData with keys:', {
//       network: profileData.network_provider,
//       duration: profileData.contract_duration_months,
//       date: profileData.contract_end_date,
//       hasFile: !!profileData.invoice_file
//     });
//
//     const response = await api.post(`/auth/complete-profile/${clientUserId}`, formData, {
//       headers: {
//         'Content-Type': 'multipart/form-data',
//       },
//     });
//
//     console.log('📥 Response received:', response.data);
//     return response.data;
//   } catch (error: any) {
//     console.error('Complete profile API error:', error);
//     console.error('Error response:', error.response?.data);
//     throw new Error(error.message || 'Profile completion failed');
//   }
// },

    completeProfile: async (clientUserId: number, profileData: CompleteProfileData): Promise<any> => {
        try {
            console.log('📤 Starting profile completion for user:', clientUserId);

            // Create FormData
            const formData = new FormData();

            // Add text fields
            formData.append('network_provider', profileData.network_provider);
            formData.append('contract_duration_months', profileData.contract_duration_months.toString());
            formData.append('contract_end_date', profileData.contract_end_date);

            // Add files - SIMPLIFIED VERSION
            if (profileData.invoice_file?.uri) {
                formData.append('invoice_file', {
                    uri: profileData.invoice_file.uri,
                    name: profileData.invoice_file.name || 'invoice.pdf',
                    type: profileData.invoice_file.type || 'application/pdf'
                } as any);
            }

            if (profileData.id_document?.uri) {
                formData.append('id_document', {
                    uri: profileData.id_document.uri,
                    name: profileData.id_document.name || 'id_document.pdf',
                    type: profileData.id_document.type || 'application/pdf'
                } as any);
            }

            if (profileData.payslip_document?.uri) {
                formData.append('payslip_document', {
                    uri: profileData.payslip_document.uri,
                    name: profileData.payslip_document.name || 'payslip.pdf',
                    type: profileData.payslip_document.type || 'application/pdf'
                } as any);
            }

            if (profileData.residence_document?.uri) {
                formData.append('residence_document', {
                    uri: profileData.residence_document.uri,
                    name: profileData.residence_document.name || 'residence.pdf',
                    type: profileData.residence_document.type || 'application/pdf'
                } as any);
            }

            console.log('📤 FormData prepared, sending request...');

            // SIMPLIFIED: Create a new axios instance without default JSON headers
            const formDataAxios = axios.create({
                baseURL: BASE_URL,
                timeout: 60000, // Longer timeout for file uploads
            });

            const response = await formDataAxios.post(
                `/auth/complete-profile/${clientUserId}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            console.log('✅ Response received:', response.data);
            return response.data;

        } catch (error: any) {
            console.error('❌ Complete profile API error:', error);

            // Log more details
            if (error.response) {
                console.error('Error status:', error.response.status);
                console.error('Error data:', error.response.data);
                console.error('Error headers:', error.response.headers);
            } else if (error.request) {
                console.error('No response received:', error.request);
            }

            throw new Error(error.message || 'Profile completion failed');
        }
    },    registerOperational: (userData: UserData) => api.post('/auth/register-operational', userData),
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

    const deviceApi = api;

    export const deviceAPI = {

        // Get available devices
        getAvailableDevices: () =>
            api.get('/applications/devices'),

        // Get device details
        getDeviceDetails: (deviceId: number) =>
            api.get(`/applications/devices/${deviceId}`),

        // Submit application
        submitApplication: (clientUserId: number, deviceId: number) =>
            api.post('/applications/applications', {
                client_user_id: clientUserId,
                device_id: deviceId
            }),

        // Get user applications
        getUserApplications: (clientUserId: number) =>
            api.get(`/applications/users/${clientUserId}/applications`),

        // Get application details - FIXED PATH
        getApplicationDetails: (clientUserId: number, applicationId: number) =>
            api.get(`/applications/users/${clientUserId}/applications/${applicationId}`),

        // Cancel application
        cancelApplication: (clientUserId: number, applicationId: number) =>
            api.put(`/applications/users/${clientUserId}/applications/${applicationId}/cancel`),

        // Get application summary
        getApplicationSummary: (clientUserId: number) =>
            api.get(`/applications/users/${clientUserId}/applications/summary`),

        // Check eligibility
        checkEligibility: (clientUserId: number) =>
            api.get(`/applications/users/${clientUserId}/eligibility`),
    
}
export const notificationAPI = {
    // Get user notifications
    getUserNotifications: (userId: number, userType: string) =>
        api.get(`/notifications/user?user_id=${userId}&user_type=${userType}`),

    // Get unread count
    getUnreadCount: (userId: number, userType: string) =>
        api.get(`/notifications/unread-count?user_id=${userId}&user_type=${userType}`),

    // Mark notification as read
    markAsRead: (notificationId: number, userId: number, userType: string) =>
        api.patch(`/notifications/${notificationId}/read`, {
            user_id: userId,
            user_type: userType
        }),

    // Mark all as read
    markAllAsRead: (userId: number, userType: string) =>
        api.patch('/notifications/mark-all-read', {
            user_id: userId,
            user_type: userType
        }),

    // Delete notification
    deleteNotification: (notificationId: number, userId: number, userType: string) =>
        api.delete(`/notifications/${notificationId}`, {
            data: {
                user_id: userId,
                user_type: userType
            }
        })
};

export default api;