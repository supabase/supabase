BEGIN;
alter role postgres set session_preload_libraries = 'plan_filter';
ROLLBACK;
