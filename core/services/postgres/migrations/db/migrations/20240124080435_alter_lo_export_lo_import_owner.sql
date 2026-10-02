-- migrate:up
alter function pg_catalog.lo_export owner to supabase_admin;
alter function pg_catalog.lo_import(text) owner to supabase_admin;
alter function pg_catalog.lo_import(text, oid) owner to supabase_admin;

-- migrate:down
