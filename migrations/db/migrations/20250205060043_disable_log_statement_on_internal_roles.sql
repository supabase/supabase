-- migrate:up
alter role supabase_admin set log_statement = none;
alter role supabase_auth_admin set log_statement = none;
alter role supabase_storage_admin set log_statement = none;

-- migrate:down
