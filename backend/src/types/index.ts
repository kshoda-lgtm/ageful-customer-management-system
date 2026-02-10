export interface User {
    id: number;
    email: string;
    name: string;
    role: 'admin' | 'user' | 'manager';
}

export interface Customer {
    id: number;
    type: string;
    company_name?: string;
    contact_name: string;
    email?: string;
    phone?: string;
    postal_code?: string;
    address?: string;
    billing_postal_code?: string;
    billing_address?: string;
    billing_contact_name?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface Project {
    id: number;
    customer_id: number;
    project_number?: string;
    project_name: string;
    site_postal_code?: string;
    site_address?: string;
    map_coordinates?: string;
    key_number?: string;
    customers?: Customer; // Joined
}

export interface MaintenanceLog {
    id: number;
    project_id: number;
    user_id?: number;
    inquiry_date?: string;
    occurrence_date?: string;
    work_type?: string;
    target_area?: string;
    situation?: string;
    response?: string;
    report?: string;
    status: 'pending' | 'in_progress' | 'completed';
    photo_url?: string;
    created_at: string;
}

export interface Invoice {
    id: number;
    contract_id: number;
    billing_period?: string;
    issue_date?: string;
    amount: number;
    status: 'unbilled' | 'billed' | 'paid';
    payment_due_date?: string;
    paid_at?: string;
    project_name?: string; // Joined for dashboard
    customer_name?: string; // Joined for dashboard
}
