-- Migration to define RLS (Row Level Security) policies for Al-Azab Contracting Company.
-- Created: 2026-05-24

-- =========================================================================
-- 1. CLIENTS POLICIES
-- =========================================================================
CREATE POLICY "Allow authenticated users to select clients"
ON contracting.clients FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert clients"
ON contracting.clients FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update clients"
ON contracting.clients FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access to clients"
ON contracting.clients FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =========================================================================
-- 2. PROJECTS POLICIES
-- =========================================================================
CREATE POLICY "Allow authenticated users to select projects"
ON contracting.projects FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert projects"
ON contracting.projects FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update projects"
ON contracting.projects FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access to projects"
ON contracting.projects FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =========================================================================
-- 3. SUPPLIERS POLICIES
-- =========================================================================
CREATE POLICY "Allow authenticated users to select suppliers"
ON contracting.suppliers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert suppliers"
ON contracting.suppliers FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update suppliers"
ON contracting.suppliers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access to suppliers"
ON contracting.suppliers FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =========================================================================
-- 4. WORKFORCES POLICIES
-- =========================================================================
CREATE POLICY "Allow authenticated users to select workforces"
ON contracting.workforces FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert workforces"
ON contracting.workforces FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update workforces"
ON contracting.workforces FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access to workforces"
ON contracting.workforces FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =========================================================================
-- 5. MATERIALS INVENTORY POLICIES
-- =========================================================================
CREATE POLICY "Allow authenticated users to select materials"
ON contracting.materials_inventory FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert materials"
ON contracting.materials_inventory FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update materials"
ON contracting.materials_inventory FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access to materials"
ON contracting.materials_inventory FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =========================================================================
-- 6. FINANCIAL TRANSACTIONS POLICIES
-- =========================================================================
CREATE POLICY "Allow authenticated users to select finance"
ON contracting.financial_transactions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert finance"
ON contracting.financial_transactions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update finance"
ON contracting.financial_transactions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access to finance"
ON contracting.financial_transactions FOR ALL TO service_role USING (true) WITH CHECK (true);
