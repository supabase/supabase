// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { Buffer } from "node:buffer";
import { ERR_INVALID_ARG_TYPE } from "ext:deno_node/internal/errors.ts";
import * as io from "ext:deno_io/12_io.js";
import { ReadOptions } from "ext:deno_node/_fs/_fs_common.ts";
import {
  arrayBufferViewToUint8Array,
  validateOffsetLengthRead,
  validatePosition,
} from "ext:deno_node/internal/fs/utils.mjs";
import {
  validateBuffer,
  validateInteger,
} from "ext:deno_node/internal/validators.mjs";
import { isArrayBufferView } from "ext:deno_node/internal/util/types.ts";
import { op_fs_seek_async, op_fs_seek_sync } from "ext:core/ops";

type readSyncOptions = {
  offset: number;
  length: number;
  position: number | null;
};

type BinaryCallback = (
  err: Error | null,
  bytesRead: number | null,
  data?: ArrayBufferView,
) => void;
type Callback = BinaryCallback;

export function read(fd: number, callback: Callback): void;
export function read(
  fd: number,
  options: ReadOptions,
  callback: Callback,
): void;
export function read(
  fd: number,
  buffer: ArrayBufferView,
  offset: number,
  length: number,
  position: number | null,
  callback: Callback,
): void;
export function read(
  fd: number,
  optOrBufferOrCb?: ArrayBufferView | ReadOptions | Callback,
  offsetOrCallback?: number | Callback,
  length?: number,
  position?: number | null,
  callback?: Callback,
) {
  let cb: Callback | undefined;
  let offset = 0,
    buffer: ArrayBufferView;

  if (typeof fd !== "number") {
    throw new ERR_INVALID_ARG_TYPE("fd", "number", fd);
  }

  if (length == null) {
    length = 0;
  }

  if (typeof offsetOrCallback === "function") {
    cb = offsetOrCallback;
  } else if (typeof optOrBufferOrCb === "function") {
    cb = optOrBufferOrCb;
  } else {
    offset = offsetOrCallback as number;
    validateInteger(offset, "offset", 0);
    cb = callback;
  }

  if (
    isArrayBufferView(optOrBufferOrCb)
  ) {
    buffer = optOrBufferOrCb;
  } else if (typeof optOrBufferOrCb === "function") {
    offset = 0;
    buffer = Buffer.alloc(16384);
    length = buffer.byteLength;
    position = null;
  } else {
    const opt = optOrBufferOrCb as ReadOptions;
    if (
      !isArrayBufferView(opt.buffer)
    ) {
      throw new ERR_INVALID_ARG_TYPE("buffer", [
        "Buffer",
        "TypedArray",
        "DataView",
      ], optOrBufferOrCb);
    }
    if (opt.buffer === undefined) {
      buffer = Buffer.alloc(16384);
    } else {
      buffer = opt.buffer;
    }
    offset = opt.offset ?? 0;
    length = opt.length ?? buffer.byteLength - offset;
    position = opt.position ?? null;
  }

  if (position == null) {
    position = -1;
  }

  validatePosition(position);
  validateOffsetLengthRead(offset, length, buffer.byteLength);

  if (!cb) throw new ERR_INVALID_ARG_TYPE("cb", "Callback", cb);

  (async () => {
    try {
      let nread: number | null;
      if (typeof position === "number" && position >= 0) {
        const currentPosition = await op_fs_seek_async(
          fd,
          0,
          io.SeekMode.Current,
        );
        // We use sync calls below to avoid being affected by others during
        // these calls.
        op_fs_seek_sync(fd, position, io.SeekMode.Start);
        nread = io.readSync(
          fd,
          arrayBufferViewToUint8Array(buffer).subarray(offset, offset + length),
        );
        op_fs_seek_sync(fd, currentPosition, io.SeekMode.Start);
      } else {
        nread = await io.read(
          fd,
          arrayBufferViewToUint8Array(buffer).subarray(offset, offset + length),
        );
      }
      cb(null, nread ?? 0, buffer);
    } catch (error) {
      cb(error as Error, null);
    }
  })();
}

export function readSync(
  fd: number,
  buffer: ArrayBufferView,
  offset: number,
  length: number,
  position: number | null,
): number;
export function readSync(
  fd: number,
  buffer: ArrayBufferView,
  opt: readSyncOptions,
): number;
export function readSync(
  fd: number,
  buffer: ArrayBufferView,
  offsetOrOpt?: number | readSyncOptions,
  length?: number,
  position?: number | null,
): number {
  let offset = 0;

  if (typeof fd !== "number") {
    throw new ERR_INVALID_ARG_TYPE("fd", "number", fd);
  }

  validateBuffer(buffer);

  if (length == null) {
    length = buffer.byteLength;
  }

  if (typeof offsetOrOpt === "number") {
    offset = offsetOrOpt;
    validateInteger(offset, "offset", 0);
  } else if (offsetOrOpt !== undefined) {
    const opt = offsetOrOpt as readSyncOptions;
    offset = opt.offset ?? 0;
    length = opt.length ?? buffer.byteLength - offset;
    position = opt.position ?? null;
  }

  if (position == null) {
    position = -1;
  }

  validatePosition(position);
  validateOffsetLengthRead(offset, length, buffer.byteLength);

  let currentPosition = 0;
  if (typeof position === "number" && position >= 0) {
    currentPosition = op_fs_seek_sync(fd, 0, io.SeekMode.Current);
    op_fs_seek_sync(fd, position, io.SeekMode.Start);
  }

  const numberOfBytesRead = io.readSync(
    fd,
    arrayBufferViewToUint8Array(buffer).subarray(offset, offset + length),
  );

  if (typeof position === "number" && position >= 0) {
    op_fs_seek_sync(fd, currentPosition, io.SeekMode.Start);
  }

  return numberOfBytesRead ?? 0;
}
