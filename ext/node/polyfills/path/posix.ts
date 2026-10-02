// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import path from "ext:deno_node/path/mod.ts";

export const {
  basename,
  delimiter,
  dirname,
  extname,
  format,
  isAbsolute,
  join,
  normalize,
  parse,
  relative,
  resolve,
  sep,
  toNamespacedPath,
  _makeLong,
} = path.posix;

export const posix = path.posix;
export const win32 = path.win32;
export default path.posix;
