// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { promisify } from "ext:deno_node/internal/util.mjs";

export function unlink(path: string | URL, callback: (err?: Error) => void) {
  if (!callback) throw new Error("No callback function supplied");
  Deno.remove(path).then((_) => callback(), callback);
}

export const unlinkPromise = promisify(unlink) as (
  path: string | URL,
) => Promise<void>;

export function unlinkSync(path: string | URL) {
  Deno.removeSync(path);
}
