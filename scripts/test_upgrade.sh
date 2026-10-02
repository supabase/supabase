#!/usr/bin/env bash
set -euo pipefail

# ── Config ───────────────────────────────────────────────────────────
FROM="${1:?Usage: $0 <from_version>  (e.g. 2.8.8)}"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
REL_BIN="_build/prod/rel/supavisor/bin/supavisor"
API_PORT=4000
API_URL="http://127.0.0.1:${API_PORT}"
JWT="TEST_JWT_REDACTED"
TENANT="upgrade_test_tenant"

export MIX_ENV=prod
export NODE_NAME="node1"
export NODE_IP="127.0.0.1"
export VAULT_ENC_KEY="aHD8DZRdk2emnkdktFZRh3E9RNg4aOY7"
export API_JWT_SECRET=dev
export METRICS_JWT_SECRET=dev
export REGION=eu
export FLY_ALLOC_ID=111e4567-e89b-12d3-a456-426614174000
export SECRET_KEY_BASE="dev"
export CLUSTER_POSTGRES="true"
export DB_POOL_SIZE="5"
export RELEASE_COOKIE="upgrade_test_cookie"

CERTS_DIR="$(git rev-parse --show-toplevel)/priv/test/certs"
export GLOBAL_DOWNSTREAM_CERT_PATH="${CERTS_DIR}/server_rsa.crt"
export GLOBAL_DOWNSTREAM_KEY_PATH="${CERTS_DIR}/server_rsa.key"
export DOWNSTREAM_SERVER_ECDSA_CERT="${CERTS_DIR}/server_ecdsa.crt"
export DOWNSTREAM_SERVER_ECDSA_KEY="${CERTS_DIR}/server_ecdsa.key"

# ── Helpers ──────────────────────────────────────────────────────────
info()  { echo "==> $*"; }

cleanup() {
  info "Cleaning up"
  [ -n "$BEAM_PID" ] && kill -9 "$BEAM_PID" 2>/dev/null || true
}
BEAM_PID=""
trap cleanup EXIT

wait_for_api() {
  info "Waiting for API readiness"
  for i in $(seq 1 30); do
    if curl -s -o /dev/null -w '' "${API_URL}/api/health" 2>/dev/null; then
      return 0
    fi
    sleep 1
  done
  echo "API did not become ready in 30s"
  exit 1
}

create_tenant() {
  info "Creating test tenant"
  curl -s -X PUT "${API_URL}/api/tenants/${TENANT}" \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer ${JWT}" \
    -d '{
    "tenant": {
      "db_host": "localhost",
      "db_port": 6432,
      "db_database": "postgres",
      "ip_version": "auto",
      "enforce_ssl": false,
      "require_user": false,
      "auth_query": "SELECT rolname, rolpassword FROM pg_authid WHERE rolname=$1;",
      "users": [
        {
          "db_user": "postgres",
          "db_password": "postgres",
          "pool_size": 10,
          "mode_type": "transaction",
          "is_manager": true
        }
      ]
    }
  }' > /dev/null
}

# ── 1. Clean & checkout base version ────────────────────────────────
info "Cleaning build artifacts"
rm -rf _build deps

info "Stashing local changes"
git stash --include-untracked || true

info "Checking out v${FROM}"
git checkout "v${FROM}"

# ── 2. Build base release ────────────────────────────────────────────
info "Building base release (v${FROM})"
mix deps.get --only prod
mix release supavisor --overwrite

# On macOS, BEAM rejects +JPperf (Linux-only). Older releases hard-coded it                   
# in vm.args before it was moved behind a Linux guard in env.sh.eex.                          
if [ "$(uname -s)" = "Darwin" ]; then                                                         
  VM_ARGS="_build/prod/rel/supavisor/releases/${FROM}/vm.args"                                
  if [ -f "$VM_ARGS" ] && grep -q '+JPperf true' "$VM_ARGS"; then                             
    info "Stripping +JPperf from ${VM_ARGS} (unsupported on macOS)"                           
    sed -i '' '/+JPperf true/d' "$VM_ARGS"                                                    
  fi                                                                                          
fi  

# ── 3. Start release & create tenant ────────────────────────────────
info "Starting release in background"
$REL_BIN start > /tmp/supavisor_upgrade_test.log 2>&1 &
BEAM_PID=$!
info "BEAM PID: ${BEAM_PID}"

wait_for_api
create_tenant

# ── 4. Wait for user to test manually ───────────────────────────────
REMOTE_CMD="RELEASE_COOKIE=upgrade_test_cookie NODE_NAME=node1 NODE_IP=127.0.0.1 _build/prod/rel/supavisor/bin/supavisor remote"
PSQL_CMD="psql postgresql://postgres.${TENANT}:postgres@127.0.0.1:6543/postgres"

echo ""
echo "========================================"
echo " Release v${FROM} running."
echo " Tenant '${TENANT}' created."
echo ""
echo " Remote shell:"
echo "   ${REMOTE_CMD}"
echo ""
echo " psql:"
echo "   ${PSQL_CMD}"
echo ""
echo " Press ENTER to continue the upgrade."
echo "========================================"
read -r

# ── 5. Build upgrade release ────────────────────────────────────────
info "Checking out branch: ${BRANCH}"
git checkout "$BRANCH"

info "Restoring stashed changes"
git stash pop || true

TO="$(cat VERSION)"

info "Building upgrade release (v${TO} from v${FROM})"
mix deps.get --only prod
UPGRADE_FROM="$FROM" mix release supavisor --overwrite

# ── 6. Deploy upgrade ───────────────────────────────────────────────
info "Deploying hot upgrade"
cp "_build/prod/supavisor-${TO}.tar.gz" "_build/prod/rel/supavisor/releases/"

$REL_BIN rpc ":release_handler.unpack_release(~c\"supavisor-${TO}\")"
$REL_BIN rpc ":release_handler.install_release(~c\"${TO}\")"
$REL_BIN rpc ":release_handler.make_permanent(~c\"${TO}\")"

echo ""
echo "========================================"
echo " Upgrade complete: v${FROM} -> v${TO}"
echo ""
echo " Remote shell:"
echo "   ${REMOTE_CMD}"
echo ""
echo " psql:"
echo "   ${PSQL_CMD}"
echo ""
echo " Press ENTER to stop the release."
echo "========================================"
read -r
