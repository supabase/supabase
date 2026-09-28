#!/bin/sh
#
# Update an existing self-hosted Supabase deployment in place.
#
# The deployment directory mixes vendor-owned files (docker-compose.yml, the
# override files, volumes/*, scripts, .env.example) with user-owned state
# (.env, docker-compose.override.yml, volumes/db/data, volumes/storage, etc.).
# This script pulls a newer version of the Supabase files on top of yours
# using a 3-way merge against the version you started from, so local edits
# survive and genuine conflicts are surfaced rather than silently overwritten.
#
# The version you started from is recorded in .supabase-version (written by
# setup.sh). If it is missing, pass --from <ref> or follow the printed guidance.
#
# What it never touches: .env values you set, docker-compose.override.yml, and
# the data directories (volumes/db/data, volumes/storage, etc.). New keys from
# .env.example are appended to your .env; existing values are kept as-is.
#
# By default it updates to the latest self-hosted/v* release tag (or 'master'
# until the first tag exists). Pass --to to pin a specific tag/branch.
#
# Usage:
#   sh update.sh                       # update to the latest release tag
#   sh update.sh --dry-run             # show what would change, write nothing
#   sh update.sh --to <tag>            # update to a specific tag/branch
#   sh update.sh --from <ref>          # base to merge from (if no .supabase-version)
#   sh update.sh --yes                 # don't prompt, even on breaking changes
#
# Env:
#   SUPABASE_REPO_URL   Override the upstream repo (default: github supabase/supabase)
#
# Documentation: https://supabase.com/docs/guides/self-hosting/updating
#

set -e

cd "$(dirname "$0")"

# Pipeline (see main at the bottom):
#   resolve refs -> fetch base+target snapshots -> [report-only exit]
#   -> build manifest gate -> confirm_gate (before any writes)
#   -> backup → merge vendor files + .env keys -> summary → stamp
#
# Three trees for every vendor file path:
#   - base - upstream at BASE_REF (.supabase-version ref=, or --from)
#   - target - upstream at TARGET_REF (--to, or latest self-hosted/v* tag)
#   - user's - the deployment directory (cwd); _not_ a git checkout
#
# Git is only used to fetch snapshots (fetch_snapshot) and to run git merge-file.
#
# Breaking-change gate (upgrades.json on the target snapshot):
#   - Keyed by version (e.g. "0.7.0"); window = entries in (BASE_VER, TARGET_VER],
#     where the bounds are the base/target refs reduced to bare semver
#     (self-hosted/vX.Y.Z -> X.Y.Z) and compared with sort -V.
#   - If a bound is not a release tag (a commit SHA, or "master"), that side of
#     the window is left open and all applicable entries are shown with a warning.
#   - Prompt when an entry has breaking:true or a gate script; runs before
#     backup/merge so abort leaves the deployment untouched.
#   - CHANGELOG.md is never parsed (update.sh only points users at it); routine
#     "requires compose update" items are applied by the merge, not listed here.
#
# User-owned paths skipped during merge are defined in .gitignore (loaded from the
# target snapshot). git check-ignore --no-index applies negation rules (e.g.
# volumes/functions/** ignored except volumes/functions/main/index.ts).
# .git/ is excluded here only - never listed in .gitignore.
#
# .env is never 3-way merged: append missing keys from .env.example only.

# --- globals (set during main) -----------------------------------------------

REPO_URL="${SUPABASE_REPO_URL:-https://github.com/supabase/supabase}"
STAMP_FILE=".supabase-version"
SELF_NAME=$(basename "$0")
DRY_RUN=0
ASSUME_YES=0
TO_REF=""
FROM_REF=""

TARGET_REF=""
BASE_REF=""
BASE_VER=""
TARGET_VER=""
REPORT_ONLY=0

TMP_ROOT=""
TARGET_DIR=""
BASE_DIR=""
REPORT=""
ENV_ADDED=""
ENV_REMOVED=""
GATE_REPORT=""
GATE_REQUIRED=0
IGNORE_FILE=""
IGNORE_GIT_DIR=""

# --- logging -----------------------------------------------------------------

log()  { printf "===> %s\n" "$*"; }
warn() { printf "WARNING: %s\n" "$*" >&2; }
die()  { printf "ERROR: %s\n" "$*" >&2; exit 1; }

print_help() {
    awk 'NR==1 {next} /^#/ {sub(/^# ?/,""); print; next} {exit}' "$0"
}

# --- small helpers -----------------------------------------------------------

# load_ignore_file - vendor/user split from the target snapshot's .gitignore.
# Uses a throwaway git dir so check-ignore works on deployment trees that are
# not git repos (and on Apple Git, which rejects --git-dir=/dev/null).
load_ignore_file() {
    if [ -f "$TARGET_DIR/.gitignore" ]; then
        IGNORE_FILE="$TARGET_DIR/.gitignore"
    elif [ -f .gitignore ]; then
        IGNORE_FILE="$(pwd)/.gitignore"
    else
        IGNORE_FILE=""
        warn "No .gitignore found; only .git paths are excluded from the merge."
        return 0
    fi
    case "$IGNORE_FILE" in
        /*) ;;
        *) IGNORE_FILE="$(cd "$(dirname "$IGNORE_FILE")" && pwd)/$(basename "$IGNORE_FILE")" ;;
    esac
    IGNORE_GIT_DIR="$TMP_ROOT/ignore-git"
    git init -q "$IGNORE_GIT_DIR"
}

# is_excluded <relpath> - true when the path is user-owned and must not merge.
is_excluded() {
    case "$1" in
        .git|.git/*) return 0 ;;
    esac
    [ -n "$IGNORE_FILE" ] || return 1
    git -C "$IGNORE_GIT_DIR" -c "core.excludesfile=$IGNORE_FILE" \
        check-ignore -q --no-index "$1" 2>/dev/null
}

read_stamp_ref() {
    [ -f "$STAMP_FILE" ] || return 1
    val=$(grep -E '^ref=' "$STAMP_FILE" 2>/dev/null | head -n1 | cut -d= -f2- | tr -d "\r\"' ")
    if [ -z "$val" ]; then
        val=$(grep -vE '^[[:space:]]*#' "$STAMP_FILE" 2>/dev/null \
            | grep -vE '^[[:space:]]*$' | head -n1 | tr -d "\r\"' ")
    fi
    [ -n "$val" ] && printf '%s' "$val"
}

# env_has_key <key> <file> - true if the key appears as KEY=, even commented
# (e.g. "#GOOGLE_ENABLED="), so we never re-add a key the user disabled on purpose.
env_has_key() {
    grep -qE "^[[:space:]]*#?[[:space:]]*$1=" "$2" 2>/dev/null
}

record() { printf '%s:%s\n' "$1" "$2" >> "$REPORT"; }

count_status() { grep -cE "^$1:" "$REPORT" 2>/dev/null || true; }

list_status() {
    grep -E "^$1:" "$REPORT" 2>/dev/null | cut -d: -f2- | sed 's/^/    /'
}

# --- upstream snapshots ------------------------------------------------------

_sparse_init() {
    git -C "$1" init -q
    git -C "$1" remote add origin "$REPO_URL"
    git -C "$1" config core.sparseCheckout true
    git -C "$1" sparse-checkout init --cone >/dev/null 2>&1
    git -C "$1" sparse-checkout set docker >/dev/null 2>&1
}

# fetch_snapshot <ref> <dest_dir>
# Materializes ./docker at <ref> into <dest_dir> via a shallow fetch. Also the
# seam an artifact source (tarball + sha256) would slot into later.
fetch_snapshot() {
    _ref="$1"
    _dest="$2"
    _work=$(mktemp -d "$TMP_ROOT/fetch.XXXXXX")
    if _sparse_init "$_work" \
        && git -C "$_work" fetch --depth=1 --filter=blob:none -q origin "$_ref" 2>/dev/null \
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

latest_release_tag() {
    git ls-remote --tags --refs "$REPO_URL" 2>/dev/null \
        | sed 's#^.*refs/tags/##' \
        | grep -E '^self-hosted/v[0-9]' \
        | sort -V | tail -n1
}

list_files() {
    ( cd "$1" && find . -type f | sed 's|^\./||' | grep -vE '^\.git(/|$)' | sort )
}

# normalize_version <ref> - reduce a ref to bare semver (0.7.0) for comparison,
# or empty when it is not a self-hosted release tag (commit SHA, "master", …).
normalize_version() {
    _v="${1#refs/tags/}"
    _v="${_v#self-hosted/}"
    _v="${_v#v}"
    case "$_v" in
        [0-9]*.[0-9]*) printf '%s' "$_v" ;;
        *) ;;
    esac
}

# ver_gt A B - true when version A is strictly greater than B (sort -V order).
ver_gt() {
    if [ "$1" = "$2" ]; then return 1; fi
    [ "$(printf '%s\n%s\n' "$1" "$2" | sort -V | tail -n1)" = "$1" ]
}

# ver_in_window VER - true when BASE_VER < VER <= TARGET_VER. An empty bound
# leaves that side open (over-reports a gate rather than hiding one).
ver_in_window() {
    if [ -n "$TARGET_VER" ] && ver_gt "$1" "$TARGET_VER"; then return 1; fi
    if [ -n "$BASE_VER" ] && ! ver_gt "$1" "$BASE_VER"; then return 1; fi
    return 0
}

# --- ref resolution ----------------------------------------------------------

resolve_target_ref() {
    if [ -n "$TO_REF" ]; then
        TARGET_REF="$TO_REF"
        return
    fi
    TARGET_REF=$(latest_release_tag)
    if [ -n "$TARGET_REF" ]; then
        log "Latest release tag: $TARGET_REF"
    else
        TARGET_REF="master"
        warn "No self-hosted/v* release tags found; targeting 'master'. Pin a version with --to."
    fi
}

resolve_base_ref() {
    REPORT_ONLY=0
    if [ -n "$FROM_REF" ]; then
        BASE_REF="$FROM_REF"
    elif BASE_REF=$(read_stamp_ref) && [ -n "$BASE_REF" ]; then
        :
    else
        REPORT_ONLY=1
        BASE_REF=""
    fi
}

print_report_only_guidance() {
    warn "No $STAMP_FILE found and no --from <ref> given; cannot determine the version you started from."
    cat >&2 <<EOF

Without a base version a safe 3-way merge is not possible. To fix this, find the
version your deployment was based on and record it, then re-run:

  1. Identify your base - the self-hosted/vX.Y.Z release (or commit) your files
     came from. Cross-reference the image tags in docker-compose.yml / .env
     against versions.md, or the newest CHANGELOG.md section you remember pulling.
  2. Write it to $STAMP_FILE, e.g.:
         printf 'ref=self-hosted/v0.7.0\n' > $STAMP_FILE
  3. Re-run: sh update.sh

Or supply it inline for this run:  sh update.sh --from <commit-sha-or-tag>

Continuing in REPORT-ONLY mode. NOTE: this is NOT the full set of changes -
without a base version it can only list files and .env keys that are entirely
NEW to you; it CANNOT show which existing files would change or conflict. Record
a base and re-run for the real preview. Nothing will be written.
EOF
}

fetch_snapshots() {
    TARGET_DIR="$TMP_ROOT/target"
    log "Fetching target snapshot ($TARGET_REF)"
    fetch_snapshot "$TARGET_REF" "$TARGET_DIR" \
        || die "Could not fetch target snapshot '$TARGET_REF' from $REPO_URL"

    if [ "$REPORT_ONLY" = "1" ]; then
        return
    fi

    BASE_DIR="$TMP_ROOT/base"
    log "Fetching base snapshot ($BASE_REF)"
    fetch_snapshot "$BASE_REF" "$BASE_DIR" \
        || die "Could not fetch base snapshot '$BASE_REF' from $REPO_URL"
}

run_report_only() {
    log "Files in '$TARGET_REF' you do NOT have yet (brand-new only; existing files that changed are NOT shown here):"
    while IFS= read -r f; do
        is_excluded "$f" && continue
        [ -f "$f" ] || echo "  + $f"
    done <<EOF
$(list_files "$TARGET_DIR")
EOF
    echo ""
    log ".env keys in the new .env.example that your .env is missing (add these):"
    if [ -f "$TARGET_DIR/.env.example" ]; then
        while IFS= read -r k; do
            env_has_key "$k" .env || echo "  + $k"
        done <<EOF
$(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' "$TARGET_DIR/.env.example" | cut -d= -f1)
EOF
    fi
    echo ""
    warn "This is NOT the full update. To see what would actually change, record a base version."
    warn "See the guidance above and re-run the script. Nothing was written."
}

# --- breaking-change gate (manifest-driven, before any writes) ---------------
# Reads docker/upgrades.json from the target snapshot; gating keys off manifest
# entries in (BASE_VER, TARGET_VER].

build_gate_report() {
    _manifest="$TARGET_DIR/upgrades.json"
    GATE_REQUIRED=0
    : > "$GATE_REPORT"

    if [ ! -f "$_manifest" ]; then
        return 0
    fi
    if ! jq -e 'type == "object"' "$_manifest" >/dev/null 2>&1; then
        die "$_manifest is present but is not a valid JSON object; refusing to update without a working breaking-change gate. Please report this to the maintainers."
    fi

    if [ -z "$BASE_VER" ] || [ -z "$TARGET_VER" ]; then
        warn "Base or target is not a self-hosted/vX.Y.Z tag; cannot compute an exact update window."
        warn "Showing all applicable manual-action releases."
        warn "Review which ones apply to your deployment."
    fi

    for k in $(jq -r 'keys[]' "$_manifest" 2>/dev/null); do
        case "$k" in [0-9]*.[0-9]*) ;; *) continue ;; esac
        ver_in_window "$k" || continue

        breaking=$(jq -r --arg k "$k" '.[$k].breaking // false' "$_manifest")
        gate=$(jq -r --arg k "$k" '.[$k].gate // empty' "$_manifest")
        url=$(jq -r --arg k "$k" '.[$k].migration_guide_url // empty' "$_manifest")
        reqs=$(jq -r --arg k "$k" '.[$k].requires[]? // empty' "$_manifest")

        if [ "$breaking" = "true" ] || [ -n "$gate" ]; then
            GATE_REQUIRED=1
        fi

        {
            [ "$breaking" = "true" ] && echo "[$k] BREAKING" || echo "[$k]"
            [ -n "$gate" ] && echo "    gate: '$gate' must be run first (see the steps below for the exact command)"
            [ -n "$url" ]  && echo "    guide: $url"
            [ -n "$reqs" ] && printf '%s\n' "$reqs" | sed 's/^/    - /'
        } >> "$GATE_REPORT"
    done
    # Explicit success: the loop's last iteration can end on a false test (e.g.
    # an entry with no 'requires'), which would otherwise make this function
    # return non-zero and abort the whole script under 'set -e'.
    return 0
}

confirm_gate() {
    [ "$GATE_REQUIRED" = "1" ] || return 0
    [ "$DRY_RUN" != "1" ] || return 0
    [ "$ASSUME_YES" != "1" ] || return 0

    echo "" >&2
    warn "This update requires manual action - review before continuing:"
    sed 's/^/    /' "$GATE_REPORT" >&2
    echo "" >&2

    if { : > /dev/tty; } 2>/dev/null; then
        printf "Have you completed the required steps and want to continue? [y/N]: " > /dev/tty
        read -r reply < /dev/tty
        case "$reply" in
            y|Y|yes|YES) return 0 ;;
            *) die "Aborted by user. Nothing was modified." ;;
        esac
    fi
    die "Breaking/gated changes present and no controlling terminal to confirm. Re-run with --yes to proceed."
}

# --- backup ------------------------------------------------------------------

take_backup() {
    if [ "$DRY_RUN" = "1" ]; then
        log "Dry run: no backup taken, nothing will be written."
        return 0
    fi
    mkdir -p backups
    _backup="backups/pre-update-$(date +%Y%m%d-%H%M%S).tgz"
    log "Backing up current configuration to $_backup (excluding data directories)"
    tar czf "$_backup" \
        --exclude='./backups' \
        --exclude='./volumes/db/data' \
        --exclude='./volumes/storage' \
        . 2>/dev/null || warn "Backup archive reported errors; review $_backup before relying on it."
    warn "This does NOT back up your database. Back it up separately before updating."
}

# --- vendor file merge -------------------------------------------------------

apply_file() {
    [ "$DRY_RUN" = "1" ] && return 0
    _dir=$(dirname "$1")
    [ "$_dir" = "." ] || mkdir -p "$_dir"
    cp -f "$2" "$1"
}

# Per-file 3-way merge (u=yours, b=base snapshot, t=target snapshot):
#   no t           → keep u; report removed-upstream
#   no u           → copy t; report new
#   u == t         → report unchanged
#   u == b         → copy t; report updated (user never edited)
#   else           → git merge-file u b t; report merged-clean or CONFLICT
# If b had no file, an empty file stands in for b.
merge_one_file() {
    f="$1"
    empty="$2"
    merged="$TMP_ROOT/merged.out"

    b="$BASE_DIR/$f"
    t="$TARGET_DIR/$f"
    u="$f"

    if [ ! -f "$t" ]; then
        [ -f "$u" ] && record "removed-upstream" "$f"
        return 0
    fi

    if [ ! -f "$u" ]; then
        apply_file "$f" "$t"
        record "new" "$f"
        return 0
    fi

    if cmp -s "$u" "$t"; then
        record "unchanged" "$f"
        return 0
    fi

    base_for_merge="$b"
    [ -f "$base_for_merge" ] || base_for_merge="$empty"

    if cmp -s "$u" "$base_for_merge"; then
        apply_file "$f" "$t"
        record "updated" "$f"
        return 0
    fi

    if git merge-file -p -q \
        -L "yours ($f)" -L "base" -L "new ($TARGET_REF)" \
        "$u" "$base_for_merge" "$t" > "$merged" 2>/dev/null; then
        [ "$DRY_RUN" != "1" ] && cp -f "$merged" "$u"
        record "merged-clean" "$f"
    elif [ -s "$merged" ]; then
        # Non-zero exit with output = a normal conflict (markers written).
        [ "$DRY_RUN" != "1" ] && cp -f "$merged" "$u"
        record "CONFLICT" "$f"
    else
        # git merge-file errored and produced no output; keep the user's file
        # intact rather than truncating it to empty.
        record "merge-failed" "$f"
    fi
}

# The running script is a vendor file too, but overwriting it in place would
# corrupt this process (the shell reads $0 as it runs). Never write it directly:
# if the target ships a different version, stage it as <name>.dist to review.
stage_self_update() {
    _t="$TARGET_DIR/$SELF_NAME"
    if [ ! -f "$_t" ] || cmp -s "$SELF_NAME" "$_t"; then
        record "unchanged" "$SELF_NAME"
        return 0
    fi
    [ "$DRY_RUN" = "1" ] || cp -f "$_t" "$SELF_NAME.dist"
    record "self-staged" "$SELF_NAME"
}

merge_vendor_files() {
    _empty="$TMP_ROOT/empty"
    : > "$_empty"
    : > "$REPORT"

    while IFS= read -r f; do
        [ -n "$f" ] || continue
        is_excluded "$f" && continue
        if [ "$f" = "$SELF_NAME" ]; then
            stage_self_update
            continue
        fi
        merge_one_file "$f" "$_empty"
    done <<EOF
$( { list_files "$BASE_DIR"; list_files "$TARGET_DIR"; } | sort -u )
EOF
}

# --- .env key-union merge ----------------------------------------------------

merge_env_file() {
    _example="$TARGET_DIR/.env.example"
    : > "$ENV_ADDED"
    : > "$ENV_REMOVED"
    [ -f "$_example" ] || return 0

    while IFS= read -r k; do
        env_has_key "$k" .env || echo "$k" >> "$ENV_ADDED"
    done <<EOF
$(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' "$_example" | cut -d= -f1)
EOF

    while IFS= read -r k; do
        env_has_key "$k" "$_example" || echo "$k" >> "$ENV_REMOVED"
    done <<EOF
$(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' .env | cut -d= -f1)
EOF

    if [ ! -s "$ENV_ADDED" ] || [ "$DRY_RUN" = "1" ]; then
        return 0
    fi

    {
        echo ""
        echo "############"
        echo "# Added by update.sh on $(date +%Y-%m-%d) from .env.example ($TARGET_REF)."
        echo "# Review and set values as needed."
        echo "############"
        while IFS= read -r k; do
            grep -E "^${k}=" "$_example" | head -n1
        done < "$ENV_ADDED"
    } >> .env
}

# --- summary and finish ------------------------------------------------------

print_summary() {
    echo ""
    if [ "$DRY_RUN" = "1" ]; then
        log "DRY RUN - the following WOULD change (nothing was written):"
    else
        log "Update applied. Summary:"
    fi
    printf "  updated:          %s\n" "$(count_status updated)"
    printf "  new:              %s\n" "$(count_status new)"
    printf "  merged (clean):   %s\n" "$(count_status merged-clean)"
    printf "  CONFLICTS:        %s\n" "$(count_status CONFLICT)"
    printf "  merge failures:   %s\n" "$(count_status merge-failed)"
    printf "  removed upstream: %s\n" "$(count_status removed-upstream)"
    printf "  env keys added:   %s\n" "$( [ -s "$ENV_ADDED" ] && wc -l < "$ENV_ADDED" | tr -d ' ' || echo 0 )"

    if [ "$(count_status CONFLICT)" != "0" ]; then
        echo ""
        warn "Files with merge conflicts (edit these and remove the <<<<<<< ======= >>>>>>> markers):"
        list_status CONFLICT
    fi
    if [ "$(count_status merge-failed)" != "0" ]; then
        echo ""
        warn "Files git could not merge (left unchanged - update these manually):"
        list_status merge-failed
    fi
    if [ "$(count_status merged-clean)" != "0" ]; then
        echo ""
        log "Files merged cleanly (review recommended):"
        list_status merged-clean
    fi
    if [ "$(count_status removed-upstream)" != "0" ]; then
        echo ""
        log "Removed upstream but kept in place (you may no longer need these):"
        list_status removed-upstream
    fi
    if [ "$(count_status self-staged)" != "0" ]; then
        echo ""
        if [ "$DRY_RUN" = "1" ]; then
            log "$SELF_NAME differs from the version in '$TARGET_REF'; a real run would stage that version as $SELF_NAME.dist (the running script is never overwritten in place)."
        else
            log "$SELF_NAME differs from the version in '$TARGET_REF', staged as $SELF_NAME.dist (the running script was not modified)."
            log "Review it, then swap it in if needed: mv $SELF_NAME.dist $SELF_NAME"
        fi
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
        log "Required manual steps for this update (from upgrades.json):"
        sed 's/^/  /' "$GATE_REPORT"
    fi
    echo ""
    log "For what changed in this update, see CHANGELOG.md (from $BASE_REF to $TARGET_REF)."
}

write_stamp() {
    {
        echo "# Supabase self-hosted version stamp. Managed by setup.sh / update.sh."
        echo "# Do not commit or edit by hand. Records the ref this deployment was based on."
        echo "ref=$TARGET_REF"
    } > "$STAMP_FILE"
}

print_next_steps() {
    echo ""
    log "Next steps:"
    echo "  1. Review the changes above (compare against the latest backup in backups/ if needed)."
    echo "  2. sh run.sh pull"
    echo "  3. sh run.sh recreate"
}

# --- main --------------------------------------------------------------------

while [ $# -gt 0 ]; do
    case "$1" in
        --dry-run)  DRY_RUN=1; shift ;;
        --yes|-y)   ASSUME_YES=1; shift ;;
        --to)       [ $# -ge 2 ] || die "--to requires a <tag> argument."; TO_REF="$2"; shift 2 ;;
        --from)     [ $# -ge 2 ] || die "--from requires a <ref> argument."; FROM_REF="$2"; shift 2 ;;
        -h|--help)  print_help; exit 0 ;;
        *) echo "Unknown option: $1" >&2; print_help; exit 1 ;;
    esac
done

[ -f docker-compose.yml ] || die "docker-compose.yml not found in $(pwd). Run this from your deployment directory."
[ -f .env ] || die ".env not found in $(pwd). This does not look like a configured deployment."
command -v git >/dev/null 2>&1 || die "git is required but was not found on PATH."
command -v jq >/dev/null 2>&1 || die "jq is required but was not found on PATH."

resolve_target_ref
resolve_base_ref
TARGET_VER=$(normalize_version "$TARGET_REF")
BASE_VER=$(normalize_version "$BASE_REF")
[ "$REPORT_ONLY" = "1" ] && print_report_only_guidance

TMP_ROOT=$(mktemp -d)
REPORT="$TMP_ROOT/report"
ENV_ADDED="$TMP_ROOT/env_added"
ENV_REMOVED="$TMP_ROOT/env_removed"
GATE_REPORT="$TMP_ROOT/gate_report"
trap 'rm -rf "$TMP_ROOT"' EXIT INT TERM

fetch_snapshots
load_ignore_file

if [ "$REPORT_ONLY" = "1" ]; then
    run_report_only
    build_gate_report
    if [ -s "$GATE_REPORT" ]; then
        echo ""
        log "Breaking changes / required manual steps in this range (from upgrades.json):"
        sed 's/^/  /' "$GATE_REPORT"
        warn "Record a base version (see above) and re-run to apply with the gate enforced."
    fi
    exit 0
fi

build_gate_report
confirm_gate

take_backup
merge_vendor_files
merge_env_file
print_summary

if [ "$DRY_RUN" = "1" ]; then
    echo ""
    log "Dry run complete. Re-run without --dry-run to apply."
    exit 0
fi

if [ "$(count_status CONFLICT)" != "0" ] || [ "$(count_status merge-failed)" != "0" ]; then
    echo ""
    warn "Update applied WITH CONFLICTS. Resolve the files listed above (remove the"
    warn "<<<<<<< ======= >>>>>>> markers, or fix the files git could not merge)"
    warn "before starting the stack."
    warn "The version stamp was NOT advanced; it will update on your next clean run."
    warn "Exiting with status 2."
    exit 2
fi

write_stamp
print_next_steps
log "Update applied cleanly."
