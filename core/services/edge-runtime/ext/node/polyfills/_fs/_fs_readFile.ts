// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import {
  BinaryOptionsArgument,
  FileOptionsArgument,
  getEncoding,
  TextOptionsArgument,
} from "ext:deno_node/_fs/_fs_common.ts";
import { Buffer } from "node:buffer";
import { readAll, readAllSync } from "ext:deno_io/12_io.js";
import { FileHandle } from "ext:deno_node/internal/fs/handle.ts";
import { pathFromURL } from "ext:deno_web/00_infra.js";
import {
  BinaryEncodings,
  Encodings,
  TextEncodings,
} from "ext:deno_node/_utils.ts";
import { FsFile } from "ext:deno_fs/30_fs.js";
import { denoErrorToNodeError } from "ext:deno_node/internal/errors.ts";

function maybeDecode(data: Uint8Array, encoding: TextEncodings): string;
function maybeDecode(
  data: Uint8Array,
  encoding: BinaryEncodings | null,
): Buffer;
function maybeDecode(
  data: Uint8Array,
  encoding: Encodings | null,
): string | Buffer {
  const buffer = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  if (encoding && encoding !== "binary") return buffer.toString(encoding);
  return buffer;
}

type TextCallback = (err: Error | null, data?: string) => void;
type BinaryCallback = (err: Error | null, data?: Buffer) => void;
type GenericCallback = (err: Error | null, data?: string | Buffer) => void;
type Callback = TextCallback | BinaryCallback | GenericCallback;
type Path = string | URL | FileHandle | number;

export function readFile(
  path: Path,
  options: TextOptionsArgument,
  callback: TextCallback,
): void;
export function readFile(
  path: Path,
  options: BinaryOptionsArgument,
  callback: BinaryCallback,
): void;
export function readFile(
  path: Path,
  options: null | undefined | FileOptionsArgument,
  callback: BinaryCallback,
): void;
export function readFile(path: string | URL, callback: BinaryCallback): void;
export function readFile(
  path: Path,
  optOrCallback?: FileOptionsArgument | Callback | null | undefined,
  callback?: Callback,
) {
  path = path instanceof URL ? pathFromURL(path) : path;
  let cb: Callback | undefined;
  if (typeof optOrCallback === "function") {
    cb = optOrCallback;
  } else {
    cb = callback;
  }

  const encoding = getEncoding(optOrCallback);

  let p: Promise<Uint8Array>;
  if (path instanceof FileHandle) {
    const fsFile = new FsFile(path.fd, Symbol.for("Deno.internal.FsFile"));
    p = readAll(fsFile);
  } else if (typeof path === "number") {
    const fsFile = new FsFile(path, Symbol.for("Deno.internal.FsFile"));
    p = readAll(fsFile);
  } else {
    p = Deno.readFile(path);
  }

  if (cb) {
    p.then((data: Uint8Array) => {
      if (encoding && encoding !== "binary") {
        const text = maybeDecode(data, encoding);
        return (cb as TextCallback)(null, text);
      }
      const buffer = maybeDecode(data, encoding);
      (cb as BinaryCallback)(null, buffer);
    }, (err) => cb && cb(denoErrorToNodeError(err, { path, syscall: "open" })));
  }
}

export function readFilePromise(
  path: Path,
  options?: FileOptionsArgument | null | undefined,
  // deno-lint-ignore no-explicit-any
): Promise<any> {
  return new Promise((resolve, reject) => {
    readFile(path, options, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

export function readFileSync(
  path: string | URL | number,
  opt: TextOptionsArgument,
): string;
export function readFileSync(
  path: string | URL | number,
  opt?: BinaryOptionsArgument,
): Buffer;
export function readFileSync(
  path: string | URL | number,
  opt?: FileOptionsArgument,
): string | Buffer {
  path = path instanceof URL ? pathFromURL(path) : path;
  let data;
  if (typeof path === "number") {
    const fsFile = new FsFile(path, Symbol.for("Deno.internal.FsFile"));
    data = readAllSync(fsFile);
  } else {
    try {
      data = Deno.readFileSync(path);
    } catch (err) {
      throw denoErrorToNodeError(err, { path, syscall: "open" });
    }
  }
  const encoding = getEncoding(opt);
  if (encoding && encoding !== "binary") {
    const text = maybeDecode(data, encoding);
    return text;
  }
  const buffer = maybeDecode(data, encoding);
  return buffer;
}
