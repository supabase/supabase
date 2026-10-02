// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// This code has been inspired by https://github.com/bevry/domain-browser/commit/8bce7f4a093966ca850da75b024239ad5d0b33c6

import { primordials } from "ext:core/mod.js";
const {
  ArrayPrototypeSlice,
  FunctionPrototypeBind,
  FunctionPrototypeCall,
  FunctionPrototypeApply,
} = primordials;
import { EventEmitter } from "node:events";

function emitError(e) {
  this.emit("error", e);
}

// TODO(bartlomieju): maybe use this one
// deno-lint-ignore prefer-const
let stack = [];
export const _stack = stack;
export const active = null;

export function create() {
  return new Domain();
}

export function createDomain() {
  return new Domain();
}

export class Domain extends EventEmitter {
  #handler;

  constructor() {
    super();
    this.#handler = FunctionPrototypeBind(emitError, this);
  }

  add(emitter) {
    emitter.on("error", this.#handler);
  }

  remove(emitter) {
    emitter.off("error", this.#handler);
  }

  bind(fn) {
    // deno-lint-ignore no-this-alias
    const self = this;
    return function () {
      try {
        FunctionPrototypeApply(fn, null, ArrayPrototypeSlice(arguments));
      } catch (e) {
        FunctionPrototypeCall(emitError, self, e);
      }
    };
  }

  intercept(fn) {
    // deno-lint-ignore no-this-alias
    const self = this;
    return function (e) {
      if (e) {
        FunctionPrototypeCall(emitError, self, e);
      } else {
        try {
          FunctionPrototypeApply(fn, null, ArrayPrototypeSlice(arguments, 1));
        } catch (e) {
          FunctionPrototypeCall(emitError, self, e);
        }
      }
    };
  }

  run(fn) {
    try {
      fn();
    } catch (e) {
      FunctionPrototypeCall(emitError, this, e);
    }
    return this;
  }

  dispose() {
    this.removeAllListeners();
    return this;
  }

  enter() {
    return this;
  }

  exit() {
    return this;
  }
}
export default {
  _stack,
  create,
  active,
  createDomain,
  Domain,
};
