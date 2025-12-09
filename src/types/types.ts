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