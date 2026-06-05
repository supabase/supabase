#!/bin/sh
#
# Upgrade an existing self-hosted Supabase deployment in place.
#
# The deployment directory mixes vendor-owned files (docker-compose.yml, the
# override files, volumes/*, scripts, .env.example) with user-owned state
# (.env, docker-compose.override.yml, volumes/db/data, volumes/storage). This
# script pulls a newer version of the vendor files on top of yours using a
# 3-way merge against the version you started from, so local edits survive and
# genuine conflicts are surfaced rather than silently overwritten.
#
# The version you started from is recorded in .supabase-version (written by
# setup.sh). If it is missing, pass --from <ref> or follow the printed guidance.
#
# What it never touches: .env values you set, docker-compose.override.yml, and
# the data directories (volumes/db/data, volumes/storage). New keys from
# .env.example are appended to your .env; existing values are kept as-is.
#
# By default it upgrades to the latest self-hosted/v* release tag (or 'master'
# until the first tag exists). Pass --to to pin a specific tag/branch.
#
# Usage:
#   sh update.sh                       # upgrade to the latest release tag
#   sh update.sh --dry-run             # show what would change, write nothing
#   sh update.sh --to <tag>            # upgrade to a specific tag/branch
#   sh update.sh --from <ref>          # base to merge from (if no .supabase-version)
#   sh update.sh --yes                 # don't prompt, even on breaking changes
#
# Env:
#   SUPABASE_REPO_URL   Override the upstream repo (default: github supabase/supabase)
#

set -e

cd "$(dirname "$0")"

REPO_URL="${SUPABASE_REPO_URL:-https://github.com/supabase/supabase}"
STAMP_FILE=".supabase-version"
DRY_RUN=0
ASSUME_YES=0
TO_REF=""
FROM_REF=""

log()  { printf "===> %s\n" "$*"; }
warn() { printf "WARNING: %s\n" "$*" >&2; }
die()  { printf "ERROR: %s\n" "$*" >&2; exit 1; }

print_help() {
    # Print the leading comment block (minus the shebang), stripping "# ".
    awk 'NR==1 {next} /^#/ {sub(/^# ?/,""); print; next} {exit}' "$0"
}

while [ $# -gt 0 ]; do
    case "$1" in
        --dry-run)  DRY_RUN=1; shift ;;
        --yes|-y)   ASSUME_YES=1; shift ;;
        --to)       TO_REF="$2"; shift 2 ;;
        --from)     FROM_REF="$2"; shift 2 ;;
        -h|--help)  print_help; exit 0 ;;
        *) echo "Unknown option: $1" >&2; print_help; exit 1 ;;
    esac
done

[ -f docker-compose.yml ] || die "docker-compose.yml not found in $(pwd). Run this from your deployment directory."
[ -f .env ] || die ".env not found in $(pwd). This does not look like a configured deployment."
command -v git >/dev/null 2>&1 || die "git is required but was not found on PATH."

# Paths that are user-owned state (gitignored) and must never be merged/overwritten.
is_excluded() {
    case "$1" in
        .env|docker-compose.override.yml|"$STAMP_FILE"|test.http) return 0 ;;
        .git|.git/*) return 0 ;;
        volumes/db/data|volumes/db/data/*) return 0 ;;
        volumes/storage|volumes/storage/*) return 0 ;;
        backups|backups/*) return 0 ;;
        *) return 1 ;;
    esac
}

# Read the recorded base ref from .supabase-version. Accepts either
#   ref=<sha-or-tag>
# or a bare SHA/ref on the first non-comment line.
read_stamp_ref() {
    [ -f "$STAMP_FILE" ] || return 1
    val=$(grep -E '^ref=' "$STAMP_FILE" 2>/dev/null | head -n1 | cut -d= -f2- | tr -d "\r\"' ")
    if [ -z "$val" ]; then
        val=$(grep -vE '^[[:space:]]*#' "$STAMP_FILE" 2>/dev/null | grep -vE '^[[:space:]]*$' | head -n1 | tr -d "\r\"' ")
    fi
    [ -n "$val" ] && printf '%s' "$val"
}

read_stamp_date() {
    [ -f "$STAMP_FILE" ] || return 1
    grep -E '^date=' "$STAMP_FILE" 2>/dev/null | head -n1 | cut -d= -f2- | tr -d "\r\"' "
}

# _sparse_init <workdir> — fresh repo, sparse-checkout limited to docker/.
_sparse_init() {
    git -C "$1" init -q
    git -C "$1" remote add origin "$REPO_URL"
    git -C "$1" config core.sparseCheckout true
    git -C "$1" sparse-checkout init --cone >/dev/null 2>&1
    git -C "$1" sparse-checkout set docker >/dev/null 2>&1
}

# fetch_snapshot <ref> <dest_dir>
# Materializes the contents of ./docker at <ref> into <dest_dir> via a single
# shallow fetch. <ref> is normally a self-hosted/v* tag; branches and (against
# GitHub, which serves reachable SHAs) commit SHAs also work. A plain/local
# remote won't serve an unadvertised SHA — that's fine, callers degrade to
# report-only. This is also the seam an artifact source (tarball + sha256)
# would slot into later.
fetch_snapshot() {
    _ref="$1"; _dest="$2"
    _work=$(mktemp -d)
    if _sparse_init "$_work" \
        && git -C "$_work" fetch --depth=1 -q origin "$_ref" 2>/dev/null \
        && git -C "$_work" checkout -q FETCH_HEAD 2>/dev/null \
        && [ -d "$_work/docker" ]; then
        mkdir -p "$_dest"
        cp -rf "$_work/docker/." "$_dest/"
        rm -rf "$_work"
    else
        rm -rf "$_work"
        return 1
    fi
}

# latest_release_tag — highest self-hosted/v* tag on the remote, or empty.
# Queries REPO_URL directly (the deployment dir is not a git repo). Strips only
# the refs/tags/ prefix (the tag name itself contains a slash) and version-sorts.
latest_release_tag() {
    git ls-remote --tags --refs "$REPO_URL" 2>/dev/null \
        | sed 's#^.*refs/tags/##' \
        | grep -E '^self-hosted/v[0-9]' \
        | sort -V | tail -n1
}

# List tracked files (relative paths) under a snapshot dir, excluding .git.
list_files() {
    ( cd "$1" && find . -type f | sed 's|^\./||' | grep -vE '^\.git(/|$)' | sort )
}

# --- Resolve base and target refs -------------------------------------------

# Target: explicit --to wins; else the latest self-hosted/v* release tag; else
# master (until the first tag is pushed).
if [ -n "$TO_REF" ]; then
    TARGET_REF="$TO_REF"
else
    TARGET_REF=$(latest_release_tag)
    if [ -n "$TARGET_REF" ]; then
        log "Latest release tag: $TARGET_REF"
    else
        TARGET_REF="master"
        warn "No self-hosted/v* release tags found; targeting 'master'. Pin a version with --to."
    fi
fi

REPORT_ONLY=0
if [ -n "$FROM_REF" ]; then
    BASE_REF="$FROM_REF"
elif BASE_REF=$(read_stamp_ref) && [ -n "$BASE_REF" ]; then
    :
else
    REPORT_ONLY=1
    BASE_REF=""
fi

BASE_DATE=$(read_stamp_date 2>/dev/null || true)

if [ "$REPORT_ONLY" = "1" ]; then
    warn "No $STAMP_FILE found and no --from <ref> given; cannot determine the version you started from."
    cat >&2 <<EOF

Without a base version a safe 3-way merge is not possible. To fix this, find the
version your deployment was based on and record it, then re-run:

  1. Identify your base. Cross-reference the image tags in your docker-compose.yml
     / .env against docker/versions.md, or use the most recent date in CHANGELOG.md
     that you remember pulling.
  2. Write it to $STAMP_FILE, e.g.:
         printf 'ref=<commit-sha-or-tag>\ndate=<YYYY-MM-DD>\n' > $STAMP_FILE
  3. Re-run: sh update.sh

Or supply it inline for this run:  sh update.sh --from <commit-sha-or-tag>

Continuing in REPORT-ONLY mode: showing files and .env keys that are new in
'$TARGET_REF' versus your current deployment. Nothing will be written.
EOF
fi

# --- Fetch snapshots ---------------------------------------------------------

TMP_ROOT=$(mktemp -d)
cleanup() { rm -rf "$TMP_ROOT"; }
trap cleanup EXIT INT TERM

TARGET_DIR="$TMP_ROOT/target"
log "Fetching target snapshot ($TARGET_REF)"
fetch_snapshot "$TARGET_REF" "$TARGET_DIR" || die "Could not fetch target snapshot '$TARGET_REF' from $REPO_URL"

BASE_DIR=""
if [ "$REPORT_ONLY" != "1" ]; then
    BASE_DIR="$TMP_ROOT/base"
    log "Fetching base snapshot ($BASE_REF)"
    fetch_snapshot "$BASE_REF" "$BASE_DIR" || die "Could not fetch base snapshot '$BASE_REF' from $REPO_URL"
fi

# --- Report-only mode --------------------------------------------------------

if [ "$REPORT_ONLY" = "1" ]; then
    log "Files present in '$TARGET_REF' but missing locally:"
    list_files "$TARGET_DIR" | while IFS= read -r f; do
        is_excluded "$f" && continue
        [ -f "$f" ] || echo "  new: $f"
    done
    echo ""
    log ".env keys present in target .env.example but missing from your .env:"
    if [ -f "$TARGET_DIR/.env.example" ]; then
        grep -E '^[A-Za-z_][A-Za-z0-9_]*=' "$TARGET_DIR/.env.example" | cut -d= -f1 | while IFS= read -r k; do
            grep -qE "^${k}=" .env || echo "  + $k"
        done
    fi
    echo ""
    log "Report-only complete. Record a base version (see above) to perform a real upgrade."
    exit 0
fi

# --- Backup ------------------------------------------------------------------

if [ "$DRY_RUN" = "1" ]; then
    log "Dry run: no backup taken, nothing will be written."
else
    mkdir -p backups
    BACKUP="backups/pre-update-$(date +%Y%m%d-%H%M%S).tgz"
    log "Backing up current configuration to $BACKUP (excluding data directories)"
    tar czf "$BACKUP" \
        --exclude='./backups' \
        --exclude='./volumes/db/data' \
        --exclude='./volumes/storage' \
        . 2>/dev/null || warn "Backup archive reported errors; review $BACKUP before relying on it."
    warn "This does NOT back up your database. Back it up separately before upgrading."
fi

# --- 3-way merge of vendor files ---------------------------------------------

REPORT="$TMP_ROOT/report"
: > "$REPORT"
record() { printf '%s:%s\n' "$1" "$2" >> "$REPORT"; }

# apply_file <relpath> <source_abs>  — copy source into the deployment (unless dry-run)
apply_file() {
    [ "$DRY_RUN" = "1" ] && return 0
    _dir=$(dirname "$1")
    [ "$_dir" = "." ] || mkdir -p "$_dir"
    cp -f "$2" "$1"
}

# Union of base + target files.
ALL_FILES=$( { list_files "$BASE_DIR"; list_files "$TARGET_DIR"; } | sort -u )

EMPTY="$TMP_ROOT/empty"; : > "$EMPTY"

printf '%s\n' "$ALL_FILES" | while IFS= read -r f; do
    [ -n "$f" ] || continue
    is_excluded "$f" && continue
    [ "$f" = ".env" ] && continue   # handled by the env merge below

    b="$BASE_DIR/$f"; t="$TARGET_DIR/$f"; u="$f"

    if [ ! -f "$t" ]; then
        # Removed upstream. Leave the user's copy in place, just report it.
        [ -f "$u" ] && record "removed-upstream" "$f"
        continue
    fi

    if [ ! -f "$u" ]; then
        # New file in target (or one the user deleted) — add it.
        apply_file "$f" "$t"
        record "new" "$f"
        continue
    fi

    if cmp -s "$u" "$t"; then
        record "unchanged" "$f"
        continue
    fi

    base_for_merge="$b"
    [ -f "$base_for_merge" ] || base_for_merge="$EMPTY"

    if cmp -s "$u" "$base_for_merge"; then
        # User never modified this file: safe to take the new version wholesale.
        apply_file "$f" "$t"
        record "updated" "$f"
        continue
    fi

    # User modified the file AND it changed upstream: 3-way merge.
    merged="$TMP_ROOT/merged.out"
    if git merge-file -p -q \
        -L "yours ($f)" -L "base" -L "new ($TARGET_REF)" \
        "$u" "$base_for_merge" "$t" > "$merged" 2>/dev/null; then
        if [ "$DRY_RUN" != "1" ]; then cp -f "$merged" "$u"; fi
        record "merged-clean" "$f"
    else
        if [ "$DRY_RUN" != "1" ]; then cp -f "$merged" "$u"; fi
        record "CONFLICT" "$f"
    fi
done

# --- .env key-union merge ----------------------------------------------------
# Add keys present in target .env.example but missing from .env. Never change an
# existing user value. Report keys that were removed/renamed upstream.

ENV_ADDED="$TMP_ROOT/env_added"; : > "$ENV_ADDED"
ENV_REMOVED="$TMP_ROOT/env_removed"; : > "$ENV_REMOVED"
TARGET_ENV_EXAMPLE="$TARGET_DIR/.env.example"

if [ -f "$TARGET_ENV_EXAMPLE" ]; then
    # Keys missing locally -> to be appended.
    grep -E '^[A-Za-z_][A-Za-z0-9_]*=' "$TARGET_ENV_EXAMPLE" | cut -d= -f1 | while IFS= read -r k; do
        grep -qE "^${k}=" .env || echo "$k" >> "$ENV_ADDED"
    done
    # Keys the user has that no longer appear in the new example -> report only.
    grep -E '^[A-Za-z_][A-Za-z0-9_]*=' .env | cut -d= -f1 | while IFS= read -r k; do
        grep -qE "^${k}=" "$TARGET_ENV_EXAMPLE" || echo "$k" >> "$ENV_REMOVED"
    done

    if [ -s "$ENV_ADDED" ] && [ "$DRY_RUN" != "1" ]; then
        {
            echo ""
            echo "############"
            echo "# Added by update.sh on $(date +%Y-%m-%d) from .env.example ($TARGET_REF)."
            echo "# Review and set values as needed."
            echo "############"
            while IFS= read -r k; do
                # Copy the line (with its default) from the new example.
                grep -E "^${k}=" "$TARGET_ENV_EXAMPLE" | head -n1
            done < "$ENV_ADDED"
        } >> .env
    fi
fi

# --- Changelog surfacing -----------------------------------------------------

CHANGELOG="$TARGET_DIR/CHANGELOG.md"
CHANGELOG_SLICE="$TMP_ROOT/changelog_slice"
: > "$CHANGELOG_SLICE"
if [ -f "$CHANGELOG" ]; then
    if [ -n "$BASE_DATE" ]; then
        # From the top down to (not including) the section for the base date.
        awk -v stop="## [$BASE_DATE]" '
            index($0, stop) == 1 { exit }
            { print }
        ' "$CHANGELOG" > "$CHANGELOG_SLICE"
    else
        # Unknown base date: show everything above the second dated section.
        awk '
            /^## \[/ { dated++ ; if (dated == 2) exit }
            { print }
        ' "$CHANGELOG" > "$CHANGELOG_SLICE"
    fi
fi

TARGET_DATE=$(grep -oE '## \[[0-9]{4}-[0-9]{2}-[0-9]{2}\]' "$CHANGELOG" 2>/dev/null \
    | head -n1 | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}' || true)

# --- Breaking-change gate (manifest-driven) ----------------------------------
# Behavior comes from docker/upgrades.json (structured), never from parsing the
# changelog prose. The changelog is shown to the human (below); it does not gate.
# We stop only for genuine manual actions: a release flagged `breaking`, or one
# carrying a `gate` script (e.g. utils/upgrade-pg17.sh) the user must run first.
# Routine "requires docker-compose.yml update" items are already applied by the
# 3-way merge above, so they are intentionally NOT gates.

MANIFEST="$TARGET_DIR/upgrades.json"
GATE_REQUIRED=0
GATE_REPORT="$TMP_ROOT/gate_report"; : > "$GATE_REPORT"

if [ -f "$MANIFEST" ] && command -v jq >/dev/null 2>&1; then
    # ISO dates compared numerically (strip dashes) — portable, unlike [ \> ].
    base_n=""; target_n=""
    if [ -n "$BASE_DATE" ];   then base_n=$(echo "$BASE_DATE" | tr -d '-'); fi
    if [ -n "$TARGET_DATE" ]; then target_n=$(echo "$TARGET_DATE" | tr -d '-'); fi
    for k in $(jq -r 'keys[]' "$MANIFEST" 2>/dev/null); do
        # Date-keyed entries only, within the window (BASE_DATE, TARGET_DATE].
        case "$k" in [0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]) ;; *) continue ;; esac
        k_n=$(echo "$k" | tr -d '-')
        if [ -n "$target_n" ] && [ "$k_n" -gt "$target_n" ]; then continue; fi
        if [ -n "$base_n" ]; then [ "$k_n" -gt "$base_n" ] || continue; fi

        breaking=$(jq -r --arg k "$k" '.[$k].breaking // false' "$MANIFEST")
        gate=$(jq -r --arg k "$k" '.[$k].gate // empty' "$MANIFEST")
        url=$(jq -r --arg k "$k" '.[$k].migration_guide_url // empty' "$MANIFEST")
        reqs=$(jq -r --arg k "$k" '.[$k].requires[]? // empty' "$MANIFEST")

        if [ "$breaking" = "true" ] || [ -n "$gate" ]; then GATE_REQUIRED=1; fi

        {
            [ "$breaking" = "true" ] && echo "[$k] BREAKING" || echo "[$k]"
            [ -n "$gate" ] && echo "    gate: run '$gate' before continuing"
            [ -n "$url" ]  && echo "    guide: $url"
            [ -n "$reqs" ] && printf '%s\n' "$reqs" | sed 's/^/    - /'
        } >> "$GATE_REPORT"
    done
elif [ -f "$MANIFEST" ]; then
    warn "jq not found; cannot read upgrades.json for the gate. Review the changelog below carefully."
fi

if [ "$GATE_REQUIRED" = "1" ] && [ "$DRY_RUN" != "1" ] && [ "$ASSUME_YES" != "1" ]; then
    echo "" >&2
    warn "This upgrade requires manual action — review before continuing:"
    sed 's/^/    /' "$GATE_REPORT" >&2
    echo "" >&2
    if { : > /dev/tty; } 2>/dev/null; then
        printf "Have you completed the required steps and want to continue? [y/N]: " > /dev/tty
        read -r reply < /dev/tty
        case "$reply" in
            y|Y|yes|YES) : ;;
            *) die "Aborted by user. Your deployment was not modified beyond the backup." ;;
        esac
    else
        die "Breaking/gated changes present and no controlling terminal to confirm. Re-run with --yes to proceed."
    fi
fi

# --- Summary -----------------------------------------------------------------

count() { grep -cE "^$1:" "$REPORT" 2>/dev/null || true; }
list_status() { grep -E "^$1:" "$REPORT" 2>/dev/null | cut -d: -f2- | sed 's/^/    /'; }

echo ""
if [ "$DRY_RUN" = "1" ]; then
    log "DRY RUN — the following WOULD change (nothing was written):"
else
    log "Upgrade applied. Summary:"
fi
printf "  updated:          %s\n" "$(count updated)"
printf "  new:              %s\n" "$(count new)"
printf "  merged (clean):   %s\n" "$(count merged-clean)"
printf "  CONFLICTS:        %s\n" "$(count CONFLICT)"
printf "  removed upstream: %s\n" "$(count removed-upstream)"
printf "  env keys added:   %s\n" "$( [ -f "$ENV_ADDED" ] && wc -l < "$ENV_ADDED" | tr -d ' ' || echo 0 )"

if [ "$(count CONFLICT)" != "0" ]; then
    echo ""
    warn "Files with merge conflicts (edit these and remove the <<<<<<< ======= >>>>>>> markers):"
    list_status CONFLICT
fi
if [ "$(count merged-clean)" != "0" ]; then
    echo ""
    log "Files merged cleanly (review recommended):"
    list_status merged-clean
fi
if [ "$(count removed-upstream)" != "0" ]; then
    echo ""
    log "Removed upstream but kept in place (you may no longer need these):"
    list_status removed-upstream
fi
if [ -s "$ENV_ADDED" ]; then
    echo ""
    log ".env keys added (review values):"
    sed 's/^/    + /' "$ENV_ADDED"
fi
if [ -s "$ENV_REMOVED" ]; then
    echo ""
    log ".env keys you have that are gone from the new .env.example (review/remove manually):"
    sed 's/^/    - /' "$ENV_REMOVED"
fi
if [ -s "$GATE_REPORT" ]; then
    echo ""
    log "Required manual steps for this upgrade (from upgrades.json):"
    sed 's/^/  /' "$GATE_REPORT"
fi
if [ -s "$CHANGELOG_SLICE" ]; then
    echo ""
    log "Changelog since your version:"
    sed 's/^/  /' "$CHANGELOG_SLICE"
fi

# --- Finish ------------------------------------------------------------------

if [ "$DRY_RUN" = "1" ]; then
    echo ""
    log "Dry run complete. Re-run without --dry-run to apply."
    exit 0
fi

# Stamp the new version.
NEW_DATE=""
[ -f "$CHANGELOG" ] && NEW_DATE=$(grep -oE '## \[[0-9]{4}-[0-9]{2}-[0-9]{2}\]' "$CHANGELOG" | head -n1 | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}')
{
    echo "# Supabase self-hosted version stamp. Managed by setup.sh / update.sh."
    echo "ref=$TARGET_REF"
    [ -n "$NEW_DATE" ] && echo "date=$NEW_DATE"
} > "$STAMP_FILE"

echo ""
log "Next steps:"
echo "  1. Review the changes (git diff, or compare against the backup in backups/)."
echo "  2. sh run.sh pull"
echo "  3. sh run.sh recreate"

if [ "$(count CONFLICT)" != "0" ]; then
    echo ""
    warn "Upgrade applied WITH CONFLICTS. Resolve the files listed above (remove the"
    warn "<<<<<<< ======= >>>>>>> markers) before starting the stack. Exiting with status 2."
    exit 2
fi
log "Upgrade applied cleanly."
