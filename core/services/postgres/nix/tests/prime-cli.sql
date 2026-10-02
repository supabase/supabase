-- Prime SQL file for CLI variant
-- Only creates extensions included in the CLI portable bundle
set client_min_messages = warning;

/*
pg_cron not created here - it requires cron.database_name config
and can only be created in that database. Tests will handle this separately.
*/

-- Core extensions for Supabase migrations
create extension if not exists pg_net;
create extension if not exists pg_graphql;
create extension if not exists pgsodium;
create extension if not exists supabase_vault;

-- Note: supautils is preloaded via shared_preload_libraries
-- and doesn't require CREATE EXTENSION
