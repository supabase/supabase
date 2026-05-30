#!/usr/bin/env bash
# pg-block.sh
#
# Reproducible DB-side faults for the auth-freeze rig.
#
# Modes:
#   sleep      Start N concurrent transactions each running `pg_sleep(SECONDS)`.
#              Simulates a slow upstream / vacuum freeze / RDS storage stall.
#              Each transaction holds a connection on the auth pool for SECONDS.
#
#   lock       BEGIN; SELECT … FROM auth.users FOR UPDATE NOWAIT; pg_sleep(SECONDS);
#              Simulates a long-running migration holding a row lock.
#
#   advisory   SELECT pg_advisory_lock(K); pg_sleep(SECONDS);
#              Cheap way to hold a single named lock that auth functions can
#              be wired to acquire.
#
# Required env (already present in the docker compose stack):
#   POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_PASSWORD
# Optional:
#   PG_BLOCK_USER  default supabase_auth_admin (so this counts against the
#                  same pool / role that auth uses).
#
# Usage:
#   ./pg-block.sh sleep    90 10     # 10 connections sleeping for 90s
#   ./pg-block.sh lock     60 1      # 1 row lock for 60s
#   ./pg-block.sh advisory 30
#
# Designed to be invoked from docker-compose.chaos.yml as a one-off
# `docker compose run --rm pg-block …`.

set -euo pipefail

MODE="${1:-sleep}"
SECS="${2:-60}"
COUNT="${3:-10}"

PGUSER="${PG_BLOCK_USER:-supabase_auth_admin}"
PGHOST="${POSTGRES_HOST:?POSTGRES_HOST required}"
PGPORT="${POSTGRES_PORT:?POSTGRES_PORT required}"
PGDATABASE="${POSTGRES_DB:?POSTGRES_DB required}"
PGPASSWORD="${POSTGRES_PASSWORD:?POSTGRES_PASSWORD required}"
export PGUSER PGHOST PGPORT PGDATABASE PGPASSWORD

log() { printf '[pg-block %s] %s\n' "$(date +%H:%M:%S)" "$*"; }

if ! command -v psql >/dev/null 2>&1; then
  echo "psql not found in PATH" >&2
  exit 2
fi

trap 'log "received signal, terminating helpers"; jobs -p | xargs -r kill 2>/dev/null || true' INT TERM

case "$MODE" in
  sleep)
    log "starting $COUNT concurrent pg_sleep($SECS) sessions as $PGUSER"
    for i in $(seq 1 "$COUNT"); do
      (
        # Each subshell holds its own connection. The BEGIN+pg_sleep+COMMIT
        # pattern guarantees the session is `idle in transaction`-like for the
        # full duration, which is what triggers idle_in_transaction_session_timeout
        # in patch 04 (good) and pool exhaustion in unpatched builds (bad).
        psql -v ON_ERROR_STOP=1 -X -q <<SQL
BEGIN;
SELECT pg_backend_pid() AS pid, $i AS slot, pg_sleep($SECS);
COMMIT;
SQL
      ) &
    done
    log "waiting for $COUNT sessions to finish"
    wait
    log "done"
    ;;

  lock)
    log "starting $COUNT FOR UPDATE locks on auth.users for $SECS s"
    for i in $(seq 1 "$COUNT"); do
      (
        psql -v ON_ERROR_STOP=1 -X -q <<SQL
BEGIN;
-- Grab the (probably) first row. Real long migrations grab many more.
SELECT id FROM auth.users ORDER BY created_at LIMIT 1 FOR UPDATE;
SELECT pg_sleep($SECS);
ROLLBACK;
SQL
      ) &
    done
    wait
    log "done"
    ;;

  advisory)
    KEY="${4:-424242}"
    log "advisory lock key=$KEY for $SECS s"
    psql -v ON_ERROR_STOP=1 -X -q <<SQL
SELECT pg_advisory_lock($KEY);
SELECT pg_sleep($SECS);
SELECT pg_advisory_unlock($KEY);
SQL
    log "done"
    ;;

  inspect)
    # Convenience: print the current state of supabase_auth_admin's pool from
    # the DB's perspective. Helpful while chaos is running.
    psql -v ON_ERROR_STOP=1 -X <<SQL
SELECT pid,
       state,
       wait_event_type,
       wait_event,
       age(now(), xact_start) AS xact_age,
       left(query, 80) AS query
FROM pg_stat_activity
WHERE usename = '$PGUSER'
ORDER BY xact_age DESC NULLS LAST;
SQL
    ;;

  *)
    echo "usage: $0 {sleep|lock|advisory|inspect} [seconds] [count]" >&2
    exit 2
    ;;
esac
