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
#   - node (>= 16) or docker
#

set -e

node_ok() {
    command -v node >/dev/null 2>&1 || return 1
    major=$(node -v 2>/dev/null | sed 's/^v//' | cut -d. -f1)
    [ -n "$major" ] && [ "$major" -ge 16 ] 2>/dev/null
}

# Resolve how to run node: local install (>= 16) preferred, docker fallback.
if node_ok; then
    node_runner="node"
else
    if command -v node >/dev/null 2>&1; then
        echo "Local node $(node -v) is too old (need >= 16), falling back to docker."
    fi

    if ! command -v docker >/dev/null 2>&1; then
        echo "Error: requires either node (>= 16) or docker."
        exit 1
    fi

    if ! docker info >/dev/null 2>&1; then
        echo "Error: docker is installed but the daemon is not running."
        exit 1
    fi

    if ! docker image inspect node:22-alpine >/dev/null 2>&1; then
        echo "Pulling node:22-alpine (first-run only)..."
        docker pull node:22-alpine
    fi

    node_runner="docker run --rm node:22-alpine node"
fi

if [ ! -f .env ]; then
    echo "Error: .env file not found. Run generate-keys.sh first."
    exit 1
fi

tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT

$node_runner -e '
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
