-- Ageful Customer Management System - Supabase Schema
-- PostgreSQL Version

-- 1. Users Table (System Users)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    type TEXT DEFAULT 'individual',
    company_name TEXT,
    contact_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    postal_code TEXT,
    address TEXT,
    billing_postal_code TEXT,
    billing_address TEXT,
    billing_contact_name TEXT,
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    project_number TEXT,
    project_name TEXT NOT NULL,
    site_postal_code TEXT,
    site_address TEXT,
    map_coordinates TEXT,
    key_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Power Plant Specs Table
CREATE TABLE IF NOT EXISTS power_plant_specs (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    panel_kw REAL,
    panel_count INTEGER,
    panel_manufacturer TEXT,
    panel_model TEXT,
    pcs_kw REAL,
    pcs_count INTEGER,
    pcs_manufacturer TEXT,
    pcs_model TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Regulatory Info Table
CREATE TABLE IF NOT EXISTS regulatory_info (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    meti_id TEXT,
    meti_certification_date TEXT,
    fit_rate REAL,
    supply_start_date TEXT,
    power_reception_id TEXT,
    remote_monitoring_status TEXT,
    is_4g_compatible BOOLEAN DEFAULT FALSE,
    monitoring_credentials TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Maintenance Logs Table
CREATE TABLE IF NOT EXISTS maintenance_logs (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    inquiry_date TEXT,
    occurrence_date TEXT,
    work_type TEXT,
    target_area TEXT,
    situation TEXT,
    response TEXT,
    report TEXT,
    status TEXT DEFAULT 'pending',
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Contracts Table
CREATE TABLE IF NOT EXISTS contracts (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    contract_type TEXT DEFAULT 'maintenance',
    business_owner TEXT,
    contractor TEXT,
    subcontractor TEXT,
    start_date TEXT,
    end_date TEXT,
    annual_maintenance_fee REAL,
    land_rent REAL,
    communication_fee REAL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER REFERENCES contracts(id) ON DELETE CASCADE,
    billing_period TEXT,
    issue_date TEXT,
    amount REAL,
    status TEXT DEFAULT 'unbilled',
    payment_due_date TEXT,
    paid_at TEXT,
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(contact_name);
CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_name);
CREATE INDEX IF NOT EXISTS idx_projects_customer ON projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_project ON maintenance_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_logs(status);
CREATE INDEX IF NOT EXISTS idx_contracts_project ON contracts(project_id);

-- Disable RLS for all tables (backend handles auth via JWT)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE power_plant_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations via service role (anon key with policies)
CREATE POLICY "Allow all for anon" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON power_plant_specs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON regulatory_info FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON maintenance_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON contracts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON invoices FOR ALL USING (true) WITH CHECK (true);
