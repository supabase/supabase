#!/usr/bin/env bash
#
# Requires bash (not sh) for pipefail, which ensures failures in piped
# commands are caught during the upgrade.
#
# Upgrade self-hosted Supabase Postgres from 15 to 17.
#
# Uses Supabase's pg_upgrade scripts (initiate.sh + complete.sh) inside a
# temporary PG15 container, then swaps data directories and starts Postgres 17.
#
# Usage:
#   cd docker/
#   bash utils/upgrade-pg17.sh          # Interactive (prompts for confirmation)
#   bash utils/upgrade-pg17.sh --yes    # Non-interactive (skip all prompts)
#
# Requirements:
#   - Docker with Docker Compose (docker compose, not docker-compose)
#   - Running Supabase self-hosted setup with Postgres 15
#   - At least 2x current database size + 5 GB free disk space
#
# Backup:
#   The original Postgres 15 data directory is preserved as
#   ./volumes/db/data.bak.pg15 during the upgrade. Do not delete it
#   until you have verified the upgrade was successful.
#
# Rollback (if the upgrade fails or you want to revert):
#   docker compose down
#   rm -rf ./volumes/db/data
#   mv ./volumes/db/data.bak.pg15 ./volumes/db/data
#   docker compose up -d
#

set -euo pipefail

AUTO_CONFIRM=false
for arg in "$@"; do
    case "$arg" in
        --yes|-y) AUTO_CONFIRM=true ;;
    esac
done

# --- Configuration ----------------------------------------------------------

PG17_IMAGE="supabase/postgres:17.6.1.084"
DB_CONTAINER="supabase-db"
UPGRADE_CONTAINER="supabase-pg-upgrade"
COMPLETE_CONTAINER="supabase-pg-complete"

DATA_DIR="./volumes/db/data"
BACKUP_DIR="./volumes/db/data.bak.pg15"
TARBALL_CACHE="./volumes/db/pg17_upgrade_bin.tar.gz"
# initiate.sh writes pg_upgrade output here: pgdata/, conf/, sql/
MIGRATION_DIR="./volumes/db/data_migration"

# --- Helpers ----------------------------------------------------------------

die() { printf 'Error: %s\n' "$*" >&2; exit 1; }
info() { printf '\n==> %s\n' "$*"; }
warn() { printf 'Warning: %s\n' "$*" >&2; }

# Temp dir on host for tarball + scripts (mounted into containers)
staging_dir=""
pg_password=""
current_image=""
drop_extensions=""

# Remove leftover containers and staging dir on exit.
# Uses an alpine container for rm because the tarball build runs as root
# inside Docker - the resulting files are root-owned and can't be deleted
# by the host user on macOS.
cleanup() {
    docker rm -f "$UPGRADE_CONTAINER" 2>/dev/null || true
    docker rm -f "$COMPLETE_CONTAINER" 2>/dev/null || true
    if [ -n "$staging_dir" ] && [ -d "$staging_dir" ]; then
        docker run --rm -v "$staging_dir:/cleanup" alpine rm -rf /cleanup 2>/dev/null || true
        rm -rf "$staging_dir" 2>/dev/null || true
    fi
}
trap cleanup EXIT

confirm() {
    if [ "$AUTO_CONFIRM" = true ]; then return 0; fi
    if ! test -t 0; then
        die "This script must be run interactively, or use --yes to skip prompts."
    fi
    printf '%s (y/N) ' "$1"
    read -r reply
    case "$reply" in
        [Yy]*) return 0 ;;
        *) echo "Aborted."; exit 0 ;;
    esac
}

run_sql_on() {
    local container=$1; shift
    docker exec -i \
        -e PGPASSWORD="$pg_password" \
        "$container" \
        psql -h localhost -U supabase_admin -d postgres -v ON_ERROR_STOP=1 "$@"
}

wait_for_healthy() {
    local container=$1 retries=30
    while [ $retries -gt 0 ]; do
        if docker exec "$container" pg_isready -U postgres -h localhost >/dev/null 2>&1; then
            return 0
        fi
        retries=$((retries - 1))
        sleep 1
    done
    die "Postgres in '$container' did not become ready in 30 seconds."
}

# --- Pre-flight checks -----------------------------------------------------

preflight() {
    info "Running pre-flight checks"

    docker compose version >/dev/null 2>&1 || die "Docker Compose V2 not found."
    [ -f docker-compose.yml ] || die "Run this script from the docker/ directory."
    [ -f .env ] || die "Missing .env file."

    pg_password=$(grep '^POSTGRES_PASSWORD=' .env | cut -d '=' -f 2-)
    [ -n "$pg_password" ] || die "POSTGRES_PASSWORD not set in .env."

    docker inspect "$DB_CONTAINER" >/dev/null 2>&1 \
        || die "Container '$DB_CONTAINER' not found. Is Supabase running?"

    current_image=$(docker inspect "$DB_CONTAINER" --format '{{.Config.Image}}')
    case "$current_image" in
        supabase/postgres:15.*|supabase.postgres:15.*) ;;
        supabase/postgres:17.*|supabase.postgres:17.*) die "Already running Postgres 17 ($current_image)." ;;
        *) die "Unexpected database image: $current_image" ;;
    esac

    local status
    status=$(docker inspect "$DB_CONTAINER" --format '{{.State.Status}}')
    [ "$status" = "running" ] || die "'$DB_CONTAINER' is not running (status: $status)."
    [ -d "$DATA_DIR" ] || die "Data directory not found: $DATA_DIR"

    if [ -d "$BACKUP_DIR" ]; then
        warn "Backup directory already exists: $BACKUP_DIR"
        warn "This may be from a previous upgrade attempt."
        confirm "Remove it and continue?"
        rm -rf "$BACKUP_DIR"
    fi
    if [ -d "$MIGRATION_DIR" ]; then
        warn "Migration directory already exists: $MIGRATION_DIR"
        confirm "Remove it and continue?"
        rm -rf "$MIGRATION_DIR"
    fi

    # Disk space
    local data_size_kb data_size_mb avail_kb avail_mb needed_mb
    data_size_kb=$(du -sk "$DATA_DIR" 2>/dev/null | cut -f1)
    data_size_mb=$((data_size_kb / 1024))
    avail_kb=$(df -k "$(dirname "$DATA_DIR")" | awk 'NR==2{print $4}')
    avail_mb=$((avail_kb / 1024))
    needed_mb=$((data_size_mb * 2 + 5000))
    echo "  Data size:       ${data_size_mb} MB"
    echo "  Available space: ${avail_mb} MB"
    echo "  Estimated need:  ${needed_mb} MB"
    if [ "$avail_mb" -lt "$needed_mb" ]; then
        warn "Disk space may be insufficient."
        warn "pg_upgrade copies data; need ~2x data size + ~5 GB for the upgrade tarball."
        confirm "Continue anyway?"
    fi

    # Incompatible extensions
    info "Checking for incompatible extensions"
    local incompatible
    incompatible=$(run_sql_on "$DB_CONTAINER" -A -t -c "
        SELECT string_agg(extname, ', ')
        FROM pg_extension
        WHERE extname IN ('timescaledb', 'plv8', 'plcoffee', 'plls');
    " 2>/dev/null | tr -d '[:space:]') || true

    if [ -n "$incompatible" ]; then
        warn "Incompatible extensions found: $incompatible"
        warn "These do not exist in Postgres 17 and must be dropped before upgrading."
        warn "If you proceed, they will be dropped automatically."
        warn "The original data is preserved as a backup so you can roll back."
        confirm "Drop these extensions and continue with the upgrade?"
        drop_extensions="$incompatible"
    fi

    echo ""
    echo "This script will:"
    echo "  1. Pull the Postgres 17 image"
    echo "  2. Build an upgrade tarball from the PG17 image (~2 GB compressed, temporary)"
    echo "  3. Stop all Supabase services"
    echo "  4. Run pg_upgrade (Postgres 15 -> 17) via initiate.sh"
    echo "  5. Apply post-upgrade patches via complete.sh"
    echo "  6. Start Supabase with Postgres 17"
    echo "  7. Apply additional role migrations"
    echo ""
    echo "  Current image:    $current_image"
    echo "  Target image:     $PG17_IMAGE"
    echo "  Data directory:   $DATA_DIR"
    echo "  Backup location:  $BACKUP_DIR"
    echo ""
    confirm "Proceed with the upgrade?"
}

# --- Step 1: Pull Postgres 17 image ----------------------------------------

pull_image() {
    info "Pulling Postgres 17 image"
    docker pull "$PG17_IMAGE"
}

# --- Step 2: Build upgrade tarball -----------------------------------------
#
# Extracts PG17 binaries, libraries, share data, and upgrade scripts from
# the PG17 Docker image into a tarball that initiate.sh can consume.
#
# The tarball uses the "non-nix" layout (17/bin, 17/lib, 17/share - no
# nix_flake_version file), so initiate.sh sets LD_LIBRARY_PATH to find
# the bundled libraries.

build_tarball() {
    staging_dir=$(mktemp -d "${TMPDIR:-/tmp}/supabase-pg17-upgrade.XXXXXX")
    echo "  Staging directory: $staging_dir"

    if [ -f "$TARBALL_CACHE" ]; then
        info "Using cached upgrade tarball: $TARBALL_CACHE"
        cp "$TARBALL_CACHE" "$staging_dir/pg_upgrade_bin.tar.gz"
        # Still need the upgrade scripts (not in tarball)
        docker run --rm -v "$staging_dir:/export" "$PG17_IMAGE" bash -c '
            mkdir -p /export/scripts
            cp /nixpg/ansible/files/admin_api_scripts/pg_upgrade_scripts/*.sh /export/scripts/
        '
        return
    fi

    info "Building upgrade tarball from Postgres 17 image (first run)"
    docker run --rm \
        -v "$staging_dir:/export" \
        "$PG17_IMAGE" \
        bash -c '
            set -euo pipefail
            mkdir -p /export/17/bin /export/17/lib /export/17/share /export/scripts

            echo "  Copying binaries..."
            # Binaries in the nix profile are either ELF binaries or shell
            # wrappers that exec a .xxx-wrapped ELF from the nix store.
            # Extract the actual ELF binaries so they work outside nix.
            BIN_DIR=$(dirname $(readlink -f /usr/lib/postgresql/bin/postgres))
            for f in "$BIN_DIR"/*; do
                name=$(basename "$f")
                # Skip nix wrapper-internal files
                case "$name" in .*-wrapped) continue ;; esac
                # Check ELF magic bytes (0x7f ELF)
                magic=$(dd if="$f" bs=4 count=1 2>/dev/null | od -A n -t x1 | tr -d " ")
                if [ "$magic" = "7f454c46" ]; then
                    cp "$f" /export/17/bin/"$name"
                else
                    # Shell wrapper - extract the real .xxx-wrapped ELF path
                    wrapped=$(grep -o "/nix/store/[^ \"]*-wrapped" "$f" 2>/dev/null | head -1 || true)
                    if [ -n "$wrapped" ] && [ -f "$wrapped" ]; then
                        cp "$wrapped" /export/17/bin/"$name"
                    else
                        cp "$f" /export/17/bin/"$name"
                    fi
                fi
            done

            echo "  Copying libraries..."
            PKGLIBDIR=$(pg_config --pkglibdir)
            LIBDIR=$(pg_config --libdir)
            cp -L "$PKGLIBDIR"/*.so /export/17/lib/ 2>/dev/null || true
            cp -L "$LIBDIR"/*.so* /export/17/lib/ 2>/dev/null || true
            cp -L /nix/var/nix/profiles/default/lib/*.so* /export/17/lib/ 2>/dev/null || true

            echo "  Copying share data..."
            # Nix-built binaries resolve share dir relative to their location:
            #   <bindir>/../share/postgresql/
            # so we need share/postgresql/ not just share/
            mkdir -p /export/17/share/postgresql
            cp -rL /usr/share/postgresql/* /export/17/share/postgresql/ 2>/dev/null || true

            # initiate.sh copies .control/.sql from PGLIBNEW to PGSHARENEW/extension/
            echo "  Copying extension definitions to lib..."
            SHAREDIR=$(pg_config --sharedir)
            cp "$SHAREDIR"/extension/*.control /export/17/lib/ 2>/dev/null || true
            cp "$SHAREDIR"/extension/*.sql /export/17/lib/ 2>/dev/null || true

            echo "  Extracting upgrade scripts..."
            cp /nixpg/ansible/files/admin_api_scripts/pg_upgrade_scripts/*.sh /export/scripts/

            echo "  Creating tarball..."
            cd /export && tar czf pg_upgrade_bin.tar.gz 17/

            echo "  Tarball: $(du -sh /export/pg_upgrade_bin.tar.gz | cut -f1)"
        '

    # Cache for next run
    cp "$staging_dir/pg_upgrade_bin.tar.gz" "$TARBALL_CACHE"
    info "Tarball cached at $TARBALL_CACHE"
}

# --- Step 3: Drop incompatible extensions ----------------------------------

drop_incompatible_extensions() {
    if [ -z "$drop_extensions" ]; then
        return
    fi
    info "Dropping incompatible extensions"

    local ext
    echo "$drop_extensions" | tr ',' '\n' | while read -r ext; do
        ext=$(echo "$ext" | tr -d '[:space:]')
        [ -z "$ext" ] && continue
        echo "  DROP EXTENSION $ext CASCADE"
        run_sql_on "$DB_CONTAINER" -c "DROP EXTENSION IF EXISTS \"$ext\" CASCADE;"
    done
}

# --- Step 4: Stop services and back up -------------------------------------

stop_and_backup() {
    info "Backing up pgsodium root key"
    local db_config_vol
    db_config_vol=$(docker volume ls --filter "name=db-config" --format '{{.Name}}' | head -1)
    if [ -n "$db_config_vol" ]; then
        docker run --rm -v "${db_config_vol}:/src:ro" -v "$staging_dir:/dst" \
            alpine sh -c 'cp /src/pgsodium_root.key /dst/pgsodium_root.key.bak 2>/dev/null || echo "  (no pgsodium key found)"'
        if [ -f "$staging_dir/pgsodium_root.key.bak" ]; then
            echo "  Saved to: $staging_dir/pgsodium_root.key.bak"
        fi
    fi

    info "Stopping all Supabase services"
    docker compose down

    echo "  Original data will be preserved as: $BACKUP_DIR"
}

# --- Step 5: Run pg_upgrade via initiate.sh + complete.sh ------------------
#
# Host directories are mounted at non-standard paths (/mnt/host-*) with
# symlinks at the paths the upgrade scripts expect. This lets complete.sh's
# CI wrapper (which does rm/mv/ln on /var/lib/postgresql/data and
# /data_migration) operate on symlinks rather than bind mounts.

run_upgrade() {
    local db_config_vol abs_data_dir abs_migration_dir

    db_config_vol=$(docker volume ls --filter "name=db-config" --format '{{.Name}}' | head -1)
    [ -n "$db_config_vol" ] || die "Could not find db-config volume."

    mkdir -p "$MIGRATION_DIR"
    abs_data_dir=$(cd "$DATA_DIR" && pwd)
    abs_migration_dir=$(cd "$MIGRATION_DIR" && pwd)

    info "Starting upgrade container"
    docker run -d --name "$UPGRADE_CONTAINER" \
        --entrypoint sleep \
        -v "${abs_data_dir}:/mnt/host-pgdata" \
        -v "${abs_migration_dir}:/mnt/host-migration" \
        -v "${db_config_vol}:/etc/postgresql-custom" \
        -v "${staging_dir}:/tmp/staging:ro" \
        -e PGPASSWORD="$pg_password" \
        "$current_image" \
        infinity

    info "Preparing upgrade environment"
    docker exec "$UPGRADE_CONTAINER" bash -c '
        # Symlink bind mounts to the paths the upgrade scripts expect
        rm -rf /var/lib/postgresql/data
        ln -s /mnt/host-pgdata /var/lib/postgresql/data
        ln -s /mnt/host-migration /data_migration

        mkdir -p /tmp/persistent /tmp/upgrade /tmp/pg_upgrade
        cp /tmp/staging/pg_upgrade_bin.tar.gz /tmp/persistent/
        cp /tmp/staging/scripts/*.sh /tmp/upgrade/
        chmod +x /tmp/upgrade/*.sh

        # Patch CI_start_postgres to use "restart" instead of "start" so it
        # is idempotent (initiate.sh starts postgres for top-level queries,
        # then handle_extensions calls CI_start_postgres again)
        sed -i "s/pg_ctl start -o/pg_ctl restart -o/g" /tmp/upgrade/common.sh

        # Patch PGSHARENEW to match nix binary expectations (share/postgresql/)
        sed -i "s|PGSHARENEW=\"\$PG_UPGRADE_BIN_DIR/share\"|PGSHARENEW=\"\$PG_UPGRADE_BIN_DIR/share/postgresql\"|" /tmp/upgrade/initiate.sh
    '

    info "Starting Postgres 15 in upgrade container"
    docker exec "$UPGRADE_CONTAINER" bash -c '
        su postgres -c "pg_ctl start -o \"-c config_file=/etc/postgresql/postgresql.conf\" -l /tmp/postgres.log"
    '
    wait_for_healthy "$UPGRADE_CONTAINER"

    # Env vars for the unwrapped nix ELF binaries in the tarball:
    #   LD_LIBRARY_PATH  - find libpq, libssl, etc. (RUNPATH points to absent nix store paths)
    #   NIX_PGLIBDIR     - postgres uses this to find extension .so files
    #
    # initiate.sh expects the PG17 binaries tarball at /tmp/persistent/pg_upgrade_bin.tar.gz
    # (hardcoded path - copied there during container setup above).
    #
    # initiate.sh supports upgrading to different major versions (15, 16, 17). The $1 argument
    # becomes PGVERSION which determines:
    #  - Where to find binaries: /tmp/pg_upgrade_bin/$PGVERSION/
    #  - What initdb flags to use (PG16+ gets --locale-provider=icu)
    #  - Which extensions to strip from shared_preload_libraries (e.g., timescaledb
    #    only stripped for non-PG15 targets)
    #  - What config settings to remove (db_user_namespace dropped in PG16+)

    info "Running initiate.sh (pg_upgrade: Postgres 15 -> 17)"
    echo "  This may take several minutes depending on database size..."
    echo ""
    docker exec \
        -e IS_CI=true \
        -e PG_MAJOR_VERSION=17 \
        -e PGPASSWORD="$pg_password" \
        -e LD_LIBRARY_PATH=/tmp/pg_upgrade_bin/17/lib \
        -e NIX_PGLIBDIR=/tmp/pg_upgrade_bin/17/lib \
        "$UPGRADE_CONTAINER" \
        /tmp/upgrade/initiate.sh 17

    info "initiate.sh completed successfully"
    docker rm -f "$UPGRADE_CONTAINER" >/dev/null 2>&1 || true
}

# --- Step 6: Run complete.sh in a native PG17 container -------------------
#
# complete.sh applies post-upgrade patches (pg_net grants, vault re-encryption,
# pg_cron, predefined roles, vacuumdb, etc.). We run it in a PG17 container
# where the binaries are native - no nix extraction or LD_LIBRARY_PATH needed.

run_complete() {
    local db_config_vol abs_migration_dir

    db_config_vol=$(docker volume ls --filter "name=db-config" --format '{{.Name}}' | head -1)
    [ -n "$db_config_vol" ] || die "Could not find db-config volume."
    abs_migration_dir=$(cd "$MIGRATION_DIR" && pwd)

    info "Starting PG17 container for complete.sh"
    docker run -d --name "$COMPLETE_CONTAINER" \
        --entrypoint sleep \
        -v "${abs_migration_dir}:/mnt/host-migration" \
        -v "${db_config_vol}:/etc/postgresql-custom" \
        -v "${staging_dir}:/tmp/staging:ro" \
        -e PGPASSWORD="$pg_password" \
        "$PG17_IMAGE" \
        infinity

    info "Preparing complete.sh environment"
    docker exec "$COMPLETE_CONTAINER" bash -c '
        # Symlink bind mount so complete.sh CI wrapper can mv/rm/ln
        ln -s /mnt/host-migration /data_migration

        # Remove the image default data dir (complete.sh creates a symlink here)
        rm -rf /var/lib/postgresql/data

        # Fix ownership on db-config volume (PG15 uid 105 → PG17 uid 101)
        chown -R postgres:postgres /etc/postgresql-custom/

        mkdir -p /tmp/upgrade

        # Copy upgrade scripts
        cp /tmp/staging/scripts/*.sh /tmp/upgrade/
        chmod +x /tmp/upgrade/*.sh

        # Patch --new-bin to use native bindir (we are in a PG17 container,
        # no need for /tmp/pg_upgrade_bin/ paths)
        sed -i "s|BINDIR=\"/tmp/pg_upgrade_bin/\$PG_MAJOR_VERSION/bin\"|BINDIR=\$(pg_config --bindir)|g" /tmp/upgrade/common.sh
    '

    info "Running complete.sh (post-upgrade patches, vacuum analyze)"
    docker exec \
        -e IS_CI=true \
        -e PG_MAJOR_VERSION=17 \
        -e PGPASSWORD="$pg_password" \
        "$COMPLETE_CONTAINER" \
        /tmp/upgrade/complete.sh || true

    # complete.sh's ERR trap exits with 0 in some cases; check status file
    local status
    status=$(docker exec "$COMPLETE_CONTAINER" cat /tmp/pg-upgrade-status 2>/dev/null || echo "unknown")
    if [ "$status" != "complete" ]; then
        warn "complete.sh failed. Postgres log:"
        docker exec "$COMPLETE_CONTAINER" cat /tmp/postgres.log 2>/dev/null || true
        docker rm -f "$COMPLETE_CONTAINER" >/dev/null 2>&1 || true
        die "complete.sh failed (status: $status)"
    fi

    info "complete.sh finished successfully"
    docker rm -f "$COMPLETE_CONTAINER" >/dev/null 2>&1 || true
}

# --- Step 7: Swap data directories -----------------------------------------

swap_data() {
    info "Swapping data directories"

    echo "  $DATA_DIR -> $BACKUP_DIR"
    mv "$DATA_DIR" "$BACKUP_DIR"

    echo "  $MIGRATION_DIR/pgdata -> $DATA_DIR"
    mv "$MIGRATION_DIR/pgdata" "$DATA_DIR"
}

# --- Step 8: Start Postgres 17 ---------------------------------------------

start_pg17() {
    info "Starting Supabase with Postgres 17"

    # complete.sh already handled:
    #   - copy_configs (wrote to db-config volume, created conf.d)
    #   - chown on data directory (PG17 uid)
    #   - all SQL patches, vacuumdb

    docker compose -f docker-compose.yml -f docker-compose.pg17.yml up -d

    echo "  Waiting for Postgres 17 to be ready..."
    local retries=60
    while [ $retries -gt 0 ]; do
        if docker exec "$DB_CONTAINER" pg_isready -U postgres -h localhost >/dev/null 2>&1; then
            break
        fi
        retries=$((retries - 1))
        sleep 2
    done
    [ $retries -gt 0 ] || die "Postgres 17 did not start within 120 seconds."

    local new_version
    new_version=$(run_sql_on "$DB_CONTAINER" -A -t -c "SHOW server_version;" 2>/dev/null | head -1)
    echo "  Postgres version: $new_version"
    case "$new_version" in
        17.*) ;;
        *) die "Expected Postgres 17.x, got: $new_version" ;;
    esac
}

# --- Step 9: Apply migrations not covered by complete.sh -------------------
#
# These PG17 migrations run on fresh installs via initdb but not after
# pg_upgrade (init scripts don't rerun when PG_VERSION already exists).
# complete.sh doesn't cover them either.
#
# Source: postgres/migrations/db/migrations/
#   - 20250710151649_supabase_read_only_user_default_transaction_read_only.sql
#   - 20251001204436_predefined_role_grants.sql (supabase_etl_admin + pg_monitor)
#   - 20251105172723_grant_pg_reload_conf_to_postgres.sql
#   - 20251121132723_correct_search_path_pgbouncer.sql

apply_role_migrations() {
    info "Applying Postgres 17 migrations"

    # Run the migration files directly from the PG17 container image.
    # They're idempotent (IF EXISTS / IF NOT EXISTS guards).
    local migration_dir="/docker-entrypoint-initdb.d/migrations"
    local migrations="
        20250710151649_supabase_read_only_user_default_transaction_read_only.sql
        20251001204436_predefined_role_grants.sql
        20251105172723_grant_pg_reload_conf_to_postgres.sql
        20251121132723_correct_search_path_pgbouncer.sql
    "

    for m in $migrations; do
        echo "  Running: $m"
        docker exec -i \
            -e PGPASSWORD="$pg_password" \
            "$DB_CONTAINER" \
            psql -h localhost -U supabase_admin -d postgres \
                -f "${migration_dir}/${m}" || warn "  $m failed (non-fatal)"
    done
}

# --- Step 10: Verify ------------------------------------------------------

verify() {
    info "Verification"

    local version
    version=$(run_sql_on "$DB_CONTAINER" -A -t -c "SELECT version();" 2>/dev/null | head -1)
    echo "  $version"

    echo ""
    echo "  Extensions:"
    run_sql_on "$DB_CONTAINER" -c \
        "SELECT extname, extversion FROM pg_extension ORDER BY extname;"

    echo ""
    info "Upgrade complete!"
    echo ""
    echo "  To use Postgres 17 going forward, always include the override:"
    echo "    docker compose -f docker-compose.yml -f docker-compose.pg17.yml up -d"
    echo ""
    echo "  Postgres 15 backup: $BACKUP_DIR"
    echo "  Once satisfied, you can reclaim space:"
    echo "    rm -rf $BACKUP_DIR $MIGRATION_DIR $TARBALL_CACHE"
    echo ""
    echo "  Rollback (if needed):"
    echo "    docker compose down"
    echo "    rm -rf $DATA_DIR"
    echo "    mv $BACKUP_DIR $DATA_DIR"
    echo "    docker compose up -d"
}

# --- Main -------------------------------------------------------------------

main() {
    echo ""
    echo "Supabase Self-Hosted: Postgres 15 -> 17 Upgrade"
    echo "================================================"

    preflight
    pull_image
    build_tarball
    drop_incompatible_extensions
    stop_and_backup
    run_upgrade
    run_complete
    swap_data
    start_pg17
    apply_role_migrations
    verify
}

main "$@"
