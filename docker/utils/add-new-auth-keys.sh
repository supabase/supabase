#!/bin/sh
#
# Add asymmetric key pair and opaque API keys to a self-hosted Supabase installation.
#
# Reads JWT_SECRET from .env and generates:
#   - EC P-256 key pair (JWT_KEYS, JWT_JWKS)
#   - Opaque API keys (SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY)
#   - Internal: ES256 JWT API keys (ANON_KEY_ASYMMETRIC, SERVICE_ROLE_KEY_ASYMMETRIC)
#
# Usage:
#   sh add-new-auth-keys.sh              # Interactive: prints keys, prompts to update .env
#   sh add-new-auth-keys.sh --update-env # Prints keys and writes them to .env
#   sh add-new-auth-keys.sh | tee keys   # Non-interactive: prints keys only
#
# Prerequisites:
#   - .env file with JWT_SECRET set (run generate-keys.sh first)
#   - openssl
#   - node >= 16
#

set -e

if ! command -v openssl >/dev/null 2>&1; then
    echo "Error: openssl is required but not found."
    exit 1
fi

if ! command -v node >/dev/null 2>&1; then
    echo "Error: node (>= 16) is required but not found."
    exit 1
fi

# Read JWT_SECRET from .env
if [ ! -f .env ]; then
    echo "Error: .env file not found. Run generate-keys.sh first."
    exit 1
fi

jwt_secret=$(grep '^JWT_SECRET=' .env | cut -d= -f2-)
if [ -z "$jwt_secret" ]; then
    echo "Error: JWT_SECRET not found in .env. Run generate-keys.sh first."
    exit 1
fi

tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT

# Generate EC P-256 private key
openssl ecparam -name prime256v1 -genkey -noout -out "$tmpdir/ec_private.pem" 2>/dev/null

# Node.js does the crypto-heavy work:
#   - PEM -> JWK conversion
#   - JWKS construction (with symmetric key included)
#   - ES256 JWT signing
#   - Opaque API key generation with checksum
node -e '
const crypto = require("crypto");
const fs = require("fs");

const pem = fs.readFileSync(process.argv[1]);
const jwtSecret = process.argv[2];

// EC key -> JWK
const privateKey = crypto.createPrivateKey(pem);
const jwkPrivate = privateKey.export({ format: "jwk" });

const kid = crypto.randomUUID();

// Symmetric key as JWK (base64url-encoded)
const octKey = {
    kty: "oct",
    k: Buffer.from(jwtSecret).toString("base64url"),
    alg: "HS256"
};

// JWKS with private key (for Auth to sign tokens)
const jwksKeypair = { keys: [
    { kty: "EC", kid, use: "sig", key_ops: ["sign", "verify"], alg: "ES256", ext: true,
      crv: jwkPrivate.crv, x: jwkPrivate.x, y: jwkPrivate.y, d: jwkPrivate.d },
    octKey
]};

// JWKS with public key only (for PostgREST, Realtime, Storage to verify)
const jwksPublic = { keys: [
    { kty: "EC", kid, use: "sig", key_ops: ["verify"], alg: "ES256", ext: true,
      crv: jwkPrivate.crv, x: jwkPrivate.x, y: jwkPrivate.y },
    octKey
]};

// Sign ES256 JWT
function signES256(payload) {
    const header = { alg: "ES256", typ: "JWT", kid };
    const b64Header = Buffer.from(JSON.stringify(header)).toString("base64url");
    const b64Payload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const data = b64Header + "." + b64Payload;
    const sig = crypto.sign("SHA256", Buffer.from(data), {
        key: privateKey,
        dsaEncoding: "ieee-p1363"
    }).toString("base64url");
    return data + "." + sig;
}

const iat = Math.floor(Date.now() / 1000);
const exp = iat + 5 * 365 * 24 * 3600; // 5 years

const anonJwt = signES256({ role: "anon", iss: "supabase", iat, exp });
const serviceJwt = signES256({ role: "service_role", iss: "supabase", iat, exp });

// Generate opaque API keys with checksum
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

// Output as KEY=value lines for shell to parse
console.log("SUPABASE_PUBLISHABLE_KEY=" + publishableKey);
console.log("SUPABASE_SECRET_KEY=" + secretKey);
console.log("ANON_KEY_ASYMMETRIC=" + anonJwt);
console.log("SERVICE_ROLE_KEY_ASYMMETRIC=" + serviceJwt);
console.log("JWT_KEYS=" + JSON.stringify(jwksKeypair.keys));
console.log("JWT_JWKS=" + JSON.stringify(jwksPublic));
' "$tmpdir/ec_private.pem" "$jwt_secret" > "$tmpdir/output"

# Read generated values
SUPABASE_PUBLISHABLE_KEY=$(grep '^SUPABASE_PUBLISHABLE_KEY=' "$tmpdir/output" | cut -d= -f2-)
SUPABASE_SECRET_KEY=$(grep '^SUPABASE_SECRET_KEY=' "$tmpdir/output" | cut -d= -f2-)
ANON_KEY_ASYMMETRIC=$(grep '^ANON_KEY_ASYMMETRIC=' "$tmpdir/output" | cut -d= -f2-)
SERVICE_ROLE_KEY_ASYMMETRIC=$(grep '^SERVICE_ROLE_KEY_ASYMMETRIC=' "$tmpdir/output" | cut -d= -f2-)
JWT_KEYS=$(grep '^JWT_KEYS=' "$tmpdir/output" | cut -d= -f2-)
JWT_JWKS=$(grep '^JWT_JWKS=' "$tmpdir/output" | cut -d= -f2-)

echo ""
echo "SUPABASE_PUBLISHABLE_KEY=${SUPABASE_PUBLISHABLE_KEY}"
echo "SUPABASE_SECRET_KEY=${SUPABASE_SECRET_KEY}"
echo ""
echo "JWT_KEYS=${JWT_KEYS}"
echo ""
echo "JWT_JWKS=${JWT_JWKS}"
echo ""
echo "To enable asymmetric key pair, the following should be enabled in docker-compose.yml:"
echo ""
echo "  Auth:     GOTRUE_JWT_KEYS: \${JWT_KEYS:-[]}"
echo "  Realtime: API_JWT_JWKS: \${JWT_JWKS:-{\"keys\":[]}}"
echo "  Storage:  JWT_JWKS: \${JWT_JWKS:-{\"keys\":[]}}"
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

# Append new variables if they don't exist, or update them if they do
for var in SUPABASE_PUBLISHABLE_KEY SUPABASE_SECRET_KEY ANON_KEY_ASYMMETRIC SERVICE_ROLE_KEY_ASYMMETRIC JWT_KEYS JWT_JWKS; do
    eval "val=\$$var"
    if grep -q "^${var}=" .env; then
        sed -i.old -e "s|^${var}=.*$|${var}=${val}|" .env
    else
        echo "${var}=${val}" >> .env
    fi
done

# Uncomment new auth configuration in docker-compose.yml
echo "Updating docker-compose.yml..."
if [ ! -f docker-compose.yml ]; then
    echo "Error: docker-compose.yml not found in $(pwd)"
    exit 1
fi

# Always fall through to the grep check
sed -i.old \
    -e '/^[ ]*#GOTRUE_JWT_KEYS:/ s/#//' \
    -e '/^[ ]*#API_JWT_JWKS:/ s/#//' \
    -e '/^[ ]*#JWT_JWKS:/ s/#//' \
    docker-compose.yml || true

if grep -q '^[ ]*GOTRUE_JWT_KEYS:' docker-compose.yml && \
   grep -q '^[ ]*API_JWT_JWKS:' docker-compose.yml && \
   grep -q '^[ ]*JWT_JWKS:' docker-compose.yml; then
    echo "Done."
else
    echo "Warning: could not edit docker-compose.yml. Uncomment auth configuration manually."
fi
