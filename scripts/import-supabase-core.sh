#!/usr/bin/env bash
set -euo pipefail

# Import production-relevant upstream services into this single repository.
# Git subtree keeps each service isolated; --squash records one reproducible source snapshot.
# Usage: bash scripts/import-supabase-core.sh
# Or:    bash scripts/import-supabase-core.sh --service realtime

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

declare -A URLS=(
  [postgres]="https://github.com/supabase/postgres.git"
  [auth]="https://github.com/supabase/auth.git"
  [postgrest]="https://github.com/PostgREST/postgrest.git"
  [realtime]="https://github.com/supabase/realtime.git"
  [storage]="https://github.com/supabase/storage.git"
  [edge-runtime]="https://github.com/supabase/edge-runtime.git"
  [supavisor]="https://github.com/supabase/supavisor.git"
  [postgres-meta]="https://github.com/supabase/postgres-meta.git"
)

declare -A PATHS=(
  [postgres]="core/services/postgres"
  [auth]="core/services/auth"
  [postgrest]="core/services/postgrest"
  [realtime]="core/services/realtime"
  [storage]="core/services/storage"
  [edge-runtime]="core/services/edge-runtime"
  [supavisor]="core/services/supavisor"
  [postgres-meta]="core/services/postgres-meta"
)

import_one() {
  local name="$1"
  local url="${URLS[$name]}"
  local path="${PATHS[$name]}"

  if [[ -e "$path" ]]; then
    echo "SKIP: $path already exists"
    return
  fi

  echo "IMPORT: $name -> $path"

  # Upstream repositories do not share one default branch name.
  # Resolve the repository's advertised HEAD instead of assuming master/main.
  local ref
  ref="$(git ls-remote --symref "$url" HEAD 2>/dev/null | awk '/^ref:/ {sub("refs/heads/","",$2); print $2; exit}')"
  if [[ -z "$ref" ]]; then
    echo "ERROR: could not determine default branch for $name ($url)" >&2
    exit 1
  fi
  echo "IMPORT: $name default branch -> $ref"

  # GitHub push protection can reject upstream test fixtures that contain
  # token-shaped credentials. Because --squash creates a new synthetic commit
  # from the imported tree, sanitize only the known fixture credential forms
  # before that commit is created. This does not modify the upstream repository.
  local tmp
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' RETURN
  git clone --quiet --depth 1 --branch "$ref" "$url" "$tmp/repo"

  if [[ "$name" == "supavisor" ]]; then
    python3 - "$tmp/repo" <<'PY'
import pathlib
import re
import sys

root = pathlib.Path(sys.argv[1])
sbp = re.compile(r"sbp_[A-Za-z0-9_-]{20,}")
bearer_jwt = re.compile(r"Bearer eyJ[A-Za-z0-9._-]+")
known_passwords = {
    "56lRXbZStSL9vY3cJJxLZd5wQxpWvfl9": "TEST_SUPAVISOR_PASSWORD",
}

for path in root.rglob("*"):
    if ".git" in path.parts or not path.is_file():
        continue
    try:
        data = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        continue

    updated = sbp.sub("sbp_TEST_TOKEN_REDACTED", data)
    updated = bearer_jwt.sub("Bearer TEST_JWT_REDACTED", updated)
    for old, replacement in known_passwords.items():
        updated = updated.replace(old, replacement)

    if updated != data:
        path.write_text(updated, encoding="utf-8")
PY
    git -C "$tmp/repo" add -A
    git -C "$tmp/repo" -c user.name="testagram-core-bot" -c user.email="testagram-core-bot@users.noreply.github.com" commit --amend --no-edit >/dev/null
  fi

  git subtree add --prefix="$path" "$tmp/repo" HEAD --squash
  rm -rf "$tmp"
  trap - RETURN
}

if [[ "${1:-}" == "--service" ]]; then
  [[ -n "${2:-}" ]] || { echo "Missing service name"; exit 2; }
  [[ -n "${URLS[$2]:-}" ]] || { echo "Unknown service: $2"; exit 2; }
  import_one "$2"
  exit 0
fi

for service in postgres auth postgrest realtime storage edge-runtime supavisor postgres-meta; do
  import_one "$service"
done

echo "Core service import complete."
echo "Studio/platform source remains in the existing apps/ tree from supabase/supabase."
