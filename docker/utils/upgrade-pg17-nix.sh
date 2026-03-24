#!/usr/bin/env bash
#
# Requires bash (not sh) for pipefail, which ensures failures in piped
# commands are caught during the upgrade.
#
# Upgrade self-hosted Supabase Postgres from 15 to 17.
#
# HEADS UP: Uses the public Supabase nix binary cache to fetch PG17
# binaries.
#
# Uses Supabase's pg_upgrade scripts (initiate.sh + complete.sh) inside a
# temporary PG15 container, then swaps data directories and starts Postgres 17.
#
# Usage:
#   cd docker/
#   bash utils/upgrade-pg17-nix.sh          # Interactive (prompts for confirmation)
#   bash utils/upgrade-pg17-nix.sh --yes    # Non-interactive (skip all prompts)
#
# Requirements:
#   - Docker with Docker Compose (docker compose, not docker-compose)
#   - Running Supabase self-hosted setup with Postgres 15
#   - Network access (downloads ~190 MB from Supabase nix binary cache)
#   - At least 2x current database size + 2 GB free disk space
#
# Backup:
#   The original Postgres 15 data directory is preserved as
#   ./volumes/db/data.bak.pg15 during the upgrade.
#   DO NOT DELETE it until you have verified the upgrade was successful.
#
# Rollback (if the upgrade fails or you want to revert):
#   1. docker compose down
#   2. rm -rf ./volumes/db/data
#   3. mv ./volumes/db/data.bak.pg15 ./volumes/db/data
#   4. docker compose run --rm db chown -R postgres:postgres /etc/postgresql-custom/
#   5. docker compose up -d
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
# Tag in supabase/postgres repo (for downloading upgrade scripts)
PG17_SCRIPTS_REF="17.6.1.084"
# Git commit hash for the PG17 tag - written to nix_flake_version in the
# tarball so initiate.sh takes the nix code path.
PG17_NIX_FLAKE_VERSION="f183a83f0bd0122c9dcc438f17a106533435c963"
# Nix store path for the PG17 postgresql-and-plugins package.
# initiate.sh normally resolves this via an internal S3 catalog (not accessible
# to self-hosted). We provide it directly and patch initiate.sh to skip the
# S3 lookup. Get this from: docker run --rm $PG17_IMAGE bash -c \
#   'dirname $(dirname $(readlink -f /usr/lib/postgresql/bin/postgres))'
PG17_NIX_STORE_PATH="/nix/store/dvxsqdc71wm6d6apf937dp17zl5diia3-postgresql-and-plugins-17.6"
DB_CONTAINER="supabase-db"
UPGRADE_CONTAINER="supabase-pg-upgrade"
COMPLETE_CONTAINER="supabase-pg-complete"

DATA_DIR="./volumes/db/data"
BACKUP_DIR="./volumes/db/data.bak.pg15"
# initiate.sh writes pg_upgrade output here: pgdata/, conf/, sql/
MIGRATION_DIR="./volumes/db/data_migration"

# --- Helpers ----------------------------------------------------------------

die() { printf 'Error: %s\n' "$*" >&2; exit 1; }
info() { printf '\n==> %s\n' "$*"; }
warn() { printf 'Warning: %s\n' "$*" >&2; }

# Temp dir on host for scripts (mounted into containers)
staging_dir=""
pg_password=""
current_image=""
drop_extensions=""
# Remove leftover containers and staging dir on exit.
# Uses an alpine container for rm because files may be root-owned.
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
    local db_config_vol
    db_config_vol=$(docker volume ls --filter "name=db-config" --format '{{.Name}}' 2>/dev/null | head -1)
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

    docker compose version >/dev/null 2>&1 || die "Docker Compose not found."
    command -v curl >/dev/null 2>&1 || die "curl is required (for downloading upgrade scripts)."
    [ -f docker-compose.yml ] || die "Run this script from the docker/ directory."
    [ -f docker-compose.pg17.yml ] || die "Missing docker-compose.pg17.yml."
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
        warn "This is likely from a previous upgrade attempt."
        warn "If you haven't verified that previous upgrade, roll back first:"
        warn "  1. docker compose down"
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
    data_size_mb=$((data_size_kb / 1024))
    avail_kb=$(df -k "$(dirname "$DATA_DIR")" | awk 'NR==2{print $4}')
    avail_mb=$((avail_kb / 1024))
    needed_mb=$((data_size_mb * 2 + 2000))
    echo "  Data size:       ${data_size_mb} MB"
    echo "  Available space: ${avail_mb} MB"
    echo "  Estimated need:  ${needed_mb} MB"
    if [ "$avail_mb" -lt "$needed_mb" ]; then
        warn "Disk space may be insufficient."
        warn "pg_upgrade copies data; need ~2x data size + ~2 GB for nix store."
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
    echo "  2. Fetch Postgres 17 binaries via nix (~190 MB download)"
    echo "  3. Stop all Supabase services"
    echo "  4. Run pg_upgrade (Postgres 15 -> 17)"
    echo "  5. Apply post-upgrade patches"
    echo "  6. Start Supabase with Postgres 17"
    echo "  7. Apply additional migrations"
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

# --- Step 2: Prepare staging (scripts + nix flake tarball) -----------------
#
# Downloads upgrade scripts from Supabase GitHub and creates a minimal tarball
# containing just the nix_flake_version file. This triggers initiate.sh's
# nix code path, which uses nix build to fetch PG17 binaries from the
# public Supabase nix binary cache.

prepare_staging() {
    local tmpbase="${TMPDIR:-/tmp}"
    staging_dir=$(mktemp -d "${tmpbase%/}/supabase-pg17-upgrade.XXXXXX")
    echo "  Staging directory: $staging_dir"

    # Download upgrade scripts from the supabase/postgres repo
    info "Downloading upgrade scripts (ref: $PG17_SCRIPTS_REF)"
    local scripts_base="https://raw.githubusercontent.com/supabase/postgres/${PG17_SCRIPTS_REF}/ansible/files/admin_api_scripts/pg_upgrade_scripts"
    mkdir -p "$staging_dir/scripts"
    for script in initiate.sh complete.sh common.sh pgsodium_getkey.sh check.sh prepare.sh; do
        curl -fsSL "$scripts_base/$script" -o "$staging_dir/scripts/$script" \
            || die "Failed to download $script from GitHub"
    done

    # Create a minimal tarball with nix_flake_version.
    # initiate.sh detects this file and uses nix build to fetch PG17 binaries
    # from the Supabase public nix binary cache.
    info "Creating nix flake version tarball"
    mkdir -p "$staging_dir/17"
    echo "$PG17_NIX_FLAKE_VERSION" > "$staging_dir/17/nix_flake_version"
    tar czf "$staging_dir/pg_upgrade_bin.tar.gz" -C "$staging_dir" 17/
    rm -rf "$staging_dir/17"
    echo "  Flake version: $PG17_NIX_FLAKE_VERSION"
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

# --- Step 5: Run pg_upgrade via initiate.sh --------------------------------
#
# Host directories are mounted at non-standard paths (/mnt/host-*) with
# symlinks at the paths the upgrade scripts expect.
#
# The tarball contains just a nix_flake_version file (git commit hash).
# initiate.sh detects this and uses nix build to fetch PG17 binaries
# from the public Supabase nix binary cache.

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

    # Write a setup script to avoid quoting hell with docker exec bash -c
    cat > "$staging_dir/setup-upgrade.sh" << 'SETUP'
#!/bin/bash
set -euo pipefail

# Symlink bind mounts to the paths the upgrade scripts expect
rm -rf /var/lib/postgresql/data
ln -s /mnt/host-pgdata /var/lib/postgresql/data
ln -s /mnt/host-migration /data_migration

mkdir -p /tmp/persistent /tmp/upgrade /tmp/pg_upgrade
cp /tmp/staging/pg_upgrade_bin.tar.gz /tmp/persistent/
cp /tmp/staging/scripts/*.sh /tmp/upgrade/
chmod +x /tmp/upgrade/*.sh

# After nix-daemon.sh is sourced, PATH gets /root/.nix-profile/bin
# prepended. pg_config --bindir then returns that root-owned path,
# and su postgres can't execute binaries there. Fix by hardcoding
# BINDIR to /usr/bin (where PG15 binaries live) in both CI functions.
sed -i 's|BINDIR=$(pg_config --bindir)|BINDIR=/usr/bin|g' /tmp/upgrade/common.sh

# Make CI_start_postgres idempotent with a pg_isready guard.
sed -i '/^CI_start_postgres() {/a\    /usr/bin/pg_isready -h localhost >/dev/null 2>&1 && return 0' /tmp/upgrade/common.sh
SETUP

    docker exec "$UPGRADE_CONTAINER" bash /tmp/staging/setup-upgrade.sh

    # initiate.sh resolves the nix store path via an internal S3 catalog
    # (aws s3 cp + jq). Self-hosted can't access that S3 bucket. We provide
    # fake "aws" and "jq" scripts that return our known store path, so
    # initiate.sh's existing code works unmodified.
    local arch
    arch=$(docker exec "$UPGRADE_CONTAINER" uname -m)
    local system="x86_64-linux"
    [ "$arch" = "aarch64" ] && system="aarch64-linux"

    # Fake "aws" - writes a catalog JSON with the known store path
    # initiate.sh calls: aws s3 cp <src> <dst> --region ...
    # $4 is the destination file
    printf '#!/bin/sh\ncat > "$4" <<EOF\n{"%s": "%s"}\nEOF\n' \
        "$system" "$PG17_NIX_STORE_PATH" \
        | docker exec -i "$UPGRADE_CONTAINER" tee /usr/local/bin/aws >/dev/null
    docker exec "$UPGRADE_CONTAINER" chmod +x /usr/local/bin/aws

    # Fake "jq" - extracts the nix store path from the JSON
    # initiate.sh calls: jq -r '."aarch64-linux"' /tmp/catalog.json
    # $1=-r, $2=pattern, $3=file
    printf '#!/bin/sh\ngrep -o '"'"'/nix/store/[^"]*'"'"' "$3"\n' \
        | docker exec -i "$UPGRADE_CONTAINER" tee /usr/local/bin/jq >/dev/null
    docker exec "$UPGRADE_CONTAINER" chmod +x /usr/local/bin/jq

    info "Starting Postgres 15 in upgrade container"
    docker exec "$UPGRADE_CONTAINER" bash -c '
        su postgres -c "pg_ctl start -o \"-c config_file=/etc/postgresql/postgresql.conf\" -l /tmp/postgres.log"
    '
    wait_for_healthy "$UPGRADE_CONTAINER"

    # initiate.sh expects the tarball at /tmp/persistent/pg_upgrade_bin.tar.gz.
    # It contains just nix_flake_version (git commit hash), which triggers the
    # nix code path. initiate.sh runs nix build to fetch PG17 binaries from
    # the public Supabase nix binary cache (~190 MB download).

    info "Running initiate.sh (pg_upgrade: Postgres 15 -> 17)"
    echo "  This may take several minutes depending on database size..."
    echo ""
    if ! docker exec \
        -e IS_CI=true \
        -e PG_MAJOR_VERSION=17 \
        -e PGPASSWORD="$pg_password" \
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
# where the binaries are native.

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

    # Save original db-config ownership for rollback
    docker exec "$COMPLETE_CONTAINER" bash -c '
        stat -c "%u:%g" /etc/postgresql-custom/pgsodium_root.key 2>/dev/null > /tmp/dbconfig_owner || true
    '

    # Fix ownership on db-config volume, migration conf/ and pgdata/.
    # initiate.sh ran as root inside PG15, so these files are root-owned.
    # complete.sh's copy_configs does cp -R from conf/ to db-config, preserving
    # the source ownership. We must fix the SOURCE files too, not just the target.
    docker exec "$COMPLETE_CONTAINER" chown -R postgres:postgres /etc/postgresql-custom/
    docker exec "$COMPLETE_CONTAINER" chown -R postgres:postgres /mnt/host-migration/ 2>/dev/null || true
    docker exec "$COMPLETE_CONTAINER" mkdir -p /etc/postgresql-custom/conf.d

    # Write setup script to staging dir (avoids quoting issues with docker exec)
    cat > "$staging_dir/setup-complete.sh" << 'SETUP'
#!/bin/bash
set -euo pipefail

# Symlink bind mount so complete.sh CI wrapper can mv/rm/ln
ln -s /mnt/host-migration /data_migration

# Remove the image default data dir (complete.sh creates a symlink here)
rm -rf /var/lib/postgresql/data

mkdir -p /tmp/upgrade

# Copy upgrade scripts
cp /tmp/staging/scripts/*.sh /tmp/upgrade/
chmod +x /tmp/upgrade/*.sh

# Patch --new-bin to use native bindir (we are in a PG17 container,
# no need for /tmp/pg_upgrade_bin/ paths)
sed -i 's|BINDIR="/tmp/pg_upgrade_bin/$PG_MAJOR_VERSION/bin"|BINDIR=$(pg_config --bindir)|g' /tmp/upgrade/common.sh

# The slim PG17 image does not have locale-gen (locales are pre-built)
sed -i 's/locale-gen/true # locale-gen not needed in slim image/' /tmp/upgrade/complete.sh

# Patch copy_configs to chown db-config after cp (cp runs as root,
# but postgres needs to read the files)
sed -i '/chmod -R 0750/a\    chown -R postgres:postgres /etc/postgresql-custom/' /tmp/upgrade/complete.sh

# Patch complete.sh to refresh collation version right after postgres starts
# (before any SQL). Silences glibc 2.39 vs 2.40 mismatch warnings.
# Uses awk instead of sed because Alpine has busybox sed (no multi-line insert).
awk '/3.1. Patch Wrappers/{
    print "    echo \"2.1. Refreshing collation version\""
    print "    run_sql -c \"ALTER DATABASE postgres REFRESH COLLATION VERSION;\" 2>/dev/null || true"
    print "    run_sql -d template1 -c \"ALTER DATABASE template1 REFRESH COLLATION VERSION;\" 2>/dev/null || true"
    print "    run_sql -d _supabase -c \"ALTER DATABASE _supabase REFRESH COLLATION VERSION;\" 2>/dev/null || true"
}1' /tmp/upgrade/complete.sh > /tmp/upgrade/complete.sh.tmp && mv /tmp/upgrade/complete.sh.tmp /tmp/upgrade/complete.sh
chmod +x /tmp/upgrade/complete.sh
SETUP

    info "Preparing complete.sh environment"
    docker exec "$COMPLETE_CONTAINER" bash /tmp/staging/setup-complete.sh

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
}

# --- Step 8: Start Postgres 17 ---------------------------------------------

start_pg17() {
    info "Starting Supabase with Postgres 17"

    # Ensure db-config volume has correct ownership and structure for PG17.
    local db_config_vol
    db_config_vol=$(docker volume ls --filter "name=db-config" --format '{{.Name}}' | head -1)
    if [ -n "$db_config_vol" ]; then
        docker run --rm -v "${db_config_vol}:/vol" "$PG17_IMAGE" sh -c '
            mkdir -p /vol/conf.d
            chown -R postgres:postgres /vol/
        '
    fi

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

    # Fix collation version mismatch. PG15 used glibc 2.39, but the PG17
    # .084 image has glibc 2.40. Refresh all databases to silence warnings.
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
    echo "    rm -rf $BACKUP_DIR $MIGRATION_DIR"
    echo ""
    echo "  Rollback (if needed):"
    echo "    1. docker compose down"
    echo "    2. rm -rf $DATA_DIR"
    echo "    3. mv $BACKUP_DIR $DATA_DIR"
    echo "    4. docker compose run --rm db chown -R postgres:postgres /etc/postgresql-custom/"
    echo "    5. docker compose up -d"
    echo ""
}

# --- Main -------------------------------------------------------------------

main() {
    echo ""
    echo "Supabase Self-Hosted: Postgres 15 -> 17 Upgrade (nix)"
    echo "======================================================"

    preflight
    pull_image
    prepare_staging
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
