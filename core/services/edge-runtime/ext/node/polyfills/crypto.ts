// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { ERR_CRYPTO_FIPS_FORCED } from "ext:deno_node/internal/errors.ts";
import { crypto as constants } from "ext:deno_node/internal_binding/constants.ts";
import { getOptionValue } from "ext:deno_node/internal/options.ts";
import {
  getFipsCrypto,
  setFipsCrypto,
  timingSafeEqual,
} from "ext:deno_node/internal_binding/crypto.ts";
import {
  checkPrime,
  checkPrimeSync,
  generatePrime,
  generatePrimeSync,
  randomBytes,
  randomFill,
  randomFillSync,
  randomInt,
  randomUUID,
} from "ext:deno_node/internal/crypto/random.ts";
import type {
  CheckPrimeOptions,
  GeneratePrimeOptions,
  GeneratePrimeOptionsArrayBuffer,
  GeneratePrimeOptionsBigInt,
  LargeNumberLike,
} from "ext:deno_node/internal/crypto/random.ts";
import { pbkdf2, pbkdf2Sync } from "ext:deno_node/internal/crypto/pbkdf2.ts";
import type {
  Algorithms,
  NormalizedAlgorithms,
} from "ext:deno_node/internal/crypto/pbkdf2.ts";
import { scrypt, scryptSync } from "ext:deno_node/internal/crypto/scrypt.ts";
import { hkdf, hkdfSync } from "ext:deno_node/internal/crypto/hkdf.ts";
import {
  generateKey,
  generateKeyPair,
  generateKeyPairSync,
  generateKeySync,
} from "ext:deno_node/internal/crypto/keygen.ts";
import type {
  BasePrivateKeyEncodingOptions,
  DSAKeyPairKeyObjectOptions,
  DSAKeyPairOptions,
  ECKeyPairKeyObjectOptions,
  ECKeyPairOptions,
  ED25519KeyPairKeyObjectOptions,
  ED25519KeyPairOptions,
  ED448KeyPairKeyObjectOptions,
  ED448KeyPairOptions,
  KeyPairKeyObjectResult,
  KeyPairSyncResult,
  RSAKeyPairKeyObjectOptions,
  RSAKeyPairOptions,
  RSAPSSKeyPairKeyObjectOptions,
  RSAPSSKeyPairOptions,
  X25519KeyPairKeyObjectOptions,
  X25519KeyPairOptions,
  X448KeyPairKeyObjectOptions,
  X448KeyPairOptions,
} from "ext:deno_node/internal/crypto/keygen.ts";
import {
  createPrivateKey,
  createPublicKey,
  createSecretKey,
  KeyObject,
} from "ext:deno_node/internal/crypto/keys.ts";
import type {
  AsymmetricKeyDetails,
  JsonWebKeyInput,
  JwkKeyExportOptions,
  KeyExportOptions,
  KeyObjectType,
} from "ext:deno_node/internal/crypto/keys.ts";
import {
  DiffieHellman,
  diffieHellman,
  DiffieHellmanGroup,
  ECDH,
} from "ext:deno_node/internal/crypto/diffiehellman.ts";
import {
  Cipheriv,
  Decipheriv,
  privateDecrypt,
  privateEncrypt,
  publicDecrypt,
  publicEncrypt,
} from "ext:deno_node/internal/crypto/cipher.ts";
import type {
  Cipher,
  CipherCCM,
  CipherCCMOptions,
  CipherCCMTypes,
  CipherGCM,
  CipherGCMOptions,
  CipherGCMTypes,
  CipherKey,
  CipherOCB,
  CipherOCBOptions,
  CipherOCBTypes,
  Decipher,
  DecipherCCM,
  DecipherGCM,
  DecipherOCB,
} from "ext:deno_node/internal/crypto/cipher.ts";
import type {
  BinaryLike,
  BinaryToTextEncoding,
  CharacterEncoding,
  ECDHKeyFormat,
  Encoding,
  HASH_DATA,
  KeyFormat,
  KeyType,
  LegacyCharacterEncoding,
  PrivateKeyInput,
  PublicKeyInput,
} from "ext:deno_node/internal/crypto/types.ts";
import {
  Sign,
  signOneShot,
  Verify,
  verifyOneShot,
} from "ext:deno_node/internal/crypto/sig.ts";
import type {
  DSAEncoding,
  KeyLike,
  SigningOptions,
  SignKeyObjectInput,
  SignPrivateKeyInput,
  VerifyKeyObjectInput,
  VerifyPublicKeyInput,
} from "ext:deno_node/internal/crypto/sig.ts";
import {
  createHash,
  getHashes,
  Hash,
  Hmac,
} from "ext:deno_node/internal/crypto/hash.ts";
import { X509Certificate } from "ext:deno_node/internal/crypto/x509.ts";
import type {
  PeerCertificate,
  X509CheckOptions,
} from "ext:deno_node/internal/crypto/x509.ts";
import {
  getCipherInfo,
  getCiphers,
  getCurves,
  secureHeapUsed,
  setEngine,
} from "ext:deno_node/internal/crypto/util.ts";
import type { SecureHeapUsage } from "ext:deno_node/internal/crypto/util.ts";
import Certificate from "ext:deno_node/internal/crypto/certificate.ts";
import type {
  TransformOptions,
  WritableOptions,
} from "ext:deno_node/_stream.d.ts";
import { crypto as webcrypto } from "ext:deno_crypto/00_crypto.js";

const subtle = webcrypto.subtle;
const fipsForced = getOptionValue("--force-fips");

function getRandomValues(typedArray) {
  return webcrypto.getRandomValues(typedArray);
}

function createCipheriv(
  algorithm: CipherCCMTypes,
  key: CipherKey,
  iv: BinaryLike,
  options: CipherCCMOptions,
): CipherCCM;
function createCipheriv(
  algorithm: CipherOCBTypes,
  key: CipherKey,
  iv: BinaryLike,
  options: CipherOCBOptions,
): CipherOCB;
function createCipheriv(
  algorithm: CipherGCMTypes,
  key: CipherKey,
  iv: BinaryLike,
  options?: CipherGCMOptions,
): CipherGCM;
function createCipheriv(
  algorithm: string,
  key: CipherKey,
  iv: BinaryLike | null,
  options?: TransformOptions,
): Cipher;
function createCipheriv(
  cipher: string,
  key: CipherKey,
  iv: BinaryLike | null,
  options?: TransformOptions,
): Cipher {
  return new Cipheriv(cipher, key, iv, options);
}

function createDecipheriv(
  algorithm: CipherCCMTypes,
  key: CipherKey,
  iv: BinaryLike,
  options: CipherCCMOptions,
): DecipherCCM;
function createDecipheriv(
  algorithm: CipherOCBTypes,
  key: CipherKey,
  iv: BinaryLike,
  options: CipherOCBOptions,
): DecipherOCB;
function createDecipheriv(
  algorithm: CipherGCMTypes,
  key: CipherKey,
  iv: BinaryLike,
  options?: CipherGCMOptions,
): DecipherGCM;
function createDecipheriv(
  algorithm: string,
  key: CipherKey,
  iv: BinaryLike | null,
  options?: TransformOptions,
): Decipher {
  return new Decipheriv(algorithm, key, iv, options);
}

function createDiffieHellman(
  primeLength: number,
  generator?: number | ArrayBufferView,
): DiffieHellman;
function createDiffieHellman(prime: ArrayBufferView): DiffieHellman;
function createDiffieHellman(
  prime: string,
  primeEncoding: BinaryToTextEncoding,
): DiffieHellman;
function createDiffieHellman(
  prime: string,
  primeEncoding: BinaryToTextEncoding,
  generator: number | ArrayBufferView,
): DiffieHellman;
function createDiffieHellman(
  prime: string,
  primeEncoding: BinaryToTextEncoding,
  generator: string,
  generatorEncoding: BinaryToTextEncoding,
): DiffieHellman;
function createDiffieHellman(
  sizeOrKey: number | string | ArrayBufferView,
  keyEncoding?: number | ArrayBufferView | BinaryToTextEncoding,
  generator?: number | ArrayBufferView | string,
  generatorEncoding?: BinaryToTextEncoding,
): DiffieHellman {
  return new DiffieHellman(
    sizeOrKey,
    keyEncoding,
    generator,
    generatorEncoding,
  );
}

function createDiffieHellmanGroup(name: string): DiffieHellmanGroup {
  return new DiffieHellmanGroup(name);
}

function createECDH(curve: string): ECDH {
  return new ECDH(curve);
}

function createHmac(
  hmac: string,
  key: string | ArrayBuffer | KeyObject,
  options?: TransformOptions,
) {
  return Hmac(hmac, key, options);
}

function createSign(algorithm: string, options?: WritableOptions): Sign {
  return new Sign(algorithm, options);
}

function createVerify(algorithm: string, options?: WritableOptions): Verify {
  return new Verify(algorithm, options);
}

function setFipsForced(val: boolean) {
  if (val) {
    return;
  }

  throw new ERR_CRYPTO_FIPS_FORCED();
}

function getFipsForced() {
  return 1;
}

Object.defineProperty(constants, "defaultCipherList", {
  value: getOptionValue("--tls-cipher-list"),
});

const getDiffieHellman = createDiffieHellmanGroup;

const getFips = fipsForced ? getFipsForced : getFipsCrypto;
const setFips = fipsForced ? setFipsForced : setFipsCrypto;

const sign = signOneShot;
const verify = verifyOneShot;

/* Deprecated in Node.js, alias of randomBytes */
const pseudoRandomBytes = randomBytes;

export default {
  Certificate,
  checkPrime,
  checkPrimeSync,
  Cipheriv,
  constants,
  createCipheriv,
  createDecipheriv,
  createDiffieHellman,
  createDiffieHellmanGroup,
  createECDH,
  createHash,
  createHmac,
  createPrivateKey,
  createPublicKey,
  createSecretKey,
  createSign,
  createVerify,
  Decipheriv,
  DiffieHellman,
  diffieHellman,
  DiffieHellmanGroup,
  ECDH,
  getRandomValues,
  generateKey,
  generateKeyPair,
  generateKeyPairSync,
  generateKeySync,
  generatePrime,
  generatePrimeSync,
  getCipherInfo,
  getCiphers,
  getCurves,
  getDiffieHellman,
  getFips,
  getHashes,
  Hash,
  hkdf,
  hkdfSync,
  Hmac,
  KeyObject,
  pbkdf2,
  pbkdf2Sync,
  privateDecrypt,
  privateEncrypt,
  publicDecrypt,
  publicEncrypt,
  randomBytes,
  pseudoRandomBytes,
  randomFill,
  randomFillSync,
  randomInt,
  randomUUID,
  scrypt,
  scryptSync,
  secureHeapUsed,
  setEngine,
  setFips,
  Sign,
  sign,
  timingSafeEqual,
  Verify,
  verify,
  webcrypto,
  subtle,
  X509Certificate,
};

export type {
  Algorithms,
  AsymmetricKeyDetails,
  BasePrivateKeyEncodingOptions,
  BinaryLike,
  BinaryToTextEncoding,
  CharacterEncoding,
  CheckPrimeOptions,
  Cipher,
  CipherCCM,
  CipherCCMOptions,
  CipherCCMTypes,
  CipherGCM,
  CipherGCMOptions,
  CipherGCMTypes,
  CipherKey,
  CipherOCB,
  CipherOCBOptions,
  CipherOCBTypes,
  Decipher,
  DecipherCCM,
  DecipherGCM,
  DecipherOCB,
  DSAEncoding,
  DSAKeyPairKeyObjectOptions,
  DSAKeyPairOptions,
  ECDHKeyFormat,
  ECKeyPairKeyObjectOptions,
  ECKeyPairOptions,
  ED25519KeyPairKeyObjectOptions,
  ED25519KeyPairOptions,
  ED448KeyPairKeyObjectOptions,
  ED448KeyPairOptions,
  Encoding,
  GeneratePrimeOptions,
  GeneratePrimeOptionsArrayBuffer,
  GeneratePrimeOptionsBigInt,
  HASH_DATA,
  JsonWebKeyInput,
  JwkKeyExportOptions,
  KeyExportOptions,
  KeyFormat,
  KeyLike,
  KeyObjectType,
  KeyPairKeyObjectResult,
  KeyPairSyncResult,
  KeyType,
  LargeNumberLike,
  LegacyCharacterEncoding,
  NormalizedAlgorithms,
  PeerCertificate,
  PrivateKeyInput,
  PublicKeyInput,
  RSAKeyPairKeyObjectOptions,
  RSAKeyPairOptions,
  RSAPSSKeyPairKeyObjectOptions,
  RSAPSSKeyPairOptions,
  SecureHeapUsage,
  SigningOptions,
  SignKeyObjectInput,
  SignPrivateKeyInput,
  VerifyKeyObjectInput,
  VerifyPublicKeyInput,
  X25519KeyPairKeyObjectOptions,
  X25519KeyPairOptions,
  X448KeyPairKeyObjectOptions,
  X448KeyPairOptions,
  X509CheckOptions,
};

export {
  Certificate,
  checkPrime,
  checkPrimeSync,
  Cipheriv,
  constants,
  createCipheriv,
  createDecipheriv,
  createDiffieHellman,
  createDiffieHellmanGroup,
  createECDH,
  createHash,
  createHmac,
  createPrivateKey,
  createPublicKey,
  createSecretKey,
  createSign,
  createVerify,
  Decipheriv,
  DiffieHellman,
  diffieHellman,
  DiffieHellmanGroup,
  ECDH,
  generateKey,
  generateKeyPair,
  generateKeyPairSync,
  generateKeySync,
  generatePrime,
  generatePrimeSync,
  getCipherInfo,
  getCiphers,
  getCurves,
  getDiffieHellman,
  getFips,
  getHashes,
  getRandomValues,
  Hash,
  hkdf,
  hkdfSync,
  Hmac,
  KeyObject,
  pbkdf2,
  pbkdf2Sync,
  privateDecrypt,
  privateEncrypt,
  /* Deprecated in Node.js, alias of randomBytes */
  pseudoRandomBytes,
  publicDecrypt,
  publicEncrypt,
  randomBytes,
  randomFill,
  randomFillSync,
  randomInt,
  randomUUID,
  scrypt,
  scryptSync,
  secureHeapUsed,
  setEngine,
  setFips,
  Sign,
  sign,
  subtle,
  timingSafeEqual,
  Verify,
  verify,
  webcrypto,
  X509Certificate,
};
