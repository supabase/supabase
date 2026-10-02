// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import type { CallbackWithError } from "ext:deno_node/_fs/_fs_common.ts";
import { pathFromURL } from "ext:deno_web/00_infra.js";
import { promisify } from "ext:deno_node/internal/util.mjs";

/**
 * TODO: Also accept 'path' parameter as a Node polyfill Buffer type once these
 * are implemented. See https://github.com/denoland/deno/issues/3403
 */
export function link(
  existingPath: string | URL,
  newPath: string | URL,
  callback: CallbackWithError,
) {
  existingPath = existingPath instanceof URL
    ? pathFromURL(existingPath)
    : existingPath;
  newPath = newPath instanceof URL ? pathFromURL(newPath) : newPath;

  Deno.link(existingPath, newPath).then(() => callback(null), callback);
}

/**
 * TODO: Also accept 'path' parameter as a Node polyfill Buffer type once these
 * are implemented. See https://github.com/denoland/deno/issues/3403
 */
export const linkPromise = promisify(link) as (
  existingPath: string | URL,
  newPath: string | URL,
) => Promise<void>;

/**
 * TODO: Also accept 'path' parameter as a Node polyfill Buffer type once these
 * are implemented. See https://github.com/denoland/deno/issues/3403
 */
export function linkSync(
  existingPath: string | URL,
  newPath: string | URL,
) {
  existingPath = existingPath instanceof URL
    ? pathFromURL(existingPath)
    : existingPath;
  newPath = newPath instanceof URL ? pathFromURL(newPath) : newPath;

  Deno.linkSync(existingPath, newPath);
}
