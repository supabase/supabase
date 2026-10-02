// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { Buffer } from "node:buffer";

export const MAX_RANDOM_VALUES = 65536;
export const MAX_SIZE = 4294967295;

function generateRandomBytes(size: number) {
  if (size > MAX_SIZE) {
    throw new RangeError(
      `The value of "size" is out of range. It must be >= 0 && <= ${MAX_SIZE}. Received ${size}`,
    );
  }

  const bytes = Buffer.allocUnsafe(size);

  //Work around for getRandomValues max generation
  if (size > MAX_RANDOM_VALUES) {
    for (let generated = 0; generated < size; generated += MAX_RANDOM_VALUES) {
      globalThis.crypto.getRandomValues(
        bytes.slice(generated, generated + MAX_RANDOM_VALUES),
      );
    }
  } else {
    globalThis.crypto.getRandomValues(bytes);
  }

  return bytes;
}

/**
 * @param size Buffer length, must be equal or greater than zero
 */
export default function randomBytes(size: number): Buffer;
export default function randomBytes(
  size: number,
  cb?: (err: Error | null, buf?: Buffer) => void,
): void;
export default function randomBytes(
  size: number,
  cb?: (err: Error | null, buf?: Buffer) => void,
): Buffer | void {
  if (typeof cb === "function") {
    let err: Error | null = null, bytes: Buffer;
    try {
      bytes = generateRandomBytes(size);
    } catch (e) {
      //NodeJS nonsense
      //If the size is out of range it will throw sync, otherwise throw async
      if (
        e instanceof RangeError &&
        e.message.includes('The value of "size" is out of range')
      ) {
        throw e;
      } else if (e instanceof Error) {
        err = e;
      } else {
        err = new Error("[non-error thrown]");
      }
    }
    setTimeout(() => {
      if (err) {
        cb(err);
      } else {
        cb(null, bytes);
      }
    }, 0);
  } else {
    return generateRandomBytes(size);
  }
}
