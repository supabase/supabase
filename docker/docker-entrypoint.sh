#!/usr/bin/env bash
set -Eeo pipefail

source /usr/local/bin/docker-entrypoint.sh

# sync $POSTGRES_PASSWORD to supabase-specific roles
pg_sync_password() {
  # Wait for PostgreSQL to be ready with timeout
  timeout 30s bash -c 'until pg_isready -h localhost >/dev/null 2>&1; do
    echo "Waiting for PostgreSQL to be ready..."
    sleep 1
  done' || {
    echo "Timeout waiting for PostgreSQL to be ready after 30 seconds"
    return 1
  }

  # Connect via TCP/IP to localhost and alter the supabase_admin password
  psql -h localhost -U supabase_admin <<-'EOSQL'
    \set pgpass `echo "$POSTGRES_PASSWORD"`
    ALTER USER supabase_admin WITH PASSWORD :'pgpass';
EOSQL

  # execute the roles SQL file using psql
  psql -h localhost -U supabase_admin -f "/docker-entrypoint-initdb.d/init-scripts/99-roles.sql"
}

_main() {
	# if first arg looks like a flag, assume we want to run postgres server
	if [ "${1:0:1}" = '-' ]; then
		set -- postgres "$@"
	fi

	if [ "$1" = 'postgres' ] && ! _pg_want_help "$@"; then
		docker_setup_env
		# setup data directories and permissions (when run as root)
		docker_create_db_directories
		if [ "$(id -u)" = '0' ]; then
			# then restart script as postgres user
			exec gosu postgres "$BASH_SOURCE" "$@"
		fi

		# only run initialization on an empty data directory
		if [ -z "$DATABASE_ALREADY_EXISTS" ]; then
			docker_verify_minimum_env

			# check dir permissions to reduce likelihood of half-initialized database
			ls /docker-entrypoint-initdb.d/ > /dev/null

			docker_init_database_dir
			pg_setup_hba_conf "$@"

			docker_setup_db
			docker_process_init_files /docker-entrypoint-initdb.d/*

			cat <<-'EOM'

				PostgreSQL init process complete; ready for start up.

			EOM
		else
			cat <<-'EOM'

				PostgreSQL Database directory appears to contain a database; Skipping initialization

			EOM
		fi

		# Start pg_sync_password in the background
		pg_sync_password "$@" &
	fi

	# Execute the main postgres command
	exec "$@"
}

if ! _is_sourced; then
	_main "$@"
fi
