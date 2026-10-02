#!/bin/sh
set -eu

#######################################
# Used by both ami and docker builds to initialise database schema.
# Env vars:
#   POSTGRES_DB        defaults to postgres
#   POSTGRES_HOST      defaults to localhost
#   POSTGRES_PORT      defaults to 5432
#   POSTGRES_PASSWORD  defaults to ""
#   USE_DBMATE         defaults to ""
# Exit code:
#   0 if migration succeeds, non-zero on error.
#######################################

export PGDATABASE="${POSTGRES_DB:-postgres}"
export PGHOST="${POSTGRES_HOST:-localhost}"
export PGPORT="${POSTGRES_PORT:-5432}"
export PGPASSWORD="${POSTGRES_PASSWORD:-}"

# if args are supplied, simply forward to dbmate
connect="$PGPASSWORD@$PGHOST:$PGPORT/$PGDATABASE?sslmode=disable"
if [ "$#" -ne 0 ]; then
	export DATABASE_URL="${DATABASE_URL:-postgres://supabase_admin:$connect}"
	exec dbmate "$@"
	exit 0
fi

db=$(cd -- "$(dirname -- "$0")" >/dev/null 2>&1 && pwd)
if [ -z "${USE_DBMATE:-}" ]; then
	psql -v ON_ERROR_STOP=1 --no-password --no-psqlrc -U supabase_admin <<EOSQL
do \$\$
begin
  -- postgres role is pre-created during AMI build
  if not exists (select from pg_roles where rolname = 'postgres') then
    create role postgres superuser login password '$PGPASSWORD';
    alter database postgres owner to postgres;
  end if;
end \$\$
EOSQL
	# run init scripts as postgres user
	for sql in "$db"/init-scripts/*.sql; do
		echo "$0: running $sql"
		psql -v ON_ERROR_STOP=1 --no-password --no-psqlrc -U postgres -f "$sql"
	done
	psql -v ON_ERROR_STOP=1 --no-password --no-psqlrc -U postgres -c "ALTER USER supabase_admin WITH PASSWORD '$PGPASSWORD'"
	# run migrations as super user - postgres user demoted in post-setup
	for sql in "$db"/migrations/*.sql; do
		echo "$0: running $sql"
		psql -v ON_ERROR_STOP=1 --no-password --no-psqlrc -U supabase_admin -f "$sql"
	done
else
	psql -v ON_ERROR_STOP=1 --no-password --no-psqlrc -U supabase_admin <<EOSQL
  create role postgres superuser login password '$PGPASSWORD';
  alter database postgres owner to postgres;
EOSQL
	# run init scripts as postgres user
	DBMATE_MIGRATIONS_DIR="$db/init-scripts" DATABASE_URL="postgres://postgres:$connect" dbmate --no-dump-schema migrate
	psql -v ON_ERROR_STOP=1 --no-password --no-psqlrc -U postgres -c "ALTER USER supabase_admin WITH PASSWORD '$PGPASSWORD'"
	# run migrations as super user - postgres user demoted in post-setup
	DBMATE_MIGRATIONS_DIR="$db/migrations" DATABASE_URL="postgres://supabase_admin:$connect" dbmate --no-dump-schema migrate
fi

# run any post migration script to update role passwords
postinit="/etc/postgresql.schema.sql"
if [ -e "$postinit" ]; then
	echo "$0: running $postinit"
	psql -v ON_ERROR_STOP=1 --no-password --no-psqlrc -U supabase_admin -f "$postinit"
fi

# once done with everything, reset stats from init
psql -v ON_ERROR_STOP=1 --no-password --no-psqlrc -U supabase_admin -c 'SELECT extensions.pg_stat_statements_reset(); SELECT pg_stat_reset();' || true
