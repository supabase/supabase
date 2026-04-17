#!/bin/sh
#
# Test Postgres 15 -> 17 upgrade for self-hosted Supabase.
#
# Seeds test data on a running Postgres 15 stack, runs the upgrade script,
# and verifies data integrity + service connectivity using pgTAP.
#
# Usage:
#   cd docker/
#   sudo bash tests/test-pg17-upgrade.sh
#
# Prerequisites:
#   - Running self-hosted Supabase with a clean, tests-only Postgres 15:
#       docker compose up -d
#   - .env file with POSTGRES_PASSWORD, ANON_KEY
#

set -eu

DB_CONTAINER="supabase-db"

if [ ! -f .env ]; then
    echo "Error: .env file not found. Run from the docker/ directory."
    exit 1
fi

pg_password=$(grep '^POSTGRES_PASSWORD=' .env | cut -d '=' -f 2-)
anon_key=$(grep '^ANON_KEY=' .env | cut -d '=' -f 2- || true)

if [ -z "$pg_password" ]; then
    echo "Error: POSTGRES_PASSWORD not set in .env"
    exit 1
fi

run_sql() {
    docker exec -i \
        -e PGPASSWORD="$pg_password" \
        "$DB_CONTAINER" \
        psql -h localhost -U supabase_admin -d postgres -v ON_ERROR_STOP=1 "$@"
}

echo ""
echo "=== Postgres 15 -> 17 Upgrade Test ==="
echo ""

# --- Verify we're starting from Postgres 15 --------------------------------

current_version=$(run_sql -A -t -c "SHOW server_version;" | head -1)
case "$current_version" in
    15.*) echo "Starting version: PostgreSQL $current_version" ;;
    17.*) echo "Error: Already on Postgres 17. Start with a PG15 stack."; exit 1 ;;
    *) echo "Error: Unexpected version: $current_version"; exit 1 ;;
esac

# --- Seed test data --------------------------------------------------------
# Note: this script is designed to run against a fresh docker-compose stack,
# not an existing database with user data.

echo ""
echo "Seeding test data on Postgres 15..."

run_sql <<'EOSQL'
-- Test table with various column types
CREATE TABLE IF NOT EXISTS public._upgrade_test (
    id serial PRIMARY KEY,
    name text NOT NULL,
    value numeric(10,2),
    created_at timestamptz DEFAULT now(),
    metadata jsonb
);

TRUNCATE public._upgrade_test;
INSERT INTO public._upgrade_test (name, value, metadata) VALUES
    ('alpha', 1.50, '{"tag": "a"}'),
    ('bravo', 2.75, '{"tag": "b"}'),
    ('charlie', 3.00, '{"tag": "c"}'),
    ('delta', 4.25, '{"tag": "d"}'),
    ('echo', 5.99, '{"tag": "e"}');

-- Index
CREATE INDEX IF NOT EXISTS _upgrade_test_name_idx ON public._upgrade_test (name);

-- Function
CREATE OR REPLACE FUNCTION public._upgrade_test_fn(n int)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
    SELECT n * 2;
$$;

-- Grant access so PostgREST can read it
GRANT SELECT ON public._upgrade_test TO anon, authenticated;
EOSQL

pre_count=$(run_sql -A -t -c "SELECT count(*) FROM public._upgrade_test;" | tr -d '[:space:]')
pre_checksum=$(run_sql -A -t -c "SELECT md5(string_agg(name || value::text, ',' ORDER BY id)) FROM public._upgrade_test;" | tr -d '[:space:]')

echo "  Rows: $pre_count"
echo "  Checksum: $pre_checksum"

# --- Run upgrade -----------------------------------------------------------

echo ""
echo "Running upgrade script..."
echo ""

bash utils/upgrade-pg17.sh --yes

echo ""

# --- Verify with pgTAP ----------------------------------------------------

echo "Running pgTAP verification..."
echo ""

# Use a non-quoted heredoc so $pre_count and $pre_checksum are interpolated
run_sql <<EOSQL
CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(11);

-- Version
SELECT ok(version() LIKE 'PostgreSQL 17%', 'Running Postgres 17');

-- Table
SELECT has_table('public', '_upgrade_test', 'Test table survived upgrade');

-- Row count
SELECT is(
    (SELECT count(*)::int FROM public._upgrade_test),
    ${pre_count},
    'Row count preserved'
);

-- Data checksum
SELECT is(
    (SELECT md5(string_agg(name || value::text, ',' ORDER BY id)) FROM public._upgrade_test),
    '${pre_checksum}',
    'Data checksum matches'
);

-- Index
SELECT has_index('public', '_upgrade_test', '_upgrade_test_name_idx', 'Index survived upgrade');

-- Function
SELECT has_function('public', '_upgrade_test_fn', ARRAY['integer'], 'Function survived upgrade');
SELECT is(public._upgrade_test_fn(21), 42, 'Function returns correct result');

-- Core extensions
-- Note: pgsodium may not be created as an extension in the postgres database
-- on default self-hosted installs (it's loaded via shared_preload_libraries
-- but the CREATE EXTENSION is conditional in the init migration).
SELECT ok(
    EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net'),
    'pg_net extension exists'
);

-- Roles
SELECT ok(
    EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_etl_admin'),
    'supabase_etl_admin role exists'
);
SELECT ok(
    EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_read_only_user'),
    'supabase_read_only_user role exists'
);

-- postgres is not superuser
SELECT ok(
    NOT (SELECT rolsuper FROM pg_roles WHERE rolname = 'postgres'),
    'postgres role is not superuser'
);

SELECT * FROM finish(true);
EOSQL

# --- Check service connectivity --------------------------------------------

echo ""
echo "Checking service connectivity..."

pass=0
fail=0

check() {
    test_name="$1"
    expected="$2"
    actual="$3"
    if [ "$actual" = "$expected" ]; then
        echo "  PASS: $test_name"
        pass=$((pass + 1))
    else
        echo "  FAIL: $test_name (expected $expected, got $actual)"
        fail=$((fail + 1))
    fi
}

# PostgREST
if [ -n "$anon_key" ]; then
    rest_status=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "apikey: $anon_key" \
        -H "Authorization: Bearer $anon_key" \
        "http://localhost:8000/rest/v1/_upgrade_test?select=count" 2>/dev/null) || rest_status="000"
    check "PostgREST connectivity" "200" "$rest_status"
fi

# Auth health (needs apikey header through Kong)
if [ -n "$anon_key" ]; then
    auth_status=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "apikey: $anon_key" \
        "http://localhost:8000/auth/v1/health" 2>/dev/null) || auth_status="000"
    check "Auth service health" "200" "$auth_status"
fi

echo ""
echo "  Services: $pass passed, $fail failed"

# --- Clean up test artifacts ----------------------------------------------

echo ""
echo "Cleaning up test artifacts..."

run_sql <<'EOSQL' || true
DROP FUNCTION IF EXISTS public._upgrade_test_fn(int);
DROP TABLE IF EXISTS public._upgrade_test;
DROP EXTENSION IF EXISTS pgtap;
EOSQL

# --- Summary --------------------------------------------------------------

echo ""
if [ "$fail" -gt 0 ]; then
    echo "=== SOME TESTS FAILED ==="
    exit 1
fi

echo "=== Upgrade test passed ==="
echo ""
echo "To reclaim disk space:"
echo "  rm -rf ./volumes/db/data.bak.pg15 ./volumes/db/pg17_upgrade_bin_*.tar.gz"
echo ""
