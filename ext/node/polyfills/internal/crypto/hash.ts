// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import {
  op_node_create_hash,
  op_node_export_secret_key,
  op_node_get_hashes,
  op_node_hash_clone,
  op_node_hash_digest,
  op_node_hash_digest_hex,
  op_node_hash_update,
  op_node_hash_update_str,
} from "ext:core/ops";
import { primordials } from "ext:core/mod.js";

import { Buffer } from "node:buffer";
import { Transform } from "node:stream";
import {
  forgivingBase64Encode as encodeToBase64,
  forgivingBase64UrlEncode as encodeToBase64Url,
} from "ext:deno_web/00_infra.js";
import type { TransformOptions } from "ext:deno_node/_stream.d.ts";
import {
  validateEncoding,
  validateString,
  validateUint32,
} from "ext:deno_node/internal/validators.mjs";
import type {
  BinaryToTextEncoding,
  Encoding,
} from "ext:deno_node/internal/crypto/types.ts";
import {
  KeyObject,
  prepareSecretKey,
} from "ext:deno_node/internal/crypto/keys.ts";
import {
  ERR_CRYPTO_HASH_FINALIZED,
  ERR_INVALID_ARG_TYPE,
  NodeError,
} from "ext:deno_node/internal/errors.ts";
import LazyTransform from "ext:deno_node/internal/streams/lazy_transform.mjs";
import {
  getDefaultEncoding,
  toBuf,
} from "ext:deno_node/internal/crypto/util.ts";
import {
  isAnyArrayBuffer,
  isArrayBufferView,
} from "ext:deno_node/internal/util/types.ts";

const { ReflectApply, ObjectSetPrototypeOf } = primordials;

function unwrapErr(ok: boolean) {
  if (!ok) throw new ERR_CRYPTO_HASH_FINALIZED();
}

declare const __hasher: unique symbol;
type Hasher = { __hasher: typeof __hasher };

const kHandle = Symbol("kHandle");

export function Hash(
  this: Hash,
  algorithm: string | Hasher,
  options?: { outputLength?: number },
): Hash {
  if (!(this instanceof Hash)) {
    return new Hash(algorithm, options);
  }
  if (!(typeof algorithm === "object")) {
    validateString(algorithm, "algorithm");
  }
  const xofLen = typeof options === "object" && options !== null
    ? options.outputLength
    : undefined;
  if (xofLen !== undefined) {
    validateUint32(xofLen, "options.outputLength");
  }

  try {
    this[kHandle] = typeof algorithm === "object"
      ? op_node_hash_clone(algorithm, xofLen)
      : op_node_create_hash(algorithm.toLowerCase(), xofLen);
  } catch (err) {
    // TODO(lucacasonato): don't do this
    if (err.message === "Output length mismatch for non-extendable algorithm") {
      throw new NodeError(
        "ERR_OSSL_EVP_NOT_XOF_OR_INVALID_LENGTH",
        "Invalid XOF digest length",
      );
    } else {
      throw err;
    }
  }

  if (this[kHandle] === null) throw new ERR_CRYPTO_HASH_FINALIZED();

  ReflectApply(LazyTransform, this, [options]);
}

interface Hash {
  [kHandle]: object;
}

ObjectSetPrototypeOf(Hash.prototype, LazyTransform.prototype);
ObjectSetPrototypeOf(Hash, LazyTransform);

Hash.prototype.copy = function copy(options?: { outputLength: number }) {
  return new Hash(this[kHandle], options);
};

Hash.prototype._transform = function _transform(
  chunk: string | Buffer,
  encoding: Encoding | "buffer",
  callback: () => void,
) {
  this.update(chunk, encoding);
  callback();
};

Hash.prototype._flush = function _flush(callback: () => void) {
  this.push(this.digest());
  callback();
};

Hash.prototype.update = function update(
  data: string | Buffer,
  encoding: Encoding | "buffer",
) {
  encoding = encoding || getDefaultEncoding();

  if (typeof data === "string") {
    validateEncoding(data, encoding);
  } else if (!isArrayBufferView(data)) {
    throw new ERR_INVALID_ARG_TYPE(
      "data",
      ["string", "Buffer", "TypedArray", "DataView"],
      data,
    );
  }

  if (
    typeof data === "string" && (encoding === "utf8" || encoding === "buffer")
  ) {
    unwrapErr(op_node_hash_update_str(this[kHandle], data));
  } else {
    unwrapErr(op_node_hash_update(this[kHandle], toBuf(data, encoding)));
  }

  return this;
};

Hash.prototype.digest = function digest(outputEncoding: Encoding | "buffer") {
  outputEncoding = outputEncoding || getDefaultEncoding();
  outputEncoding = `${outputEncoding}`;

  if (outputEncoding === "hex") {
    const result = op_node_hash_digest_hex(this[kHandle]);
    if (result === null) throw new ERR_CRYPTO_HASH_FINALIZED();
    return result;
  }

  const digest = op_node_hash_digest(this[kHandle]);
  if (digest === null) throw new ERR_CRYPTO_HASH_FINALIZED();

  // TODO(@littedivy): Fast paths for below encodings.
  switch (outputEncoding) {
    case "binary":
      return String.fromCharCode(...digest);
    case "base64":
      return encodeToBase64(digest);
    case "base64url":
      return encodeToBase64Url(digest);
    case undefined:
    case "buffer":
      return Buffer.from(digest);
    default:
      return Buffer.from(digest).toString(outputEncoding);
  }
};

export function Hmac(
  hmac: string,
  key: string | ArrayBuffer | KeyObject,
  options?: TransformOptions,
): Hmac {
  return new HmacImpl(hmac, key, options);
}

type Hmac = HmacImpl;

class HmacImpl extends Transform {
  #ipad: Uint8Array;
  #opad: Uint8Array;
  #ZEROES = Buffer.alloc(128);
  #algorithm: string;
  #hash: Hash;

  constructor(
    hmac: string,
    key: string | ArrayBuffer | KeyObject,
    options?: TransformOptions,
  ) {
    super({
      transform(chunk: string, encoding: string, callback: () => void) {
        // deno-lint-ignore no-explicit-any
        self.update(Buffer.from(chunk), encoding as any);
        callback();
      },
      flush(callback: () => void) {
        this.push(self.digest());
        callback();
      },
    });
    // deno-lint-ignore no-this-alias
    const self = this;

    validateString(hmac, "hmac");

    key = prepareSecretKey(key, options?.encoding);
    let keyData;
    if (isArrayBufferView(key)) {
      keyData = key;
    } else if (isAnyArrayBuffer(key)) {
      keyData = new Uint8Array(key);
    } else {
      keyData = op_node_export_secret_key(key);
    }

    const alg = hmac.toLowerCase();
    this.#algorithm = alg;
    const blockSize = (alg === "sha512" || alg === "sha384") ? 128 : 64;
    const keySize = keyData.length;

    let bufKey: Buffer;

    if (keySize > blockSize) {
      const hash = new Hash(alg, options);
      bufKey = hash.update(keyData).digest() as Buffer;
    } else {
      bufKey = Buffer.concat([keyData, this.#ZEROES], blockSize);
    }

    this.#ipad = Buffer.allocUnsafe(blockSize);
    this.#opad = Buffer.allocUnsafe(blockSize);

    for (let i = 0; i < blockSize; i++) {
      this.#ipad[i] = bufKey[i] ^ 0x36;
      this.#opad[i] = bufKey[i] ^ 0x5C;
    }

    this.#hash = new Hash(alg);
    this.#hash.update(this.#ipad);
  }

  digest(): Buffer;
  digest(encoding: BinaryToTextEncoding): string;
  digest(encoding?: BinaryToTextEncoding): Buffer | string {
    const result = this.#hash.digest();

    return new Hash(this.#algorithm).update(this.#opad).update(result)
      .digest(
        encoding,
      );
  }

  update(data: string | ArrayBuffer, inputEncoding?: Encoding): this {
    this.#hash.update(data, inputEncoding);
    return this;
  }
}

Hmac.prototype = HmacImpl.prototype;

/**
 * Creates and returns a Hash object that can be used to generate hash digests
 * using the given `algorithm`. Optional `options` argument controls stream behavior.
 */
export function createHash(algorithm: string, opts?: TransformOptions) {
  return new Hash(algorithm, opts);
}

/**
 * Get the list of implemented hash algorithms.
 * @returns Array of hash algorithm names.
 */
export function getHashes() {
  return op_node_get_hashes();
}

export default {
  Hash,
  Hmac,
  createHash,
};
