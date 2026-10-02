// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { core } from "ext:core/mod.js";
const { internalRidSymbol } = core;
import {
  O_APPEND,
  O_CREAT,
  O_EXCL,
  O_RDWR,
  O_TRUNC,
  O_WRONLY,
} from "ext:deno_node/_fs/_fs_constants.ts";
import { getOpenOptions } from "ext:deno_node/_fs/_fs_common.ts";
import { parseFileMode } from "ext:deno_node/internal/validators.mjs";
import { ERR_INVALID_ARG_TYPE } from "ext:deno_node/internal/errors.ts";
import { getValidatedPath } from "ext:deno_node/internal/fs/utils.mjs";
import { FileHandle } from "ext:deno_node/internal/fs/handle.ts";
import type { Buffer } from "node:buffer";

function existsSync(filePath: string | URL): boolean {
  try {
    Deno.lstatSync(filePath);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    throw error;
  }
}

const FLAGS_AX = O_APPEND | O_CREAT | O_WRONLY | O_EXCL;
const FLAGS_AX_PLUS = O_APPEND | O_CREAT | O_RDWR | O_EXCL;
const FLAGS_WX = O_TRUNC | O_CREAT | O_WRONLY | O_EXCL;
const FLAGS_WX_PLUS = O_TRUNC | O_CREAT | O_RDWR | O_EXCL;

export type openFlags =
  | "a"
  | "ax"
  | "a+"
  | "ax+"
  | "as"
  | "as+"
  | "r"
  | "r+"
  | "rs+"
  | "w"
  | "wx"
  | "w+"
  | "wx+"
  | number;

type openCallback = (err: Error | null, fd: number) => void;

function convertFlagAndModeToOptions(
  flag?: openFlags,
  mode?: number,
): Deno.OpenOptions | undefined {
  if (flag === undefined && mode === undefined) return undefined;
  if (flag === undefined && mode) return { mode };
  return { ...getOpenOptions(flag), mode };
}

export function open(path: string | Buffer | URL, callback: openCallback): void;
export function open(
  path: string | Buffer | URL,
  flags: openFlags,
  callback: openCallback,
): void;
export function open(
  path: string | Buffer | URL,
  flags: openFlags,
  mode: number,
  callback: openCallback,
): void;
export function open(
  path: string | Buffer | URL,
  flags: openCallback | openFlags,
  mode?: openCallback | number,
  callback?: openCallback,
) {
  if (flags === undefined) {
    throw new ERR_INVALID_ARG_TYPE(
      "flags or callback",
      ["string", "function"],
      flags,
    );
  }
  path = getValidatedPath(path);
  if (arguments.length < 3) {
    // deno-lint-ignore no-explicit-any
    callback = flags as any;
    flags = "r";
    mode = 0o666;
  } else if (typeof mode === "function") {
    callback = mode;
    mode = 0o666;
  } else {
    mode = parseFileMode(mode, "mode", 0o666);
  }

  if (typeof callback !== "function") {
    throw new ERR_INVALID_ARG_TYPE(
      "callback",
      "function",
      callback,
    );
  }

  if (flags === undefined) {
    flags = "r";
  }

  if (
    existenceCheckRequired(flags as openFlags) &&
    existsSync(path as string)
  ) {
    const err = new Error(`EEXIST: file already exists, open '${path}'`);
    (callback as (err: Error) => void)(err);
  } else {
    if (flags === "as" || flags === "as+") {
      let err: Error | null = null, res: number;
      try {
        res = openSync(path, flags, mode);
      } catch (error) {
        err = error instanceof Error ? error : new Error("[non-error thrown]");
      }
      if (err) {
        (callback as (err: Error) => void)(err);
      } else {
        callback(null, res!);
      }
      return;
    }
    Deno.open(
      path as string,
      convertFlagAndModeToOptions(flags as openFlags, mode),
    ).then(
      (file) => callback!(null, file[internalRidSymbol]),
      (err) => (callback as (err: Error) => void)(err),
    );
  }
}

export function openPromise(
  path: string | Buffer | URL,
  flags: openFlags = "r",
  mode = 0o666,
): Promise<FileHandle> {
  return new Promise((resolve, reject) => {
    open(path, flags, mode, (err, fd) => {
      if (err) reject(err);
      else resolve(new FileHandle(fd));
    });
  });
}

export function openSync(path: string | Buffer | URL): number;
export function openSync(
  path: string | Buffer | URL,
  flags?: openFlags,
): number;
export function openSync(path: string | Buffer | URL, mode?: number): number;
export function openSync(
  path: string | Buffer | URL,
  flags?: openFlags,
  mode?: number,
): number;
export function openSync(
  path: string | Buffer | URL,
  flags?: openFlags,
  maybeMode?: number,
) {
  const mode = parseFileMode(maybeMode, "mode", 0o666);
  path = getValidatedPath(path);

  if (flags === undefined) {
    flags = "r";
  }

  if (
    existenceCheckRequired(flags) &&
    existsSync(path as string)
  ) {
    throw new Error(`EEXIST: file already exists, open '${path}'`);
  }

  return Deno.openSync(
    path as string,
    convertFlagAndModeToOptions(flags, mode),
  )[internalRidSymbol];
}

function existenceCheckRequired(flags: openFlags | number) {
  return (
    (typeof flags === "string" &&
      ["ax", "ax+", "wx", "wx+"].includes(flags)) ||
    (typeof flags === "number" && (
      ((flags & FLAGS_AX) === FLAGS_AX) ||
      ((flags & FLAGS_AX_PLUS) === FLAGS_AX_PLUS) ||
      ((flags & FLAGS_WX) === FLAGS_WX) ||
      ((flags & FLAGS_WX_PLUS) === FLAGS_WX_PLUS)
    ))
  );
}
