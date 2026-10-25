CREATE EXTENSION "pg_stat_monitor" SCHEMA "extensions";

COMMENT ON EXTENSION "pg_stat_monitor" IS 'The pg_stat_monitor is a PostgreSQL Query Performance Monitoring tool, based on PostgreSQL contrib module pg_stat_statements. pg_stat_monitor provides aggregated statistics, client information, plan details including plan, and histogram information.';
