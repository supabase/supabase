#!/usr/bin/env bash
#
# Runs the WALRUS pg_regress suite against the tenant `realtime` schema.
#
# The suite came from supabase/walrus repo. Schema is built the way a fresh tenant gets it,
# which `Realtime.Tenants.Migrations` does in one of two ways:
#
#   --dump        load priv/repo/tenant_db_dump_<major>.sql, what a new tenant on a supported
#                 major gets (default)
#   --migrations  replay every migration in Realtime.Tenants.Migrations, what a tenant
#                 gets when the dump is not used (not new tenant or OrioleDB)
#
#   test/walrus/run.sh                                  # every test, from the dump
#   test/walrus/run.sh --migrations                     # every test, from the migrations
#   test/walrus/run.sh test_simple_insert               # named tests, passed to pg_regress
#   POSTGRES_IMAGE=supabase/postgres:15.14.1.167 test/walrus/run.sh
#
# --migrations needs Elixir on the host (it runs `mix run`); --dump needs only docker.
#
# POSTGRES_IMAGE picks the Postgres, and the major it reports picks the dump. Unset, the default
# in compose.walrus-db.yml applies; `mise run walrus` instead resolves it from TENANT_DUMP_IMAGES,
# so prefer that (`mise run walrus --major 15`) over naming an image by hand.
#
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../.."

mode=dump
tests=()
for arg in "$@"; do
  case "$arg" in
    --dump) mode=dump ;;
    --migrations) mode=migrations ;;
    -*) echo "unknown option: $arg" >&2; exit 2 ;;
    *) tests+=("$arg") ;;
  esac
done

COMPOSE=(docker compose -f compose.walrus-db.yml)
trap '"${COMPOSE[@]}" down -v --remove-orphans >/dev/null 2>&1 || true' EXIT

# A cluster left over from an interrupted run already has the schema loaded.
"${COMPOSE[@]}" down -v --remove-orphans >/dev/null 2>&1 || true
"${COMPOSE[@]}" up -d --wait

if [ "$mode" = migrations ]; then
  published=$("${COMPOSE[@]}" port walrus_db 5432)
  # config/runtime.exs demands METRICS_JWT_SECRET outside MIX_ENV=test. Nothing here reads it, so
  # any value does; mise supplies one locally, CI and a bare shell do not.
  DB_PORT="${published##*:}" METRICS_JWT_SECRET="${METRICS_JWT_SECRET:-walrus}" \
    mix run --no-start dev/scripts/migrate_tenant_db.exs
fi

set +e
"${COMPOSE[@]}" exec -T -u postgres walrus_db bash -s -- "$mode" "${tests[@]+"${tests[@]}"}" <<'INNER'
set -euo pipefail
export PGUSER=supabase_admin PGDATABASE=postgres PG_COLOR=auto

mode=$1
shift

if [ "$mode" = dump ]; then
  major=$(psql -Atqc "select current_setting('server_version_num')::int / 10000")
  echo "# loading tenant_db_dump_${major}.sql"
  psql -v ON_ERROR_STOP=1 -q -f "/walrus/priv/repo/tenant_db_dump_${major}.sql" >/dev/null
fi

psql -v ON_ERROR_STOP=1 -q -f /walrus/test/setup.sql -f /walrus/test/fixtures.sql >/dev/null

# The tests share one database and run in the order given, so sort for a stable order.
tests=("$@")
if [ $# -eq 0 ]; then
  tests=($(ls /walrus/test/sql | sed 's/\.sql$//' | sort))
fi

rm -rf /tmp/walrus-out
exec "$(dirname "$(pg_config --pgxs)")/../test/regress/pg_regress" \
  --use-existing --dbname="$PGDATABASE" \
  --inputdir=/walrus/test --outputdir=/tmp/walrus-out \
  "${tests[@]}"
INNER
status=$?
set -e

# What actually happened, kept on the host like walrus did. To accept a diff:
# cp test/walrus/results/<test>.out test/walrus/expected/<test>.out
rm -rf test/walrus/results
docker cp "$("${COMPOSE[@]}" ps -q walrus_db):/tmp/walrus-out/results" test/walrus/results >/dev/null 2>&1 || true

if [ $status -ne 0 ]; then
  echo
  "${COMPOSE[@]}" exec -T walrus_db cat /tmp/walrus-out/regression.diffs 2>/dev/null || true
fi

exit $status
