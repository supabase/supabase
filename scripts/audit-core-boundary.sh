#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

fail=0
finding() { echo "FINDING: $*"; fail=1; }
ok() { echo "OK: $*"; }

echo "=== Testagram Core Docker/Runtime Boundary Audit ==="
echo "commit: $(git rev-parse HEAD)"
echo

services=(postgres auth postgrest realtime storage edge-runtime supavisor postgres-meta)
for service in "${services[@]}"; do
  if [[ -d "core/services/$service" ]]; then
    ok "service source exists: core/services/$service"
  else
    finding "missing service source: core/services/$service"
  fi
done

echo
echo "--- runtime images that still need ownership review ---"
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  echo "$line"
done < <(grep -RInE '^[[:space:]]*image:[[:space:]]*(supabase/|postgrest/)' docker --include='*.yml' --include='*.yaml' || true)

echo
echo "--- hosted project configuration ---"
if grep -nE '^\[remotes\.' supabase/config.toml; then
  finding "hosted/remote project configuration remains in supabase/config.toml"
else
  ok "no remotes.prod/project binding in supabase/config.toml"
fi

echo
echo "--- hosted Supabase runtime references ---"
runtime_hits="$(
  grep -RInE 'https?://[^[:space:]"]*supabase\.co' supabase docker scripts core/services/postgres/ansible/files/admin_api_scripts --include='*.toml' --include='*.yml' --include='*.yaml' --include='*.sh' --include='*.env' --include='*.json' 2>/dev/null |
  grep -vE ':[[:space:]]*#' || true
)"
if [[ -n "$runtime_hits" ]]; then
  echo "$runtime_hits"
  finding "Supabase hosted .co endpoints remain in runtime/configuration code"
else
  ok "no Supabase hosted .co endpoints found in runtime/configuration code"
fi

echo
echo "--- default/example credentials ---"
if [[ -f docker/.env.example ]] && grep -nE 'your-super-secret|this_password_is_insecure|secret1234' docker/.env.example; then
  echo "INFO: example credentials are present in docker/.env.example; deployment must never promote them."
else
  ok "no known insecure placeholder credentials found"
fi

echo
echo "--- Postgres version consistency ---"
compose_version="$(grep -E 'image:[[:space:]]*supabase/postgres:' docker/docker-compose.yml | sed -E 's/.*supabase\/postgres:([0-9]+).*/\1/' | head -n1)"
cli_version="$(grep -E '^major_version[[:space:]]*=' supabase/config.toml | sed -E 's/[^0-9]*([0-9]+).*/\1/')"
if [[ -n "$compose_version" && -n "$cli_version" && "$compose_version" == "$cli_version" ]]; then
  ok "Postgres major version agrees: $compose_version"
else
  finding "Postgres major version mismatch: Compose=$compose_version CLI=$cli_version"
fi

echo
echo "--- submodules ---"
if [[ -f .gitmodules ]]; then
  finding ".gitmodules exists; imported services should remain ordinary repository content"
else
  ok "no git submodules"
fi

echo
if [[ "$fail" -ne 0 ]]; then
  echo "AUDIT RESULT: FAIL"
  exit 1
fi
echo "AUDIT RESULT: PASS"
