#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { webcrypto } from "node:crypto";

const keyId = process.argv[2];
const compact = process.argv[3] === '--compact';

if (!keyId) {
  console.error("Usage: kms-rsa-to-jwk.js <key-arn> [--compact]");
  process.exit(1);
}

// arn:partition:kms:region:account:key/uuid
const arnParts = keyId.split(":");
if (arnParts.length < 6 || arnParts[2] !== "kms") {
  throw new Error(`Invalid KMS ARN: ${keyId}`);
}

const region = arnParts[3];

const publicKeyB64 = execFileSync(
  "aws",
  [
    "kms",
    "get-public-key",
    "--key-id",
    keyId,
    "--query",
    "PublicKey",
    "--output",
    "text",
    "--region",
    region,
  ],
  { encoding: "utf8" },
).trim();

const spki = Buffer.from(publicKeyB64, "base64");

const key = await webcrypto.subtle.importKey(
  "spki",
  spki,
  {
    name: "RSASSA-PKCS1-v1_5",
    hash: "SHA-256",
  },
  true,
  ["verify"],
);

const jwk = await webcrypto.subtle.exportKey("jwk", key);

console.log(
  JSON.stringify(
    {
      ...jwk,
      ext: undefined,
      use: "sig",
      key_ops: ['sign', 'verify'],
      'aws:kms:arn': keyId,

      //kty: jwk.kty,
      //use: "sig",
      //alg: "RS256",
      //kid: keyId,
      //n: jwk.n,
      //e: jwk.e,
    },
    null,
    compact ? 0 : 2,
  ),
);
