export type Customer = {
    id: number;
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
    projects?: Project[];
};

export type PowerPlantSpec = {
    id: number;
    project_id: number;
    panel_kw?: number;
    panel_count?: number;
    panel_manufacturer?: string;
    panel_model?: string;
    pcs_kw?: number;
    pcs_count?: number;
    pcs_manufacturer?: string;
    pcs_model?: string;
};

export type RegulatoryInfo = {
    id: number;
    project_id: number;
    meti_id?: string;
    meti_certification_date?: string;
    fit_rate?: number;
    supply_start_date?: string;
    power_reception_id?: string;
    remote_monitoring_status?: string;
    is_4g_compatible?: number;
    monitoring_credentials?: string;
};

export type Contract = {
    id: number;
    project_id: number;
    contract_type?: string;
    business_owner?: string;
    contractor?: string;
    subcontractor?: string;
    annual_maintenance_fee?: number;
    land_rent?: number;
    communication_fee?: number;
    start_date?: string;
    end_date?: string;
    // Joined fields
    project_name?: string;
    invoices?: Invoice[];
};


export type Project = {
    id: number;
    customer_id: number;
    project_name: string;
    project_number: string;
    site_address?: string;
    site_postal_code?: string;
    map_coordinates?: string;
    key_number?: string;
    created_at?: string;
    // Relations included in detail view
    customer?: Customer;
    power_plant_specs?: PowerPlantSpec;
    regulatory_info?: RegulatoryInfo;
    contracts?: Contract[];
};

export type MaintenanceLog = {
    id: number;
    project_id: number;
    user_id: number;
    occurrence_date: string;
    work_type: string;
    target_area: string;
    situation?: string;
    response?: string;
    report?: string;
    status: string;
    created_at: string;
    reported_by?: string;
};

export type Invoice = {
    id: number;
    contract_id: number;
    billing_period: string;
    issue_date?: string;
    amount: number;
    status: 'unbilled' | 'billed' | 'paid';
    payment_due_date?: string;
    paid_at?: string;
    // Joined fields
    project_id?: number;
    project_name?: string;
    company_name?: string;
    contact_name?: string;
};
