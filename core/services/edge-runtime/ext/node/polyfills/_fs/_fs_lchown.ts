// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import {
  type CallbackWithError,
  makeCallback,
} from "ext:deno_node/_fs/_fs_common.ts";
import {
  getValidatedPath,
  kMaxUserId,
} from "ext:deno_node/internal/fs/utils.mjs";
import * as pathModule from "node:path";
import { validateInteger } from "ext:deno_node/internal/validators.mjs";
import type { Buffer } from "node:buffer";
import { promisify } from "ext:deno_node/internal/util.mjs";
import { op_node_lchown, op_node_lchown_sync } from "ext:core/ops";

/**
 * Asynchronously changes the owner and group
 * of a file, without following symlinks.
 */
export function lchown(
  path: string | Buffer | URL,
  uid: number,
  gid: number,
  callback: CallbackWithError,
) {
  callback = makeCallback(callback);
  path = getValidatedPath(path).toString();
  validateInteger(uid, "uid", -1, kMaxUserId);
  validateInteger(gid, "gid", -1, kMaxUserId);

  op_node_lchown(pathModule.toNamespacedPath(path), uid, gid).then(
    () => callback(null),
    callback,
  );
}

export const lchownPromise = promisify(lchown) as (
  path: string | Buffer | URL,
  uid: number,
  gid: number,
) => Promise<void>;

/**
 * Synchronously changes the owner and group
 * of a file, without following symlinks.
 */
export function lchownSync(
  path: string | Buffer | URL,
  uid: number,
  gid: number,
) {
  path = getValidatedPath(path).toString();
  validateInteger(uid, "uid", -1, kMaxUserId);
  validateInteger(gid, "gid", -1, kMaxUserId);

  op_node_lchown_sync(pathModule.toNamespacedPath(path), uid, gid);
}
