// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
//
// Adapted from Node.js. Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// These are simplified versions of the "real" errors in Node.

import { primordials } from "ext:core/mod.js";
const {
  ArrayPrototypePop,
  Error,
  FunctionPrototypeBind,
  ReflectApply,
  ObjectDefineProperties,
  ObjectGetOwnPropertyDescriptors,
  ObjectSetPrototypeOf,
  ObjectValues,
  PromisePrototypeThen,
} = primordials;

import { nextTick } from "ext:deno_node/_next_tick.ts";
import { validateFunction } from "ext:deno_node/internal/validators.mjs";

class NodeFalsyValueRejectionError extends Error {
  code = "ERR_FALSY_VALUE_REJECTION";
  constructor(reason) {
    super("Promise was rejected with falsy value");
    this.reason = reason;
  }
}

function callbackify(original) {
  validateFunction(original, "original");

  // We DO NOT return the promise as it gives the user a false sense that
  // the promise is actually somehow related to the callback's execution
  // and that the callback throwing will reject the promise.
  function callbackified(...args) {
    const maybeCb = ArrayPrototypePop(args);
    validateFunction(maybeCb, "last argument");
    const cb = FunctionPrototypeBind(maybeCb, this);
    // In true node style we process the callback on `nextTick` with all the
    // implications (stack, `uncaughtException`, `async_hooks`)
    PromisePrototypeThen(
      ReflectApply(original, this, args),
      (ret) => nextTick(cb, null, ret),
      (rej) => {
        rej = rej || new NodeFalsyValueRejectionError(rej);
        return nextTick(cb, rej);
      },
    );
  }

  const descriptors = ObjectGetOwnPropertyDescriptors(original);
  // It is possible to manipulate a functions `length` or `name` property. This
  // guards against the manipulation.
  if (typeof descriptors.length.value === "number") {
    descriptors.length.value++;
  }
  if (typeof descriptors.name.value === "string") {
    descriptors.name.value += "Callbackified";
  }
  const propertiesValues = ObjectValues(descriptors);
  for (let i = 0; i < propertiesValues.length; i++) {
    // We want to use null-prototype objects to not rely on globally mutable
    // %Object.prototype%.
    ObjectSetPrototypeOf(propertiesValues[i], null);
  }
  ObjectDefineProperties(callbackified, descriptors);
  return callbackified;
}

export { callbackify };
