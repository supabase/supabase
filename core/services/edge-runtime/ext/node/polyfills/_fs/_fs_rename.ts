// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { pathFromURL } from "ext:deno_web/00_infra.js";
import { promisify } from "ext:deno_node/internal/util.mjs";

export function rename(
  oldPath: string | URL,
  newPath: string | URL,
  callback: (err?: Error) => void,
) {
  oldPath = oldPath instanceof URL ? pathFromURL(oldPath) : oldPath;
  newPath = newPath instanceof URL ? pathFromURL(newPath) : newPath;

  if (!callback) throw new Error("No callback function supplied");

  Deno.rename(oldPath, newPath).then((_) => callback(), callback);
}

export const renamePromise = promisify(rename) as (
  oldPath: string | URL,
  newPath: string | URL,
) => Promise<void>;

export function renameSync(oldPath: string | URL, newPath: string | URL) {
  oldPath = oldPath instanceof URL ? pathFromURL(oldPath) : oldPath;
  newPath = newPath instanceof URL ? pathFromURL(newPath) : newPath;

  Deno.renameSync(oldPath, newPath);
}
