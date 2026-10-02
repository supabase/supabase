// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// This module ports:
// - https://github.com/nodejs/node/blob/master/src/node_file-inl.h
// - https://github.com/nodejs/node/blob/master/src/node_file.cc
// - https://github.com/nodejs/node/blob/master/src/node_file.h

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { assert } from "ext:deno_node/_util/asserts.ts";
import * as io from "ext:deno_io/12_io.js";
import { op_fs_seek_sync } from "ext:core/ops";

/**
 * Write to the given file from the given buffer synchronously.
 *
 * Implements sync part of WriteBuffer in src/node_file.cc
 * See: https://github.com/nodejs/node/blob/e9ed113/src/node_file.cc#L1818
 *
 * @param fs file descriptor
 * @param buffer the data to write
 * @param offset where in the buffer to start from
 * @param length how much to write
 * @param position if integer, position to write at in the file. if null, write from the current position
 * @param context context object for passing error number
 */
export function writeBuffer(
  fd: number,
  buffer: Uint8Array,
  offset: number,
  length: number,
  position: number | null,
  ctx: { errno?: number },
) {
  assert(offset >= 0, "offset should be greater or equal to 0");
  assert(
    offset + length <= buffer.byteLength,
    `buffer doesn't have enough data: byteLength = ${buffer.byteLength}, offset + length = ${
      offset +
      length
    }`,
  );

  if (position) {
    op_fs_seek_sync(fd, position, io.SeekMode.Current);
  }

  const subarray = buffer.subarray(offset, offset + length);

  try {
    return io.writeSync(fd, subarray);
  } catch (e) {
    ctx.errno = extractOsErrorNumberFromErrorMessage(e);
    return 0;
  }
}

function extractOsErrorNumberFromErrorMessage(e: unknown): number {
  const match = e instanceof Error
    ? e.message.match(/\(os error (\d+)\)/)
    : false;

  if (match) {
    return +match[1];
  }

  return 255; // Unknown error
}
