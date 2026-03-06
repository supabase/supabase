#!/bin/sh
#
# Generate asymmetric keys for self-hosted Supabase.
#
# This script adds ES256 asymmetric JWT support on top of an existing
# self-hosted installation. It reads JWT_SECRET from .env and generates:
#
#   - EC P-256 key pair (JWKS_KEYPAIR, JWKS_PUBLIC)
#   - Opaque API keys (SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY)
#   - ES256 JWT API keys (ANON_KEY_ASYMMETRIC, SERVICE_ROLE_KEY_ASYMMETRIC)
#
# Prerequisites:
#   - .env file with JWT_SECRET set (run generate-keys.sh first)
#   - openssl (for EC key generation)
#   - node >= 16 (for JWK export and ES256 JWT signing)
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
console.log("JWKS_KEYPAIR=" + JSON.stringify(jwksKeypair));
console.log("JWKS_PUBLIC=" + JSON.stringify(jwksPublic));
' "$tmpdir/ec_private.pem" "$jwt_secret" > "$tmpdir/output"

# Read generated values
supabase_publishable_key=$(grep '^SUPABASE_PUBLISHABLE_KEY=' "$tmpdir/output" | cut -d= -f2-)
supabase_secret_key=$(grep '^SUPABASE_SECRET_KEY=' "$tmpdir/output" | cut -d= -f2-)
anon_key_asymmetric=$(grep '^ANON_KEY_ASYMMETRIC=' "$tmpdir/output" | cut -d= -f2-)
service_role_key_asymmetric=$(grep '^SERVICE_ROLE_KEY_ASYMMETRIC=' "$tmpdir/output" | cut -d= -f2-)
jwks_keypair=$(grep '^JWKS_KEYPAIR=' "$tmpdir/output" | cut -d= -f2-)
jwks_public=$(grep '^JWKS_PUBLIC=' "$tmpdir/output" | cut -d= -f2-)

echo ""
echo "SUPABASE_PUBLISHABLE_KEY=${supabase_publishable_key}"
echo "SUPABASE_SECRET_KEY=${supabase_secret_key}"
echo ""
echo "ANON_KEY_ASYMMETRIC=${anon_key_asymmetric}"
echo "SERVICE_ROLE_KEY_ASYMMETRIC=${service_role_key_asymmetric}"
echo ""
echo "JWKS_KEYPAIR=${jwks_keypair}"
echo ""
echo "JWKS_PUBLIC=${jwks_public}"
echo ""

if ! test -t 0; then
    echo "Running non-interactively. Skipping .env update."
    exit 0
fi

printf "Update .env file? (y/N) "
read -r REPLY
case "$REPLY" in
    [Yy])
        ;;
    *)
        echo "Not updating .env"
        exit 0
        ;;
esac

echo "Updating .env..."

# Append new variables if they don't exist, or update them if they do
for var in SUPABASE_PUBLISHABLE_KEY SUPABASE_SECRET_KEY ANON_KEY_ASYMMETRIC SERVICE_ROLE_KEY_ASYMMETRIC JWKS_KEYPAIR JWKS_PUBLIC; do
    eval "val=\$$var"
    if grep -q "^${var}=" .env; then
        sed -i.old -e "s|^${var}=.*$|${var}=${val}|" .env
    else
        echo "${var}=${val}" >> .env
    fi
done
