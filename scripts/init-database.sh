#!/bin/bash
# Initialize a fresh PostgreSQL database with all Supabase schemas
# Usage: ./scripts/init-database.sh --host db-alpha --port 5432 --database postgres --password secret
#
# This script makes a fresh PostgreSQL database a fully functional Supabase project.
# Run once per new database before adding it to the registry.
set -e

HOST="localhost"
PORT=5432
DATABASE="postgres"
PASSWORD=""
SUPERUSER="postgres"
SKIP_CONFIRM=false

while [[ "$#" -gt 0 ]]; do
  case $1 in
    --host)      HOST="$2"; shift ;;
    --port)      PORT="$2"; shift ;;
    --database)  DATABASE="$2"; shift ;;
    --password)  PASSWORD="$2"; shift ;;
    --superuser) SUPERUSER="$2"; shift ;;
    --yes|-y)    SKIP_CONFIRM=true ;;
    *) echo "Unknown param: $1"; exit 1 ;;
  esac
  shift
done

if [ -z "$PASSWORD" ]; then
  echo "Error: --password is required"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_DIR="$SCRIPT_DIR/../docker/volumes/db"

echo "======================================"
echo "Supabase Database Initialization"
echo "======================================"
echo "Host:     $HOST:$PORT"
echo "Database: $DATABASE"
echo "User:     $SUPERUSER"
echo ""

if [ "$SKIP_CONFIRM" = false ]; then
  read -p "This will modify the database. Continue? (y/N) " confirm
  if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "Aborted."
    exit 0
  fi
fi

# Helper: run psql with the configured connection
psql_run() {
  PGPASSWORD="$PASSWORD" psql -h "$HOST" -p "$PORT" -U "$SUPERUSER" -d "$DATABASE" "$@"
}

# Helper: run a psql file, tolerating errors about already-existing objects
psql_file() {
  local file="$1"
  local label="$2"
  if [ ! -f "$file" ]; then
    echo "  WARNING: $file not found, skipping."
    return 0
  fi
  PGPASSWORD="$PASSWORD" psql -h "$HOST" -p "$PORT" -U "$SUPERUSER" -d "$DATABASE" \
    -f "$file" 2>&1 || {
    echo "  (some objects in $label may already exist — continuing)"
  }
}

# ─────────────────────────────────────────────
echo "[1/8] Enabling required extensions..."
psql_run <<'EOF'
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
-- pg_net and pg_jsonschema are optional — skip if unavailable
DO $$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS "pg_net" SCHEMA extensions;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_net extension not available, skipping.';
  END;
  BEGIN
    CREATE EXTENSION IF NOT EXISTS "pg_jsonschema" SCHEMA extensions;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_jsonschema extension not available, skipping.';
  END;
END
$$;
EOF

# ─────────────────────────────────────────────
echo "[2/8] Creating Supabase roles..."
psql_file "$DB_DIR/roles.sql" "roles.sql"

# ─────────────────────────────────────────────
echo "[3/8] Creating auth schema..."
# GoTrue applies its own full migration set on first startup.
# We create the schema + bare auth.users so RLS policies referencing auth.uid() compile,
# and then GoTrue adds all remaining columns and tables when it boots.
psql_run <<'EOF'
CREATE SCHEMA IF NOT EXISTS auth;

-- Grant auth admin full ownership of the schema
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    EXECUTE 'GRANT USAGE ON SCHEMA auth TO supabase_auth_admin';
    EXECUTE 'GRANT ALL   ON SCHEMA auth TO supabase_auth_admin';
  END IF;
END
$$;

-- Minimal auth.users so JWT helper functions and RLS compile cleanly.
-- GoTrue will ALTER this table (add columns) during its migration run.
CREATE TABLE IF NOT EXISTS auth.users (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aud                          VARCHAR(255),
  role                         VARCHAR(255),
  email                        VARCHAR(255) UNIQUE,
  encrypted_password           VARCHAR(255),
  email_confirmed_at           TIMESTAMPTZ,
  invited_at                   TIMESTAMPTZ,
  confirmation_token           VARCHAR(255),
  confirmation_sent_at         TIMESTAMPTZ,
  recovery_token               VARCHAR(255),
  recovery_sent_at             TIMESTAMPTZ,
  email_change_token_new       VARCHAR(255),
  email_change                 VARCHAR(255),
  email_change_sent_at         TIMESTAMPTZ,
  last_sign_in_at              TIMESTAMPTZ,
  raw_app_meta_data            JSONB,
  raw_user_meta_data           JSONB,
  is_super_admin               BOOLEAN,
  created_at                   TIMESTAMPTZ,
  updated_at                   TIMESTAMPTZ,
  phone                        TEXT UNIQUE DEFAULT NULL,
  phone_confirmed_at           TIMESTAMPTZ,
  phone_change                 TEXT DEFAULT '',
  phone_change_token           VARCHAR(255) DEFAULT '',
  phone_change_sent_at         TIMESTAMPTZ,
  confirmed_at                 TIMESTAMPTZ GENERATED ALWAYS AS (
                                 LEAST(email_confirmed_at, phone_confirmed_at)
                               ) STORED,
  email_change_token_current   VARCHAR(255) DEFAULT '',
  email_change_confirm_status  SMALLINT DEFAULT 0,
  banned_until                 TIMESTAMPTZ,
  reauthentication_token       VARCHAR(255) DEFAULT '',
  reauthentication_sent_at     TIMESTAMPTZ,
  is_sso_user                  BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at                   TIMESTAMPTZ,
  is_anonymous                 BOOLEAN NOT NULL DEFAULT FALSE
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    EXECUTE 'GRANT ALL ON auth.users TO supabase_auth_admin';
  END IF;
END
$$;
EOF

# ─────────────────────────────────────────────
echo "[4/8] Setting up JWT helper functions..."
if [ -f "$DB_DIR/jwt.sql" ]; then
  psql_file "$DB_DIR/jwt.sql" "jwt.sql"
else
  # Inline fallback if jwt.sql is absent
  psql_run <<'EOF'
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
  LANGUAGE SQL STABLE
  AS $$
    SELECT COALESCE(
      nullif(current_setting('request.jwt.claim.sub', true), ''),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    )::uuid
  $$;

CREATE OR REPLACE FUNCTION auth.role() RETURNS text
  LANGUAGE SQL STABLE
  AS $$
    SELECT COALESCE(
      nullif(current_setting('request.jwt.claim.role', true), ''),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
    )::text
  $$;

CREATE OR REPLACE FUNCTION auth.email() RETURNS text
  LANGUAGE SQL STABLE
  AS $$
    SELECT COALESCE(
      nullif(current_setting('request.jwt.claim.email', true), ''),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
    )::text
  $$;
EOF
fi

# ─────────────────────────────────────────────
echo "[5/8] Setting up Realtime schema..."
psql_file "$DB_DIR/realtime.sql" "realtime.sql"

# ─────────────────────────────────────────────
echo "[6/8] Setting up pgbouncer auth (pooler)..."
psql_file "$DB_DIR/pooler.sql" "pooler.sql"

# ─────────────────────────────────────────────
echo "[7/8] Setting up Storage schema..."
psql_run <<'EOF'
CREATE SCHEMA IF NOT EXISTS storage;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_storage_admin') THEN
    EXECUTE 'GRANT ALL ON SCHEMA storage TO supabase_storage_admin';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'GRANT USAGE ON SCHEMA storage TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'GRANT USAGE ON SCHEMA storage TO anon';
  END IF;
END
$$;
EOF

# ─────────────────────────────────────────────
echo "[8/8] Setting up default API grants on public schema..."
psql_run <<'EOF'
DO $$
DECLARE
  r TEXT;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('GRANT USAGE ON SCHEMA public TO %I', r);
      EXECUTE format('GRANT ALL ON ALL TABLES    IN SCHEMA public TO %I', r);
      EXECUTE format('GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO %I', r);
      EXECUTE format('GRANT ALL ON ALL ROUTINES  IN SCHEMA public TO %I', r);
    END IF;
  END LOOP;
END
$$;

-- Default privileges for objects created by postgres in public schema
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;
EOF

echo ""
echo "======================================"
echo "Database initialized successfully!"
echo "======================================"
echo ""
echo "Next steps:"
echo "  1. Add this database to docker/volumes/registry/databases.json"
echo "  2. Run: make generate && make start-multi"
echo "  3. GoTrue will apply its own auth migrations on first startup"
echo ""