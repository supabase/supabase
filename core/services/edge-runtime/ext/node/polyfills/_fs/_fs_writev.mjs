// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { Buffer } from "node:buffer";
import { validateBufferArray } from "ext:deno_node/internal/fs/utils.mjs";
import { getValidatedFd } from "ext:deno_node/internal/fs/utils.mjs";
import { maybeCallback } from "ext:deno_node/_fs/_fs_common.ts";
import * as io from "ext:deno_io/12_io.js";
import { op_fs_seek_async, op_fs_seek_sync } from "ext:core/ops";

export function writev(fd, buffers, position, callback) {
  const innerWritev = async (fd, buffers, position) => {
    const chunks = [];
    const offset = 0;
    for (let i = 0; i < buffers.length; i++) {
      if (Buffer.isBuffer(buffers[i])) {
        chunks.push(buffers[i]);
      } else {
        chunks.push(Buffer.from(buffers[i]));
      }
    }
    if (typeof position === "number") {
      await op_fs_seek_async(fd, position, io.SeekMode.Start);
    }
    const buffer = Buffer.concat(chunks);
    let currentOffset = 0;
    while (currentOffset < buffer.byteLength) {
      currentOffset += await io.writeSync(fd, buffer.subarray(currentOffset));
    }
    return currentOffset - offset;
  };

  fd = getValidatedFd(fd);
  validateBufferArray(buffers);
  callback = maybeCallback(callback || position);

  if (buffers.length === 0) {
    process.nextTick(callback, null, 0, buffers);
    return;
  }

  if (typeof position !== "number") position = null;

  innerWritev(fd, buffers, position).then(
    (nwritten) => {
      callback(null, nwritten, buffers);
    },
    (err) => callback(err),
  );
}

export function writevSync(fd, buffers, position) {
  const innerWritev = (fd, buffers, position) => {
    const chunks = [];
    const offset = 0;
    for (let i = 0; i < buffers.length; i++) {
      if (Buffer.isBuffer(buffers[i])) {
        chunks.push(buffers[i]);
      } else {
        chunks.push(Buffer.from(buffers[i]));
      }
    }
    if (typeof position === "number") {
      op_fs_seek_sync(fd, position, io.SeekMode.Start);
    }
    const buffer = Buffer.concat(chunks);
    let currentOffset = 0;
    while (currentOffset < buffer.byteLength) {
      currentOffset += io.writeSync(fd, buffer.subarray(currentOffset));
    }
    return currentOffset - offset;
  };

  fd = getValidatedFd(fd);
  validateBufferArray(buffers);

  if (buffers.length === 0) {
    return 0;
  }

  if (typeof position !== "number") position = null;

  return innerWritev(fd, buffers, position);
}
