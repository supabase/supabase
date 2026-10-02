#!/bin/bash
set -Eeo pipefail

# Supabase PostgreSQL Initialization Script
# Similar to docker-entrypoint.sh from official postgres image
# Handles database initialization, password setup, and configuration

# Default values
PGDATA="${PGDATA:-./data}"
POSTGRES_USER="${POSTGRES_USER:-supabase_admin}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-postgres}"

# Get the directory where this script lives
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Script is at share/supabase-cli/bin/, so go up 3 levels to reach bundle root
BUNDLE_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
PGBIN="$BUNDLE_DIR/bin"

# Logging functions
postgres_log() {
	local type="$1"
	shift
	printf '%s [%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$type" "$*"
}

postgres_note() {
	postgres_log Note "$@"
}

postgres_error() {
	postgres_log ERROR "$@" >&2
}

# Check if PGDATA is initialized
postgres_is_initialized() {
	[ -s "$PGDATA/PG_VERSION" ]
}

# Setup initial database
postgres_setup_db() {
	postgres_note "Initializing database in $PGDATA"

	# Create PGDATA directory if it doesn't exist
	mkdir -p "$PGDATA"

	# Run initdb
	"$PGBIN/initdb" \
		-D "$PGDATA" \
		-U "$POSTGRES_USER" \
		--encoding=UTF8 \
		--locale=C \
		--no-instructions

	postgres_note "Database initialized"
}

# Setup configuration files
postgres_setup_config() {
	postgres_note "Setting up configuration files"

	# Copy config templates
	cp "$BUNDLE_DIR/share/supabase-cli/config/postgresql.conf.template" "$PGDATA/postgresql.conf"
	cp "$BUNDLE_DIR/share/supabase-cli/config/pg_hba.conf.template" "$PGDATA/pg_hba.conf"
	cp "$BUNDLE_DIR/share/supabase-cli/config/pg_ident.conf.template" "$PGDATA/pg_ident.conf"

	# Set absolute path to getkey script in postgresql.conf
	GETKEY_SCRIPT="$BUNDLE_DIR/share/supabase-cli/config/pgsodium_getkey.sh"

	# Ensure getkey script is executable
	if [ -f "$GETKEY_SCRIPT" ]; then
		chmod +x "$GETKEY_SCRIPT"
	fi

	cat >>"$PGDATA/postgresql.conf" <<EOF

# pgsodium and vault configuration (set by supabase-postgres-init)
pgsodium.getkey_script = '$GETKEY_SCRIPT'
vault.getkey_script = '$GETKEY_SCRIPT'
EOF

	postgres_note "Configuration files set up"
}

# Set password for superuser using single-user mode
postgres_setup_password() {
	if [ -n "$POSTGRES_PASSWORD" ]; then
		postgres_note "Setting password for user: $POSTGRES_USER"

		# Use single-user mode to set password before server starts
		# This allows us to use scram-sha-256 authentication
		# Must specify 'postgres' database as the target database
		# -j flag allows natural multi-line SQL (terminated by semicolon + empty line)
		"$PGBIN/postgres" --single -j -D "$PGDATA" postgres <<-EOSQL
			ALTER USER "$POSTGRES_USER" WITH PASSWORD '$POSTGRES_PASSWORD';
		EOSQL

		postgres_note "Password set successfully"
	fi
}

# Create additional database if specified and different from default
postgres_create_db() {
	if [ "$POSTGRES_DB" != "postgres" ]; then
		postgres_note "Creating database: $POSTGRES_DB"

		# Must specify 'postgres' database as the target database for single-user mode
		# -j flag allows natural multi-line SQL (terminated by semicolon + empty line)
		"$PGBIN/postgres" --single -j -D "$PGDATA" postgres <<-EOSQL
			CREATE DATABASE "$POSTGRES_DB";
		EOSQL

		postgres_note "Database created"
	fi
}

# Run initialization scripts from a directory
postgres_process_init_files() {
	local initdir="$1"

	if [ -d "$initdir" ]; then
		postgres_note "Running initialization scripts from $initdir"

		# Process files in sorted order
		for f in "$initdir"/*; do
			if [ ! -f "$f" ]; then
				continue
			fi

			case "$f" in
			*.sh)
				if [ -x "$f" ]; then
					postgres_note "Running $f"
					"$f"
				else
					postgres_note "Sourcing $f"
					# shellcheck source=/dev/null
					. "$f"
				fi
				;;
			*.sql)
				postgres_note "Running $f"
				"$PGBIN/postgres" --single -j -D "$PGDATA" postgres <"$f"
				;;
			*.sql.gz)
				postgres_note "Running $f"
				gunzip -c "$f" | "$PGBIN/postgres" --single -j -D "$PGDATA" postgres
				;;
			*)
				postgres_note "Ignoring $f"
				;;
			esac
		done
	fi
}

# Main initialization flow
postgres_init() {
	if postgres_is_initialized; then
		postgres_note "Database already initialized, skipping setup"
		return
	fi

	postgres_setup_db
	postgres_setup_config
	postgres_setup_password
	postgres_create_db

	# Process any initialization scripts in standard location
	# This allows users to add custom init scripts similar to Docker
	postgres_process_init_files "$BUNDLE_DIR/share/supabase-cli/init-scripts"

	postgres_note "Initialization complete"
}

# Main entrypoint
main() {
	# Validate environment
	if [ -z "$PGDATA" ]; then
		postgres_error "PGDATA environment variable must be set"
		exit 1
	fi

	# Initialize database if needed
	postgres_init

	# Start PostgreSQL server
	postgres_note "Starting PostgreSQL server"
	exec "$PGBIN/postgres" -D "$PGDATA" "$@"
}

# Run main function
main "$@"
