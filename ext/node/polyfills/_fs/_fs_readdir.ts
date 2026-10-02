// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { TextDecoder, TextEncoder } from "ext:deno_web/08_text_encoding.js";
import Dirent from "ext:deno_node/_fs/_fs_dirent.ts";
import { denoErrorToNodeError } from "ext:deno_node/internal/errors.ts";
import { getValidatedPath } from "ext:deno_node/internal/fs/utils.mjs";
import { Buffer } from "node:buffer";
import { promisify } from "ext:deno_node/internal/util.mjs";
import { op_fs_read_dir_async, op_fs_read_dir_sync } from "ext:core/ops";
import { join, relative } from "node:path";

function toDirent(val: Deno.DirEntry & { parentPath: string }): Dirent {
  return new Dirent(val);
}

type readDirOptions = {
  encoding?: string;
  withFileTypes?: boolean;
  recursive?: boolean;
};

type readDirCallback = (err: Error | null, files: string[]) => void;

type readDirCallbackDirent = (err: Error | null, files: Dirent[]) => void;

type readDirBoth = (
  ...args: [Error] | [null, string[] | Dirent[] | Array<string | Dirent>]
) => void;

export function readdir(
  path: string | Buffer | URL,
  options: readDirOptions,
  callback: readDirCallback,
): void;
export function readdir(
  path: string | Buffer | URL,
  options: readDirOptions,
  callback: readDirCallbackDirent,
): void;
export function readdir(path: string | URL, callback: readDirCallback): void;
export function readdir(
  path: string | Buffer | URL,
  optionsOrCallback: readDirOptions | readDirCallback | readDirCallbackDirent,
  maybeCallback?: readDirCallback | readDirCallbackDirent,
) {
  const callback =
    (typeof optionsOrCallback === "function"
      ? optionsOrCallback
      : maybeCallback) as readDirBoth | undefined;
  const options = typeof optionsOrCallback === "object"
    ? optionsOrCallback
    : null;
  path = getValidatedPath(path).toString();

  if (!callback) throw new Error("No callback function supplied");

  if (options?.encoding) {
    try {
      new TextDecoder(options.encoding);
    } catch {
      throw new Error(
        `TypeError [ERR_INVALID_OPT_VALUE_ENCODING]: The value "${options.encoding}" is invalid for option "encoding"`,
      );
    }
  }

  const result: Array<string | Dirent> = [];
  const dirs = [path];
  let current: string | undefined;
  (async () => {
    while ((current = dirs.shift()) !== undefined) {
      try {
        const entries = await op_fs_read_dir_async(current);

        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          if (options?.recursive && entry.isDirectory) {
            dirs.push(join(current, entry.name));
          }

          if (options?.withFileTypes) {
            entry.parentPath = current;
            result.push(toDirent(entry));
          } else {
            let name = decode(entry.name, options?.encoding);
            if (options?.recursive) {
              name = relative(path, join(current, name));
            }
            result.push(name);
          }
        }
      } catch (err) {
        callback(
          denoErrorToNodeError(err as Error, {
            syscall: "readdir",
            path: current,
          }),
        );
        return;
      }
    }

    callback(null, result);
  })();
}

function decode(str: string, encoding?: string): string {
  if (!encoding) return str;
  else {
    const decoder = new TextDecoder(encoding);
    const encoder = new TextEncoder();
    return decoder.decode(encoder.encode(str));
  }
}

export const readdirPromise = promisify(readdir) as (
  & ((path: string | Buffer | URL, options: {
    withFileTypes: true;
    encoding?: string;
  }) => Promise<Dirent[]>)
  & ((path: string | Buffer | URL, options?: {
    withFileTypes?: false;
    encoding?: string;
  }) => Promise<string[]>)
);

export function readdirSync(
  path: string | Buffer | URL,
  options: { withFileTypes: true; encoding?: string },
): Dirent[];
export function readdirSync(
  path: string | Buffer | URL,
  options?: { withFileTypes?: false; encoding?: string },
): string[];
export function readdirSync(
  path: string | Buffer | URL,
  options?: readDirOptions,
): Array<string | Dirent> {
  path = getValidatedPath(path).toString();

  if (options?.encoding) {
    try {
      new TextDecoder(options.encoding);
    } catch {
      throw new Error(
        `TypeError [ERR_INVALID_OPT_VALUE_ENCODING]: The value "${options.encoding}" is invalid for option "encoding"`,
      );
    }
  }

  const result: Array<string | Dirent> = [];
  const dirs = [path];
  let current: string | undefined;
  while ((current = dirs.shift()) !== undefined) {
    try {
      const entries = op_fs_read_dir_sync(current);

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        if (options?.recursive && entry.isDirectory) {
          dirs.push(join(current, entry.name));
        }

        if (options?.withFileTypes) {
          entry.parentPath = current;
          result.push(toDirent(entry));
        } else {
          let name = decode(entry.name, options?.encoding);
          if (options?.recursive) {
            name = relative(path, join(current, name));
          }
          result.push(name);
        }
      }
    } catch (e) {
      throw denoErrorToNodeError(e as Error, {
        syscall: "readdir",
        path: current,
      });
    }
  }

  return result;
}
