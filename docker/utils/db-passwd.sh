#!/bin/sh
#
# Portions of this code are derived from Inder Singh's update-db-pass.sh
# Copyright 2025 Inder Singh. Licensed under Apache License 2.0.
# Original source:
# https://github.com/singh-inder/supabase-automated-self-host/blob/main/docker/update-db-pass.sh
#
# GitHub discussion here:
# https://github.com/supabase/supabase/issues/22605#issuecomment-3323382144
#
# Changed:
# - POSIX shell compatibility
# - No hardcoded values for database service and admin user
# - Use .env for the admin user and database service port
# - Does _not_ set password for supabase_read_only_user (this role is not
#   supposed to have a password)
# - Print all values and confirm before updating
# - Stop on any errors
#
# Heads up:
# - Updating _analytics.source_backends is not needed after PR logflare#2069
# - Newer Logflare versions use a different table and update connection string
#

set -e

if ! docker compose version > /dev/null 2>&1; then
    echo "Docker Compose not found."
    exit 1
fi

if [ ! -f .env ]; then
    echo "Missing .env file. Exiting."
    exit 1
fi

# Generate random hex-only password to avoid issues with SQL/shell
new_passwd="$(openssl rand -hex 16)"
# If replacing with a custom password, avoid using @/?#:&
# https://supabase.com/docs/guides/database/postgres/roles#passwords
# new_passwd="d0notUseSpecialSymbolsForPq123-"

# Check Postgres service
db_image_prefix="supabase.postgres:"

compose_output=$(docker compose ps \
  --format '{{.Image}}\t{{.Service}}\t{{.Status}}' 2>/dev/null | \
  grep -m1 "^$db_image_prefix" || true)

if [ -z "$compose_output" ]; then
    echo "Postgres container not found. Exiting."
    exit 1
fi

db_image=$(echo "$compose_output" | cut -f1)
db_srv_name=$(echo "$compose_output" | cut -f2)
db_srv_status=$(echo "$compose_output" | cut -f3)

case "$db_srv_status" in
    Up*)
        ;;
    *)
        echo "Postgres container status: $db_srv_status"
        echo "Exiting."
        exit 1
        ;;
esac

db_srv_port=$(grep "^POSTGRES_PORT=" .env | cut -d '=' -f 2)
port_source=" (.env):"
if [ -z "$db_srv_port" ]; then
    db_srv_port="5432"
    port_source=" (default):"
fi

db_admin_user="supabase_admin"

echo ""
echo "*** Check configuration below before updating database passwords! ***"
echo ""
echo "Service name: $db_srv_name"
echo "Service status: $db_srv_status"
echo "Service port${port_source} $db_srv_port"
echo "Image: $db_image"
echo ""
echo "Admin user: $db_admin_user"

if ! test -t 0; then
    echo ""
    echo "Running non-interactively. Not updating passwords."
    exit 0
fi

echo "New database password: $new_passwd"
echo ""

printf "Update database passwords? (y/N) "
read -r REPLY
case "$REPLY" in
    [Yy])
        ;;
    *)
        echo "Canceled. Not updating passwords."
        exit 0
        ;;
esac

echo "Updating passwords..."
echo "Connecting to the database service container..."

docker compose exec -T "$db_srv_name" psql -U "$db_admin_user" -d "_supabase" -v ON_ERROR_STOP=1 <<EOF
alter user anon with password '${new_passwd}';
alter user authenticated with password '${new_passwd}';
alter user authenticator with password '${new_passwd}';
alter user dashboard_user with password '${new_passwd}';
alter user pgbouncer with password '${new_passwd}';
alter user postgres with password '${new_passwd}';
alter user service_role with password '${new_passwd}';
alter user supabase_admin with password '${new_passwd}';
alter user supabase_auth_admin with password '${new_passwd}';
alter user supabase_functions_admin with password '${new_passwd}';
alter user supabase_replication_admin with password '${new_passwd}';
alter user supabase_storage_admin with password '${new_passwd}';

DROP SCHEMA _supavisor CASCADE;
create schema if not exists _supavisor;
alter schema _supavisor owner to supabase_admin;

DO \$\$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = '_analytics'
      AND table_name = 'source_backends'
  ) THEN
    UPDATE _analytics.source_backends
    SET config = jsonb_set(
      config,
      '{url}',
      '"postgresql://${db_admin_user}:${new_passwd}@${db_srv_name}:${db_srv_port}/postgres"',
      false
    )
    WHERE type = 'postgres';
  END IF;
END
\$\$;
EOF

echo "Updating POSTGRES_PASSWORD in .env..."
sed -i.old "s|^POSTGRES_PASSWORD=.*$|POSTGRES_PASSWORD=$new_passwd|" .env

echo ""
echo "Success. To update and restart containers use:"
echo ""
echo "docker compose up -d --force-recreate"
echo ""
