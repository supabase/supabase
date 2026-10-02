// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import {
  validateRmOptions,
  validateRmOptionsSync,
} from "ext:deno_node/internal/fs/utils.mjs";
import { denoErrorToNodeError } from "ext:deno_node/internal/errors.ts";
import { promisify } from "ext:deno_node/internal/util.mjs";

type rmOptions = {
  force?: boolean;
  maxRetries?: number;
  recursive?: boolean;
  retryDelay?: number;
};

type rmCallback = (err: Error | null) => void;

export function rm(path: string | URL, callback: rmCallback): void;
export function rm(
  path: string | URL,
  options: rmOptions,
  callback: rmCallback,
): void;
export function rm(
  path: string | URL,
  optionsOrCallback: rmOptions | rmCallback,
  maybeCallback?: rmCallback,
) {
  const callback = typeof optionsOrCallback === "function"
    ? optionsOrCallback
    : maybeCallback;
  const options = typeof optionsOrCallback === "object"
    ? optionsOrCallback
    : undefined;

  if (!callback) throw new Error("No callback function supplied");

  validateRmOptions(
    path,
    options,
    false,
    (err: Error | null, options: rmOptions) => {
      if (err) {
        return callback(err);
      }
      Deno.remove(path, { recursive: options?.recursive })
        .then((_) => callback(null), (err: unknown) => {
          if (options?.force && err instanceof Deno.errors.NotFound) {
            callback(null);
          } else {
            callback(
              err instanceof Error
                ? denoErrorToNodeError(err, { syscall: "rm" })
                : err,
            );
          }
        });
    },
  );
}

export const rmPromise = promisify(rm) as (
  path: string | URL,
  options?: rmOptions,
) => Promise<void>;

export function rmSync(path: string | URL, options?: rmOptions) {
  options = validateRmOptionsSync(path, options, false);
  try {
    Deno.removeSync(path, { recursive: options?.recursive });
  } catch (err: unknown) {
    if (options?.force && err instanceof Deno.errors.NotFound) {
      return;
    }
    if (err instanceof Error) {
      throw denoErrorToNodeError(err, { syscall: "stat" });
    } else {
      throw err;
    }
  }
}
