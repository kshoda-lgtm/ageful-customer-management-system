-- Ageful Customer Management System - Database Schema
-- SQLite Version

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- 1. Users Table (System Users)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'user', -- 'admin', 'user', 'manager'
    is_active INTEGER DEFAULT 1, -- Boolean in SQLite is 0/1
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT DEFAULT 'individual', -- 'individual' or 'corporate'
    company_name TEXT,
    contact_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    postal_code TEXT,
    address TEXT,
    
    -- Billing Address
    billing_postal_code TEXT,
    billing_address TEXT,
    billing_contact_name TEXT,
    
    notes TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 3. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    project_number TEXT,
    project_name TEXT NOT NULL,
    
    -- Installation Site
    site_postal_code TEXT,
    site_address TEXT,
    
    -- Additional Info
    map_coordinates TEXT,
    key_number TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- 4. Power Plant Specs Table
CREATE TABLE IF NOT EXISTS power_plant_specs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    
    -- Panel Specs
    panel_kw REAL,
    panel_count INTEGER,
    panel_manufacturer TEXT,
    panel_model TEXT,
    
    -- PCS Specs
    pcs_kw REAL,
    pcs_count INTEGER,
    pcs_manufacturer TEXT,
    pcs_model TEXT,
    
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 5. Regulatory Info Table
CREATE TABLE IF NOT EXISTS regulatory_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    
    meti_id TEXT,
    meti_certification_date TEXT, -- Date as Text (ISO 8601)
    fit_rate REAL,
    supply_start_date TEXT,
    power_reception_id TEXT,
    
    -- Monitoring
    remote_monitoring_status TEXT,
    is_4g_compatible INTEGER DEFAULT 0,
    monitoring_credentials TEXT,
    
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 6. Maintenance Logs Table
CREATE TABLE IF NOT EXISTS maintenance_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    user_id INTEGER,
    
    inquiry_date TEXT,
    occurrence_date TEXT,
    
    work_type TEXT,
    target_area TEXT,
    situation TEXT,
    response TEXT,
    report TEXT,
    
    status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
    
    photo_url TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 7. Contracts Table
CREATE TABLE IF NOT EXISTS contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    
    contract_type TEXT DEFAULT 'maintenance',
    
    business_owner TEXT,
    contractor TEXT,
    subcontractor TEXT,
    
    start_date TEXT,
    end_date TEXT,
    
    annual_maintenance_fee REAL,
    land_rent REAL,
    communication_fee REAL,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 8. Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_id INTEGER,
    
    billing_period TEXT,
    issue_date TEXT,
    amount REAL,
    
    status TEXT DEFAULT 'unbilled', -- 'unbilled', 'billed', 'paid'
    payment_due_date TEXT,
    paid_at TEXT,
    
    pdf_url TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(contact_name);
CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_name);
CREATE INDEX IF NOT EXISTS idx_projects_customer ON projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_project ON maintenance_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_logs(status);
CREATE INDEX IF NOT EXISTS idx_contracts_project ON contracts(project_id);
