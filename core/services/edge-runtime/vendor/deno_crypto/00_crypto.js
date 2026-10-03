// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// @ts-check
/// <reference path="../../core/internal.d.ts" />
/// <reference path="../../core/lib.deno_core.d.ts" />
/// <reference path="../webidl/internal.d.ts" />
/// <reference path="../web/lib.deno_web.d.ts" />

import { core, primordials } from "ext:core/mod.js";
const {
  isArrayBuffer,
  isTypedArray,
  isDataView,
} = core;
import {
  op_crypto_base64url_decode,
  op_crypto_base64url_encode,
  op_crypto_decrypt,
  op_crypto_derive_bits,
  op_crypto_derive_bits_x25519,
  op_crypto_derive_bits_x448,
  op_crypto_encrypt,
  op_crypto_export_key,
  op_crypto_export_pkcs8_ed25519,
  op_crypto_export_pkcs8_x25519,
  op_crypto_export_pkcs8_x448,
  op_crypto_export_spki_ed25519,
  op_crypto_export_spki_x25519,
  op_crypto_export_spki_x448,
  op_crypto_generate_ed25519_keypair,
  op_crypto_generate_key,
  op_crypto_generate_x25519_keypair,
  op_crypto_generate_x448_keypair,
  op_crypto_get_random_values,
  op_crypto_import_key,
  op_crypto_import_pkcs8_ed25519,
  op_crypto_import_pkcs8_x25519,
  op_crypto_import_pkcs8_x448,
  op_crypto_import_spki_ed25519,
  op_crypto_import_spki_x25519,
  op_crypto_import_spki_x448,
  op_crypto_jwk_x_ed25519,
  op_crypto_random_uuid,
  op_crypto_sign_ed25519,
  op_crypto_sign_key,
  op_crypto_subtle_digest,
  op_crypto_unwrap_key,
  op_crypto_verify_ed25519,
  op_crypto_verify_key,
  op_crypto_wrap_key,
} from "ext:core/ops";
const {
  ArrayBufferIsView,
  ArrayBufferPrototypeGetByteLength,
  ArrayBufferPrototypeSlice,
  ArrayPrototypeEvery,
  ArrayPrototypeFilter,
  ArrayPrototypeFind,
  ArrayPrototypeIncludes,
  DataViewPrototypeGetBuffer,
  DataViewPrototypeGetByteLength,
  DataViewPrototypeGetByteOffset,
  JSONParse,
  JSONStringify,
  MathCeil,
  ObjectAssign,
  ObjectHasOwn,
  ObjectPrototypeIsPrototypeOf,
  SafeArrayIterator,
  SafeWeakMap,
  StringFromCharCode,
  StringPrototypeCharCodeAt,
  StringPrototypeToLowerCase,
  StringPrototypeToUpperCase,
  Symbol,
  SymbolFor,
  SyntaxError,
  TypeError,
  TypedArrayPrototypeGetBuffer,
  TypedArrayPrototypeGetByteLength,
  TypedArrayPrototypeGetByteOffset,
  TypedArrayPrototypeGetSymbolToStringTag,
  TypedArrayPrototypeSlice,
  Uint8Array,
  WeakMapPrototypeGet,
  WeakMapPrototypeSet,
} = primordials;

import * as webidl from "ext:deno_webidl/00_webidl.js";
import { createFilteredInspectProxy } from "ext:deno_console/01_console.js";
import { DOMException } from "ext:deno_web/01_dom_exception.js";

const supportedNamedCurves = ["P-256", "P-384", "P-521"];
const recognisedUsages = [
  "encrypt",
  "decrypt",
  "sign",
  "verify",
  "deriveKey",
  "deriveBits",
  "wrapKey",
  "unwrapKey",
];

const simpleAlgorithmDictionaries = {
  AesGcmParams: { iv: "BufferSource", additionalData: "BufferSource" },
  RsaHashedKeyGenParams: { hash: "HashAlgorithmIdentifier" },
  EcKeyGenParams: {},
  HmacKeyGenParams: { hash: "HashAlgorithmIdentifier" },
  RsaPssParams: {},
  EcdsaParams: { hash: "HashAlgorithmIdentifier" },
  HmacImportParams: { hash: "HashAlgorithmIdentifier" },
  HkdfParams: {
    hash: "HashAlgorithmIdentifier",
    salt: "BufferSource",
    info: "BufferSource",
  },
  Pbkdf2Params: { hash: "HashAlgorithmIdentifier", salt: "BufferSource" },
  RsaOaepParams: { label: "BufferSource" },
  RsaHashedImportParams: { hash: "HashAlgorithmIdentifier" },
  EcKeyImportParams: {},
};

const supportedAlgorithms = {
  "digest": {
    "SHA-1": null,
    "SHA-256": null,
    "SHA-384": null,
    "SHA-512": null,
  },
  "generateKey": {
    "RSASSA-PKCS1-v1_5": "RsaHashedKeyGenParams",
    "RSA-PSS": "RsaHashedKeyGenParams",
    "RSA-OAEP": "RsaHashedKeyGenParams",
    "ECDSA": "EcKeyGenParams",
    "ECDH": "EcKeyGenParams",
    "AES-CTR": "AesKeyGenParams",
    "AES-CBC": "AesKeyGenParams",
    "AES-GCM": "AesKeyGenParams",
    "AES-KW": "AesKeyGenParams",
    "HMAC": "HmacKeyGenParams",
    "X25519": null,
    "X448": null,
    "Ed25519": null,
  },
  "sign": {
    "RSASSA-PKCS1-v1_5": null,
    "RSA-PSS": "RsaPssParams",
    "ECDSA": "EcdsaParams",
    "HMAC": null,
    "Ed25519": null,
  },
  "verify": {
    "RSASSA-PKCS1-v1_5": null,
    "RSA-PSS": "RsaPssParams",
    "ECDSA": "EcdsaParams",
    "HMAC": null,
    "Ed25519": null,
  },
  "importKey": {
    "RSASSA-PKCS1-v1_5": "RsaHashedImportParams",
    "RSA-PSS": "RsaHashedImportParams",
    "RSA-OAEP": "RsaHashedImportParams",
    "ECDSA": "EcKeyImportParams",
    "ECDH": "EcKeyImportParams",
    "HMAC": "HmacImportParams",
    "HKDF": null,
    "PBKDF2": null,
    "AES-CTR": null,
    "AES-CBC": null,
    "AES-GCM": null,
    "AES-KW": null,
    "Ed25519": null,
    "X25519": null,
    "X448": null,
  },
  "deriveBits": {
    "HKDF": "HkdfParams",
    "PBKDF2": "Pbkdf2Params",
    "ECDH": "EcdhKeyDeriveParams",
    "X25519": "EcdhKeyDeriveParams",
    "X448": "EcdhKeyDeriveParams",
  },
  "encrypt": {
    "RSA-OAEP": "RsaOaepParams",
    "AES-CBC": "AesCbcParams",
    "AES-GCM": "AesGcmParams",
    "AES-CTR": "AesCtrParams",
  },
  "decrypt": {
    "RSA-OAEP": "RsaOaepParams",
    "AES-CBC": "AesCbcParams",
    "AES-GCM": "AesGcmParams",
    "AES-CTR": "AesCtrParams",
  },
  "get key length": {
    "AES-CBC": "AesDerivedKeyParams",
    "AES-CTR": "AesDerivedKeyParams",
    "AES-GCM": "AesDerivedKeyParams",
    "AES-KW": "AesDerivedKeyParams",
    "HMAC": "HmacImportParams",
    "HKDF": null,
    "PBKDF2": null,
  },
  "wrapKey": {
    "AES-KW": null,
  },
  "unwrapKey": {
    "AES-KW": null,
  },
};

const aesJwkAlg = {
  "AES-CTR": {
    128: "A128CTR",
    192: "A192CTR",
    256: "A256CTR",
  },
  "AES-CBC": {
    128: "A128CBC",
    192: "A192CBC",
    256: "A256CBC",
  },
  "AES-GCM": {
    128: "A128GCM",
    192: "A192GCM",
    256: "A256GCM",
  },
  "AES-KW": {
    128: "A128KW",
    192: "A192KW",
    256: "A256KW",
  },
};

// See https://www.w3.org/TR/WebCryptoAPI/#dfn-normalize-an-algorithm
// 18.4.4
function normalizeAlgorithm(algorithm, op) {
  if (typeof algorithm == "string") {
    return normalizeAlgorithm({ name: algorithm }, op);
  }

  // 1.
  const registeredAlgorithms = supportedAlgorithms[op];
  // 2. 3.
  const initialAlg = webidl.converters.Algorithm(
    algorithm,
    "Failed to normalize algorithm",
    "passed algorithm",
  );
  // 4.
  let algName = initialAlg.name;

  // 5.
  let desiredType = undefined;
  for (const key in registeredAlgorithms) {
    if (!ObjectHasOwn(registeredAlgorithms, key)) {
      continue;
    }
    if (
      StringPrototypeToUpperCase(key) === StringPrototypeToUpperCase(algName)
    ) {
      algName = key;
      desiredType = registeredAlgorithms[key];
    }
  }
  if (desiredType === undefined) {
    throw new DOMException(
      "Unrecognized algorithm name",
      "NotSupportedError",
    );
  }

  // Fast path everything below if the registered dictionary is "None".
  if (desiredType === null) {
    return { name: algName };
  }

  // 6.
  const normalizedAlgorithm = webidl.converters[desiredType](
    algorithm,
    "Failed to normalize algorithm",
    "passed algorithm",
  );
  // 7.
  normalizedAlgorithm.name = algName;

  // 9.
  const dict = simpleAlgorithmDictionaries[desiredType];
  // 10.
  for (const member in dict) {
    if (!ObjectHasOwn(dict, member)) {
      continue;
    }
    const idlType = dict[member];
    const idlValue = normalizedAlgorithm[member];
    // 3.
    if (idlType === "BufferSource" && idlValue) {
      normalizedAlgorithm[member] = copyBuffer(idlValue);
    } else if (idlType === "HashAlgorithmIdentifier") {
      normalizedAlgorithm[member] = normalizeAlgorithm(idlValue, "digest");
    } else if (idlType === "AlgorithmIdentifier") {
      // TODO(lucacasonato): implement
      throw new TypeError("Unimplemented");
    }
  }

  return normalizedAlgorithm;
}

/**
 * @param {ArrayBufferView | ArrayBuffer} input
 * @returns {Uint8Array}
 */
function copyBuffer(input) {
  if (isTypedArray(input)) {
    return TypedArrayPrototypeSlice(
      new Uint8Array(
        TypedArrayPrototypeGetBuffer(/** @type {Uint8Array} */ (input)),
        TypedArrayPrototypeGetByteOffset(/** @type {Uint8Array} */ (input)),
        TypedArrayPrototypeGetByteLength(/** @type {Uint8Array} */ (input)),
      ),
    );
  } else if (isDataView(input)) {
    return TypedArrayPrototypeSlice(
      new Uint8Array(
        DataViewPrototypeGetBuffer(/** @type {DataView} */ (input)),
        DataViewPrototypeGetByteOffset(/** @type {DataView} */ (input)),
        DataViewPrototypeGetByteLength(/** @type {DataView} */ (input)),
      ),
    );
  }
  // ArrayBuffer
  return TypedArrayPrototypeSlice(
    new Uint8Array(
      input,
      0,
      ArrayBufferPrototypeGetByteLength(input),
    ),
  );
}

const _handle = Symbol("[[handle]]");
const _algorithm = Symbol("[[algorithm]]");
const _extractable = Symbol("[[extractable]]");
const _usages = Symbol("[[usages]]");
const _type = Symbol("[[type]]");

class CryptoKey {
  /** @type {string} */
  [_type];
  /** @type {boolean} */
  [_extractable];
  /** @type {object} */
  [_algorithm];
  /** @type {string[]} */
  [_usages];
  /** @type {object} */
  [_handle];

  constructor() {
    webidl.illegalConstructor();
  }

  /** @returns {string} */
  get type() {
    webidl.assertBranded(this, CryptoKeyPrototype);
    return this[_type];
  }

  /** @returns {boolean} */
  get extractable() {
    webidl.assertBranded(this, CryptoKeyPrototype);
    return this[_extractable];
  }

  /** @returns {string[]} */
  get usages() {
    webidl.assertBranded(this, CryptoKeyPrototype);
    // TODO(lucacasonato): return a SameObject copy
    return this[_usages];
  }

  /** @returns {object} */
  get algorithm() {
    webidl.assertBranded(this, CryptoKeyPrototype);
    // TODO(lucacasonato): return a SameObject copy
    return this[_algorithm];
  }

  [SymbolFor("Deno.privateCustomInspect")](inspect, inspectOptions) {
    return inspect(
      createFilteredInspectProxy({
        object: this,
        evaluate: ObjectPrototypeIsPrototypeOf(CryptoKeyPrototype, this),
        keys: [
          "type",
          "extractable",
          "algorithm",
          "usages",
        ],
      }),
      inspectOptions,
    );
  }
}

webidl.configureInterface(CryptoKey);
const CryptoKeyPrototype = CryptoKey.prototype;

/**
 * @param {string} type
 * @param {boolean} extractable
 * @param {string[]} usages
 * @param {object} algorithm
 * @param {object} handle
 * @returns
 */
function constructKey(type, extractable, usages, algorithm, handle) {
  const key = webidl.createBranded(CryptoKey);
  key[_type] = type;
  key[_extractable] = extractable;
  key[_usages] = usages;
  key[_algorithm] = algorithm;
  key[_handle] = handle;
  return key;
}

// https://w3c.github.io/webcrypto/#concept-usage-intersection
/**
 * @param {string[]} a
 * @param {string[]} b
 * @returns
 */
function usageIntersection(a, b) {
  return ArrayPrototypeFilter(
    a,
    (i) => ArrayPrototypeIncludes(b, i),
  );
}

// TODO(lucacasonato): this should be moved to rust
/** @type {WeakMap<object, object>} */
const KEY_STORE = new SafeWeakMap();

function getKeyLength(algorithm) {
  switch (algorithm.name) {
    case "AES-CBC":
    case "AES-CTR":
    case "AES-GCM":
    case "AES-KW": {
      // 1.
      if (!ArrayPrototypeIncludes([128, 192, 256], algorithm.length)) {
        throw new DOMException(
          `Length must be 128, 192, or 256: received ${algorithm.length}`,
          "OperationError",
        );
      }

      // 2.
      return algorithm.length;
    }
    case "HMAC": {
      // 1.
      let length;
      if (algorithm.length === undefined) {
        switch (algorithm.hash.name) {
          case "SHA-1":
            length = 512;
            break;
          case "SHA-256":
            length = 512;
            break;
          case "SHA-384":
            length = 1024;
            break;
          case "SHA-512":
            length = 1024;
            break;
          default:
            throw new DOMException(
              `Unrecognized hash algorithm: ${algorithm.hash.name}`,
              "NotSupportedError",
            );
        }
      } else if (algorithm.length !== 0) {
        length = algorithm.length;
      } else {
        throw new TypeError(`Invalid length: ${algorithm.length}`);
      }

      // 2.
      return length;
    }
    case "HKDF": {
      // 1.
      return null;
    }
    case "PBKDF2": {
      // 1.
      return null;
    }
    default:
      throw new TypeError("Unreachable");
  }
}

class SubtleCrypto {
  constructor() {
    webidl.illegalConstructor();
  }

  /**
   * @param {string} algorithm
   * @param {BufferSource} data
   * @returns {Promise<ArrayBuffer>}
   */
  async digest(algorithm, data) {
    webidl.assertBranded(this, SubtleCryptoPrototype);
    const prefix = "Failed to execute 'digest' on 'SubtleCrypto'";
    webidl.requiredArguments(arguments.length, 2, prefix);
    algorithm = webidl.converters.AlgorithmIdentifier(
      algorithm,
      prefix,
      "Argument 1",
    );
    data = webidl.converters.BufferSource(data, prefix, "Argument 2");

    data = copyBuffer(data);

    algorithm = normalizeAlgorithm(algorithm, "digest");

    const result = await op_crypto_subtle_digest(
      algorithm.name,
      data,
    );

    return TypedArrayPrototypeGetBuffer(result);
  }

  /**
   * @param {string} algorithm
   * @param {CryptoKey} key
   * @param {BufferSource} data
   * @returns {Promise<any>}
   */
  async encrypt(algorithm, key, data) {
    webidl.assertBranded(this, SubtleCryptoPrototype);
    const prefix = "Failed to execute 'encrypt' on 'SubtleCrypto'";
    webidl.requiredArguments(arguments.length, 3, prefix);
    algorithm = webidl.converters.AlgorithmIdentifier(
      algorithm,
      prefix,
      "Argument 1",
    );
    key = webidl.converters.CryptoKey(key, prefix, "Argument 2");
    data = webidl.converters.BufferSource(data, prefix, "Argument 3");

    // 2.
    data = copyBuffer(data);

    // 3.
    const normalizedAlgorithm = normalizeAlgorithm(algorithm, "encrypt");

    // 8.
    if (normalizedAlgorithm.name !== key[_algorithm].name) {
      throw new DOMException(
        `Encryption algorithm '${normalizedAlgorithm.name}' does not match key algorithm`,
        "InvalidAccessError",
      );
    }

    // 9.
    if (!ArrayPrototypeIncludes(key[_usages], "encrypt")) {
      throw new DOMException(
        "Key does not support the 'encrypt' operation",
        "InvalidAccessError",
      );
    }

    return await encrypt(normalizedAlgorithm, key, data);
  }

  /**
   * @param {string} algorithm
   * @param {CryptoKey} key
   * @param {BufferSource} data
   * @returns {Promise<any>}
   */
  async decrypt(algorithm, key, data) {
    webidl.assertBranded(this, SubtleCryptoPrototype);
    const prefix = "Failed to execute 'decrypt' on 'SubtleCrypto'";
    webidl.requiredArguments(arguments.length, 3, prefix);
    algorithm = webidl.converters.AlgorithmIdentifier(
      algorithm,
      prefix,
      "Argument 1",
    );
    key = webidl.converters.CryptoKey(key, prefix, "Argument 2");
    data = webidl.converters.BufferSource(data, prefix, "Argument 3");

    // 2.
    data = copyBuffer(data);

    // 3.
    const normalizedAlgorithm = normalizeAlgorithm(algorithm, "decrypt");

    // 8.
    if (normalizedAlgorithm.name !== key[_algorithm].name) {
      throw new DOMException(
        `Decryption algorithm "${normalizedAlgorithm.name}" does not match key algorithm`,
        "OperationError",
      );
    }

    // 9.
    if (!ArrayPrototypeIncludes(key[_usages], "decrypt")) {
      throw new DOMException(
        "Key does not support the 'decrypt' operation",
        "InvalidAccessError",
      );
    }

    const handle = key[_handle];
    const keyData = WeakMapPrototypeGet(KEY_STORE, handle);

    switch (normalizedAlgorithm.name) {
      case "RSA-OAEP": {
        // 1.
        if (key[_type] !== "private") {
          throw new DOMException(
            "Key type not supported",
            "InvalidAccessError",
          );
        }

        // 2.
        if (normalizedAlgorithm.label) {
          normalizedAlgorithm.label = copyBuffer(normalizedAlgorithm.label);
        } else {
          normalizedAlgorithm.label = new Uint8Array();
        }

        // 3-5.
        const hashAlgorithm = key[_algorithm].hash.name;
        const plainText = await op_crypto_decrypt({
          key: keyData,
          algorithm: "RSA-OAEP",
          hash: hashAlgorithm,
          label: normalizedAlgorithm.label,
        }, data);

        // 6.
        return TypedArrayPrototypeGetBuffer(plainText);
      }
      case "AES-CBC": {
        normalizedAlgorithm.iv = copyBuffer(normalizedAlgorithm.iv);

        // 1.
        if (TypedArrayPrototypeGetByteLength(normalizedAlgorithm.iv) !== 16) {
          throw new DOMException(
            "Counter must be 16 bytes",
            "OperationError",
          );
        }

        const plainText = await op_crypto_decrypt({
          key: keyData,
          algorithm: "AES-CBC",
          iv: normalizedAlgorithm.iv,
          length: key[_algorithm].length,
        }, data);

        // 6.
        return TypedArrayPrototypeGetBuffer(plainText);
      }
      case "AES-CTR": {
        normalizedAlgorithm.counter = copyBuffer(normalizedAlgorithm.counter);

        // 1.
        if (
          TypedArrayPrototypeGetByteLength(normalizedAlgorithm.counter) !== 16
        ) {
          throw new DOMException(
            "Counter vector must be 16 bytes",
            "OperationError",
          );
        }

        // 2.
        if (
          normalizedAlgorithm.length === 0 || normalizedAlgorithm.length > 128
        ) {
          throw new DOMException(
            `Counter length must not be 0 or greater than 128: received ${normalizedAlgorithm.length}`,
            "OperationError",
          );
        }

        // 3.
        const cipherText = await op_crypto_decrypt({
          key: keyData,
          algorithm: "AES-CTR",
          keyLength: key[_algorithm].length,
          counter: normalizedAlgorithm.counter,
          ctrLength: normalizedAlgorithm.length,
        }, data);

        // 4.
        return TypedArrayPrototypeGetBuffer(cipherText);
      }
      case "AES-GCM": {
        normalizedAlgorithm.iv = copyBuffer(normalizedAlgorithm.iv);

        // 1.
        if (normalizedAlgorithm.tagLength === undefined) {
          normalizedAlgorithm.tagLength = 128;
        } else if (
          !ArrayPrototypeIncludes(
            [32, 64, 96, 104, 112, 120, 128],
            normalizedAlgorithm.tagLength,
          )
        ) {
          throw new DOMException(
            `Invalid tag length: ${normalizedAlgorithm.tagLength}`,
            "OperationError",
          );
        }

        // 2.
        if (
          TypedArrayPrototypeGetByteLength(data) <
            normalizedAlgorithm.tagLength / 8
        ) {
          throw new DOMException(
            "Tag length overflows ciphertext",
            "OperationError",
          );
        }

        // 3. We only support 96-bit and 128-bit nonce.
        if (
          ArrayPrototypeIncludes(
            [12, 16],
            TypedArrayPrototypeGetByteLength(normalizedAlgorithm.iv),
          ) === undefined
        ) {
          throw new DOMException(
            "Initialization vector length not supported",
            "NotSupportedError",
          );
        }

        // 4.
        if (normalizedAlgorithm.additionalData !== undefined) {
          // NOTE: over the size of Number.MAX_SAFE_INTEGER is not available in V8
          // if (normalizedAlgorithm.additionalData.byteLength > (2 ** 64) - 1) {
          //   throw new DOMException(
          //     "Additional data too large",
          //     "OperationError",
          //   );
          // }
          normalizedAlgorithm.additionalData = copyBuffer(
            normalizedAlgorithm.additionalData,
          );
        }

        // 5-8.
        const plaintext = await op_crypto_decrypt({
          key: keyData,
          algorithm: "AES-GCM",
          length: key[_algorithm].length,
          iv: normalizedAlgorithm.iv,
          additionalData: normalizedAlgorithm.additionalData ||
            null,
          tagLength: normalizedAlgorithm.tagLength,
        }, data);

        // 9.
        return TypedArrayPrototypeGetBuffer(plaintext);
      }
      default:
        throw new DOMException("Not implemented", "NotSupportedError");
    }
  }

  /**
   * @param {string} algorithm
   * @param {CryptoKey} key
   * @param {BufferSource} data
   * @returns {Promise<any>}
   */
  async sign(algorithm, key, data) {
    webidl.assertBranded(this, SubtleCryptoPrototype);
    const prefix = "Failed to execute 'sign' on 'SubtleCrypto'";
    webidl.requiredArguments(arguments.length, 3, prefix);
    algorithm = webidl.converters.AlgorithmIdentifier(
      algorithm,
      prefix,
      "Argument 1",
    );
    key = webidl.converters.CryptoKey(key, prefix, "Argument 2");
    data = webidl.converters.BufferSource(data, prefix, "Argument 3");

    // 1.
    data = copyBuffer(data);

    // 2.
    const normalizedAlgorithm = normalizeAlgorithm(algorithm, "sign");

    const handle = key[_handle];
    const keyData = WeakMapPrototypeGet(KEY_STORE, handle);

    // 8.
    if (normalizedAlgorithm.name !== key[_algorithm].name) {
      throw new DOMException(
        "Signing algorithm does not match key algorithm",
        "InvalidAccessError",
      );
    }

    // 9.
    if (!ArrayPrototypeIncludes(key[_usages], "sign")) {
      throw new DOMException(
        "Key does not support the 'sign' operation",
        "InvalidAccessError",
      );
    }

    switch (normalizedAlgorithm.name) {
      case "RSASSA-PKCS1-v1_5": {
        // 1.
        if (key[_type] !== "private") {
          throw new DOMException(
            "Key type not supported",
            "InvalidAccessError",
          );
        }

        // 2.
        const hashAlgorithm = key[_algorithm].hash.name;
        const signature = await op_crypto_sign_key({
          key: keyData,
          algorithm: "RSASSA-PKCS1-v1_5",
          hash: hashAlgorithm,
        }, data);

        return TypedArrayPrototypeGetBuffer(signature);
      }
      case "RSA-PSS": {
        // 1.
        if (key[_type] !== "private") {
          throw new DOMException(
            "Key type not supported",
            "InvalidAccessError",
          );
        }

        // 2.
        const hashAlgorithm = key[_algorithm].hash.name;
        const signature = await op_crypto_sign_key({
          key: keyData,
          algorithm: "RSA-PSS",
          hash: hashAlgorithm,
          saltLength: normalizedAlgorithm.saltLength,
        }, data);

        return TypedArrayPrototypeGetBuffer(signature);
      }
      case "ECDSA": {
        // 1.
        if (key[_type] !== "private") {
          throw new DOMException(
            "Key type not supported",
            "InvalidAccessError",
          );
        }

        // 2.
        const hashAlgorithm = normalizedAlgorithm.hash.name;
        const namedCurve = key[_algorithm].namedCurve;
        if (!ArrayPrototypeIncludes(supportedNamedCurves, namedCurve)) {
          throw new DOMException("Curve not supported", "NotSupportedError");
        }

        if (
          (key[_algorithm].namedCurve === "P-256" &&
            hashAlgorithm !== "SHA-256") ||
          (key[_algorithm].namedCurve === "P-384" &&
            hashAlgorithm !== "SHA-384")
        ) {
          throw new DOMException(
            "Not implemented",
            "NotSupportedError",
          );
        }

        const signature = await op_crypto_sign_key({
          key: keyData,
          algorithm: "ECDSA",
          hash: hashAlgorithm,
          namedCurve,
        }, data);

        return TypedArrayPrototypeGetBuffer(signature);
      }
      case "HMAC": {
        const hashAlgorithm = key[_algorithm].hash.name;

        const signature = await op_crypto_sign_key({
          key: keyData,
          algorithm: "HMAC",
          hash: hashAlgorithm,
        }, data);

        return TypedArrayPrototypeGetBuffer(signature);
      }
      case "Ed25519": {
        // 1.
        if (key[_type] !== "private") {
          throw new DOMException(
            "Key type not supported",
            "InvalidAccessError",
          );
        }

        // https://briansmith.org/rustdoc/src/ring/ec/curve25519/ed25519/signing.rs.html#260
        const SIGNATURE_LEN = 32 * 2; // ELEM_LEN + SCALAR_LEN
        const signature = new Uint8Array(SIGNATURE_LEN);
        if (!op_crypto_sign_ed25519(keyData, data, signature)) {
          throw new DOMException(
            "Failed to sign",
            "OperationError",
          );
        }
        return TypedArrayPrototypeGetBuffer(signature);
      }
    }

    throw new TypeError("Unreachable");
  }

  /**
   * @param {string} format
   * @param {BufferSource} keyData
   * @param {string} algorithm
   * @param {boolean} extractable
   * @param {KeyUsages[]} keyUsages
   * @returns {Promise<any>}
   */
  async importKey(format, keyData, algorithm, extractable, keyUsages) {
    webidl.assertBranded(this, SubtleCryptoPrototype);
    const prefix = "Failed to execute 'importKey' on 'SubtleCrypto'";
    webidl.requiredArguments(arguments.length, 4, prefix);
    format = webidl.converters.KeyFormat(format, prefix, "Argument 1");
    keyData = webidl.converters["BufferSource or JsonWebKey"](
      keyData,
      prefix,
      "Argument 2",
    );
    algorithm = webidl.converters.AlgorithmIdentifier(
      algorithm,
      prefix,
      "Argument 3",
    );
    extractable = webidl.converters.boolean(extractable, prefix, "Argument 4");
    keyUsages = webidl.converters["sequence<KeyUsage>"](
      keyUsages,
      prefix,
      "Argument 5",
    );

    // 2.
    if (format !== "jwk") {
      if (ArrayBufferIsView(keyData) || isArrayBuffer(keyData)) {
        keyData = copyBuffer(keyData);
      } else {
        throw new TypeError("Cannot import key: 'keyData' is a JsonWebKey");
      }
    } else {
      if (ArrayBufferIsView(keyData) || isArrayBuffer(keyData)) {
        throw new TypeError("Cannot import key: 'keyData' is not a JsonWebKey");
      }
    }

    const normalizedAlgorithm = normalizeAlgorithm(algorithm, "importKey");

    // 8.
    const result = await importKeyInner(
      format,
      normalizedAlgorithm,
      keyData,
      extractable,
      keyUsages,
    );

    // 9.
    if (
      ArrayPrototypeIncludes(["private", "secret"], result[_type]) &&
      keyUsages.length == 0
    ) {
      throw new SyntaxError("Invalid key usage");
    }

    return result;
  }

  /**
   * @param {string} format
   * @param {CryptoKey} key
   * @returns {Promise<any>}
   */
  // deno-lint-ignore require-await
  async exportKey(format, key) {
    webidl.assertBranded(this, SubtleCryptoPrototype);
    const prefix = "Failed to execute 'exportKey' on 'SubtleCrypto'";
    webidl.requiredArguments(arguments.length, 2, prefix);
    format = webidl.converters.KeyFormat(format, prefix, "Argument 1");
    key = webidl.converters.CryptoKey(key, prefix, "Argument 2");

    const handle = key[_handle];
    // 2.
    const innerKey = WeakMapPrototypeGet(KEY_STORE, handle);

    const algorithmName = key[_algorithm].name;

    let result;

    switch (algorithmName) {
      case "HMAC": {
        result = exportKeyHMAC(format, key, innerKey);
        break;
      }
      case "RSASSA-PKCS1-v1_5":
      case "RSA-PSS":
      case "RSA-OAEP": {
        result = exportKeyRSA(format, key, innerKey);
        break;
      }
      case "ECDH":
      case "ECDSA": {
        result = exportKeyEC(format, key, innerKey);
        break;
      }
      case "Ed25519": {
        result = exportKeyEd25519(format, key, innerKey);
        break;
      }
      case "X448": {
        result = exportKeyX448(format, key, innerKey);
        break;
      }
      case "X25519": {
        result = exportKeyX25519(format, key, innerKey);
        break;
      }
      case "AES-CTR":
      case "AES-CBC":
      case "AES-GCM":
      case "AES-KW": {
        result = exportKeyAES(format, key, innerKey);
        break;
      }
      default:
        throw new DOMException("Not implemented", "NotSupportedError");
    }

    if (key.extractable === false) {
      throw new DOMException(
        "Key is not extractable",
        "InvalidAccessError",
      );
    }

    return result;
  }

  /**
   * @param {AlgorithmIdentifier} algorithm
   * @param {CryptoKey} baseKey
   * @param {number | null} length
   * @returns {Promise<ArrayBuffer>}
   */
  async deriveBits(algorithm, baseKey, length = null) {
    webidl.assertBranded(this, SubtleCryptoPrototype);
    const prefix = "Failed to execute 'deriveBits' on 'SubtleCrypto'";
    webidl.requiredArguments(arguments.length, 2, prefix);
    algorithm = webidl.converters.AlgorithmIdentifier(
      algorithm,
      prefix,
      "Argument 1",
    );
    baseKey = webidl.converters.CryptoKey(baseKey, prefix, "Argument 2");
    if (length !== null) {
      length = webidl.converters["unsigned long"](length, prefix, "Argument 3");
    }

    // 2.
    const normalizedAlgorithm = normalizeAlgorithm(algorithm, "deriveBits");
    // 4-6.
    const result = await deriveBits(normalizedAlgorithm, baseKey, length);
    // 7.
    if (normalizedAlgorithm.name !== baseKey[_algorithm].name) {
      throw new DOMException("Invalid algorithm name", "InvalidAccessError");
    }
    // 8.
    if (!ArrayPrototypeIncludes(baseKey[_usages], "deriveBits")) {
      throw new DOMException(
        "'baseKey' usages does not contain 'deriveBits'",
        "InvalidAccessError",
      );
    }
    // 9-10.
    return result;
  }

  /**
   * @param {AlgorithmIdentifier} algorithm
   * @param {CryptoKey} baseKey
   * @param {number} length
   * @returns {Promise<ArrayBuffer>}
   */
  async deriveKey(
    algorithm,
    baseKey,
    derivedKeyType,
    extractable,
    keyUsages,
  ) {
    webidl.assertBranded(this, SubtleCryptoPrototype);
    const prefix = "Failed to execute 'deriveKey' on 'SubtleCrypto'";
    webidl.requiredArguments(arguments.length, 5, prefix);
    algorithm = webidl.converters.AlgorithmIdentifier(
      algorithm,
      prefix,
      "Argument 1",
    );
    baseKey = webidl.converters.CryptoKey(baseKey, prefix, "Argument 2");
    derivedKeyType = webidl.converters.AlgorithmIdentifier(
      derivedKeyType,
      prefix,
      "Argument 3",
    );
    extractable = webidl.converters["boolean"](
      extractable,
      prefix,
      "Argument 4",
    );
    keyUsages = webidl.converters["sequence<KeyUsage>"](
      keyUsages,
      prefix,
      "Argument 5",
    );

    // 2-3.
    const normalizedAlgorithm = normalizeAlgorithm(algorithm, "deriveBits");

    // 4-5.
    const normalizedDerivedKeyAlgorithmImport = normalizeAlgorithm(
      derivedKeyType,
      "importKey",
    );

    // 6-7.
    const normalizedDerivedKeyAlgorithmLength = normalizeAlgorithm(
      derivedKeyType,
      "get key length",
    );

    // 8-10.

    // 11.
    if (normalizedAlgorithm.name !== baseKey[_algorithm].name) {
      throw new DOMException(
        `Invalid algorithm name: ${normalizedAlgorithm.name}`,
        "InvalidAccessError",
      );
    }

    // 12.
    if (!ArrayPrototypeIncludes(baseKey[_usages], "deriveKey")) {
      throw new DOMException(
        "'baseKey' usages does not contain 'deriveKey'",
        "InvalidAccessError",
      );
    }

    // 13.
    const length = getKeyLength(normalizedDerivedKeyAlgorithmLength);

    // 14.
    const secret = await deriveBits(
      normalizedAlgorithm,
      baseKey,
      length,
    );

    // 15.
    const result = await this.importKey(
      "raw",
      secret,
      normalizedDerivedKeyAlgorithmImport,
      extractable,
      keyUsages,
    );

    // 16.
    if (
      ArrayPrototypeIncludes(["private", "secret"], result[_type]) &&
      keyUsages.length == 0
    ) {
      throw new SyntaxError("Invalid key usage");
    }
    // 17.
    return result;
  }

  /**
   * @param {string} algorithm
   * @param {CryptoKey} key
   * @param {BufferSource} signature
   * @param {BufferSource} data
   * @returns {Promise<boolean>}
   */
  async verify(algorithm, key, signature, data) {
    webidl.assertBranded(this, SubtleCryptoPrototype);
    const prefix = "Failed to execute 'verify' on 'SubtleCrypto'";
    webidl.requiredArguments(arguments.length, 4, prefix);
    algorithm = webidl.converters.AlgorithmIdentifier(
      algorithm,
      prefix,
      "Argument 1",
    );
    key = webidl.converters.CryptoKey(key, prefix, "Argument 2");
    signature = webidl.converters.BufferSource(signature, prefix, "Argument 3");
    data = webidl.converters.BufferSource(data, prefix, "Argument 4");

    // 2.
    signature = copyBuffer(signature);

    // 3.
    data = copyBuffer(data);

    const normalizedAlgorithm = normalizeAlgorithm(algorithm, "verify");

    const handle = key[_handle];
    const keyData = WeakMapPrototypeGet(KEY_STORE, handle);

    if (normalizedAlgorithm.name !== key[_algorithm].name) {
      throw new DOMException(
        "Verifying algorithm does not match key algorithm",
        "InvalidAccessError",
      );
    }

    if (!ArrayPrototypeIncludes(key[_usages], "verify")) {
      throw new DOMException(
        "Key does not support the 'verify' operation",
        "InvalidAccessError",
      );
    }

    switch (normalizedAlgorithm.name) {
      case "RSASSA-PKCS1-v1_5": {
        if (key[_type] !== "public") {
          throw new DOMException(
            "Key type not supported",
            "InvalidAccessError",
          );
        }

        const hashAlgorithm = key[_algorithm].hash.name;
        return await op_crypto_verify_key({
          key: keyData,
          algorithm: "RSASSA-PKCS1-v1_5",
          hash: hashAlgorithm,
          signature,
        }, data);
      }
      case "RSA-PSS": {
        if (key[_type] !== "public") {
          throw new DOMException(
            "Key type not supported",
            "InvalidAccessError",
          );
        }

        const hashAlgorithm = key[_algorithm].hash.name;
        return await op_crypto_verify_key({
          key: keyData,
          algorithm: "RSA-PSS",
          hash: hashAlgorithm,
          signature,
          saltLength: normalizedAlgorithm.saltLength,
        }, data);
      }
      case "HMAC": {
        const hash = key[_algorithm].hash.name;
        return await op_crypto_verify_key({
          key: keyData,
          algorithm: "HMAC",
          hash,
          signature,
        }, data);
      }
      case "ECDSA": {
        // 1.
        if (key[_type] !== "public") {
          throw new DOMException(
            "Key type not supported",
            "InvalidAccessError",
          );
        }
        // 2.
        const hash = normalizedAlgorithm.hash.name;

        if (
          (key[_algorithm].namedCurve === "P-256" && hash !== "SHA-256") ||
          (key[_algorithm].namedCurve === "P-384" && hash !== "SHA-384")
        ) {
          throw new DOMException(
            "Not implemented",
            "NotSupportedError",
          );
        }

        // 3-8.
        return await op_crypto_verify_key({
          key: keyData,
          algorithm: "ECDSA",
          hash,
          signature,
          namedCurve: key[_algorithm].namedCurve,
        }, data);
      }
      case "Ed25519": {
        // 1.
        if (key[_type] !== "public") {
          throw new DOMException(
            "Key type not supported",
            "InvalidAccessError",
          );
        }

        return op_crypto_verify_ed25519(keyData, data, signature);
      }
    }

    throw new TypeError("Unreachable");
  }

  /**
   * @param {string} algorithm
   * @param {boolean} extractable
   * @param {KeyUsage[]} keyUsages
   * @returns {Promise<any>}
   */
  async wrapKey(format, key, wrappingKey, wrapAlgorithm) {
    webidl.assertBranded(this, SubtleCryptoPrototype);
    const prefix = "Failed to execute 'wrapKey' on 'SubtleCrypto'";
    webidl.requiredArguments(arguments.length, 4, prefix);
    format = webidl.converters.KeyFormat(format, prefix, "Argument 1");
    key = webidl.converters.CryptoKey(key, prefix, "Argument 2");
    wrappingKey = webidl.converters.CryptoKey(
      wrappingKey,
      prefix,
      "Argument 3",
    );
    wrapAlgorithm = webidl.converters.AlgorithmIdentifier(
      wrapAlgorithm,
      prefix,
      "Argument 4",
    );

    let normalizedAlgorithm;

    try {
      // 2.
      normalizedAlgorithm = normalizeAlgorithm(wrapAlgorithm, "wrapKey");
    } catch (_) {
      // 3.
      normalizedAlgorithm = normalizeAlgorithm(wrapAlgorithm, "encrypt");
    }

    // 8.
    if (normalizedAlgorithm.name !== wrappingKey[_algorithm].name) {
      throw new DOMException(
        "Wrapping algorithm does not match key algorithm",
        "InvalidAccessError",
      );
    }

    // 9.
    if (!ArrayPrototypeIncludes(wrappingKey[_usages], "wrapKey")) {
      throw new DOMException(
        "Key does not support the 'wrapKey' operation",
        "InvalidAccessError",
      );
    }

    // 10. NotSupportedError will be thrown in step 12.
    // 11.
    if (key[_extractable] === false) {
      throw new DOMException(
        "Key is not extractable",
        "InvalidAccessError",
      );
    }

    // 12.
    const exportedKey = await this.exportKey(format, key);

    let bytes;
    // 13.
    if (format !== "jwk") {
      bytes = new Uint8Array(exportedKey);
    } else {
      const jwk = JSONStringify(exportedKey);
      const ret = new Uint8Array(jwk.length);
      for (let i = 0; i < jwk.length; i++) {
        ret[i] = StringPrototypeCharCodeAt(jwk, i);
      }
      bytes = ret;
    }

    // 14-15.
    if (
      supportedAlgorithms["wrapKey"][normalizedAlgorithm.name] !== undefined
    ) {
      const handle = wrappingKey[_handle];
      const keyData = WeakMapPrototypeGet(KEY_STORE, handle);

      switch (normalizedAlgorithm.name) {
        case "AES-KW": {
          const cipherText = await op_crypto_wrap_key({
            key: keyData,
            algorithm: normalizedAlgorithm.name,
          }, bytes);

          // 4.
          return TypedArrayPrototypeGetBuffer(cipherText);
        }
        default: {
          throw new DOMException(
            "Not implemented",
            "NotSupportedError",
          );
        }
      }
    } else if (
      supportedAlgorithms["encrypt"][normalizedAlgorithm.name] !== undefined
    ) {
      // must construct a new key, since keyUsages is ["wrapKey"] and not ["encrypt"]
      return await encrypt(
        normalizedAlgorithm,
        constructKey(
          wrappingKey[_type],
          wrappingKey[_extractable],
          ["encrypt"],
          wrappingKey[_algorithm],
          wrappingKey[_handle],
        ),
        bytes,
      );
    } else {
      throw new DOMException(
        "Algorithm not supported",
        "NotSupportedError",
      );
    }
  }
  /**
   * @param {string} format
   * @param {BufferSource} wrappedKey
   * @param {CryptoKey} unwrappingKey
   * @param {AlgorithmIdentifier} unwrapAlgorithm
   * @param {AlgorithmIdentifier} unwrappedKeyAlgorithm
   * @param {boolean} extractable
   * @param {KeyUsage[]} keyUsages
   * @returns {Promise<CryptoKey>}
   */
  async unwrapKey(
    format,
    wrappedKey,
    unwrappingKey,
    unwrapAlgorithm,
    unwrappedKeyAlgorithm,
    extractable,
    keyUsages,
  ) {
    webidl.assertBranded(this, SubtleCryptoPrototype);
    const prefix = "Failed to execute 'unwrapKey' on 'SubtleCrypto'";
    webidl.requiredArguments(arguments.length, 7, prefix);
    format = webidl.converters.KeyFormat(format, prefix, "Argument 1");
    wrappedKey = webidl.converters.BufferSource(
      wrappedKey,
      prefix,
      "Argument 2",
    );
    unwrappingKey = webidl.converters.CryptoKey(
      unwrappingKey,
      prefix,
      "Argument 3",
    );
    unwrapAlgorithm = webidl.converters.AlgorithmIdentifier(
      unwrapAlgorithm,
      prefix,
      "Argument 4",
    );
    unwrappedKeyAlgorithm = webidl.converters.AlgorithmIdentifier(
      unwrappedKeyAlgorithm,
      prefix,
      "Argument 5",
    );
    extractable = webidl.converters.boolean(extractable, prefix, "Argument 6");
    keyUsages = webidl.converters["sequence<KeyUsage>"](
      keyUsages,
      prefix,
      "Argument 7",
    );

    // 2.
    wrappedKey = copyBuffer(wrappedKey);

    let normalizedAlgorithm;

    try {
      // 3.
      normalizedAlgorithm = normalizeAlgorithm(unwrapAlgorithm, "unwrapKey");
    } catch (_) {
      // 4.
      normalizedAlgorithm = normalizeAlgorithm(unwrapAlgorithm, "decrypt");
    }

    // 6.
    const normalizedKeyAlgorithm = normalizeAlgorithm(
      unwrappedKeyAlgorithm,
      "importKey",
    );

    // 11.
    if (normalizedAlgorithm.name !== unwrappingKey[_algorithm].name) {
      throw new DOMException(
        "Unwrapping algorithm does not match key algorithm",
        "InvalidAccessError",
      );
    }

    // 12.
    if (!ArrayPrototypeIncludes(unwrappingKey[_usages], "unwrapKey")) {
      throw new DOMException(
        "Key does not support the 'unwrapKey' operation",
        "InvalidAccessError",
      );
    }

    // 13.
    let key;
    if (
      supportedAlgorithms["unwrapKey"][normalizedAlgorithm.name] !== undefined
    ) {
      const handle = unwrappingKey[_handle];
      const keyData = WeakMapPrototypeGet(KEY_STORE, handle);

      switch (normalizedAlgorithm.name) {
        case "AES-KW": {
          const plainText = await op_crypto_unwrap_key({
            key: keyData,
            algorithm: normalizedAlgorithm.name,
          }, wrappedKey);

          // 4.
          key = TypedArrayPrototypeGetBuffer(plainText);
          break;
        }
        default: {
          throw new DOMException(
            "Not implemented",
            "NotSupportedError",
          );
        }
      }
    } else if (
      supportedAlgorithms["decrypt"][normalizedAlgorithm.name] !== undefined
    ) {
      // must construct a new key, since keyUsages is ["unwrapKey"] and not ["decrypt"]
      key = await this.decrypt(
        normalizedAlgorithm,
        constructKey(
          unwrappingKey[_type],
          unwrappingKey[_extractable],
          ["decrypt"],
          unwrappingKey[_algorithm],
          unwrappingKey[_handle],
        ),
        wrappedKey,
      );
    } else {
      throw new DOMException(
        "Algorithm not supported",
        "NotSupportedError",
      );
    }

    let bytes;
    // 14.
    if (format !== "jwk") {
      bytes = key;
    } else {
      const k = new Uint8Array(key);
      let str = "";
      for (let i = 0; i < k.length; i++) {
        str += StringFromCharCode(k[i]);
      }
      bytes = JSONParse(str);
    }

    // 15.
    const result = await this.importKey(
      format,
      bytes,
      normalizedKeyAlgorithm,
      extractable,
      keyUsages,
    );
    // 16.
    if (
      (result[_type] == "secret" || result[_type] == "private") &&
      keyUsages.length == 0
    ) {
      throw new SyntaxError("Invalid key type");
    }
    // 17.
    result[_extractable] = extractable;
    // 18.
    result[_usages] = usageIntersection(keyUsages, recognisedUsages);
    // 19.
    return result;
  }

  /**
   * @param {string} algorithm
   * @param {boolean} extractable
   * @param {KeyUsage[]} keyUsages
   * @returns {Promise<any>}
   */
  async generateKey(algorithm, extractable, keyUsages) {
    webidl.assertBranded(this, SubtleCryptoPrototype);
    const prefix = "Failed to execute 'generateKey' on 'SubtleCrypto'";
    webidl.requiredArguments(arguments.length, 3, prefix);
    algorithm = webidl.converters.AlgorithmIdentifier(
      algorithm,
      prefix,
      "Argument 1",
    );
    extractable = webidl.converters["boolean"](
      extractable,
      prefix,
      "Argument 2",
    );
    keyUsages = webidl.converters["sequence<KeyUsage>"](
      keyUsages,
      prefix,
      "Argument 3",
    );

    const usages = keyUsages;

    const normalizedAlgorithm = normalizeAlgorithm(algorithm, "generateKey");
    const result = await generateKey(
      normalizedAlgorithm,
      extractable,
      usages,
    );

    if (ObjectPrototypeIsPrototypeOf(CryptoKeyPrototype, result)) {
      const type = result[_type];
      if ((type === "secret" || type === "private") && usages.length === 0) {
        throw new DOMException("Invalid key usage", "SyntaxError");
      }
    } else if (
      ObjectPrototypeIsPrototypeOf(CryptoKeyPrototype, result.privateKey)
    ) {
      if (result.privateKey[_usages].length === 0) {
        throw new DOMException("Invalid key usage", "SyntaxError");
      }
    }

    return result;
  }

  [SymbolFor("Deno.privateCustomInspect")](inspect, inspectOptions) {
    return `${this.constructor.name} ${inspect({}, inspectOptions)}`;
  }
}
const SubtleCryptoPrototype = SubtleCrypto.prototype;

async function generateKey(normalizedAlgorithm, extractable, usages) {
  const algorithmName = normalizedAlgorithm.name;

  switch (algorithmName) {
    case "RSASSA-PKCS1-v1_5":
    case "RSA-PSS": {
      // 1.
      if (
        ArrayPrototypeFind(
          usages,
          (u) => !ArrayPrototypeIncludes(["sign", "verify"], u),
        ) !== undefined
      ) {
        throw new DOMException("Invalid key usage", "SyntaxError");
      }

      // 2.
      const keyData = await op_crypto_generate_key(
        {
          algorithm: "RSA",
          modulusLength: normalizedAlgorithm.modulusLength,
          publicExponent: normalizedAlgorithm.publicExponent,
        },
      );
      const handle = {};
      WeakMapPrototypeSet(KEY_STORE, handle, {
        type: "private",
        data: keyData,
      });

      // 4-8.
      const algorithm = {
        name: algorithmName,
        modulusLength: normalizedAlgorithm.modulusLength,
        publicExponent: normalizedAlgorithm.publicExponent,
        hash: normalizedAlgorithm.hash,
      };

      // 9-13.
      const publicKey = constructKey(
        "public",
        true,
        usageIntersection(usages, ["verify"]),
        algorithm,
        handle,
      );

      // 14-18.
      const privateKey = constructKey(
        "private",
        extractable,
        usageIntersection(usages, ["sign"]),
        algorithm,
        handle,
      );

      // 19-22.
      return { publicKey, privateKey };
    }
    case "RSA-OAEP": {
      if (
        ArrayPrototypeFind(
          usages,
          (u) =>
            !ArrayPrototypeIncludes([
              "encrypt",
              "decrypt",
              "wrapKey",
              "unwrapKey",
            ], u),
        ) !== undefined
      ) {
        throw new DOMException("Invalid key usage", "SyntaxError");
      }

      // 2.
      const keyData = await op_crypto_generate_key(
        {
          algorithm: "RSA",
          modulusLength: normalizedAlgorithm.modulusLength,
          publicExponent: normalizedAlgorithm.publicExponent,
        },
      );
      const handle = {};
      WeakMapPrototypeSet(KEY_STORE, handle, {
        type: "private",
        data: keyData,
      });

      // 4-8.
      const algorithm = {
        name: algorithmName,
        modulusLength: normalizedAlgorithm.modulusLength,
        publicExponent: normalizedAlgorithm.publicExponent,
        hash: normalizedAlgorithm.hash,
      };

      // 9-13.
      const publicKey = constructKey(
        "public",
        true,
        usageIntersection(usages, ["encrypt", "wrapKey"]),
        algorithm,
        handle,
      );

      // 14-18.
      const privateKey = constructKey(
        "private",
        extractable,
        usageIntersection(usages, ["decrypt", "unwrapKey"]),
        algorithm,
        handle,
      );

      // 19-22.
      return { publicKey, privateKey };
    }
    case "ECDSA": {
      const namedCurve = normalizedAlgorithm.namedCurve;

      // 1.
      if (
        ArrayPrototypeFind(
          usages,
          (u) => !ArrayPrototypeIncludes(["sign", "verify"], u),
        ) !== undefined
      ) {
        throw new DOMException("Invalid key usage", "SyntaxError");
      }

      // 2-3.
      const handle = {};
      if (
        ArrayPrototypeIncludes(
          supportedNamedCurves,
          namedCurve,
        )
      ) {
        const keyData = await op_crypto_generate_key({
          algorithm: "EC",
          namedCurve,
        });
        WeakMapPrototypeSet(KEY_STORE, handle, {
          type: "private",
          data: keyData,
        });
      } else {
        throw new DOMException("Curve not supported", "NotSupportedError");
      }

      // 4-6.
      const algorithm = {
        name: algorithmName,
        namedCurve,
      };

      // 7-11.
      const publicKey = constructKey(
        "public",
        true,
        usageIntersection(usages, ["verify"]),
        algorithm,
        handle,
      );

      // 12-16.
      const privateKey = constructKey(
        "private",
        extractable,
        usageIntersection(usages, ["sign"]),
        algorithm,
        handle,
      );

      // 17-20.
      return { publicKey, privateKey };
    }
    case "ECDH": {
      const namedCurve = normalizedAlgorithm.namedCurve;

      // 1.
      if (
        ArrayPrototypeFind(
          usages,
          (u) => !ArrayPrototypeIncludes(["deriveKey", "deriveBits"], u),
        ) !== undefined
      ) {
        throw new DOMException("Invalid key usage", "SyntaxError");
      }

      // 2-3.
      const handle = {};
      if (
        ArrayPrototypeIncludes(
          supportedNamedCurves,
          namedCurve,
        )
      ) {
        const keyData = await op_crypto_generate_key({
          algorithm: "EC",
          namedCurve,
        });
        WeakMapPrototypeSet(KEY_STORE, handle, {
          type: "private",
          data: keyData,
        });
      } else {
        throw new DOMException("Curve not supported", "NotSupportedError");
      }

      // 4-6.
      const algorithm = {
        name: algorithmName,
        namedCurve,
      };

      // 7-11.
      const publicKey = constructKey(
        "public",
        true,
        usageIntersection(usages, []),
        algorithm,
        handle,
      );

      // 12-16.
      const privateKey = constructKey(
        "private",
        extractable,
        usageIntersection(usages, ["deriveKey", "deriveBits"]),
        algorithm,
        handle,
      );

      // 17-20.
      return { publicKey, privateKey };
    }
    case "AES-CTR":
    case "AES-CBC":
    case "AES-GCM": {
      // 1.
      if (
        ArrayPrototypeFind(
          usages,
          (u) =>
            !ArrayPrototypeIncludes([
              "encrypt",
              "decrypt",
              "wrapKey",
              "unwrapKey",
            ], u),
        ) !== undefined
      ) {
        throw new DOMException("Invalid key usage", "SyntaxError");
      }

      return generateKeyAES(normalizedAlgorithm, extractable, usages);
    }
    case "AES-KW": {
      // 1.
      if (
        ArrayPrototypeFind(
          usages,
          (u) => !ArrayPrototypeIncludes(["wrapKey", "unwrapKey"], u),
        ) !== undefined
      ) {
        throw new DOMException("Invalid key usage", "SyntaxError");
      }

      return generateKeyAES(normalizedAlgorithm, extractable, usages);
    }
    case "X448": {
      if (
        ArrayPrototypeFind(
          usages,
          (u) => !ArrayPrototypeIncludes(["deriveKey", "deriveBits"], u),
        ) !== undefined
      ) {
        throw new DOMException("Invalid key usage", "SyntaxError");
      }
      const privateKeyData = new Uint8Array(56);
      const publicKeyData = new Uint8Array(56);

      op_crypto_generate_x448_keypair(privateKeyData, publicKeyData);

      const handle = {};
      WeakMapPrototypeSet(KEY_STORE, handle, privateKeyData);

      const publicHandle = {};
      WeakMapPrototypeSet(KEY_STORE, publicHandle, publicKeyData);

      const algorithm = {
        name: algorithmName,
      };

      const publicKey = constructKey(
        "public",
        true,
        usageIntersection(usages, []),
        algorithm,
        publicHandle,
      );

      const privateKey = constructKey(
        "private",
        extractable,
        usageIntersection(usages, ["deriveKey", "deriveBits"]),
        algorithm,
        handle,
      );

      return { publicKey, privateKey };
    }
    case "X25519": {
      if (
        ArrayPrototypeFind(
          usages,
          (u) => !ArrayPrototypeIncludes(["deriveKey", "deriveBits"], u),
        ) !== undefined
      ) {
        throw new DOMException("Invalid key usage", "SyntaxError");
      }
      const privateKeyData = new Uint8Array(32);
      const publicKeyData = new Uint8Array(32);
      op_crypto_generate_x25519_keypair(privateKeyData, publicKeyData);

      const handle = {};
      WeakMapPrototypeSet(KEY_STORE, handle, privateKeyData);

      const publicHandle = {};
      WeakMapPrototypeSet(KEY_STORE, publicHandle, publicKeyData);

      const algorithm = {
        name: algorithmName,
      };

      const publicKey = constructKey(
        "public",
        true,
        usageIntersection(usages, []),
        algorithm,
        publicHandle,
      );

      const privateKey = constructKey(
        "private",
        extractable,
        usageIntersection(usages, ["deriveKey", "deriveBits"]),
        algorithm,
        handle,
      );

      return { publicKey, privateKey };
    }
    case "Ed25519": {
      if (
        ArrayPrototypeFind(
          usages,
          (u) => !ArrayPrototypeIncludes(["sign", "verify"], u),
        ) !== undefined
      ) {
        throw new DOMException("Invalid key usage", "SyntaxError");
      }

      const ED25519_SEED_LEN = 32;
      const ED25519_PUBLIC_KEY_LEN = 32;
      const privateKeyData = new Uint8Array(ED25519_SEED_LEN);
      const publicKeyData = new Uint8Array(ED25519_PUBLIC_KEY_LEN);
      if (
        !op_crypto_generate_ed25519_keypair(privateKeyData, publicKeyData)
      ) {
        throw new DOMException("Failed to generate key", "OperationError");
      }

      const handle = {};
      WeakMapPrototypeSet(KEY_STORE, handle, privateKeyData);

      const publicHandle = {};
      WeakMapPrototypeSet(KEY_STORE, publicHandle, publicKeyData);

      const algorithm = {
        name: algorithmName,
      };

      const publicKey = constructKey(
        "public",
        true,
        usageIntersection(usages, ["verify"]),
        algorithm,
        publicHandle,
      );

      const privateKey = constructKey(
        "private",
        extractable,
        usageIntersection(usages, ["sign"]),
        algorithm,
        handle,
      );

      return { publicKey, privateKey };
    }
    case "HMAC": {
      // 1.
      if (
        ArrayPrototypeFind(
          usages,
          (u) => !ArrayPrototypeIncludes(["sign", "verify"], u),
        ) !== undefined
      ) {
        throw new DOMException("Invalid key usage", "SyntaxError");
      }

      // 2.
      let length;
      if (normalizedAlgorithm.length === undefined) {
        length = null;
      } else if (normalizedAlgorithm.length !== 0) {
        length = normalizedAlgorithm.length;
      } else {
        throw new DOMException("Invalid length", "OperationError");
      }

      // 3-4.
      const keyData = await op_crypto_generate_key({
        algorithm: "HMAC",
        hash: normalizedAlgorithm.hash.name,
        length,
      });
      const handle = {};
      WeakMapPrototypeSet(KEY_STORE, handle, {
        type: "secret",
        data: keyData,
      });

      // 6-10.
      const algorithm = {
        name: algorithmName,
        hash: {
          name: normalizedAlgorithm.hash.name,
        },
        length: TypedArrayPrototypeGetByteLength(keyData) * 8,
      };

      // 5, 11-13.
      const key = constructKey(
        "secret",
        extractable,
        usages,
        algorithm,
        handle,
      );

      // 14.
      return key;
    }
  }
}

function importKeyX448(
  format,
  keyData,
  extractable,
  keyUsages,
) {
  switch (format) {
    case "raw": {
      // 1.
      if (keyUsages.length > 0) {
        throw new DOMException("Invalid key usage", "SyntaxError");
      }

      if (TypedArrayPrototypeGetByteLength(keyData) !== 56) {
        throw new DOMException("Invalid key data", "DataError");
      }

      const handle = {};
      WeakMapPrototypeSet(KEY_STORE, handle, keyData);

      // 2-3.
      const algorithm = {
        name: "X448",
      };

      // 4-6.
      return constructKey(
        "public",
        extractable,
        [],
        algorithm,
        handle,
      );
    }
    case "spki": {
      // 1.
      if (keyUsages.length > 0) {
        throw new DOMException("Invalid key usage", "SyntaxError");
      }

      const publicKeyData = new Uint8Array(56);
      if (!op_crypto_import_spki_x448(keyData, publicKeyData)) {
        throw new DOMException("Invalid key data", "DataError");
      }

      const handle = {};
      WeakMapPrototypeSet(KEY_STORE, handle, publicKeyData);

      const algorithm = {
        name: "X448",
      };

      return constructKey(
        "public",
        extractable,
        [],
        algorithm,
        handle,
      );
    }
    case "pkcs8": {
      // 1.
      if (
        ArrayPrototypeFind(
          keyUsages,
          (u) => !ArrayPrototypeIncludes(["deriveKey", "deriveBits"], u),
        ) !== undefined
      ) {
        throw new DOMException("Invalid key usage", "SyntaxError");
      }

      const privateKeyData = new Uint8Array(32);
      if (!op_crypto_import_pkcs8_x448(keyData, privateKeyData)) {
        throw new DOMException("Invalid key data", "DataError");
      }

      const handle = {};
      WeakMapPrototypeSet(KEY_STORE, handle, privateKeyData);

      const algorithm = {
        name: "X448",
      };

      return constructKey(
        "private",
        extractable,
        usageIntersection(keyUsages, recognisedUsages),
        algorithm,
        handle,
      );
    }
    case "jwk": {
      // 1.
      const jwk = keyData;

      // 2.
      if (jwk.d !== undefined) {
        if (
          ArrayPrototypeFind(
            keyUsages,
            (u) =>
              !ArrayPrototypeIncludes(
                ["deriveKey", "deriveBits"],
                u,
              ),
          ) !== undefined
        ) {
          throw new DOMException("Invalid key usage", "SyntaxError");
        }
      }

      // 3.
      if (jwk.d === undefined && keyUsages.length > 0) {
        throw new DOMException("Invalid key usage", "SyntaxError");
      }

      // 4.
      if (jwk.kty !== "OKP") {
        throw new DOMException("Invalid key type", "DataError");
      }

      // 5.
      if (jwk.crv !== "X448") {
        throw new DOMException("Invalid curve", "DataError");
      }

      // 6.
      if (keyUsages.length > 0 && jwk.use !== undefined) {
        if (jwk.use !== "enc") {
          throw new DOMException("Invalid key use", "DataError");
        }
      }

      // 7.
      if (jwk.key_ops !== undefined) {
        if (
          ArrayPrototypeFind(
            jwk.key_ops,
            (u) => !ArrayPrototypeIncludes(recognisedUsages, u),
          ) !== undefined
        ) {
          throw new DOMException(
            "'key_ops' property of JsonWebKey is invalid",
            "DataError",
          );
        }

        if (
          !ArrayPrototypeEvery(
            jwk.key_ops,
            (u) => ArrayPrototypeIncludes(keyUsages, u),
          )
        ) {
          throw new DOMException(
            "'key_ops' property of JsonWebKey is invalid",
            "DataError",
          );
        }
      }

      // 8.
      if (jwk.ext !== undefined && jwk.ext === false && extractable) {
        throw new DOMException("Invalid key extractability", "DataError");
      }

      // 9.
      if (jwk.d !== undefined) {
        // https://www.rfc-editor.org/rfc/rfc8037#section-2
        let privateKeyData;
        try {
          privateKeyData = op_crypto_base64url_decode(jwk.d);
        } catch (_) {
          throw new DOMException("Invalid private key data", "DataError");
        }
        if (TypedArrayPrototypeGetByteLength(privateKeyData) !== 56) {
          throw new DOMException("Invalid private key data", "DataError");
        }

        const handle = {};
        WeakMapPrototypeSet(KEY_STORE, handle, privateKeyData);

        const algorithm = {
          name: "X448",
        };

        return constructKey(
          "private",
          extractable,
          usageIntersection(keyUsages, ["deriveKey", "deriveBits"]),
          algorithm,
          handle,
        );
      } else {
        // https://www.rfc-editor.org/rfc/rfc8037#section-2
        let publicKeyData;
        try {
          publicKeyData = op_crypto_base64url_decode(jwk.x);
        } catch (_) {
          throw new DOMException("Invalid public key data", "DataError");
        }
        if (TypedArrayPrototypeGetByteLength(publicKeyData) !== 56) {
          throw new DOMException("Invalid public key data", "DataError");
        }

        const handle = {};
        WeakMapPrototypeSet(KEY_STORE, handle, publicKeyData);

        const algorithm = {
          name: "X448",
        };

        return constructKey(
          "public",
          extractable,
          [],
          algorithm,
          handle,
        );
      }
    }
    default:
      throw new DOMException("Not implemented", "NotSupportedError");
  }
}

function importKeyEd25519(
  format,
  keyData,
  extractable,
  keyUsages,
) {
  switch (format) {
    case "raw": {
      // 1.
      if (
        ArrayPrototypeFind(
          keyUsages,
          (u) => !ArrayPrototypeIncludes(["verify"], u),
        ) !== undefined
      ) {
        throw new DOMException("Invalid key usage", "SyntaxError");
      }

      if (TypedArrayPrototypeGetByteLength(keyData) !== 32) {
        throw new DOMException("Invalid key data", "DataError");
      }

      const handle = {};
      WeakMapPrototypeSet(KEY_STORE, handle, keyData);

      // 2-3.
      const algorithm = {
        name: "Ed25519",
      };

      // 4-6.
      return constructKey(
        "public",
        extractable,
        usageIntersection(keyUsages, recognisedUsages),
        algorithm,
        handle,
      );
    }
    case "spki": {
      // 1.
      if (
        ArrayPrototypeFind(
          keyUsages,
          (u) => !ArrayPrototypeIncludes(["verify"], u),
        ) !== undefined
      ) {
        throw new DOMException("Invalid key usage", "SyntaxError");
      }

      const publicKeyData = new Uint8Array(32);
      if (!op_crypto_import_spki_ed25519(keyData, publicKeyData)) {
        throw new DOMException("Invalid key data", "DataError");
      }

      const handle = {};
      WeakMapPrototypeSet(KEY_STORE, handle, publicKeyData);

      const algorithm = {
        name: "Ed25519",
      };

      return constructKey(
        "public",
        extractable,
        usageIntersection(keyUsages, recognisedUsages),
        algorithm,
        handle,
      );
    }
    case "pkcs8": {
      // 1.
      if (
        ArrayPrototypeFind(
          keyUsages,
          (u) => !ArrayPrototypeIncludes(["sign"], u),
        ) !== undefined
      ) {
        throw new DOMException("Invalid key usage", "SyntaxError");
      }

      const privateKeyData = new Uint8Array(32);
      if (!op_crypto_import_pkcs8_ed25519(keyData, privateKeyData)) {
        throw new DOMException("Invalid key data", "DataError");
      }

      const handle = {};
      WeakMapPrototypeSet(KEY_STORE, handle, privateKeyData);

      const algorithm = {
        name: "Ed25519",
      };

      return constructKey(
        "private",
        extractable,
        usageIntersection(keyUsages, recognisedUsages),
        algorithm,
        handle,
      );
    }
    case "jwk": {
      // 1.
      const jwk = keyData;

      // 2.
      if (jwk.d !== undefined) {
        if (
          ArrayPrototypeFind(
            keyUsages,
            (u) =>
              !ArrayPrototypeIncludes(
                ["sign"],
                u,
              ),
          ) !== undefined
        ) {
          throw new DOMException("Invalid key usage", "SyntaxError");
        }
      } else {
        if (
          ArrayPrototypeFind(
            keyUsages,
            (u) =>
              !ArrayPrototypeIncludes(
                ["verify"],
                u,
              ),
          ) !== undefined
        ) {
          throw new DOMException("Invalid key usage", "SyntaxError");
        }
      }

      // 3.
      if (jwk.kty !== "OKP") {
        throw new DOMException("Invalid key type", "DataError");
      }

      // 4.
      if (jwk.crv !== "Ed25519") {
        throw new DOMException("Invalid curve", "DataError");
      }

      // 5.
      if (
        keyUsages.length > 0 && jwk.use !== undefined && jwk.use !== "sig"
      ) {
        throw new DOMException("Invalid key usage", "DataError");
      }

      // 6.
      if (jwk.key_ops !== undefined) {
        if (
          ArrayPrototypeFind(
            jwk.key_ops,
            (u) => !ArrayPrototypeIncludes(recognisedUsages, u),
          ) !== undefined
        ) {
          throw new DOMException(
            "'key_ops' property of JsonWebKey is invalid",
            "DataError",
          );
        }

        if (
          !ArrayPrototypeEvery(
            jwk.key_ops,
            (u) => ArrayPrototypeIncludes(keyUsages, u),
          )
        ) {
          throw new DOMException(
            "'key_ops' property of JsonWebKey is invalid",
            "DataError",
          );
        }
      }

      // 7.
      if (jwk.ext !== undefined && jwk.ext === false && extractable) {
        throw new DOMException("Invalid key extractability", "DataError");
      }

      // 8.
      if (jwk.d !== undefined) {
        // https://www.rfc-editor.org/rfc/rfc8037#section-2
        let privateKeyData;
        try {
          privateKeyData = op_crypto_base64url_decode(jwk.d);
        } catch (_) {
          throw new DOMException("Invalid private key data", "DataError");
        }
        if (TypedArrayPrototypeGetByteLength(privateKeyData) !== 32) {
          throw new DOMException("Invalid private key data", "DataError");
        }

        const handle = {};
        WeakMapPrototypeSet(KEY_STORE, handle, privateKeyData);

        const algorithm = {
          name: "Ed25519",
        };

        return constructKey(
          "private",
          extractable,
          usageIntersection(keyUsages, recognisedUsages),
          algorithm,
          handle,
        );
      } else {
        // https://www.rfc-editor.org/rfc/rfc8037#section-2
        let publicKeyData;
        try {
          publicKeyData = op_crypto_base64url_decode(jwk.x);
        } catch (_) {
          throw new DOMException("Invalid public key data", "DataError");
        }
        if (TypedArrayPrototypeGetByteLength(publicKeyData) !== 32) {
          throw new DOMException("Invalid public key data", "DataError");
        }

        const handle = {};
        WeakMapPrototypeSet(KEY_STORE, handle, publicKeyData);

        const algorithm = {
          name: "Ed25519",
        };

        return constructKey(
          "public",
          extractable,
          usageIntersection(keyUsages, recognisedUsages),
          algorithm,
          handle,
        );
      }
    }
    default:
      throw new DOMException("Not implemented", "NotSupportedError");
  }
}

function importKeyX25519(
  format,
  keyData,
  extractable,
  keyUsages,
) {
  switch (format) {
    case "raw": {
      // 1.
      if (keyUsages.length > 0) {
        throw new DOMException("Invalid key usage", "SyntaxError");
      }

      if (TypedArrayPrototypeGetByteLength(keyData) !== 32) {
        throw new DOMException("Invalid key data", "DataError");
      }

      const handle = {};
      WeakMapPrototypeSet(KEY_STORE, handle, keyData);

      // 2-3.
      const algorithm = {
        name: "X25519",
      };

      // 4-6.
      return constructKey(
        "public",
        extractable,
        [],
        algorithm,
        handle,
      );
    }
    case "spki": {
      // 1.
      if (keyUsages.length > 0) {
        throw new DOMException("Invalid key usage", "SyntaxError");
      }

      const publicKeyData = new Uint8Array(32);
      if (!op_crypto_import_spki_x25519(keyData, publicKeyData)) {
        throw new DOMException("Invalid key data", "DataError");
      }

      const handle = {};
      WeakMapPrototypeSet(KEY_STORE, handle, publicKeyData);

      const algorithm = {
        name: "X25519",
      };

      return constructKey(
        "public",
        extractable,
        [],
        algorithm,
        handle,
      );
    }
    case "pkcs8": {
      // 1.
      if (
        ArrayPrototypeFind(
          keyUsages,
          (u) => !ArrayPrototypeIncludes(["deriveKey", "deriveBits"], u),
        ) !== undefined
      ) {
        throw new DOMException("Invalid key usage", "SyntaxError");
      }

      const privateKeyData = new Uint8Array(32);
      if (!op_crypto_import_pkcs8_x25519(keyData, privateKeyData)) {
        throw new DOMException("Invalid key data", "DataError");
      }

      const handle = {};
      WeakMapPrototypeSet(KEY_STORE, handle, privateKeyData);

      const algorithm = {
        name: "X25519",
      };

      return constructKey(
        "private",
        extractable,
        usageIntersection(keyUsages, recognisedUsages),
        algorithm,
        handle,
      );
    }
    case "jwk": {
      // 1.
      const jwk = keyData;

      // 2.
      if (jwk.d !== undefined) {
        if (
          ArrayPrototypeFind(
            keyUsages,
            (u) =>
              !ArrayPrototypeIncludes(
                ["deriveKey", "deriveBits"],
                u,
              ),
          ) !== undefined
        ) {
          throw new DOMException("Invalid key usage", "SyntaxError");
        }
      }

      // 3.
      if (jwk.d === undefined && keyUsages.length > 0) {
        throw new DOMException("Invalid key usage", "SyntaxError");
      }

      // 4.
      if (jwk.kty !== "OKP") {
        throw new DOMException("Invalid key type", "DataError");
      }

      // 5.
      if (jwk.crv !== "X25519") {
        throw new DOMException("Invalid curve", "DataError");
      }

      // 6.
      if (keyUsages.length > 0 && jwk.use !== undefined) {
        if (jwk.use !== "enc") {
          throw new DOMException("Invalid key use", "DataError");
        }
      }

      // 7.
      if (jwk.key_ops !== undefined) {
        if (
          ArrayPrototypeFind(
            jwk.key_ops,
            (u) => !ArrayPrototypeIncludes(recognisedUsages, u),
          ) !== undefined
        ) {
          throw new DOMException(
            "'key_ops' property of JsonWebKey is invalid",
            "DataError",
          );
        }

        if (
          !ArrayPrototypeEvery(
            jwk.key_ops,
            (u) => ArrayPrototypeIncludes(keyUsages, u),
          )
        ) {
          throw new DOMException(
            "'key_ops' property of JsonWebKey is invalid",
            "DataError",
          );
        }
      }

      // 8.
      if (jwk.ext !== undefined && jwk.ext === false && extractable) {
        throw new DOMException("Invalid key extractability", "DataError");
      }

      // 9.
      if (jwk.d !== undefined) {
        // https://www.rfc-editor.org/rfc/rfc8037#section-2
        let privateKeyData;
        try {
          privateKeyData = op_crypto_base64url_decode(jwk.d);
        } catch (_) {
          throw new DOMException("Invalid private key data", "DataError");
        }
        if (TypedArrayPrototypeGetByteLength(privateKeyData) !== 32) {
          throw new DOMException("Invalid private key data", "DataError");
        }

        const handle = {};
        WeakMapPrototypeSet(KEY_STORE, handle, privateKeyData);

        const algorithm = {
          name: "X25519",
        };

        return constructKey(
          "private",
          extractable,
          usageIntersection(keyUsages, ["deriveKey", "deriveBits"]),
          algorithm,
          handle,
        );
      } else {
        // https://www.rfc-editor.org/rfc/rfc8037#section-2
        let publicKeyData;
        try {
          publicKeyData = op_crypto_base64url_decode(jwk.x);
        } catch (_) {
          throw new DOMException("Invalid public key data", "DataError");
        }
        if (TypedArrayPrototypeGetByteLength(publicKeyData) !== 32) {
          throw new DOMException("Invalid public key data", "DataError");
        }

        const handle = {};
        WeakMapPrototypeSet(KEY_STORE, handle, publicKeyData);

        const algorithm = {
          name: "X25519",
        };

        return constructKey(
          "public",
          extractable,
          [],
          algorithm,
          handle,
        );
      }
    }
    default:
      throw new DOMException("Not implemented", "NotSupportedError");
  }
}

function exportKeyAES(
  format,
  key,
  innerKey,
) {
  switch (format) {
    // 2.
    case "raw": {
      // 1.
      const data = innerKey.data;
      // 2.
      return TypedArrayPrototypeGetBuffer(data);
    }
    case "jwk": {
      // 1-2.
      const jwk = {
        kty: "oct",
      };

      // 3.
      const data = op_crypto_export_key({
        format: "jwksecret",
        algorithm: "AES",
      }, innerKey);
      ObjectAssign(jwk, data);

      // 4.
      const algorithm = key[_algorithm];
      switch (algorithm.length) {
        case 128:
          jwk.alg = aesJwkAlg[algorithm.name][128];
          break;
        case 192:
          jwk.alg = aesJwkAlg[algorithm.name][192];
          break;
        case 256:
          jwk.alg = aesJwkAlg[algorithm.name][256];
          break;
        default:
          throw new DOMException(
            `Invalid key length: ${algorithm.length}`,
            "NotSupportedError",
          );
      }

      // 5.
      jwk.key_ops = key.usages;

      // 6.
      jwk.ext = key[_extractable];

      // 7.
      return jwk;
    }
    default:
      throw new DOMException("Not implemented", "NotSupportedError");
  }
}

function importKeyAES(
  format,
  normalizedAlgorithm,
  keyData,
  extractable,
  keyUsages,
  supportedKeyUsages,
) {
  // 1.
  if (
    ArrayPrototypeFind(
      keyUsages,
      (u) => !ArrayPrototypeIncludes(supportedKeyUsages, u),
    ) !== undefined
  ) {
    throw new DOMException("Invalid key usage", "SyntaxError");
  }

  const algorithmName = normalizedAlgorithm.name;

  // 2.
  let data = keyData;

  switch (format) {
    case "raw": {
      // 2.
      if (
        !ArrayPrototypeIncludes(
          [128, 192, 256],
          TypedArrayPrototypeGetByteLength(keyData) * 8,
        )
      ) {
        throw new DOMException("Invalid key length", "DataError");
      }

      break;
    }
    case "jwk": {
      // 1.
      const jwk = keyData;

      // 2.
      if (jwk.kty !== "oct") {
        throw new DOMException(
          "'kty' property of JsonWebKey must be 'oct'",
          "DataError",
        );
      }

      // Section 6.4.1 of RFC7518
      if (jwk.k === undefined) {
        throw new DOMException(
          "'k' property of JsonWebKey must be present",
          "DataError",
        );
      }

      // 4.
      const { rawData } = op_crypto_import_key(
        { algorithm: "AES" },
        { jwkSecret: jwk },
      );
      data = rawData.data;

      // 5.
      switch (TypedArrayPrototypeGetByteLength(data) * 8) {
        case 128:
          if (
            jwk.alg !== undefined &&
            jwk.alg !== aesJwkAlg[algorithmName][128]
          ) {
            throw new DOMException(
              `Invalid algorithm: ${jwk.alg}`,
              "DataError",
            );
          }
          break;
        case 192:
          if (
            jwk.alg !== undefined &&
            jwk.alg !== aesJwkAlg[algorithmName][192]
          ) {
            throw new DOMException(
              `Invalid algorithm: ${jwk.alg}`,
              "DataError",
            );
          }
          break;
        case 256:
          if (
            jwk.alg !== undefined &&
            jwk.alg !== aesJwkAlg[algorithmName][256]
          ) {
            throw new DOMException(
              `Invalid algorithm: ${jwk.alg}`,
              "DataError",
            );
          }
          break;
        default:
          throw new DOMException(
            "Invalid key length",
            "DataError",
          );
      }

      // 6.
      if (
        keyUsages.length > 0 && jwk.use !== undefined && jwk.use !== "enc"
      ) {
        throw new DOMException("Invalid key usage", "DataError");
      }

      // 7.
      // Section 4.3 of RFC7517
      if (jwk.key_ops !== undefined) {
        if (
          ArrayPrototypeFind(
            jwk.key_ops,
            (u) => !ArrayPrototypeIncludes(recognisedUsages, u),
          ) !== undefined
        ) {
          throw new DOMException(
            "'key_ops' property of JsonWebKey is invalid",
            "DataError",
          );
        }

        if (
          !ArrayPrototypeEvery(
            jwk.key_ops,
            (u) => ArrayPrototypeIncludes(keyUsages, u),
          )
        ) {
          throw new DOMException(
            "'key_ops' property of JsonWebKey is invalid",
            "DataError",
          );
        }
      }

      // 8.
      if (jwk.ext === false && extractable === true) {
        throw new DOMException(
          "'ext' property of JsonWebKey must not be false if extractable is true",
          "DataError",
        );
      }

      break;
    }
    default:
      throw new DOMException("Not implemented", "NotSupportedError");
  }

  const handle = {};
  WeakMapPrototypeSet(KEY_STORE, handle, {
    type: "secret",
    data,
  });

  // 4-7.
  const algorithm = {
    name: algorithmName,
    length: TypedArrayPrototypeGetByteLength(data) * 8,
  };

  const key = constructKey(
    "secret",
    extractable,
    usageIntersection(keyUsages, recognisedUsages),
    algorithm,
    handle,
  );

  // 8.
  return key;
}

function importKeyHMAC(
  format,
  normalizedAlgorithm,
  keyData,
  extractable,
  keyUsages,
) {
  // 2.
  if (
    ArrayPrototypeFind(
      keyUsages,
      (u) => !ArrayPrototypeIncludes(["sign", "verify"], u),
    ) !== undefined
  ) {
    throw new DOMException("Invalid key usage", "SyntaxError");
  }

  // 3.
  let hash;
  let data;

  // 4. https://w3c.github.io/webcrypto/#hmac-operations
  switch (format) {
    case "raw": {
      data = keyData;
      hash = normalizedAlgorithm.hash;
      break;
    }
    case "jwk": {
      const jwk = keyData;

      // 2.
      if (jwk.kty !== "oct") {
        throw new DOMException(
          "'kty' property of JsonWebKey must be 'oct'",
          "DataError",
        );
      }

      // Section 6.4.1 of RFC7518
      if (jwk.k === undefined) {
        throw new DOMException(
          "'k' property of JsonWebKey must be present",
          "DataError",
        );
      }

      // 4.
      const { rawData } = op_crypto_import_key(
        { algorithm: "HMAC" },
        { jwkSecret: jwk },
      );
      data = rawData.data;

      // 5.
      hash = normalizedAlgorithm.hash;

      // 6.
      switch (hash.name) {
        case "SHA-1": {
          if (jwk.alg !== undefined && jwk.alg !== "HS1") {
            throw new DOMException(
              "'alg' property of JsonWebKey must be 'HS1'",
              "DataError",
            );
          }
          break;
        }
        case "SHA-256": {
          if (jwk.alg !== undefined && jwk.alg !== "HS256") {
            throw new DOMException(
              "'alg' property of JsonWebKey must be 'HS256'",
              "DataError",
            );
          }
          break;
        }
        case "SHA-384": {
          if (jwk.alg !== undefined && jwk.alg !== "HS384") {
            throw new DOMException(
              "'alg' property of JsonWebKey must be 'HS384'",
              "DataError",
            );
          }
          break;
        }
        case "SHA-512": {
          if (jwk.alg !== undefined && jwk.alg !== "HS512") {
            throw new DOMException(
              "'alg' property of JsonWebKey must be 'HS512'",
              "DataError",
            );
          }
          break;
        }
        default:
          throw new TypeError("Unreachable");
      }

      // 7.
      if (
        keyUsages.length > 0 && jwk.use !== undefined && jwk.use !== "sig"
      ) {
        throw new DOMException(
          "'use' property of JsonWebKey must be 'sig'",
          "DataError",
        );
      }

      // 8.
      // Section 4.3 of RFC7517
      if (jwk.key_ops !== undefined) {
        if (
          ArrayPrototypeFind(
            jwk.key_ops,
            (u) => !ArrayPrototypeIncludes(recognisedUsages, u),
          ) !== undefined
        ) {
          throw new DOMException(
            "'key_ops' property of JsonWebKey is invalid",
            "DataError",
          );
        }

        if (
          !ArrayPrototypeEvery(
            jwk.key_ops,
            (u) => ArrayPrototypeIncludes(keyUsages, u),
          )
        ) {
          throw new DOMException(
            "'key_ops' property of JsonWebKey is invalid",
            "DataError",
          );
        }
      }

      // 9.
      if (jwk.ext === false && extractable === true) {
        throw new DOMException(
          "'ext' property of JsonWebKey must not be false if extractable is true",
          "DataError",
        );
      }

      break;
    }
    default:
      throw new DOMException("Not implemented", "NotSupportedError");
  }

  // 5.
  let length = TypedArrayPrototypeGetByteLength(data) * 8;
  // 6.
  if (length === 0) {
    throw new DOMException("Key length is zero", "DataError");
  }
  // 7.
  if (normalizedAlgorithm.length !== undefined) {
    if (
      normalizedAlgorithm.length > length ||
      normalizedAlgorithm.length <= (length - 8)
    ) {
      throw new DOMException(
        "Key length is invalid",
        "DataError",
      );
    }
    length = normalizedAlgorithm.length;
  }

  const handle = {};
  WeakMapPrototypeSet(KEY_STORE, handle, {
    type: "secret",
    data,
  });

  const algorithm = {
    name: "HMAC",
    length,
    hash,
  };

  const key = constructKey(
    "secret",
    extractable,
    usageIntersection(keyUsages, recognisedUsages),
    algorithm,
    handle,
  );

  return key;
}

function importKeyEC(
  format,
  normalizedAlgorithm,
  keyData,
  extractable,
  keyUsages,
) {
  const supportedUsages = SUPPORTED_KEY_USAGES[normalizedAlgorithm.name];

  switch (format) {
    case "raw": {
      // 1.
      if (
        !ArrayPrototypeIncludes(
          supportedNamedCurves,
          normalizedAlgorithm.namedCurve,
        )
      ) {
        throw new DOMException(
          "Invalid namedCurve",
          "DataError",
        );
      }

      // 2.
      if (
        ArrayPrototypeFind(
          keyUsages,
          (u) =>
            !ArrayPrototypeIncludes(
              SUPPORTED_KEY_USAGES[normalizedAlgorithm.name].public,
              u,
            ),
        ) !== undefined
      ) {
        throw new DOMException("Invalid key usage", "SyntaxError");
      }

      // 3.
      const { rawData } = op_crypto_import_key({
        algorithm: normalizedAlgorithm.name,
        namedCurve: normalizedAlgorithm.namedCurve,
      }, { raw: keyData });

      const handle = {};
      WeakMapPrototypeSet(KEY_STORE, handle, rawData);

      // 4-5.
      const algorithm = {
        name: normalizedAlgorithm.name,
        namedCurve: normalizedAlgorithm.namedCurve,
      };

      // 6-8.
      const key = constructKey(
        "public",
        extractable,
        usageIntersection(keyUsages, recognisedUsages),
        algorithm,
        handle,
      );

      return key;
    }
    case "pkcs8": {
      // 1.
      if (
        ArrayPrototypeFind(
          keyUsages,
          (u) =>
            !ArrayPrototypeIncludes(
              SUPPORTED_KEY_USAGES[normalizedAlgorithm.name].private,
              u,
            ),
        ) !== undefined
      ) {
        throw new DOMException("Invalid key usage", "SyntaxError");
      }

      // 2-9.
      const { rawData } = op_crypto_import_key({
        algorithm: normalizedAlgorithm.name,
        namedCurve: normalizedAlgorithm.namedCurve,
      }, { pkcs8: keyData });

      const handle = {};
      WeakMapPrototypeSet(KEY_STORE, handle, rawData);

      const algorithm = {
        name: normalizedAlgorithm.name,
        namedCurve: normalizedAlgorithm.namedCurve,
      };

      const key = constructKey(
        "private",
        extractable,
        usageIntersection(keyUsages, recognisedUsages),
        algorithm,
        handle,
      );

      return key;
    }
    case "spki": {
      // 1.
      if (normalizedAlgorithm.name == "ECDSA") {
        if (
          ArrayPrototypeFind(
            keyUsages,
            (u) =>
              !ArrayPrototypeIncludes(
                SUPPORTED_KEY_USAGES[normalizedAlgorithm.name].public,
                u,
              ),
          ) !== undefined
        ) {
          throw new DOMException("Invalid key usage", "SyntaxError");
        }
      } else if (keyUsages.length != 0) {
        throw new DOMException("Key usage must be empty", "SyntaxError");
      }

      // 2-12
      const { rawData } = op_crypto_import_key({
        algorithm: normalizedAlgorithm.name,
        namedCurve: normalizedAlgorithm.namedCurve,
      }, { spki: keyData });

      const handle = {};
      WeakMapPrototypeSet(KEY_STORE, handle, rawData);

      const algorithm = {
        name: normalizedAlgorithm.name,
        namedCurve: normalizedAlgorithm.namedCurve,
      };

      // 6-8.
      const key = constructKey(
        "public",
        extractable,
        usageIntersection(keyUsages, recognisedUsages),
        algorithm,
        handle,
      );

      return key;
    }
    case "jwk": {
      const jwk = keyData;

      const keyType = (jwk.d !== undefined) ? "private" : "public";

      // 2.
      if (
        ArrayPrototypeFind(
          keyUsages,
          (u) => !ArrayPrototypeIncludes(supportedUsages[keyType], u),
        ) !== undefined
      ) {
        throw new DOMException("Invalid key usage", "SyntaxError");
      }

      // 3.
      if (jwk.kty !== "EC") {
        throw new DOMException(
          "'kty' property of JsonWebKey must be 'EC'",
          "DataError",
        );
      }

      // 4.
      if (
        keyUsages.length > 0 && jwk.use !== undefined &&
        jwk.use !== supportedUsages.jwkUse
      ) {
        throw new DOMException(
          `'use' property of JsonWebKey must be '${supportedUsages.jwkUse}'`,
          "DataError",
        );
      }

      // 5.
      // Section 4.3 of RFC7517
      if (jwk.key_ops !== undefined) {
        if (
          ArrayPrototypeFind(
            jwk.key_ops,
            (u) => !ArrayPrototypeIncludes(recognisedUsages, u),
          ) !== undefined
        ) {
          throw new DOMException(
            "'key_ops' member of JsonWebKey is invalid",
            "DataError",
          );
        }

        if (
          !ArrayPrototypeEvery(
            jwk.key_ops,
            (u) => ArrayPrototypeIncludes(keyUsages, u),
          )
        ) {
          throw new DOMException(
            "'key_ops' member of JsonWebKey is invalid",
            "DataError",
          );
        }
      }

      // 6.
      if (jwk.ext === false && extractable === true) {
        throw new DOMException(
          "'ext' property of JsonWebKey must not be false if extractable is true",
          "DataError",
        );
      }

      // 9.
      if (jwk.alg !== undefined && normalizedAlgorithm.name == "ECDSA") {
        let algNamedCurve;

        switch (jwk.alg) {
          case "ES256": {
            algNamedCurve = "P-256";
            break;
          }
          case "ES384": {
            algNamedCurve = "P-384";
            break;
          }
          case "ES512": {
            algNamedCurve = "P-521";
            break;
          }
          default:
            throw new DOMException(
              "Curve algorithm not supported",
              "DataError",
            );
        }

        if (algNamedCurve) {
          if (algNamedCurve !== normalizedAlgorithm.namedCurve) {
            throw new DOMException(
              "Mismatched curve algorithm",
              "DataError",
            );
          }
        }
      }

      // Validate that this is a valid public key.
      if (jwk.x === undefined) {
        throw new DOMException(
          "'x' property of JsonWebKey is required for EC keys",
          "DataError",
        );
      }
      if (jwk.y === undefined) {
        throw new DOMException(
          "'y' property of JsonWebKey is required for EC keys",
          "DataError",
        );
      }

      if (jwk.d !== undefined) {
        // it's also a Private key
        const { rawData } = op_crypto_import_key({
          algorithm: normalizedAlgorithm.name,
          namedCurve: normalizedAlgorithm.namedCurve,
        }, { jwkPrivateEc: jwk });

        const handle = {};
        WeakMapPrototypeSet(KEY_STORE, handle, rawData);

        const algorithm = {
          name: normalizedAlgorithm.name,
          namedCurve: normalizedAlgorithm.namedCurve,
        };

        const key = constructKey(
          "private",
          extractable,
          usageIntersection(keyUsages, recognisedUsages),
          algorithm,
          handle,
        );

        return key;
      } else {
        const { rawData } = op_crypto_import_key({
          algorithm: normalizedAlgorithm.name,
          namedCurve: normalizedAlgorithm.namedCurve,
        }, { jwkPublicEc: jwk });

        const handle = {};
        WeakMapPrototypeSet(KEY_STORE, handle, rawData);

        const algorithm = {
          name: normalizedAlgorithm.name,
          namedCurve: normalizedAlgorithm.namedCurve,
        };

        const key = constructKey(
          "public",
          extractable,
          usageIntersection(keyUsages, recognisedUsages),
          algorithm,
          handle,
        );

        return key;
      }
    }
    default:
      throw new DOMException("Not implemented", "NotSupportedError");
  }
}

// deno-lint-ignore require-await
async function importKeyInner(
  format,
  normalizedAlgorithm,
  keyData,
  extractable,
  keyUsages,
) {
  const algorithmName = normalizedAlgorithm.name;

  switch (algorithmName) {
    case "HMAC": {
      return importKeyHMAC(
        format,
        normalizedAlgorithm,
        keyData,
        extractable,
        keyUsages,
      );
    }
    case "ECDH":
    case "ECDSA": {
      return importKeyEC(
        format,
        normalizedAlgorithm,
        keyData,
        extractable,
        keyUsages,
      );
    }
    case "RSASSA-PKCS1-v1_5":
    case "RSA-PSS":
    case "RSA-OAEP": {
      return importKeyRSA(
        format,
        normalizedAlgorithm,
        keyData,
        extractable,
        keyUsages,
      );
    }
    case "HKDF": {
      return importKeyHKDF(format, keyData, extractable, keyUsages);
    }
    case "PBKDF2": {
      return importKeyPBKDF2(format, keyData, extractable, keyUsages);
    }
    case "AES-CTR":
    case "AES-CBC":
    case "AES-GCM": {
      return importKeyAES(
        format,
        normalizedAlgorithm,
        keyData,
        extractable,
        keyUsages,
        ["encrypt", "decrypt", "wrapKey", "unwrapKey"],
      );
    }
    case "AES-KW": {
      return importKeyAES(
        format,
        normalizedAlgorithm,
        keyData,
        extractable,
        keyUsages,
        ["wrapKey", "unwrapKey"],
      );
    }
    case "X448": {
      return importKeyX448(
        format,
        keyData,
        extractable,
        keyUsages,
      );
    }
    case "X25519": {
      return importKeyX25519(
        format,
        keyData,
        extractable,
        keyUsages,
      );
    }
    case "Ed25519": {
      return importKeyEd25519(
        format,
        keyData,
        extractable,
        keyUsages,
      );
    }
    default:
      throw new DOMException("Not implemented", "NotSupportedError");
  }
}

const SUPPORTED_KEY_USAGES = {
  "RSASSA-PKCS1-v1_5": {
    public: ["verify"],
    private: ["sign"],
    jwkUse: "sig",
  },
  "RSA-PSS": {
    public: ["verify"],
    private: ["sign"],
    jwkUse: "sig",
  },
  "RSA-OAEP": {
    public: ["encrypt", "wrapKey"],
    private: ["decrypt", "unwrapKey"],
    jwkUse: "enc",
  },
  "ECDSA": {
    public: ["verify"],
    private: ["sign"],
    jwkUse: "sig",
  },
  "ECDH": {
    public: [],
    private: ["deriveKey", "deriveBits"],
    jwkUse: "enc",
  },
};

function importKeyRSA(
  format,
  normalizedAlgorithm,
  keyData,
  extractable,
  keyUsages,
) {
  switch (format) {
    case "pkcs8": {
      // 1.
      if (
        ArrayPrototypeFind(
          keyUsages,
          (u) =>
            !ArrayPrototypeIncludes(
              SUPPORTED_KEY_USAGES[normalizedAlgorithm.name].private,
              u,
            ),
        ) !== undefined
      ) {
        throw new DOMException("Invalid key usage", "SyntaxError");
      }

      // 2-9.
      const { modulusLength, publicExponent, rawData } = op_crypto_import_key(
        {
          algorithm: normalizedAlgorithm.name,
          // Needed to perform step 7 without normalization.
          hash: normalizedAlgorithm.hash.name,
        },
        { pkcs8: keyData },
      );

      const handle = {};
      WeakMapPrototypeSet(KEY_STORE, handle, rawData);

      const algorithm = {
        name: normalizedAlgorithm.name,
        modulusLength,
        publicExponent,
        hash: normalizedAlgorithm.hash,
      };

      const key = constructKey(
        "private",
        extractable,
        usageIntersection(keyUsages, recognisedUsages),
        algorithm,
        handle,
      );

      return key;
    }
    case "spki": {
      // 1.
      if (
        ArrayPrototypeFind(
          keyUsages,
          (u) =>
            !ArrayPrototypeIncludes(
              SUPPORTED_KEY_USAGES[normalizedAlgorithm.name].public,
              u,
            ),
        ) !== undefined
      ) {
        throw new DOMException("Invalid key usage", "SyntaxError");
      }

      // 2-9.
      const { modulusLength, publicExponent, rawData } = op_crypto_import_key(
        {
          algorithm: normalizedAlgorithm.name,
          // Needed to perform step 7 without normalization.
          hash: normalizedAlgorithm.hash.name,
        },
        { spki: keyData },
      );

      const handle = {};
      WeakMapPrototypeSet(KEY_STORE, handle, rawData);

      const algorithm = {
        name: normalizedAlgorithm.name,
        modulusLength,
        publicExponent,
        hash: normalizedAlgorithm.hash,
      };

      const key = constructKey(
        "public",
        extractable,
        usageIntersection(keyUsages, recognisedUsages),
        algorithm,
        handle,
      );

      return key;
    }
    case "jwk": {
      // 1.
      const jwk = keyData;

      // 2.
      if (jwk.d !== undefined) {
        if (
          ArrayPrototypeFind(
            keyUsages,
            (u) =>
              !ArrayPrototypeIncludes(
                SUPPORTED_KEY_USAGES[normalizedAlgorithm.name].private,
                u,
              ),
          ) !== undefined
        ) {
          throw new DOMException("Invalid key usage", "SyntaxError");
        }
      } else if (
        ArrayPrototypeFind(
          keyUsages,
          (u) =>
            !ArrayPrototypeIncludes(
              SUPPORTED_KEY_USAGES[normalizedAlgorithm.name].public,
              u,
            ),
        ) !== undefined
      ) {
        throw new DOMException("Invalid key usage", "SyntaxError");
      }

      // 3.
      if (StringPrototypeToUpperCase(jwk.kty) !== "RSA") {
        throw new DOMException(
          "'kty' property of JsonWebKey must be 'RSA'",
          "DataError",
        );
      }

      // 4.
      if (
        keyUsages.length > 0 && jwk.use !== undefined &&
        StringPrototypeToLowerCase(jwk.use) !==
          SUPPORTED_KEY_USAGES[normalizedAlgorithm.name].jwkUse
      ) {
        throw new DOMException(
          `'use' property of JsonWebKey must be '${
            SUPPORTED_KEY_USAGES[normalizedAlgorithm.name].jwkUse
          }'`,
          "DataError",
        );
      }

      // 5.
      if (jwk.key_ops !== undefined) {
        if (
          ArrayPrototypeFind(
            jwk.key_ops,
            (u) => !ArrayPrototypeIncludes(recognisedUsages, u),
          ) !== undefined
        ) {
          throw new DOMException(
            "'key_ops' property of JsonWebKey is invalid",
            "DataError",
          );
        }

        if (
          !ArrayPrototypeEvery(
            jwk.key_ops,
            (u) => ArrayPrototypeIncludes(keyUsages, u),
          )
        ) {
          throw new DOMException(
            "'key_ops' property of JsonWebKey is invalid",
            "DataError",
          );
        }
      }

      if (jwk.ext === false && extractable === true) {
        throw new DOMException(
          "'ext' property of JsonWebKey must not be false if extractable is true",
          "DataError",
        );
      }

      // 7.
      let hash;

      // 8.
      if (normalizedAlgorithm.name === "RSASSA-PKCS1-v1_5") {
        switch (jwk.alg) {
          case undefined:
            hash = undefined;
            break;
          case "RS1":
            hash = "SHA-1";
            break;
          case "RS256":
            hash = "SHA-256";
            break;
          case "RS384":
            hash = "SHA-384";
            break;
          case "RS512":
            hash = "SHA-512";
            break;
          default:
            throw new DOMException(
              `'alg' property of JsonWebKey must be one of 'RS1', 'RS256', 'RS384', 'RS512': received ${jwk.alg}`,
              "DataError",
            );
        }
      } else if (normalizedAlgorithm.name === "RSA-PSS") {
        switch (jwk.alg) {
          case undefined:
            hash = undefined;
            break;
          case "PS1":
            hash = "SHA-1";
            break;
          case "PS256":
            hash = "SHA-256";
            break;
          case "PS384":
            hash = "SHA-384";
            break;
          case "PS512":
            hash = "SHA-512";
            break;
          default:
            throw new DOMException(
              `'alg' property of JsonWebKey must be one of 'PS1', 'PS256', 'PS384', 'PS512': received ${jwk.alg}`,
              "DataError",
            );
        }
      } else {
        switch (jwk.alg) {
          case undefined:
            hash = undefined;
            break;
          case "RSA-OAEP":
            hash = "SHA-1";
            break;
          case "RSA-OAEP-256":
            hash = "SHA-256";
            break;
          case "RSA-OAEP-384":
            hash = "SHA-384";
            break;
          case "RSA-OAEP-512":
            hash = "SHA-512";
            break;
          default:
            throw new DOMException(
              `'alg' property of JsonWebKey must be one of 'RSA-OAEP', 'RSA-OAEP-256', 'RSA-OAEP-384', or 'RSA-OAEP-512': received ${jwk.alg}`,
              "DataError",
            );
        }
      }

      // 9.
      if (hash !== undefined) {
        // 9.1.
        const normalizedHash = normalizeAlgorithm(hash, "digest");

        // 9.2.
        if (normalizedHash.name !== normalizedAlgorithm.hash.name) {
          throw new DOMException(
            `'alg' property of JsonWebKey must be '${normalizedAlgorithm.name}': received ${jwk.alg}`,
            "DataError",
          );
        }
      }

      // 10.
      if (jwk.d !== undefined) {
        // Private key
        const optimizationsPresent = jwk.p !== undefined ||
          jwk.q !== undefined || jwk.dp !== undefined ||
          jwk.dq !== undefined || jwk.qi !== undefined;
        if (optimizationsPresent) {
          if (jwk.q === undefined) {
            throw new DOMException(
              "'q' property of JsonWebKey is required for private keys",
              "DataError",
            );
          }
          if (jwk.dp === undefined) {
            throw new DOMException(
              "'dp' property of JsonWebKey is required for private keys",
              "DataError",
            );
          }
          if (jwk.dq === undefined) {
            throw new DOMException(
              "'dq' property of JsonWebKey is required for private keys",
              "DataError",
            );
          }
          if (jwk.qi === undefined) {
            throw new DOMException(
              "'qi' property of JsonWebKey is required for private keys",
              "DataError",
            );
          }
          if (jwk.oth !== undefined) {
            throw new DOMException(
              "'oth' property of JsonWebKey is not supported",
              "NotSupportedError",
            );
          }
        } else {
          throw new DOMException(
            "Only optimized private keys are supported",
            "NotSupportedError",
          );
        }

        const { modulusLength, publicExponent, rawData } = op_crypto_import_key(
          {
            algorithm: normalizedAlgorithm.name,
            hash: normalizedAlgorithm.hash.name,
          },
          { jwkPrivateRsa: jwk },
        );

        const handle = {};
        WeakMapPrototypeSet(KEY_STORE, handle, rawData);

        const algorithm = {
          name: normalizedAlgorithm.name,
          modulusLength,
          publicExponent,
          hash: normalizedAlgorithm.hash,
        };

        const key = constructKey(
          "private",
          extractable,
          usageIntersection(keyUsages, recognisedUsages),
          algorithm,
          handle,
        );

        return key;
      } else {
        // Validate that this is a valid public key.
        if (jwk.n === undefined) {
          throw new DOMException(
            "'n' property of JsonWebKey is required for public keys",
            "DataError",
          );
        }
        if (jwk.e === undefined) {
          throw new DOMException(
            "'e' property of JsonWebKey is required for public keys",
            "DataError",
          );
        }

        const { modulusLength, publicExponent, rawData } = op_crypto_import_key(
          {
            algorithm: normalizedAlgorithm.name,
            hash: normalizedAlgorithm.hash.name,
          },
          { jwkPublicRsa: jwk },
        );

        const handle = {};
        WeakMapPrototypeSet(KEY_STORE, handle, rawData);

        const algorithm = {
          name: normalizedAlgorithm.name,
          modulusLength,
          publicExponent,
          hash: normalizedAlgorithm.hash,
        };

        const key = constructKey(
          "public",
          extractable,
          usageIntersection(keyUsages, recognisedUsages),
          algorithm,
          handle,
        );

        return key;
      }
    }
    default:
      throw new DOMException("Not implemented", "NotSupportedError");
  }
}

function importKeyHKDF(
  format,
  keyData,
  extractable,
  keyUsages,
) {
  if (format !== "raw") {
    throw new DOMException("Format not supported", "NotSupportedError");
  }

  // 1.
  if (
    ArrayPrototypeFind(
      keyUsages,
      (u) => !ArrayPrototypeIncludes(["deriveKey", "deriveBits"], u),
    ) !== undefined
  ) {
    throw new DOMException("Invalid key usage", "SyntaxError");
  }

  // 2.
  if (extractable !== false) {
    throw new DOMException(
      "Key must not be extractable",
      "SyntaxError",
    );
  }

  // 3.
  const handle = {};
  WeakMapPrototypeSet(KEY_STORE, handle, {
    type: "secret",
    data: keyData,
  });

  // 4-8.
  const algorithm = {
    name: "HKDF",
  };
  const key = constructKey(
    "secret",
    false,
    usageIntersection(keyUsages, recognisedUsages),
    algorithm,
    handle,
  );

  // 9.
  return key;
}

function importKeyPBKDF2(
  format,
  keyData,
  extractable,
  keyUsages,
) {
  // 1.
  if (format !== "raw") {
    throw new DOMException("Format not supported", "NotSupportedError");
  }

  // 2.
  if (
    ArrayPrototypeFind(
      keyUsages,
      (u) => !ArrayPrototypeIncludes(["deriveKey", "deriveBits"], u),
    ) !== undefined
  ) {
    throw new DOMException("Invalid key usage", "SyntaxError");
  }

  // 3.
  if (extractable !== false) {
    throw new DOMException(
      "Key must not be extractable",
      "SyntaxError",
    );
  }

  // 4.
  const handle = {};
  WeakMapPrototypeSet(KEY_STORE, handle, {
    type: "secret",
    data: keyData,
  });

  // 5-9.
  const algorithm = {
    name: "PBKDF2",
  };
  const key = constructKey(
    "secret",
    false,
    usageIntersection(keyUsages, recognisedUsages),
    algorithm,
    handle,
  );

  // 10.
  return key;
}

function exportKeyHMAC(format, key, innerKey) {
  // 1.
  if (innerKey == null) {
    throw new DOMException("Key is not available", "OperationError");
  }

  switch (format) {
    // 3.
    case "raw": {
      const bits = innerKey.data;
      // TODO(petamoriken): Uint8Array does not have push method
      // for (let _i = 7 & (8 - bits.length % 8); _i > 0; _i--) {
      //   bits.push(0);
      // }
      // 4-5.
      return TypedArrayPrototypeGetBuffer(bits);
    }
    case "jwk": {
      // 1-2.
      const jwk = {
        kty: "oct",
      };

      // 3.
      const data = op_crypto_export_key({
        format: "jwksecret",
        algorithm: key[_algorithm].name,
      }, innerKey);
      jwk.k = data.k;

      // 4.
      const algorithm = key[_algorithm];
      // 5.
      const hash = algorithm.hash;
      // 6.
      switch (hash.name) {
        case "SHA-1":
          jwk.alg = "HS1";
          break;
        case "SHA-256":
          jwk.alg = "HS256";
          break;
        case "SHA-384":
          jwk.alg = "HS384";
          break;
        case "SHA-512":
          jwk.alg = "HS512";
          break;
        default:
          throw new DOMException(
            "Hash algorithm not supported",
            "NotSupportedError",
          );
      }
      // 7.
      jwk.key_ops = key.usages;
      // 8.
      jwk.ext = key[_extractable];
      // 9.
      return jwk;
    }
    default:
      throw new DOMException("Not implemented", "NotSupportedError");
  }
}

function exportKeyRSA(format, key, innerKey) {
  switch (format) {
    case "pkcs8": {
      // 1.
      if (key[_type] !== "private") {
        throw new DOMException(
          "Key is not a private key",
          "InvalidAccessError",
        );
      }

      // 2.
      const data = op_crypto_export_key({
        algorithm: key[_algorithm].name,
        format: "pkcs8",
      }, innerKey);

      // 3.
      return TypedArrayPrototypeGetBuffer(data);
    }
    case "spki": {
      // 1.
      if (key[_type] !== "public") {
        throw new DOMException(
          "Key is not a public key",
          "InvalidAccessError",
        );
      }

      // 2.
      const data = op_crypto_export_key({
        algorithm: key[_algorithm].name,
        format: "spki",
      }, innerKey);

      // 3.
      return TypedArrayPrototypeGetBuffer(data);
    }
    case "jwk": {
      // 1-2.
      const jwk = {
        kty: "RSA",
      };

      // 3.
      const hash = key[_algorithm].hash.name;

      // 4.
      if (key[_algorithm].name === "RSASSA-PKCS1-v1_5") {
        switch (hash) {
          case "SHA-1":
            jwk.alg = "RS1";
            break;
          case "SHA-256":
            jwk.alg = "RS256";
            break;
          case "SHA-384":
            jwk.alg = "RS384";
            break;
          case "SHA-512":
            jwk.alg = "RS512";
            break;
          default:
            throw new DOMException(
              "Hash algorithm not supported",
              "NotSupportedError",
            );
        }
      } else if (key[_algorithm].name === "RSA-PSS") {
        switch (hash) {
          case "SHA-1":
            jwk.alg = "PS1";
            break;
          case "SHA-256":
            jwk.alg = "PS256";
            break;
          case "SHA-384":
            jwk.alg = "PS384";
            break;
          case "SHA-512":
            jwk.alg = "PS512";
            break;
          default:
            throw new DOMException(
              "Hash algorithm not supported",
              "NotSupportedError",
            );
        }
      } else {
        switch (hash) {
          case "SHA-1":
            jwk.alg = "RSA-OAEP";
            break;
          case "SHA-256":
            jwk.alg = "RSA-OAEP-256";
            break;
          case "SHA-384":
            jwk.alg = "RSA-OAEP-384";
            break;
          case "SHA-512":
            jwk.alg = "RSA-OAEP-512";
            break;
          default:
            throw new DOMException(
              "Hash algorithm not supported",
              "NotSupportedError",
            );
        }
      }

      // 5-6.
      const data = op_crypto_export_key({
        format: key[_type] === "private" ? "jwkprivate" : "jwkpublic",
        algorithm: key[_algorithm].name,
      }, innerKey);
      ObjectAssign(jwk, data);

      // 7.
      jwk.key_ops = key.usages;

      // 8.
      jwk.ext = key[_extractable];

      return jwk;
    }
    default:
      throw new DOMException("Not implemented", "NotSupportedError");
  }
}

function exportKeyEd25519(format, key, innerKey) {
  switch (format) {
    case "raw": {
      // 1.
      if (key[_type] !== "public") {
        throw new DOMException(
          "Key is not a public key",
          "InvalidAccessError",
        );
      }

      // 2-3.
      return TypedArrayPrototypeGetBuffer(innerKey);
    }
    case "spki": {
      // 1.
      if (key[_type] !== "public") {
        throw new DOMException(
          "Key is not a public key",
          "InvalidAccessError",
        );
      }

      const spkiDer = op_crypto_export_spki_ed25519(innerKey);
      return TypedArrayPrototypeGetBuffer(spkiDer);
    }
    case "pkcs8": {
      // 1.
      if (key[_type] !== "private") {
        throw new DOMException(
          "Key is not a public key",
          "InvalidAccessError",
        );
      }

      const pkcs8Der = op_crypto_export_pkcs8_ed25519(
        new Uint8Array([0x04, 0x22, ...new SafeArrayIterator(innerKey)]),
      );
      pkcs8Der[15] = 0x20;
      return TypedArrayPrototypeGetBuffer(pkcs8Der);
    }
    case "jwk": {
      const x = key[_type] === "private"
        ? op_crypto_jwk_x_ed25519(innerKey)
        : op_crypto_base64url_encode(innerKey);
      const jwk = {
        kty: "OKP",
        crv: "Ed25519",
        x,
        "key_ops": key.usages,
        ext: key[_extractable],
      };
      if (key[_type] === "private") {
        jwk.d = op_crypto_base64url_encode(innerKey);
      }
      return jwk;
    }
    default:
      throw new DOMException("Not implemented", "NotSupportedError");
  }
}

function exportKeyX448(format, key, innerKey) {
  switch (format) {
    case "raw": {
      // 1.
      if (key[_type] !== "public") {
        throw new DOMException(
          "Key is not a public key",
          "InvalidAccessError",
        );
      }

      // 2-3.
      return TypedArrayPrototypeGetBuffer(innerKey);
    }
    case "spki": {
      // 1.
      if (key[_type] !== "public") {
        throw new DOMException(
          "Key is not a public key",
          "InvalidAccessError",
        );
      }

      const spkiDer = op_crypto_export_spki_x448(innerKey);
      return TypedArrayPrototypeGetBuffer(spkiDer);
    }
    case "pkcs8": {
      // 1.
      if (key[_type] !== "private") {
        throw new DOMException(
          "Key is not a private key",
          "InvalidAccessError",
        );
      }

      const pkcs8Der = op_crypto_export_pkcs8_x448(
        new Uint8Array([0x04, 0x22, ...new SafeArrayIterator(innerKey)]),
      );
      pkcs8Der[15] = 0x20;
      return TypedArrayPrototypeGetBuffer(pkcs8Der);
    }
    case "jwk": {
      if (key[_type] === "private") {
        throw new DOMException("Not implemented", "NotSupportedError");
      }
      const x = op_crypto_base64url_encode(innerKey);
      const jwk = {
        kty: "OKP",
        crv: "X448",
        x,
        "key_ops": key.usages,
        ext: key[_extractable],
      };
      return jwk;
    }
    default:
      throw new DOMException("Not implemented", "NotSupportedError");
  }
}

function exportKeyX25519(format, key, innerKey) {
  switch (format) {
    case "raw": {
      // 1.
      if (key[_type] !== "public") {
        throw new DOMException(
          "Key is not a public key",
          "InvalidAccessError",
        );
      }

      // 2-3.
      return TypedArrayPrototypeGetBuffer(innerKey);
    }
    case "spki": {
      // 1.
      if (key[_type] !== "public") {
        throw new DOMException(
          "Key is not a public key",
          "InvalidAccessError",
        );
      }

      const spkiDer = op_crypto_export_spki_x25519(innerKey);
      return TypedArrayPrototypeGetBuffer(spkiDer);
    }
    case "pkcs8": {
      // 1.
      if (key[_type] !== "private") {
        throw new DOMException(
          "Key is not a public key",
          "InvalidAccessError",
        );
      }

      const pkcs8Der = op_crypto_export_pkcs8_x25519(
        new Uint8Array([0x04, 0x22, ...new SafeArrayIterator(innerKey)]),
      );
      pkcs8Der[15] = 0x20;
      return TypedArrayPrototypeGetBuffer(pkcs8Der);
    }
    case "jwk": {
      if (key[_type] === "private") {
        throw new DOMException("Not implemented", "NotSupportedError");
      }
      const x = op_crypto_base64url_encode(innerKey);
      const jwk = {
        kty: "OKP",
        crv: "X25519",
        x,
        "key_ops": key.usages,
        ext: key[_extractable],
      };
      return jwk;
    }
    default:
      throw new DOMException("Not implemented", "NotSupportedError");
  }
}

function exportKeyEC(format, key, innerKey) {
  switch (format) {
    case "raw": {
      // 1.
      if (key[_type] !== "public") {
        throw new DOMException(
          "Key is not a public key",
          "InvalidAccessError",
        );
      }

      // 2.
      const data = op_crypto_export_key({
        algorithm: key[_algorithm].name,
        namedCurve: key[_algorithm].namedCurve,
        format: "raw",
      }, innerKey);

      return TypedArrayPrototypeGetBuffer(data);
    }
    case "pkcs8": {
      // 1.
      if (key[_type] !== "private") {
        throw new DOMException(
          "Key is not a private key",
          "InvalidAccessError",
        );
      }

      // 2.
      const data = op_crypto_export_key({
        algorithm: key[_algorithm].name,
        namedCurve: key[_algorithm].namedCurve,
        format: "pkcs8",
      }, innerKey);

      return TypedArrayPrototypeGetBuffer(data);
    }
    case "spki": {
      // 1.
      if (key[_type] !== "public") {
        throw new DOMException(
          "Key is not a public key",
          "InvalidAccessError",
        );
      }

      // 2.
      const data = op_crypto_export_key({
        algorithm: key[_algorithm].name,
        namedCurve: key[_algorithm].namedCurve,
        format: "spki",
      }, innerKey);

      return TypedArrayPrototypeGetBuffer(data);
    }
    case "jwk": {
      if (key[_algorithm].name == "ECDSA") {
        // 1-2.
        const jwk = {
          kty: "EC",
        };

        // 3.1
        jwk.crv = key[_algorithm].namedCurve;

        // Missing from spec
        let algNamedCurve;

        switch (key[_algorithm].namedCurve) {
          case "P-256": {
            algNamedCurve = "ES256";
            break;
          }
          case "P-384": {
            algNamedCurve = "ES384";
            break;
          }
          case "P-521": {
            algNamedCurve = "ES512";
            break;
          }
          default:
            throw new DOMException(
              "Curve algorithm not supported",
              "DataError",
            );
        }

        jwk.alg = algNamedCurve;

        // 3.2 - 3.4.
        const data = op_crypto_export_key({
          format: key[_type] === "private" ? "jwkprivate" : "jwkpublic",
          algorithm: key[_algorithm].name,
          namedCurve: key[_algorithm].namedCurve,
        }, innerKey);
        ObjectAssign(jwk, data);

        // 4.
        jwk.key_ops = key.usages;

        // 5.
        jwk.ext = key[_extractable];

        return jwk;
      } else { // ECDH
        // 1-2.
        const jwk = {
          kty: "EC",
        };

        // missing step from spec
        jwk.alg = "ECDH";

        // 3.1
        jwk.crv = key[_algorithm].namedCurve;

        // 3.2 - 3.4
        const data = op_crypto_export_key({
          format: key[_type] === "private" ? "jwkprivate" : "jwkpublic",
          algorithm: key[_algorithm].name,
          namedCurve: key[_algorithm].namedCurve,
        }, innerKey);
        ObjectAssign(jwk, data);

        // 4.
        jwk.key_ops = key.usages;

        // 5.
        jwk.ext = key[_extractable];

        return jwk;
      }
    }
    default:
      throw new DOMException("Not implemented", "NotSupportedError");
  }
}

async function generateKeyAES(normalizedAlgorithm, extractable, usages) {
  const algorithmName = normalizedAlgorithm.name;

  // 2.
  if (!ArrayPrototypeIncludes([128, 192, 256], normalizedAlgorithm.length)) {
    throw new DOMException(
      `Invalid key length: ${normalizedAlgorithm.length}`,
      "OperationError",
    );
  }

  // 3.
  const keyData = await op_crypto_generate_key({
    algorithm: "AES",
    length: normalizedAlgorithm.length,
  });
  const handle = {};
  WeakMapPrototypeSet(KEY_STORE, handle, {
    type: "secret",
    data: keyData,
  });

  // 6-8.
  const algorithm = {
    name: algorithmName,
    length: normalizedAlgorithm.length,
  };

  // 9-11.
  const key = constructKey(
    "secret",
    extractable,
    usages,
    algorithm,
    handle,
  );

  // 12.
  return key;
}

async function deriveBits(normalizedAlgorithm, baseKey, length) {
  switch (normalizedAlgorithm.name) {
    case "PBKDF2": {
      // 1.
      if (length == null || length == 0 || length % 8 !== 0) {
        throw new DOMException("Invalid length", "OperationError");
      }

      if (normalizedAlgorithm.iterations == 0) {
        throw new DOMException(
          "iterations must not be zero",
          "OperationError",
        );
      }

      const handle = baseKey[_handle];
      const keyData = WeakMapPrototypeGet(KEY_STORE, handle);

      normalizedAlgorithm.salt = copyBuffer(normalizedAlgorithm.salt);

      const buf = await op_crypto_derive_bits({
        key: keyData,
        algorithm: "PBKDF2",
        hash: normalizedAlgorithm.hash.name,
        iterations: normalizedAlgorithm.iterations,
        length,
      }, normalizedAlgorithm.salt);

      return TypedArrayPrototypeGetBuffer(buf);
    }
    case "ECDH": {
      // 1.
      if (baseKey[_type] !== "private") {
        throw new DOMException("Invalid key type", "InvalidAccessError");
      }
      // 2.
      const publicKey = normalizedAlgorithm.public;
      // 3.
      if (publicKey[_type] !== "public") {
        throw new DOMException("Invalid key type", "InvalidAccessError");
      }
      // 4.
      if (publicKey[_algorithm].name !== baseKey[_algorithm].name) {
        throw new DOMException(
          "Algorithm mismatch",
          "InvalidAccessError",
        );
      }
      // 5.
      if (
        publicKey[_algorithm].namedCurve !== baseKey[_algorithm].namedCurve
      ) {
        throw new DOMException(
          "'namedCurve' mismatch",
          "InvalidAccessError",
        );
      }
      // 6.
      if (
        ArrayPrototypeIncludes(
          supportedNamedCurves,
          publicKey[_algorithm].namedCurve,
        )
      ) {
        const baseKeyhandle = baseKey[_handle];
        const baseKeyData = WeakMapPrototypeGet(KEY_STORE, baseKeyhandle);
        const publicKeyhandle = publicKey[_handle];
        const publicKeyData = WeakMapPrototypeGet(KEY_STORE, publicKeyhandle);

        const buf = await op_crypto_derive_bits({
          key: baseKeyData,
          publicKey: publicKeyData,
          algorithm: "ECDH",
          namedCurve: publicKey[_algorithm].namedCurve,
          length: length ?? 0,
        });

        // 8.
        if (length === null) {
          return TypedArrayPrototypeGetBuffer(buf);
        } else if (TypedArrayPrototypeGetByteLength(buf) * 8 < length) {
          throw new DOMException("Invalid length", "OperationError");
        } else {
          return ArrayBufferPrototypeSlice(
            TypedArrayPrototypeGetBuffer(buf),
            0,
            MathCeil(length / 8),
          );
        }
      } else {
        throw new DOMException("Not implemented", "NotSupportedError");
      }
    }
    case "HKDF": {
      // 1.
      if (length === null || length === 0 || length % 8 !== 0) {
        throw new DOMException("Invalid length", "OperationError");
      }

      const handle = baseKey[_handle];
      const keyDerivationKey = WeakMapPrototypeGet(KEY_STORE, handle);

      normalizedAlgorithm.salt = copyBuffer(normalizedAlgorithm.salt);

      normalizedAlgorithm.info = copyBuffer(normalizedAlgorithm.info);

      const buf = await op_crypto_derive_bits({
        key: keyDerivationKey,
        algorithm: "HKDF",
        hash: normalizedAlgorithm.hash.name,
        info: normalizedAlgorithm.info,
        length,
      }, normalizedAlgorithm.salt);

      return TypedArrayPrototypeGetBuffer(buf);
    }
    case "X448": {
      // 1.
      if (baseKey[_type] !== "private") {
        throw new DOMException("Invalid key type", "InvalidAccessError");
      }
      // 2.
      const publicKey = normalizedAlgorithm.public;
      // 3.
      if (publicKey[_type] !== "public") {
        throw new DOMException("Invalid key type", "InvalidAccessError");
      }
      // 4.
      if (publicKey[_algorithm].name !== baseKey[_algorithm].name) {
        throw new DOMException(
          "Algorithm mismatch",
          "InvalidAccessError",
        );
      }

      // 5.
      const kHandle = baseKey[_handle];
      const k = WeakMapPrototypeGet(KEY_STORE, kHandle);

      const uHandle = publicKey[_handle];
      const u = WeakMapPrototypeGet(KEY_STORE, uHandle);

      const secret = new Uint8Array(56);
      const isIdentity = op_crypto_derive_bits_x448(k, u, secret);

      // 6.
      if (isIdentity) {
        throw new DOMException("Invalid key", "OperationError");
      }

      // 7.
      if (length === null) {
        return TypedArrayPrototypeGetBuffer(secret);
      } else if (
        TypedArrayPrototypeGetByteLength(secret) * 8 < length
      ) {
        throw new DOMException("Invalid length", "OperationError");
      } else {
        return ArrayBufferPrototypeSlice(
          TypedArrayPrototypeGetBuffer(secret),
          0,
          MathCeil(length / 8),
        );
      }
    }
    case "X25519": {
      // 1.
      if (baseKey[_type] !== "private") {
        throw new DOMException("Invalid key type", "InvalidAccessError");
      }
      // 2.
      const publicKey = normalizedAlgorithm.public;
      // 3.
      if (publicKey[_type] !== "public") {
        throw new DOMException("Invalid key type", "InvalidAccessError");
      }
      // 4.
      if (publicKey[_algorithm].name !== baseKey[_algorithm].name) {
        throw new DOMException(
          "Algorithm mismatch",
          "InvalidAccessError",
        );
      }

      // 5.
      const kHandle = baseKey[_handle];
      const k = WeakMapPrototypeGet(KEY_STORE, kHandle);

      const uHandle = publicKey[_handle];
      const u = WeakMapPrototypeGet(KEY_STORE, uHandle);

      const secret = new Uint8Array(32);
      const isIdentity = op_crypto_derive_bits_x25519(k, u, secret);

      // 6.
      if (isIdentity) {
        throw new DOMException("Invalid key", "OperationError");
      }

      // 7.
      if (length === null) {
        return TypedArrayPrototypeGetBuffer(secret);
      } else if (
        TypedArrayPrototypeGetByteLength(secret) * 8 < length
      ) {
        throw new DOMException("Invalid length", "OperationError");
      } else {
        return ArrayBufferPrototypeSlice(
          TypedArrayPrototypeGetBuffer(secret),
          0,
          MathCeil(length / 8),
        );
      }
    }
    default:
      throw new DOMException("Not implemented", "NotSupportedError");
  }
}

async function encrypt(normalizedAlgorithm, key, data) {
  const handle = key[_handle];
  const keyData = WeakMapPrototypeGet(KEY_STORE, handle);

  switch (normalizedAlgorithm.name) {
    case "RSA-OAEP": {
      // 1.
      if (key[_type] !== "public") {
        throw new DOMException(
          "Key type not supported",
          "InvalidAccessError",
        );
      }

      // 2.
      if (normalizedAlgorithm.label) {
        normalizedAlgorithm.label = copyBuffer(normalizedAlgorithm.label);
      } else {
        normalizedAlgorithm.label = new Uint8Array();
      }

      // 3-5.
      const hashAlgorithm = key[_algorithm].hash.name;
      const cipherText = await op_crypto_encrypt({
        key: keyData,
        algorithm: "RSA-OAEP",
        hash: hashAlgorithm,
        label: normalizedAlgorithm.label,
      }, data);

      // 6.
      return TypedArrayPrototypeGetBuffer(cipherText);
    }
    case "AES-CBC": {
      normalizedAlgorithm.iv = copyBuffer(normalizedAlgorithm.iv);

      // 1.
      if (TypedArrayPrototypeGetByteLength(normalizedAlgorithm.iv) !== 16) {
        throw new DOMException(
          "Initialization vector must be 16 bytes",
          "OperationError",
        );
      }

      // 2.
      const cipherText = await op_crypto_encrypt({
        key: keyData,
        algorithm: "AES-CBC",
        length: key[_algorithm].length,
        iv: normalizedAlgorithm.iv,
      }, data);

      // 4.
      return TypedArrayPrototypeGetBuffer(cipherText);
    }
    case "AES-CTR": {
      normalizedAlgorithm.counter = copyBuffer(normalizedAlgorithm.counter);

      // 1.
      if (
        TypedArrayPrototypeGetByteLength(normalizedAlgorithm.counter) !== 16
      ) {
        throw new DOMException(
          "Counter vector must be 16 bytes",
          "OperationError",
        );
      }

      // 2.
      if (
        normalizedAlgorithm.length == 0 || normalizedAlgorithm.length > 128
      ) {
        throw new DOMException(
          "Counter length must not be 0 or greater than 128",
          "OperationError",
        );
      }

      // 3.
      const cipherText = await op_crypto_encrypt({
        key: keyData,
        algorithm: "AES-CTR",
        keyLength: key[_algorithm].length,
        counter: normalizedAlgorithm.counter,
        ctrLength: normalizedAlgorithm.length,
      }, data);

      // 4.
      return TypedArrayPrototypeGetBuffer(cipherText);
    }
    case "AES-GCM": {
      normalizedAlgorithm.iv = copyBuffer(normalizedAlgorithm.iv);

      // 1.
      if (TypedArrayPrototypeGetByteLength(data) > (2 ** 39) - 256) {
        throw new DOMException(
          "Plaintext too large",
          "OperationError",
        );
      }

      // 2.
      // We only support 96-bit and 128-bit nonce.
      if (
        ArrayPrototypeIncludes(
          [12, 16],
          TypedArrayPrototypeGetByteLength(normalizedAlgorithm.iv),
        ) === undefined
      ) {
        throw new DOMException(
          "Initialization vector length not supported",
          "NotSupportedError",
        );
      }

      // 3.
      // NOTE: over the size of Number.MAX_SAFE_INTEGER is not available in V8
      // if (normalizedAlgorithm.additionalData !== undefined) {
      //   if (normalizedAlgorithm.additionalData.byteLength > (2 ** 64) - 1) {
      //     throw new DOMException(
      //       "Additional data too large",
      //       "OperationError",
      //     );
      //   }
      // }

      // 4.
      if (normalizedAlgorithm.tagLength == undefined) {
        normalizedAlgorithm.tagLength = 128;
      } else if (
        !ArrayPrototypeIncludes(
          [32, 64, 96, 104, 112, 120, 128],
          normalizedAlgorithm.tagLength,
        )
      ) {
        throw new DOMException(
          `Invalid tag length: ${normalizedAlgorithm.tagLength}`,
          "OperationError",
        );
      }
      // 5.
      if (normalizedAlgorithm.additionalData) {
        normalizedAlgorithm.additionalData = copyBuffer(
          normalizedAlgorithm.additionalData,
        );
      }
      // 6-7.
      const cipherText = await op_crypto_encrypt({
        key: keyData,
        algorithm: "AES-GCM",
        length: key[_algorithm].length,
        iv: normalizedAlgorithm.iv,
        additionalData: normalizedAlgorithm.additionalData || null,
        tagLength: normalizedAlgorithm.tagLength,
      }, data);

      // 8.
      return TypedArrayPrototypeGetBuffer(cipherText);
    }
    default:
      throw new DOMException("Not implemented", "NotSupportedError");
  }
}

webidl.configureInterface(SubtleCrypto);
const subtle = webidl.createBranded(SubtleCrypto);

class Crypto {
  constructor() {
    webidl.illegalConstructor();
  }

  getRandomValues(typedArray) {
    webidl.assertBranded(this, CryptoPrototype);
    const prefix = "Failed to execute 'getRandomValues' on 'Crypto'";
    webidl.requiredArguments(arguments.length, 1, prefix);
    // Fast path for Uint8Array
    const tag = TypedArrayPrototypeGetSymbolToStringTag(typedArray);
    if (tag === "Uint8Array") {
      op_crypto_get_random_values(typedArray);
      return typedArray;
    }
    typedArray = webidl.converters.ArrayBufferView(
      typedArray,
      prefix,
      "Argument 1",
    );
    switch (tag) {
      case "Int8Array":
      case "Uint8ClampedArray":
      case "Int16Array":
      case "Uint16Array":
      case "Int32Array":
      case "Uint32Array":
      case "BigInt64Array":
      case "BigUint64Array":
        break;
      default:
        throw new DOMException(
          "The provided ArrayBufferView is not an integer array type",
          "TypeMismatchError",
        );
    }
    const ui8 = new Uint8Array(
      TypedArrayPrototypeGetBuffer(typedArray),
      TypedArrayPrototypeGetByteOffset(typedArray),
      TypedArrayPrototypeGetByteLength(typedArray),
    );
    op_crypto_get_random_values(ui8);
    return typedArray;
  }

  randomUUID() {
    webidl.assertBranded(this, CryptoPrototype);
    return op_crypto_random_uuid();
  }

  get subtle() {
    webidl.assertBranded(this, CryptoPrototype);
    return subtle;
  }

  [SymbolFor("Deno.privateCustomInspect")](inspect, inspectOptions) {
    return inspect(
      createFilteredInspectProxy({
        object: this,
        evaluate: ObjectPrototypeIsPrototypeOf(CryptoPrototype, this),
        keys: ["subtle"],
      }),
      inspectOptions,
    );
  }
}

webidl.configureInterface(Crypto);
const CryptoPrototype = Crypto.prototype;

const crypto = webidl.createBranded(Crypto);

webidl.converters.AlgorithmIdentifier = (V, prefix, context, opts) => {
  // Union for (object or DOMString)
  if (webidl.type(V) == "Object") {
    return webidl.converters.object(V, prefix, context, opts);
  }
  return webidl.converters.DOMString(V, prefix, context, opts);
};

webidl.converters["BufferSource or JsonWebKey"] = (
  V,
  prefix,
  context,
  opts,
) => {
  // Union for (BufferSource or JsonWebKey)
  if (ArrayBufferIsView(V) || isArrayBuffer(V)) {
    return webidl.converters.BufferSource(V, prefix, context, opts);
  }
  return webidl.converters.JsonWebKey(V, prefix, context, opts);
};

webidl.converters.KeyType = webidl.createEnumConverter("KeyType", [
  "public",
  "private",
  "secret",
]);

webidl.converters.KeyFormat = webidl.createEnumConverter("KeyFormat", [
  "raw",
  "pkcs8",
  "spki",
  "jwk",
]);

webidl.converters.KeyUsage = webidl.createEnumConverter("KeyUsage", [
  "encrypt",
  "decrypt",
  "sign",
  "verify",
  "deriveKey",
  "deriveBits",
  "wrapKey",
  "unwrapKey",
]);

webidl.converters["sequence<KeyUsage>"] = webidl.createSequenceConverter(
  webidl.converters.KeyUsage,
);

webidl.converters.HashAlgorithmIdentifier =
  webidl.converters.AlgorithmIdentifier;

/** @type {webidl.Dictionary} */
const dictAlgorithm = [{
  key: "name",
  converter: webidl.converters.DOMString,
  required: true,
}];

webidl.converters.Algorithm = webidl
  .createDictionaryConverter("Algorithm", dictAlgorithm);

webidl.converters.BigInteger = webidl.converters.Uint8Array;

/** @type {webidl.Dictionary} */
const dictRsaKeyGenParams = [
  ...new SafeArrayIterator(dictAlgorithm),
  {
    key: "modulusLength",
    converter: (V, prefix, context, opts) =>
      webidl.converters["unsigned long"](V, prefix, context, {
        ...opts,
        enforceRange: true,
      }),
    required: true,
  },
  {
    key: "publicExponent",
    converter: webidl.converters.BigInteger,
    required: true,
  },
];

webidl.converters.RsaKeyGenParams = webidl
  .createDictionaryConverter("RsaKeyGenParams", dictRsaKeyGenParams);

const dictRsaHashedKeyGenParams = [
  ...new SafeArrayIterator(dictRsaKeyGenParams),
  {
    key: "hash",
    converter: webidl.converters.HashAlgorithmIdentifier,
    required: true,
  },
];

webidl.converters.RsaHashedKeyGenParams = webidl.createDictionaryConverter(
  "RsaHashedKeyGenParams",
  dictRsaHashedKeyGenParams,
);

const dictRsaHashedImportParams = [
  ...new SafeArrayIterator(dictAlgorithm),
  {
    key: "hash",
    converter: webidl.converters.HashAlgorithmIdentifier,
    required: true,
  },
];

webidl.converters.RsaHashedImportParams = webidl.createDictionaryConverter(
  "RsaHashedImportParams",
  dictRsaHashedImportParams,
);

webidl.converters.NamedCurve = webidl.converters.DOMString;

const dictEcKeyImportParams = [
  ...new SafeArrayIterator(dictAlgorithm),
  {
    key: "namedCurve",
    converter: webidl.converters.NamedCurve,
    required: true,
  },
];

webidl.converters.EcKeyImportParams = webidl.createDictionaryConverter(
  "EcKeyImportParams",
  dictEcKeyImportParams,
);

const dictEcKeyGenParams = [
  ...new SafeArrayIterator(dictAlgorithm),
  {
    key: "namedCurve",
    converter: webidl.converters.NamedCurve,
    required: true,
  },
];

webidl.converters.EcKeyGenParams = webidl
  .createDictionaryConverter("EcKeyGenParams", dictEcKeyGenParams);

const dictAesKeyGenParams = [
  ...new SafeArrayIterator(dictAlgorithm),
  {
    key: "length",
    converter: (V, prefix, context, opts) =>
      webidl.converters["unsigned short"](V, prefix, context, {
        ...opts,
        enforceRange: true,
      }),
    required: true,
  },
];

webidl.converters.AesKeyGenParams = webidl
  .createDictionaryConverter("AesKeyGenParams", dictAesKeyGenParams);

const dictHmacKeyGenParams = [
  ...new SafeArrayIterator(dictAlgorithm),
  {
    key: "hash",
    converter: webidl.converters.HashAlgorithmIdentifier,
    required: true,
  },
  {
    key: "length",
    converter: (V, prefix, context, opts) =>
      webidl.converters["unsigned long"](V, prefix, context, {
        ...opts,
        enforceRange: true,
      }),
  },
];

webidl.converters.HmacKeyGenParams = webidl
  .createDictionaryConverter("HmacKeyGenParams", dictHmacKeyGenParams);

const dictRsaPssParams = [
  ...new SafeArrayIterator(dictAlgorithm),
  {
    key: "saltLength",
    converter: (V, prefix, context, opts) =>
      webidl.converters["unsigned long"](V, prefix, context, {
        ...opts,
        enforceRange: true,
      }),
    required: true,
  },
];

webidl.converters.RsaPssParams = webidl
  .createDictionaryConverter("RsaPssParams", dictRsaPssParams);

const dictRsaOaepParams = [
  ...new SafeArrayIterator(dictAlgorithm),
  {
    key: "label",
    converter: webidl.converters["BufferSource"],
  },
];

webidl.converters.RsaOaepParams = webidl
  .createDictionaryConverter("RsaOaepParams", dictRsaOaepParams);

const dictEcdsaParams = [
  ...new SafeArrayIterator(dictAlgorithm),
  {
    key: "hash",
    converter: webidl.converters.HashAlgorithmIdentifier,
    required: true,
  },
];

webidl.converters["EcdsaParams"] = webidl
  .createDictionaryConverter("EcdsaParams", dictEcdsaParams);

const dictHmacImportParams = [
  ...new SafeArrayIterator(dictAlgorithm),
  {
    key: "hash",
    converter: webidl.converters.HashAlgorithmIdentifier,
    required: true,
  },
  {
    key: "length",
    converter: (V, prefix, context, opts) =>
      webidl.converters["unsigned long"](V, prefix, context, {
        ...opts,
        enforceRange: true,
      }),
  },
];

webidl.converters.HmacImportParams = webidl
  .createDictionaryConverter("HmacImportParams", dictHmacImportParams);

const dictRsaOtherPrimesInfo = [
  {
    key: "r",
    converter: webidl.converters["DOMString"],
  },
  {
    key: "d",
    converter: webidl.converters["DOMString"],
  },
  {
    key: "t",
    converter: webidl.converters["DOMString"],
  },
];

webidl.converters.RsaOtherPrimesInfo = webidl.createDictionaryConverter(
  "RsaOtherPrimesInfo",
  dictRsaOtherPrimesInfo,
);
webidl.converters["sequence<RsaOtherPrimesInfo>"] = webidl
  .createSequenceConverter(
    webidl.converters.RsaOtherPrimesInfo,
  );

const dictJsonWebKey = [
  // Sections 4.2 and 4.3 of RFC7517.
  // https://datatracker.ietf.org/doc/html/rfc7517#section-4
  {
    key: "kty",
    converter: webidl.converters["DOMString"],
  },
  {
    key: "use",
    converter: webidl.converters["DOMString"],
  },
  {
    key: "key_ops",
    converter: webidl.converters["sequence<DOMString>"],
  },
  {
    key: "alg",
    converter: webidl.converters["DOMString"],
  },
  // JSON Web Key Parameters Registration
  {
    key: "ext",
    converter: webidl.converters["boolean"],
  },
  // Section 6 of RFC7518 JSON Web Algorithms
  // https://datatracker.ietf.org/doc/html/rfc7518#section-6
  {
    key: "crv",
    converter: webidl.converters["DOMString"],
  },
  {
    key: "x",
    converter: webidl.converters["DOMString"],
  },
  {
    key: "y",
    converter: webidl.converters["DOMString"],
  },
  {
    key: "d",
    converter: webidl.converters["DOMString"],
  },
  {
    key: "n",
    converter: webidl.converters["DOMString"],
  },
  {
    key: "e",
    converter: webidl.converters["DOMString"],
  },
  {
    key: "p",
    converter: webidl.converters["DOMString"],
  },
  {
    key: "q",
    converter: webidl.converters["DOMString"],
  },
  {
    key: "dp",
    converter: webidl.converters["DOMString"],
  },
  {
    key: "dq",
    converter: webidl.converters["DOMString"],
  },
  {
    key: "qi",
    converter: webidl.converters["DOMString"],
  },
  {
    key: "oth",
    converter: webidl.converters["sequence<RsaOtherPrimesInfo>"],
  },
  {
    key: "k",
    converter: webidl.converters["DOMString"],
  },
];

webidl.converters.JsonWebKey = webidl.createDictionaryConverter(
  "JsonWebKey",
  dictJsonWebKey,
);

const dictHkdfParams = [
  ...new SafeArrayIterator(dictAlgorithm),
  {
    key: "hash",
    converter: webidl.converters.HashAlgorithmIdentifier,
    required: true,
  },
  {
    key: "salt",
    converter: webidl.converters["BufferSource"],
    required: true,
  },
  {
    key: "info",
    converter: webidl.converters["BufferSource"],
    required: true,
  },
];

webidl.converters.HkdfParams = webidl
  .createDictionaryConverter("HkdfParams", dictHkdfParams);

const dictPbkdf2Params = [
  ...new SafeArrayIterator(dictAlgorithm),
  {
    key: "hash",
    converter: webidl.converters.HashAlgorithmIdentifier,
    required: true,
  },
  {
    key: "iterations",
    converter: (V, prefix, context, opts) =>
      webidl.converters["unsigned long"](V, prefix, context, {
        ...opts,
        enforceRange: true,
      }),
    required: true,
  },
  {
    key: "salt",
    converter: webidl.converters["BufferSource"],
    required: true,
  },
];

webidl.converters.Pbkdf2Params = webidl
  .createDictionaryConverter("Pbkdf2Params", dictPbkdf2Params);

const dictAesDerivedKeyParams = [
  ...new SafeArrayIterator(dictAlgorithm),
  {
    key: "length",
    converter: (V, prefix, context, opts) =>
      webidl.converters["unsigned long"](V, prefix, context, {
        ...opts,
        enforceRange: true,
      }),
    required: true,
  },
];

const dictAesCbcParams = [
  ...new SafeArrayIterator(dictAlgorithm),
  {
    key: "iv",
    converter: webidl.converters["BufferSource"],
    required: true,
  },
];

const dictAesGcmParams = [
  ...new SafeArrayIterator(dictAlgorithm),
  {
    key: "iv",
    converter: webidl.converters["BufferSource"],
    required: true,
  },
  {
    key: "tagLength",
    converter: (V, prefix, context, opts) =>
      webidl.converters["unsigned long"](V, prefix, context, {
        ...opts,
        enforceRange: true,
      }),
  },
  {
    key: "additionalData",
    converter: webidl.converters["BufferSource"],
  },
];

const dictAesCtrParams = [
  ...new SafeArrayIterator(dictAlgorithm),
  {
    key: "counter",
    converter: webidl.converters["BufferSource"],
    required: true,
  },
  {
    key: "length",
    converter: (V, prefix, context, opts) =>
      webidl.converters["unsigned short"](V, prefix, context, {
        ...opts,
        enforceRange: true,
      }),
    required: true,
  },
];

webidl.converters.AesDerivedKeyParams = webidl
  .createDictionaryConverter("AesDerivedKeyParams", dictAesDerivedKeyParams);

webidl.converters.AesCbcParams = webidl
  .createDictionaryConverter("AesCbcParams", dictAesCbcParams);

webidl.converters.AesGcmParams = webidl
  .createDictionaryConverter("AesGcmParams", dictAesGcmParams);

webidl.converters.AesCtrParams = webidl
  .createDictionaryConverter("AesCtrParams", dictAesCtrParams);

webidl.converters.CryptoKey = webidl.createInterfaceConverter(
  "CryptoKey",
  CryptoKey.prototype,
);

const dictCryptoKeyPair = [
  {
    key: "publicKey",
    converter: webidl.converters.CryptoKey,
  },
  {
    key: "privateKey",
    converter: webidl.converters.CryptoKey,
  },
];

webidl.converters.CryptoKeyPair = webidl
  .createDictionaryConverter("CryptoKeyPair", dictCryptoKeyPair);

const dictEcdhKeyDeriveParams = [
  ...new SafeArrayIterator(dictAlgorithm),
  {
    key: "public",
    converter: webidl.converters.CryptoKey,
    required: true,
  },
];

webidl.converters.EcdhKeyDeriveParams = webidl
  .createDictionaryConverter("EcdhKeyDeriveParams", dictEcdhKeyDeriveParams);

export { Crypto, crypto, CryptoKey, SubtleCrypto };
