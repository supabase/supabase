-- Migration: Fix RLS JWT Claims Workaround
-- Issue: https://github.com/supabase/supabase/issues/42235
-- Problem: JWT claims (request.jwt.claim.*) are not available in RLS policy evaluation context
--          Functions that work via RPC return NULL when used in RLS policies
--          This affects auth.uid() and custom functions using current_setting('request.jwt.claim.sub')

-- This migration provides a workaround using SECURITY DEFINER functions
-- that can access JWT claims through PostgREST's role claim mechanism

-- ============================================================================
-- WORKAROUND FUNCTION: Get Current User ID in RLS Context
-- ============================================================================
-- This function uses SECURITY DEFINER to access JWT claims that are available
-- in the function execution context (but not in RLS policy evaluation context)
-- 
-- Usage in RLS policies:
--   USING (user_id = public.get_current_user_id_rls())
--   WITH CHECK (user_id = public.get_current_user_id_rls())
--
-- Note: This is a workaround until PostgREST fixes JWT claim availability in RLS context
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_current_user_id_rls()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_sub text;
  v_role text;
BEGIN
  -- Try to get JWT claim 'sub' (user ID)
  -- This works in function context but not in RLS policy context
  BEGIN
    v_sub := current_setting('request.jwt.claim.sub', true);
  EXCEPTION
    WHEN OTHERS THEN
      v_sub := NULL;
  END;

  -- If sub claim is available, return it as UUID
  IF v_sub IS NOT NULL AND v_sub != '' THEN
    RETURN v_sub::uuid;
  END IF;

  -- Fallback: Try to get role claim and extract user ID from it
  -- PostgREST sets role claim which might contain user information
  BEGIN
    v_role := current_setting('request.jwt.claim.role', true);
  EXCEPTION
    WHEN OTHERS THEN
      v_role := NULL;
  END;

  -- If we have a role but not a sub, return NULL (can't extract user ID)
  -- This indicates the JWT claims are not properly set
  RETURN NULL;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_current_user_id_rls() TO authenticated, anon;

-- Add comment explaining the workaround
COMMENT ON FUNCTION public.get_current_user_id_rls() IS 
'Workaround function to get current user ID in RLS policy context. 
Uses SECURITY DEFINER to access JWT claims that are available in function 
execution context. This is a temporary workaround for issue #42235 where 
JWT claims are not available in RLS policy evaluation context.';

-- ============================================================================
-- ALTERNATIVE: Enhanced auth.uid() wrapper
-- ============================================================================
-- This function wraps auth.uid() with additional error handling and fallbacks
-- It attempts multiple methods to extract the user ID

CREATE OR REPLACE FUNCTION public.get_current_user_id_enhanced()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_sub text;
BEGIN
  -- Method 1: Try auth.uid() first (standard Supabase function)
  BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NOT NULL THEN
      RETURN v_user_id;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- auth.uid() failed, try alternative methods
      NULL;
  END;

  -- Method 2: Try to get JWT claim 'sub' directly
  BEGIN
    v_sub := current_setting('request.jwt.claim.sub', true);
    IF v_sub IS NOT NULL AND v_sub != '' THEN
      RETURN v_sub::uuid;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;

  -- Method 3: Try to get from JWT claims JSON
  BEGIN
    v_sub := (current_setting('request.jwt.claims', true)::jsonb ->> 'sub');
    IF v_sub IS NOT NULL AND v_sub != '' THEN
      RETURN v_sub::uuid;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;

  -- All methods failed, return NULL
  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_current_user_id_enhanced() TO authenticated, anon;

COMMENT ON FUNCTION public.get_current_user_id_enhanced() IS 
'Enhanced function to get current user ID with multiple fallback methods.
Tries auth.uid(), then JWT claim sub, then JWT claims JSON.
Use this if get_current_user_id_rls() does not work for your use case.';

-- ============================================================================
-- EXAMPLE: RLS Policy Pattern Using Workaround
-- ============================================================================
-- This is a comment showing how to use the workaround in RLS policies
-- 
-- Example table:
--   CREATE TABLE public.example_table (
--     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--     user_id uuid NOT NULL,
--     data text
--   );
--   ALTER TABLE public.example_table ENABLE ROW LEVEL SECURITY;
--
-- Example policies using the workaround:
--
--   -- SELECT policy
--   CREATE POLICY "Users can view own rows"
--   ON public.example_table
--   FOR SELECT
--   TO authenticated
--   USING (user_id = public.get_current_user_id_rls());
--
--   -- INSERT policy
--   CREATE POLICY "Users can insert own rows"
--   ON public.example_table
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (user_id = public.get_current_user_id_rls());
--
--   -- UPDATE policy
--   CREATE POLICY "Users can update own rows"
--   ON public.example_table
--   FOR UPDATE
--   TO authenticated
--   USING (user_id = public.get_current_user_id_rls())
--   WITH CHECK (user_id = public.get_current_user_id_rls());
--
--   -- DELETE policy
--   CREATE POLICY "Users can delete own rows"
--   ON public.example_table
--   FOR DELETE
--   TO authenticated
--   USING (user_id = public.get_current_user_id_rls());
-- ============================================================================
