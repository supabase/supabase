-- Migration to define triggers and automatic logging/notifications for Al-Azab Contracting.
-- Created: 2026-05-24

-- =========================================================================
-- 1. NOTIFICATIONS LOG TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS contracting.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    project_id UUID REFERENCES contracting.projects(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS and grants
ALTER TABLE contracting.notifications ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON contracting.notifications TO authenticated;
GRANT ALL ON contracting.notifications TO service_role;

CREATE POLICY "Allow authenticated users to view notifications"
ON contracting.notifications FOR SELECT TO authenticated USING (true);

-- =========================================================================
-- 2. TRIGGER FUNCTION FOR MAJOR FINANCIAL TRANSACTIONS
-- =========================================================================
CREATE OR REPLACE FUNCTION contracting.on_financial_transaction_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if it's a major financial transaction (Amount > 50,000 SAR)
    IF NEW.amount >= 50000.00 THEN
        INSERT INTO contracting.notifications (title, message, project_id)
        VALUES (
            'تنبيه مالي هام / Major Financial Alert',
            format('تم تسجيل عملية مالية جديدة بقيمة %s ر.س من النوع (%s) لمشروع العزب رقم: %s', 
                   NEW.amount, 
                   CASE WHEN NEW.type = 'income' THEN 'إيراد / Income' ELSE 'مصروف / Expense' END,
                   NEW.project_id),
            NEW.project_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger for Financial Table
CREATE OR REPLACE TRIGGER trg_financial_major_alerts
AFTER INSERT ON contracting.financial_transactions
FOR EACH ROW EXECUTE FUNCTION contracting.on_financial_transaction_insert();

-- =========================================================================
-- 3. TRIGGER FUNCTION FOR MATERIAL WASTE ALERTS
-- =========================================================================
CREATE OR REPLACE FUNCTION contracting.on_material_waste_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Alert if material waste is logged on site
    IF NEW.transaction_type = 'waste' THEN
        INSERT INTO contracting.notifications (title, message, project_id)
        VALUES (
            'تنبيه هدر مواد / Material Waste Alert',
            format('تم تسجيل هدر في مادة (%s) بكمية %s (%s) في موقع المشروع رقم: %s', 
                   NEW.material_name, 
                   NEW.quantity, 
                   NEW.unit,
                   NEW.project_id),
            NEW.project_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger for Materials Table
CREATE OR REPLACE TRIGGER trg_materials_waste_alerts
AFTER INSERT ON contracting.materials_inventory
FOR EACH ROW EXECUTE FUNCTION contracting.on_material_waste_insert();
