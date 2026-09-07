#!/bin/bash
# Full end-to-end provisioning of a new Supabase database
# Usage: ./scripts/provision-database.sh --ref myproject --name "My Project" --host db-myproject --password secret
#
# This script:
#   1. Initializes a fresh PostgreSQL DB with all Supabase schemas (init-database.sh)
#   2. Registers the database in the registry   (add-database.sh)
#   3. Regenerates the Docker Compose overlay   (generate-multi.py)
set -e

REF=""
NAME=""
HOST=""
PORT=5432
DATABASE="postgres"
PASSWORD=""
SUPERUSER="postgres"

while [[ "$#" -gt 0 ]]; do
  case $1 in
    --ref)       REF="$2";       shift ;;
    --name)      NAME="$2";      shift ;;
    --host)      HOST="$2";      shift ;;
    --port)      PORT="$2";      shift ;;
    --database)  DATABASE="$2";  shift ;;
    --password)  PASSWORD="$2";  shift ;;
    --superuser) SUPERUSER="$2"; shift ;;
    *) echo "Unknown param: $1"; exit 1 ;;
  esac
  shift
done

# ── Validation ────────────────────────────────────────────────────────────────
missing=()
[ -z "$REF"      ] && missing+=("--ref")
[ -z "$NAME"     ] && missing+=("--name")
[ -z "$HOST"     ] && missing+=("--host")
[ -z "$PASSWORD" ] && missing+=("--password")

if [ "${#missing[@]}" -gt 0 ]; then
  echo "Error: missing required parameters: ${missing[*]}"
  echo ""
  echo "Usage: $0 --ref <ref> --name <name> --host <host> --password <password>"
  echo "          [--port 5432] [--database postgres] [--superuser postgres]"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Provisioning Supabase database: $REF ==="
echo ""

# ── Step 1: Initialize the database ──────────────────────────────────────────
echo "--- Step 1/3: Initializing database schemas ---"
bash "$SCRIPT_DIR/init-database.sh" \
  --host      "$HOST"      \
  --port      "$PORT"      \
  --database  "$DATABASE"  \
  --password  "$PASSWORD"  \
  --superuser "$SUPERUSER" \
  --yes

# ── Step 2: Add to registry ───────────────────────────────────────────────────
echo ""
echo "--- Step 2/3: Registering database in registry ---"

ADD_SCRIPT="$SCRIPT_DIR/add-database.sh"
if [ ! -f "$ADD_SCRIPT" ]; then
  echo "WARNING: $ADD_SCRIPT not found. Skipping registry step."
  echo "         Add the entry to docker/volumes/registry/databases.json manually."
else
  bash "$ADD_SCRIPT" \
    --ref      "$REF"      \
    --name     "$NAME"     \
    --host     "$HOST"     \
    --port     "$PORT"     \
    --database "$DATABASE" \
    --password "$PASSWORD"
fi

# ── Step 3: Regenerate Docker Compose overlay ─────────────────────────────────
echo ""
echo "--- Step 3/3: Regenerating Docker Compose overlay ---"

GENERATE_SCRIPT="$SCRIPT_DIR/../docker/generate-multi.py"
if [ ! -f "$GENERATE_SCRIPT" ]; then
  echo "WARNING: $GENERATE_SCRIPT not found. Skipping compose regeneration."
  echo "         Run it manually when available."
else
  (cd "$SCRIPT_DIR/../docker" && python3 generate-multi.py)
fi

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "=== Done! Database '$REF' ($NAME) is ready. ==="
echo ""
echo "Start its services:"
echo "  docker compose -f docker/docker-compose.yml -f docker/docker-compose.multi.yml \\"
echo "    up -d auth-$REF rest-$REF realtime-$REF storage-$REF"
echo ""