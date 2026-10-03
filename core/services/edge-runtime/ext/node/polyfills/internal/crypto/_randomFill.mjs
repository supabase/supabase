// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { op_node_fill_random, op_node_fill_random_async } from "ext:core/ops";

import { MAX_SIZE as kMaxUint32 } from "ext:deno_node/internal/crypto/_randomBytes.ts";
import { Buffer } from "node:buffer";
import { isAnyArrayBuffer, isArrayBufferView } from "node:util/types";
import { ERR_INVALID_ARG_TYPE } from "ext:deno_node/internal/errors.ts";

const kBufferMaxLength = 0x7fffffff;

function assertOffset(offset, length) {
  if (offset > kMaxUint32 || offset < 0) {
    throw new TypeError("offset must be a uint32");
  }

  if (offset > kBufferMaxLength || offset > length) {
    throw new RangeError("offset out of range");
  }
}

function assertSize(size, offset, length) {
  if (size > kMaxUint32 || size < 0) {
    throw new TypeError("size must be a uint32");
  }

  if (size + offset > length || size > kBufferMaxLength) {
    throw new RangeError("buffer too small");
  }
}

export default function randomFill(buf, offset, size, cb) {
  if (typeof offset === "function") {
    cb = offset;
    offset = 0;
    size = buf.length;
  } else if (typeof size === "function") {
    cb = size;
    size = buf.length - Number(offset);
  }

  assertOffset(offset, buf.length);
  assertSize(size, offset, buf.length);

  op_node_fill_random_async(Math.floor(size)).then((randomData) => {
    const randomBuf = Buffer.from(randomData.buffer);
    randomBuf.copy(buf, offset, 0, size);
    cb(null, buf);
  });
}

export function randomFillSync(buf, offset = 0, size) {
  if (!isAnyArrayBuffer(buf) && !isArrayBufferView(buf)) {
    throw new ERR_INVALID_ARG_TYPE(
      "buf",
      ["ArrayBuffer", "ArrayBufferView"],
      buf,
    );
  }

  assertOffset(offset, buf.byteLength);

  if (size === undefined) {
    size = buf.byteLength - offset;
  } else {
    assertSize(size, offset, buf.byteLength);
  }

  if (size === 0) {
    return buf;
  }

  const bytes = isAnyArrayBuffer(buf)
    ? new Uint8Array(buf, offset, size)
    : new Uint8Array(buf.buffer, buf.byteOffset + offset, size);
  op_node_fill_random(bytes);

  return buf;
}
