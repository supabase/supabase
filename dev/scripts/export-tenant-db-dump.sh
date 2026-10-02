#!/usr/bin/env bash
#
# Emits the tenant database dump on stdout: the `supabase_realtime_admin` role definition, the
# `realtime` schema, and the `realtime.schema_migrations` rows. `mise run tenant-dumps` pipes it
# into priv/repo/tenant_db_dump_<major>.sql.
#
# This runs insie the tenant database's own container:
#
#     docker exec -i --env PGUSER --env PGDATABASE --env PGPASSWORD \
#       "$container" bash -s 17 < dev/scripts/export-tenant-db-dump.sh > dump.sql
#
# The database is expected to already have every tenant migration applied. Its major version must
# match the one passed in, which is how `tenant-dumps` knows the image it started really is the
# major TENANT_DUMP_IMAGES claims.
#
# Connection settings come from the usual libpq env vars. The host and port are the container's own
# loopback.
set -euo pipefail

expected_major=${1:?usage: export-tenant-db-dump.sh <expected postgres major>}

export PGHOST=127.0.0.1 PGPORT=5432

role=supabase_realtime_admin

version_num=$(psql -tAXc 'SHOW server_version_num')
major=$((version_num / 10000))
if [ "$major" != "$expected_major" ]; then
  echo "expected Postgres $expected_major, but this container is Postgres $major" >&2
  exit 1
fi

# Only the role bootstrap statements, indented to sit inside the do block below. The dump is
# captured on its own so a pg_dumpall failure surfaces as itself
roles=$(pg_dumpall --database "$PGDATABASE" --roles-only)
role_sql=$(
  printf '%s\n' "$roles" |
    grep -E "^(CREATE|ALTER) ROLE $role|^GRANT .*TO $role" |
    awk '!seen[$0]++ { print "    " $0 }'
) || true

if [ -z "$role_sql" ]; then
  echo "found no $role role statements in pg_dumpall --roles-only output" >&2
  exit 1
fi

cat <<SQL
--
-- Auto-generated. Do not edit.
--
-- Tenant \`realtime\` schema for Postgres $major
--
-- Beyond priv/repo/tenant_schema it also:
--   - creates the $role role
--   - creates realtime.schema_migrations and records every applied version
--   - sets ALTER DEFAULT PRIVILEGES and the dashboard_user/postgres grants
--
-- See dev/scripts/export-tenant-db-dump.sh
--
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$role') THEN
$role_sql
  END IF;
END \$\$;

SQL

# \restrict / \unrestrict are psql meta-commands newer pg_dump wraps the body in; they are noise
# here and older majors do not emit them. CREATE SCHEMA is made idempotent because a tenant
# database may already have the schema when the dump is loaded.
pg_dump --dbname "$PGDATABASE" --schema-only --schema realtime |
  sed -e '/^\\restrict /d' \
    -e '/^\\unrestrict /d' \
    -e 's/^CREATE SCHEMA realtime;$/CREATE SCHEMA IF NOT EXISTS realtime;/'

# pg_dump takes the schema but not the rows that say which migrations produced it.
echo 'ALTER TABLE realtime.schema_migrations ALTER COLUMN inserted_at SET DEFAULT now();'
psql -tAXq -c 'SELECT version FROM realtime."schema_migrations" ORDER BY version' |
  sed 's/.*/INSERT INTO realtime."schema_migrations" (version) VALUES (&);/'
