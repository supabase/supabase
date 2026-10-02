// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import type { CallbackWithError } from "ext:deno_node/_fs/_fs_common.ts";
import { promisify } from "ext:deno_node/internal/util.mjs";
import {
  getValidatedPath,
  toUnixTimestamp,
} from "ext:deno_node/internal/fs/utils.mjs";

function getValidTime(
  time: number | string | Date,
  name: string,
): number {
  if (typeof time === "string") {
    time = Number(time);
  }

  if (
    typeof time === "number" &&
    (Number.isNaN(time) || !Number.isFinite(time))
  ) {
    throw new Deno.errors.InvalidData(
      `invalid ${name}, must not be infinity or NaN`,
    );
  }

  return toUnixTimestamp(time);
}

export function utimes(
  path: string | URL,
  atime: number | string | Date,
  mtime: number | string | Date,
  callback: CallbackWithError,
) {
  path = getValidatedPath(path).toString();

  if (!callback) {
    throw new Deno.errors.InvalidData("No callback function supplied");
  }

  atime = getValidTime(atime, "atime");
  mtime = getValidTime(mtime, "mtime");

  Deno.utime(path, atime, mtime).then(() => callback(null), callback);
}

export const utimesPromise = promisify(utimes) as (
  path: string | URL,
  atime: number | string | Date,
  mtime: number | string | Date,
) => Promise<void>;

export function utimesSync(
  path: string | URL,
  atime: number | string | Date,
  mtime: number | string | Date,
) {
  path = getValidatedPath(path).toString();
  atime = getValidTime(atime, "atime");
  mtime = getValidTime(mtime, "mtime");

  Deno.utimeSync(path, atime, mtime);
}
