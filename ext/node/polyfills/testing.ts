// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { primordials } from "ext:core/mod.js";
const { PromisePrototypeThen } = primordials;
import { notImplemented, warnNotImplemented } from "ext:deno_node/_utils.ts";

export function run() {
  notImplemented("test.run");
}

function noop() {}

class NodeTestContext {
  #denoContext: Deno.TestContext;

  constructor(t: Deno.TestContext) {
    this.#denoContext = t;
  }

  get signal() {
    notImplemented("test.TestContext.signal");
    return null;
  }

  get name() {
    notImplemented("test.TestContext.name");
    return null;
  }

  diagnostic(message) {
    // deno-lint-ignore no-console
    console.log("DIAGNOSTIC:", message);
  }

  get mock() {
    notImplemented("test.TestContext.mock");
    return null;
  }

  runOnly() {
    notImplemented("test.TestContext.runOnly");
    return null;
  }

  skip() {
    warnNotImplemented("test.TestContext.skip");
    return null;
  }

  todo() {
    warnNotImplemented("test.TestContext.todo");
    return null;
  }

  test(name, options, fn) {
    const prepared = prepareOptions(name, options, fn, {});
    return PromisePrototypeThen(
      this.#denoContext.step({
        name: prepared.name,
        fn: async (denoTestContext) => {
          const newNodeTextContext = new NodeTestContext(denoTestContext);
          await prepared.fn(newNodeTextContext);
        },
        ignore: prepared.options.todo || prepared.options.skip,
        sanitizeExit: false,
        sanitizeOps: false,
        sanitizeResources: false,
      }),
      () => undefined,
    );
  }

  before(_fn, _options) {
    notImplemented("test.TestContext.before");
  }

  after(_fn, _options) {
    notImplemented("test.TestContext.after");
  }

  beforeEach(_fn, _options) {
    notImplemented("test.TestContext.beforeEach");
  }

  afterEach(_fn, _options) {
    notImplemented("test.TestContext.afterEach");
  }
}

function prepareOptions(name, options, fn, overrides) {
  if (typeof name === "function") {
    fn = name;
  } else if (name !== null && typeof name === "object") {
    fn = options;
    options = name;
  } else if (typeof options === "function") {
    fn = options;
  }

  if (options === null || typeof options !== "object") {
    options = {};
  }

  const finalOptions = { ...options, ...overrides };
  // TODO(bartlomieju): these options are currently not handled
  // const { concurrency, timeout, signal } = finalOptions;

  if (typeof fn !== "function") {
    fn = noop;
  }

  if (typeof name !== "string" || name === "") {
    name = fn.name || "<anonymous>";
  }

  return { fn, options: finalOptions, name };
}

function wrapTestFn(fn, resolve) {
  return async function (t) {
    const nodeTestContext = new NodeTestContext(t);
    try {
      await fn(nodeTestContext);
    } finally {
      resolve();
    }
  };
}

function prepareDenoTest(name, options, fn, overrides) {
  const prepared = prepareOptions(name, options, fn, overrides);

  // TODO(iuioiua): Update once there's a primordial for `Promise.withResolvers()`.
  // deno-lint-ignore prefer-primordials
  const { promise, resolve } = Promise.withResolvers();

  const denoTestOptions = {
    name: prepared.name,
    fn: wrapTestFn(prepared.fn, resolve),
    only: prepared.options.only,
    ignore: prepared.options.todo || prepared.options.skip,
    sanitizeExit: false,
    sanitizeOps: false,
    sanitizeResources: false,
  };
  Deno.test(denoTestOptions);
  return promise;
}

export function test(name, options, fn) {
  return prepareDenoTest(name, options, fn, {});
}

test.skip = function skip(name, options, fn) {
  return prepareDenoTest(name, options, fn, { skip: true });
};

test.todo = function todo(name, options, fn) {
  return prepareDenoTest(name, options, fn, { todo: true });
};

test.only = function only(name, options, fn) {
  return prepareDenoTest(name, options, fn, { only: true });
};

export function describe() {
  notImplemented("test.describe");
}

export function it() {
  notImplemented("test.it");
}

export function before() {
  notImplemented("test.before");
}

export function after() {
  notImplemented("test.after");
}

export function beforeEach() {
  notImplemented("test.beforeEach");
}

export function afterEach() {
  notImplemented("test.afterEach");
}

export const mock = {
  fn: () => {
    notImplemented("test.mock.fn");
  },
  getter: () => {
    notImplemented("test.mock.getter");
  },
  method: () => {
    notImplemented("test.mock.method");
  },
  reset: () => {
    notImplemented("test.mock.reset");
  },
  restoreAll: () => {
    notImplemented("test.mock.restoreAll");
  },
  setter: () => {
    notImplemented("test.mock.setter");
  },
  timers: {
    enable: () => {
      notImplemented("test.mock.timers.enable");
    },
    reset: () => {
      notImplemented("test.mock.timers.reset");
    },
    tick: () => {
      notImplemented("test.mock.timers.tick");
    },
    runAll: () => {
      notImplemented("test.mock.timers.runAll");
    },
  },
};

export default test;
