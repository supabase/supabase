// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { primordials } from "ext:core/mod.js";
const {
  Error,
  PromisePrototypeThen,
  ArrayPrototypePop,
  StringPrototypeToLowerCase,
  NumberIsInteger,
  ObjectGetOwnPropertyNames,
  ReflectGetOwnPropertyDescriptor,
  ObjectDefineProperty,
  NumberIsSafeInteger,
  FunctionPrototypeApply,
  SafeArrayIterator,
} = primordials;
import { TextDecoder, TextEncoder } from "ext:deno_web/08_text_encoding.js";
import { errorMap } from "ext:deno_node/internal_binding/uv.ts";
import { codes } from "ext:deno_node/internal/error_codes.ts";
import { ERR_NOT_IMPLEMENTED } from "ext:deno_node/internal/errors.ts";

export type BinaryEncodings = "binary";

export type TextEncodings =
  | "ascii"
  | "utf8"
  | "utf-8"
  | "utf16le"
  | "ucs2"
  | "ucs-2"
  | "base64"
  | "latin1"
  | "hex";

export type Encodings = BinaryEncodings | TextEncodings;

export function notImplemented(msg: string): never {
  throw new ERR_NOT_IMPLEMENTED(msg);
}

export function warnNotImplemented(msg?: string) {
  const message = msg
    ? `Warning: Not implemented: ${msg}`
    : "Warning: Not implemented";
  // deno-lint-ignore no-console
  console.warn(message);
}

export type _TextDecoder = typeof TextDecoder.prototype;
export const _TextDecoder = TextDecoder;

export type _TextEncoder = typeof TextEncoder.prototype;
export const _TextEncoder = TextEncoder;

// API helpers

export type MaybeNull<T> = T | null;
export type MaybeDefined<T> = T | undefined;
export type MaybeEmpty<T> = T | null | undefined;

export function intoCallbackAPI<T>(
  // deno-lint-ignore no-explicit-any
  func: (...args: any[]) => Promise<T>,
  cb: MaybeEmpty<(err: MaybeNull<Error>, value?: MaybeEmpty<T>) => void>,
  // deno-lint-ignore no-explicit-any
  ...args: any[]
) {
  PromisePrototypeThen(
    func(...new SafeArrayIterator(args)),
    (value: T) => cb && cb(null, value),
    (err: MaybeNull<Error>) => cb && cb(err),
  );
}

export function intoCallbackAPIWithIntercept<T1, T2>(
  // deno-lint-ignore no-explicit-any
  func: (...args: any[]) => Promise<T1>,
  interceptor: (v: T1) => T2,
  cb: MaybeEmpty<(err: MaybeNull<Error>, value?: MaybeEmpty<T2>) => void>,
  // deno-lint-ignore no-explicit-any
  ...args: any[]
) {
  PromisePrototypeThen(
    func(...new SafeArrayIterator(args)),
    (value: T1) => cb && cb(null, interceptor(value)),
    (err: MaybeNull<Error>) => cb && cb(err),
  );
}

export function spliceOne(list: string[], index: number) {
  for (; index + 1 < list.length; index++) {
    list[index] = list[index + 1];
  }
  ArrayPrototypePop(list);
}

// Taken from: https://github.com/nodejs/node/blob/ba684805b6c0eded76e5cd89ee00328ac7a59365/lib/internal/util.js#L125
// Return undefined if there is no match.
// Move the "slow cases" to a separate function to make sure this function gets
// inlined properly. That prioritizes the common case.
export function normalizeEncoding(
  enc: string | null,
): TextEncodings | undefined {
  if (enc == null || enc === "utf8" || enc === "utf-8") return "utf8";
  return slowCases(enc);
}

// https://github.com/nodejs/node/blob/ba684805b6c0eded76e5cd89ee00328ac7a59365/lib/internal/util.js#L130
function slowCases(enc: string): TextEncodings | undefined {
  switch (enc.length) {
    case 4:
      if (enc === "UTF8") return "utf8";
      if (enc === "ucs2" || enc === "UCS2") return "utf16le";
      enc = StringPrototypeToLowerCase(enc);
      if (enc === "utf8") return "utf8";
      if (enc === "ucs2") return "utf16le";
      break;
    case 3:
      if (
        enc === "hex" || enc === "HEX" ||
        StringPrototypeToLowerCase(enc) === "hex"
      ) {
        return "hex";
      }
      break;
    case 5:
      if (enc === "ascii") return "ascii";
      if (enc === "ucs-2") return "utf16le";
      if (enc === "UTF-8") return "utf8";
      if (enc === "ASCII") return "ascii";
      if (enc === "UCS-2") return "utf16le";
      enc = StringPrototypeToLowerCase(enc);
      if (enc === "utf-8") return "utf8";
      if (enc === "ascii") return "ascii";
      if (enc === "ucs-2") return "utf16le";
      break;
    case 6:
      if (enc === "base64") return "base64";
      if (enc === "latin1" || enc === "binary") return "latin1";
      if (enc === "BASE64") return "base64";
      if (enc === "LATIN1" || enc === "BINARY") return "latin1";
      enc = StringPrototypeToLowerCase(enc);
      if (enc === "base64") return "base64";
      if (enc === "latin1" || enc === "binary") return "latin1";
      break;
    case 7:
      if (
        enc === "utf16le" ||
        enc === "UTF16LE" ||
        StringPrototypeToLowerCase(enc) === "utf16le"
      ) {
        return "utf16le";
      }
      break;
    case 8:
      if (
        enc === "utf-16le" ||
        enc === "UTF-16LE" ||
        StringPrototypeToLowerCase(enc) === "utf-16le"
      ) {
        return "utf16le";
      }
      break;
    default:
      if (enc === "") return "utf8";
  }
}

export function validateIntegerRange(
  value: number,
  name: string,
  min = -2147483648,
  max = 2147483647,
) {
  // The defaults for min and max correspond to the limits of 32-bit integers.
  if (!NumberIsInteger(value)) {
    throw new Error(`${name} must be 'an integer' but was ${value}`);
  }

  if (value < min || value > max) {
    throw new Error(
      `${name} must be >= ${min} && <= ${max}. Value was ${value}`,
    );
  }
}

type OptionalSpread<T> = T extends undefined ? []
  : [T];

export function once<T = undefined>(
  callback: (...args: OptionalSpread<T>) => void,
) {
  let called = false;
  return function (this: unknown, ...args: OptionalSpread<T>) {
    if (called) return;
    called = true;
    FunctionPrototypeApply(callback, this, args);
  };
}

export function makeMethodsEnumerable(klass: { new (): unknown }) {
  const proto = klass.prototype;
  const names = ObjectGetOwnPropertyNames(proto);
  for (let i = 0; i < names.length; i++) {
    const key = names[i];
    const value = proto[key];
    if (typeof value === "function") {
      const desc = ReflectGetOwnPropertyDescriptor(proto, key);
      if (desc) {
        desc.enumerable = true;
        ObjectDefineProperty(proto, key, desc);
      }
    }
  }
}

/**
 * Returns a system error name from an error code number.
 * @param code error code number
 */
export function getSystemErrorName(code: number): string | undefined {
  if (typeof code !== "number") {
    throw new codes.ERR_INVALID_ARG_TYPE("err", "number", code);
  }
  if (code >= 0 || !NumberIsSafeInteger(code)) {
    throw new codes.ERR_OUT_OF_RANGE("err", "a negative integer", code);
  }
  return errorMap.get(code)?.[0];
}
