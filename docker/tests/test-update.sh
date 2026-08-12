#!/bin/sh
#
# Hermetic test for update.sh (the self-hosted in-place update script).
#
# Builds a tiny synthetic "upstream" git repo with two tagged releases
# (self-hosted/v0.9.0 -> self-hosted/v1.1.0; 1.0.0 exists only as a manifest key),
# where the target ships a breaking-change manifest with entries at the base and
# inside the window. It then simulates a configured deployment based on v0.9.0
# and runs update.sh via a SUPABASE_REPO_URL override (no network), asserting:
# the 3-way merge preserves secrets/data/overrides, adds new .env keys (but not
# ones the user commented out), applies clean merges, reports real conflicts,
# honors .gitignore for user-owned paths, surfaces only the in-window gate
# entries (base-version entry excluded), and advances the stamp ONLY on a clean
# apply. Also covers the clean-apply path, default-target resolution, --from,
# --dry-run, the missing-stamp report-only path, and a malformed manifest being
# refused.
#
# Usage:
#   sh tests/test-update.sh        # run from the docker/ directory
#

set -eu

# Isolate from the developer's global/system git config (gpgsign, hooksPath,
# templateDir, core.excludesfile) so neither the synthetic commits nor update.sh's
# internal git calls (fetch, merge-file, check-ignore) are affected. Exported so
# the update.sh subprocess inherits them too.
export GIT_CONFIG_GLOBAL=/dev/null
export GIT_CONFIG_NOSYSTEM=1

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
assert_line() { # <file> <ERE> <desc>
    if grep -qE "$2" "$1" 2>/dev/null; then ok "$3"; else bad "$3 (no line matching /$2/ in $1)"; fi
}
assert_no_line() { # <file> <ERE> <desc>
    if grep -qE "$2" "$1" 2>/dev/null; then bad "$3 (unexpected line matching /$2/ in $1)"; else ok "$3"; fi
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
printf 'base kong\n' > docker/volumes/api/kong.yml
printf 'remove me\n'  > docker/old-only.txt
cp "$DOCKER_DIR/.gitignore" docker/.gitignore
mkdir -p docker/volumes/functions/main
printf 'base main\n' > docker/volumes/functions/main/index.ts
git add -A && git commit -qm base && git tag self-hosted/v0.9.0

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
printf 'brand new\n' > docker/new-only.txt
printf 'target main\n' > docker/volumes/functions/main/index.ts
mkdir -p docker/volumes/functions/hello
printf 'target hello\n' > docker/volumes/functions/hello/index.ts
# A gitignored sample under volumes/snippets shipped by upstream: must NOT
# overwrite the user's file of the same name (exercises is_excluded directly).
mkdir -p docker/volumes/snippets
printf 'VENDOR SEED\n' > docker/volumes/snippets/seed.sql
# Manifest with entries at/below and inside the window:
#   0.9.0 == the base -> must be EXCLUDED (window is half-open: (base, target]).
#   1.0.0  inside -> surfaces (carries requires+gate).
#   1.1.0 == target -> surfaces; requires-less and sorts LAST (no _schema after),
#          guarding the set -e regression where a requires-less final entry
#          aborted the script. Do NOT add a version key after 1.1.0.
cat > docker/upgrades.json <<'EOF'
{
  "0.9.0": {
    "breaking": true
  },
  "1.0.0": {
    "breaking": true,
    "gate": "utils/demo-migrate.sh",
    "migration_guide_url": "https://example.test/guide",
    "requires": ["Run the demo migration first."]
  },
  "1.1.0": {
    "breaking": true
  }
}
EOF
git rm -q docker/old-only.txt
git add -A
git add -f docker/volumes/functions/hello/index.ts docker/volumes/snippets/seed.sql
# Release tag for the target / default-target (latest self-hosted/v*) path.
git commit -qm target && git tag self-hosted/v1.1.0

# A ref whose upgrades.json is valid JSON but NOT an object. update.sh must
# refuse (die) rather than silently skip the gate. Named so latest_release_tag
# ignores it (not self-hosted/v*), leaving the default-target path on v1.1.0.
printf '["valid JSON, but not an object"]\n' > docker/upgrades.json
git add -A && git commit -qm 'malformed manifest' && git tag malformed-manifest

# --- helper: lay down a deployment based on v0.9.0 --------------------------
# make_deploy <dir> [conflict]  - pass "conflict" to pin the studio image so the
# merge produces a real conflict; omit for a clean apply.

make_deploy() { # <dir> [conflict]
    d="$1"
    _mode="${2:-clean}"
    mkdir -p "$d"
    git -C "$SRC" archive self-hosted/v0.9.0 docker | tar -x -C "$d" --strip-components=1
    cp "$UPDATE_SH" "$d/update.sh"
    # configured .env: real secret, an extra user key, and KEEP_ME commented out
    # on purpose (must NOT be re-added by the .env key-union).
    cp "$d/.env.example" "$d/.env"
    sedi "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=test-secret-123/" "$d/.env"
    sedi "s/^KEEP_ME=/#KEEP_ME=/" "$d/.env"
    printf 'EXTRA_USER_KEY=mine\n' >> "$d/.env"
    # user-owned override (must never be touched)
    printf 'services: {}\n# my override\n' > "$d/docker-compose.override.yml"
    # data dirs with sentinels (must never be touched)
    mkdir -p "$d/volumes/db/data" "$d/volumes/storage"
    printf 'DBDATA\n' > "$d/volumes/db/data/keep.txt"
    printf 'OBJ\n'    > "$d/volumes/storage/keep.txt"
    # user adds a line to kong (upstream unchanged -> clean merge, must survive)
    printf 'user added line\n' >> "$d/volumes/api/kong.yml"
    # user-owned paths per .gitignore (must not be touched by the merge)
    mkdir -p "$d/volumes/snippets" "$d/volumes/functions/my-fn"
    printf 'USER_SNIPPET\n' > "$d/volumes/snippets/user.sql"
    printf 'user fn\n' > "$d/volumes/functions/my-fn/index.ts"
    # user file at the SAME path as the vendor snippet shipped at target:
    # is_excluded must skip it so the user's content survives.
    printf 'USER SEED\n' > "$d/volumes/snippets/seed.sql"
    # legacy sample fn in snapshot at target but gitignored - must not overwrite
    mkdir -p "$d/volumes/functions/hello"
    printf 'user hello\n' > "$d/volumes/functions/hello/index.ts"
    # version stamp pointing at the base (ref only; update.sh derives the rest)
    printf 'ref=self-hosted/v0.9.0\n' > "$d/.supabase-version"
    if [ "$_mode" = "conflict" ]; then
        # user pins the studio image (same line upstream changes -> conflict)
        sedi "s#supabase/studio:OLD#supabase/studio:USER-PINNED#" "$d/docker-compose.yml"
    fi
}

echo ""
echo "=== update.sh: apply path (with a conflict) ==="

DEPLOY="$WORK/deploy"
make_deploy "$DEPLOY" conflict
cd "$DEPLOY"
rc=0
SUPABASE_REPO_URL="$SRC" sh ./update.sh --to self-hosted/v1.1.0 --yes > "$WORK/apply.log" 2>&1 || rc=$?

sed 's/^/      | /' "$WORK/apply.log"

if [ "$rc" = "2" ]; then ok "exit status 2 signals conflicts"; else bad "expected exit 2 (conflicts), got $rc"; fi
assert_file_contains  ".env" "POSTGRES_PASSWORD=test-secret-123" "user secret preserved"
assert_file_contains  ".env" "NEW_KEY=new-default"               "new .env key appended"
assert_file_contains  ".env" "EXTRA_USER_KEY=mine"               "extra user key kept"
assert_line           ".env" "^#KEEP_ME=base-default"            "user's commented key left commented"
assert_no_line        ".env" "^KEEP_ME="                         "commented .env key not re-added uncommented"
assert_file_contains  "docker-compose.override.yml" "my override" "override untouched"
assert_file_contains  "volumes/db/data/keep.txt" "DBDATA"        "db data untouched"
assert_file_contains  "volumes/storage/keep.txt" "OBJ"           "storage untouched"
assert_file_contains  "docker-compose.yml" "<<<<<<<"             "conflict open marker written"
assert_file_contains  "docker-compose.yml" "======="            "conflict separator written"
assert_file_contains  "docker-compose.yml" ">>>>>>>"            "conflict close marker written"
assert_file_contains  "docker-compose.yml" "USER-PINNED"        "user value present in conflict"
assert_file_contains  "docker-compose.yml" "supabase/studio:NEW" "upstream value present in conflict"
assert_file_contains  "docker-compose.yml" "supabase/postgres:17" "non-conflicting line merged (pg17)"
assert_path_exists    "new-only.txt"                             "new upstream file added"
assert_path_exists    "old-only.txt"                             "removed-upstream file left in place"
assert_file_contains  "volumes/api/kong.yml" "user added line"   "clean merge preserved user line"
assert_file_contains  ".supabase-version" "ref=self-hosted/v0.9.0" "stamp NOT advanced on conflict"
assert_file_contains  "$WORK/apply.log" "Files with merge conflicts" "conflicts reported in summary"
assert_file_contains  "$WORK/apply.log" "[1.0.0]"               "manifest entry 1.0.0 surfaced"
assert_file_contains  "$WORK/apply.log" "[1.1.0] BREAKING"      "requires-less last entry surfaced (no set -e abort)"
assert_file_missing_pattern "$WORK/apply.log" "[0.9.0]"         "base-version entry excluded (window lower bound is half-open)"
assert_file_contains  "$WORK/apply.log" "Run the demo migration first." "manifest gate step surfaced"
assert_file_contains  "$WORK/apply.log" "utils/demo-migrate.sh" "manifest gate script surfaced"
assert_file_contains  "$WORK/apply.log" "example.test/guide"    "manifest migration guide surfaced"
assert_file_contains  "$WORK/apply.log" "gone from the new .env.example" ".env key-removal section shown"
assert_file_contains  "$WORK/apply.log" "EXTRA_USER_KEY"        "removed .env key listed in report"
if ls backups/*.tgz >/dev/null 2>&1; then
    ok "backup archive created"
    for _bk in backups/*.tgz; do break; done
    tar tzf "$_bk" > "$WORK/bk.list" 2>/dev/null || true
    assert_file_contains        "$WORK/bk.list" ".env"            "backup includes .env"
    assert_file_missing_pattern "$WORK/bk.list" "volumes/db/data" "backup excludes db data dir"
    assert_file_missing_pattern "$WORK/bk.list" "volumes/storage" "backup excludes storage dir"
    assert_file_missing_pattern "$WORK/bk.list" "backups/"        "backup excludes backups dir"
else
    bad "no backup archive"
fi
assert_file_contains  "volumes/snippets/user.sql" "USER_SNIPPET"     "snippets left untouched"
# seed.sql and hello/index.ts are the only files that are BOTH shipped in the
# target snapshot AND gitignored, so they are the real is_excluded coverage.
# Assert the user's content survives AND no vendor content / conflict markers
# leaked in - i.e. the file was skipped, not merged/conflicted.
assert_file_contains         "volumes/snippets/seed.sql" "USER SEED"   "gitignored snippet: user content kept"
assert_file_missing_pattern  "volumes/snippets/seed.sql" "VENDOR SEED" "gitignored snippet: no vendor content"
assert_file_missing_pattern  "volumes/snippets/seed.sql" "<<<<<<<"     "gitignored snippet: not conflicted (skipped)"
assert_file_contains  "volumes/functions/my-fn/index.ts" "user fn"   "custom edge fn left untouched"
assert_file_contains  "volumes/functions/main/index.ts" "target main" "vendor main/index.ts updated"
assert_file_contains         "volumes/functions/hello/index.ts" "user hello"   "gitignored fn: user content kept"
assert_file_missing_pattern  "volumes/functions/hello/index.ts" "target hello" "gitignored fn: no vendor content"
assert_file_missing_pattern  "volumes/functions/hello/index.ts" "<<<<<<<"      "gitignored fn: not conflicted (skipped)"

echo ""
echo "=== update.sh: clean apply (no conflict) advances the stamp and exits 0 ==="

CLEAN="$WORK/clean"
make_deploy "$CLEAN"
cd "$CLEAN"
rc=0
SUPABASE_REPO_URL="$SRC" sh ./update.sh --to self-hosted/v1.1.0 --yes > "$WORK/clean.log" 2>&1 || rc=$?
if [ "$rc" = "0" ]; then ok "clean apply exits 0"; else bad "clean apply expected exit 0, got $rc"; fi
assert_file_contains "$WORK/clean.log" "Update applied cleanly."       "clean apply announced"
assert_file_missing_pattern "docker-compose.yml" "<<<<<<<"             "clean apply wrote no conflict markers"
assert_file_contains ".supabase-version" "ref=self-hosted/v1.1.0"     "stamp advanced on clean apply"
assert_file_contains ".env" "NEW_KEY=new-default"                     "new .env key appended (clean)"
assert_file_contains "docker-compose.yml" "supabase/studio:NEW"       "vendor file updated (clean)"
assert_file_contains "volumes/api/kong.yml" "user added line"         "clean merge preserved user line (clean)"

echo ""
echo "=== update.sh: default target resolves to latest self-hosted/v* tag ==="

TAGD="$WORK/tagdefault"
make_deploy "$TAGD"
cd "$TAGD"
SUPABASE_REPO_URL="$SRC" sh ./update.sh --yes > "$WORK/tag.log" 2>&1 || true
assert_file_contains "$WORK/tag.log" "Latest release tag: self-hosted/v1.1.0" "resolved latest release tag (no --to)"
assert_file_contains ".supabase-version" "ref=self-hosted/v1.1.0"            "stamp advanced to the tag"
assert_file_contains ".env" "NEW_KEY=new-default"                            "update applied via default target"

echo ""
echo "=== update.sh: --from supplies the base when the stamp is missing ==="

FROMD="$WORK/fromd"
make_deploy "$FROMD"
cd "$FROMD"
rm -f .supabase-version
rc=0
SUPABASE_REPO_URL="$SRC" sh ./update.sh --from self-hosted/v0.9.0 --to self-hosted/v1.1.0 --yes > "$WORK/from.log" 2>&1 || rc=$?
assert_file_missing_pattern "$WORK/from.log" "REPORT-ONLY"     "--from performs a real update (not report-only)"
assert_file_contains ".env" "NEW_KEY=new-default"              "--from applied the update"
assert_file_contains ".supabase-version" "ref=self-hosted/v1.1.0" "--from advanced the stamp"

echo ""
echo "=== update.sh: --dry-run writes nothing ==="

DRYD="$WORK/dry"
make_deploy "$DRYD" conflict
cd "$DRYD"
SUPABASE_REPO_URL="$SRC" sh ./update.sh --to self-hosted/v1.1.0 --dry-run > "$WORK/dry.log" 2>&1 || true
assert_file_missing_pattern ".env" "NEW_KEY"              "dry-run did not append env key"
assert_file_missing_pattern "docker-compose.yml" "<<<<<<<" "dry-run did not write conflict"
assert_file_contains ".supabase-version" "ref=self-hosted/v0.9.0" "dry-run left stamp unchanged"
assert_path_absent   "backups"                            "dry-run took no backup"
assert_file_contains "$WORK/dry.log" "DRY RUN"            "dry-run labeled output"

echo ""
echo "=== update.sh: missing stamp -> report-only (still surfaces the gate) ==="

MISS="$WORK/miss"
make_deploy "$MISS"
cd "$MISS"
rm -f .supabase-version
rc=0
SUPABASE_REPO_URL="$SRC" sh ./update.sh --to self-hosted/v1.1.0 > "$WORK/miss.log" 2>&1 || rc=$?
if [ "$rc" = "0" ]; then ok "report-only exits 0"; else bad "report-only expected exit 0, got $rc"; fi
assert_file_contains "$WORK/miss.log" "REPORT-ONLY"       "report-only mode announced"
assert_file_missing_pattern ".env" "NEW_KEY"             "report-only wrote nothing to .env"
assert_path_absent   "backups"                           "report-only took no backup"
assert_file_contains "$WORK/miss.log" "Breaking changes / required manual steps" "report-only surfaces the gate"
assert_file_contains "$WORK/miss.log" "[1.0.0]"          "report-only lists in-range breaking release"
assert_file_contains "$WORK/miss.log" "[0.9.0]"          "report-only (open lower bound) includes the base-version entry"

echo ""
echo "=== update.sh: malformed manifest -> refuses (dies), writes nothing ==="

BADM="$WORK/badmanifest"
make_deploy "$BADM"
cd "$BADM"
rc=0
SUPABASE_REPO_URL="$SRC" sh ./update.sh --to malformed-manifest --yes > "$WORK/bad.log" 2>&1 || rc=$?
if [ "$rc" != "0" ] && [ "$rc" != "2" ]; then ok "malformed manifest aborts (die, not a normal exit)"; else bad "expected die (non-0, non-2), got $rc"; fi
assert_file_contains "$WORK/bad.log" "not a valid JSON object" "malformed-manifest error surfaced"
assert_file_missing_pattern ".env" "NEW_KEY"                   "malformed manifest: .env untouched"
assert_path_absent   "backups"                                 "malformed manifest: no backup taken"
assert_file_contains ".supabase-version" "ref=self-hosted/v0.9.0" "malformed manifest: stamp not advanced"

echo ""
echo "=== update.sh: never overwrites the running script; stages the target's copy as .dist ==="

# A dedicated upstream whose docker/ ships an update.sh that DIFFERS from the one
# we run, so the merge must divert it to update.sh.dist rather than rewrite the
# live script mid-run (which would corrupt this process).
SELFSRC="$WORK/selfsrc"
mkdir -p "$SELFSRC/docker"
cd "$SELFSRC"
git init -q
git config user.email t@t.t
git config user.name t
printf 'services:\n  db:\n    image: x\n' > docker/docker-compose.yml
printf 'KEEP=1\n' > docker/.env.example
cp "$DOCKER_DIR/.gitignore" docker/.gitignore
printf '#!/bin/sh\necho THIS-IS-THE-NEW-UPDATE-SH\n' > docker/update.sh
git add -A && git commit -qm self && git tag self-hosted/v2.0.0

SELFDEP="$WORK/selfdep"
mkdir -p "$SELFDEP"
printf 'services:\n  db:\n    image: x\n' > "$SELFDEP/docker-compose.yml"
printf 'KEEP=1\n' > "$SELFDEP/.env"
cp "$UPDATE_SH" "$SELFDEP/update.sh"   # the running script = the real update.sh
printf 'ref=self-hosted/v2.0.0\n' > "$SELFDEP/.supabase-version"
cd "$SELFDEP"
rc=0
SUPABASE_REPO_URL="$SELFSRC" sh ./update.sh --to self-hosted/v2.0.0 --yes > "$WORK/self.log" 2>&1 || rc=$?
if [ "$rc" = "0" ]; then ok "self-update run exits 0"; else bad "expected exit 0, got $rc"; fi
if cmp -s ./update.sh "$UPDATE_SH"; then ok "running update.sh left byte-identical"; else bad "running update.sh was modified in place"; fi
assert_no_line "./update.sh" '^(<<<<<<<|=======|>>>>>>>)'      "no conflict markers written into the running update.sh"
assert_path_exists "$SELFDEP/update.sh.dist"                   "target's update.sh staged as update.sh.dist"
assert_file_contains "$SELFDEP/update.sh.dist" "THIS-IS-THE-NEW-UPDATE-SH" "update.sh.dist holds the target's version"
assert_file_contains "$WORK/self.log" "update.sh.dist"         "summary points the user at update.sh.dist"

# --- summary -----------------------------------------------------------------

echo ""
echo "=== Result: $PASS passed, $FAIL failed ==="
[ "$FAIL" = "0" ] || exit 1
