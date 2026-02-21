#!/bin/bash
# Spock Replication User Setup
# Creates the spock_replicator user needed for bi-directional replication
# Password is read from REPLICATION_PASSWORD environment variable
#
# WARNING: You MUST change REPLICATION_PASSWORD in .env before exposing
# the database to any network. The default password is insecure.

set -e

REPLICATION_PASSWORD="${REPLICATION_PASSWORD:?REPLICATION_PASSWORD environment variable is required}"

# Pass password via psql variable to avoid shell interpolation / SQL injection
psql -v ON_ERROR_STOP=1 -v REPL_PW="$REPLICATION_PASSWORD" -U supabase_admin -d postgres <<'EOSQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'spock_replicator') THEN
    EXECUTE format('CREATE USER spock_replicator WITH REPLICATION LOGIN PASSWORD %L', :'REPL_PW');
    RAISE NOTICE 'Created replication user: spock_replicator';
  END IF;
END
$$;

-- Grant permissions to spock_replicator for Spock extension access
GRANT USAGE ON SCHEMA spock TO spock_replicator;
GRANT ALL ON ALL TABLES IN SCHEMA spock TO spock_replicator;
GRANT USAGE ON SCHEMA public TO spock_replicator;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO spock_replicator;

-- Grant permissions for future tables in public schema
-- Note: ALTER DEFAULT PRIVILEGES only affects tables created by the current role (supabase_admin).
-- Tables created by other roles will need explicit GRANT SELECT to spock_replicator.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO spock_replicator;
EOSQL
