-- migrate:up
grant anon, authenticated, service_role to supabase_storage_admin;

-- migrate:down
