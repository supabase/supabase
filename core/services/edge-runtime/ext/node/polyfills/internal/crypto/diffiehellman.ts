// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import {
  op_node_dh_compute_secret,
  op_node_dh_keys_generate_and_export,
  op_node_diffie_hellman,
  op_node_ecdh_compute_public_key,
  op_node_ecdh_compute_secret,
  op_node_ecdh_encode_pubkey,
  op_node_ecdh_generate_keys,
  op_node_gen_prime,
} from "ext:core/ops";

import { notImplemented } from "ext:deno_node/_utils.ts";
import {
  isAnyArrayBuffer,
  isArrayBufferView,
} from "ext:deno_node/internal/util/types.ts";
import {
  ERR_CRYPTO_UNKNOWN_DH_GROUP,
  ERR_INVALID_ARG_TYPE,
  NodeError,
} from "ext:deno_node/internal/errors.ts";
import {
  validateInt32,
  validateString,
} from "ext:deno_node/internal/validators.mjs";
import { Buffer } from "node:buffer";
import {
  EllipticCurve,
  ellipticCurves,
  getDefaultEncoding,
  toBuf,
} from "ext:deno_node/internal/crypto/util.ts";
import type {
  BinaryLike,
  BinaryToTextEncoding,
  ECDHKeyFormat,
} from "ext:deno_node/internal/crypto/types.ts";
import {
  getKeyObjectHandle,
  kConsumePrivate,
  kConsumePublic,
  KeyObject,
} from "ext:deno_node/internal/crypto/keys.ts";
import type { BufferEncoding } from "ext:deno_node/_global.d.ts";

const DH_GENERATOR = 2;

export class DiffieHellman {
  verifyError!: number;
  #prime: Buffer;
  #primeLength: number;
  #generator: Buffer;
  #privateKey: Buffer;
  #publicKey: Buffer;

  constructor(
    sizeOrKey: number | string | ArrayBufferView,
    keyEncoding?: unknown,
    generator?: unknown,
    genEncoding?: unknown,
  ) {
    if (
      typeof sizeOrKey !== "number" &&
      typeof sizeOrKey !== "string" &&
      !isArrayBufferView(sizeOrKey) &&
      !isAnyArrayBuffer(sizeOrKey)
    ) {
      throw new ERR_INVALID_ARG_TYPE(
        "sizeOrKey",
        ["number", "string", "ArrayBuffer", "Buffer", "TypedArray", "DataView"],
        sizeOrKey,
      );
    }

    if (typeof sizeOrKey === "number") {
      validateInt32(sizeOrKey, "sizeOrKey");
    }

    if (
      keyEncoding &&
      !Buffer.isEncoding(keyEncoding as BinaryToTextEncoding) &&
      keyEncoding !== "buffer"
    ) {
      genEncoding = generator;
      generator = keyEncoding;
      keyEncoding = false;
    }

    const encoding = getDefaultEncoding();
    keyEncoding = keyEncoding || encoding;
    genEncoding = genEncoding || encoding;

    if (typeof sizeOrKey !== "number") {
      this.#prime = toBuf(sizeOrKey as string, keyEncoding as string);
    } else {
      // The supplied parameter is our primeLength, generate a suitable prime.
      this.#primeLength = sizeOrKey as number;
      if (this.#primeLength < 2) {
        throw new NodeError("ERR_OSSL_BN_BITS_TOO_SMALL", "bits too small");
      }

      this.#prime = Buffer.from(
        op_node_gen_prime(this.#primeLength).buffer,
      );
    }

    if (!generator) {
      // While the commonly used cyclic group generators for DH are 2 and 5, we
      // need this a buffer, because, well.. Node.
      this.#generator = Buffer.alloc(4);
      this.#generator.writeUint32BE(DH_GENERATOR);
    } else if (typeof generator === "number") {
      validateInt32(generator, "generator");
      this.#generator = Buffer.alloc(4);
      if (generator <= 0 || generator >= 0x7fffffff) {
        throw new NodeError("ERR_OSSL_DH_BAD_GENERATOR", "bad generator");
      }
      this.#generator.writeUint32BE(generator);
    } else if (typeof generator === "string") {
      generator = toBuf(generator, genEncoding as string);
      this.#generator = generator;
    } else if (!isArrayBufferView(generator) && !isAnyArrayBuffer(generator)) {
      throw new ERR_INVALID_ARG_TYPE(
        "generator",
        ["number", "string", "ArrayBuffer", "Buffer", "TypedArray", "DataView"],
        generator,
      );
    } else {
      this.#generator = Buffer.from(generator);
    }

    this.#checkGenerator();

    // TODO(lev): actually implement this value
    this.verifyError = 0;
  }

  #checkGenerator(): number {
    let generator: number;

    if (this.#generator.length == 0) {
      throw new NodeError("ERR_OSSL_DH_BAD_GENERATOR", "bad generator");
    } else if (this.#generator.length == 1) {
      generator = this.#generator.readUint8();
    } else if (this.#generator.length == 2) {
      generator = this.#generator.readUint16BE();
    } else {
      generator = this.#generator.readUint32BE();
    }

    if (generator != 2 && generator != 5) {
      throw new NodeError("ERR_OSSL_DH_BAD_GENERATOR", "bad generator");
    }

    return generator;
  }

  computeSecret(otherPublicKey: ArrayBufferView): Buffer;
  computeSecret(
    otherPublicKey: string,
    inputEncoding: BinaryToTextEncoding,
  ): Buffer;
  computeSecret(
    otherPublicKey: ArrayBufferView,
    outputEncoding: BinaryToTextEncoding,
  ): string;
  computeSecret(
    otherPublicKey: string,
    inputEncoding: BinaryToTextEncoding,
    outputEncoding: BinaryToTextEncoding,
  ): string;
  computeSecret(
    otherPublicKey: ArrayBufferView | string,
    inputEncoding?: BinaryToTextEncoding,
    outputEncoding?: BinaryToTextEncoding,
  ): Buffer | string {
    let buf;
    if (inputEncoding != undefined && inputEncoding != "buffer") {
      buf = Buffer.from(otherPublicKey.buffer, inputEncoding);
    } else {
      buf = Buffer.from(otherPublicKey.buffer);
    }

    const sharedSecret = op_node_dh_compute_secret(
      this.#prime,
      this.#privateKey,
      buf,
    );

    if (outputEncoding == undefined || outputEncoding == "buffer") {
      return Buffer.from(sharedSecret.buffer);
    }

    return Buffer.from(sharedSecret.buffer).toString(outputEncoding);
  }

  generateKeys(): Buffer;
  generateKeys(encoding: BinaryToTextEncoding): string;
  generateKeys(_encoding?: BinaryToTextEncoding): Buffer | string {
    const generator = this.#checkGenerator();
    const [privateKey, publicKey] = op_node_dh_keys_generate_and_export(
      this.#prime,
      this.#primeLength ?? 0,
      generator,
    );

    this.#privateKey = Buffer.from(privateKey.buffer);
    this.#publicKey = Buffer.from(publicKey.buffer);

    return this.#publicKey;
  }

  getGenerator(): Buffer;
  getGenerator(encoding: BinaryToTextEncoding): string;
  getGenerator(encoding?: BinaryToTextEncoding): Buffer | string {
    if (encoding !== undefined && encoding != "buffer") {
      return this.#generator.toString(encoding);
    }

    return this.#generator;
  }

  getPrime(): Buffer;
  getPrime(encoding: BinaryToTextEncoding): string;
  getPrime(encoding?: BinaryToTextEncoding): Buffer | string {
    if (encoding !== undefined && encoding != "buffer") {
      return this.#prime.toString(encoding);
    }

    return this.#prime;
  }

  getPrivateKey(): Buffer;
  getPrivateKey(encoding: BinaryToTextEncoding): string;
  getPrivateKey(encoding?: BinaryToTextEncoding): Buffer | string {
    if (encoding !== undefined && encoding != "buffer") {
      return this.#privateKey.toString(encoding);
    }

    return this.#privateKey;
  }

  getPublicKey(): Buffer;
  getPublicKey(encoding: BinaryToTextEncoding): string;
  getPublicKey(encoding?: BinaryToTextEncoding): Buffer | string {
    if (encoding !== undefined && encoding != "buffer") {
      return this.#publicKey.toString(encoding);
    }

    return this.#publicKey;
  }

  setPrivateKey(privateKey: ArrayBufferView): void;
  setPrivateKey(privateKey: string, encoding: BufferEncoding): void;
  setPrivateKey(
    privateKey: ArrayBufferView | string,
    encoding?: BufferEncoding,
  ) {
    if (encoding == undefined || encoding == "buffer") {
      this.#privateKey = Buffer.from(privateKey);
    } else {
      this.#privateKey = Buffer.from(privateKey, encoding);
    }
  }

  setPublicKey(publicKey: ArrayBufferView): void;
  setPublicKey(publicKey: string, encoding: BufferEncoding): void;
  setPublicKey(
    publicKey: ArrayBufferView | string,
    encoding?: BufferEncoding,
  ) {
    if (encoding == undefined || encoding == "buffer") {
      this.#publicKey = Buffer.from(publicKey);
    } else {
      this.#publicKey = Buffer.from(publicKey, encoding);
    }
  }
}

const DH_GROUP_NAMES = [
  "modp5",
  "modp14",
  "modp15",
  "modp16",
  "modp17",
  "modp18",
];
const DH_GROUPS = {
  "modp5": {
    prime: [
      0xFFFFFFFF,
      0xFFFFFFFF,
      0xC90FDAA2,
      0x2168C234,
      0xC4C6628B,
      0x80DC1CD1,
      0x29024E08,
      0x8A67CC74,
      0x020BBEA6,
      0x3B139B22,
      0x514A0879,
      0x8E3404DD,
      0xEF9519B3,
      0xCD3A431B,
      0x302B0A6D,
      0xF25F1437,
      0x4FE1356D,
      0x6D51C245,
      0xE485B576,
      0x625E7EC6,
      0xF44C42E9,
      0xA637ED6B,
      0x0BFF5CB6,
      0xF406B7ED,
      0xEE386BFB,
      0x5A899FA5,
      0xAE9F2411,
      0x7C4B1FE6,
      0x49286651,
      0xECE45B3D,
      0xC2007CB8,
      0xA163BF05,
      0x98DA4836,
      0x1C55D39A,
      0x69163FA8,
      0xFD24CF5F,
      0x83655D23,
      0xDCA3AD96,
      0x1C62F356,
      0x208552BB,
      0x9ED52907,
      0x7096966D,
      0x670C354E,
      0x4ABC9804,
      0xF1746C08,
      0xCA237327,
      0xFFFFFFFF,
      0xFFFFFFFF,
    ],
    generator: 2,
  },
  "modp14": {
    prime: [
      0xFFFFFFFF,
      0xFFFFFFFF,
      0xC90FDAA2,
      0x2168C234,
      0xC4C6628B,
      0x80DC1CD1,
      0x29024E08,
      0x8A67CC74,
      0x020BBEA6,
      0x3B139B22,
      0x514A0879,
      0x8E3404DD,
      0xEF9519B3,
      0xCD3A431B,
      0x302B0A6D,
      0xF25F1437,
      0x4FE1356D,
      0x6D51C245,
      0xE485B576,
      0x625E7EC6,
      0xF44C42E9,
      0xA637ED6B,
      0x0BFF5CB6,
      0xF406B7ED,
      0xEE386BFB,
      0x5A899FA5,
      0xAE9F2411,
      0x7C4B1FE6,
      0x49286651,
      0xECE45B3D,
      0xC2007CB8,
      0xA163BF05,
      0x98DA4836,
      0x1C55D39A,
      0x69163FA8,
      0xFD24CF5F,
      0x83655D23,
      0xDCA3AD96,
      0x1C62F356,
      0x208552BB,
      0x9ED52907,
      0x7096966D,
      0x670C354E,
      0x4ABC9804,
      0xF1746C08,
      0xCA18217C,
      0x32905E46,
      0x2E36CE3B,
      0xE39E772C,
      0x180E8603,
      0x9B2783A2,
      0xEC07A28F,
      0xB5C55DF0,
      0x6F4C52C9,
      0xDE2BCBF6,
      0x95581718,
      0x3995497C,
      0xEA956AE5,
      0x15D22618,
      0x98FA0510,
      0x15728E5A,
      0x8AACAA68,
      0xFFFFFFFF,
      0xFFFFFFFF,
    ],
    generator: 2,
  },
  "modp15": {
    prime: [
      0xFFFFFFFF,
      0xFFFFFFFF,
      0xC90FDAA2,
      0x2168C234,
      0xC4C6628B,
      0x80DC1CD1,
      0x29024E08,
      0x8A67CC74,
      0x020BBEA6,
      0x3B139B22,
      0x514A0879,
      0x8E3404DD,
      0xEF9519B3,
      0xCD3A431B,
      0x302B0A6D,
      0xF25F1437,
      0x4FE1356D,
      0x6D51C245,
      0xE485B576,
      0x625E7EC6,
      0xF44C42E9,
      0xA637ED6B,
      0x0BFF5CB6,
      0xF406B7ED,
      0xEE386BFB,
      0x5A899FA5,
      0xAE9F2411,
      0x7C4B1FE6,
      0x49286651,
      0xECE45B3D,
      0xC2007CB8,
      0xA163BF05,
      0x98DA4836,
      0x1C55D39A,
      0x69163FA8,
      0xFD24CF5F,
      0x83655D23,
      0xDCA3AD96,
      0x1C62F356,
      0x208552BB,
      0x9ED52907,
      0x7096966D,
      0x670C354E,
      0x4ABC9804,
      0xF1746C08,
      0xCA18217C,
      0x32905E46,
      0x2E36CE3B,
      0xE39E772C,
      0x180E8603,
      0x9B2783A2,
      0xEC07A28F,
      0xB5C55DF0,
      0x6F4C52C9,
      0xDE2BCBF6,
      0x95581718,
      0x3995497C,
      0xEA956AE5,
      0x15D22618,
      0x98FA0510,
      0x15728E5A,
      0x8AAAC42D,
      0xAD33170D,
      0x04507A33,
      0xA85521AB,
      0xDF1CBA64,
      0xECFB8504,
      0x58DBEF0A,
      0x8AEA7157,
      0x5D060C7D,
      0xB3970F85,
      0xA6E1E4C7,
      0xABF5AE8C,
      0xDB0933D7,
      0x1E8C94E0,
      0x4A25619D,
      0xCEE3D226,
      0x1AD2EE6B,
      0xF12FFA06,
      0xD98A0864,
      0xD8760273,
      0x3EC86A64,
      0x521F2B18,
      0x177B200C,
      0xBBE11757,
      0x7A615D6C,
      0x770988C0,
      0xBAD946E2,
      0x08E24FA0,
      0x74E5AB31,
      0x43DB5BFC,
      0xE0FD108E,
      0x4B82D120,
      0xA93AD2CA,
      0xFFFFFFFF,
      0xFFFFFFFF,
    ],
    generator: 2,
  },
  "modp16": {
    prime: [
      0xFFFFFFFF,
      0xFFFFFFFF,
      0xC90FDAA2,
      0x2168C234,
      0xC4C6628B,
      0x80DC1CD1,
      0x29024E08,
      0x8A67CC74,
      0x020BBEA6,
      0x3B139B22,
      0x514A0879,
      0x8E3404DD,
      0xEF9519B3,
      0xCD3A431B,
      0x302B0A6D,
      0xF25F1437,
      0x4FE1356D,
      0x6D51C245,
      0xE485B576,
      0x625E7EC6,
      0xF44C42E9,
      0xA637ED6B,
      0x0BFF5CB6,
      0xF406B7ED,
      0xEE386BFB,
      0x5A899FA5,
      0xAE9F2411,
      0x7C4B1FE6,
      0x49286651,
      0xECE45B3D,
      0xC2007CB8,
      0xA163BF05,
      0x98DA4836,
      0x1C55D39A,
      0x69163FA8,
      0xFD24CF5F,
      0x83655D23,
      0xDCA3AD96,
      0x1C62F356,
      0x208552BB,
      0x9ED52907,
      0x7096966D,
      0x670C354E,
      0x4ABC9804,
      0xF1746C08,
      0xCA18217C,
      0x32905E46,
      0x2E36CE3B,
      0xE39E772C,
      0x180E8603,
      0x9B2783A2,
      0xEC07A28F,
      0xB5C55DF0,
      0x6F4C52C9,
      0xDE2BCBF6,
      0x95581718,
      0x3995497C,
      0xEA956AE5,
      0x15D22618,
      0x98FA0510,
      0x15728E5A,
      0x8AAAC42D,
      0xAD33170D,
      0x04507A33,
      0xA85521AB,
      0xDF1CBA64,
      0xECFB8504,
      0x58DBEF0A,
      0x8AEA7157,
      0x5D060C7D,
      0xB3970F85,
      0xA6E1E4C7,
      0xABF5AE8C,
      0xDB0933D7,
      0x1E8C94E0,
      0x4A25619D,
      0xCEE3D226,
      0x1AD2EE6B,
      0xF12FFA06,
      0xD98A0864,
      0xD8760273,
      0x3EC86A64,
      0x521F2B18,
      0x177B200C,
      0xBBE11757,
      0x7A615D6C,
      0x770988C0,
      0xBAD946E2,
      0x08E24FA0,
      0x74E5AB31,
      0x43DB5BFC,
      0xE0FD108E,
      0x4B82D120,
      0xA9210801,
      0x1A723C12,
      0xA787E6D7,
      0x88719A10,
      0xBDBA5B26,
      0x99C32718,
      0x6AF4E23C,
      0x1A946834,
      0xB6150BDA,
      0x2583E9CA,
      0x2AD44CE8,
      0xDBBBC2DB,
      0x04DE8EF9,
      0x2E8EFC14,
      0x1FBECAA6,
      0x287C5947,
      0x4E6BC05D,
      0x99B2964F,
      0xA090C3A2,
      0x233BA186,
      0x515BE7ED,
      0x1F612970,
      0xCEE2D7AF,
      0xB81BDD76,
      0x2170481C,
      0xD0069127,
      0xD5B05AA9,
      0x93B4EA98,
      0x8D8FDDC1,
      0x86FFB7DC,
      0x90A6C08F,
      0x4DF435C9,
      0x34063199,
      0xFFFFFFFF,
      0xFFFFFFFF,
    ],
    generator: 2,
  },
  "modp17": {
    prime: [
      0xFFFFFFFF,
      0xFFFFFFFF,
      0xC90FDAA2,
      0x2168C234,
      0xC4C6628B,
      0x80DC1CD1,
      0x29024E08,
      0x8A67CC74,
      0x020BBEA6,
      0x3B139B22,
      0x514A0879,
      0x8E3404DD,
      0xEF9519B3,
      0xCD3A431B,
      0x302B0A6D,
      0xF25F1437,
      0x4FE1356D,
      0x6D51C245,
      0xE485B576,
      0x625E7EC6,
      0xF44C42E9,
      0xA637ED6B,
      0x0BFF5CB6,
      0xF406B7ED,
      0xEE386BFB,
      0x5A899FA5,
      0xAE9F2411,
      0x7C4B1FE6,
      0x49286651,
      0xECE45B3D,
      0xC2007CB8,
      0xA163BF05,
      0x98DA4836,
      0x1C55D39A,
      0x69163FA8,
      0xFD24CF5F,
      0x83655D23,
      0xDCA3AD96,
      0x1C62F356,
      0x208552BB,
      0x9ED52907,
      0x7096966D,
      0x670C354E,
      0x4ABC9804,
      0xF1746C08,
      0xCA18217C,
      0x32905E46,
      0x2E36CE3B,
      0xE39E772C,
      0x180E8603,
      0x9B2783A2,
      0xEC07A28F,
      0xB5C55DF0,
      0x6F4C52C9,
      0xDE2BCBF6,
      0x95581718,
      0x3995497C,
      0xEA956AE5,
      0x15D22618,
      0x98FA0510,
      0x15728E5A,
      0x8AAAC42D,
      0xAD33170D,
      0x04507A33,
      0xA85521AB,
      0xDF1CBA64,
      0xECFB8504,
      0x58DBEF0A,
      0x8AEA7157,
      0x5D060C7D,
      0xB3970F85,
      0xA6E1E4C7,
      0xABF5AE8C,
      0xDB0933D7,
      0x1E8C94E0,
      0x4A25619D,
      0xCEE3D226,
      0x1AD2EE6B,
      0xF12FFA06,
      0xD98A0864,
      0xD8760273,
      0x3EC86A64,
      0x521F2B18,
      0x177B200C,
      0xBBE11757,
      0x7A615D6C,
      0x770988C0,
      0xBAD946E2,
      0x08E24FA0,
      0x74E5AB31,
      0x43DB5BFC,
      0xE0FD108E,
      0x4B82D120,
      0xA9210801,
      0x1A723C12,
      0xA787E6D7,
      0x88719A10,
      0xBDBA5B26,
      0x99C32718,
      0x6AF4E23C,
      0x1A946834,
      0xB6150BDA,
      0x2583E9CA,
      0x2AD44CE8,
      0xDBBBC2DB,
      0x04DE8EF9,
      0x2E8EFC14,
      0x1FBECAA6,
      0x287C5947,
      0x4E6BC05D,
      0x99B2964F,
      0xA090C3A2,
      0x233BA186,
      0x515BE7ED,
      0x1F612970,
      0xCEE2D7AF,
      0xB81BDD76,
      0x2170481C,
      0xD0069127,
      0xD5B05AA9,
      0x93B4EA98,
      0x8D8FDDC1,
      0x86FFB7DC,
      0x90A6C08F,
      0x4DF435C9,
      0x34028492,
      0x36C3FAB4,
      0xD27C7026,
      0xC1D4DCB2,
      0x602646DE,
      0xC9751E76,
      0x3DBA37BD,
      0xF8FF9406,
      0xAD9E530E,
      0xE5DB382F,
      0x413001AE,
      0xB06A53ED,
      0x9027D831,
      0x179727B0,
      0x865A8918,
      0xDA3EDBEB,
      0xCF9B14ED,
      0x44CE6CBA,
      0xCED4BB1B,
      0xDB7F1447,
      0xE6CC254B,
      0x33205151,
      0x2BD7AF42,
      0x6FB8F401,
      0x378CD2BF,
      0x5983CA01,
      0xC64B92EC,
      0xF032EA15,
      0xD1721D03,
      0xF482D7CE,
      0x6E74FEF6,
      0xD55E702F,
      0x46980C82,
      0xB5A84031,
      0x900B1C9E,
      0x59E7C97F,
      0xBEC7E8F3,
      0x23A97A7E,
      0x36CC88BE,
      0x0F1D45B7,
      0xFF585AC5,
      0x4BD407B2,
      0x2B4154AA,
      0xCC8F6D7E,
      0xBF48E1D8,
      0x14CC5ED2,
      0x0F8037E0,
      0xA79715EE,
      0xF29BE328,
      0x06A1D58B,
      0xB7C5DA76,
      0xF550AA3D,
      0x8A1FBFF0,
      0xEB19CCB1,
      0xA313D55C,
      0xDA56C9EC,
      0x2EF29632,
      0x387FE8D7,
      0x6E3C0468,
      0x043E8F66,
      0x3F4860EE,
      0x12BF2D5B,
      0x0B7474D6,
      0xE694F91E,
      0x6DCC4024,
      0xFFFFFFFF,
      0xFFFFFFFF,
    ],
    generator: 2,
  },
  "modp18": {
    prime: [
      0xFFFFFFFF,
      0xFFFFFFFF,
      0xC90FDAA2,
      0x2168C234,
      0xC4C6628B,
      0x80DC1CD1,
      0x29024E08,
      0x8A67CC74,
      0x020BBEA6,
      0x3B139B22,
      0x514A0879,
      0x8E3404DD,
      0xEF9519B3,
      0xCD3A431B,
      0x302B0A6D,
      0xF25F1437,
      0x4FE1356D,
      0x6D51C245,
      0xE485B576,
      0x625E7EC6,
      0xF44C42E9,
      0xA637ED6B,
      0x0BFF5CB6,
      0xF406B7ED,
      0xEE386BFB,
      0x5A899FA5,
      0xAE9F2411,
      0x7C4B1FE6,
      0x49286651,
      0xECE45B3D,
      0xC2007CB8,
      0xA163BF05,
      0x98DA4836,
      0x1C55D39A,
      0x69163FA8,
      0xFD24CF5F,
      0x83655D23,
      0xDCA3AD96,
      0x1C62F356,
      0x208552BB,
      0x9ED52907,
      0x7096966D,
      0x670C354E,
      0x4ABC9804,
      0xF1746C08,
      0xCA18217C,
      0x32905E46,
      0x2E36CE3B,
      0xE39E772C,
      0x180E8603,
      0x9B2783A2,
      0xEC07A28F,
      0xB5C55DF0,
      0x6F4C52C9,
      0xDE2BCBF6,
      0x95581718,
      0x3995497C,
      0xEA956AE5,
      0x15D22618,
      0x98FA0510,
      0x15728E5A,
      0x8AAAC42D,
      0xAD33170D,
      0x04507A33,
      0xA85521AB,
      0xDF1CBA64,
      0xECFB8504,
      0x58DBEF0A,
      0x8AEA7157,
      0x5D060C7D,
      0xB3970F85,
      0xA6E1E4C7,
      0xABF5AE8C,
      0xDB0933D7,
      0x1E8C94E0,
      0x4A25619D,
      0xCEE3D226,
      0x1AD2EE6B,
      0xF12FFA06,
      0xD98A0864,
      0xD8760273,
      0x3EC86A64,
      0x521F2B18,
      0x177B200C,
      0xBBE11757,
      0x7A615D6C,
      0x770988C0,
      0xBAD946E2,
      0x08E24FA0,
      0x74E5AB31,
      0x43DB5BFC,
      0xE0FD108E,
      0x4B82D120,
      0xA9210801,
      0x1A723C12,
      0xA787E6D7,
      0x88719A10,
      0xBDBA5B26,
      0x99C32718,
      0x6AF4E23C,
      0x1A946834,
      0xB6150BDA,
      0x2583E9CA,
      0x2AD44CE8,
      0xDBBBC2DB,
      0x04DE8EF9,
      0x2E8EFC14,
      0x1FBECAA6,
      0x287C5947,
      0x4E6BC05D,
      0x99B2964F,
      0xA090C3A2,
      0x233BA186,
      0x515BE7ED,
      0x1F612970,
      0xCEE2D7AF,
      0xB81BDD76,
      0x2170481C,
      0xD0069127,
      0xD5B05AA9,
      0x93B4EA98,
      0x8D8FDDC1,
      0x86FFB7DC,
      0x90A6C08F,
      0x4DF435C9,
      0x34028492,
      0x36C3FAB4,
      0xD27C7026,
      0xC1D4DCB2,
      0x602646DE,
      0xC9751E76,
      0x3DBA37BD,
      0xF8FF9406,
      0xAD9E530E,
      0xE5DB382F,
      0x413001AE,
      0xB06A53ED,
      0x9027D831,
      0x179727B0,
      0x865A8918,
      0xDA3EDBEB,
      0xCF9B14ED,
      0x44CE6CBA,
      0xCED4BB1B,
      0xDB7F1447,
      0xE6CC254B,
      0x33205151,
      0x2BD7AF42,
      0x6FB8F401,
      0x378CD2BF,
      0x5983CA01,
      0xC64B92EC,
      0xF032EA15,
      0xD1721D03,
      0xF482D7CE,
      0x6E74FEF6,
      0xD55E702F,
      0x46980C82,
      0xB5A84031,
      0x900B1C9E,
      0x59E7C97F,
      0xBEC7E8F3,
      0x23A97A7E,
      0x36CC88BE,
      0x0F1D45B7,
      0xFF585AC5,
      0x4BD407B2,
      0x2B4154AA,
      0xCC8F6D7E,
      0xBF48E1D8,
      0x14CC5ED2,
      0x0F8037E0,
      0xA79715EE,
      0xF29BE328,
      0x06A1D58B,
      0xB7C5DA76,
      0xF550AA3D,
      0x8A1FBFF0,
      0xEB19CCB1,
      0xA313D55C,
      0xDA56C9EC,
      0x2EF29632,
      0x387FE8D7,
      0x6E3C0468,
      0x043E8F66,
      0x3F4860EE,
      0x12BF2D5B,
      0x0B7474D6,
      0xE694F91E,
      0x6DBE1159,
      0x74A3926F,
      0x12FEE5E4,
      0x38777CB6,
      0xA932DF8C,
      0xD8BEC4D0,
      0x73B931BA,
      0x3BC832B6,
      0x8D9DD300,
      0x741FA7BF,
      0x8AFC47ED,
      0x2576F693,
      0x6BA42466,
      0x3AAB639C,
      0x5AE4F568,
      0x3423B474,
      0x2BF1C978,
      0x238F16CB,
      0xE39D652D,
      0xE3FDB8BE,
      0xFC848AD9,
      0x22222E04,
      0xA4037C07,
      0x13EB57A8,
      0x1A23F0C7,
      0x3473FC64,
      0x6CEA306B,
      0x4BCBC886,
      0x2F8385DD,
      0xFA9D4B7F,
      0xA2C087E8,
      0x79683303,
      0xED5BDD3A,
      0x062B3CF5,
      0xB3A278A6,
      0x6D2A13F8,
      0x3F44F82D,
      0xDF310EE0,
      0x74AB6A36,
      0x4597E899,
      0xA0255DC1,
      0x64F31CC5,
      0x0846851D,
      0xF9AB4819,
      0x5DED7EA1,
      0xB1D510BD,
      0x7EE74D73,
      0xFAF36BC3,
      0x1ECFA268,
      0x359046F4,
      0xEB879F92,
      0x4009438B,
      0x481C6CD7,
      0x889A002E,
      0xD5EE382B,
      0xC9190DA6,
      0xFC026E47,
      0x9558E447,
      0x5677E9AA,
      0x9E3050E2,
      0x765694DF,
      0xC81F56E8,
      0x80B96E71,
      0x60C980DD,
      0x98EDD3DF,
      0xFFFFFFFF,
      0xFFFFFFFF,
    ],
    generator: 2,
  },
};

export class DiffieHellmanGroup {
  verifyError!: number;
  #diffiehellman: DiffieHellman;

  constructor(name: string) {
    if (!DH_GROUP_NAMES.includes(name)) {
      throw new ERR_CRYPTO_UNKNOWN_DH_GROUP();
    }
    this.#diffiehellman = new DiffieHellman(
      Buffer.from(DH_GROUPS[name].prime),
      DH_GROUPS[name].generator,
    );
    this.verifyError = 0;
  }

  computeSecret(otherPublicKey: ArrayBufferView): Buffer;
  computeSecret(
    otherPublicKey: string,
    inputEncoding: BinaryToTextEncoding,
  ): Buffer;
  computeSecret(
    otherPublicKey: ArrayBufferView,
    outputEncoding: BinaryToTextEncoding,
  ): string;
  computeSecret(
    otherPublicKey: string,
    inputEncoding: BinaryToTextEncoding,
    outputEncoding: BinaryToTextEncoding,
  ): string;
  computeSecret(
    otherPublicKey: ArrayBufferView | string,
    inputEncoding?: BinaryToTextEncoding,
    outputEncoding?: BinaryToTextEncoding,
  ): Buffer | string {
    return this.#diffiehellman.computeSecret(
      otherPublicKey,
      inputEncoding,
      outputEncoding,
    );
  }

  generateKeys(): Buffer;
  generateKeys(encoding: BinaryToTextEncoding): string;
  generateKeys(encoding?: BinaryToTextEncoding): Buffer | string {
    return this.#diffiehellman.generateKeys(encoding);
  }

  getGenerator(): Buffer;
  getGenerator(encoding: BinaryToTextEncoding): string;
  getGenerator(encoding?: BinaryToTextEncoding): Buffer | string {
    return this.#diffiehellman.getGenerator(encoding);
  }

  getPrime(): Buffer;
  getPrime(encoding: BinaryToTextEncoding): string;
  getPrime(encoding?: BinaryToTextEncoding): Buffer | string {
    return this.#diffiehellman.getPrime(encoding);
  }

  getPrivateKey(): Buffer;
  getPrivateKey(encoding: BinaryToTextEncoding): string;
  getPrivateKey(encoding?: BinaryToTextEncoding): Buffer | string {
    return this.#diffiehellman.getPrivateKey(encoding);
  }

  getPublicKey(): Buffer;
  getPublicKey(encoding: BinaryToTextEncoding): string;
  getPublicKey(encoding?: BinaryToTextEncoding): Buffer | string {
    return this.#diffiehellman.getPublicKey(encoding);
  }
}

export class ECDH {
  #curve: EllipticCurve; // the selected curve
  #privbuf: Buffer; // the private key
  #pubbuf: Buffer; // the public key

  constructor(curve: string) {
    validateString(curve, "curve");

    const c = ellipticCurves.find((x) => x.name == curve);
    if (c == undefined) {
      throw new Error("invalid curve");
    }

    this.#curve = c;
    this.#pubbuf = Buffer.alloc(this.#curve.publicKeySize);
    this.#privbuf = Buffer.alloc(this.#curve.privateKeySize);
  }

  static convertKey(
    _key: BinaryLike,
    _curve: string,
    _inputEncoding?: BinaryToTextEncoding,
    _outputEncoding?: "latin1" | "hex" | "base64" | "base64url",
    _format?: "uncompressed" | "compressed" | "hybrid",
  ): Buffer | string {
    notImplemented("crypto.ECDH.prototype.convertKey");
  }

  computeSecret(otherPublicKey: ArrayBufferView): Buffer;
  computeSecret(
    otherPublicKey: string,
    inputEncoding: BinaryToTextEncoding,
  ): Buffer;
  computeSecret(
    otherPublicKey: ArrayBufferView,
    outputEncoding: BinaryToTextEncoding,
  ): string;
  computeSecret(
    otherPublicKey: string,
    inputEncoding: BinaryToTextEncoding,
    outputEncoding: BinaryToTextEncoding,
  ): string;
  computeSecret(
    otherPublicKey: ArrayBufferView | string,
    _inputEncoding?: BinaryToTextEncoding,
    _outputEncoding?: BinaryToTextEncoding,
  ): Buffer | string {
    const secretBuf = Buffer.alloc(this.#curve.sharedSecretSize);

    op_node_ecdh_compute_secret(
      this.#curve.name,
      this.#privbuf,
      otherPublicKey,
      secretBuf,
    );

    return secretBuf;
  }

  generateKeys(): Buffer;
  generateKeys(encoding: BinaryToTextEncoding, format?: ECDHKeyFormat): string;
  generateKeys(
    encoding?: BinaryToTextEncoding,
    format: ECDHKeyFormat = "uncompressed",
  ): Buffer | string {
    this.#pubbuf = Buffer.alloc(
      format == "compressed"
        ? this.#curve.publicKeySizeCompressed
        : this.#curve.publicKeySize,
    );
    op_node_ecdh_generate_keys(
      this.#curve.name,
      this.#pubbuf,
      this.#privbuf,
      format,
    );

    if (encoding !== undefined) {
      return this.#pubbuf.toString(encoding);
    }
    return this.#pubbuf;
  }

  getPrivateKey(): Buffer;
  getPrivateKey(encoding: BinaryToTextEncoding): string;
  getPrivateKey(encoding?: BinaryToTextEncoding): Buffer | string {
    if (encoding !== undefined) {
      return this.#privbuf.toString(encoding);
    }
    return this.#privbuf;
  }

  getPublicKey(): Buffer;
  getPublicKey(encoding: BinaryToTextEncoding, format?: ECDHKeyFormat): string;
  getPublicKey(
    encoding?: BinaryToTextEncoding,
    format: ECDHKeyFormat = "uncompressed",
  ): Buffer | string {
    const pubbuf = Buffer.from(op_node_ecdh_encode_pubkey(
      this.#curve.name,
      this.#pubbuf,
      format == "compressed",
    ));
    if (encoding !== undefined) {
      return pubbuf.toString(encoding);
    }
    return pubbuf;
  }

  setPrivateKey(privateKey: ArrayBufferView): void;
  setPrivateKey(privateKey: string, encoding: BinaryToTextEncoding): void;
  setPrivateKey(
    privateKey: ArrayBufferView | string,
    encoding?: BinaryToTextEncoding,
  ): Buffer | string {
    this.#privbuf = privateKey;
    this.#pubbuf = Buffer.alloc(this.#curve.publicKeySize);

    op_node_ecdh_compute_public_key(
      this.#curve.name,
      this.#privbuf,
      this.#pubbuf,
    );

    if (encoding !== undefined) {
      return this.#pubbuf.toString(encoding);
    }
    return this.#pubbuf;
  }
}

export function diffieHellman(options: {
  privateKey: KeyObject;
  publicKey: KeyObject;
}): Buffer {
  const privateKey = getKeyObjectHandle(options.privateKey, kConsumePrivate);
  const publicKey = getKeyObjectHandle(options.publicKey, kConsumePublic);
  const bytes = op_node_diffie_hellman(privateKey, publicKey);
  return Buffer.from(bytes);
}

export default {
  DiffieHellman,
  DiffieHellmanGroup,
  ECDH,
  diffieHellman,
};
