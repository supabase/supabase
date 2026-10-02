// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { op_node_pbkdf2, op_node_pbkdf2_async } from "ext:core/ops";

import { Buffer } from "node:buffer";
import { HASH_DATA } from "ext:deno_node/internal/crypto/types.ts";
import {
  validateFunction,
  validateString,
  validateUint32,
} from "ext:deno_node/internal/validators.mjs";
import { getArrayBufferOrView } from "ext:deno_node/internal/crypto/keys.ts";
import {
  ERR_CRYPTO_INVALID_DIGEST,
  ERR_OUT_OF_RANGE,
} from "ext:deno_node/internal/errors.ts";

export const MAX_ALLOC = Math.pow(2, 30) - 1;
export const MAX_I32 = 2 ** 31 - 1;

export type NormalizedAlgorithms =
  | "md5"
  | "ripemd160"
  | "sha1"
  | "sha224"
  | "sha256"
  | "sha384"
  | "sha512";

export type Algorithms =
  | "md5"
  | "ripemd160"
  | "rmd160"
  | "sha1"
  | "sha224"
  | "sha256"
  | "sha384"
  | "sha512";

function check(
  password: HASH_DATA,
  salt: HASH_DATA,
  iterations: number,
  keylen: number,
  digest: string,
) {
  validateString(digest, "digest");
  password = getArrayBufferOrView(password, "password", "buffer");
  salt = getArrayBufferOrView(salt, "salt", "buffer");
  validateUint32(iterations, "iterations", true);
  validateUint32(keylen, "keylen");

  if (iterations > MAX_I32) {
    throw new ERR_OUT_OF_RANGE("iterations", `<= ${MAX_I32}`, iterations);
  }

  if (keylen > MAX_I32) {
    throw new ERR_OUT_OF_RANGE("keylen", `<= ${MAX_I32}`, keylen);
  }

  return { password, salt, iterations, keylen, digest };
}

/**
 * @param iterations Needs to be higher or equal than zero
 * @param keylen  Needs to be higher or equal than zero but less than max allocation size (2^30)
 * @param digest Algorithm to be used for encryption
 */
export function pbkdf2Sync(
  password: HASH_DATA,
  salt: HASH_DATA,
  iterations: number,
  keylen: number,
  digest: string,
): Buffer {
  ({ password, salt, iterations, keylen, digest } = check(
    password,
    salt,
    iterations,
    keylen,
    digest,
  ));

  digest = digest.toLowerCase() as NormalizedAlgorithms;

  const DK = new Uint8Array(keylen);
  if (!op_node_pbkdf2(password, salt, iterations, digest, DK)) {
    throw new ERR_CRYPTO_INVALID_DIGEST(digest);
  }

  return Buffer.from(DK);
}

/**
 * @param iterations Needs to be higher or equal than zero
 * @param keylen  Needs to be higher or equal than zero but less than max allocation size (2^30)
 * @param digest Algorithm to be used for encryption
 */
export function pbkdf2(
  password: HASH_DATA,
  salt: HASH_DATA,
  iterations: number,
  keylen: number,
  digest: string,
  callback: (err: Error | null, derivedKey?: Buffer) => void,
) {
  if (typeof digest === "function") {
    callback = digest;
    digest = undefined as unknown as string;
  }

  ({ password, salt, iterations, keylen, digest } = check(
    password,
    salt,
    iterations,
    keylen,
    digest,
  ));

  validateFunction(callback, "callback");

  digest = digest.toLowerCase() as NormalizedAlgorithms;

  op_node_pbkdf2_async(
    password,
    salt,
    iterations,
    digest,
    keylen,
  ).then(
    (DK) => callback(null, Buffer.from(DK)),
  )
    .catch((err) => callback(err));
}

export default {
  MAX_ALLOC,
  pbkdf2,
  pbkdf2Sync,
};
