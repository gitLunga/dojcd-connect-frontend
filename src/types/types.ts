// Simple types for your API
export interface UserData {
    title?: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    region?: string;
    persal_id?: string;
    department_id?: string;
    user_type?: 'Advocate' | 'Magistrate';
    user_role?: 'Admin' | 'MTN_Staff' | 'Warehouse' | 'Approver';
    password: string;

    // New fields for registration
    // network_provider?: string;
    // contract_duration_months?: number;
    // contract_end_date?: string;
    // // invoice_data?: string | null;  // Allow null
    // // invoice_filename?: string | null; // Allow null
    // invoice_data?: string | null;  // Allow null
    // invoice_filename?: string | null; // Allow null

    // created_at: string;
    // updated_at?: string;
}

export interface ClientUser {
    client_user_id: number;
    title?: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    region?: string;
    persal_id?: string;
    department_id?: string;
    user_type: 'Advocate' | 'Magistrate';
    network_provider?: string;
    contract_duration_months?: number;
    contract_end_date?: string;
    registration_status: 'Pending' | 'Profile_Completed' | 'Verified' | 'Rejected';
    verification_notes?: string;
    created_at: string;
}

export interface OperationalUser {
    op_user_id?: number;
    title?: string;
    first_name: string;
    last_name: string;
    email: string;
    user_role: 'Admin' | 'MTN_Staff' | 'Warehouse' | 'Approver';
    password: string;
    created_at: string;
}

export interface CompleteProfileData {
    network_provider: string;
    contract_duration_months: number;
    contract_end_date: string; // ISO string format
    invoice_file?: FileData;
    id_document?: FileData;
    payslip_document?: FileData;
    residence_document?: FileData;// For React Native file object
}

export interface FileData {
    uri: string;
    name: string;
    type: string;
    size?: number;
}

export interface UploadInvoiceData {
    file_data: string;  // Base64 string
    filename: string;
    mime_type?: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export type SystemUser = {
    id: number;
    user_type: "client" | "operational";
    user_role?: string | null;

    title?: string | null;
    first_name: string;
    last_name: string;
    email: string;

    phone_number?: string | null;
    region?: string | null;
    persal_id?: string | null;
    department_id?: string | null;

    registration_status?: "Pending" | "Profile_Completed" | "Verified" | "Rejected" | null;
    created_at: string;
};
export interface UserStats {
    client_users: {
        stats: Array<{ registration_status: string; count: string }>;
        total: number;
        this_month?: number;
    };
    operational_users: {
        stats: Array<{ user_role: string; count: string }>;
        total: number;
    };
    total_users: number;
}

export interface UpdateUserStatusData {
    status: 'Pending' | 'Verified' | 'Rejected';
    notes: string;
}

export interface FileObject {
    uri: string;
    name: string;
    type?: string;
    size?: number;
}

export interface CombinedUser {
    id: number;
    user_category: 'client' | 'operational';
    role: string;
    title?: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    region?: string;
    created_at: string;
}

export interface RecentRegistration {
    user_type: 'client' | 'operational';
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    registration_status: string;
    created_at: string;
}

export interface SearchResult {
    user_type: 'client' | 'operational';
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    persal_id?: string;
    registration_status: string;
    client_user_type?: string;
}

export interface DashboardData {
    statistics: UserStats;
    recent_registrations: RecentRegistration[];
    activity_summary: ActivitySummary;
}

export interface ActivitySummary {
    top_applicants: Array<{
        client_user_id: number;
        first_name: string;
        last_name: string;
        application_count: number;
    }>;
    top_ordered_users: Array<{
        client_user_id: number;
        first_name: string;
        last_name: string;
        order_count: number;
    }>;
    active_contracts: number;
}