ALTER TABLE tenants ADD COLUMN IF NOT EXISTS cursor_id SERIAL;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT current_timestamp;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS migrations_version text null DEFAULT null;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS migrations_status text null DEFAULT null;

create index if not exists tenants_migration_version_idx on tenants(cursor_id, migrations_version, migrations_status);