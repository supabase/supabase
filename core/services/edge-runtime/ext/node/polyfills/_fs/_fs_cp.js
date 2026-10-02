// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { primordials } from "ext:core/mod.js";
import { op_node_cp, op_node_cp_sync } from "ext:core/ops";
import {
  getValidatedPath,
  validateCpOptions,
} from "ext:deno_node/internal/fs/utils.mjs";
import { promisify } from "ext:deno_node/internal/util.mjs";

const { PromisePrototypeThen } = primordials;

export function cpSync(src, dest, options) {
  validateCpOptions(options);
  const srcPath = getValidatedPath(src, "src");
  const destPath = getValidatedPath(dest, "dest");

  op_node_cp_sync(srcPath, destPath);
}

export function cp(src, dest, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }
  validateCpOptions(options);
  const srcPath = getValidatedPath(src, "src");
  const destPath = getValidatedPath(dest, "dest");

  PromisePrototypeThen(
    op_node_cp(
      srcPath,
      destPath,
    ),
    (res) => callback(null, res),
    (err) => callback(err, null),
  );
}

export const cpPromise = promisify(cp);
