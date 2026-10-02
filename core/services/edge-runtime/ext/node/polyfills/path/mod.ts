// Copyright the Browserify authors. MIT License.
// Ported mostly from https://github.com/browserify/path-browserify/
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { isWindows } from "ext:deno_node/_util/os.ts";
import _win32 from "ext:deno_node/path/_win32.ts";
import _posix from "ext:deno_node/path/_posix.ts";

export const win32 = {
  ..._win32,
  win32: null as unknown as typeof _win32,
  posix: null as unknown as typeof _posix,
};

export const posix = {
  ..._posix,
  win32: null as unknown as typeof _win32,
  posix: null as unknown as typeof _posix,
};

posix.win32 = win32.win32 = win32;
posix.posix = win32.posix = posix;

const path = isWindows ? win32 : posix;
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
} = path;
export default path;
export * from "ext:deno_node/path/common.ts";
export * from "ext:deno_node/path/_interface.ts";
