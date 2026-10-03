{
  writeShellApplication,
  overmind,
  dbmate,
  nix,
  jq,
  yq,
  system,
  defaults,
}:
let
  migrationsDir = ../../migrations/db;
  ansibleVars = ../../ansible/vars.yml;
  pgbouncerAuthSchemaSql = ../../ansible/files/pgbouncer_config/pgbouncer_auth_schema.sql;
  statExtensionSql = ../../ansible/files/stat_extension.sql;
in
writeShellApplication {
  name = "dbmate-tool";
  runtimeInputs = [
    overmind
    dbmate
    nix
    jq
    yq
  ];
  text = ''
    # Default values
    PSQL_VERSION="ALL"
    PORTNO="${defaults.port}"
    PGSQL_SUPERUSER="${defaults.superuser}"
    PGPASSWORD="''${PGPASSWORD:-postgres}"
    PGSQL_USER="postgres"
    FLAKE_URL="github:supabase/postgres"
    MIGRATIONS_DIR="${migrationsDir}"
    CURRENT_SYSTEM="${system}"
    ANSIBLE_VARS="${ansibleVars}"
    PGBOUNCER_AUTH_SCHEMA_SQL="${pgbouncerAuthSchemaSql}"
    STAT_EXTENSION_SQL="${statExtensionSql}"

    # Start PostgreSQL using nix
    start_postgres() {
        DATDIR=$(mktemp -d)
        echo "Starting PostgreSQL in directory: $DATDIR"  # Create the DATDIR if it doesn't exist
        nix run "$FLAKE_URL#start-server" -- "$PSQL_VERSION" --skip-migrations --daemonize --datdir "$DATDIR"
        echo "PostgreSQL started."
    }

    # Cleanup function
    cleanup() {
        echo "Cleaning up..."

        # Check if PostgreSQL processes exist
        if pgrep -f "postgres" >/dev/null; then
            echo "Stopping PostgreSQL gracefully..."

            # Use pg_ctl to stop PostgreSQL
            pg_ctl -D "$DATDIR" stop

            # Wait a bit for graceful shutdown
            sleep 5

            # Check if processes are still running
            if pgrep -f "postgres" >/dev/null; then
                echo "Warning: Some PostgreSQL processes could not be stopped gracefully."
            fi
        else
            echo "PostgreSQL is not running, skipping stop."
        fi

        # Always exit successfully, log any remaining processes
        if pgrep -f "postgres" >/dev/null; then
            echo "Warning: Some PostgreSQL processes could not be cleaned up:"
            pgrep -f "postgres"
        else
            echo "Cleanup completed successfully"
        fi
    }


    # Function to display help
    print_help() {
        echo "Usage: nix run .#dbmate-tool -- [options]"
        echo
        echo "Options:"
        echo "  -v, --version [15|17|orioledb-17|all]  Specify the PostgreSQL version to use (required defaults to --version all)"
        echo "  -p, --port PORT                    Specify the port number to use (default: 5435)"
        echo "  -h, --help                         Show this help message"
        echo "  -f, --flake-url URL                Specify the flake URL to use (default: github:supabase/postgres)"
        echo "Description:"
        echo "  Runs 'dbmate up' against a locally running the version of database you specify. Or 'all' to run against all versions."
        echo "  NOTE: To create a migration, you must run 'nix develop' and then 'dbmate new <migration_name>' to create a new migration file."
        echo
        echo "Examples:"
        echo "  nix run .#dbmate-tool"
        echo "  nix run .#dbmate-tool -- --version 15"
        echo "  nix run .#dbmate-tool -- --version 16 --port 5433"
        echo "  nix run .#dbmate-tool -- --version 16 --port 5433 --flake-url github:supabase/postgres/<commithash>"
    }

    # Parse arguments
    while [[ "$#" -gt 0 ]]; do
        case "$1" in
            -v|--version)
                if [[ -n "$2" && ! "$2" =~ ^- ]]; then
                    PSQL_VERSION="$2"
                    shift 2
                else
                    echo "Error: --version requires an argument (15, 16, or orioledb-17)"
                    exit 1
                fi
                ;;
            -u|--user)
                if [[ -n "$2" && ! "$2" =~ ^- ]]; then
                    PGSQL_USER="$2"
                    shift 2
                else
                    echo "Error: --user requires an argument"
                    exit 1
                fi
                ;;
            -f|--flake-url)
                if [[ -n "$2" && ! "$2" =~ ^- ]]; then
                    FLAKE_URL="$2"
                    shift 2
                else
                    echo "Error: --flake-url requires an argument"
                    exit 1
                fi
                ;;
            -p|--port)
                if [[ -n "$2" && ! "$2" =~ ^- ]]; then
                    PORTNO="$2"
                    shift 2
                else
                    echo "Error: --port requires an argument"
                    exit 1
                fi
                ;;
            -h|--help)
                print_help
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                print_help
                exit 1
                ;;
        esac
    done

    # Function to wait for PostgreSQL to be ready
    wait_for_postgres() {
        local max_attempts=30  # Increased significantly
        local attempt=1

        # Give PostgreSQL a moment to actually start the process
        sleep 2

        while [ $attempt -le $max_attempts ]; do
            "''${PSQLBIN}/pg_isready" -h localhost -p "$PORTNO" -U "$PGSQL_SUPERUSER" -d postgres
            local status=$?

            if [ $status -eq 0 ]; then
                echo "PostgreSQL is ready!"
                return 0
            fi
            echo "Waiting for PostgreSQL to start (attempt $attempt/$max_attempts)..."
            sleep 2
            attempt=$((attempt + 1))
        done

        echo "PostgreSQL failed to start after $max_attempts attempts"
        return 1
    }

    check_orioledb_ready() {
        local max_attempts=30
        local attempt=1

        while [ $attempt -le $max_attempts ]; do
            if "''${PSQLBIN}/psql" -v ON_ERROR_STOP=1 -U "$PGSQL_SUPERUSER" -p "$PORTNO" -h localhost -d postgres -c "SELECT * FROM pg_am WHERE amname = 'orioledb'" | grep -q orioledb; then
                echo "Orioledb extension is ready!"
                return 0
            fi
            echo "Waiting for orioledb to be ready (attempt $attempt/$max_attempts)..."
            sleep 2
            attempt=$((attempt + 1))
        done

        echo "Orioledb failed to initialize after $max_attempts attempts"
        return 1
    }

    perform_dump() {
        local max_attempts=3
        local attempt=1

        while [ $attempt -le $max_attempts ]; do
            echo "Attempting pg_dump (attempt $attempt/$max_attempts)"

            # Build the dump command
            local dump_cmd="''${PSQLBIN}/pg_dump -h localhost -p $PORTNO -U $PGSQL_SUPERUSER -d postgres --schema-only --no-owner --no-privileges"

            # Only use --restrict-key for standard PostgreSQL 15 and 17 versions
            # OrioleDB doesn't support this flag yet
            if [ "$PSQL_VERSION" = "15" ] || [ "$PSQL_VERSION" = "17" ] || [ "$PSQL_VERSION" = "orioledb-17" ]; then
                # Use a fixed restrict key for reproducible test dumps
                # This is safe in testing contexts but should not be used in production
                dump_cmd="$dump_cmd --restrict-key=SupabaseTestDumpKey123"
                echo "Using --restrict-key for reproducible dumps (PostgreSQL $PSQL_VERSION)"
            else
                echo "Skipping --restrict-key (version: $PSQL_VERSION)"
            fi

            if $dump_cmd > "./db/schema.sql"; then
                return 0
            fi

            echo "Dump attempt $attempt failed, waiting before retry..."
            sleep 5
            attempt=$((attempt + 1))
        done

        echo "All dump attempts failed"
        return 1
    }

    migrate_version() {
        echo "PSQL_VERSION: $PSQL_VERSION"
        #pkill -f "postgres" || true  # Ensure PostgreSQL is stopped before starting
        PSQLBIN=$(nix build --no-link "$FLAKE_URL#psql_$PSQL_VERSION/bin" --json | jq -r '.[].outputs.out + "/bin"')
        echo "Using PostgreSQL version $PSQL_VERSION from $PSQLBIN"

        # Start PostgreSQL
        start_postgres
        echo "Waiting for PostgreSQL to be ready..."

        # Wait for PostgreSQL to be ready to accept connections
        if ! wait_for_postgres; then
            echo "Failed to connect to PostgreSQL server"
            cleanup
            exit 1
        fi

        if [ "$PSQL_VERSION" = "orioledb-17" ]; then
            if ! check_orioledb_ready; then
                echo "Failed to initialize orioledb extension"
                exit 1
            fi
        fi

        echo "PostgreSQL server is ready"

        # Configure PostgreSQL roles and permissions
        if ! "''${PSQLBIN}/psql" -v ON_ERROR_STOP=1 --no-password --no-psqlrc -U "$PGSQL_SUPERUSER" -p "$PORTNO" -h localhost -d postgres <<-EOSQL
    create role postgres superuser login password '$PGPASSWORD';
    alter database postgres owner to postgres;
    EOSQL
        then
            echo "Failed to configure PostgreSQL roles and permissions"
            exit 1
        fi
        "''${PSQLBIN}/psql" -v ON_ERROR_STOP=1 --no-password --no-psqlrc -U postgres -p "$PORTNO" -h localhost -d postgres -f "$PGBOUNCER_AUTH_SCHEMA_SQL"
        "''${PSQLBIN}/psql" -v ON_ERROR_STOP=1 --no-password --no-psqlrc -U postgres -p "$PORTNO" -h localhost -d postgres -f "$STAT_EXTENSION_SQL"

        # Set db url to run dbmate
        export DATABASE_URL="postgres://$PGSQL_USER:$PGPASSWORD@localhost:$PORTNO/postgres?sslmode=disable"
        # Export path so dbmate can find correct psql and pg_dump
        export PATH="$PSQLBIN:$PATH"
        # Run init scripts
        if ! dbmate --migrations-dir "$MIGRATIONS_DIR/init-scripts" up; then
            echo "Error: Initial migration failed"
            exit 1
        fi

        # Password update command
        if ! "''${PSQLBIN}/psql" -v ON_ERROR_STOP=1 --no-password --no-psqlrc -U postgres -p "$PORTNO" -h localhost -c "ALTER USER supabase_admin WITH PASSWORD '$PGPASSWORD'"; then
            echo "Error: Failed to update supabase_admin password"
            exit 1
        fi

        # Set up database URL
        export DATABASE_URL="postgres://$PGSQL_SUPERUSER:$PGPASSWORD@localhost:$PORTNO/postgres?sslmode=disable"
        # Run migrations
        if ! dbmate --migrations-dir "$MIGRATIONS_DIR/migrations" up; then
            echo "Error: Final migration failed"
            exit 1
        fi

        echo "Running dbmate dump with $PSQLBIN"
        perform_dump

        echo "CURRENT_SYSTEM: $CURRENT_SYSTEM"
        if [ -f "./db/schema.sql" ]; then
            cp "./db/schema.sql" "./migrations/schema-$PSQL_VERSION.sql"
            echo "Schema file moved to ./migrations/schema-$PSQL_VERSION.sql"
            echo "PSQLBIN is $PSQLBIN"
        else
            echo "Warning: schema.sql file not found in ./db directory"
            exit 1
        fi

        # If we get here, all commands succeeded
        echo "PostgreSQL migration completed successfully"
        echo "Check migrations are idempotent"
        for sql in ./migrations/db/migrations/*.sql; do
            echo "$0: running $sql"
            "''${PSQLBIN}/psql" -v ON_ERROR_STOP=1 --no-password --no-psqlrc -U "$PGSQL_SUPERUSER" -p "$PORTNO" -h localhost -d postgres -f "$sql" || {
                echo "Failed to execute $sql"
                exit 1
            }
        done
    }

    if [ "$PSQL_VERSION" == "all" ]; then
        VERSIONS=$(yq '.postgres_major[]' "$ANSIBLE_VARS" | tr -d '"')
        echo "$VERSIONS" | while read -r version; do
            PSQL_VERSION="$version"
            echo "Migrating to PostgreSQL version $PSQL_VERSION"
            migrate_version
            cleanup
        done
    else
        echo "Migrating to PostgreSQL version $PSQL_VERSION"
        migrate_version
        cleanup
    fi
  '';
}
