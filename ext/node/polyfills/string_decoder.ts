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

// Logic and comments translated pretty much one-to-one from node's impl
// (https://github.com/nodejs/node/blob/ba06c5c509956dc413f91b755c1c93798bb700d4/src/string_decoder.cc)

import { Buffer, constants } from "node:buffer";
import { normalizeEncoding as castEncoding } from "ext:deno_node/_utils.ts";
import {
  ERR_INVALID_ARG_TYPE,
  ERR_INVALID_THIS,
  ERR_UNKNOWN_ENCODING,
  NodeError,
} from "ext:deno_node/internal/errors.ts";

import { core, primordials } from "ext:core/mod.js";
const {
  ArrayBufferIsView,
  ObjectDefineProperties,
  Symbol,
  MathMin,
  DataViewPrototypeGetBuffer,
  ObjectPrototypeIsPrototypeOf,
  String,
  TypedArrayPrototypeGetBuffer,
  StringPrototypeToLowerCase,
} = primordials;
const { isTypedArray } = core;

const { MAX_STRING_LENGTH } = constants;

// to cast from string to `BufferEncoding`, which doesn't seem nameable from here
// deno-lint-ignore no-explicit-any
type Any = any;

function normalizeEncoding(enc?: string): string {
  const encoding = castEncoding(enc ?? null);
  if (!encoding) {
    if (typeof enc !== "string" || StringPrototypeToLowerCase(enc) !== "raw") {
      throw new ERR_UNKNOWN_ENCODING(
        enc as Any,
      );
    }
  }
  return String(encoding);
}

/**
 * Check is `ArrayBuffer` and not `TypedArray`. Typescript allowed `TypedArray` to be passed as `ArrayBuffer` and does not do a deep check
 */

function isBufferType(buf: Buffer) {
  return ObjectPrototypeIsPrototypeOf(Buffer.prototype, buf) &&
    buf.BYTES_PER_ELEMENT;
}

function normalizeBuffer(buf: Buffer) {
  if (!ArrayBufferIsView(buf)) {
    throw new ERR_INVALID_ARG_TYPE(
      "buf",
      ["Buffer", "TypedArray", "DataView"],
      buf,
    );
  }
  if (isBufferType(buf)) {
    return buf;
  } else {
    return Buffer.from(
      isTypedArray(buf)
        ? TypedArrayPrototypeGetBuffer(buf)
        : DataViewPrototypeGetBuffer(buf),
    );
  }
}

function bufferToString(
  buf: Buffer,
  encoding?: string,
  start?: number,
  end?: number,
): string {
  const len = (end ?? buf.length) - (start ?? 0);
  if (len > MAX_STRING_LENGTH) {
    throw new NodeError("ERR_STRING_TOO_LONG", "string exceeds maximum length");
  }
  // deno-lint-ignore prefer-primordials
  return buf.toString(encoding as Any, start, end);
}

// the heart of the logic, decodes a buffer, storing
// incomplete characters in a buffer if applicable
function decode(this: StringDecoder, buf: Buffer) {
  const enc = this.enc;

  let bufIdx = 0;
  let bufEnd = buf.length;

  let prepend = "";
  let rest = "";

  if (
    enc === Encoding.Utf8 || enc === Encoding.Utf16 || enc === Encoding.Base64
  ) {
    // check if we need to finish an incomplete char from the last chunk
    // written. If we do, we copy the bytes into our `lastChar` buffer
    // and prepend the completed char to the result of decoding the rest of the buffer
    if (this[kMissingBytes] > 0) {
      if (enc === Encoding.Utf8) {
        // Edge case for incomplete character at a chunk boundary
        // (see https://github.com/nodejs/node/blob/73025c4dec042e344eeea7912ed39f7b7c4a3991/src/string_decoder.cc#L74)
        for (
          let i = 0;
          i < buf.length - bufIdx && i < this[kMissingBytes];
          i++
        ) {
          if ((buf[i] & 0xC0) !== 0x80) {
            // We expected a continuation byte, but got something else.
            // Stop trying to decode the incomplete char, and assume
            // the byte we got starts a new char.
            this[kMissingBytes] = 0;
            buf.copy(this.lastChar, this[kBufferedBytes], bufIdx, bufIdx + i);
            this[kBufferedBytes] += i;
            bufIdx += i;
            break;
          }
        }
      }

      const bytesToCopy = MathMin(buf.length - bufIdx, this[kMissingBytes]);
      buf.copy(
        this.lastChar,
        this[kBufferedBytes],
        bufIdx,
        bufIdx + bytesToCopy,
      );

      bufIdx += bytesToCopy;

      this[kBufferedBytes] += bytesToCopy;
      this[kMissingBytes] -= bytesToCopy;

      if (this[kMissingBytes] === 0) {
        // we have all the bytes, complete the char
        prepend = bufferToString(
          this.lastChar,
          this.encoding,
          0,
          this[kBufferedBytes],
        );
        // reset the char buffer
        this[kBufferedBytes] = 0;
      }
    }

    if (buf.length - bufIdx === 0) {
      // we advanced the bufIdx, so we may have completed the
      // incomplete char
      rest = prepend.length > 0 ? prepend : "";
      prepend = "";
    } else {
      // no characters left to finish

      // check if the end of the buffer has an incomplete
      // character, if so we write it into our `lastChar` buffer and
      // truncate buf
      if (enc === Encoding.Utf8 && (buf[buf.length - 1] & 0x80)) {
        for (let i = buf.length - 1;; i--) {
          this[kBufferedBytes] += 1;
          if ((buf[i] & 0xC0) === 0x80) {
            // Doesn't start a character (i.e. it's a trailing byte)
            if (this[kBufferedBytes] >= 4 || i === 0) {
              // invalid utf8, we'll just pass it to the underlying decoder
              this[kBufferedBytes] = 0;
              break;
            }
          } else {
            // First byte of a UTF-8 char, check
            // to see how long it should be
            if ((buf[i] & 0xE0) === 0xC0) {
              this[kMissingBytes] = 2;
            } else if ((buf[i] & 0xF0) === 0xE0) {
              this[kMissingBytes] = 3;
            } else if ((buf[i] & 0xF8) === 0xF0) {
              this[kMissingBytes] = 4;
            } else {
              // invalid
              this[kBufferedBytes] = 0;
              break;
            }

            if (this[kBufferedBytes] >= this[kMissingBytes]) {
              // We have enough trailing bytes to complete
              // the char
              this[kMissingBytes] = 0;
              this[kBufferedBytes] = 0;
            }

            this[kMissingBytes] -= this[kBufferedBytes];
            break;
          }
        }
      } else if (enc === Encoding.Utf16) {
        if ((buf.length - bufIdx) % 2 === 1) {
          // Have half of a code unit
          this[kBufferedBytes] = 1;
          this[kMissingBytes] = 1;
        } else if ((buf[buf.length - 1] & 0xFC) === 0xD8) {
          // 2 bytes out of a 4 byte UTF-16 char
          this[kBufferedBytes] = 2;
          this[kMissingBytes] = 2;
        }
      } else if (enc === Encoding.Base64) {
        this[kBufferedBytes] = (buf.length - bufIdx) % 3;
        if (this[kBufferedBytes] > 0) {
          this[kMissingBytes] = 3 - this[kBufferedBytes];
        }
      }

      if (this[kBufferedBytes] > 0) {
        // Copy the bytes that make up the incomplete char
        // from the end of the buffer into our `lastChar` buffer
        buf.copy(
          this.lastChar,
          0,
          buf.length - this[kBufferedBytes],
        );
        bufEnd -= this[kBufferedBytes];
      }

      rest = bufferToString(buf, this.encoding, bufIdx, bufEnd);
    }

    if (prepend.length === 0) {
      return rest;
    } else {
      return prepend + rest;
    }
  } else {
    return bufferToString(buf, this.encoding, bufIdx, bufEnd);
  }
}

function flush(this: StringDecoder) {
  const enc = this.enc;

  if (enc === Encoding.Utf16 && this[kBufferedBytes] % 2 === 1) {
    // ignore trailing byte if it isn't a complete code unit (2 bytes)
    this[kBufferedBytes] -= 1;
    this[kMissingBytes] -= 1;
  }

  if (this[kBufferedBytes] === 0) {
    return "";
  }

  const ret = bufferToString(
    this.lastChar,
    this.encoding,
    0,
    this[kBufferedBytes],
  );

  this[kBufferedBytes] = 0;
  this[kMissingBytes] = 0;

  return ret;
}

enum Encoding {
  Utf8,
  Base64,
  Utf16,
  Ascii,
  Latin1,
  Hex,
}

const kBufferedBytes = Symbol("bufferedBytes");
const kMissingBytes = Symbol("missingBytes");

type StringDecoder = {
  encoding: string;
  end: (buf: Buffer) => string;
  write: (buf: Buffer) => string;
  lastChar: Buffer;
  lastNeed: number;
  lastTotal: number;
  text: (buf: Buffer, idx: number) => string;
  enc: Encoding;

  decode: (buf: Buffer) => string;

  [kBufferedBytes]: number;
  [kMissingBytes]: number;

  flush: () => string;
};

/*
 * StringDecoder provides an interface for efficiently splitting a series of
 * buffers into a series of JS strings without breaking apart multi-byte
 * characters.
 */
export function StringDecoder(this: Partial<StringDecoder>, encoding?: string) {
  const normalizedEncoding = normalizeEncoding(encoding);
  let enc: Encoding = Encoding.Utf8;
  let bufLen = 0;
  switch (normalizedEncoding) {
    case "utf8":
      enc = Encoding.Utf8;
      bufLen = 4;
      break;
    case "base64":
      enc = Encoding.Base64;
      bufLen = 3;
      break;
    case "utf16le":
      enc = Encoding.Utf16;
      bufLen = 4;
      break;
    case "hex":
      enc = Encoding.Hex;
      bufLen = 0;
      break;
    case "latin1":
      enc = Encoding.Latin1;
      bufLen = 0;
      break;
    case "ascii":
      enc = Encoding.Ascii;
      bufLen = 0;
      break;
  }
  this.encoding = normalizedEncoding;
  this.lastChar = Buffer.allocUnsafe(bufLen);
  this.enc = enc;
  this[kBufferedBytes] = 0;
  this[kMissingBytes] = 0;
  this.flush = flush;
  this.decode = decode;
}

/**
 * Returns a decoded string, omitting any incomplete multi-bytes
 * characters at the end of the Buffer, or TypedArray, or DataView
 */
StringDecoder.prototype.write = function write(buf: Buffer): string {
  if (typeof buf === "string") {
    return buf;
  }
  const normalizedBuf = normalizeBuffer(buf);
  if (this[kBufferedBytes] === undefined) {
    throw new ERR_INVALID_THIS("StringDecoder");
  }
  return this.decode(normalizedBuf);
};

/**
 * Returns any remaining input stored in the internal buffer as a string.
 * After end() is called, the stringDecoder object can be reused for new
 * input.
 */
StringDecoder.prototype.end = function end(buf: Buffer): string {
  let ret = "";
  if (buf !== undefined) {
    ret = this.write(buf);
  }
  if (this[kBufferedBytes] > 0) {
    ret += this.flush();
  }
  return ret;
};

// Below is undocumented but accessible stuff from node's old impl
// (node's tests assert on these, so we need to support them)
StringDecoder.prototype.text = function text(
  buf: Buffer,
  offset: number,
): string {
  this[kBufferedBytes] = 0;
  this[kMissingBytes] = 0;
  return this.write(buf.subarray(offset));
};

ObjectDefineProperties(StringDecoder.prototype, {
  lastNeed: {
    __proto__: null,
    configurable: true,
    enumerable: true,
    get(this: StringDecoder): number {
      return this[kMissingBytes];
    },
  },
  lastTotal: {
    __proto__: null,
    configurable: true,
    enumerable: true,
    get(this: StringDecoder): number {
      return this[kBufferedBytes] + this[kMissingBytes];
    },
  },
});

export default { StringDecoder };
