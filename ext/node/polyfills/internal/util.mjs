// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { validateFunction } from "ext:deno_node/internal/validators.mjs";
import {
  normalizeEncoding,
  slowCases,
} from "ext:deno_node/internal/normalize_encoding.mjs";
export { normalizeEncoding, slowCases };
import {
  ObjectCreate,
  StringPrototypeToUpperCase,
} from "ext:deno_node/internal/primordials.mjs";
import { ERR_UNKNOWN_SIGNAL } from "ext:deno_node/internal/errors.ts";
import { os } from "ext:deno_node/internal_binding/constants.ts";
import { primordials } from "ext:core/mod.js";
const {
  SafeWeakRef,
} = primordials;

export const customInspectSymbol = Symbol.for("nodejs.util.inspect.custom");
export const kEnumerableProperty = Object.create(null);
kEnumerableProperty.enumerable = true;

export const kEmptyObject = Object.freeze(Object.create(null));

export function once(callback) {
  let called = false;
  return function (...args) {
    if (called) return;
    called = true;
    Reflect.apply(callback, this, args);
  };
}

export function createDeferredPromise() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

// In addition to being accessible through util.promisify.custom,
// this symbol is registered globally and can be accessed in any environment as
// Symbol.for('nodejs.util.promisify.custom').
const kCustomPromisifiedSymbol = Symbol.for("nodejs.util.promisify.custom");
// This is an internal Node symbol used by functions returning multiple
// arguments, e.g. ['bytesRead', 'buffer'] for fs.read().
const kCustomPromisifyArgsSymbol = Symbol.for(
  "nodejs.util.promisify.customArgs",
);

export const customPromisifyArgs = kCustomPromisifyArgsSymbol;

export function promisify(
  original,
) {
  validateFunction(original, "original");
  if (original[kCustomPromisifiedSymbol]) {
    const fn = original[kCustomPromisifiedSymbol];

    validateFunction(fn, "util.promisify.custom");

    return Object.defineProperty(fn, kCustomPromisifiedSymbol, {
      value: fn,
      enumerable: false,
      writable: false,
      configurable: true,
    });
  }

  // Names to create an object from in case the callback receives multiple
  // arguments, e.g. ['bytesRead', 'buffer'] for fs.read.
  const argumentNames = original[kCustomPromisifyArgsSymbol];
  function fn(...args) {
    return new Promise((resolve, reject) => {
      args.push((err, ...values) => {
        if (err) {
          return reject(err);
        }
        if (argumentNames !== undefined && values.length > 1) {
          const obj = {};
          for (let i = 0; i < argumentNames.length; i++) {
            obj[argumentNames[i]] = values[i];
          }
          resolve(obj);
        } else {
          resolve(values[0]);
        }
      });
      Reflect.apply(original, this, args);
    });
  }

  Object.setPrototypeOf(fn, Object.getPrototypeOf(original));

  Object.defineProperty(fn, kCustomPromisifiedSymbol, {
    value: fn,
    enumerable: false,
    writable: false,
    configurable: true,
  });
  return Object.defineProperties(
    fn,
    Object.getOwnPropertyDescriptors(original),
  );
}

let signalsToNamesMapping;
function getSignalsToNamesMapping() {
  if (signalsToNamesMapping !== undefined) {
    return signalsToNamesMapping;
  }

  signalsToNamesMapping = ObjectCreate(null);
  for (const key in os.signals) {
    signalsToNamesMapping[os.signals[key]] = key;
  }

  return signalsToNamesMapping;
}

export function convertToValidSignal(signal) {
  if (typeof signal === "number" && getSignalsToNamesMapping()[signal]) {
    return signal;
  }

  if (typeof signal === "string") {
    const signalName = os.signals[StringPrototypeToUpperCase(signal)];
    if (signalName) return signalName;
  }

  throw new ERR_UNKNOWN_SIGNAL(signal);
}

export class WeakReference {
  #weak = null;
  #strong = null;
  #refCount = 0;
  constructor(object) {
    this.#weak = new SafeWeakRef(object);
  }

  incRef() {
    this.#refCount++;
    if (this.#refCount === 1) {
      const derefed = this.#weak.deref();
      if (derefed !== undefined) {
        this.#strong = derefed;
      }
    }
    return this.#refCount;
  }

  decRef() {
    this.#refCount--;
    if (this.#refCount === 0) {
      this.#strong = null;
    }
    return this.#refCount;
  }

  get() {
    return this.#weak.deref();
  }
}

promisify.custom = kCustomPromisifiedSymbol;

export default {
  convertToValidSignal,
  createDeferredPromise,
  customInspectSymbol,
  customPromisifyArgs,
  kEmptyObject,
  kEnumerableProperty,
  normalizeEncoding,
  once,
  promisify,
  slowCases,
};
