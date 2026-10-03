// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import {
  O_APPEND,
  O_CREAT,
  O_EXCL,
  O_RDONLY,
  O_RDWR,
  O_TRUNC,
  O_WRONLY,
} from "ext:deno_node/_fs/_fs_constants.ts";
import { validateFunction } from "ext:deno_node/internal/validators.mjs";
import type { ErrnoException } from "ext:deno_node/_global.d.ts";
import {
  BinaryEncodings,
  Encodings,
  notImplemented,
  TextEncodings,
} from "ext:deno_node/_utils.ts";
import { type Buffer } from "node:buffer";

export type CallbackWithError = (err: ErrnoException | null) => void;

export interface FileOptions {
  encoding?: Encodings;
  flag?: string;
  signal?: AbortSignal;
}

export type TextOptionsArgument =
  | TextEncodings
  | ({ encoding: TextEncodings } & FileOptions);
export type BinaryOptionsArgument =
  | BinaryEncodings
  | ({ encoding: BinaryEncodings } & FileOptions);
export type FileOptionsArgument = Encodings | FileOptions;

export type ReadOptions = {
  buffer: Buffer | ArrayBufferView;
  offset: number;
  length: number;
  position: number | null;
};

export interface WriteFileOptions extends FileOptions {
  mode?: number;
}

export function isFileOptions(
  fileOptions: string | WriteFileOptions | undefined,
): fileOptions is FileOptions {
  if (!fileOptions) return false;

  return (
    (fileOptions as FileOptions).encoding != undefined ||
    (fileOptions as FileOptions).flag != undefined ||
    (fileOptions as FileOptions).signal != undefined ||
    (fileOptions as WriteFileOptions).mode != undefined
  );
}

export function getEncoding(
  optOrCallback?:
    | FileOptions
    | WriteFileOptions
    // deno-lint-ignore no-explicit-any
    | ((...args: any[]) => any)
    | Encodings
    | null,
): Encodings | null {
  if (!optOrCallback || typeof optOrCallback === "function") {
    return null;
  }

  const encoding = typeof optOrCallback === "string"
    ? optOrCallback
    : optOrCallback.encoding;
  if (!encoding) return null;
  return encoding;
}

export function checkEncoding(encoding: Encodings | null): Encodings | null {
  if (!encoding) return null;

  encoding = encoding.toLowerCase() as Encodings;
  if (["utf8", "hex", "base64", "ascii"].includes(encoding)) return encoding;

  if (encoding === "utf-8") {
    return "utf8";
  }
  if (encoding === "binary") {
    return "binary";
    // before this was buffer, however buffer is not used in Node
    // node -e "require('fs').readFile('../world.txt', 'buffer', console.log)"
  }

  const notImplementedEncodings = ["utf16le", "latin1", "ucs2"];

  if (notImplementedEncodings.includes(encoding as string)) {
    notImplemented(`"${encoding}" encoding`);
  }

  throw new Error(`The value "${encoding}" is invalid for option "encoding"`);
}

export function getOpenOptions(
  flag: string | number | undefined,
): Deno.OpenOptions {
  if (flag === undefined) {
    return { create: true, append: true };
  }

  let openOptions: Deno.OpenOptions = {};

  if (typeof flag === "string") {
    switch (flag) {
      case "a": {
        // 'a': Open file for appending. The file is created if it does not exist.
        openOptions = { create: true, append: true };
        break;
      }
      case "ax":
      case "xa": {
        // 'ax', 'xa': Like 'a' but fails if the path exists.
        openOptions = { createNew: true, write: true, append: true };
        break;
      }
      case "a+": {
        // 'a+': Open file for reading and appending. The file is created if it does not exist.
        openOptions = { read: true, create: true, append: true };
        break;
      }
      case "ax+":
      case "xa+": {
        // 'ax+', 'xa+': Like 'a+' but fails if the path exists.
        openOptions = { read: true, createNew: true, append: true };
        break;
      }
      case "r": {
        // 'r': Open file for reading. An exception occurs if the file does not exist.
        openOptions = { read: true };
        break;
      }
      case "r+": {
        // 'r+': Open file for reading and writing. An exception occurs if the file does not exist.
        openOptions = { read: true, write: true };
        break;
      }
      case "w": {
        // 'w': Open file for writing. The file is created (if it does not exist) or truncated (if it exists).
        openOptions = { create: true, write: true, truncate: true };
        break;
      }
      case "wx":
      case "xw": {
        // 'wx', 'xw': Like 'w' but fails if the path exists.
        openOptions = { createNew: true, write: true };
        break;
      }
      case "w+": {
        // 'w+': Open file for reading and writing. The file is created (if it does not exist) or truncated (if it exists).
        openOptions = { create: true, write: true, truncate: true, read: true };
        break;
      }
      case "wx+":
      case "xw+": {
        // 'wx+', 'xw+': Like 'w+' but fails if the path exists.
        openOptions = { createNew: true, write: true, read: true };
        break;
      }
      case "as":
      case "sa": {
        // 'as', 'sa': Open file for appending in synchronous mode. The file is created if it does not exist.
        openOptions = { create: true, append: true };
        break;
      }
      case "as+":
      case "sa+": {
        // 'as+', 'sa+': Open file for reading and appending in synchronous mode. The file is created if it does not exist.
        openOptions = { create: true, read: true, append: true };
        break;
      }
      case "rs+":
      case "sr+": {
        // 'rs+', 'sr+': Open file for reading and writing in synchronous mode. Instructs the operating system to bypass the local file system cache.
        openOptions = { create: true, read: true, write: true };
        break;
      }
      default: {
        throw new Error(`Unrecognized file system flag: ${flag}`);
      }
    }
  } else if (typeof flag === "number") {
    if ((flag & O_APPEND) === O_APPEND) {
      openOptions.append = true;
    }
    if ((flag & O_CREAT) === O_CREAT) {
      openOptions.create = true;
      openOptions.write = true;
    }
    if ((flag & O_EXCL) === O_EXCL) {
      openOptions.createNew = true;
      openOptions.read = true;
      openOptions.write = true;
    }
    if ((flag & O_TRUNC) === O_TRUNC) {
      openOptions.truncate = true;
    }
    if ((flag & O_RDONLY) === O_RDONLY) {
      openOptions.read = true;
    }
    if ((flag & O_WRONLY) === O_WRONLY) {
      openOptions.write = true;
    }
    if ((flag & O_RDWR) === O_RDWR) {
      openOptions.read = true;
      openOptions.write = true;
    }
  }

  return openOptions;
}

export { isUint32 as isFd } from "ext:deno_node/internal/validators.mjs";

export function maybeCallback(cb: unknown) {
  validateFunction(cb, "cb");

  return cb as CallbackWithError;
}

// Ensure that callbacks run in the global context. Only use this function
// for callbacks that are passed to the binding layer, callbacks that are
// invoked from JS already run in the proper scope.
export function makeCallback(
  this: unknown,
  cb?: (err: Error | null, result?: unknown) => void,
) {
  validateFunction(cb, "cb");

  return (...args: unknown[]) => Reflect.apply(cb!, this, args);
}
