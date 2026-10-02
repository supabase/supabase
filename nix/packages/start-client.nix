{
  writeShellApplication,
  psql_15,
  psql_17,
  psql_orioledb-17,
  defaults,
}:
writeShellApplication {
  name = "start-postgres-client";
  runtimeInputs = [ ];
  text = ''
    # Default values
    PSQL_VERSION="15"
    PORTNO="${defaults.port}"
    PSQL_USER="postgres"

    # Function to display help
    print_help() {
        echo "Usage: nix run .#start-client -- [options]"
        echo
        echo "Options:"
        echo "  -v, --version [15|17|orioledb-17]  Specify the PostgreSQL version to use (default: 15)"
        echo "  -u, --user USER                     Specify the user/role to use (default: postgres)"
        echo "  -p, --port PORT                     Specify the port (default: ${defaults.port})"
        echo "  -h, --help                          Show this help message"
        echo
        echo "Description:"
        echo "  Starts an interactive 'psql' session connecting to a Postgres database started with the"
        echo "  'nix run .#start-server' command."
        echo
        echo "Examples:"
        echo "  nix run .#start-client"
        echo "  nix run .#start-client -- --version 15"
        echo "  nix run .#start-client -- --version 17 --port 5433"
        echo "  nix run .#start-client -- --version 17 --user supabase_admin"
    }

    # Parse arguments
    while [[ "$#" -gt 0 ]]; do
        case "$1" in
            -v|--version)
                if [[ -n "$2" && ! "$2" =~ ^- ]]; then
                    PSQL_VERSION="$2"
                    shift 2
                else
                    echo "Error: --version requires an argument (15, 17, or orioledb-17)"
                    exit 1
                fi
                ;;
            -u|--user)
                if [[ -n "$2" && ! "$2" =~ ^- ]]; then
                    PSQL_USER="$2"
                    shift 2
                else
                    echo "Error: --user requires an argument"
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

    # Determine PostgreSQL version
    if [ "$PSQL_VERSION" == "15" ]; then
        echo "Starting client for PSQL 15"
        BINDIR="${psql_15}"
    elif [ "$PSQL_VERSION" == "17" ]; then
        echo "Starting client for PSQL 17"
        BINDIR="${psql_17}"
    elif [ "$PSQL_VERSION" == "orioledb-17" ]; then
        echo "Starting client for PSQL ORIOLEDB 17"
        BINDIR="${psql_orioledb-17}"
    else
        echo "Please provide a valid Postgres version (15, 17, or orioledb-17)"
        exit 1
    fi

    # Set up environment for psql
    export PATH="$BINDIR/bin:$PATH"
    export POSTGRES_DB=postgres
    export POSTGRES_HOST=localhost

    # Start interactive psql session
    exec psql -U "$PSQL_USER" -p "$PORTNO" -h localhost postgres
  '';
}
