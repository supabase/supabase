-- Migration: PostgREST Schema Cache Diagnostics and Recovery Tools
-- This migration adds functions to help diagnose and recover from PGRST002 errors

-- Function to check PostgREST schema cache status
CREATE OR REPLACE FUNCTION public.check_postgrest_schema_cache()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  schema_count int;
  table_count int;
  authenticator_exists boolean;
  authenticator_has_usage boolean;
  locked_advisory boolean;
  result jsonb;
BEGIN
  -- Check if authenticator role exists
  SELECT EXISTS(SELECT 1 FROM pg_roles WHERE rolname = 'authenticator')
  INTO authenticator_exists;
  
  -- Check if authenticator has USAGE on public schema
  SELECT EXISTS(
    SELECT 1 FROM information_schema.schema_privileges 
    WHERE grantee = 'authenticator' 
    AND table_schema = 'public' 
    AND privilege_type = 'USAGE'
  ) INTO authenticator_has_usage;
  
  -- Count schemas that should be in cache
  SELECT COUNT(DISTINCT schema_name)
  FROM information_schema.schemata
  WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
  INTO schema_count;
  
  -- Count tables in public schema
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = 'public'
  INTO table_count;
  
  -- Check for advisory locks that might block PostgREST
  SELECT EXISTS(
    SELECT 1 FROM pg_locks 
    WHERE locktype = 'advisory' 
    AND granted = true
  ) INTO locked_advisory;
  
  result := jsonb_build_object(
    'authenticator_exists', authenticator_exists,
    'authenticator_has_schema_usage', authenticator_has_usage,
    'exposed_schema_count', schema_count,
    'public_table_count', table_count,
    'has_advisory_locks', locked_advisory,
    'recommendations', CASE 
      WHEN NOT authenticator_exists THEN ARRAY['Create authenticator role']
      WHEN NOT authenticator_has_usage THEN ARRAY['Grant USAGE on schemas to authenticator']
      WHEN locked_advisory THEN ARRAY['Check for stuck advisory locks']
      ELSE ARRAY['Schema cache should load normally']
    END
  );
  
  RETURN result;
END;
$$;

-- Function to grant proper permissions to authenticator role
CREATE OR REPLACE FUNCTION public.grant_postgrest_permissions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ensure authenticator role exists
  IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
    CREATE ROLE authenticator WITH LOGIN;
  END IF;
  
  -- Grant USAGE on all non-system schemas
  EXECUTE (
    SELECT string_agg('GRANT USAGE ON SCHEMA ' || quote_ident(schema_name) || ' TO authenticator;', ' ')
    FROM information_schema.schemata
    WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'pg_toast_temp_1')
  );
  
  -- Grant SELECT on all tables in public schema
  GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticator;
  
  -- Grant USAGE on information_schema (needed for schema cache queries)
  GRANT USAGE ON SCHEMA information_schema TO authenticator;
  
  -- Grant access to system catalogs (read-only)
  GRANT SELECT ON ALL TABLES IN SCHEMA pg_catalog TO authenticator;
END;
$$;

-- Function to force clear schema cache (by notifying PostgREST)
CREATE OR REPLACE FUNCTION public.force_postgrest_schema_reload()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Send NOTIFY to PostgREST to reload schema cache
  NOTIFY pgrst, 'reload schema';
END;
$$;

-- Function to check for stuck replication slots
CREATE OR REPLACE FUNCTION public.check_stuck_replication_slots()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stuck_slots jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'slot_name', slot_name,
      'plugin', plugin,
      'slot_type', slot_type,
      'datoid', datoid,
      'database', (SELECT datname FROM pg_database WHERE oid = datoid),
      'active', active,
      'restart_lsn', restart_lsn,
      'confirmed_flush_lsn', confirmed_flush_lsn
    )
  )
  INTO stuck_slots
  FROM pg_replication_slots
  WHERE active = false
  OR restart_lsn IS NOT NULL;
  
  RETURN COALESCE(stuck_slots, '[]'::jsonb);
END;
$$;

-- Function to get PostgREST health status
CREATE OR REPLACE FUNCTION public.get_postgrest_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  schema_cache_status jsonb;
  replication_status jsonb;
  permissions_granted boolean;
  health_status text;
  issues text[];
BEGIN
  issues := ARRAY[]::text[];
  
  -- Check schema cache status
  schema_cache_status := public.check_postgrest_schema_cache();
  
  -- Check replication slots
  replication_status := public.check_stuck_replication_slots();
  
  -- Check if authenticator has proper permissions
  SELECT EXISTS(
    SELECT 1 FROM information_schema.role_table_grants 
    WHERE grantee = 'authenticator' 
    AND table_schema = 'public' 
    AND privilege_type = 'SELECT'
  ) INTO permissions_granted;
  
  -- Determine health status
  IF NOT (schema_cache_status->>'authenticator_exists')::boolean THEN
    issues := array_append(issues, 'Authenticator role does not exist');
  END IF;
  
  IF NOT (schema_cache_status->>'authenticator_has_schema_usage')::boolean THEN
    issues := array_append(issues, 'Authenticator missing schema USAGE permissions');
  END IF;
  
  IF NOT permissions_granted THEN
    issues := array_append(issues, 'Authenticator missing table SELECT permissions');
  END IF;
  
  IF jsonb_array_length(replication_status) > 0 THEN
    issues := array_append(issues, 'Stuck replication slots detected');
  END IF;
  
  health_status := CASE 
    WHEN array_length(issues, 1) = 0 THEN 'healthy'
    WHEN array_length(issues, 1) <= 2 THEN 'warning'
    ELSE 'critical'
  END;
  
  RETURN jsonb_build_object(
    'status', health_status,
    'issues', issues,
    'schema_cache', schema_cache_status,
    'replication_slots', replication_status,
    'recommendations', CASE 
      WHEN health_status = 'healthy' THEN ARRAY['PostgREST should function normally']
      WHEN health_status = 'warning' THEN ARRAY['Some permissions may need attention']
      ELSE ARRAY[
        'Run grant_postgrest_permissions() to fix permissions',
        'Check and clean stuck replication slots',
        'Restart PostgREST service after fixes'
      ]
    END
  );
END;
$$;

-- Grant execute permissions to authenticated users (Dashboard users)
GRANT EXECUTE ON FUNCTION public.check_postgrest_schema_cache TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_postgrest_permissions TO authenticated;
GRANT EXECUTE ON FUNCTION public.force_postgrest_schema_reload TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_stuck_replication_slots TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_postgrest_health TO authenticated;

-- Comment describing the migration
COMMENT ON FUNCTION public.check_postgrest_schema_cache IS 'Diagnose PostgREST schema cache issues (PGRST002)';
COMMENT ON FUNCTION public.grant_postgrest_permissions IS 'Grant required permissions to authenticator role for PostgREST';
COMMENT ON FUNCTION public.force_postgrest_schema_reload IS 'Force PostgREST to reload its schema cache';
COMMENT ON FUNCTION public.check_stuck_replication_slots IS 'Check for stuck replication slots that may affect PostgREST';
COMMENT ON FUNCTION public.get_postgrest_health IS 'Get comprehensive PostgREST health status';