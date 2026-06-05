#!/bin/sh
#
# Validate the upgrade manifest and that the generated JSON is in sync.
#
#   - parse:       upgrades.yml is valid YAML
#   - drift:       upgrades.json == `yq -o=json upgrades.yml` (semantic compare,
#                  so yq formatting/version quirks don't cause false failures)
#   - schema:      each date-keyed entry has valid field types
#   - cross-check: a release marked breaking:true has a ⚠️ line in CHANGELOG.md
#                  for that date. Forward only — routine "requires … update"
#                  ⚠️ items are applied by update.sh's merge and intentionally
#                  have NO manifest entry, so the reverse is not required.
#
# Requires mikefarah yq v4 (dev/CI tool; not needed on user machines). Skips if
# yq is absent so it doesn't block local runs; CI installs yq.
#
# Usage:
#   sh tests/test-upgrades-manifest.sh      # run from the docker/ directory
#
set -eu

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
DOCKER_DIR=$(dirname "$SCRIPT_DIR")
cd "$DOCKER_DIR"

YML=upgrades.yml
JSON=upgrades.json
CHANGELOG=CHANGELOG.md

command -v jq >/dev/null 2>&1 || { echo "ERROR: jq is required"; exit 1; }
if ! command -v yq >/dev/null 2>&1; then
    echo "SKIP: yq (mikefarah v4) not installed; cannot validate the manifest."
    echo "      Install from https://github.com/mikefarah/yq"
    exit 0
fi
[ -f "$YML" ]  || { echo "ERROR: $YML missing"; exit 1; }
[ -f "$JSON" ] || { echo "ERROR: $JSON missing"; exit 1; }

TMP=$(mktemp -d)
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT INT TERM

PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); printf "  ok   - %s\n" "$1"; }
bad() { FAIL=$((FAIL+1)); printf "  FAIL - %s\n" "$1"; }

echo ""
echo "=== upgrades.yml parses ==="
if yq -o=json '.' "$YML" > "$TMP/from_yml.json" 2>"$TMP/err"; then
    ok "upgrades.yml is valid YAML"
else
    bad "upgrades.yml does not parse: $(cat "$TMP/err")"
    echo "=== Result: $PASS passed, $FAIL failed ==="; exit 1
fi

echo ""
echo "=== upgrades.json is in sync with upgrades.yml ==="
jq -S . "$TMP/from_yml.json" > "$TMP/gen.norm"
if jq -S . "$JSON" > "$TMP/committed.norm" 2>/dev/null; then
    if diff -u "$TMP/gen.norm" "$TMP/committed.norm" >/dev/null; then
        ok "upgrades.json matches upgrades.yml"
    else
        bad "upgrades.json is stale — run: sh utils/gen-upgrades-json.sh"
    fi
else
    bad "upgrades.json is not valid JSON"
fi

echo ""
echo "=== schema: date-keyed entries have valid field types ==="
for k in $(jq -r 'keys[]' "$TMP/from_yml.json"); do
    case "$k" in [0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]) ;; *) continue ;; esac
    errs=$(jq -r --arg k "$k" '.[$k] |
        [ (if (.breaking != null) and ((.breaking|type) != "boolean") then "breaking must be bool" else empty end),
          (if (.gate != null) and ((.gate|type) != "string") then "gate must be string|null" else empty end),
          (if (.migration_guide_url != null) and ((.migration_guide_url|type) != "string") then "migration_guide_url must be string|null" else empty end),
          (if (.requires != null) and ((.requires|type) != "array") then "requires must be array" else empty end)
        ] | join("; ")' "$TMP/from_yml.json")
    if [ -z "$errs" ]; then ok "entry $k valid"; else bad "entry $k: $errs"; fi
done

echo ""
echo "=== cross-check: breaking entries are flagged in CHANGELOG.md ==="
checked=0
for k in $(jq -r 'to_entries[] | select(.value.breaking == true) | .key' "$TMP/from_yml.json"); do
    case "$k" in [0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]) ;; *) continue ;; esac
    checked=$((checked+1))
    awk -v d="## [$k]" 'index($0,d)==1{f=1;next} /^## \[/{if(f)exit} f{print}' "$CHANGELOG" > "$TMP/section"
    if grep -qF '⚠️' "$TMP/section"; then
        ok "breaking $k flagged with ⚠️ in CHANGELOG"
    else
        bad "breaking $k has no ⚠️ line in its CHANGELOG.md section"
    fi
done
[ "$checked" = 0 ] && echo "  (no active breaking entries to cross-check)"

echo ""
echo "=== Result: $PASS passed, $FAIL failed ==="
[ "$FAIL" = 0 ] || exit 1
