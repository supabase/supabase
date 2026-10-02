#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

echo "=== Testagram Core Boundary Audit ==="
echo "commit: $(git rev-parse HEAD)"
echo

services=(postgres auth postgrest realtime storage edge-runtime supavisor postgres-meta)
for service in "${services[@]}"; do
  test -d "core/services/$service"
  echo "OK service: core/services/$service"
done

echo
echo "--- upstream runtime image references ---"
grep -RInE '^[[:space:]]*image:[[:space:]]*(supabase/|postgrest/)' docker --include='*.yml' --include='*.yaml' || true

echo
echo "--- Supabase Cloud/project references ---"
grep -RInE 'supabase\.co|supabase\.com|\[remotes\.|project_id[[:space:]]*=' supabase docker core --include='*.toml' --include='*.yml' --include='*.yaml' --include='*.json' 2>/dev/null || true

echo
echo "--- production-dangerous placeholders in example env ---"
grep -nE 'your-super-secret|this_password_is_insecure|secret1234|admin@example\.com' docker/.env.example || true

echo
echo "--- submodule check ---"
if [[ -f .gitmodules ]]; then
  echo "WARNING: .gitmodules exists"
  cat .gitmodules
else
  echo "OK: no git submodules"
fi

echo
echo "Audit completed. Findings are documented in docs/TESTAGRAM-CORE-FORENSIC-AUDIT.md."
