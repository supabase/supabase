-- migrate:up

-- The original fix in 20220224211803 checked pg_available_extensions for
-- supautils, but supautils is a preload library without a .control file,
-- so it never appears in pg_available_extensions. That migration was a no-op.
ALTER ROLE authenticator SET session_preload_libraries = supautils, safeupdate;

-- migrate:down
