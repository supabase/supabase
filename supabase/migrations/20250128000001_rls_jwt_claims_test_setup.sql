-- Test Setup for RLS JWT Claims Issue #42235
-- This migration creates test tables and policies to verify the workaround

-- ============================================================================
-- TEST TABLE: rls_jwt_test_table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rls_jwt_test_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  data text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rls_jwt_test_table ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rls_jwt_test_table TO authenticated;
GRANT SELECT ON public.rls_jwt_test_table TO anon;

-- ============================================================================
-- TEST POLICIES: Using Workaround Function
-- ============================================================================

-- SELECT policy using workaround
CREATE POLICY "test_select_own_rows"
ON public.rls_jwt_test_table
FOR SELECT
TO authenticated
USING (user_id = public.get_current_user_id_rls());

-- INSERT policy using workaround
CREATE POLICY "test_insert_own_rows"
ON public.rls_jwt_test_table
FOR INSERT
TO authenticated
WITH CHECK (user_id = public.get_current_user_id_rls());

-- UPDATE policy using workaround
CREATE POLICY "test_update_own_rows"
ON public.rls_jwt_test_table
FOR UPDATE
TO authenticated
USING (user_id = public.get_current_user_id_rls())
WITH CHECK (user_id = public.get_current_user_id_rls());

-- DELETE policy using workaround
CREATE POLICY "test_delete_own_rows"
ON public.rls_jwt_test_table
FOR DELETE
TO authenticated
USING (user_id = public.get_current_user_id_rls());

-- ============================================================================
-- TEST TABLE: rls_jwt_test_table_enhanced
-- ============================================================================
-- This table uses the enhanced function for comparison

CREATE TABLE IF NOT EXISTS public.rls_jwt_test_table_enhanced (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  data text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.rls_jwt_test_table_enhanced ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rls_jwt_test_table_enhanced TO authenticated;
GRANT SELECT ON public.rls_jwt_test_table_enhanced TO anon;

-- Policies using enhanced function
CREATE POLICY "test_select_enhanced"
ON public.rls_jwt_test_table_enhanced
FOR SELECT
TO authenticated
USING (user_id = public.get_current_user_id_enhanced());

CREATE POLICY "test_insert_enhanced"
ON public.rls_jwt_test_table_enhanced
FOR INSERT
TO authenticated
WITH CHECK (user_id = public.get_current_user_id_enhanced());

-- ============================================================================
-- CLEANUP FUNCTION (for testing)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cleanup_rls_jwt_test_tables()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Drop test tables if they exist
  DROP TABLE IF EXISTS public.rls_jwt_test_table_enhanced CASCADE;
  DROP TABLE IF EXISTS public.rls_jwt_test_table CASCADE;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_rls_jwt_test_tables() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_rls_jwt_test_tables() TO service_role;

COMMENT ON FUNCTION public.cleanup_rls_jwt_test_tables() IS 
'Cleanup function for test tables. Use this to remove test tables after testing.
Only accessible to service_role for security reasons.';
