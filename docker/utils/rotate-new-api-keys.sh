#!/bin/sh
#
# Rotate opaque API keys for a self-hosted Supabase installation.
#
# Regenerates SUPABASE_PUBLISHABLE_KEY and SUPABASE_SECRET_KEY
# without touching the asymmetric key pair (JWKS) or JWT tokens.
#
# Usage:
#   sh rotate-new-api-keys.sh              # Interactive: prints keys, prompts to update .env
#   sh rotate-new-api-keys.sh --update-env # Prints keys and writes them to .env
#   sh rotate-new-api-keys.sh | tee keys   # Non-interactive: prints keys only
#
# Prerequisites:
#   - .env file (run generate-keys.sh and add-new-auth-keys.sh first)
#   - node >= 16
#

set -e

if ! command -v node >/dev/null 2>&1; then
    echo "Error: node (>= 16) is required but not found."
    exit 1
fi

if [ ! -f .env ]; then
    echo "Error: .env file not found. Run generate-keys.sh first."
    exit 1
fi

tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT

node -e '
const crypto = require("crypto");

const PROJECT_REF = "supabase-self-hosted";

function generateOpaqueKey(prefix) {
    const random = crypto.randomBytes(17).toString("base64url").slice(0, 22);
    const intermediate = prefix + random;
    const checksum = crypto.createHash("sha256")
        .update(PROJECT_REF + "|" + intermediate)
        .digest("base64url")
        .slice(0, 8);
    return intermediate + "_" + checksum;
}

const publishableKey = generateOpaqueKey("sb_publishable_");
const secretKey = generateOpaqueKey("sb_secret_");

console.log("SUPABASE_PUBLISHABLE_KEY=" + publishableKey);
console.log("SUPABASE_SECRET_KEY=" + secretKey);
' > "$tmpdir/output"

SUPABASE_PUBLISHABLE_KEY=$(grep '^SUPABASE_PUBLISHABLE_KEY=' "$tmpdir/output" | cut -d= -f2-)
SUPABASE_SECRET_KEY=$(grep '^SUPABASE_SECRET_KEY=' "$tmpdir/output" | cut -d= -f2-)

echo ""
echo "SUPABASE_PUBLISHABLE_KEY=${SUPABASE_PUBLISHABLE_KEY}"
echo "SUPABASE_SECRET_KEY=${SUPABASE_SECRET_KEY}"
echo ""

if [ "$1" = "--update-env" ]; then
    update_env=true
elif test -t 0; then
    printf "Update .env file? (y/N) "
    read -r REPLY
    case "$REPLY" in
        [Yy]) update_env=true ;;
        *) update_env=false ;;
    esac
else
    echo "Running non-interactively. Pass --update-env to write to .env."
    update_env=false
fi

if [ "$update_env" != "true" ]; then
    exit 0
fi

echo "Updating .env..."

for var in SUPABASE_PUBLISHABLE_KEY SUPABASE_SECRET_KEY; do
    eval "val=\$$var"
    if grep -q "^${var}=" .env; then
        sed -i.old -e "s|^${var}=.*$|${var}=${val}|" .env
    else
        echo "${var}=${val}" >> .env
    fi
done
