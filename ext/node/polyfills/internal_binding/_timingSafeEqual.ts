// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { Buffer } from "node:buffer";

function toDataView(ab: ArrayBufferLike | ArrayBufferView): DataView {
  if (ArrayBuffer.isView(ab)) {
    return new DataView(ab.buffer, ab.byteOffset, ab.byteLength);
  }
  return new DataView(ab);
}

/** Compare to array buffers or data views in a way that timing based attacks
 * cannot gain information about the platform. */
function stdTimingSafeEqual(
  a: ArrayBufferView | ArrayBufferLike | DataView,
  b: ArrayBufferView | ArrayBufferLike | DataView,
): boolean {
  if (a.byteLength !== b.byteLength) {
    return false;
  }
  if (!(a instanceof DataView)) {
    a = toDataView(a);
  }
  if (!(b instanceof DataView)) {
    b = toDataView(b);
  }
  const length = a.byteLength;
  let out = 0;
  let i = -1;
  while (++i < length) {
    out |= a.getUint8(i) ^ b.getUint8(i);
  }
  return out === 0;
}

export const timingSafeEqual = (
  a: Buffer | DataView | ArrayBuffer,
  b: Buffer | DataView | ArrayBuffer,
): boolean => {
  if (a instanceof Buffer) {
    a = new DataView(a.buffer, a.byteOffset, a.byteLength);
  }
  if (b instanceof Buffer) {
    b = new DataView(b.buffer, b.byteOffset, b.byteLength);
  }
  return stdTimingSafeEqual(a, b);
};
