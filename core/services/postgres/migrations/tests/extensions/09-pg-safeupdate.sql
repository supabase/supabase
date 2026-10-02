BEGIN;
alter role postgres set session_preload_libraries = 'safeupdate';
ROLLBACK;
