BEGIN;
create extension if not exists pg_stat_monitor with schema "extensions";
ROLLBACK;
