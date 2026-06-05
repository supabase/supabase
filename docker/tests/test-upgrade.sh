#!/bin/sh
#
# Hermetic test for update.sh (the self-hosted in-place upgrade script).
#
# Builds a tiny synthetic "upstream" git repo with two tagged commits
# (b-base -> b-target), simulates a configured deployment based on b-base
# (with secrets, an override, modified vendor files, and data dirs), then runs
# update.sh and asserts the 3-way merge behaves: secrets/data preserved, new
# .env keys added, clean merges applied, real conflicts reported, the version
# stamp advanced, a backup taken. Also covers --dry-run and the missing-stamp
# report-only path.
#
# No network and no dependence on real repo history (works in shallow clones).
#
# Usage:
#   sh tests/test-upgrade.sh        # run from the docker/ directory
#

set -eu

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
DOCKER_DIR=$(dirname "$SCRIPT_DIR")
UPDATE_SH="$DOCKER_DIR/update.sh"

[ -f "$UPDATE_SH" ] || { echo "ERROR: $UPDATE_SH not found"; exit 1; }

WORK=$(mktemp -d)
cleanup() { rm -rf "$WORK"; }
trap cleanup EXIT INT TERM

PASS=0
FAIL=0
ok()   { PASS=$((PASS+1)); printf "  ok   - %s\n" "$1"; }
bad()  { FAIL=$((FAIL+1)); printf "  FAIL - %s\n" "$1"; }

assert_file_contains() { # <file> <pattern> <desc>
    if grep -qF "$2" "$1" 2>/dev/null; then ok "$3"; else bad "$3 (missing '$2' in $1)"; fi
}
assert_file_missing_pattern() { # <file> <pattern> <desc>
    if grep -qF "$2" "$1" 2>/dev/null; then bad "$3 (unexpected '$2' in $1)"; else ok "$3"; fi
}
assert_path_exists() { # <path> <desc>
    if [ -e "$1" ]; then ok "$2"; else bad "$2 ($1 missing)"; fi
}
assert_path_absent() { # <path> <desc>
    if [ -e "$1" ]; then bad "$2 ($1 should not exist)"; else ok "$2"; fi
}

# portable in-place sed (BSD + GNU): sedi <expr> <file>
sedi() { sed "$1" "$2" > "$2.tmp" && mv "$2.tmp" "$2"; }

# --- 1. Build the synthetic upstream repo -----------------------------------

SRC="$WORK/upstream"
mkdir -p "$SRC/docker/volumes/api"
cd "$SRC"
git init -q
git config user.email t@t.t
git config user.name t

cat > docker/docker-compose.yml <<'EOF'
services:
  studio:
    image: supabase/studio:OLD
  db:
    image: supabase/postgres:15
EOF
cat > docker/.env.example <<'EOF'
POSTGRES_PASSWORD=changeme
JWT_SECRET=changeme
KEEP_ME=base-default
EOF
cat > docker/CHANGELOG.md <<'EOF'
# Changelog

## [2026-01-02]
- old stuff
EOF
printf 'base kong\n' > docker/volumes/api/kong.yml
printf 'remove me\n'  > docker/old-only.txt
git add -A && git commit -qm base && git tag b-base

# target commit
cat > docker/docker-compose.yml <<'EOF'
services:
  studio:
    image: supabase/studio:NEW
  db:
    image: supabase/postgres:17
EOF
cat > docker/.env.example <<'EOF'
POSTGRES_PASSWORD=changeme
JWT_SECRET=changeme
KEEP_ME=base-default
NEW_KEY=new-default
EOF
cat > docker/CHANGELOG.md <<'EOF'
# Changelog

## [2026-02-01]
- ⚠️ Breaking: did a thing (requires docker-compose.yml update)

## [2026-01-02]
- old stuff
EOF
printf 'brand new\n' > docker/new-only.txt
cat > docker/upgrades.json <<'EOF'
{
  "2026-02-01": {
    "breaking": true,
    "gate": "utils/demo-migrate.sh",
    "migration_guide_url": "https://example.test/guide",
    "requires": ["Run the demo migration first."]
  }
}
EOF
git rm -q docker/old-only.txt
git add -A && git commit -qm target && git tag b-target
# Release tag for the default-target (latest self-hosted/v*) path.
git tag self-hosted/v1.0.0

# --- helper: lay down a deployment based on b-base --------------------------

make_deploy() { # <dir>
    d="$1"
    mkdir -p "$d"
    git -C "$SRC" archive b-base docker | tar -x -C "$d" --strip-components=1
    cp "$UPDATE_SH" "$d/update.sh"
    # configured .env: real secret, an extra user key, keep KEEP_ME default
    cp "$d/.env.example" "$d/.env"
    sedi "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=test-secret-123/" "$d/.env"
    printf 'EXTRA_USER_KEY=mine\n' >> "$d/.env"
    # user-owned override (must never be touched)
    printf 'services: {}\n# my override\n' > "$d/docker-compose.override.yml"
    # data dirs with sentinels (must never be touched)
    mkdir -p "$d/volumes/db/data" "$d/volumes/storage"
    printf 'DBDATA\n' > "$d/volumes/db/data/keep.txt"
    printf 'OBJ\n'    > "$d/volumes/storage/keep.txt"
    # user pins the studio image (same line upstream changes -> conflict)
    sedi "s#supabase/studio:OLD#supabase/studio:USER-PINNED#" "$d/docker-compose.yml"
    # user adds a line to kong (upstream unchanged -> clean merge, must survive)
    printf 'user added line\n' >> "$d/volumes/api/kong.yml"
    # version stamp pointing at the base
    printf 'ref=b-base\ndate=2026-01-02\n' > "$d/.supabase-version"
}

echo ""
echo "=== update.sh: apply path ==="

DEPLOY="$WORK/deploy"
make_deploy "$DEPLOY"
cd "$DEPLOY"
rc=0
SUPABASE_REPO_URL="$SRC" sh ./update.sh --to b-target --yes > "$WORK/apply.log" 2>&1 || rc=$?

cat "$WORK/apply.log" | sed 's/^/      | /'

if [ "$rc" = "2" ]; then ok "exit status 2 signals conflicts"; else bad "expected exit 2 (conflicts), got $rc"; fi
assert_file_contains  ".env" "POSTGRES_PASSWORD=test-secret-123" "user secret preserved"
assert_file_contains  ".env" "NEW_KEY=new-default"               "new .env key appended"
assert_file_contains  ".env" "EXTRA_USER_KEY=mine"               "extra user key kept"
assert_file_contains  "docker-compose.override.yml" "my override" "override untouched"
assert_file_contains  "volumes/db/data/keep.txt" "DBDATA"        "db data untouched"
assert_file_contains  "volumes/storage/keep.txt" "OBJ"           "storage untouched"
assert_file_contains  "docker-compose.yml" "<<<<<<<"             "conflict markers written"
assert_file_contains  "docker-compose.yml" "USER-PINNED"        "user value present in conflict"
assert_file_contains  "docker-compose.yml" "supabase/studio:NEW" "upstream value present in conflict"
assert_file_contains  "docker-compose.yml" "supabase/postgres:17" "non-conflicting line merged (pg17)"
assert_path_exists    "new-only.txt"                             "new upstream file added"
assert_path_exists    "old-only.txt"                             "removed-upstream file left in place"
assert_file_contains  "volumes/api/kong.yml" "user added line"   "clean merge preserved user line"
assert_file_contains  ".supabase-version" "ref=b-target"         "version stamp advanced"
assert_file_contains  "$WORK/apply.log" "CONFLICT"              "conflict reported in output"
assert_file_contains  "$WORK/apply.log" "Breaking: did a thing" "breaking changelog line surfaced"
assert_file_contains  "$WORK/apply.log" "Run the demo migration first." "manifest gate step surfaced"
assert_file_contains  "$WORK/apply.log" "utils/demo-migrate.sh" "manifest gate script surfaced"
assert_file_contains  "$WORK/apply.log" "example.test/guide"    "manifest migration guide surfaced"
if ls backups/*.tgz >/dev/null 2>&1; then ok "backup archive created"; else bad "no backup archive"; fi

echo ""
echo "=== update.sh: default target resolves to latest self-hosted/v* tag ==="

TAGD="$WORK/tagdefault"
make_deploy "$TAGD"
cd "$TAGD"
rc=0
SUPABASE_REPO_URL="$SRC" sh ./update.sh --yes > "$WORK/tag.log" 2>&1 || rc=$?
assert_file_contains "$WORK/tag.log" "Latest release tag: self-hosted/v1.0.0" "resolved latest release tag (no --to)"
assert_file_contains ".supabase-version" "ref=self-hosted/v1.0.0"            "stamp advanced to the tag"
assert_file_contains ".env" "NEW_KEY=new-default"                            "upgrade applied via default target"

echo ""
echo "=== update.sh: --dry-run writes nothing ==="

DRYD="$WORK/dry"
make_deploy "$DRYD"
cd "$DRYD"
SUPABASE_REPO_URL="$SRC" sh ./update.sh --to b-target --dry-run > "$WORK/dry.log" 2>&1 || true
assert_file_missing_pattern ".env" "NEW_KEY"              "dry-run did not append env key"
assert_file_missing_pattern "docker-compose.yml" "<<<<<<<" "dry-run did not write conflict"
assert_file_contains ".supabase-version" "ref=b-base"     "dry-run left stamp unchanged"
assert_path_absent   "backups"                            "dry-run took no backup"
assert_file_contains "$WORK/dry.log" "DRY RUN"            "dry-run labeled output"

echo ""
echo "=== update.sh: missing stamp -> report-only ==="

MISS="$WORK/miss"
make_deploy "$MISS"
cd "$MISS"
rm -f .supabase-version
rc=0
SUPABASE_REPO_URL="$SRC" sh ./update.sh --to b-target > "$WORK/miss.log" 2>&1 || rc=$?
if [ "$rc" = "0" ]; then ok "report-only exits 0"; else bad "report-only expected exit 0, got $rc"; fi
assert_file_contains "$WORK/miss.log" "REPORT-ONLY"       "report-only mode announced"
assert_file_missing_pattern ".env" "NEW_KEY"             "report-only wrote nothing to .env"
assert_path_absent   "backups"                           "report-only took no backup"

# --- summary -----------------------------------------------------------------

echo ""
echo "=== Result: $PASS passed, $FAIL failed ==="
[ "$FAIL" = "0" ] || exit 1
