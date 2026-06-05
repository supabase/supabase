#!/bin/sh
#
# Regenerate upgrades.json from upgrades.yml (the source of truth).
#
# upgrades.yml is hand-edited; update.sh reads the generated upgrades.json with
# jq (so user machines never need yq). Run this after editing upgrades.yml and
# commit both files. CI (tests/test-upgrades-manifest.sh) checks they match.
#
# Requires the mikefarah yq v4 binary: https://github.com/mikefarah/yq
# (distro packages often ship an incompatible v3 — install the v4 binary.)
#
# Usage:
#   sh utils/gen-upgrades-json.sh        # run from the docker/ directory
#
set -eu

cd "$(dirname "$0")/.."

command -v yq >/dev/null 2>&1 || {
    echo "ERROR: yq (mikefarah v4) not found. Install from https://github.com/mikefarah/yq" >&2
    exit 1
}

case "$(yq --version 2>&1)" in
    *v4.*) : ;;
    *) echo "ERROR: need mikefarah yq v4; found: $(yq --version 2>&1)" >&2; exit 1 ;;
esac

yq -o=json '.' upgrades.yml > upgrades.json
echo "Wrote upgrades.json from upgrades.yml"
