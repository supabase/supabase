// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { primordials } from "ext:core/mod.js";
const {
  ArrayIsArray,
  ArrayPrototypeJoin,
  Date,
  DatePrototypeGetDate,
  DatePrototypeGetHours,
  DatePrototypeGetMinutes,
  DatePrototypeGetMonth,
  DatePrototypeGetSeconds,
  ErrorPrototype,
  NumberPrototypeToString,
  ObjectDefineProperty,
  ObjectKeys,
  ObjectPrototypeIsPrototypeOf,
  ObjectPrototypeToString,
  ObjectSetPrototypeOf,
  ReflectApply,
  ReflectConstruct,
  SafeSet,
  SetPrototypeAdd,
  SetPrototypeHas,
  StringPrototypeIsWellFormed,
  StringPrototypePadStart,
  StringPrototypeToWellFormed,
  PromiseResolve,
} = primordials;

import {
  createDeferredPromise,
  promisify,
} from "ext:deno_node/internal/util.mjs";
import { callbackify } from "ext:deno_node/_util/_util_callbackify.js";
import { debuglog } from "ext:deno_node/internal/util/debuglog.ts";
import {
  format,
  formatWithOptions,
  inspect,
  stripVTControlCharacters,
  styleText,
} from "ext:deno_node/internal/util/inspect.mjs";
import { codes } from "ext:deno_node/internal/error_codes.ts";
import types from "node:util/types";
import { Buffer } from "node:buffer";
import { isDeepStrictEqual } from "ext:deno_node/internal/util/comparisons.ts";
import process from "node:process";
import {
  validateAbortSignal,
  validateString,
} from "ext:deno_node/internal/validators.mjs";
import { parseArgs } from "ext:deno_node/internal/util/parse_args/parse_args.js";
import * as abortSignal from "ext:deno_web/03_abort_signal.js";
import { ERR_INVALID_ARG_TYPE } from "ext:deno_node/internal/errors.ts";

export {
  callbackify,
  debuglog,
  debuglog as debug,
  format,
  formatWithOptions,
  inspect,
  parseArgs,
  promisify,
  stripVTControlCharacters,
  styleText,
  types,
};

/** @deprecated - use `Array.isArray()` instead. */
export const isArray = ArrayIsArray;

/** @deprecated - use `typeof value === "boolean" instead. */
export function isBoolean(value: unknown): boolean {
  return typeof value === "boolean";
}

/** @deprecated - use `value === null` instead. */
export function isNull(value: unknown): boolean {
  return value === null;
}

/** @deprecated - use `value === null || value === undefined` instead. */
export function isNullOrUndefined(value: unknown): boolean {
  return value === null || value === undefined;
}

/** @deprecated - use `typeof value === "number" instead. */
export function isNumber(value: unknown): boolean {
  return typeof value === "number";
}

/** @deprecated - use `typeof value === "string" instead. */
export function isString(value: unknown): boolean {
  return typeof value === "string";
}

/** @deprecated - use `typeof value === "symbol"` instead. */
export function isSymbol(value: unknown): boolean {
  return typeof value === "symbol";
}

/** @deprecated - use `value === undefined` instead. */
export function isUndefined(value: unknown): boolean {
  return value === undefined;
}

/** @deprecated - use `value !== null && typeof value === "object"` instead. */
export function isObject(value: unknown): boolean {
  return value !== null && typeof value === "object";
}

/** @deprecated - use `e instanceof Error` instead. */
export function isError(e: unknown): boolean {
  return ObjectPrototypeToString(e) === "[object Error]" ||
    ObjectPrototypeIsPrototypeOf(ErrorPrototype, e);
}

/** @deprecated - use `typeof value === "function"` instead. */
export function isFunction(value: unknown): boolean {
  return typeof value === "function";
}

/** @deprecated Use util.types.isRegExp() instead. */
export const isRegExp = types.isRegExp;

/** @deprecated Use util.types.isDate() instead. */
export const isDate = types.isDate;

/** @deprecated - use `value === null || (typeof value !== "object" && typeof value !== "function")` instead. */
export function isPrimitive(value: unknown): boolean {
  return (
    value === null || (typeof value !== "object" && typeof value !== "function")
  );
}

/** @deprecated  Use Buffer.isBuffer() instead. */
export const isBuffer = Buffer.isBuffer;

/** @deprecated Use Object.assign() instead. */
export function _extend(
  target: Record<string, unknown>,
  source: unknown,
): Record<string, unknown> {
  // Don't do anything if source isn't an object
  if (source === null || typeof source !== "object") return target;

  const keys = ObjectKeys(source!);
  let i = keys.length;
  while (i--) {
    target[keys[i]] = (source as Record<string, unknown>)[keys[i]];
  }
  return target;
}

/**
 * https://nodejs.org/api/util.html#util_util_inherits_constructor_superconstructor
 * @param ctor Constructor function which needs to inherit the prototype.
 * @param superCtor Constructor function to inherit prototype from.
 */
export function inherits<T, U>(
  ctor: new (...args: unknown[]) => T,
  superCtor: new (...args: unknown[]) => U,
) {
  if (ctor === undefined || ctor === null) {
    throw new codes.ERR_INVALID_ARG_TYPE("ctor", "Function", ctor);
  }

  if (superCtor === undefined || superCtor === null) {
    throw new codes.ERR_INVALID_ARG_TYPE("superCtor", "Function", superCtor);
  }

  if (superCtor.prototype === undefined) {
    throw new codes.ERR_INVALID_ARG_TYPE(
      "superCtor.prototype",
      "Object",
      superCtor.prototype,
    );
  }
  ObjectDefineProperty(ctor, "super_", {
    __proto__: null,
    value: superCtor,
    writable: true,
    configurable: true,
  });
  ObjectSetPrototypeOf(ctor.prototype, superCtor.prototype);
}

import {
  _TextDecoder,
  _TextEncoder,
  getSystemErrorName,
} from "ext:deno_node/_utils.ts";

/** The global TextDecoder */
export type TextDecoder = import("./_utils.ts")._TextDecoder;
export const TextDecoder = _TextDecoder;

/** The global TextEncoder */
export type TextEncoder = import("./_utils.ts")._TextEncoder;
export const TextEncoder = _TextEncoder;

export function toUSVString(str: string): string {
  if (StringPrototypeIsWellFormed(str)) {
    return str;
  }
  return StringPrototypeToWellFormed(str);
}

function pad(n: number) {
  return StringPrototypePadStart(NumberPrototypeToString(n), 2, "0");
}

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * @returns 26 Feb 16:19:34
 */
function timestamp(): string {
  const d = new Date();
  const t = ArrayPrototypeJoin([
    pad(DatePrototypeGetHours(d)),
    pad(DatePrototypeGetMinutes(d)),
    pad(DatePrototypeGetSeconds(d)),
  ], ":");
  return `${DatePrototypeGetDate(d)} ${months[DatePrototypeGetMonth(d)]} ${t}`;
}

/**
 * Log is just a thin wrapper to console.log that prepends a timestamp
 * @deprecated
 */
// deno-lint-ignore no-explicit-any
export function log(...args: any[]) {
  // deno-lint-ignore no-console
  console.log("%s - %s", timestamp(), ReflectApply(format, undefined, args));
}

// Keep a list of deprecation codes that have been warned on so we only warn on
// each one once.
const codesWarned = new SafeSet();

// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
// deno-lint-ignore no-explicit-any
export function deprecate(fn: any, msg: string, code?: any) {
  if (process.noDeprecation === true) {
    return fn;
  }

  if (code !== undefined) {
    validateString(code, "code");
  }

  let warned = false;
  // deno-lint-ignore no-explicit-any
  function deprecated(this: any, ...args: any[]) {
    if (!warned) {
      warned = true;
      if (code !== undefined) {
        if (!SetPrototypeHas(codesWarned, code)) {
          process.emitWarning(msg, "DeprecationWarning", code, deprecated);
          SetPrototypeAdd(codesWarned, code);
        }
      } else {
        // deno-lint-ignore no-explicit-any
        process.emitWarning(msg, "DeprecationWarning", deprecated as any);
      }
    }
    if (new.target) {
      return ReflectConstruct(fn, args, new.target);
    }
    return ReflectApply(fn, this, args);
  }

  // The wrapper will keep the same prototype as fn to maintain prototype chain
  ObjectSetPrototypeOf(deprecated, fn);
  if (fn.prototype) {
    // Setting this (rather than using Object.setPrototype, as above) ensures
    // that calling the unwrapped constructor gives an instanceof the wrapped
    // constructor.
    deprecated.prototype = fn.prototype;
  }

  return deprecated;
}

// deno-lint-ignore require-await
export async function aborted(
  signal: AbortSignal,
  // deno-lint-ignore no-explicit-any
  _resource: any,
): Promise<void> {
  if (signal === undefined) {
    throw new ERR_INVALID_ARG_TYPE("signal", "AbortSignal", signal);
  }
  validateAbortSignal(signal, "signal");
  if (signal.aborted) {
    return PromiseResolve();
  }
  const abortPromise = createDeferredPromise();
  signal[abortSignal.add](abortPromise.resolve);
  return abortPromise.promise;
}

export { getSystemErrorName, isDeepStrictEqual };

export default {
  format,
  formatWithOptions,
  inspect,
  isArray,
  isBoolean,
  isNull,
  isNullOrUndefined,
  isNumber,
  isString,
  isSymbol,
  isUndefined,
  isObject,
  isError,
  isFunction,
  isRegExp,
  isDate,
  isPrimitive,
  isBuffer,
  _extend,
  getSystemErrorName,
  aborted,
  deprecate,
  callbackify,
  parseArgs,
  promisify,
  inherits,
  types,
  stripVTControlCharacters,
  TextDecoder,
  TextEncoder,
  toUSVString,
  log,
  debuglog,
  debug: debuglog,
  isDeepStrictEqual,
  styleText,
};
