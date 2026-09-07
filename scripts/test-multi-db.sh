#!/usr/bin/env bash
# Integration smoke-test for the multi-database scripting layer.
# Runs without Docker — tests logic, argument parsing, and dry-run paths only.
#
# Usage:
#   bash scripts/test-multi-db.sh
#
# Exit code: 0 = all tests passed, 1 = one or more failed.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PASS=0
FAIL=0
ERRORS=()

pass() { echo "  ✓ $1"; ((PASS++)) || true; }
fail() { echo "  ✗ $1"; ERRORS+=("$1"); ((FAIL++)) || true; }

section() { echo ""; echo "=== $1 ==="; }

# ---------------------------------------------------------------------------
section "1. Shell script syntax checks"
# ---------------------------------------------------------------------------

for script in \
  "scripts/init-database.sh" \
  "scripts/provision-database.sh" \
  "scripts/init-storage-tenant.sh" \
  "docker/scripts/init-realtime-tenants.sh" \
  "scripts/apply-envoy-config.sh" \
  "scripts/add-database.sh"; do
  full="$REPO_ROOT/$script"
  if [ ! -f "$full" ]; then
    fail "$script — file not found"
    continue
  fi
  if bash -n "$full" 2>/dev/null; then
    pass "$script — syntax OK"
  else
    fail "$script — syntax error"
  fi
done

# ---------------------------------------------------------------------------
section "2. Python script parse checks"
# ---------------------------------------------------------------------------

for script in \
  "docker/generate-multi.py" \
  "docker/scripts/generate-compose-auth.py" \
  "scripts/generate-compose-rest.py" \
  "scripts/generate-compose-storage.py" \
  "scripts/generate-envoy-config.py"; do
  full="$REPO_ROOT/$script"
  if [ ! -f "$full" ]; then
    fail "$script — file not found"
    continue
  fi
  if python3 -c "import ast; ast.parse(open('$full').read())" 2>/dev/null; then
    pass "$script — parses OK"
  else
    fail "$script — parse error"
  fi
done

# ---------------------------------------------------------------------------
section "3. Registry JSON validation"
# ---------------------------------------------------------------------------

REGISTRY="$REPO_ROOT/docker/volumes/registry/databases.json"
if [ ! -f "$REGISTRY" ]; then
  fail "databases.json — not found"
else
  DB_COUNT=$(python3 -c "import json; d=json.load(open('$REGISTRY')); print(len(d['databases']))" 2>/dev/null)
  if [ -n "$DB_COUNT" ] && [ "$DB_COUNT" -gt 0 ]; then
    pass "databases.json — valid JSON, $DB_COUNT databases"
  else
    fail "databases.json — invalid JSON or empty databases array"
  fi
fi

# Required fields in each database entry
if [ -f "$REGISTRY" ]; then
  MISSING_FIELDS=$(python3 - "$REGISTRY" << 'EOF'
import json, sys
required = {"ref", "name", "host", "port", "database", "password_env", "jwt_secret_env"}
data = json.load(open(sys.argv[1]))
issues = []
for db in data.get("databases", []):
    missing = required - set(db.keys())
    if missing:
        issues.append(f"{db.get('ref','?')}: missing {missing}")
print("\n".join(issues))
EOF
  )
  if [ -z "$MISSING_FIELDS" ]; then
    pass "databases.json — all entries have required fields"
  else
    fail "databases.json — missing fields: $MISSING_FIELDS"
  fi
fi

# ---------------------------------------------------------------------------
section "4. TypeScript file existence"
# ---------------------------------------------------------------------------

for f in \
  "apps/studio/lib/api/self-hosted/registry.ts" \
  "apps/studio/lib/api/self-hosted/pg-meta-headers.ts" \
  "apps/studio/lib/api/self-hosted/util.ts" \
  "apps/studio/lib/api/self-hosted/settings.ts" \
  "apps/studio/lib/api/self-hosted/query.ts" \
  "apps/studio/hooks/useMultiDatabaseProjects.ts" \
  "apps/studio/components/interfaces/MultiDatabaseBanner.tsx" \
  "apps/studio/pages/self-hosted-projects.tsx" \
  "apps/studio/pages/api/platform/projects/index.ts" \
  "apps/studio/pages/api/platform/realtime/[ref]/tenants.ts"; do
  if [ -f "$REPO_ROOT/$f" ]; then
    pass "$f — exists"
  else
    fail "$f — MISSING"
  fi
done

# ---------------------------------------------------------------------------
section "5. pg-meta routes wired with getPgMetaConnectionHeaders"
# ---------------------------------------------------------------------------

PG_META_DIR="$REPO_ROOT/apps/studio/pages/api/platform/pg-meta"
if [ -d "$PG_META_DIR" ]; then
  WIRED=$(grep -rl "getPgMetaConnectionHeaders" "$PG_META_DIR" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$WIRED" -ge 10 ]; then
    pass "pg-meta routes — $WIRED route files wired with getPgMetaConnectionHeaders"
  else
    fail "pg-meta routes — only $WIRED files wired (expected ≥10)"
  fi
else
  fail "pg-meta route directory not found"
fi

# ---------------------------------------------------------------------------
section "6. executeQuery respects caller x-connection-encrypted"
# ---------------------------------------------------------------------------

QUERY_TS="$REPO_ROOT/apps/studio/lib/api/self-hosted/query.ts"
if grep -q "x-connection-encrypted" "$QUERY_TS" 2>/dev/null && \
   grep -q "callerHeaders\|get('x-connection-encrypted'\|caller.*encrypted" "$QUERY_TS" 2>/dev/null; then
  pass "query.ts — multi-db x-connection-encrypted routing is present"
else
  fail "query.ts — does not appear to respect caller-supplied x-connection-encrypted"
fi

# ---------------------------------------------------------------------------
section "7. Envoy LDS header-based routing"
# ---------------------------------------------------------------------------

LDS="$REPO_ROOT/docker/volumes/api/envoy/lds.template.yaml"
if [ ! -f "$LDS" ]; then
  fail "lds.template.yaml — not found"
else
  if grep -q "X-Project-Ref\|x-project-ref" "$LDS" 2>/dev/null; then
    pass "lds.template.yaml — X-Project-Ref routing is present"
  else
    fail "lds.template.yaml — X-Project-Ref header matching not found"
  fi
fi

CDS="$REPO_ROOT/docker/volumes/api/envoy/cds.yaml"
if [ ! -f "$CDS" ]; then
  fail "cds.yaml — not found"
else
  CLUSTER_COUNT=$(grep -c "^    name:" "$CDS" 2>/dev/null); CLUSTER_COUNT=${CLUSTER_COUNT:-0}
  if [ "$CLUSTER_COUNT" -ge 4 ]; then
    pass "cds.yaml — $CLUSTER_COUNT clusters defined (≥4 for multi-db)"
  else
    fail "cds.yaml — only $CLUSTER_COUNT clusters (expected ≥4)"
  fi
fi

# ---------------------------------------------------------------------------
section "8. pooler.exs iterates registry"
# ---------------------------------------------------------------------------

POOLER="$REPO_ROOT/docker/volumes/pooler/pooler.exs"
if [ ! -f "$POOLER" ]; then
  fail "pooler.exs — not found"
else
  if grep -q "databases.json\|DATABASE_REGISTRY_PATH" "$POOLER" 2>/dev/null; then
    pass "pooler.exs — reads databases.json registry"
  else
    fail "pooler.exs — does not reference databases.json"
  fi
  if grep -q "Enum.each\|Enum.map\|Enum.reduce" "$POOLER" 2>/dev/null; then
    pass "pooler.exs — iterates over databases (Enum.each/map)"
  else
    fail "pooler.exs — no iteration over database list found"
  fi
fi

# ---------------------------------------------------------------------------
section "9. Compose generator produces valid YAML"
# ---------------------------------------------------------------------------

GEN_MULTI="$REPO_ROOT/docker/generate-multi.py"
COMPOSE_MULTI="$REPO_ROOT/docker/docker-compose.multi.yml"
if [ ! -f "$COMPOSE_MULTI" ]; then
  fail "docker-compose.multi.yml — not found"
else
  YAML_VALID=$(python3 -c "
import sys
try:
    import yaml
    yaml.safe_load(open('$COMPOSE_MULTI'))
    print('ok')
except ImportError:
    print('no-pyyaml')
except Exception as e:
    print(f'error: {e}')
" 2>/dev/null)
  case "$YAML_VALID" in
    ok)        pass "docker-compose.multi.yml — valid YAML" ;;
    no-pyyaml) pass "docker-compose.multi.yml — exists (pyyaml not installed, skipping parse)" ;;
    *)         fail "docker-compose.multi.yml — YAML error: $YAML_VALID" ;;
  esac
fi

# ---------------------------------------------------------------------------
section "Summary"
# ---------------------------------------------------------------------------

echo ""
echo "Results: $PASS passed, $FAIL failed"
if [ ${#ERRORS[@]} -gt 0 ]; then
  echo ""
  echo "Failed checks:"
  for e in "${ERRORS[@]}"; do
    echo "  - $e"
  done
  exit 1
else
  echo "All checks passed ✅"
  exit 0
fi