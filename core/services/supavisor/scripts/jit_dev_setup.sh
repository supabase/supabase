#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CERT_DIR="$PROJECT_ROOT/priv/jit/postgres/certs"
CERT_SCRIPT="$CERT_DIR/generate_test_certs.sh"
CA_CERT="$CERT_DIR/ca.crt"
SERVER_CERT="$CERT_DIR/server.crt"
SERVER_KEY="$CERT_DIR/server.key"

JWT="Bearer TEST_JWT_REDACTED"
API_URL="http://localhost:4000"
TENANT_ID="jit_dev_tenant"

echo "=== JIT Dev Setup ==="
echo ""

# 1. Check Supavisor is running
echo "[1/6] Checking Supavisor dev is running..."
HTTP_STATUS=$(curl -s -o /dev/null -w '%{http_code}' \
  "$API_URL/api/tenants/$TENANT_ID" \
  -H "Authorization: $JWT" 2>/dev/null || true)

if [ "$HTTP_STATUS" = "000" ] || [ -z "$HTTP_STATUS" ]; then
  echo "ERROR: Cannot reach Supavisor API at $API_URL"
  echo "Make sure Supavisor is running: mise run dev"
  exit 1
fi
echo "✓ Supavisor API is reachable (HTTP $HTTP_STATUS)"
echo ""

# 2. Generate certificates
echo "[2/6] Generating certificates..."
if [ -f "$CA_CERT" ]; then
  echo "✓ Certificates already exist"
else
  chmod +x "$CERT_SCRIPT"
  "$CERT_SCRIPT" "$CERT_DIR"
  echo "✓ Certificates generated"
fi
echo ""

# 3. Start Docker Compose
echo "[3/6] Starting Docker Compose services..."
cd "$PROJECT_ROOT"
docker-compose -p supavisor-jit -f docker-compose.jit.yml up -d
echo "✓ Docker Compose services started"
echo ""

# 4. Wait for services
echo "[4/6] Waiting for services to be ready..."
MAX_ATTEMPTS=30
for i in $(seq 1 $MAX_ATTEMPTS); do
  PG_READY=false
  API_READY=false

  if docker-compose -p supavisor-jit -f docker-compose.jit.yml exec -T db pg_isready -U postgres >/dev/null 2>&1; then
    PG_READY=true
  fi

  if curl -sf -o /dev/null "http://localhost:8080/health" 2>/dev/null; then
    API_READY=true
  fi

  if [ "$PG_READY" = true ] && [ "$API_READY" = true ]; then
    echo "✓ PostgreSQL is ready"
    echo "✓ JIT API is ready"
    break
  fi

  if [ "$i" -eq "$MAX_ATTEMPTS" ]; then
    echo "ERROR: Services failed to start after $MAX_ATTEMPTS attempts"
    [ "$PG_READY" = false ] && echo "  - PostgreSQL not ready"
    [ "$API_READY" = false ] && echo "  - JIT API not ready"
    exit 1
  fi

  echo "  Attempt $i/$MAX_ATTEMPTS: waiting..."
  sleep 1
done
echo ""

# 5. Configure downstream certs
echo "[5/6] Configuring downstream certificates..."
echo ""
echo "  Paste the following in your Supavisor IEx shell:"
echo ""
echo "    Application.put_env(:supavisor, :global_downstream_cert, \"$SERVER_CERT\")"
echo "    Application.put_env(:supavisor, :global_downstream_key, \"$SERVER_KEY\")"
echo ""
read -p "  Press Enter after pasting the commands... "
echo "✓ Downstream certs configured"
echo ""

# 6. Create JIT tenant
echo "[6/6] Creating JIT tenant..."

CA_PEM=$(cat "$CA_CERT")

HTTP_CODE=$(curl -s -o /tmp/jit_tenant_response.json -w '%{http_code}' \
  -X PUT \
  "$API_URL/api/tenants/$TENANT_ID" \
  -H "Authorization: $JWT" \
  -H "Content-Type: application/json" \
  -d @- <<EOFPAYLOAD
{
  "tenant": {
    "db_host": "localhost",
    "db_port": 7543,
    "db_database": "postgres",
    "ip_version": "auto",
    "require_user": false,
    "auth_query": "SELECT rolname, rolpassword FROM pg_authid WHERE rolname=\$1",
    "upstream_ssl": true,
    "upstream_verify": "peer",
    "upstream_tls_ca": $(echo "$CA_PEM" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))'),
    "enforce_ssl": false,
    "use_jit": true,
    "jit_api_url": "http://localhost:8080/projects/odvmrtdcoyfyvfrdxzsj/database/jit",
    "default_pool_size": 3,
    "users": [
      {
        "db_user": "postgres",
        "db_password": "postgres",
        "pool_size": 3,
        "mode_type": "transaction",
        "is_manager": true
      }
    ]
  }
}
EOFPAYLOAD
)

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
  echo "✓ Tenant '$TENANT_ID' created (HTTP $HTTP_CODE)"
else
  echo "ERROR: Failed to create tenant (HTTP $HTTP_CODE)"
  cat /tmp/jit_tenant_response.json
  echo ""
  exit 1
fi
echo ""

# Print connection strings
echo "=== Connection Strings ==="
echo ""
echo "# SCRAM auth (regular password):"
echo "psql \"postgresql://postgres.${TENANT_ID}:postgres@localhost:6543/postgres?sslmode=verify-full&sslrootcert=${CA_CERT}\""
echo ""
echo "# JIT auth (valid token):"
echo "psql \"postgresql://postgres.${TENANT_ID}:sbp_TEST_TOKEN_REDACTED@localhost:6543/postgres?sslmode=verify-full&sslrootcert=${CA_CERT}\""
echo ""
echo "# Non-JIT role (supabase_admin, scram-sha-256):"
echo "psql \"postgresql://supabase_admin.${TENANT_ID}:TEST_SUPAVISOR_PASSWORD@localhost:6543/postgres?sslmode=verify-full&sslrootcert=${CA_CERT}\""
echo ""
echo "# --- Tokens that should FAIL ---"
echo ""
echo "# Wrong token:"
echo "psql \"postgresql://postgres.${TENANT_ID}:sbp_TEST_TOKEN_REDACTED@localhost:6543/postgres?sslmode=verify-full&sslrootcert=${CA_CERT}\""
echo ""
echo "# Forbidden (403):"
echo "psql \"postgresql://postgres.${TENANT_ID}:sbp_TEST_TOKEN_REDACTED@localhost:6543/postgres?sslmode=verify-full&sslrootcert=${CA_CERT}\""
echo ""
echo "# API error (503):"
echo "psql \"postgresql://postgres.${TENANT_ID}:sbp_TEST_TOKEN_REDACTED@localhost:6543/postgres?sslmode=verify-full&sslrootcert=${CA_CERT}\""
echo ""
echo "=== Cleanup ==="
echo "To stop: mise run jit:stop"
echo "To delete tenant: curl -X DELETE '$API_URL/api/tenants/$TENANT_ID' -H 'Authorization: $JWT'"
