-- Test pg_repack extension
-- pg_repack reorganizes tables to reclaim space and improve performance
-- NOTE: This test only verifies the SQL extension components.
-- Actual repack operations are tested in the NixOS integration test.
create schema v;

-- 1. Extension loads successfully
create extension if not exists pg_repack;

-- 2. Version function works
select repack.version();

-- 3. Check that the repack schema exists
select count(*) as repack_schema_exists
from pg_namespace
where nspname = 'repack';

-- 4. List all functions in the repack schema
select p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as arguments,
       pg_get_function_result(p.oid) as return_type
from pg_proc p
join pg_namespace n on p.pronamespace = n.oid
where n.nspname = 'repack'
order by p.proname;

-- cleanup
drop schema v cascade;
