#!/usr/bin/env bash
set -Eeo pipefail

# Source the Docker entrypoint script
source /usr/local/bin/docker-entrypoint.sh

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

			# PGPASSWORD is required for psql when authentication is required for 'local' connections via pg_hba.conf and is otherwise harmless
			# e.g. when '--auth=md5' or '--auth-local=md5' is used in POSTGRES_INITDB_ARGS
			export PGPASSWORD="${PGPASSWORD:-$POSTGRES_PASSWORD}"
			docker_temp_server_start "$@"

			docker_setup_db
			docker_process_init_files /docker-entrypoint-initdb.d/*

			docker_temp_server_stop
			unset PGPASSWORD

			cat <<-'EOM'

				PostgreSQL init process complete; ready for start up.

			EOM
		else
			cat <<-'EOM'

				PostgreSQL Database directory appears to contain a database; Skipping initialization

			EOM
		fi

		# Start a temporary server to run the roles SQL file
		export PGPASSWORD="${PGPASSWORD:-$POSTGRES_PASSWORD}"
		docker_temp_server_start "$@"

		# First alter the supabase_admin password as postgres superuser
		echo "Setting supabase_admin password..."
		docker_process_sql <<-'EOSQL'
      \set pgpass `echo "$POSTGRES_PASSWORD"`
			ALTER USER supabase_admin WITH PASSWORD :'pgpass';
		EOSQL

		# Now execute the roles SQL file using docker_process_sql as supabase_admin
		echo "Updating roles..."
		docker_process_sql -f /docker-entrypoint-initdb.d/init-scripts/99-roles.sql

		# Stop the temporary server
		docker_temp_server_stop
		unset PGPASSWORD
	fi

	exec "$@"
}

if ! _is_sourced; then
	_main "$@"
fi