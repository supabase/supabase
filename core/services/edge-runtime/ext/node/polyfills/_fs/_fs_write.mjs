// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { Buffer } from "node:buffer";
import {
  validateEncoding,
  validateInteger,
} from "ext:deno_node/internal/validators.mjs";
import * as io from "ext:deno_io/12_io.js";
import {
  arrayBufferViewToUint8Array,
  getValidatedFd,
  validateOffsetLengthWrite,
  validateStringAfterArrayBufferView,
} from "ext:deno_node/internal/fs/utils.mjs";
import { isArrayBufferView } from "ext:deno_node/internal/util/types.ts";
import { maybeCallback } from "ext:deno_node/_fs/_fs_common.ts";
import { op_fs_seek_async, op_fs_seek_sync } from "ext:core/ops";

export function writeSync(fd, buffer, offset, length, position) {
  fd = getValidatedFd(fd);

  const innerWriteSync = (fd, buffer, offset, length, position) => {
    buffer = arrayBufferViewToUint8Array(buffer);
    if (typeof position === "number") {
      op_fs_seek_sync(fd, position, io.SeekMode.Start);
    }
    let currentOffset = offset;
    const end = offset + length;
    while (currentOffset - offset < length) {
      currentOffset += io.writeSync(fd, buffer.subarray(currentOffset, end));
    }
    return currentOffset - offset;
  };

  if (isArrayBufferView(buffer)) {
    if (position === undefined) {
      position = null;
    }
    if (offset == null) {
      offset = 0;
    } else {
      validateInteger(offset, "offset", 0);
    }
    if (typeof length !== "number") {
      length = buffer.byteLength - offset;
    }
    validateOffsetLengthWrite(offset, length, buffer.byteLength);
    return innerWriteSync(fd, buffer, offset, length, position);
  }
  validateStringAfterArrayBufferView(buffer, "buffer");
  validateEncoding(buffer, length);
  if (offset === undefined) {
    offset = null;
  }
  buffer = Buffer.from(buffer, length);
  return innerWriteSync(fd, buffer, 0, buffer.length, position);
}

/** Writes the buffer to the file of the given descriptor.
 * https://nodejs.org/api/fs.html#fswritefd-buffer-offset-length-position-callback
 * https://github.com/nodejs/node/blob/42ad4137aadda69c51e1df48eee9bc2e5cebca5c/lib/fs.js#L797
 */
export function write(fd, buffer, offset, length, position, callback) {
  fd = getValidatedFd(fd);

  const innerWrite = async (fd, buffer, offset, length, position) => {
    buffer = arrayBufferViewToUint8Array(buffer);
    if (typeof position === "number") {
      await op_fs_seek_async(fd, position, io.SeekMode.Start);
    }
    let currentOffset = offset;
    const end = offset + length;
    while (currentOffset - offset < length) {
      currentOffset += await io.write(
        fd,
        buffer.subarray(currentOffset, end),
      );
    }
    return currentOffset - offset;
  };

  if (isArrayBufferView(buffer)) {
    callback = maybeCallback(callback || position || length || offset);
    if (offset == null || typeof offset === "function") {
      offset = 0;
    } else {
      validateInteger(offset, "offset", 0);
    }
    if (typeof length !== "number") {
      length = buffer.byteLength - offset;
    }
    if (typeof position !== "number") {
      position = null;
    }
    validateOffsetLengthWrite(offset, length, buffer.byteLength);
    innerWrite(fd, buffer, offset, length, position).then(
      (nwritten) => {
        callback(null, nwritten, buffer);
      },
      (err) => callback(err),
    );
    return;
  }

  // Here the call signature is
  // `fs.write(fd, string[, position[, encoding]], callback)`

  validateStringAfterArrayBufferView(buffer, "buffer");

  if (typeof position !== "function") {
    if (typeof offset === "function") {
      position = offset;
      offset = null;
    } else {
      position = length;
    }
    length = "utf-8";
  }

  const str = buffer;
  validateEncoding(str, length);
  callback = maybeCallback(position);
  buffer = Buffer.from(str, length);
  innerWrite(fd, buffer, 0, buffer.length, offset, callback).then(
    (nwritten) => {
      callback(null, nwritten, buffer);
    },
    (err) => callback(err),
  );
}
