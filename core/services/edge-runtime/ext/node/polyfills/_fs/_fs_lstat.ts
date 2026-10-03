// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { denoErrorToNodeError } from "ext:deno_node/internal/errors.ts";
import {
  BigIntStats,
  CFISBIS,
  statCallback,
  statCallbackBigInt,
  statOptions,
  Stats,
} from "ext:deno_node/_fs/_fs_stat.ts";
import { promisify } from "ext:deno_node/internal/util.mjs";

export function lstat(path: string | URL, callback: statCallback): void;
export function lstat(
  path: string | URL,
  options: { bigint: false },
  callback: statCallback,
): void;
export function lstat(
  path: string | URL,
  options: { bigint: true },
  callback: statCallbackBigInt,
): void;
export function lstat(
  path: string | URL,
  optionsOrCallback: statCallback | statCallbackBigInt | statOptions,
  maybeCallback?: statCallback | statCallbackBigInt,
) {
  const callback =
    (typeof optionsOrCallback === "function"
      ? optionsOrCallback
      : maybeCallback) as (
        ...args: [Error] | [null, BigIntStats | Stats]
      ) => void;
  const options = typeof optionsOrCallback === "object"
    ? optionsOrCallback
    : { bigint: false };

  if (!callback) throw new Error("No callback function supplied");

  Deno.lstat(path).then(
    (stat) => callback(null, CFISBIS(stat, options.bigint)),
    (err) => callback(err),
  );
}

export const lstatPromise = promisify(lstat) as (
  & ((path: string | URL) => Promise<Stats>)
  & ((path: string | URL, options: { bigint: false }) => Promise<Stats>)
  & ((path: string | URL, options: { bigint: true }) => Promise<BigIntStats>)
);

export function lstatSync(path: string | URL): Stats;
export function lstatSync(
  path: string | URL,
  options: { bigint: false; throwIfNoEntry?: boolean },
): Stats;
export function lstatSync(
  path: string | URL,
  options: { bigint: true; throwIfNoEntry?: boolean },
): BigIntStats;
export function lstatSync(
  path: string | URL,
  options?: statOptions,
): Stats | BigIntStats {
  try {
    const origin = Deno.lstatSync(path);
    return CFISBIS(origin, options?.bigint || false);
  } catch (err) {
    if (
      options?.throwIfNoEntry === false &&
      err instanceof Deno.errors.NotFound
    ) {
      return;
    }

    if (err instanceof Error) {
      throw denoErrorToNodeError(err, { syscall: "stat" });
    } else {
      throw err;
    }
  }
}
