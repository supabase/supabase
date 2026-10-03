// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { primordials } from "ext:core/mod.js";
const {
  MapPrototypeGet,
  MapPrototypeDelete,
  ObjectDefineProperty,
  Promise,
  SafeArrayIterator,
} = primordials;

import {
  activeTimers,
  Immediate,
  setUnrefTimeout,
  Timeout,
} from "ext:deno_node/internal/timers.mjs";
import {
  validateAbortSignal,
  validateBoolean,
  validateFunction,
  validateObject,
} from "ext:deno_node/internal/validators.mjs";
import { promisify } from "ext:deno_node/internal/util.mjs";
export { setUnrefTimeout } from "ext:deno_node/internal/timers.mjs";
import * as timers from "ext:deno_web/02_timers.js";
import { AbortError } from "ext:deno_node/internal/errors.ts";

const clearTimeout_ = timers.clearTimeout;
const clearInterval_ = timers.clearInterval;

export function setTimeout(
  callback: (...args: unknown[]) => void,
  timeout?: number,
  ...args: unknown[]
) {
  validateFunction(callback, "callback");
  return new Timeout(callback, timeout, args, false, true);
}

ObjectDefineProperty(setTimeout, promisify.custom, {
  __proto__: null,
  value: (timeout: number, ...args: unknown[]) => {
    return new Promise((cb) =>
      setTimeout(cb, timeout, ...new SafeArrayIterator(args))
    );
  },
  enumerable: true,
});
export function clearTimeout(timeout?: Timeout | number) {
  if (timeout == null) {
    return;
  }
  const id = +timeout;
  const timer = MapPrototypeGet(activeTimers, id);
  if (timer) {
    timer._destroyed = true;
    MapPrototypeDelete(activeTimers, id);
  }
  clearTimeout_(id);
}
export function setInterval(
  callback: (...args: unknown[]) => void,
  timeout?: number,
  ...args: unknown[]
) {
  validateFunction(callback, "callback");
  return new Timeout(callback, timeout, args, true, true);
}
export function clearInterval(timeout?: Timeout | number | string) {
  if (timeout == null) {
    return;
  }
  const id = +timeout;
  const timer = MapPrototypeGet(activeTimers, id);
  if (timer) {
    timer._destroyed = true;
    MapPrototypeDelete(activeTimers, id);
  }
  clearInterval_(id);
}
export function setImmediate(
  cb: (...args: unknown[]) => void,
  ...args: unknown[]
): Timeout {
  return new Immediate(cb, ...new SafeArrayIterator(args));
}
export function clearImmediate(immediate: Immediate) {
  if (immediate == null) {
    return;
  }

  // FIXME(nathanwhit): will probably change once
  //  deno_core has proper support for immediates
  clearTimeout_(immediate._immediateId);
}

async function* setIntervalAsync(
  after: number,
  value: number,
  options: { signal?: AbortSignal; ref?: boolean } = { __proto__: null },
) {
  validateObject(options, "options");

  if (typeof options?.signal !== "undefined") {
    validateAbortSignal(options.signal, "options.signal");
  }

  if (typeof options?.ref !== "undefined") {
    validateBoolean(options.ref, "options.ref");
  }

  const { signal, ref = true } = options;

  if (signal?.aborted) {
    throw new AbortError(undefined, { cause: signal?.reason });
  }

  let onCancel: (() => void) | undefined = undefined;
  let interval: Timeout | undefined = undefined;
  try {
    let notYielded = 0;
    let callback: ((value?: object) => void) | undefined = undefined;
    let rejectCallback: ((message?: string) => void) | undefined = undefined;
    interval = new Timeout(
      () => {
        notYielded++;
        if (callback) {
          callback();
          callback = undefined;
          rejectCallback = undefined;
        }
      },
      after,
      [],
      true,
      ref,
    );
    if (signal) {
      onCancel = () => {
        clearInterval(interval);
        if (rejectCallback) {
          rejectCallback(signal.reason);
          callback = undefined;
          rejectCallback = undefined;
        }
      };
      signal.addEventListener("abort", onCancel, { once: true });
    }
    while (!signal?.aborted) {
      if (notYielded === 0) {
        await new Promise((resolve: () => void, reject: () => void) => {
          callback = resolve;
          rejectCallback = reject;
        });
      }
      for (; notYielded > 0; notYielded--) {
        yield value;
      }
    }
  } catch (error) {
    if (signal?.aborted) {
      throw new AbortError(undefined, { cause: signal?.reason });
    }
    throw error;
  } finally {
    if (interval) {
      clearInterval(interval);
    }
    if (onCancel) {
      signal?.removeEventListener("abort", onCancel);
    }
  }
}

export const promises = {
  setTimeout: promisify(setTimeout),
  setImmediate: promisify(setImmediate),
  setInterval: setIntervalAsync,
};

promises.scheduler = {
  async wait(
    delay: number,
    options?: { signal?: AbortSignal },
  ): Promise<void> {
    return await promises.setTimeout(delay, undefined, options);
  },
  yield: promises.setImmediate,
};

export default {
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  setImmediate,
  setUnrefTimeout,
  clearImmediate,
  promises,
};
