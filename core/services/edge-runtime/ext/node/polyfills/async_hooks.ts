// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { core, primordials } from "ext:core/mod.js";
import { validateFunction } from "ext:deno_node/internal/validators.mjs";
import { newAsyncId } from "ext:deno_node/internal/async_hooks.ts";

const {
  ObjectDefineProperties,
  ReflectApply,
  FunctionPrototypeBind,
  ArrayPrototypeUnshift,
  ObjectFreeze,
} = primordials;

const {
  AsyncVariable,
  getAsyncContext,
  setAsyncContext,
} = core;

export class AsyncResource {
  type: string;
  #snapshot: unknown;
  #asyncId: number;

  constructor(type: string) {
    this.type = type;
    this.#snapshot = getAsyncContext();
    this.#asyncId = newAsyncId();
  }

  asyncId() {
    return this.#asyncId;
  }

  runInAsyncScope(
    fn: (...args: unknown[]) => unknown,
    thisArg: unknown,
    ...args: unknown[]
  ) {
    const previousContext = getAsyncContext();
    try {
      setAsyncContext(this.#snapshot);
      return ReflectApply(fn, thisArg, args);
    } finally {
      setAsyncContext(previousContext);
    }
  }

  emitDestroy() {}

  bind(fn: (...args: unknown[]) => unknown, thisArg) {
    validateFunction(fn, "fn");
    let bound;
    if (thisArg === undefined) {
      // deno-lint-ignore no-this-alias
      const resource = this;
      bound = function (...args) {
        ArrayPrototypeUnshift(args, fn, this);
        return ReflectApply(resource.runInAsyncScope, resource, args);
      };
    } else {
      bound = FunctionPrototypeBind(this.runInAsyncScope, this, fn, thisArg);
    }
    ObjectDefineProperties(bound, {
      "length": {
        __proto__: null,
        configurable: true,
        enumerable: false,
        value: fn.length,
        writable: false,
      },
    });
    return bound;
  }

  static bind(
    fn: (...args: unknown[]) => unknown,
    type?: string,
    thisArg?: AsyncResource,
  ) {
    type = type || fn.name || "bound-anonymous-fn";
    return (new AsyncResource(type)).bind(fn, thisArg);
  }
}

export class AsyncLocalStorage {
  #variable = new AsyncVariable();
  enabled = false;

  // deno-lint-ignore no-explicit-any
  run(store: any, callback: any, ...args: any[]): any {
    this.enabled = true;
    const previous = this.#variable.enter(store);
    try {
      return ReflectApply(callback, null, args);
    } finally {
      setAsyncContext(previous);
    }
  }

  // deno-lint-ignore no-explicit-any
  exit(callback: (...args: unknown[]) => any, ...args: any[]): any {
    if (!this.enabled) {
      return ReflectApply(callback, null, args);
    }
    this.enabled = false;
    try {
      return ReflectApply(callback, null, args);
    } finally {
      this.enabled = true;
    }
  }

  // deno-lint-ignore no-explicit-any
  getStore(): any {
    if (!this.enabled) {
      return undefined;
    }
    return this.#variable.get();
  }

  enterWith(store: unknown) {
    this.enabled = true;
    this.#variable.enter(store);
  }

  disable() {
    this.enabled = false;
  }

  static bind(fn: (...args: unknown[]) => unknown) {
    return AsyncResource.bind(fn);
  }

  static snapshot() {
    return AsyncLocalStorage.bind((
      cb: (...args: unknown[]) => unknown,
      ...args: unknown[]
    ) => ReflectApply(cb, null, args));
  }
}

export function executionAsyncId() {
  return 0;
}

export function triggerAsyncId() {
  return 0;
}

export function executionAsyncResource() {
  return {};
}

export const asyncWrapProviders = ObjectFreeze({
  __proto__: null,
  NONE: 0,
  DIRHANDLE: 1,
  DNSCHANNEL: 2,
  ELDHISTOGRAM: 3,
  FILEHANDLE: 4,
  FILEHANDLECLOSEREQ: 5,
  BLOBREADER: 6,
  FSEVENTWRAP: 7,
  FSREQCALLBACK: 8,
  FSREQPROMISE: 9,
  GETADDRINFOREQWRAP: 10,
  GETNAMEINFOREQWRAP: 11,
  HEAPSNAPSHOT: 12,
  HTTP2SESSION: 13,
  HTTP2STREAM: 14,
  HTTP2PING: 15,
  HTTP2SETTINGS: 16,
  HTTPINCOMINGMESSAGE: 17,
  HTTPCLIENTREQUEST: 18,
  JSSTREAM: 19,
  JSUDPWRAP: 20,
  MESSAGEPORT: 21,
  PIPECONNECTWRAP: 22,
  PIPESERVERWRAP: 23,
  PIPEWRAP: 24,
  PROCESSWRAP: 25,
  PROMISE: 26,
  QUERYWRAP: 27,
  QUIC_ENDPOINT: 28,
  QUIC_LOGSTREAM: 29,
  QUIC_PACKET: 30,
  QUIC_SESSION: 31,
  QUIC_STREAM: 32,
  QUIC_UDP: 33,
  SHUTDOWNWRAP: 34,
  SIGNALWRAP: 35,
  STATWATCHER: 36,
  STREAMPIPE: 37,
  TCPCONNECTWRAP: 38,
  TCPSERVERWRAP: 39,
  TCPWRAP: 40,
  TTYWRAP: 41,
  UDPSENDWRAP: 42,
  UDPWRAP: 43,
  SIGINTWATCHDOG: 44,
  WORKER: 45,
  WORKERHEAPSNAPSHOT: 46,
  WRITEWRAP: 47,
  ZLIB: 48,
  CHECKPRIMEREQUEST: 49,
  PBKDF2REQUEST: 50,
  KEYPAIRGENREQUEST: 51,
  KEYGENREQUEST: 52,
  KEYEXPORTREQUEST: 53,
  CIPHERREQUEST: 54,
  DERIVEBITSREQUEST: 55,
  HASHREQUEST: 56,
  RANDOMBYTESREQUEST: 57,
  RANDOMPRIMEREQUEST: 58,
  SCRYPTREQUEST: 59,
  SIGNREQUEST: 60,
  TLSWRAP: 61,
  VERIFYREQUEST: 62,
});

class AsyncHook {
  enable() {
  }

  disable() {
  }
}

export function createHook() {
  return new AsyncHook();
}

export default {
  AsyncLocalStorage,
  createHook,
  executionAsyncId,
  triggerAsyncId,
  executionAsyncResource,
  asyncWrapProviders,
  AsyncResource,
};
