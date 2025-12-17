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
    user_type?: 'Teacher' | 'DOJCD_User';
    user_role?: 'Admin' | 'MTN_Staff' | 'Warehouse' | 'Support';
    password: string;

    // New fields for registration
    network_provider?: string;
    contract_duration_months?: number;
    contract_end_date?: string;
    invoice_data?: string | null;  // Allow null
    invoice_filename?: string | null; // Allow null
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
    client_user_id?: number;
    operational_user_id?: number;

    title?: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    region?: string;

    persal_id?: string;
    department_id?: string;

    user_type: "client" | "operational";
    user_role?: "Admin" | "Support" | "Warehouse";

    registration_status?: "Pending" | "Approved" | "Rejected";
};