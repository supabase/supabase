// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

/**
 * @param n Number to act on.
 * @return The number rounded up to the nearest power of 2.
 */
export function ceilPowOf2(n: number) {
  const roundPowOf2 = 1 << (31 - Math.clz32(n));

  return roundPowOf2 < n ? roundPowOf2 * 2 : roundPowOf2;
}

/** Initial backoff delay of 5ms following a temporary accept failure. */
export const INITIAL_ACCEPT_BACKOFF_DELAY = 5;

/** Max backoff delay of 1s following a temporary accept failure. */
export const MAX_ACCEPT_BACKOFF_DELAY = 1000;
