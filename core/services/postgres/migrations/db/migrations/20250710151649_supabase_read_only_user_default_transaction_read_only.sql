-- migrate:up
alter role supabase_read_only_user set default_transaction_read_only = on;

-- migrate:down
