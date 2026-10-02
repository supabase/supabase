/*

Test to verify supautils (v3.0.0+) allows non-superuser postgres role to use postgres_fdw.

This test ensures that the supautils extension properly handles FDW usage
for the privileged postgres role without requiring temporary superuser privileges.

This verifies the fix that eliminated the need for:
https://github.com/supabase/postgres/blob/a638c6fce0baf90b654e762eddcdac1bc8df01ee/ansible/files/postgresql_extension_custom_scripts/postgres_fdw/after-create.sql (removed)

*/

begin;

-- Switch to the postgres role (non-superuser) to test supautils behavior
set role postgres;

-- postgres_fdw should be owned by the superuser
select fdwowner::regrole from pg_foreign_data_wrapper where fdwname = 'postgres_fdw';

-- Verify that `postgres` can use the FDW despite not owning it
create server s
  foreign data wrapper postgres_fdw
  options (
    host '127.0.0.1',
    port '5432',
    dbname 'postgres'
  );

rollback;
