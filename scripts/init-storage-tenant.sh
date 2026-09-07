#!/bin/bash
# Initialize Storage tenant for a new database.
# Creates the storage schema and required tables in the target PostgreSQL instance,
# then registers the tenant in the shared Storage API if MULTI_TENANT=true.
#
# Usage:
#   ./scripts/init-storage-tenant.sh \
#     --ref project-alpha \
#     --host db-alpha \
#     --password secret \
#     [--database postgres] \
#     [--port 5432] \
#     [--storage-backend file|s3]
#
# Prerequisites:
#   - psql available in PATH
#   - supabase_storage_admin role already exists in the target DB
#     (run scripts/init-database.sh first if this is a brand-new instance)

set -euo pipefail

REF=""
HOST=""
PASSWORD=""
DATABASE="postgres"
PORT=5432
STORAGE_BACKEND="${STORAGE_BACKEND:-file}"
STORAGE_FILE_BACKEND_PATH="${STORAGE_FILE_BACKEND_PATH:-/var/lib/storage}"

while [[ "$#" -gt 0 ]]; do
  case $1 in
    --ref)      REF="$2";      shift ;;
    --host)     HOST="$2";     shift ;;
    --password) PASSWORD="$2"; shift ;;
    --database) DATABASE="$2"; shift ;;
    --port)     PORT="$2";     shift ;;
    *) echo "Unknown parameter: $1"; exit 1 ;;
  esac
  shift
done

if [[ -z "$REF" || -z "$HOST" || -z "$PASSWORD" ]]; then
  echo "Error: --ref, --host, and --password are required."
  echo "Usage: $0 --ref <ref> --host <host> --password <password> [--database postgres] [--port 5432]"
  exit 1
fi

DSN="postgresql://supabase_storage_admin:${PASSWORD}@${HOST}:${PORT}/${DATABASE}"

echo "=== Initializing Storage tenant: $REF ==="
echo "    Host:     ${HOST}:${PORT}"
echo "    Database: $DATABASE"

# ── 1. Apply storage schema to target database ────────────────────────────────
echo ""
echo "[1/3] Creating storage schema and tables in ${HOST}/${DATABASE}..."

PGPASSWORD="$PASSWORD" psql "$DSN" << 'EOSQL'

-- ── Schema ──────────────────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS storage;

-- ── Buckets ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS storage.buckets (
  id                  TEXT        NOT NULL PRIMARY KEY,
  name                TEXT        NOT NULL,
  owner               UUID,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  public              BOOLEAN     DEFAULT FALSE,
  avif_autodetection  BOOLEAN     DEFAULT FALSE,
  file_size_limit     BIGINT,
  allowed_mime_types  TEXT[],
  owner_id            TEXT
);

-- ── Objects ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS storage.objects (
  id               UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bucket_id        TEXT        REFERENCES storage.buckets(id),
  name             TEXT,
  owner            UUID,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  metadata         JSONB,
  path_tokens      TEXT[]      GENERATED ALWAYS AS (string_to_array(name, '/')) STORED,
  version          TEXT,
  owner_id         TEXT,
  user_metadata    JSONB
);

-- ── Migrations tracker (keeps Storage API happy) ────────────────────────────
CREATE TABLE IF NOT EXISTS storage.migrations (
  id          INTEGER   NOT NULL,
  name        VARCHAR   NOT NULL UNIQUE,
  hash        VARCHAR   NOT NULL,
  executed_at TIMESTAMP DEFAULT NOW()
);

-- ── Grants ──────────────────────────────────────────────────────────────────
GRANT USAGE                      ON SCHEMA  storage                 TO supabase_storage_admin;
GRANT ALL                        ON TABLE   storage.buckets         TO supabase_storage_admin;
GRANT ALL                        ON TABLE   storage.objects         TO supabase_storage_admin;
GRANT ALL                        ON TABLE   storage.migrations      TO supabase_storage_admin;
GRANT ALL                        ON SEQUENCE storage.migrations_id_seq TO supabase_storage_admin;

-- Allow authenticated and anon roles to use storage schema (for RLS policies)
GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;
GRANT SELECT ON storage.buckets  TO anon, authenticated, service_role;
GRANT SELECT ON storage.objects  TO anon, authenticated, service_role;

-- ── Default RLS policies ─────────────────────────────────────────────────────
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Public buckets: anyone can read objects
CREATE POLICY IF NOT EXISTS "Public read on public buckets"
  ON storage.objects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM storage.buckets b
      WHERE b.id = storage.objects.bucket_id
        AND b.public = TRUE
    )
  );

EOSQL

echo "    Done."

# ── 2. Create local storage directory if using file backend ──────────────────
if [[ "$STORAGE_BACKEND" == "file" ]]; then
  echo ""
  echo "[2/3] Creating file storage directory for tenant ${REF}..."
  TENANT_DIR="${STORAGE_FILE_BACKEND_PATH}/${REF}"
  mkdir -p "$TENANT_DIR"
  echo "    Created: $TENANT_DIR"
else
  echo ""
  echo "[2/3] S3 backend in use — skipping local directory creation."
fi

# ── 3. Register tenant with shared Storage API (MULTI_TENANT mode) ───────────
echo ""
echo "[3/3] Storage tenant initialized."
echo ""
echo "Next steps:"
echo "  - If running MULTI_TENANT=true Storage API, no further registration is needed."
echo "    The Storage API reads tenant_id from the JWT or uses TENANT_ID env var."
echo "  - If running per-database Storage (Option B), add a storage-${REF} service"
echo "    by running: python3 scripts/generate-compose-storage.py | tee docker/docker-compose.storage.yml"
echo "  - Ensure DATABASE_URL for the storage container points to ${HOST}:${PORT}/${DATABASE}"
echo ""
echo "=== Storage tenant '${REF}' initialized successfully. ==="