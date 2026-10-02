// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import {
  ERR_INVALID_ARG_TYPE,
  type ErrnoException,
} from "ext:deno_node/internal/errors.ts";
import {
  getValidatedFd,
  validateBufferArray,
} from "ext:deno_node/internal/fs/utils.mjs";
import { maybeCallback } from "ext:deno_node/_fs/_fs_common.ts";
import { validateInteger } from "ext:deno_node/internal/validators.mjs";
import * as io from "ext:deno_io/12_io.js";
import { op_fs_seek_async, op_fs_seek_sync } from "ext:core/ops";
import process from "node:process";

type Callback = (
  err: ErrnoException | null,
  bytesRead: number,
  buffers: readonly ArrayBufferView[],
) => void;

export function readv(
  fd: number,
  buffers: readonly ArrayBufferView[],
  callback: Callback,
): void;
export function readv(
  fd: number,
  buffers: readonly ArrayBufferView[],
  position: number | Callback,
  callback?: Callback,
): void {
  if (typeof fd !== "number") {
    throw new ERR_INVALID_ARG_TYPE("fd", "number", fd);
  }
  fd = getValidatedFd(fd);
  validateBufferArray(buffers);
  const cb = maybeCallback(callback || position) as Callback;
  let pos: number | null = null;
  if (typeof position === "number") {
    validateInteger(position, "position", 0);
    pos = position;
  }

  if (buffers.length === 0) {
    process.nextTick(cb, null, 0, buffers);
    return;
  }

  const innerReadv = async (
    fd: number,
    buffers: readonly ArrayBufferView[],
    position: number | null,
  ) => {
    if (typeof position === "number") {
      await op_fs_seek_async(fd, position, io.SeekMode.Start);
    }

    let readTotal = 0;
    let readInBuf = 0;
    let bufIdx = 0;
    let buf = buffers[bufIdx];
    while (bufIdx < buffers.length) {
      const nread = await io.read(fd, buf);
      if (nread === null) {
        break;
      }
      readInBuf += nread;
      if (readInBuf === buf.byteLength) {
        readTotal += readInBuf;
        readInBuf = 0;
        bufIdx += 1;
        buf = buffers[bufIdx];
      }
    }
    readTotal += readInBuf;

    return readTotal;
  };

  innerReadv(fd, buffers, pos).then(
    (numRead) => {
      cb(null, numRead, buffers);
    },
    (err) => cb(err, -1, buffers),
  );
}

export function readvSync(
  fd: number,
  buffers: readonly ArrayBufferView[],
  position: number | null = null,
): number {
  if (typeof fd !== "number") {
    throw new ERR_INVALID_ARG_TYPE("fd", "number", fd);
  }
  fd = getValidatedFd(fd);
  validateBufferArray(buffers);
  if (buffers.length === 0) {
    return 0;
  }
  if (typeof position === "number") {
    validateInteger(position, "position", 0);
    op_fs_seek_sync(fd, position, io.SeekMode.Start);
  }

  let readTotal = 0;
  let readInBuf = 0;
  let bufIdx = 0;
  let buf = buffers[bufIdx];
  while (bufIdx < buffers.length) {
    const nread = io.readSync(fd, buf);
    if (nread === null) {
      break;
    }
    readInBuf += nread;
    if (readInBuf === buf.byteLength) {
      readTotal += readInBuf;
      readInBuf = 0;
      bufIdx += 1;
      buf = buffers[bufIdx];
    }
  }
  readTotal += readInBuf;

  return readTotal;
}
