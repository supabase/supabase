// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import Dir from "ext:deno_node/_fs/_fs_dir.ts";
import { Buffer } from "node:buffer";
import {
  getOptions,
  getValidatedPath,
} from "ext:deno_node/internal/fs/utils.mjs";
import { denoErrorToNodeError } from "ext:deno_node/internal/errors.ts";
import {
  validateFunction,
  validateInteger,
} from "ext:deno_node/internal/validators.mjs";
import { promisify } from "ext:deno_node/internal/util.mjs";

/** These options aren't functionally used right now, as `Dir` doesn't yet support them.
 * However, these values are still validated.
 */
type Options = {
  encoding?: string;
  bufferSize?: number;
};
type Callback = (err?: Error | null, dir?: Dir) => void;

function _validateFunction(callback: unknown): asserts callback is Callback {
  validateFunction(callback, "callback");
}

/** @link https://nodejs.org/api/fs.html#fsopendirsyncpath-options */
export function opendir(
  path: string | Buffer | URL,
  options: Options | Callback,
  callback?: Callback,
) {
  callback = typeof options === "function" ? options : callback;
  _validateFunction(callback);

  path = getValidatedPath(path).toString();

  let err, dir;
  try {
    const { bufferSize } = getOptions(options, {
      encoding: "utf8",
      bufferSize: 32,
    });
    validateInteger(bufferSize, "options.bufferSize", 1, 4294967295);

    /** Throws if path is invalid */
    Deno.readDirSync(path);

    dir = new Dir(path);
  } catch (error) {
    err = denoErrorToNodeError(error as Error, { syscall: "opendir" });
  }
  if (err) {
    callback(err);
  } else {
    callback(null, dir);
  }
}

/** @link https://nodejs.org/api/fs.html#fspromisesopendirpath-options */
export const opendirPromise = promisify(opendir) as (
  path: string | Buffer | URL,
  options?: Options,
) => Promise<Dir>;

export function opendirSync(
  path: string | Buffer | URL,
  options?: Options,
): Dir {
  path = getValidatedPath(path).toString();

  const { bufferSize } = getOptions(options, {
    encoding: "utf8",
    bufferSize: 32,
  });

  validateInteger(bufferSize, "options.bufferSize", 1, 4294967295);

  try {
    /** Throws if path is invalid */
    Deno.readDirSync(path);

    return new Dir(path);
  } catch (err) {
    throw denoErrorToNodeError(err as Error, { syscall: "opendir" });
  }
}
