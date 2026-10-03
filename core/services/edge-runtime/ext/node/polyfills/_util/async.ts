// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is vendored from std/async/delay.ts
// (with some modifications)

import { primordials } from "ext:core/mod.js";
const {
  Promise,
  PromiseReject,
} = primordials;

import { clearTimeout, setTimeout } from "ext:deno_web/02_timers.js";

/** Resolve a Promise after a given amount of milliseconds. */
export function delay(
  ms: number,
  options: { signal?: AbortSignal } = { __proto__: null },
): Promise<void> {
  const { signal } = options;
  if (signal?.aborted) {
    return PromiseReject(signal.reason);
  }
  return new Promise((resolve, reject) => {
    const abort = () => {
      clearTimeout(i);
      reject(signal!.reason);
    };
    const done = () => {
      signal?.removeEventListener("abort", abort);
      resolve();
    };
    const i = setTimeout(done, ms);
    signal?.addEventListener("abort", abort, { once: true });
  });
}
