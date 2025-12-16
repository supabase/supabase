#!/bin/sh
#
# Portions of this code are derived from Inder Singh's update-db-pass.sh shell script.
# Copyright 2025 Inder Singh. Licensed under Apache License 2.0.
# Original source: https://github.com/singh-inder/supabase-automated-self-host/blob/main/docker/update-db-pass.sh
#
# Changed:
# - POSIX shell compatibility
# - No hardcoded values for database service and admin user
# - Use .env for the admin user and database service port
# - Print all values and confirm before updating
# - Stop on any errors
#

set -e

if [ ! -f .env ]; then
    echo "Missing .env file. Exiting."
    exit 1
fi

# Generate random hex-only password to avoid issues with SQL/shell
new_passwd="$(openssl rand -hex 16)"
# If replacing with a custom password, avoid using @/?#:&
# https://supabase.com/docs/guides/database/postgres/roles#passwords
# new_passwd="d0notUseSpecialSymbolsForPq123-"

# Check Postgres service status
db_image_prefix="supabase.postgres:"
db_srv_status=$(docker compose ps 2>/dev/null | grep "$db_image_prefix" | awk '{print $8}')

if [ "$db_srv_status" != "Up" ]; then
    echo "Postgres container is not running. Exiting."
    exit 1
fi

# Get Postgres service name
db_srv_name=$(docker compose ps 2>/dev/null | grep "$db_image_prefix" | awk '{print $4}')

db_admin_user=$(grep -i "^POSTGRES_USER_READ_WRITE=" .env | cut -d '=' -f 2)
user_source=" (.env):"
if [ -z "$db_admin_user" ]; then
    db_admin_user="supabase_admin"
    user_source=" (default):"
fi

db_srv_port=$(grep -i "^POSTGRES_PORT=" .env | cut -d '=' -f 2)
port_source=" (.env):"
if [ -z "$db_srv_port" ]; then
    db_srv_port="5432"
    port_source=" (default):"
fi

echo ""
echo "*** Check configuration below before updating database passwords! ***"
echo ""
echo "Service name (docker compose): $db_srv_name"
echo "Service status: $db_srv_status"
echo "Service port${port_source} $db_srv_port"
echo "Admin user${user_source} $db_admin_user"

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

docker compose exec -T $db_srv_name psql -U $db_admin_user -d "_supabase" -v ON_ERROR_STOP=1 <<EOF
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
alter user supabase_read_only_user with password '${new_passwd}';
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
echo "Success. To restart containers use:"
echo ""
echo "docker compose up -d --force-recreate"
echo ""
