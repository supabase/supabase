// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { primordials } from "ext:core/mod.js";
import {
  op_node_check_prime,
  op_node_check_prime_async,
  op_node_check_prime_bytes,
  op_node_check_prime_bytes_async,
  op_node_gen_prime,
  op_node_gen_prime_async,
} from "ext:core/ops";
const {
  StringPrototypePadStart,
  StringPrototypeToString,
} = primordials;

import { notImplemented } from "ext:deno_node/_utils.ts";
import randomBytes from "ext:deno_node/internal/crypto/_randomBytes.ts";
import randomFill, {
  randomFillSync,
} from "ext:deno_node/internal/crypto/_randomFill.mjs";
import randomInt from "ext:deno_node/internal/crypto/_randomInt.ts";
import {
  validateBoolean,
  validateFunction,
  validateInt32,
  validateObject,
} from "ext:deno_node/internal/validators.mjs";
import {
  isAnyArrayBuffer,
  isArrayBufferView,
} from "ext:deno_node/internal/util/types.ts";
import {
  ERR_INVALID_ARG_TYPE,
  ERR_OUT_OF_RANGE,
} from "ext:deno_node/internal/errors.ts";
import { Buffer } from "node:buffer";

export { default as randomBytes } from "ext:deno_node/internal/crypto/_randomBytes.ts";
export {
  default as randomFill,
  randomFillSync,
} from "ext:deno_node/internal/crypto/_randomFill.mjs";
export { default as randomInt } from "ext:deno_node/internal/crypto/_randomInt.ts";

export type LargeNumberLike =
  | ArrayBufferView
  | SharedArrayBuffer
  | ArrayBuffer
  | bigint;

export interface CheckPrimeOptions {
  /**
   * The number of Miller-Rabin probabilistic primality iterations to perform.
   * When the value is 0 (zero), a number of checks is used that yields a false positive rate of at most 2-64 for random input.
   * Care must be used when selecting a number of checks.
   * Refer to the OpenSSL documentation for the BN_is_prime_ex function nchecks options for more details.
   *
   * @default 0
   */
  checks?: number | undefined;
}

export function checkPrime(
  candidate: LargeNumberLike,
  callback: (err: Error | null, result: boolean) => void,
): void;
export function checkPrime(
  candidate: LargeNumberLike,
  options: CheckPrimeOptions,
  callback: (err: Error | null, result: boolean) => void,
): void;
export function checkPrime(
  candidate: LargeNumberLike,
  options: CheckPrimeOptions | ((err: Error | null, result: boolean) => void) =
    {},
  callback?: (err: Error | null, result: boolean) => void,
) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }

  validateFunction(callback, "callback");
  validateObject(options, "options");

  const {
    checks = 0,
  } = options!;

  validateInt32(checks, "options.checks", 0);

  let op = op_node_check_prime_bytes_async;
  if (typeof candidate === "bigint") {
    op = op_node_check_prime_async;
  } else if (!isAnyArrayBuffer(candidate) && !isArrayBufferView(candidate)) {
    throw new ERR_INVALID_ARG_TYPE(
      "candidate",
      [
        "ArrayBuffer",
        "TypedArray",
        "Buffer",
        "DataView",
        "bigint",
      ],
      candidate,
    );
  }

  op(candidate, checks).then(
    (result) => {
      callback?.(null, result);
    },
  ).catch((err) => {
    callback?.(err, false);
  });
}

export function checkPrimeSync(
  candidate: LargeNumberLike,
  options: CheckPrimeOptions = {},
): boolean {
  validateObject(options, "options");

  const {
    checks = 0,
  } = options!;

  validateInt32(checks, "options.checks", 0);

  if (typeof candidate === "bigint") {
    return op_node_check_prime(candidate, checks);
  } else if (!isAnyArrayBuffer(candidate) && !isArrayBufferView(candidate)) {
    throw new ERR_INVALID_ARG_TYPE(
      "candidate",
      [
        "ArrayBuffer",
        "TypedArray",
        "Buffer",
        "DataView",
        "bigint",
      ],
      candidate,
    );
  }

  return op_node_check_prime_bytes(candidate, checks);
}

export interface GeneratePrimeOptions {
  add?: LargeNumberLike | undefined;
  rem?: LargeNumberLike | undefined;
  /**
   * @default false
   */
  safe?: boolean | undefined;
  bigint?: boolean | undefined;
}

export function generatePrime(
  size: number,
  options: GeneratePrimeOptions = {},
  callback?: (err: Error | null, prime: ArrayBuffer | bigint) => void,
) {
  validateInt32(size, "size", 1);
  if (typeof options === "function") {
    callback = options;
    options = {};
  }
  validateFunction(callback, "callback");
  const {
    bigint,
  } = validateRandomPrimeJob(size, options);
  op_node_gen_prime_async(size).then((prime: Uint8Array) =>
    bigint ? arrayBufferToUnsignedBigInt(prime.buffer) : prime.buffer
  ).then((prime: ArrayBuffer | bigint) => {
    callback?.(null, prime);
  });
}

export function generatePrimeSync(
  size: number,
  options: GeneratePrimeOptions = {},
): ArrayBuffer | bigint {
  const {
    bigint,
  } = validateRandomPrimeJob(size, options);

  const prime = op_node_gen_prime(size);
  if (bigint) return arrayBufferToUnsignedBigInt(prime.buffer);
  return prime.buffer;
}

function validateRandomPrimeJob(
  size: number,
  options: GeneratePrimeOptions,
): GeneratePrimeOptions {
  validateInt32(size, "size", 1);
  validateObject(options, "options");

  let {
    safe = false,
    bigint = false,
    add,
    rem,
  } = options!;

  validateBoolean(safe, "options.safe");
  validateBoolean(bigint, "options.bigint");

  if (add !== undefined) {
    if (typeof add === "bigint") {
      add = unsignedBigIntToBuffer(add, "options.add");
    } else if (!isAnyArrayBuffer(add) && !isArrayBufferView(add)) {
      throw new ERR_INVALID_ARG_TYPE(
        "options.add",
        [
          "ArrayBuffer",
          "TypedArray",
          "Buffer",
          "DataView",
          "bigint",
        ],
        add,
      );
    }
  }

  if (rem !== undefined) {
    if (typeof rem === "bigint") {
      rem = unsignedBigIntToBuffer(rem, "options.rem");
    } else if (!isAnyArrayBuffer(rem) && !isArrayBufferView(rem)) {
      throw new ERR_INVALID_ARG_TYPE(
        "options.rem",
        [
          "ArrayBuffer",
          "TypedArray",
          "Buffer",
          "DataView",
          "bigint",
        ],
        rem,
      );
    }
  }

  // TODO(@littledivy): safe, add and rem options are not implemented.
  if (safe || add || rem) {
    notImplemented("safe, add and rem options are not implemented.");
  }

  return {
    safe,
    bigint,
    add,
    rem,
  };
}

/**
 * 48 is the ASCII code for '0', 97 is the ASCII code for 'a'.
 * @param {number} number An integer between 0 and 15.
 * @returns {number} corresponding to the ASCII code of the hex representation
 *                   of the parameter.
 */
const numberToHexCharCode = (number: number): number =>
  (number < 10 ? 48 : 87) + number;

/**
 * @param {ArrayBuffer} buf An ArrayBuffer.
 * @return {bigint}
 */
function arrayBufferToUnsignedBigInt(buf: ArrayBuffer): bigint {
  const length = buf.byteLength;
  const chars: number[] = Array(length * 2);
  const view = new DataView(buf);

  for (let i = 0; i < length; i++) {
    const val = view.getUint8(i);
    chars[2 * i] = numberToHexCharCode(val >> 4);
    chars[2 * i + 1] = numberToHexCharCode(val & 0xf);
  }

  return BigInt(`0x${String.fromCharCode(...chars)}`);
}

function unsignedBigIntToBuffer(bigint: bigint, name: string) {
  if (bigint < 0) {
    throw new ERR_OUT_OF_RANGE(name, ">= 0", bigint);
  }

  const hex = StringPrototypeToString(bigint, 16);
  const padded = StringPrototypePadStart(hex, hex.length + (hex.length % 2), 0);
  return Buffer.from(padded, "hex");
}

export const randomUUID = () => globalThis.crypto.randomUUID();

export default {
  checkPrime,
  checkPrimeSync,
  generatePrime,
  generatePrimeSync,
  randomUUID,
  randomInt,
  randomBytes,
  randomFill,
  randomFillSync,
};
