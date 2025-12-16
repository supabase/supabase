#!/bin/sh
#
# Copyright 2025 Inder Singh. Licensed under Apache License 2.0.
# Original source: https://github.com/singh-inder/supabase-automated-self-host/blob/main/docker/update-db-pass.sh
# This version modifies original for POSIX shell compatibility [...]
#

set -e

# Generate password with hex characters only (safe for SQL/shell)
# To use a custom password, use only letters and numbers
new_passwd="$(openssl rand -hex 16)"

if [ ! -w ".env" ]; then
    echo ".env file must exist and be writable by the current user"
    exit 1
fi

# Check if db container is running
if ! docker compose ps db 2>/dev/null | grep -q "Up"; then
    echo "Database container is not running. Start it with: docker compose up -d db"
    exit 1
fi

docker compose exec -T db psql -U supabase_admin -d "_supabase" <<EOF
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
      '"postgresql://supabase_admin:${new_passwd}@db:5432/postgres"',
      false
    )
    WHERE type = 'postgres';
  END IF;
END
\$\$;
EOF

sed -i.old "s|POSTGRES_PASSWORD.*|POSTGRES_PASSWORD=$new_passwd|" .env

docker compose up -d --force-recreate
