// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import type { CallbackWithError } from "ext:deno_node/_fs/_fs_common.ts";
import { makeCallback } from "ext:deno_node/_fs/_fs_common.ts";
import { Buffer } from "node:buffer";
import {
  getValidatedPath,
  getValidMode,
} from "ext:deno_node/internal/fs/utils.mjs";
import { fs } from "ext:deno_node/internal_binding/constants.ts";
import { codeMap } from "ext:deno_node/internal_binding/uv.ts";
import { promisify } from "ext:deno_node/internal/util.mjs";

export function copyFile(
  src: string | Buffer | URL,
  dest: string | Buffer | URL,
  callback: CallbackWithError,
): void;
export function copyFile(
  src: string | Buffer | URL,
  dest: string | Buffer | URL,
  mode: number,
  callback: CallbackWithError,
): void;
export function copyFile(
  src: string | Buffer | URL,
  dest: string | Buffer | URL,
  mode: number | CallbackWithError,
  callback?: CallbackWithError,
) {
  if (typeof mode === "function") {
    callback = mode;
    mode = 0;
  }
  const srcStr = getValidatedPath(src, "src").toString();
  const destStr = getValidatedPath(dest, "dest").toString();
  const modeNum = getValidMode(mode, "copyFile");
  const cb = makeCallback(callback);

  if ((modeNum & fs.COPYFILE_EXCL) === fs.COPYFILE_EXCL) {
    Deno.lstat(destStr).then(() => {
      // deno-lint-ignore no-explicit-any
      const e: any = new Error(
        `EEXIST: file already exists, copyfile '${srcStr}' -> '${destStr}'`,
      );
      e.syscall = "copyfile";
      e.errno = codeMap.get("EEXIST");
      e.code = "EEXIST";
      cb(e);
    }, (e) => {
      if (e instanceof Deno.errors.NotFound) {
        Deno.copyFile(srcStr, destStr).then(() => cb(null), cb);
      } else {
        cb(e);
      }
    });
  } else {
    Deno.copyFile(srcStr, destStr).then(() => cb(null), cb);
  }
}

export const copyFilePromise = promisify(copyFile) as (
  src: string | Buffer | URL,
  dest: string | Buffer | URL,
  mode?: number,
) => Promise<void>;

export function copyFileSync(
  src: string | Buffer | URL,
  dest: string | Buffer | URL,
  mode?: number,
) {
  const srcStr = getValidatedPath(src, "src").toString();
  const destStr = getValidatedPath(dest, "dest").toString();
  const modeNum = getValidMode(mode, "copyFile");

  if ((modeNum & fs.COPYFILE_EXCL) === fs.COPYFILE_EXCL) {
    try {
      Deno.lstatSync(destStr);
      throw new Error(`A file exists at the destination: ${destStr}`);
    } catch (e) {
      if (e instanceof Deno.errors.NotFound) {
        Deno.copyFileSync(srcStr, destStr);
      } else {
        throw e;
      }
    }
  } else {
    Deno.copyFileSync(srcStr, destStr);
  }
}
