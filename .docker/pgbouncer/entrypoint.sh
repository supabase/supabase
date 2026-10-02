#!/usr/bin/env bash
set -euo pipefail

# --- Parse DATABASE_URL ---
if [ -z "${DATABASE_URL:-}" ]; then
    echo "ERROR: DATABASE_URL is required" >&2
    exit 1
fi

# Extract components from postgresql://user:password@host:port/dbname?params
proto="${DATABASE_URL%%://*}"
rest="${DATABASE_URL#*://}"

userinfo="${rest%%@*}"
hostpart="${rest#*@}"
hostport="${hostpart%%/*}"
dbname_params="${hostpart#*/}"

if [[ "$userinfo" == *:* ]]; then
    DB_USER="${userinfo%%:*}"
    DB_PASS="${userinfo#*:}"
else
    echo "ERROR: DATABASE_URL must include user:password" >&2
    exit 1
fi
DB_HOST="${hostport%%:*}"
DB_PORT="${hostport##*:}"
DB_NAME="${dbname_params%%\?*}"

# Decode percent-encoded characters in URI components (RFC 3986)
urldecode() {
    printf '%b' "${1//%/\\x}"
}
DB_USER="$(urldecode "$DB_USER")"
DB_PASS="$(urldecode "$DB_PASS")"
DB_NAME="$(urldecode "$DB_NAME")"

# Parse query parameters (e.g. sslmode=no-verify)
DB_QUERY=""
if [[ "$dbname_params" == *"?"* ]]; then
    DB_QUERY="${dbname_params#*\?}"
fi

# Extract sslmode from query string
DSN_SSLMODE=""
if [ -n "$DB_QUERY" ]; then
    DSN_SSLMODE=$(echo "$DB_QUERY" | tr '&' '\n' | grep '^sslmode=' | head -1 | cut -d= -f2)
fi

# Default port if not specified
if [ "$DB_PORT" = "$DB_HOST" ]; then
    DB_PORT="5432"
fi

echo "pgbouncer: backend=${DB_HOST}:${DB_PORT} db=${DB_NAME} user=${DB_USER}"

# --- AWS instance type → memory (GiB) mapping ---
get_instance_memory_gb() {
    local instance_type="$1"
    case "$instance_type" in
        # T3 family
        db.t3.micro)    echo 1 ;;
        db.t3.small)    echo 2 ;;
        db.t3.medium)   echo 4 ;;
        db.t3.large)    echo 8 ;;
        db.t3.xlarge)   echo 16 ;;
        db.t3.2xlarge)  echo 32 ;;
        # T4g family
        db.t4g.micro)   echo 1 ;;
        db.t4g.small)   echo 2 ;;
        db.t4g.medium)  echo 4 ;;
        db.t4g.large)   echo 8 ;;
        db.t4g.xlarge)  echo 16 ;;
        db.t4g.2xlarge) echo 32 ;;
        # R5 family
        db.r5.large)    echo 16 ;;
        db.r5.xlarge)   echo 32 ;;
        db.r5.2xlarge)  echo 64 ;;
        db.r5.4xlarge)  echo 128 ;;
        db.r5.8xlarge)  echo 256 ;;
        db.r5.12xlarge) echo 384 ;;
        db.r5.16xlarge) echo 512 ;;
        db.r5.24xlarge) echo 768 ;;
        # R6g family
        db.r6g.large)    echo 16 ;;
        db.r6g.xlarge)   echo 32 ;;
        db.r6g.2xlarge)  echo 64 ;;
        db.r6g.4xlarge)  echo 128 ;;
        db.r6g.8xlarge)  echo 256 ;;
        db.r6g.12xlarge) echo 384 ;;
        db.r6g.16xlarge) echo 512 ;;
        # R6i family
        db.r6i.large)    echo 16 ;;
        db.r6i.xlarge)   echo 32 ;;
        db.r6i.2xlarge)  echo 64 ;;
        db.r6i.4xlarge)  echo 128 ;;
        db.r6i.8xlarge)  echo 256 ;;
        db.r6i.12xlarge) echo 384 ;;
        db.r6i.16xlarge) echo 512 ;;
        # R7g family
        db.r7g.large)    echo 16 ;;
        db.r7g.xlarge)   echo 32 ;;
        db.r7g.2xlarge)  echo 64 ;;
        db.r7g.4xlarge)  echo 128 ;;
        db.r7g.8xlarge)  echo 256 ;;
        db.r7g.12xlarge) echo 384 ;;
        db.r7g.16xlarge) echo 512 ;;
        # M5 family
        db.m5.large)    echo 8 ;;
        db.m5.xlarge)   echo 16 ;;
        db.m5.2xlarge)  echo 32 ;;
        db.m5.4xlarge)  echo 64 ;;
        db.m5.8xlarge)  echo 128 ;;
        db.m5.12xlarge) echo 192 ;;
        db.m5.16xlarge) echo 256 ;;
        db.m5.24xlarge) echo 384 ;;
        # M6g family
        db.m6g.large)    echo 8 ;;
        db.m6g.xlarge)   echo 16 ;;
        db.m6g.2xlarge)  echo 32 ;;
        db.m6g.4xlarge)  echo 64 ;;
        db.m6g.8xlarge)  echo 128 ;;
        db.m6g.12xlarge) echo 192 ;;
        db.m6g.16xlarge) echo 256 ;;
        # M6i family
        db.m6i.large)    echo 8 ;;
        db.m6i.xlarge)   echo 16 ;;
        db.m6i.2xlarge)  echo 32 ;;
        db.m6i.4xlarge)  echo 64 ;;
        db.m6i.8xlarge)  echo 128 ;;
        db.m6i.12xlarge) echo 192 ;;
        db.m6i.16xlarge) echo 256 ;;
        # M7g family
        db.m7g.large)    echo 8 ;;
        db.m7g.xlarge)   echo 16 ;;
        db.m7g.2xlarge)  echo 32 ;;
        db.m7g.4xlarge)  echo 64 ;;
        db.m7g.8xlarge)  echo 128 ;;
        db.m7g.12xlarge) echo 192 ;;
        db.m7g.16xlarge) echo 256 ;;
        *)
            echo "WARN: Unknown instance type '${instance_type}', using local defaults" >&2
            echo 0
            ;;
    esac
}

# --- Calculate pool settings from instance memory ---
calculate_pool_settings() {
    local memory_gb="$1"

    if [ "$memory_gb" -eq 0 ]; then
        # Local/unknown: use conservative defaults
        DEFAULT_POOL_SIZE=20
        MAX_CLIENT_CONN=200
        MIN_POOL_SIZE=2
        RESERVE_POOL_SIZE=1
        MAX_DB_CONNECTIONS=0
        return
    fi

    local memory_bytes=$((memory_gb * 1073741824))
    local rds_max_conn=$((memory_bytes / 9531392))

    # Cap at 5000 (RDS hard limit for most instances)
    if [ "$rds_max_conn" -gt 5000 ]; then
        rds_max_conn=5000
    fi

    DEFAULT_POOL_SIZE=$((rds_max_conn * 75 / 100))
    MAX_CLIENT_CONN=$((DEFAULT_POOL_SIZE * 10))
    MIN_POOL_SIZE=$((DEFAULT_POOL_SIZE / 10))
    RESERVE_POOL_SIZE=$((DEFAULT_POOL_SIZE / 20))

    # Floor values
    [ "$MIN_POOL_SIZE" -lt 1 ] && MIN_POOL_SIZE=1
    [ "$RESERVE_POOL_SIZE" -lt 1 ] && RESERVE_POOL_SIZE=1

    MAX_DB_CONNECTIONS=0

    echo "pgbouncer: instance=${AWS_DB_INSTANCE_TYPE} memory=${memory_gb}GB rds_max_conn=${rds_max_conn}"
}

# --- Compute settings ---
if [ -n "${AWS_DB_INSTANCE_TYPE:-}" ]; then
    MEMORY_GB=$(get_instance_memory_gb "$AWS_DB_INSTANCE_TYPE")
    calculate_pool_settings "$MEMORY_GB"
else
    echo "pgbouncer: no AWS_DB_INSTANCE_TYPE set, using local defaults"
    calculate_pool_settings 0
fi

# Allow env var overrides
DEFAULT_POOL_SIZE="${PGBOUNCER_DEFAULT_POOL_SIZE:-$DEFAULT_POOL_SIZE}"
MAX_CLIENT_CONN="${PGBOUNCER_MAX_CLIENT_CONN:-$MAX_CLIENT_CONN}"
MIN_POOL_SIZE="${PGBOUNCER_MIN_POOL_SIZE:-$MIN_POOL_SIZE}"
RESERVE_POOL_SIZE="${PGBOUNCER_RESERVE_POOL_SIZE:-$RESERVE_POOL_SIZE}"
MAX_DB_CONNECTIONS="${PGBOUNCER_MAX_DB_CONNECTIONS:-$MAX_DB_CONNECTIONS}"
POOL_MODE="${PGBOUNCER_POOL_MODE:-transaction}"
APP_NAME="${PGBOUNCER_APP_NAME:-Supabase Storage PgBouncer ${VERSION:-0.0.0}}"
AUTH_TYPE="${PGBOUNCER_AUTH_TYPE:-scram-sha-256}"
ADMIN_USERS="${PGBOUNCER_ADMIN_USERS:-$DB_USER}"
STATS_USERS="${PGBOUNCER_STATS_USERS:-$DB_USER}"

echo "pgbouncer: pool_mode=${POOL_MODE} default_pool_size=${DEFAULT_POOL_SIZE} max_client_conn=${MAX_CLIENT_CONN} min_pool_size=${MIN_POOL_SIZE} reserve_pool_size=${RESERVE_POOL_SIZE}"

# --- TLS configuration ---
# Priority: PGBOUNCER_SERVER_TLS_MODE env var > sslmode from DATABASE_URL > auto-detect
# Map non-standard sslmode values to pgbouncer equivalents:
#   no-verify -> require (encrypted, skip certificate verification)
map_sslmode() {
    case "$1" in
        no-verify)    echo "require" ;;
        *)            echo "$1" ;;
    esac
}

TLS_CONFIG=""
if [ -n "${DATABASE_SSL_ROOT_CERT:-}" ]; then
    CERT_PATH="/etc/pgbouncer/ca.crt"

    # Detect if content is base64-encoded (no PEM header)
    if echo "$DATABASE_SSL_ROOT_CERT" | grep -q "BEGIN CERTIFICATE"; then
        echo "$DATABASE_SSL_ROOT_CERT" > "$CERT_PATH"
    else
        echo "$DATABASE_SSL_ROOT_CERT" | base64 -d > "$CERT_PATH"
    fi

    TLS_MODE="${PGBOUNCER_SERVER_TLS_MODE:-${DSN_SSLMODE:-verify-full}}"
    TLS_MODE=$(map_sslmode "$TLS_MODE")
    TLS_CONFIG="server_tls_sslmode = ${TLS_MODE}
server_tls_ca_file = ${CERT_PATH}"

    echo "pgbouncer: TLS enabled, mode=${TLS_MODE}"
else
    TLS_MODE="${PGBOUNCER_SERVER_TLS_MODE:-${DSN_SSLMODE:-disable}}"
    TLS_MODE=$(map_sslmode "$TLS_MODE")
    if [ "$TLS_MODE" != "disable" ]; then
        TLS_CONFIG="server_tls_sslmode = ${TLS_MODE}"
        echo "pgbouncer: TLS mode=${TLS_MODE} (no CA cert provided)"
    fi
fi

TLS_FILE="$(mktemp)"
printf '%s\n' "$TLS_CONFIG" > "$TLS_FILE"

# --- Generate userlist.txt ---
printf '"%s" "%s"\n' "$DB_USER" "$DB_PASS" > /etc/pgbouncer/userlist.txt

# --- Generate pgbouncer.ini from template ---
sed \
    -e "s|{{DB_HOST}}|${DB_HOST}|g" \
    -e "s|{{DB_PORT}}|${DB_PORT}|g" \
    -e "s|{{DB_NAME}}|${DB_NAME}|g" \
    -e "s|{{DB_USER}}|${DB_USER}|g" \
    -e "s|{{POOL_MODE}}|${POOL_MODE}|g" \
    -e "s|{{AUTH_TYPE}}|${AUTH_TYPE}|g" \
    -e "s|{{DEFAULT_POOL_SIZE}}|${DEFAULT_POOL_SIZE}|g" \
    -e "s|{{MIN_POOL_SIZE}}|${MIN_POOL_SIZE}|g" \
    -e "s|{{RESERVE_POOL_SIZE}}|${RESERVE_POOL_SIZE}|g" \
    -e "s|{{MAX_CLIENT_CONN}}|${MAX_CLIENT_CONN}|g" \
    -e "s|{{MAX_DB_CONNECTIONS}}|${MAX_DB_CONNECTIONS}|g" \
    -e "s|{{APP_NAME}}|${APP_NAME}|g" \
    -e "s|{{ADMIN_USERS}}|${ADMIN_USERS}|g" \
    -e "s|{{STATS_USERS}}|${STATS_USERS}|g" \
    -e "/{{TLS_CONFIG}}/{
        r ${TLS_FILE}
        d
    }" \
    /etc/pgbouncer/pgbouncer.ini.template > /etc/pgbouncer/pgbouncer.ini

rm -f "$TLS_FILE"

echo "pgbouncer: starting on port 6432"
exec pgbouncer /etc/pgbouncer/pgbouncer.ini
