-- migrate:up
grant authenticator to supabase_storage_admin;
revoke anon, authenticated, service_role from supabase_storage_admin;

-- migrate:down
