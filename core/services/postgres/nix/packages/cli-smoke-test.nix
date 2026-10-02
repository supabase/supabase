{
  writeShellApplication,
  coreutils,
  gnused,
  supabase-cli,
  yq,
  postgresql_15,
}:
writeShellApplication {
  name = "cli-smoke-test";
  runtimeInputs = [
    coreutils
    gnused
    supabase-cli
    yq
    postgresql_15
  ];
  text = ''
    # CLI Smoke Test - Tests Supabase CLI with locally built Docker images
    #
    # Usage:
    #   nix run .#cli-smoke-test -- 17
    #   nix run .#cli-smoke-test -- --no-build 15
    #   nix run .#cli-smoke-test -- --debug 17  # Full debug output (local only)

    set -euo pipefail

    REPO_ROOT="$(pwd)"
    PG_VERSION=""
    SKIP_BUILD=false
    DEBUG_MODE=false
    WORK_DIR=""

    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    NC='\033[0m'

    log_info() { echo -e "''${GREEN}[INFO]''${NC} $1"; }
    log_warn() { echo -e "''${YELLOW}[WARN]''${NC} $1"; }
    log_error() { echo -e "''${RED}[ERROR]''${NC} $1"; }

    print_help() {
        cat << 'EOF'
    Usage: nix run .#cli-smoke-test -- [OPTIONS] PG_VERSION

    Run Supabase CLI smoke tests with a locally built PostgreSQL Docker image.

    Arguments:
      PG_VERSION    PostgreSQL version to test (15 or 17)

    Options:
      -h, --help    Show this help message
      --no-build    Skip building the image (use existing supabase/postgres:<version>)
      --debug       Enable debug output (includes credentials - local use only!)

    Examples:
      nix run .#cli-smoke-test -- 17
      nix run .#cli-smoke-test -- 15
      nix run .#cli-smoke-test -- --no-build 17
      nix run .#cli-smoke-test -- --debug 17
    EOF
    }

    cleanup() {
        local exit_code=$?
        log_info "Cleaning up..."
        supabase stop --no-backup 2>/dev/null || true
        if [[ -n "$WORK_DIR" ]] && [[ -d "$WORK_DIR" ]]; then
            rm -rf "$WORK_DIR"
        fi
        exit $exit_code
    }

    trap cleanup EXIT

    main() {
        while [[ $# -gt 0 ]]; do
            case "$1" in
                -h|--help) print_help; exit 0 ;;
                --no-build) SKIP_BUILD=true; shift ;;
                --debug) DEBUG_MODE=true; shift ;;
                -*) log_error "Unknown option: $1"; print_help; exit 1 ;;
                *) PG_VERSION="$1"; shift ;;
            esac
        done

        if [[ -z "$PG_VERSION" ]]; then
            log_error "PostgreSQL version required (15 or 17)"
            print_help
            exit 1
        fi

        if [[ "$PG_VERSION" != "15" && "$PG_VERSION" != "17" ]]; then
            log_error "Invalid PostgreSQL version: $PG_VERSION (must be 15 or 17)"
            exit 1
        fi

        DOCKERFILE="Dockerfile-$PG_VERSION"
        # CLI uses public.ecr.aws/supabase/postgres as base image
        IMAGE_NAME="public.ecr.aws/supabase/postgres:$PG_VERSION"

        if [[ ! -f "$REPO_ROOT/$DOCKERFILE" ]]; then
            log_error "Dockerfile not found: $REPO_ROOT/$DOCKERFILE"
            log_error "Make sure you're running from the postgres repository root"
            exit 1
        fi

        if [[ ! -f "$REPO_ROOT/ansible/vars.yml" ]]; then
            log_error "ansible/vars.yml not found"
            log_error "Make sure you're running from the postgres repository root"
            exit 1
        fi

        log_info "CLI Smoke Test for PostgreSQL $PG_VERSION"

        # Build Docker image
        if [[ "$SKIP_BUILD" != "true" ]]; then
            log_info "Building Docker image from $DOCKERFILE..."
            if ! docker build -f "$REPO_ROOT/$DOCKERFILE" -t "$IMAGE_NAME" "$REPO_ROOT"; then
                log_error "Failed to build Docker image"
                exit 1
            fi
        else
            log_info "Skipping build (--no-build)"
            if ! docker image inspect "$IMAGE_NAME" &>/dev/null; then
                log_error "Image $IMAGE_NAME not found. Run without --no-build first."
                exit 1
            fi
        fi

        # Get component versions from ansible/vars.yml
        log_info "Reading component versions from ansible/vars.yml..."
        REST_VERSION=$(yq -r '.postgrest_release' "$REPO_ROOT/ansible/vars.yml")
        AUTH_VERSION=$(yq -r '.gotrue_release' "$REPO_ROOT/ansible/vars.yml")
        PG_RELEASE=$(yq -r ".postgres_release[\"postgres$PG_VERSION\"]" "$REPO_ROOT/ansible/vars.yml")

        log_info "  PostgREST: $REST_VERSION"
        log_info "  GoTrue: $AUTH_VERSION"
        log_info "  Postgres: $PG_RELEASE"

        # Create working directory
        WORK_DIR=$(mktemp -d)
        log_info "Working directory: $WORK_DIR"
        cd "$WORK_DIR"

        # Prepare Supabase CLI config
        mkdir -p supabase/.temp

        # Set component versions - CLI reads these to determine which images to use
        echo "v$REST_VERSION" > supabase/.temp/rest-version
        echo "v$AUTH_VERSION" > supabase/.temp/gotrue-version
        # Use major version so CLI constructs supabase/postgres:$PG_VERSION (our local build)
        echo "$PG_VERSION" > supabase/.temp/postgres-version

        cat > supabase/config.toml << EOF
    [db]
    major_version = $PG_VERSION
    EOF

        log_info "Starting Supabase..."
        if [[ "$DEBUG_MODE" == "true" ]]; then
            # Debug mode: full output including credentials (local use only)
            if ! supabase start --debug; then
                log_error "Failed to start Supabase"
                exit 1
            fi
        else
            # CI mode: redact credentials from output
            SUPABASE_OUTPUT=$(mktemp)
            SUPABASE_EXIT=0
            supabase start > "$SUPABASE_OUTPUT" 2>&1 || SUPABASE_EXIT=$?

            # Redact sensitive information before displaying
            sed -E \
                -e 's/(Secret[[:space:]]*\│[[:space:]]*)[^│]*/\1[REDACTED]/g' \
                -e 's/(Publishable[[:space:]]*\│[[:space:]]*)[^│]*/\1[REDACTED]/g' \
                -e 's/(Access Key[[:space:]]*\│[[:space:]]*)[^│]*/\1[REDACTED]/g' \
                -e 's/(Secret Key[[:space:]]*\│[[:space:]]*)[^│]*/\1[REDACTED]/g' \
                -e 's/postgres:postgres@/postgres:[REDACTED]@/g' \
                -e 's/sb_secret_[A-Za-z0-9_-]*/sb_secret_[REDACTED]/g' \
                -e 's/sb_publishable_[A-Za-z0-9_-]*/sb_publishable_[REDACTED]/g' \
                -e 's/"Data":"[^"]*"/"Data":"[REDACTED]"/g' \
                -e 's/"SecretKey":[0-9]*/"SecretKey":[REDACTED]/g' \
                -e 's/[a-f0-9]{32,64}/[REDACTED]/g' \
                "$SUPABASE_OUTPUT"

            rm -f "$SUPABASE_OUTPUT"

            if [[ $SUPABASE_EXIT -ne 0 ]]; then
                log_error "Failed to start Supabase"
                exit 1
            fi
        fi

        log_info "Verifying database connection..."
        if ! PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -c "SELECT version();" ; then
            log_error "Failed to connect to database"
            exit 1
        fi

        log_info "Running health checks..."
        PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres << 'EOSQL'
    -- Check extensions schema exists
    SELECT EXISTS(SELECT 1 FROM pg_namespace WHERE nspname = 'extensions');

    -- Check some key extensions
    SELECT extname, extversion FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto', 'pgjwt') ORDER BY extname;

    -- Basic table creation test
    CREATE TABLE IF NOT EXISTS smoke_test (id serial primary key, created_at timestamptz default now());
    INSERT INTO smoke_test DEFAULT VALUES;
    SELECT * FROM smoke_test;
    DROP TABLE smoke_test;
    EOSQL

        log_info "''${GREEN}CLI Smoke Test PASSED for PostgreSQL $PG_VERSION''${NC}"
    }

    main "$@"
  '';
}
