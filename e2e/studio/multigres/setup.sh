#!/usr/bin/env bash
# Bring up the Supabase self-hosted stack against an external Multigres database.
#
# Prerequisites:
#   1. Multigres running with its gateway on 127.0.0.1:15432
#      (clone github.com/multigres/multigres and `docker compose up --build`).
#   2. Docker + the supabase docker/ compose in this repo.
#
# What it does:
#   - provisions the database with the Supabase roles/schemas/grants/extensions
#     the services need
#   - starts the stack via docker/docker-compose.yml + this dir's override
#     (the `db` service is replaced by Multigres).
#
# Usage:
#   ./setup.sh up        # provision + start (default)
#   ./setup.sh provision # run only the SQL provisioning
#   ./setup.sh status    # show service health
#   ./setup.sh down       # stop the stack
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
COMPOSE_BASE="$REPO_ROOT/docker/docker-compose.yml"
COMPOSE_OVERRIDE="$SCRIPT_DIR/docker-compose.override.yml"
ENV_FILE="$SCRIPT_DIR/multigres.env"

MG_HOST="${MG_HOST:-host.docker.internal}"
MG_PORT="${MG_PORT:-15432}"

# Services to start (excludes db + supavisor on purpose).
SERVICES=(studio kong auth rest meta storage imgproxy functions realtime)

psql_mg() { # runs SQL (stdin) against Multigres via a throwaway client container
  docker run --rm -i --add-host=host.docker.internal:host-gateway \
    -e PGPASSWORD=postgres postgres:17 \
    psql -h "$MG_HOST" -p "$MG_PORT" -U postgres -d postgres -v ON_ERROR_STOP=0 "$@"
}

check_multigres() {
  echo "==> Checking Multigres gateway at $MG_HOST:$MG_PORT ..."
  if ! echo "select 1;" | psql_mg -tA >/dev/null 2>&1; then
    echo "ERROR: cannot reach Multigres on $MG_HOST:$MG_PORT." >&2
    echo "Start it first: in a multigres checkout, 'docker compose up --build'." >&2
    exit 1
  fi
  echo "    ok ($(echo 'select version();' | psql_mg -tA | head -1))"
}

provision() {
  echo "==> Provisioning Supabase roles/schemas/extensions on Multigres ..."
  psql_mg <<'SQL'
-- Roles (NOLOGIN group roles for the API)
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN NOINHERIT; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN NOINHERIT; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='authenticator') THEN CREATE ROLE authenticator LOGIN NOINHERIT; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='supabase_admin') THEN CREATE ROLE supabase_admin LOGIN CREATEDB CREATEROLE REPLICATION BYPASSRLS; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='supabase_auth_admin') THEN CREATE ROLE supabase_auth_admin LOGIN NOINHERIT CREATEROLE; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='supabase_storage_admin') THEN CREATE ROLE supabase_storage_admin LOGIN NOINHERIT CREATEROLE; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='supabase_functions_admin') THEN CREATE ROLE supabase_functions_admin LOGIN NOINHERIT CREATEROLE; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='supabase_realtime_admin') THEN CREATE ROLE supabase_realtime_admin NOLOGIN NOINHERIT; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='supabase_read_only_user') THEN CREATE ROLE supabase_read_only_user LOGIN BYPASSRLS; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='dashboard_user') THEN CREATE ROLE dashboard_user NOLOGIN CREATEDB CREATEROLE REPLICATION; END IF;
END $$;

-- Apply LOGIN + password unconditionally (CREATE above is guarded by IF NOT
-- EXISTS, so a role left over from an earlier run keeps its old attributes).
ALTER ROLE authenticator WITH LOGIN PASSWORD 'postgres';
ALTER ROLE supabase_admin WITH LOGIN PASSWORD 'postgres';
ALTER ROLE supabase_auth_admin WITH LOGIN PASSWORD 'postgres';
ALTER ROLE supabase_storage_admin WITH LOGIN PASSWORD 'postgres';
ALTER ROLE supabase_functions_admin WITH LOGIN PASSWORD 'postgres';
ALTER ROLE supabase_read_only_user WITH LOGIN PASSWORD 'postgres';

GRANT anon, authenticated, service_role TO authenticator;
GRANT anon, authenticated, service_role TO postgres;
GRANT supabase_functions_admin, supabase_realtime_admin TO postgres;
GRANT supabase_auth_admin, supabase_storage_admin TO postgres;

-- Schemas
CREATE SCHEMA IF NOT EXISTS extensions AUTHORIZATION postgres;
CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION supabase_auth_admin;
CREATE SCHEMA IF NOT EXISTS storage AUTHORIZATION supabase_storage_admin;
CREATE SCHEMA IF NOT EXISTS realtime AUTHORIZATION supabase_admin;
CREATE SCHEMA IF NOT EXISTS _realtime AUTHORIZATION supabase_admin;
CREATE SCHEMA IF NOT EXISTS graphql_public AUTHORIZATION supabase_admin;
CREATE SCHEMA IF NOT EXISTS supabase_functions AUTHORIZATION supabase_admin;

-- Re-assert ownership unconditionally (CREATE ... AUTHORIZATION is skipped when
-- the schema already exists, so a schema left over from an earlier run / probe
-- would otherwise keep the wrong owner and the admin roles couldn't create in it).
ALTER SCHEMA auth OWNER TO supabase_auth_admin;
ALTER SCHEMA storage OWNER TO supabase_storage_admin;
ALTER SCHEMA realtime OWNER TO supabase_admin;
ALTER SCHEMA _realtime OWNER TO supabase_admin;
ALTER SCHEMA graphql_public OWNER TO supabase_admin;
ALTER SCHEMA supabase_functions OWNER TO supabase_admin;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, supabase_admin;
-- The admin roles run their own migrations and need to create their migration
-- bookkeeping (GoTrue's schema_migrations lands in public; storage/realtime
-- create schemas) — PG15+ revokes CREATE on public + database from PUBLIC.
GRANT CREATE ON SCHEMA public TO supabase_admin, supabase_auth_admin, supabase_storage_admin, supabase_functions_admin;
GRANT ALL ON DATABASE postgres TO supabase_admin;
GRANT CREATE, TEMPORARY ON DATABASE postgres TO supabase_auth_admin, supabase_storage_admin, supabase_functions_admin;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA supabase_functions TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

-- JWT settings used by PostgREST helper functions
ALTER DATABASE postgres SET "app.settings.jwt_secret" TO 'your-super-secret-jwt-token-with-at-least-32-characters-long';
ALTER DATABASE postgres SET "app.settings.jwt_exp" TO '3600';

-- Extensions used by the stack.
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;
SQL
  echo "    done."
}

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_BASE" -f "$COMPOSE_OVERRIDE" "$@"
}

cmd="${1:-up}"
case "$cmd" in
  provision)
    check_multigres; provision ;;
  up)
    check_multigres; provision
    echo "==> Starting Supabase services ..."
    compose up -d "${SERVICES[@]}"
    echo "==> Waiting 20s for boot/migrations ..."
    sleep 20 || true
    compose ps
    echo
    echo "Studio:    http://localhost:8082"
    echo "API/kong:  http://localhost:8000"
    ;;
  status)
    compose ps ;;
  down)
    compose down ;;
  *)
    echo "usage: $0 {up|provision|status|down}" >&2; exit 1 ;;
esac
