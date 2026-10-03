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

  # Import a file-only snapshot. We deliberately do not run git subtree against
  # the upstream repository because its fetched Git history can contain credentials
  # in old test fixtures. The Testagram repository must receive only the sanitized
  # source tree, never those upstream objects.
  local tmp
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' RETURN

  git clone --quiet --depth 1 --branch "$ref" "$url" "$tmp/repo"
  rm -rf "$tmp/repo/.git"

  python3 - "$tmp/repo" <<'PY'
import pathlib
import re
import sys

root = pathlib.Path(sys.argv[1])

patterns = [
    (re.compile(r"sbp_[A-Za-z0-9_-]{20,}"), "sbp_TEST_TOKEN_REDACTED"),
    (re.compile(r"ya29\.[A-Za-z0-9._-]+"), "TEST_GOOGLE_ACCESS_TOKEN"),
    (re.compile(r"(?<![A-Za-z0-9_-])eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+"), "TEST_JWT_REDACTED"),
    (re.compile(r"Bearer\s+eyJ[A-Za-z0-9._-]+"), "Bearer TEST_JWT_REDACTED"),
]

known_passwords = {
    "56lRXbZStSL9vY3cJJxLZd5wQxpWvfl9": "TEST_SUPAVISOR_PASSWORD",
}

for path in root.rglob("*"):
    if not path.is_file():
        continue
    try:
        data = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        continue

    updated = data
    for pattern, replacement in patterns:
        updated = pattern.sub(replacement, updated)
    for old, replacement in known_passwords.items():
        updated = updated.replace(old, replacement)

    if updated != data:
        path.write_text(updated, encoding="utf-8")

# Fail closed if obvious credential-shaped material remains in text files.
remaining = []
for path in root.rglob("*"):
    if not path.is_file():
        continue
    try:
        data = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        continue
    if re.search(r"sbp_[A-Za-z0-9_-]{20,}|ya29\.[A-Za-z0-9._-]+|(?<![A-Za-z0-9_-])eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+", data):
        remaining.append(str(path.relative_to(root)))

if remaining:
    print("ERROR: credential-shaped material remains in:", file=sys.stderr)
    for item in remaining:
        print(item, file=sys.stderr)
    raise SystemExit(1)
PY

  # Turn the sanitized file tree into an orphan local commit. No upstream Git
  # objects or upstream commit history become reachable from Testagram.
  git -C "$tmp/repo" init --quiet
  git -C "$tmp/repo" config user.name "testagram-core-bot"
  git -C "$tmp/repo" config user.email "testagram-core-bot@users.noreply.github.com"
  git -C "$tmp/repo" add -A
  git -C "$tmp/repo" commit --quiet -m "Testagram upstream snapshot $name $ref"

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
