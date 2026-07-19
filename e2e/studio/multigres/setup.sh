#!/usr/bin/env bash
# Bring up the Supabase self-hosted stack against an external Multigres database.
#
# Prerequisites:
#   1. Multigres running with its gateway on 127.0.0.1:15432, built on a
#      supabase/postgres:*-multigres base image (so the Supabase
#      roles/schemas/extensions already exist via that image's initdb):
#      git clone https://github.com/multigres/multigres
#      cd multigres
#      MULTIGRES_POSTGRES_IMAGE=supabase/postgres:<tag>-multigres \
#      MULTIGRES_PROVISION_PG_PACKAGES=false \
#      docker compose up --build -d
#   2. Docker + the supabase docker/ compose in this repo.
#
# What it does:
#   - syncs the demo password onto the service roles that authenticate with
#     ${POSTGRES_PASSWORD} (the supabase/postgres image bakes in the roles
#     themselves with its own build-time passwords, which don't match)
#   - starts the stack via docker/docker-compose.yml + this dir's override
#     (the `db` service is replaced by Multigres).
#
# Usage:
#   ./setup.sh up        # sync passwords + start (default)
#   ./setup.sh provision # run only the password sync
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
  # supabase_admin is the cluster's bootstrap superuser (POSTGRES_USER baked
  # into the supabase/postgres:*-multigres image) and the only role Multigres
  # itself sets a known password for.
  docker run --rm -i --add-host=host.docker.internal:host-gateway \
    -e PGPASSWORD=postgres postgres:17 \
    psql -h "$MG_HOST" -p "$MG_PORT" -U supabase_admin -d postgres -v ON_ERROR_STOP=0 "$@"
}

check_multigres() {
  echo "==> Checking Multigres gateway at $MG_HOST:$MG_PORT ..."
  if ! echo "select 1;" | psql_mg -tA >/dev/null 2>&1; then
    echo "ERROR: cannot reach Multigres on $MG_HOST:$MG_PORT." >&2
    echo "Start it first: in a multigres checkout, build against a" >&2
    echo "supabase/postgres:*-multigres image (see the header of this script)." >&2
    exit 1
  fi
  echo "    ok ($(echo 'select version();' | psql_mg -tA | head -1))"
}

provision() {
  echo "==> Syncing demo passwords for Supabase service roles on Multigres ..."
  # The supabase/postgres:*-multigres base image already ships the Supabase
  # roles, schemas, grants, and extensions via its own initdb migrations — the
  # only gap is that the roles the self-hosted stack authenticates as
  # (docker/docker-compose.yml's ${POSTGRES_PASSWORD}) were baked in with
  # different, unknown passwords. Reset just those to the demo password.
  #
  # docker/docker-compose.yml hardcodes pg-meta to connect as `postgres`, and
  # Studio's extension UI runs through pg-meta. The supabase/postgres image
  # deliberately makes `postgres` non-superuser (supabase_admin holds real
  # superuser, mirroring the production security model), so CREATE EXTENSION
  # for anything not explicitly "trusted" (pg_cron, hypopg, ...) fails with
  # permission denied. On the old vanilla postgres:17.7 base, `postgres` was
  # the initdb bootstrap superuser, so this worked by accident. Restore that
  # same privilege level here since this is a throwaway e2e database.
  #
  # Note: the `realtime` service is expected to crash-loop here (both before
  # and after this change) — it needs a separate `_supabase` database for its
  # own migration bookkeeping, and Multigres's gateway doesn't support CREATE
  # DATABASE ("CREATE DATABASE is not supported through the connection
  # pooler"). Pre-existing Multigres limitation, not something this script
  # can provision around.
  #
  # `supabase_functions` (below) isn't part of the postgres image's own initdb
  # migrations either — the Supabase CLI's local dev stack (`supabase start`)
  # provisions it separately on top of Postgres, which is why `pnpm e2e`
  # (CLI-backed) never hits this gap while this Docker-based harness does.
  # DDL copied from a `supabase start` instance so Studio's "Database
  # Webhooks" feature (gated on this schema's presence) treats it as already
  # enabled, instead of rendering an "Enable webhooks" button that calls a
  # self-hosted API route which doesn't exist (apps/studio has no
  # pages/api/platform/database/[ref]/hook-enable.ts).
  psql_mg <<'SQL'
ALTER ROLE postgres WITH LOGIN SUPERUSER PASSWORD 'postgres';
ALTER ROLE authenticator WITH LOGIN PASSWORD 'postgres';
ALTER ROLE supabase_auth_admin WITH LOGIN PASSWORD 'postgres';
ALTER ROLE supabase_storage_admin WITH LOGIN PASSWORD 'postgres';

DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_functions_admin') THEN
    CREATE ROLE supabase_functions_admin LOGIN NOINHERIT CREATEROLE PASSWORD 'postgres';
  END IF;
END $$;
GRANT supabase_functions_admin TO postgres;

CREATE SCHEMA IF NOT EXISTS supabase_functions AUTHORIZATION supabase_functions_admin;
GRANT USAGE ON SCHEMA supabase_functions TO postgres, anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS supabase_functions.migrations (
  version text PRIMARY KEY,
  inserted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS supabase_functions.hooks (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  hook_table_id integer NOT NULL,
  hook_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  request_id bigint
);
CREATE INDEX IF NOT EXISTS supabase_functions_hooks_h_table_id_h_name_idx
  ON supabase_functions.hooks (hook_table_id, hook_name);
CREATE INDEX IF NOT EXISTS supabase_functions_hooks_request_id_idx
  ON supabase_functions.hooks (request_id);

GRANT ALL ON ALL TABLES IN SCHEMA supabase_functions
  TO postgres, supabase_functions_admin, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION supabase_functions.http_request()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'supabase_functions'
AS $function$
  DECLARE
    request_id bigint;
    payload jsonb;
    url text := TG_ARGV[0]::text;
    method text := TG_ARGV[1]::text;
    headers jsonb DEFAULT '{}'::jsonb;
    params jsonb DEFAULT '{}'::jsonb;
    timeout_ms integer DEFAULT 1000;
  BEGIN
    IF url IS NULL OR url = 'null' THEN
      RAISE EXCEPTION 'url argument is missing';
    END IF;

    IF method IS NULL OR method = 'null' THEN
      RAISE EXCEPTION 'method argument is missing';
    END IF;

    IF TG_ARGV[2] IS NULL OR TG_ARGV[2] = 'null' THEN
      headers = '{"Content-Type": "application/json"}'::jsonb;
    ELSE
      headers = TG_ARGV[2]::jsonb;
    END IF;

    IF TG_ARGV[3] IS NULL OR TG_ARGV[3] = 'null' THEN
      params = '{}'::jsonb;
    ELSE
      params = TG_ARGV[3]::jsonb;
    END IF;

    IF TG_ARGV[4] IS NULL OR TG_ARGV[4] = 'null' THEN
      timeout_ms = 1000;
    ELSE
      timeout_ms = TG_ARGV[4]::integer;
    END IF;

    CASE
      WHEN method = 'GET' THEN
        SELECT http_get INTO request_id FROM net.http_get(
          url, params, headers, timeout_ms
        );
      WHEN method = 'POST' THEN
        payload = jsonb_build_object(
          'old_record', OLD,
          'record', NEW,
          'type', TG_OP,
          'table', TG_TABLE_NAME,
          'schema', TG_TABLE_SCHEMA
        );
        SELECT http_post INTO request_id FROM net.http_post(
          url, payload, params, headers, timeout_ms
        );
      ELSE
        RAISE EXCEPTION 'method argument % is invalid', method;
    END CASE;

    INSERT INTO supabase_functions.hooks (hook_table_id, hook_name, request_id)
    VALUES (TG_RELID, TG_NAME, request_id);

    RETURN NEW;
  END
$function$;
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
