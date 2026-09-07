#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PACKAGE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DB_DIR="$SCRIPT_DIR/db"

# Unique project name per worktree so containers don't collide
PROJECT_HASH=$(echo "$PACKAGE_DIR" | shasum | cut -c1-8)
COMPOSE_PROJECT_NAME="pg-meta-${PROJECT_HASH}"
export COMPOSE_PROJECT_NAME

# Find an available port in the range 5432-5531
PG_TEST_PORT=5432
MAX_PORT=5531
while nc -z localhost "$PG_TEST_PORT" 2>/dev/null; do
  if [ "$PG_TEST_PORT" -ge "$MAX_PORT" ]; then
    echo "error: no available port found in range 5432-${MAX_PORT}" >&2
    exit 1
  fi
  PG_TEST_PORT=$((PG_TEST_PORT + 1))
done
export PG_TEST_PORT

DATABASE_URL="postgresql://postgres:postgres@localhost:${PG_TEST_PORT}"
export DATABASE_URL

cleanup() {
  cd "$DB_DIR"
  docker compose down 2>/dev/null || true
}
trap cleanup EXIT

cd "$DB_DIR"
docker compose down 2>/dev/null || true
docker compose up --detach --wait

cd "$PACKAGE_DIR"
"$@"
rc=$?
exit $rc
