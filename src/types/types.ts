// Simple types for your API
export interface UserData {
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    persal_id?: string;
    department_id?: string;
    user_type?: 'Teacher' | 'DOJCD_User';
    user_role?: 'Admin' | 'MTN_Staff' | 'Warehouse' | 'Support';
    password: string;
}

export interface LoginData {
    email: string;
    password: string;
}