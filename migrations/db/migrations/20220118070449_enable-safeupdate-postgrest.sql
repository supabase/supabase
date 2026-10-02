-- migrate:up
ALTER ROLE authenticator SET session_preload_libraries = 'safeupdate';

-- migrate:down
