-- verify non-superuser postgres role cannot drop supabase_privileged_role
BEGIN;

-- Switch to the postgres role (non-superuser) to test supautils behavior
SET ROLE postgres;

-- SAVEPOINT is needed to recover from the expected error and continue the transaction
SAVEPOINT before_drop;
DROP ROLE supabase_privileged_role;
ROLLBACK TO SAVEPOINT before_drop;

RESET ROLE;

SELECT rolname FROM pg_roles WHERE rolname = 'supabase_privileged_role';

ROLLBACK;
