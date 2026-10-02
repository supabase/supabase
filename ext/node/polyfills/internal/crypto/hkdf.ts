// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { op_node_hkdf, op_node_hkdf_async } from "ext:core/ops";

import {
  validateFunction,
  validateInteger,
  validateString,
} from "ext:deno_node/internal/validators.mjs";
import {
  ERR_CRYPTO_INVALID_DIGEST,
  ERR_INVALID_ARG_TYPE,
  ERR_OUT_OF_RANGE,
  hideStackFrames,
} from "ext:deno_node/internal/errors.ts";
import {
  kHandle,
  toBuf,
  validateByteSource,
} from "ext:deno_node/internal/crypto/util.ts";
import {
  createSecretKey,
  KeyObject,
} from "ext:deno_node/internal/crypto/keys.ts";
import type { BinaryLike } from "ext:deno_node/internal/crypto/types.ts";
import { kMaxLength } from "ext:deno_node/internal/buffer.mjs";
import {
  isAnyArrayBuffer,
  isArrayBufferView,
} from "ext:deno_node/internal/util/types.ts";
import { isKeyObject } from "ext:deno_node/internal/crypto/_keys.ts";

const validateParameters = hideStackFrames((hash, key, salt, info, length) => {
  validateString(hash, "digest");
  key = prepareKey(key);
  validateByteSource(salt, "salt");
  validateByteSource(info, "info");

  salt = new Uint8Array(toBuf(salt));
  info = new Uint8Array(toBuf(info));

  validateInteger(length, "length", 0, kMaxLength);

  if (info.byteLength > 1024) {
    throw new ERR_OUT_OF_RANGE(
      "info",
      "must not contain more than 1024 bytes",
      info.byteLength,
    );
  }

  return {
    hash,
    key,
    salt,
    info,
    length,
  };
});

function prepareKey(key: BinaryLike | KeyObject) {
  if (isKeyObject(key)) {
    return key;
  }

  if (isAnyArrayBuffer(key)) {
    return createSecretKey(new Uint8Array(key as unknown as ArrayBufferLike));
  }

  key = toBuf(key as string);

  if (!isArrayBufferView(key)) {
    throw new ERR_INVALID_ARG_TYPE(
      "ikm",
      [
        "string",
        "SecretKeyObject",
        "ArrayBuffer",
        "TypedArray",
        "DataView",
        "Buffer",
      ],
      key,
    );
  }

  return createSecretKey(key);
}

export function hkdf(
  hash: string,
  key: BinaryLike | KeyObject,
  salt: BinaryLike,
  info: BinaryLike,
  length: number,
  callback: (err: Error | null, derivedKey: ArrayBuffer | undefined) => void,
) {
  ({ hash, key, salt, info, length } = validateParameters(
    hash,
    key,
    salt,
    info,
    length,
  ));

  validateFunction(callback, "callback");

  hash = hash.toLowerCase();

  op_node_hkdf_async(hash, key[kHandle], salt, info, length)
    .then((okm) => callback(null, okm.buffer))
    .catch((err) => callback(new ERR_CRYPTO_INVALID_DIGEST(err), undefined));
}

export function hkdfSync(
  hash: string,
  key: BinaryLike | KeyObject,
  salt: BinaryLike,
  info: BinaryLike,
  length: number,
) {
  ({ hash, key, salt, info, length } = validateParameters(
    hash,
    key,
    salt,
    info,
    length,
  ));

  hash = hash.toLowerCase();

  const okm = new Uint8Array(length);
  try {
    op_node_hkdf(hash, key[kHandle], salt, info, okm);
  } catch (e) {
    throw new ERR_CRYPTO_INVALID_DIGEST(e);
  }

  return okm.buffer;
}

export default {
  hkdf,
  hkdfSync,
};
