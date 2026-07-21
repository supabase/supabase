#!/usr/bin/env bash

set -euo pipefail

ENV_FILE="${SYNC_ENV_FILE:-/env/.env}"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

MODE="${1:-all}"
LOG_DIR="/var/log/supabase-sync"
mkdir -p "$LOG_DIR"

timestamp() {
  date '+%Y-%m-%d %H:%M:%S'
}

log() {
  echo "[$(timestamp)] $*"
}

check_endpoint() {
  local name="$1"
  local url="$2"
  local code

  if [[ -z "$url" ]]; then
    log "$name endpoint is not configured"
    return 1
  fi

  code="$(curl -k -L -sS -o /dev/null -w '%{http_code}' "${url%/}/auth/v1/health" || true)"
  if [[ "$code" == "200" ]]; then
    log "$name auth health is reachable"
    return 0
  fi

  log "$name auth health returned code: ${code:-unreachable}"
  return 1
}

write_snapshot() {
  local snapshot="${LOG_DIR}/sync-status.txt"
  {
    echo "timestamp=$(timestamp)"
    echo "local_storage=${LOCAL_STORAGE_PATH:-/data}"
    echo "cloud1_url=${CLOUD1_SUPABASE_URL:-}"
    echo "cloud1_bucket=${CLOUD1_BUCKET:-}"
    echo "cloud2_url=${CLOUD2_SUPABASE_URL:-}"
    echo "cloud2_bucket=${CLOUD2_BUCKET:-}"
  } > "$snapshot"
}

run_all() {
  log "sync-manager preflight started"
  write_snapshot
  check_endpoint "cloud1" "${CLOUD1_SUPABASE_URL:-}" || true
  check_endpoint "cloud2" "${CLOUD2_SUPABASE_URL:-}" || true
  log "sync-manager preflight finished"
}

case "$MODE" in
  all|preflight)
    run_all
    ;;
  health)
    check_endpoint "cloud1" "${CLOUD1_SUPABASE_URL:-}" || true
    check_endpoint "cloud2" "${CLOUD2_SUPABASE_URL:-}" || true
    ;;
  *)
    log "unknown mode: $MODE"
    exit 1
    ;;
esac
