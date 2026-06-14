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
# Usage (must be run as root or with sudo):
#   cd docker/
#   sudo bash utils/upgrade-pg17.sh          # Interactive (prompts for confirmation)
#   sudo bash utils/upgrade-pg17.sh --yes    # Non-interactive (skip all prompts)
#
# Requirements:
#   - Docker with Docker Compose (docker compose, not docker-compose)
#   - Running Supabase self-hosted setup with Postgres 15
#   - At least 2x current database size + 5 GB free disk space
#
# Backup:
#   The original Postgres 15 data directory is preserved as
#   ./volumes/db/data.bak.pg15 during the upgrade.
#   DO NOT DELETE it until you have verified the upgrade was successful.
#
# Rollback (if the upgrade fails or you want to revert):
#   1. docker compose -f docker-compose.yml -f docker-compose.pg17.yml down
#   2. rm -rf ./volumes/db/data
#   3. mv ./volumes/db/data.bak.pg15 ./volumes/db/data
#   4. docker compose run --rm db chown -R postgres:postgres /etc/postgresql-custom/
#   5. docker compose up -d
#

# Ensure we're running under bash (not sh/zsh/dash).
# Check that $BASH ends with /bash (not /sh, /zsh, etc.).
case "${BASH:-}" in
    */bash) ;;
    *) echo "Error: This script requires bash. Run it with: sudo bash $0" >&2; exit 1 ;;
esac

set -euo pipefail

AUTO_CONFIRM=false
for arg in "$@"; do
    case "$arg" in
        --yes|-y) AUTO_CONFIRM=true ;;
    esac
done

# --- Configuration ----------------------------------------------------------

# Image used for the upgrade tarball + complete.sh container.
# Must share glibc with PG15 (the extracted ELF binaries run inside PG15).
PG17_UPGRADE_IMAGE="supabase/postgres:17.6.1.063"
# Tag in supabase/postgres repo matching the upgrade image (for downloading scripts)
PG17_SCRIPTS_REF="17.6.1.063"
DB_CONTAINER="supabase-db"
UPGRADE_CONTAINER="supabase-pg-upgrade"
COMPLETE_CONTAINER="supabase-pg-complete"

DATA_DIR="./volumes/db/data"
BACKUP_DIR="./volumes/db/data.bak.pg15"
# Include image tag in cache filename so changing PG17_UPGRADE_IMAGE invalidates it
PG17_TAG="${PG17_UPGRADE_IMAGE##*:}"
TARBALL_CACHE="./volumes/db/pg17_upgrade_bin_${PG17_TAG}.tar.gz"
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
db_config_vol=""

# Remove leftover containers and staging dir on exit.
# Uses an alpine container for rm because the tarball build runs as root
# inside Docker - the resulting files are root-owned and can't be deleted
# by the host user on macOS.
cleanup() {
    docker rm -f "$UPGRADE_CONTAINER" >/dev/null 2>&1 || true
    docker rm -f "$COMPLETE_CONTAINER" >/dev/null 2>&1 || true
    if [ -n "$staging_dir" ] && [ -d "$staging_dir" ]; then
        docker run --rm -v "$staging_dir:/cleanup" alpine rm -rf /cleanup 2>/dev/null || true
        rm -rf "$staging_dir" 2>/dev/null || true
    fi
}
trap cleanup EXIT

on_interrupt() {
    echo ""
    warn "Interrupted. Cleaning up..."
    # If db-config was chowned to PG17, restore for PG15 rollback
    if [ -n "$db_config_vol" ] && [ -n "$current_image" ]; then
        docker run --rm -v "${db_config_vol}:/vol" "$current_image" \
            chown -R postgres:postgres /vol/ 2>/dev/null || true
    fi
    die "Interrupted."
}
trap on_interrupt INT

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

    if [ "$(id -u)" -ne 0 ]; then
        die "This script must be run as root (e.g. sudo bash $0)."
    fi

    docker compose version >/dev/null 2>&1 || die "Docker Compose not found."
    command -v curl >/dev/null 2>&1 || die "curl is required (for downloading upgrade scripts)."
    [ -f docker-compose.yml ] || die "Run this script from the docker/ directory."
    [ -f docker-compose.pg17.yml ] || die "Missing docker-compose.pg17.yml."
    [ -f .env ] || die "Missing .env file."

    # Resolve db-config volume (exact match on _db-config suffix or bare db-config)
    db_config_vol=$(docker volume ls --filter "name=db-config" --format '{{.Name}}' \
        | grep -E '^db-config$|_db-config$' | head -n 1)
    [ -n "$db_config_vol" ] || die "Could not find db-config volume. Is Supabase running?"

    # Read the target PG17 image from the compose override (what the user will run)
    PG17_TARGET_IMAGE=$(grep 'image:.*postgres' docker-compose.pg17.yml | awk '{print $2}' | head -n 1)
    [ -n "$PG17_TARGET_IMAGE" ] || die "Could not read image from docker-compose.pg17.yml."

    pg_password=$(grep '^POSTGRES_PASSWORD=' .env | cut -d '=' -f 2- | sed "s/^['\"]//;s/['\"]$//" | head -n 1)
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
        warn "This is likely from a previous upgrade attempt."
        warn "If you haven't verified that previous upgrade, roll back first:"
        warn "  1. docker compose -f docker-compose.yml -f docker-compose.pg17.yml down"
        warn "  2. rm -rf $DATA_DIR"
        warn "  3. mv $BACKUP_DIR $DATA_DIR"
        warn "  4. docker compose run --rm db chown -R postgres:postgres /etc/postgresql-custom/"
        warn "  5. docker compose up -d"
        echo ""
        warn "Continuing will DELETE the existing backup permanently."
        confirm "Delete $BACKUP_DIR and start a fresh upgrade?"
        rm -rf "$BACKUP_DIR"
    fi
    if [ -d "$MIGRATION_DIR" ]; then
        rm -rf "$MIGRATION_DIR"
    fi

    # Disk space
    local data_size_kb data_size_mb avail_kb avail_mb needed_mb
    data_size_kb=$(du -sk "$DATA_DIR" 2>/dev/null | cut -f1)
    [ -n "$data_size_kb" ] || die "Could not calculate data size for $DATA_DIR"
    data_size_mb=$((data_size_kb / 1024))
    avail_kb=$(df -k "$(dirname "$DATA_DIR")" | awk 'NR==2 { print $4 }')
    [ -n "$avail_kb" ] || die "Could not calculate available disk space for $(dirname "$DATA_DIR")"
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
    echo "  2. Build an upgrade tarball from the image (~1.2 GB compressed, temporary)"
    echo "  3. Stop all Supabase services"
    echo "  4. Run pg_upgrade (Postgres 15 -> 17)"
    echo "  5. Apply post-upgrade patches"
    echo "  6. Start Supabase with Postgres 17"
    echo "  7. Apply additional migrations"
    echo ""
    echo "  Current image:    $current_image"
    echo "  Target image:     $PG17_TARGET_IMAGE"
    echo "  Upgrade image:    $PG17_UPGRADE_IMAGE"
    echo "  Data directory:   $DATA_DIR"
    echo "  Backup location:  $BACKUP_DIR"
    echo ""
    confirm "Proceed with the upgrade?"
}

# --- Step 1: Pull Postgres 17 image ----------------------------------------

pull_image() {
    info "Pulling Postgres 17 images"
    docker pull "$PG17_UPGRADE_IMAGE"
    if [ "$PG17_TARGET_IMAGE" != "$PG17_UPGRADE_IMAGE" ]; then
        docker pull "$PG17_TARGET_IMAGE"
    fi
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
    local tmpbase="${TMPDIR:-/tmp}"
    staging_dir=$(mktemp -d "${tmpbase%/}/supabase-pg17-upgrade.XXXXXX")
    # World-writable so Docker containers can write to bind mounts on macOS,
    # where the VM's root user has no special access to host directories.
    chmod 777 "$staging_dir"
    echo "  Staging directory: $staging_dir"

    # Download upgrade scripts from the supabase/postgres repo (pinned to PG17_SCRIPTS_REF).
    # These are no longer bundled in the latest PG17 Docker images.
    info "Downloading upgrade scripts (ref: $PG17_SCRIPTS_REF)"
    local scripts_base="https://raw.githubusercontent.com/supabase/postgres/${PG17_SCRIPTS_REF}/ansible/files/admin_api_scripts/pg_upgrade_scripts"
    mkdir -p "$staging_dir/scripts"
    for script in initiate.sh complete.sh common.sh pgsodium_getkey.sh check.sh prepare.sh; do
        curl -fsSL "$scripts_base/$script" -o "$staging_dir/scripts/$script" \
            || die "Failed to download $script from GitHub"
    done

    if [ -f "$TARBALL_CACHE" ]; then
        info "Using cached upgrade tarball: $TARBALL_CACHE"
        cp "$TARBALL_CACHE" "$staging_dir/pg_upgrade_bin.tar.gz"
        return
    fi

    info "Building upgrade tarball from Postgres 17 image (first run)"
    docker run --rm --user root --entrypoint bash \
        -v "$staging_dir:/export" \
        "$PG17_UPGRADE_IMAGE" \
        -c '
            set -euo pipefail
            mkdir -p /export/17/bin /export/17/lib /export/17/share

            echo "  Copying binaries..."
            # Binaries in the nix profile are either ELF binaries or shell
            # wrappers that exec a .xxx-wrapped ELF from the nix store.
            # Extract the actual ELF binaries so they work outside nix.
            BIN_DIR=$(dirname $(readlink -f /usr/lib/postgresql/bin/postgres))
            for f in "$BIN_DIR"/*; do
                name=$(basename "$f")

                # Skip nix wrapper-internal files
                case "$name" in .*-wrapped) continue ;; esac

                # Check for ELF
                if [ -x "$f" ] && file -b "$f" | grep -q "ELF .* executable"; then
                    cp "$f" /export/17/bin/"$name"
                else
                    # Shell wrapper - extract the real .xxx-wrapped ELF path
                    wrapped=$(grep -o "/nix/store/[^ \"]*-wrapped" "$f" 2>/dev/null | head -n 1 || true)
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

            # These paths may overlap (PKGLIBDIR and LIBDIR often point to the
            # same nix store path). Use cp -Lf to handle overwrites from
            # read-only nix store source files.
            cp -Lf "$PKGLIBDIR"/*.so /export/17/lib/ || echo "  Warning: cp from $PKGLIBDIR failed" >&2
            cp -Lf "$LIBDIR"/*.so* /export/17/lib/ || echo "  Warning: cp from $LIBDIR failed" >&2
            cp -Lf /nix/var/nix/profiles/default/lib/*.so* /export/17/lib/ || echo "  Warning: cp from nix profile lib failed" >&2

            echo "  Copying share data..."

            # Nix-built binaries resolve share dir relative to their location:
            #   <bindir>/../share/postgresql/
            # so we need share/postgresql/ not just share/
            mkdir -p /export/17/share/postgresql

            # Remove cyclic symlink (timezonesets/timezonesets -> timezonesets).
            rm -f /usr/share/postgresql/timezonesets/timezonesets 2>/dev/null || true

            # Pre-create subdirectories so cp -rL does not need to mkdir them.
            # On macOS with Docker Desktop bind mount rejects mkdir with the nix store
            # read-only (dr-xr-xr-x) permissions; pre-creating with default
            # writable permissions fixed this
            mkdir -p /export/17/share/postgresql/{extension,timezonesets,tsearch_data}
            mkdir -p /export/17/share/postgresql/extension/{functions,procedures,tables,types}

            cp -rL /usr/share/postgresql/* /export/17/share/postgresql/ || echo "  Warning: cp share data had errors" >&2

            # initiate.sh copies .control/.sql from PGLIBNEW to PGSHARENEW/extension/
            echo "  Copying extension definitions to lib..."
            SHAREDIR=$(pg_config --sharedir)
            cp "$SHAREDIR"/extension/*.control /export/17/lib/ || echo "  Warning: cp .control from $SHAREDIR/extension failed" >&2
            cp "$SHAREDIR"/extension/*.sql /export/17/lib/ || echo "  Warning: cp .sql from $SHAREDIR/extension failed" >&2

            # Verify critical files before creating tarball
            echo "  Checking for key files..."
            [ -f /export/17/bin/postgres ] || { echo "Error: bin/postgres missing"; exit 1; }
            [ -f /export/17/share/postgresql/timezonesets/Default ] || { echo "Error: timezonesets/Default missing"; exit 1; }
            ls /export/17/share/postgresql/extension/*.control >/dev/null 2>&1 || { echo "Error: no .control files in extension/"; exit 1; }
            ls /export/17/lib/*.so >/dev/null 2>&1 || { echo "Error: no .so files in lib/"; exit 1; }

            echo "  Creating tarball (this may take several minutes)..."
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
    local key_backup="./volumes/db/pgsodium_root.key.bak.pg15"
    docker run --rm -v "${db_config_vol}:/src:ro" -v "$(pwd)/volumes/db:/dst" \
        alpine cp /src/pgsodium_root.key /dst/pgsodium_root.key.bak.pg15 \
        || die "Failed to back up pgsodium root key from db-config volume."
    echo "  Saved to: $key_backup"

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
    local abs_data_dir abs_migration_dir

    mkdir -p "$MIGRATION_DIR"
    # World-writable for macOS Docker bind mount compatibility (see build_tarball)
    chmod 777 "$MIGRATION_DIR"
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

    # initiate.sh expects the PG17 binaries tarball at /tmp/persistent/pg_upgrade_bin.tar.gz
    # (hardcoded path - copied there during container setup above).
    #
    # Env vars for the unwrapped nix ELF binaries in the tarball:
    #   LD_LIBRARY_PATH - find libpq, libssl, etc. (RUNPATH points to absent nix store paths)
    #   NIX_PGLIBDIR    - postgres uses this to find extension .so files

    info "Running initiate.sh (pg_upgrade: Postgres 15 -> 17)"
    echo "  This may take several minutes depending on database size..."
    echo ""
    if ! docker exec \
        -e IS_CI=true \
        -e PG_MAJOR_VERSION=17 \
        -e PGPASSWORD="$pg_password" \
        -e LD_LIBRARY_PATH=/tmp/pg_upgrade_bin/17/lib \
        -e NIX_PGLIBDIR=/tmp/pg_upgrade_bin/17/lib \
        "$UPGRADE_CONTAINER" \
        /tmp/upgrade/initiate.sh 17; then
        echo ""
        warn "initiate.sh failed. Its cleanup may have restored the original state"
        warn "(re-enabled extensions, revoked superuser). Your data directory is"
        warn "unchanged - no data was moved or deleted."
        warn ""
        warn "Check the output above for the root cause, fix it, and re-run."
        docker rm -f "$UPGRADE_CONTAINER" >/dev/null 2>&1 || true
        die "initiate.sh failed"
    fi

    info "initiate.sh completed successfully"
    docker rm -f "$UPGRADE_CONTAINER" >/dev/null 2>&1 || true
}

# --- Step 6: Run complete.sh in a native PG17 container -------------------
#
# complete.sh applies post-upgrade patches (pg_net grants, vault re-encryption,
# pg_cron, predefined roles, vacuumdb, etc.). We run it in a PG17 container
# where the binaries are native - no nix extraction or LD_LIBRARY_PATH needed.

run_complete() {
    local abs_migration_dir

    abs_migration_dir=$(cd "$MIGRATION_DIR" && pwd)

    info "Starting PG17 container for complete.sh"
    docker run -d --name "$COMPLETE_CONTAINER" \
        --entrypoint sleep \
        -v "${abs_migration_dir}:/mnt/host-migration" \
        -v "${db_config_vol}:/etc/postgresql-custom" \
        -v "${staging_dir}:/tmp/staging:ro" \
        -e PGPASSWORD="$pg_password" \
        "$PG17_UPGRADE_IMAGE" \
        infinity

    info "Preparing complete.sh environment"
    # Save original db-config ownership so we can restore it if complete.sh fails.
    # complete.sh needs PG17 ownership to start postgres, but if it fails the
    # user needs to fall back to PG15 which uses a different uid.
    docker exec "$COMPLETE_CONTAINER" bash -c '
        stat -c "%u:%g" /etc/postgresql-custom/pgsodium_root.key 2>/dev/null > /tmp/dbconfig_owner || true
    '

    docker exec "$COMPLETE_CONTAINER" bash -c '
        # Symlink bind mount so complete.sh CI wrapper can mv/rm/ln
        ln -s /mnt/host-migration /data_migration

        # Remove the image default data dir (complete.sh creates a symlink here)
        rm -rf /var/lib/postgresql/data

        # Fix ownership on db-config volume (PG15 uid differs from PG17)
        chown -R postgres:postgres /etc/postgresql-custom/

        # PG17 config includes this directory; may not exist from PG15
        mkdir -p /etc/postgresql-custom/conf.d

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
        echo ""
        # Restore db-config ownership so PG15 can start for rollback
        warn "Restoring db-config ownership for PG15..."
        local orig_owner
        orig_owner=$(docker exec "$COMPLETE_CONTAINER" cat /tmp/dbconfig_owner 2>/dev/null || true)
        if [ -n "$orig_owner" ]; then
            docker exec "$COMPLETE_CONTAINER" chown -R "$orig_owner" /etc/postgresql-custom/ 2>/dev/null || true
        fi
        docker rm -f "$COMPLETE_CONTAINER" >/dev/null 2>&1 || true
        echo ""
        echo "  Your Postgres 15 data is unchanged (data swap has not happened yet)."
        echo "  To restart Postgres 15:"
        echo "    rm -rf $MIGRATION_DIR"
        echo "    docker compose up -d"
        echo ""
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
    rm -rf "$MIGRATION_DIR"
}

# --- Step 8: Start Postgres 17 ---------------------------------------------

start_pg17() {
    info "Starting Supabase with Postgres 17"

    # Ensure db-config volume has correct ownership and structure for PG17.
    # complete.sh does this too, but just in case of partial
    # failures from previous runs.
    docker run --rm -v "${db_config_vol}:/vol" "$PG17_TARGET_IMAGE" sh -c '
        mkdir -p /vol/conf.d
        chown -R postgres:postgres /vol/
    '

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
    new_version=$(run_sql_on "$DB_CONTAINER" -A -t -c "SHOW server_version;" 2>/dev/null | head -n 1)
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

    # Fix collation version mismatch first (upgrade used glibc 2.39, target
    # image may use glibc 2.40). Do this before any other SQL to suppress
    # the noisy warnings on every subsequent command.
    for db in postgres template1 _supabase; do
        docker exec -i -e PGPASSWORD="$pg_password" "$DB_CONTAINER" \
            psql -h localhost -U supabase_admin -d "$db" \
            -c "ALTER DATABASE \"$db\" REFRESH COLLATION VERSION;" || true
    done

    # Create supabase_etl_admin role (doesn't exist in PG15 images).
    # Must be created before running predefined_role_grants.sql which
    # assumes it exists.
    run_sql_on "$DB_CONTAINER" -c "
        DO \$\$
        BEGIN
            IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_etl_admin') THEN
                CREATE USER supabase_etl_admin WITH LOGIN REPLICATION;
                GRANT pg_read_all_data TO supabase_etl_admin;
                GRANT CREATE ON DATABASE postgres TO supabase_etl_admin;
            END IF;
        END
        \$\$;" || true

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
            psql -h localhost -U supabase_admin -d postgres -v ON_ERROR_STOP=1 \
                -f "${migration_dir}/${m}" || warn "  $m failed (non-fatal)"
    done
}

# --- Step 10: Verify ------------------------------------------------------

verify() {
    info "Verification"

    local version
    version=$(run_sql_on "$DB_CONTAINER" -A -t -c "SELECT version();" 2>/dev/null | head -n 1)
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
    echo "  Postgres 15 backup:  $BACKUP_DIR"
    echo "  pgsodium key backup: ./volumes/db/pgsodium_root.key.bak.pg15"
    echo "  Once satisfied, you can reclaim space:"
    echo "    rm -rf $BACKUP_DIR ./volumes/db/pg17_upgrade_bin_*.tar.gz"
    echo ""
    echo "  Rollback (if needed):"
    echo "    1. docker compose -f docker-compose.yml -f docker-compose.pg17.yml down"
    echo "    2. rm -rf $DATA_DIR"
    echo "    3. mv $BACKUP_DIR $DATA_DIR"
    echo "    4. docker compose run --rm db chown -R postgres:postgres /etc/postgresql-custom/"
    echo "    5. docker compose up -d"
    echo ""
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
