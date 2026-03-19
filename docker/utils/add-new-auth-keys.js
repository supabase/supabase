const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const envPath = path.resolve(process.cwd(), "docker/.env");

if (!fs.existsSync(envPath)) {
    console.error("Error: .env file not found in docker directory.");
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf8");
const jwtSecretMatch = envContent.match(/^JWT_SECRET=(.*)$/m);

if (!jwtSecretMatch) {
    console.error("Error: JWT_SECRET not found in .env.");
    process.exit(1);
}

const jwtSecret = jwtSecretMatch[1];
console.log("Found JWT_SECRET, generating keys...");

// 1. Generate EC P-256 key pair
const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", {
    namedCurve: "prime256v1",
});

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

// 2. Sign ES256 JWT
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

// 3. Generate opaque API keys with checksum
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

const keys = {
    SUPABASE_PUBLISHABLE_KEY: publishableKey,
    SUPABASE_SECRET_KEY: secretKey,
    ANON_KEY_ASYMMETRIC: anonJwt,
    SERVICE_ROLE_KEY_ASYMMETRIC: serviceJwt,
    JWT_KEYS: JSON.stringify(jwksKeypair.keys),
    JWT_JWKS: JSON.stringify(jwksPublic)
};

console.log("\nGenerated keys:");
for (const [k, v] of Object.entries(keys)) {
    console.log(`${k}=${v}`);
}

// 4. Update .env
let newEnvContent = envContent;
for (const [varName, value] of Object.entries(keys)) {
    const regex = new RegExp(`^${varName}=.*$`, "m");
    if (newEnvContent.match(regex)) {
        newEnvContent = newEnvContent.replace(regex, `${varName}=${value}`);
    } else {
        newEnvContent += `\n${varName}=${value}`;
    }
}

fs.writeFileSync(envPath, newEnvContent);
console.log("\nUpdated docker/.env successfully.");
