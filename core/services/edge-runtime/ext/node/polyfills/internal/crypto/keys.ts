// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { primordials } from "ext:core/mod.js";

const {
  ObjectDefineProperties,
  SymbolToStringTag,
} = primordials;

import {
  op_node_create_ec_jwk,
  op_node_create_ed_raw,
  op_node_create_private_key,
  op_node_create_public_key,
  op_node_create_rsa_jwk,
  op_node_create_secret_key,
  op_node_derive_public_key_from_private_key,
  op_node_export_private_key_der,
  op_node_export_private_key_pem,
  op_node_export_public_key_der,
  op_node_export_public_key_jwk,
  op_node_export_public_key_pem,
  op_node_export_secret_key,
  op_node_export_secret_key_b64url,
  op_node_get_asymmetric_key_details,
  op_node_get_asymmetric_key_type,
  op_node_get_symmetric_key_size,
  op_node_key_type,
} from "ext:core/ops";

import { kHandle } from "ext:deno_node/internal/crypto/constants.ts";
import { isStringOrBuffer } from "ext:deno_node/internal/crypto/cipher.ts";
import {
  ERR_CRYPTO_INCOMPATIBLE_KEY_OPTIONS,
  ERR_CRYPTO_INVALID_JWK,
  ERR_CRYPTO_INVALID_KEY_OBJECT_TYPE,
  ERR_INVALID_ARG_TYPE,
  ERR_INVALID_ARG_VALUE,
} from "ext:deno_node/internal/errors.ts";
import { notImplemented } from "ext:deno_node/_utils.ts";
import type {
  KeyFormat,
  PrivateKeyInput,
  PublicKeyInput,
} from "ext:deno_node/internal/crypto/types.ts";
import { Buffer } from "node:buffer";
import {
  isAnyArrayBuffer,
  isArrayBufferView,
} from "ext:deno_node/internal/util/types.ts";
import { hideStackFrames } from "ext:deno_node/internal/errors.ts";
import {
  isCryptoKey,
  isKeyObject,
  kKeyType,
} from "ext:deno_node/internal/crypto/_keys.ts";
import {
  validateObject,
  validateOneOf,
  validateString,
} from "ext:deno_node/internal/validators.mjs";
import { BufferEncoding } from "ext:deno_node/_global.d.ts";

export const getArrayBufferOrView = hideStackFrames(
  (
    buffer: ArrayBufferView | ArrayBuffer | string | Buffer,
    name: string,
    encoding?: BufferEncoding | "buffer",
  ):
    | ArrayBuffer
    | SharedArrayBuffer
    | Buffer
    | DataView
    | BigInt64Array
    | BigUint64Array
    | Float32Array
    | Float64Array
    | Int8Array
    | Int16Array
    | Int32Array
    | Uint8Array
    | Uint8ClampedArray
    | Uint16Array
    | Uint32Array => {
    if (isAnyArrayBuffer(buffer)) {
      return new Uint8Array(buffer);
    }
    if (typeof buffer === "string") {
      if (encoding === "buffer") {
        encoding = "utf8";
      }
      return Buffer.from(buffer, encoding);
    }
    if (!isArrayBufferView(buffer)) {
      throw new ERR_INVALID_ARG_TYPE(
        name,
        [
          "string",
          "ArrayBuffer",
          "Buffer",
          "TypedArray",
          "DataView",
        ],
        buffer,
      );
    }
    return buffer;
  },
);

export interface AsymmetricKeyDetails {
  /**
   * Key size in bits (RSA, DSA).
   */
  modulusLength?: number | undefined;
  /**
   * Public exponent (RSA).
   */
  publicExponent?: bigint | undefined;
  /**
   * Name of the message digest (RSA-PSS).
   */
  hashAlgorithm?: string | undefined;
  /**
   * Name of the message digest used by MGF1 (RSA-PSS).
   */
  mgf1HashAlgorithm?: string | undefined;
  /**
   * Minimal salt length in bytes (RSA-PSS).
   */
  saltLength?: number | undefined;
  /**
   * Size of q in bits (DSA).
   */
  divisorLength?: number | undefined;
  /**
   * Name of the curve (EC).
   */
  namedCurve?: string | undefined;
}

export type KeyObjectType = "secret" | "public" | "private";

export interface KeyExportOptions<T extends KeyFormat> {
  type: "pkcs1" | "spki" | "pkcs8" | "sec1";
  format: T;
  cipher?: string | undefined;
  passphrase?: string | Buffer | undefined;
}

export interface JwkKeyExportOptions {
  format: "jwk";
}

export enum KeyHandleContext {
  kConsumePublic = 0,
  kConsumePrivate = 1,
  kCreatePublic = 2,
  kCreatePrivate = 3,
}

export const kConsumePublic = KeyHandleContext.kConsumePublic;
export const kConsumePrivate = KeyHandleContext.kConsumePrivate;
export const kCreatePublic = KeyHandleContext.kCreatePublic;
export const kCreatePrivate = KeyHandleContext.kCreatePrivate;

function isJwk(obj: unknown): obj is { kty: unknown } {
  // @ts-ignore this is fine
  return typeof obj === "object" && obj != null && obj.kty !== undefined;
}

export type KeyObjectHandle = { ___keyObjectHandle: true };

export class KeyObject {
  [kKeyType]: KeyObjectType;
  [kHandle]: KeyObjectHandle;

  constructor(type: KeyObjectType, handle: KeyObjectHandle) {
    if (type !== "secret" && type !== "public" && type !== "private") {
      throw new ERR_INVALID_ARG_VALUE("type", type);
    }

    this[kKeyType] = type;
    this[kHandle] = handle;
  }

  get type(): KeyObjectType {
    return this[kKeyType];
  }

  get symmetricKeySize(): number | undefined {
    notImplemented("crypto.KeyObject.prototype.symmetricKeySize");
    return undefined;
  }

  static from(key: CryptoKey): KeyObject {
    if (!isCryptoKey(key)) {
      throw new ERR_INVALID_ARG_TYPE("key", "CryptoKey", key);
    }
    notImplemented("crypto.KeyObject.prototype.from");
  }

  equals(otherKeyObject: KeyObject): boolean {
    if (!isKeyObject(otherKeyObject)) {
      throw new ERR_INVALID_ARG_TYPE(
        "otherKeyObject",
        "KeyObject",
        otherKeyObject,
      );
    }

    notImplemented("crypto.KeyObject.prototype.equals");
  }

  export(options: KeyExportOptions<"pem">): string | Buffer;
  export(options?: KeyExportOptions<"der">): Buffer;
  export(options?: JwkKeyExportOptions): JsonWebKey;
  export(_options?: unknown): string | Buffer | JsonWebKey {
    notImplemented("crypto.KeyObject.prototype.export");
  }
}

ObjectDefineProperties(KeyObject.prototype, {
  [SymbolToStringTag]: {
    // @ts-expect-error __proto__ is magic
    __proto__: null,
    configurable: true,
    value: "KeyObject",
  },
});

export interface JsonWebKeyInput {
  key: JsonWebKey;
  format: "jwk";
}

export function getKeyObjectHandle(key: KeyObject, ctx: KeyHandleContext) {
  if (ctx === kCreatePrivate) {
    throw new ERR_INVALID_ARG_TYPE(
      "key",
      ["string", "ArrayBuffer", "Buffer", "TypedArray", "DataView"],
      key,
    );
  }

  if (key.type !== "private") {
    if (ctx === kConsumePrivate || ctx === kCreatePublic) {
      throw new ERR_CRYPTO_INVALID_KEY_OBJECT_TYPE(key.type, "private");
    }
    if (key.type !== "public") {
      throw new ERR_CRYPTO_INVALID_KEY_OBJECT_TYPE(
        key.type,
        "private or public",
      );
    }
  }

  return key[kHandle];
}

function getKeyObjectHandleFromJwk(key, ctx) {
  validateObject(key, "key");
  validateOneOf(
    key.kty,
    "key.kty",
    ["RSA", "EC", "OKP"],
  );
  const isPublic = ctx === kConsumePublic || ctx === kCreatePublic;

  if (key.kty === "OKP") {
    validateString(key.crv, "key.crv");
    validateOneOf(
      key.crv,
      "key.crv",
      ["Ed25519", "Ed448", "X25519", "X448"],
    );
    validateString(key.x, "key.x");

    if (!isPublic) {
      validateString(key.d, "key.d");
    }

    let keyData;
    if (isPublic) {
      keyData = Buffer.from(key.x, "base64");
    } else {
      keyData = Buffer.from(key.d, "base64");
    }

    switch (key.crv) {
      case "Ed25519":
      case "X25519":
        if (keyData.byteLength !== 32) {
          throw new ERR_CRYPTO_INVALID_JWK();
        }
        break;
      case "Ed448":
        if (keyData.byteLength !== 57) {
          throw new ERR_CRYPTO_INVALID_JWK();
        }
        break;
      case "X448":
        if (keyData.byteLength !== 56) {
          throw new ERR_CRYPTO_INVALID_JWK();
        }
        break;
    }

    return op_node_create_ed_raw(key.crv, keyData, isPublic);
  }

  if (key.kty === "EC") {
    validateString(key.crv, "key.crv");
    validateString(key.x, "key.x");
    validateString(key.y, "key.y");

    if (!isPublic) {
      validateString(key.d, "key.d");
    }

    return op_node_create_ec_jwk(key, isPublic);
  }

  // RSA
  validateString(key.n, "key.n");
  validateString(key.e, "key.e");

  const jwk = {
    kty: key.kty,
    n: key.n,
    e: key.e,
  };

  if (!isPublic) {
    validateString(key.d, "key.d");
    validateString(key.p, "key.p");
    validateString(key.q, "key.q");
    validateString(key.dp, "key.dp");
    validateString(key.dq, "key.dq");
    validateString(key.qi, "key.qi");
    jwk.d = key.d;
    jwk.p = key.p;
    jwk.q = key.q;
    jwk.dp = key.dp;
    jwk.dq = key.dq;
    jwk.qi = key.qi;
  }

  return op_node_create_rsa_jwk(jwk, isPublic);
}

export function prepareAsymmetricKey(
  key:
    | string
    | ArrayBuffer
    | Buffer
    | ArrayBufferView
    | KeyObject
    | CryptoKey
    | PrivateKeyInput
    | PublicKeyInput
    | JsonWebKeyInput,
  ctx: KeyHandleContext,
):
  | { handle: KeyObjectHandle; format?: "jwk" }
  | {
    data: ArrayBuffer | ArrayBufferView;
    format: KeyFormat;
    type: "pkcs1" | "spki" | "pkcs8" | "sec1" | undefined;
    passphrase: Buffer | ArrayBuffer | ArrayBufferView | undefined;
  } {
  if (isKeyObject(key)) {
    // Best case: A key object, as simple as that.
    return {
      // @ts-ignore __proto__ is magic
      __proto__: null,
      handle: getKeyObjectHandle(key, ctx),
    };
  } else if (isCryptoKey(key)) {
    notImplemented("using CryptoKey as input");
  } else if (isStringOrBuffer(key)) {
    // Expect PEM by default, mostly for backward compatibility.
    return {
      // @ts-ignore __proto__ is magic
      __proto__: null,
      format: "pem",
      data: getArrayBufferOrView(key, "key"),
    };
  } else if (typeof key === "object") {
    const { key: data, format } = key;
    // The 'key' property can be a KeyObject as well to allow specifying
    // additional options such as padding along with the key.
    if (isKeyObject(data)) {
      return {
        // @ts-ignore __proto__ is magic
        __proto__: null,
        handle: getKeyObjectHandle(data, ctx),
      };
    } else if (isCryptoKey(data)) {
      notImplemented("using CryptoKey as input");
    } else if (isJwk(data) && format === "jwk") {
      return {
        // @ts-ignore __proto__ is magic
        __proto__: null,
        handle: getKeyObjectHandleFromJwk(data, ctx),
        format,
      };
    }
    // Either PEM or DER using PKCS#1 or SPKI.
    if (!isStringOrBuffer(data)) {
      throw new ERR_INVALID_ARG_TYPE(
        "key.key",
        getKeyTypes(ctx !== kCreatePrivate),
        data,
      );
    }

    const isPublic = (ctx === kConsumePrivate || ctx === kCreatePrivate)
      ? false
      : undefined;
    return {
      data: getArrayBufferOrView(
        data,
        "key",
        (key as PrivateKeyInput | PublicKeyInput).encoding,
      ),
      ...parseKeyEncoding(key, undefined, isPublic),
    };
  }
  throw new ERR_INVALID_ARG_TYPE(
    "key",
    getKeyTypes(ctx !== kCreatePrivate),
    key,
  );
}

function parseKeyEncoding(
  enc: {
    cipher?: string;
    passphrase?: string | Buffer | ArrayBuffer | ArrayBufferView;
    encoding?: BufferEncoding | "buffer";
    format?: string;
    type?: string;
  },
  keyType: string | undefined,
  isPublic: boolean | undefined,
  objName?: string,
): {
  format: KeyFormat;
  type: "pkcs1" | "spki" | "pkcs8" | "sec1" | undefined;
  passphrase: Buffer | ArrayBuffer | ArrayBufferView | undefined;
  cipher: string | undefined;
} {
  if (enc === null || typeof enc !== "object") {
    throw new ERR_INVALID_ARG_TYPE("options", "object", enc);
  }

  const isInput = keyType === undefined;

  const {
    format,
    type,
  } = parseKeyFormatAndType(enc, keyType, isPublic, objName);

  let cipher, passphrase, encoding;
  if (isPublic !== true) {
    ({ cipher, passphrase, encoding } = enc);

    if (!isInput) {
      if (cipher != null) {
        if (typeof cipher !== "string") {
          throw new ERR_INVALID_ARG_VALUE(option("cipher", objName), cipher);
        }
        if (
          format === "der" &&
          (type === "pkcs1" || type === "sec1")
        ) {
          throw new ERR_CRYPTO_INCOMPATIBLE_KEY_OPTIONS(
            type,
            "does not support encryption",
          );
        }
      } else if (passphrase !== undefined) {
        throw new ERR_INVALID_ARG_VALUE(option("cipher", objName), cipher);
      }
    }

    if (
      (isInput && passphrase !== undefined &&
        !isStringOrBuffer(passphrase)) ||
      (!isInput && cipher != null && !isStringOrBuffer(passphrase))
    ) {
      throw new ERR_INVALID_ARG_VALUE(
        option("passphrase", objName),
        passphrase,
      );
    }
  }

  if (passphrase !== undefined) {
    passphrase = getArrayBufferOrView(passphrase, "key.passphrase", encoding);
  }

  return {
    // @ts-ignore __proto__ is magic
    __proto__: null,
    format,
    type,
    cipher,
    passphrase,
  };
}

function option(name: string, objName?: string) {
  return objName === undefined
    ? `options.${name}`
    : `options.${objName}.${name}`;
}

function parseKeyFormatAndType(
  enc: { format?: string; type?: string },
  keyType: string | undefined,
  isPublic: boolean | undefined,
  objName?: string,
): {
  format: KeyFormat;
  type: "pkcs1" | "spki" | "pkcs8" | "sec1" | undefined;
} {
  const { format: formatStr, type: typeStr } = enc;

  const isInput = keyType === undefined;
  const format = parseKeyFormat(
    formatStr,
    isInput ? "pem" : undefined,
    option("format", objName),
  );

  const type = parseKeyType(
    typeStr,
    !isInput || format === "der",
    keyType,
    isPublic,
    option("type", objName),
  );

  return {
    // @ts-ignore __proto__ is magic
    __proto__: null,
    format,
    type,
  };
}

function parseKeyFormat(
  formatStr: string | undefined,
  defaultFormat: KeyFormat | undefined,
  optionName: string,
): KeyFormat {
  if (formatStr === undefined && defaultFormat !== undefined) {
    return defaultFormat;
  } else if (formatStr === "pem") {
    return "pem";
  } else if (formatStr === "der") {
    return "der";
  }
  throw new ERR_INVALID_ARG_VALUE(optionName, formatStr);
}

function parseKeyType(
  typeStr: string | undefined,
  required: boolean,
  keyType: string | undefined,
  isPublic: boolean | undefined,
  optionName: string,
): "pkcs1" | "spki" | "pkcs8" | "sec1" | undefined {
  if (typeStr === undefined && !required) {
    return undefined;
  } else if (typeStr === "pkcs1") {
    if (keyType !== undefined && keyType !== "rsa") {
      throw new ERR_CRYPTO_INCOMPATIBLE_KEY_OPTIONS(
        typeStr,
        "can only be used for RSA keys",
      );
    }
    return "pkcs1";
  } else if (typeStr === "spki" && isPublic !== false) {
    return "spki";
  } else if (typeStr === "pkcs8" && isPublic !== true) {
    return "pkcs8";
  } else if (typeStr === "sec1" && isPublic !== true) {
    if (keyType !== undefined && keyType !== "ec") {
      throw new ERR_CRYPTO_INCOMPATIBLE_KEY_OPTIONS(
        typeStr,
        "can only be used for EC keys",
      );
    }
    return "sec1";
  }
  throw new ERR_INVALID_ARG_VALUE(optionName, typeStr);
}

// Parses the public key encoding based on an object. keyType must be undefined
// when this is used to parse an input encoding and must be a valid key type if
// used to parse an output encoding.
function parsePublicKeyEncoding(
  enc: {
    cipher?: string;
    passphrase?: string | Buffer | ArrayBuffer | ArrayBufferView;
    encoding?: BufferEncoding | "buffer";
    format?: string;
    type?: string;
  },
  keyType: string | undefined,
  objName?: string,
) {
  return parseKeyEncoding(enc, keyType, keyType ? true : undefined, objName);
}

// Parses the private key encoding based on an object. keyType must be undefined
// when this is used to parse an input encoding and must be a valid key type if
// used to parse an output encoding.
function parsePrivateKeyEncoding(
  enc: {
    cipher?: string;
    passphrase?: string | Buffer | ArrayBuffer | ArrayBufferView;
    encoding?: BufferEncoding | "buffer";
    format?: string;
    type?: string;
  },
  keyType: string | undefined,
  objName?: string,
) {
  return parseKeyEncoding(enc, keyType, false, objName);
}

export function createPrivateKey(
  key: PrivateKeyInput | string | Buffer | JsonWebKeyInput,
): PrivateKeyObject {
  const res = prepareAsymmetricKey(key, kCreatePrivate);
  if ("handle" in res) {
    const type = op_node_key_type(res.handle);
    if (type === "private") {
      return new PrivateKeyObject(res.handle);
    } else {
      throw new TypeError(`Can not create private key from ${type} key`);
    }
  } else {
    const handle = op_node_create_private_key(
      res.data,
      res.format,
      res.type ?? "",
      res.passphrase,
    );
    return new PrivateKeyObject(handle);
  }
}

export function createPublicKey(
  key: PublicKeyInput | string | Buffer | JsonWebKeyInput,
): PublicKeyObject {
  const res = prepareAsymmetricKey(
    key,
    kCreatePublic,
  );
  if ("handle" in res) {
    const type = op_node_key_type(res.handle);
    if (type === "private") {
      const handle = op_node_derive_public_key_from_private_key(res.handle);
      return new PublicKeyObject(handle);
    } else if (type === "public") {
      return new PublicKeyObject(res.handle);
    } else {
      throw new TypeError(`Can not create private key from ${type} key`);
    }
  } else {
    const handle = op_node_create_public_key(
      res.data,
      res.format,
      res.type ?? "",
    );
    return new PublicKeyObject(handle);
  }
}

function getKeyTypes(allowKeyObject: boolean, bufferOnly = false) {
  const types = [
    "ArrayBuffer",
    "Buffer",
    "TypedArray",
    "DataView",
    "string", // Only if bufferOnly == false
    "KeyObject", // Only if allowKeyObject == true && bufferOnly == false
    "CryptoKey", // Only if allowKeyObject == true && bufferOnly == false
  ];
  if (bufferOnly) {
    return types.slice(0, 4);
  } else if (!allowKeyObject) {
    return types.slice(0, 5);
  }
  return types;
}

export function prepareSecretKey(
  key: string | ArrayBufferView | ArrayBuffer | KeyObject | CryptoKey,
  encoding: string | undefined,
  bufferOnly = false,
): Buffer | ArrayBuffer | ArrayBufferView | KeyObjectHandle {
  if (!bufferOnly) {
    if (isKeyObject(key)) {
      if (key.type !== "secret") {
        throw new ERR_CRYPTO_INVALID_KEY_OBJECT_TYPE(key.type, "secret");
      }
      return key[kHandle];
    } else if (isCryptoKey(key)) {
      notImplemented("using CryptoKey as input");
    }
  }
  if (
    typeof key !== "string" &&
    !isArrayBufferView(key) &&
    !isAnyArrayBuffer(key)
  ) {
    throw new ERR_INVALID_ARG_TYPE(
      "key",
      getKeyTypes(!bufferOnly, bufferOnly),
      key,
    );
  }

  return getArrayBufferOrView(key, "key", encoding);
}

export class SecretKeyObject extends KeyObject {
  constructor(handle: KeyObjectHandle) {
    super("secret", handle);
  }

  get symmetricKeySize() {
    return op_node_get_symmetric_key_size(this[kHandle]);
  }

  get asymmetricKeyType() {
    return undefined;
  }

  export(options?: { format?: "buffer" | "jwk" }): Buffer | JsonWebKey {
    let format: "buffer" | "jwk" = "buffer";
    if (options !== undefined) {
      validateObject(options, "options");
      validateOneOf(
        options.format,
        "options.format",
        [undefined, "buffer", "jwk"],
      );
      format = options.format ?? "buffer";
    }
    switch (format) {
      case "buffer":
        return Buffer.from(op_node_export_secret_key(this[kHandle]));
      case "jwk":
        return {
          kty: "oct",
          k: op_node_export_secret_key_b64url(this[kHandle]),
        };
    }
  }
}

class AsymmetricKeyObject extends KeyObject {
  constructor(type: KeyObjectType, handle: KeyObjectHandle) {
    super(type, handle);
  }

  get asymmetricKeyType() {
    return op_node_get_asymmetric_key_type(this[kHandle]);
  }

  get asymmetricKeyDetails() {
    return op_node_get_asymmetric_key_details(this[kHandle]);
  }
}

export class PrivateKeyObject extends AsymmetricKeyObject {
  constructor(handle: KeyObjectHandle) {
    super("private", handle);
  }

  export(options: JwkKeyExportOptions | KeyExportOptions<KeyFormat>) {
    if (options && options.format === "jwk") {
      notImplemented("jwk private key export not implemented");
    }
    const {
      format,
      type,
    } = parsePrivateKeyEncoding(options, this.asymmetricKeyType);

    if (format === "pem") {
      return op_node_export_private_key_pem(this[kHandle], type);
    } else {
      return Buffer.from(op_node_export_private_key_der(this[kHandle], type));
    }
  }
}

export class PublicKeyObject extends AsymmetricKeyObject {
  constructor(handle: KeyObjectHandle) {
    super("public", handle);
  }

  export(options: JwkKeyExportOptions | KeyExportOptions<KeyFormat>) {
    if (options && options.format === "jwk") {
      return op_node_export_public_key_jwk(this[kHandle]);
    }

    const {
      format,
      type,
    } = parsePublicKeyEncoding(options, this.asymmetricKeyType);

    if (format === "pem") {
      return op_node_export_public_key_pem(this[kHandle], type);
    } else {
      return Buffer.from(op_node_export_public_key_der(this[kHandle], type));
    }
  }
}

export function createSecretKey(
  key: string | ArrayBufferView | ArrayBuffer | KeyObject | CryptoKey,
  encoding?: string,
): KeyObject {
  const preparedKey = prepareSecretKey(key, encoding, true);
  if (isArrayBufferView(preparedKey) || isAnyArrayBuffer(preparedKey)) {
    const handle = op_node_create_secret_key(preparedKey);
    return new SecretKeyObject(handle);
  } else {
    const type = op_node_key_type(preparedKey);
    if (type === "secret") {
      return new SecretKeyObject(preparedKey);
    } else {
      throw new TypeError(`can not create secret key from ${type} key`);
    }
  }
}

export default {
  createPrivateKey,
  createPublicKey,
  createSecretKey,
  KeyObject,
  prepareSecretKey,
  SecretKeyObject,
  PrivateKeyObject,
  PublicKeyObject,
};
