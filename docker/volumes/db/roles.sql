-- NOTE: change to your own passwords for production environments
\set pgpass `echo "$POSTGRES_PASSWORD"`

ALTER USER authenticator WITH PASSWORD :'pgpass';
ALTER USER pgbouncer WITH PASSWORD :'pgpass';
ALTER USER supabase_auth_admin WITH PASSWORD :'pgpass';
ALTER USER supabase_functions_admin WITH PASSWORD :'pgpass';
ALTER USER supabase_storage_admin WITH PASSWORD :'pgpass';

-- Realtime and Supavisor connect as supabase_admin and poll frequently; silence their
-- logs at the role level instead of instance-wide so RAISE LOG/NOTICE from other
-- connections (e.g. your own functions) still show up in `docker compose logs db`.
ALTER ROLE supabase_admin SET log_min_messages TO fatal;
