-- Migration to create the contracting schema and core tables for Al-Azab Contracting Company.
-- Created: 2026-05-24

CREATE SCHEMA IF NOT EXISTS contracting;

-- Grant usage on schema to standard API roles
GRANT USAGE ON SCHEMA contracting TO postgres, authenticated, anon, service_role;

-- =========================================================================
-- 1. CLIENTS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS contracting.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    company_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================================================
-- 2. PROJECTS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS contracting.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT,
    client_id UUID REFERENCES contracting.clients(id) ON DELETE SET NULL,
    start_date DATE,
    end_date DATE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'on_hold', 'completed', 'cancelled')),
    budget NUMERIC(15,2) DEFAULT 0.00,
    contract_value NUMERIC(15,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================================================
-- 3. SUPPLIERS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS contracting.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    supplied_materials TEXT[],
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================================================
-- 4. WORKFORCES TABLE (Employees / Labor)
-- =========================================================================
CREATE TABLE IF NOT EXISTS contracting.workforces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('engineer', 'foreman', 'mason', 'carpenter', 'driver', 'worker', 'accountant')),
    salary_rate NUMERIC(12,2) DEFAULT 0.00,
    assigned_project_id UUID REFERENCES contracting.projects(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================================================
-- 5. MATERIALS INVENTORY TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS contracting.materials_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_name TEXT NOT NULL,
    quantity NUMERIC(12,3) NOT NULL,
    unit TEXT NOT NULL, -- 'ton', 'm3', 'bag', 'piece', etc.
    project_id UUID NOT NULL REFERENCES contracting.projects(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES contracting.suppliers(id) ON DELETE SET NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('supply', 'consumption', 'waste')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================================================
-- 6. FINANCIAL TRANSACTIONS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS contracting.financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES contracting.projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC(15,2) NOT NULL,
    description TEXT,
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================================================
-- 7. GRANTS & INDEXES FOR HIGH EFFICIENCY
-- =========================================================================

-- Grant SELECT, INSERT, UPDATE, DELETE to appropriate roles
GRANT ALL ON ALL TABLES IN SCHEMA contracting TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA contracting TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA contracting TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA contracting TO anon;

-- Indexes on foreign keys for high query performance
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON contracting.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_workforces_project_id ON contracting.workforces(assigned_project_id);
CREATE INDEX IF NOT EXISTS idx_materials_project_id ON contracting.materials_inventory(project_id);
CREATE INDEX IF NOT EXISTS idx_materials_supplier_id ON contracting.materials_inventory(supplier_id);
CREATE INDEX IF NOT EXISTS idx_finance_project_id ON contracting.financial_transactions(project_id);

-- Enable RLS on all tables
ALTER TABLE contracting.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracting.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracting.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracting.workforces ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracting.materials_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracting.financial_transactions ENABLE ROW LEVEL SECURITY;
