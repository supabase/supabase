-- migrate:up
ALTER ROLE authenticator SET session_preload_libraries = supautils, safeupdate;

-- migrate:down
