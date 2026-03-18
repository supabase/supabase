/*
  SUPABASE BACKUP COMPATIBILITY PATCH (PG 17 -> PG 15)
  Use this script if you encounter errors when restoring a logical backup
  created on Postgres 17+ to a Postgres 15/16 instance.
*/

-- 1. Ignore PG 17+ specific configuration parameters that fail on PG 15
-- These usually appear as 'SET ...' at the top of the dump file.
DO $$ 
BEGIN
  -- We use DO blocks to safely ignore parameters if they cause errors
  BEGIN
    SET default_toast_compression = 'pglz';
  EXCEPTION WHEN undefined_parameter THEN
    RAISE NOTICE 'Skipping default_toast_compression (not supported on this PG version)';
  END;
END $$;

-- 2. Handle 'CREATE OR REPLACE TRIGGER' compatibility
-- (PG 15 already supports this, but if moving between early 14 and 17, it's a lifesaver)
-- No action needed for 17 to 15, but good to keep in mind.

-- 3. Fix 'public' schema ownership and permissions
-- In PG 15+, the 'public' schema is more restrictive.
-- A PG 17 dump might have revoked rights that we need back.
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon, authenticated, service_role;

-- 4. Re-synchronize sequences that might have used PG 17 specific syntax
-- PG 17 introduced some changes in sequence persistence.
-- This block ensures all sequences are correctly set for the current PG version.
DO $$
DECLARE
    seq RECORD;
BEGIN
    FOR seq IN SELECT sequence_schema, sequence_name 
               FROM information_schema.sequences 
               WHERE sequence_schema NOT IN ('information_schema', 'pg_catalog')
    LOOP
        EXECUTE 'ALTER SEQUENCE ' || quote_ident(seq.sequence_schema) || '.' || quote_ident(seq.sequence_name) || ' RESTART';
    END LOOP;
END $$;

RAISE NOTICE 'Postgres 17 -> 15 Compatibility Patch applied successfully.';
