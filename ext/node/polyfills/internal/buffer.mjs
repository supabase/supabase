// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// Copyright Feross Aboukhadijeh, and other contributors. All rights reserved. MIT license.

import { core, primordials } from "ext:core/mod.js";
const {
  isAnyArrayBuffer,
  isArrayBuffer,
  isDataView,
  isSharedArrayBuffer,
  isTypedArray,
} = core;
const {
  ArrayBufferPrototypeGetByteLength,
  ArrayBufferPrototypeGetDetached,
  ArrayIsArray,
  ArrayPrototypeSlice,
  BigInt,
  DataViewPrototypeGetByteLength,
  Float32Array,
  Float64Array,
  MathFloor,
  MathMin,
  Number,
  NumberIsInteger,
  NumberIsNaN,
  NumberMAX_SAFE_INTEGER,
  NumberMIN_SAFE_INTEGER,
  NumberPrototypeToString,
  ObjectCreate,
  ObjectDefineProperty,
  ObjectPrototypeIsPrototypeOf,
  ObjectSetPrototypeOf,
  RangeError,
  SafeRegExp,
  String,
  StringFromCharCode,
  StringPrototypeCharCodeAt,
  StringPrototypeIncludes,
  StringPrototypeReplace,
  StringPrototypeToLowerCase,
  StringPrototypeTrim,
  SymbolFor,
  SymbolToPrimitive,
  TypeError,
  TypeErrorPrototype,
  TypedArrayPrototypeCopyWithin,
  TypedArrayPrototypeFill,
  TypedArrayPrototypeGetBuffer,
  TypedArrayPrototypeGetByteLength,
  TypedArrayPrototypeGetByteOffset,
  TypedArrayPrototypeSet,
  TypedArrayPrototypeSlice,
  TypedArrayPrototypeSubarray,
  Uint8Array,
  Uint8ArrayPrototype,
} = primordials;
import { op_is_ascii, op_is_utf8, op_transcode } from "ext:core/ops";

import { TextDecoder, TextEncoder } from "ext:deno_web/08_text_encoding.js";
import { codes } from "ext:deno_node/internal/error_codes.ts";
import { encodings } from "ext:deno_node/internal_binding/string_decoder.ts";
import {
  indexOfBuffer,
  indexOfNumber,
} from "ext:deno_node/internal_binding/buffer.ts";
import {
  asciiToBytes,
  base64ToBytes,
  base64UrlToBytes,
  bytesToAscii,
  bytesToUtf16le,
  hexToBytes,
  utf16leToBytes,
} from "ext:deno_node/internal_binding/_utils.ts";
import { normalizeEncoding } from "ext:deno_node/internal/util.mjs";
import { validateBuffer } from "ext:deno_node/internal/validators.mjs";
import { isUint8Array } from "ext:deno_node/internal/util/types.ts";
import {
  ERR_INVALID_STATE,
  genericNodeError,
  NodeError,
} from "ext:deno_node/internal/errors.ts";
import {
  forgivingBase64Encode,
  forgivingBase64UrlEncode,
} from "ext:deno_web/00_infra.js";
import { atob, btoa } from "ext:deno_web/05_base64.js";
import { Blob } from "ext:deno_web/09_file.js";

export { atob, Blob, btoa };

const utf8Encoder = new TextEncoder();

// Temporary buffers to convert numbers.
const float32Array = new Float32Array(1);
const uInt8Float32Array = new Uint8Array(
  TypedArrayPrototypeGetBuffer(float32Array),
);
const float64Array = new Float64Array(1);
const uInt8Float64Array = new Uint8Array(
  TypedArrayPrototypeGetBuffer(float64Array),
);

// Check endianness.
float32Array[0] = -1; // 0xBF800000
// Either it is [0, 0, 128, 191] or [191, 128, 0, 0]. It is not possible to
// check this with `os.endianness()` because that is determined at compile time.
export const bigEndian = uInt8Float32Array[3] === 0;

export const kMaxLength = 2147483647;
export const kStringMaxLength = 536870888;
const MAX_UINT32 = 2 ** 32;

const customInspectSymbol = SymbolFor("nodejs.util.inspect.custom");

export const INSPECT_MAX_BYTES = 50;

export const constants = {
  MAX_LENGTH: kMaxLength,
  MAX_STRING_LENGTH: kStringMaxLength,
};

ObjectDefineProperty(Buffer.prototype, "parent", {
  __proto__: null,
  enumerable: true,
  get: function () {
    if (!BufferIsBuffer(this)) {
      return void 0;
    }
    return TypedArrayPrototypeGetBuffer(this);
  },
});

ObjectDefineProperty(Buffer.prototype, "offset", {
  __proto__: null,
  enumerable: true,
  get: function () {
    if (!BufferIsBuffer(this)) {
      return void 0;
    }
    return TypedArrayPrototypeGetByteOffset(this);
  },
});

function createBuffer(length) {
  if (length > kMaxLength) {
    throw new RangeError(
      'The value "' + length + '" is invalid for option "size"',
    );
  }
  const buf = new Uint8Array(length);
  ObjectSetPrototypeOf(buf, BufferPrototype);
  return buf;
}

/**
 * @param {ArrayBufferLike} O
 * @returns {boolean}
 */
function isDetachedBuffer(O) {
  if (isSharedArrayBuffer(O)) {
    return false;
  }
  return ArrayBufferPrototypeGetDetached(O);
}

export function Buffer(arg, encodingOrOffset, length) {
  if (typeof arg === "number") {
    if (typeof encodingOrOffset === "string") {
      throw new codes.ERR_INVALID_ARG_TYPE(
        "string",
        "string",
        arg,
      );
    }
    return _allocUnsafe(arg);
  }
  return _from(arg, encodingOrOffset, length);
}

Buffer.poolSize = 8192;

function _from(value, encodingOrOffset, length) {
  if (typeof value === "string") {
    return fromString(value, encodingOrOffset);
  }

  if (typeof value === "object" && value !== null) {
    if (isAnyArrayBuffer(value)) {
      return fromArrayBuffer(value, encodingOrOffset, length);
    }

    // deno-lint-ignore prefer-primordials
    const valueOf = value.valueOf && value.valueOf();
    if (
      valueOf != null &&
      valueOf !== value &&
      (typeof valueOf === "string" || typeof valueOf === "object")
    ) {
      return _from(valueOf, encodingOrOffset, length);
    }

    const b = fromObject(value);
    if (b) {
      return b;
    }

    if (typeof value[SymbolToPrimitive] === "function") {
      const primitive = value[SymbolToPrimitive]("string");
      if (typeof primitive === "string") {
        return fromString(primitive, encodingOrOffset);
      }
    }
  }

  throw new codes.ERR_INVALID_ARG_TYPE(
    "first argument",
    ["string", "Buffer", "ArrayBuffer", "Array", "Array-like Object"],
    value,
  );
}

const BufferFrom = Buffer.from = function from(
  value,
  encodingOrOffset,
  length,
) {
  return _from(value, encodingOrOffset, length);
};

const BufferPrototype = Buffer.prototype;

ObjectSetPrototypeOf(Buffer.prototype, Uint8ArrayPrototype);

ObjectSetPrototypeOf(Buffer, Uint8Array);

function assertSize(size) {
  validateNumber(size, "size", 0, kMaxLength);
}

function _alloc(size, fill, encoding) {
  assertSize(size);

  const buffer = createBuffer(size);
  if (fill !== undefined) {
    if (encoding !== undefined && typeof encoding !== "string") {
      throw new codes.ERR_INVALID_ARG_TYPE(
        "encoding",
        "string",
        encoding,
      );
    }
    // deno-lint-ignore prefer-primordials
    return buffer.fill(fill, encoding);
  }
  return buffer;
}

Buffer.alloc = function alloc(size, fill, encoding) {
  return _alloc(size, fill, encoding);
};

function _allocUnsafe(size) {
  assertSize(size);
  return createBuffer(size < 0 ? 0 : checked(size) | 0);
}

Buffer.allocUnsafe = function allocUnsafe(size) {
  return _allocUnsafe(size);
};

Buffer.allocUnsafeSlow = function allocUnsafeSlow(size) {
  return _allocUnsafe(size);
};

function fromString(string, encoding) {
  if (typeof encoding !== "string" || encoding === "") {
    encoding = "utf8";
  }
  if (!BufferIsEncoding(encoding)) {
    throw new codes.ERR_UNKNOWN_ENCODING(encoding);
  }
  const length = byteLength(string, encoding) | 0;
  let buf = createBuffer(length);
  const actual = buf.write(string, encoding);
  if (actual !== length) {
    // deno-lint-ignore prefer-primordials
    buf = buf.slice(0, actual);
  }
  return buf;
}

function fromArrayLike(obj) {
  const buf = new Uint8Array(obj);
  ObjectSetPrototypeOf(buf, BufferPrototype);
  return buf;
}

function fromObject(obj) {
  // deno-lint-ignore prefer-primordials
  if (obj.length !== undefined || isAnyArrayBuffer(obj.buffer)) {
    if (typeof obj.length !== "number") {
      return createBuffer(0);
    }

    return fromArrayLike(obj);
  }

  if (obj.type === "Buffer" && ArrayIsArray(obj.data)) {
    return fromArrayLike(obj.data);
  }
}

function checked(length) {
  if (length >= kMaxLength) {
    throw new RangeError(
      "Attempt to allocate Buffer larger than maximum size: 0x" +
        NumberPrototypeToString(kMaxLength, 16) + " bytes",
    );
  }
  return length | 0;
}

export function SlowBuffer(length) {
  assertSize(length);
  return _alloc(+length);
}

ObjectSetPrototypeOf(SlowBuffer.prototype, Uint8ArrayPrototype);

ObjectSetPrototypeOf(SlowBuffer, Uint8Array);

const BufferIsBuffer = Buffer.isBuffer = function isBuffer(b) {
  return b != null && b._isBuffer === true && b !== BufferPrototype;
};

const BufferCompare = Buffer.compare = function compare(a, b) {
  if (isUint8Array(a)) {
    a = BufferFrom(
      a,
      TypedArrayPrototypeGetByteOffset(a),
      TypedArrayPrototypeGetByteLength(a),
    );
  }
  if (isUint8Array(b)) {
    b = BufferFrom(
      b,
      TypedArrayPrototypeGetByteOffset(b),
      TypedArrayPrototypeGetByteLength(b),
    );
  }
  if (!BufferIsBuffer(a) || !BufferIsBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array',
    );
  }
  if (a === b) {
    return 0;
  }
  let x = a.length;
  let y = b.length;
  for (let i = 0, len = MathMin(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break;
    }
  }
  if (x < y) {
    return -1;
  }
  if (y < x) {
    return 1;
  }
  return 0;
};

const BufferIsEncoding = Buffer.isEncoding = function isEncoding(encoding) {
  return typeof encoding === "string" && encoding.length !== 0 &&
    normalizeEncoding(encoding) !== undefined;
};

Buffer.concat = function concat(list, length) {
  if (!ArrayIsArray(list)) {
    throw new codes.ERR_INVALID_ARG_TYPE("list", "Array", list);
  }

  if (list.length === 0) {
    return _alloc(0);
  }

  if (length === undefined) {
    length = 0;
    for (let i = 0; i < list.length; i++) {
      if (list[i].length) {
        length += list[i].length;
      }
    }
  } else {
    validateOffset(length, "length");
  }

  const buffer = _allocUnsafe(length);
  let pos = 0;
  for (let i = 0; i < list.length; i++) {
    const buf = list[i];
    if (!isUint8Array(buf)) {
      // TODO(BridgeAR): This should not be of type ERR_INVALID_ARG_TYPE.
      // Instead, find the proper error code for this.
      throw new codes.ERR_INVALID_ARG_TYPE(
        `list[${i}]`,
        ["Buffer", "Uint8Array"],
        list[i],
      );
    }
    pos += _copyActual(buf, buffer, pos, 0, buf.length);
  }

  // Note: `length` is always equal to `buffer.length` at this point
  if (pos < length) {
    // Zero-fill the remaining bytes if the specified `length` was more than
    // the actual total length, i.e. if we have some remaining allocated bytes
    // there were not initialized.
    TypedArrayPrototypeFill(buffer, 0, pos, length);
  }

  return buffer;
};

function byteLength(string, encoding) {
  if (typeof string !== "string") {
    if (isTypedArray(string)) {
      return TypedArrayPrototypeGetByteLength(string);
    }
    if (isDataView(string)) {
      return DataViewPrototypeGetByteLength(string);
    }
    if (isArrayBuffer(string)) {
      return ArrayBufferPrototypeGetByteLength(string);
    }
    if (isSharedArrayBuffer(string)) {
      // TODO(petamoriken): add SharedArayBuffer to primordials
      // deno-lint-ignore prefer-primordials
      return string.byteLength;
    }

    throw new codes.ERR_INVALID_ARG_TYPE(
      "string",
      ["string", "Buffer", "ArrayBuffer"],
      string,
    );
  }

  const len = string.length;
  const mustMatch = arguments.length > 2 && arguments[2] === true;
  if (!mustMatch && len === 0) {
    return 0;
  }

  if (!encoding) {
    return (mustMatch ? -1 : byteLengthUtf8(string));
  }

  const ops = getEncodingOps(encoding);
  if (ops === undefined) {
    return (mustMatch ? -1 : byteLengthUtf8(string));
  }
  return ops.byteLength(string);
}

Buffer.byteLength = byteLength;

Buffer.prototype._isBuffer = true;

function swap(b, n, m) {
  const i = b[n];
  b[n] = b[m];
  b[m] = i;
}

Buffer.prototype.swap16 = function swap16() {
  const len = this.length;
  if (len % 2 !== 0) {
    throw new RangeError("Buffer size must be a multiple of 16-bits");
  }
  for (let i = 0; i < len; i += 2) {
    swap(this, i, i + 1);
  }
  return this;
};

Buffer.prototype.swap32 = function swap32() {
  const len = this.length;
  if (len % 4 !== 0) {
    throw new RangeError("Buffer size must be a multiple of 32-bits");
  }
  for (let i = 0; i < len; i += 4) {
    swap(this, i, i + 3);
    swap(this, i + 1, i + 2);
  }
  return this;
};

Buffer.prototype.swap64 = function swap64() {
  const len = this.length;
  if (len % 8 !== 0) {
    throw new RangeError("Buffer size must be a multiple of 64-bits");
  }
  for (let i = 0; i < len; i += 8) {
    swap(this, i, i + 7);
    swap(this, i + 1, i + 6);
    swap(this, i + 2, i + 5);
    swap(this, i + 3, i + 4);
  }
  return this;
};

Buffer.prototype.toString = function toString(encoding, start, end) {
  if (arguments.length === 0) {
    return this.utf8Slice(0, this.length);
  }

  const len = this.length;

  if (start <= 0) {
    start = 0;
  } else if (start >= len) {
    return "";
  } else {
    start |= 0;
  }

  if (end === undefined || end > len) {
    end = len;
  } else {
    end |= 0;
  }

  if (end <= start) {
    return "";
  }

  if (encoding === undefined) {
    return this.utf8Slice(start, end);
  }

  const ops = getEncodingOps(encoding);
  if (ops === undefined) {
    throw new codes.ERR_UNKNOWN_ENCODING(encoding);
  }

  // deno-lint-ignore prefer-primordials
  return ops.slice(this, start, end);
};

Buffer.prototype.toLocaleString = Buffer.prototype.toString;

Buffer.prototype.equals = function equals(b) {
  if (!isUint8Array(b)) {
    throw new codes.ERR_INVALID_ARG_TYPE(
      "otherBuffer",
      ["Buffer", "Uint8Array"],
      b,
    );
  }
  if (this === b) {
    return true;
  }
  return BufferCompare(this, b) === 0;
};

const SPACER_PATTERN = new SafeRegExp(/(.{2})/g);

Buffer.prototype[customInspectSymbol] =
  Buffer.prototype.inspect =
    function inspect() {
      let str = "";
      const max = INSPECT_MAX_BYTES;
      str = StringPrototypeTrim(
        StringPrototypeReplace(
          // deno-lint-ignore prefer-primordials
          this.toString("hex", 0, max),
          SPACER_PATTERN,
          "$1 ",
        ),
      );
      if (this.length > max) {
        str += " ... ";
      }
      return "<Buffer " + str + ">";
    };

Buffer.prototype.compare = function compare(
  target,
  start,
  end,
  thisStart,
  thisEnd,
) {
  if (isUint8Array(target)) {
    target = BufferFrom(
      target,
      TypedArrayPrototypeGetByteOffset(target),
      TypedArrayPrototypeGetByteLength(target),
    );
  }
  if (!BufferIsBuffer(target)) {
    throw new codes.ERR_INVALID_ARG_TYPE(
      "target",
      ["Buffer", "Uint8Array"],
      target,
    );
  }

  if (start === undefined) {
    start = 0;
  } else {
    validateOffset(start, "targetStart", 0, kMaxLength);
  }

  if (end === undefined) {
    end = target.length;
  } else {
    validateOffset(end, "targetEnd", 0, target.length);
  }

  if (thisStart === undefined) {
    thisStart = 0;
  } else {
    validateOffset(start, "sourceStart", 0, kMaxLength);
  }

  if (thisEnd === undefined) {
    thisEnd = this.length;
  } else {
    validateOffset(end, "sourceEnd", 0, this.length);
  }

  if (
    start < 0 || end > target.length || thisStart < 0 ||
    thisEnd > this.length
  ) {
    throw new codes.ERR_OUT_OF_RANGE("out of range index", "range");
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0;
  }
  if (thisStart >= thisEnd) {
    return -1;
  }
  if (start >= end) {
    return 1;
  }
  start >>>= 0;
  end >>>= 0;
  thisStart >>>= 0;
  thisEnd >>>= 0;
  if (this === target) {
    return 0;
  }
  let x = thisEnd - thisStart;
  let y = end - start;
  const len = MathMin(x, y);
  const thisCopy = TypedArrayPrototypeSlice(this, thisStart, thisEnd);
  // deno-lint-ignore prefer-primordials
  const targetCopy = target.slice(start, end);
  for (let i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i];
      y = targetCopy[i];
      break;
    }
  }
  if (x < y) {
    return -1;
  }
  if (y < x) {
    return 1;
  }
  return 0;
};

function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
  validateBuffer(buffer);

  if (typeof byteOffset === "string") {
    encoding = byteOffset;
    byteOffset = undefined;
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff;
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000;
  }
  byteOffset = +byteOffset;
  if (NumberIsNaN(byteOffset)) {
    // deno-lint-ignore prefer-primordials
    byteOffset = dir ? 0 : (buffer.length || buffer.byteLength);
  }
  dir = !!dir;

  if (typeof val === "number") {
    return indexOfNumber(buffer, val >>> 0, byteOffset, dir);
  }

  let ops;
  if (encoding === undefined) {
    ops = encodingOps.utf8;
  } else {
    ops = getEncodingOps(encoding);
  }

  if (typeof val === "string") {
    if (ops === undefined) {
      throw new codes.ERR_UNKNOWN_ENCODING(encoding);
    }
    // deno-lint-ignore prefer-primordials
    return ops.indexOf(buffer, val, byteOffset, dir);
  }

  if (isUint8Array(val)) {
    const encodingVal = ops === undefined ? encodingsMap.utf8 : ops.encodingVal;
    return indexOfBuffer(buffer, val, byteOffset, encodingVal, dir);
  }

  throw new codes.ERR_INVALID_ARG_TYPE(
    "value",
    ["number", "string", "Buffer", "Uint8Array"],
    val,
  );
}

Buffer.prototype.includes = function includes(val, byteOffset, encoding) {
  // deno-lint-ignore prefer-primordials
  return this.indexOf(val, byteOffset, encoding) !== -1;
};

Buffer.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
};

Buffer.prototype.lastIndexOf = function lastIndexOf(
  val,
  byteOffset,
  encoding,
) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
};

Buffer.prototype.asciiSlice = function asciiSlice(offset, length) {
  if (offset === 0 && length === this.length) {
    return bytesToAscii(this);
  } else {
    return bytesToAscii(TypedArrayPrototypeSlice(this, offset, length));
  }
};

Buffer.prototype.asciiWrite = function asciiWrite(string, offset, length) {
  return blitBuffer(asciiToBytes(string), this, offset, length);
};

Buffer.prototype.base64Slice = function base64Slice(
  offset,
  length,
) {
  if (offset === 0 && length === this.length) {
    return forgivingBase64Encode(this);
  } else {
    return forgivingBase64Encode(
      TypedArrayPrototypeSlice(this, offset, length),
    );
  }
};

Buffer.prototype.base64Write = function base64Write(
  string,
  offset,
  length,
) {
  return blitBuffer(base64ToBytes(string), this, offset, length);
};

Buffer.prototype.base64urlSlice = function base64urlSlice(
  offset,
  length,
) {
  if (offset === 0 && length === this.length) {
    return forgivingBase64UrlEncode(this);
  } else {
    return forgivingBase64UrlEncode(
      TypedArrayPrototypeSlice(this, offset, length),
    );
  }
};

Buffer.prototype.base64urlWrite = function base64urlWrite(
  string,
  offset,
  length,
) {
  return blitBuffer(base64UrlToBytes(string), this, offset, length);
};

Buffer.prototype.hexWrite = function hexWrite(string, offset, length) {
  return blitBuffer(
    hexToBytes(string),
    this,
    offset,
    length,
  );
};

Buffer.prototype.hexSlice = function hexSlice(string, offset, length) {
  return _hexSlice(this, string, offset, length);
};

Buffer.prototype.latin1Slice = function latin1Slice(
  string,
  offset,
  length,
) {
  return _latin1Slice(this, string, offset, length);
};

Buffer.prototype.latin1Write = function latin1Write(
  string,
  offset,
  length,
) {
  return blitBuffer(asciiToBytes(string), this, offset, length);
};

Buffer.prototype.ucs2Slice = function ucs2Slice(offset, length) {
  if (offset === 0 && length === this.length) {
    return bytesToUtf16le(this);
  } else {
    return bytesToUtf16le(TypedArrayPrototypeSlice(this, offset, length));
  }
};

Buffer.prototype.ucs2Write = function ucs2Write(string, offset, length) {
  return blitBuffer(
    utf16leToBytes(string, this.length - offset),
    this,
    offset,
    length,
  );
};

Buffer.prototype.utf8Slice = function utf8Slice(string, offset, length) {
  return _utf8Slice(this, string, offset, length);
};

Buffer.prototype.utf8Write = function utf8Write(string, offset, length) {
  offset = offset || 0;
  const maxLength = MathMin(length || Infinity, this.length - offset);
  const buf = offset || maxLength < this.length
    ? TypedArrayPrototypeSubarray(this, offset, maxLength + offset)
    : this;
  return utf8Encoder.encodeInto(string, buf).written;
};

Buffer.prototype.write = function write(string, offset, length, encoding) {
  if (typeof string !== "string") {
    throw new codes.ERR_INVALID_ARG_TYPE("argument", "string");
  }
  // Buffer#write(string);
  if (offset === undefined) {
    return this.utf8Write(string, 0, this.length);
  }
  // Buffer#write(string, encoding)
  if (length === undefined && typeof offset === "string") {
    encoding = offset;
    length = this.length;
    offset = 0;

    // Buffer#write(string, offset[, length][, encoding])
  } else {
    validateOffset(offset, "offset", 0, this.length);

    const remaining = this.length - offset;

    if (length === undefined) {
      length = remaining;
    } else if (typeof length === "string") {
      encoding = length;
      length = remaining;
    } else {
      validateOffset(length, "length", 0, this.length);
      if (length > remaining) {
        length = remaining;
      }
    }
  }

  if (!encoding) {
    return this.utf8Write(string, offset, length);
  }

  const ops = getEncodingOps(encoding);
  if (ops === undefined) {
    throw new codes.ERR_UNKNOWN_ENCODING(encoding);
  }
  return ops.write(this, string, offset, length);
};

Buffer.prototype.toJSON = function toJSON() {
  return {
    type: "Buffer",
    data: ArrayPrototypeSlice(this._arr || this, 0),
  };
};
function fromArrayBuffer(obj, byteOffset, length) {
  // Convert byteOffset to integer
  if (byteOffset === undefined) {
    byteOffset = 0;
  } else {
    byteOffset = +byteOffset;
    if (NumberIsNaN(byteOffset)) {
      byteOffset = 0;
    }
  }

  // deno-lint-ignore prefer-primordials
  const maxLength = obj.byteLength - byteOffset;

  if (maxLength < 0) {
    throw new codes.ERR_BUFFER_OUT_OF_BOUNDS("offset");
  }

  if (length === undefined) {
    length = maxLength;
  } else {
    // Convert length to non-negative integer.
    length = +length;
    if (length > 0) {
      if (length > maxLength) {
        throw new codes.ERR_BUFFER_OUT_OF_BOUNDS("length");
      }
    } else {
      length = 0;
    }
  }

  const buffer = new Uint8Array(obj, byteOffset, length);
  ObjectSetPrototypeOf(buffer, BufferPrototype);
  return buffer;
}

function _base64Slice(buf, start, end) {
  if (start === 0 && end === buf.length) {
    return forgivingBase64Encode(buf);
  } else {
    // deno-lint-ignore prefer-primordials
    return forgivingBase64Encode(buf.slice(start, end));
  }
}

const decoder = new TextDecoder();

function _utf8Slice(buf, start, end) {
  try {
    // deno-lint-ignore prefer-primordials
    return decoder.decode(buf.slice(start, end));
  } catch (err) {
    if (ObjectPrototypeIsPrototypeOf(TypeErrorPrototype, err)) {
      throw new NodeError("ERR_STRING_TOO_LONG", "String too long");
    }
    throw err;
  }
}

function _latin1Slice(buf, start, end) {
  let ret = "";
  end = MathMin(buf.length, end);
  for (let i = start; i < end; ++i) {
    ret += StringFromCharCode(buf[i]);
  }
  return ret;
}

function _hexSlice(buf, start, end) {
  const len = buf.length;
  if (!start || start < 0) {
    start = 0;
  }
  if (!end || end < 0 || end > len) {
    end = len;
  }
  let out = "";
  for (let i = start; i < end; ++i) {
    out += hexSliceLookupTable[buf[i]];
  }
  return out;
}

Buffer.prototype.slice = function slice(start, end) {
  return this.subarray(start, end);
};

Buffer.prototype.readUintLE = Buffer.prototype.readUIntLE = function readUIntLE(
  offset,
  byteLength,
) {
  if (offset === undefined) {
    throw new codes.ERR_INVALID_ARG_TYPE("offset", "number", offset);
  }
  if (byteLength === 6) {
    return readUInt48LE(this, offset);
  }
  if (byteLength === 5) {
    return readUInt40LE(this, offset);
  }
  if (byteLength === 3) {
    return readUInt24LE(this, offset);
  }
  if (byteLength === 4) {
    return this.readUInt32LE(offset);
  }
  if (byteLength === 2) {
    return this.readUInt16LE(offset);
  }
  if (byteLength === 1) {
    return this.readUInt8(offset);
  }

  boundsError(byteLength, 6, "byteLength");
};

Buffer.prototype.readUintBE = Buffer.prototype.readUIntBE = function readUIntBE(
  offset,
  byteLength,
) {
  if (offset === undefined) {
    throw new codes.ERR_INVALID_ARG_TYPE("offset", "number", offset);
  }
  if (byteLength === 6) {
    return readUInt48BE(this, offset);
  }
  if (byteLength === 5) {
    return readUInt40BE(this, offset);
  }
  if (byteLength === 3) {
    return readUInt24BE(this, offset);
  }
  if (byteLength === 4) {
    return this.readUInt32BE(offset);
  }
  if (byteLength === 2) {
    return this.readUInt16BE(offset);
  }
  if (byteLength === 1) {
    return this.readUInt8(offset);
  }

  boundsError(byteLength, 6, "byteLength");
};

Buffer.prototype.readUint8 = Buffer.prototype.readUInt8 = function readUInt8(
  offset = 0,
) {
  validateNumber(offset, "offset");
  const val = this[offset];
  if (val === undefined) {
    boundsError(offset, this.length - 1);
  }

  return val;
};

Buffer.prototype.readUint16BE = Buffer.prototype.readUInt16BE = readUInt16BE;

Buffer.prototype.readUint16LE =
  Buffer.prototype.readUInt16LE =
    function readUInt16LE(offset = 0) {
      validateNumber(offset, "offset");
      const first = this[offset];
      const last = this[offset + 1];
      if (first === undefined || last === undefined) {
        boundsError(offset, this.length - 2);
      }

      return first + last * 2 ** 8;
    };

Buffer.prototype.readUint32LE =
  Buffer.prototype.readUInt32LE =
    function readUInt32LE(offset = 0) {
      validateNumber(offset, "offset");
      const first = this[offset];
      const last = this[offset + 3];
      if (first === undefined || last === undefined) {
        boundsError(offset, this.length - 4);
      }

      return first +
        this[++offset] * 2 ** 8 +
        this[++offset] * 2 ** 16 +
        last * 2 ** 24;
    };

Buffer.prototype.readUint32BE = Buffer.prototype.readUInt32BE = readUInt32BE;

Buffer.prototype.readBigUint64LE =
  Buffer.prototype.readBigUInt64LE =
    function readBigUInt64LE(offset) {
      offset = offset >>> 0;
      validateNumber(offset, "offset");
      const first = this[offset];
      const last = this[offset + 7];
      if (first === void 0 || last === void 0) {
        boundsError(offset, this.length - 8);
      }
      const lo = first + this[++offset] * 2 ** 8 +
        this[++offset] * 2 ** 16 +
        this[++offset] * 2 ** 24;
      const hi = this[++offset] + this[++offset] * 2 ** 8 +
        this[++offset] * 2 ** 16 + last * 2 ** 24;
      return BigInt(lo) + (BigInt(hi) << 32n);
    };

Buffer.prototype.readBigUint64BE =
  Buffer.prototype.readBigUInt64BE =
    function readBigUInt64BE(offset) {
      offset = offset >>> 0;
      validateNumber(offset, "offset");
      const first = this[offset];
      const last = this[offset + 7];
      if (first === void 0 || last === void 0) {
        boundsError(offset, this.length - 8);
      }
      const hi = first * 2 ** 24 + this[++offset] * 2 ** 16 +
        this[++offset] * 2 ** 8 + this[++offset];
      const lo = this[++offset] * 2 ** 24 + this[++offset] * 2 ** 16 +
        this[++offset] * 2 ** 8 + last;
      return (BigInt(hi) << 32n) + BigInt(lo);
    };

Buffer.prototype.readIntLE = function readIntLE(
  offset,
  byteLength,
) {
  if (offset === undefined) {
    throw new codes.ERR_INVALID_ARG_TYPE("offset", "number", offset);
  }
  if (byteLength === 6) {
    return readInt48LE(this, offset);
  }
  if (byteLength === 5) {
    return readInt40LE(this, offset);
  }
  if (byteLength === 3) {
    return readInt24LE(this, offset);
  }
  if (byteLength === 4) {
    return this.readInt32LE(offset);
  }
  if (byteLength === 2) {
    return this.readInt16LE(offset);
  }
  if (byteLength === 1) {
    return this.readInt8(offset);
  }

  boundsError(byteLength, 6, "byteLength");
};

Buffer.prototype.readIntBE = function readIntBE(offset, byteLength) {
  if (offset === undefined) {
    throw new codes.ERR_INVALID_ARG_TYPE("offset", "number", offset);
  }
  if (byteLength === 6) {
    return readInt48BE(this, offset);
  }
  if (byteLength === 5) {
    return readInt40BE(this, offset);
  }
  if (byteLength === 3) {
    return readInt24BE(this, offset);
  }
  if (byteLength === 4) {
    return this.readInt32BE(offset);
  }
  if (byteLength === 2) {
    return this.readInt16BE(offset);
  }
  if (byteLength === 1) {
    return this.readInt8(offset);
  }

  boundsError(byteLength, 6, "byteLength");
};

Buffer.prototype.readInt8 = function readInt8(offset = 0) {
  validateNumber(offset, "offset");
  const val = this[offset];
  if (val === undefined) {
    boundsError(offset, this.length - 1);
  }

  return val | (val & 2 ** 7) * 0x1fffffe;
};

Buffer.prototype.readInt16LE = function readInt16LE(offset = 0) {
  validateNumber(offset, "offset");
  const first = this[offset];
  const last = this[offset + 1];
  if (first === undefined || last === undefined) {
    boundsError(offset, this.length - 2);
  }

  const val = first + last * 2 ** 8;
  return val | (val & 2 ** 15) * 0x1fffe;
};

Buffer.prototype.readInt16BE = function readInt16BE(offset = 0) {
  validateNumber(offset, "offset");
  const first = this[offset];
  const last = this[offset + 1];
  if (first === undefined || last === undefined) {
    boundsError(offset, this.length - 2);
  }

  const val = first * 2 ** 8 + last;
  return val | (val & 2 ** 15) * 0x1fffe;
};

Buffer.prototype.readInt32LE = function readInt32LE(offset = 0) {
  validateNumber(offset, "offset");
  const first = this[offset];
  const last = this[offset + 3];
  if (first === undefined || last === undefined) {
    boundsError(offset, this.length - 4);
  }

  return first +
    this[++offset] * 2 ** 8 +
    this[++offset] * 2 ** 16 +
    (last << 24); // Overflow
};

Buffer.prototype.readInt32BE = function readInt32BE(offset = 0) {
  validateNumber(offset, "offset");
  const first = this[offset];
  const last = this[offset + 3];
  if (first === undefined || last === undefined) {
    boundsError(offset, this.length - 4);
  }

  return (first << 24) + // Overflow
    this[++offset] * 2 ** 16 +
    this[++offset] * 2 ** 8 +
    last;
};

Buffer.prototype.readBigInt64LE = function readBigInt64LE(offset) {
  offset = offset >>> 0;
  validateNumber(offset, "offset");
  const first = this[offset];
  const last = this[offset + 7];
  if (first === void 0 || last === void 0) {
    boundsError(offset, this.length - 8);
  }
  const val = this[offset + 4] + this[offset + 5] * 2 ** 8 +
    this[offset + 6] * 2 ** 16 + (last << 24);
  return (BigInt(val) << 32n) +
    BigInt(
      first + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 +
        this[++offset] * 2 ** 24,
    );
};

Buffer.prototype.readBigInt64BE = function readBigInt64BE(offset) {
  offset = offset >>> 0;
  validateNumber(offset, "offset");
  const first = this[offset];
  const last = this[offset + 7];
  if (first === void 0 || last === void 0) {
    boundsError(offset, this.length - 8);
  }
  const val = (first << 24) + this[++offset] * 2 ** 16 +
    this[++offset] * 2 ** 8 + this[++offset];
  return (BigInt(val) << 32n) +
    BigInt(
      this[++offset] * 2 ** 24 + this[++offset] * 2 ** 16 +
        this[++offset] * 2 ** 8 + last,
    );
};

Buffer.prototype.readFloatLE = function readFloatLE(offset) {
  return bigEndian
    ? readFloatBackwards(this, offset)
    : readFloatForwards(this, offset);
};

Buffer.prototype.readFloatBE = function readFloatBE(offset) {
  return bigEndian
    ? readFloatForwards(this, offset)
    : readFloatBackwards(this, offset);
};

Buffer.prototype.readDoubleLE = function readDoubleLE(offset) {
  return bigEndian
    ? readDoubleBackwards(this, offset)
    : readDoubleForwards(this, offset);
};

Buffer.prototype.readDoubleBE = function readDoubleBE(offset) {
  return bigEndian
    ? readDoubleForwards(this, offset)
    : readDoubleBackwards(this, offset);
};

Buffer.prototype.writeUintLE =
  Buffer.prototype.writeUIntLE =
    function writeUIntLE(value, offset, byteLength) {
      if (byteLength === 6) {
        return writeU_Int48LE(this, value, offset, 0, 0xffffffffffff);
      }
      if (byteLength === 5) {
        return writeU_Int40LE(this, value, offset, 0, 0xffffffffff);
      }
      if (byteLength === 3) {
        return writeU_Int24LE(this, value, offset, 0, 0xffffff);
      }
      if (byteLength === 4) {
        return writeU_Int32LE(this, value, offset, 0, 0xffffffff);
      }
      if (byteLength === 2) {
        return writeU_Int16LE(this, value, offset, 0, 0xffff);
      }
      if (byteLength === 1) {
        return writeU_Int8(this, value, offset, 0, 0xff);
      }

      boundsError(byteLength, 6, "byteLength");
    };

Buffer.prototype.writeUintBE =
  Buffer.prototype.writeUIntBE =
    function writeUIntBE(value, offset, byteLength) {
      if (byteLength === 6) {
        return writeU_Int48BE(this, value, offset, 0, 0xffffffffffff);
      }
      if (byteLength === 5) {
        return writeU_Int40BE(this, value, offset, 0, 0xffffffffff);
      }
      if (byteLength === 3) {
        return writeU_Int24BE(this, value, offset, 0, 0xffffff);
      }
      if (byteLength === 4) {
        return writeU_Int32BE(this, value, offset, 0, 0xffffffff);
      }
      if (byteLength === 2) {
        return writeU_Int16BE(this, value, offset, 0, 0xffff);
      }
      if (byteLength === 1) {
        return writeU_Int8(this, value, offset, 0, 0xff);
      }

      boundsError(byteLength, 6, "byteLength");
    };

Buffer.prototype.writeUint8 = Buffer.prototype.writeUInt8 = function writeUInt8(
  value,
  offset = 0,
) {
  return writeU_Int8(this, value, offset, 0, 0xff);
};

Buffer.prototype.writeUint16LE =
  Buffer.prototype.writeUInt16LE =
    function writeUInt16LE(value, offset = 0) {
      return writeU_Int16LE(this, value, offset, 0, 0xffff);
    };

Buffer.prototype.writeUint16BE =
  Buffer.prototype.writeUInt16BE =
    function writeUInt16BE(value, offset = 0) {
      return writeU_Int16BE(this, value, offset, 0, 0xffff);
    };

Buffer.prototype.writeUint32LE =
  Buffer.prototype.writeUInt32LE =
    function writeUInt32LE(value, offset = 0) {
      return _writeUInt32LE(this, value, offset, 0, 0xffffffff);
    };

Buffer.prototype.writeUint32BE =
  Buffer.prototype.writeUInt32BE =
    function writeUInt32BE(value, offset = 0) {
      return _writeUInt32BE(this, value, offset, 0, 0xffffffff);
    };

function wrtBigUInt64LE(buf, value, offset, min, max) {
  checkIntBI(value, min, max, buf, offset, 7);
  let lo = Number(value & 4294967295n);
  buf[offset++] = lo;
  lo = lo >> 8;
  buf[offset++] = lo;
  lo = lo >> 8;
  buf[offset++] = lo;
  lo = lo >> 8;
  buf[offset++] = lo;
  let hi = Number(value >> 32n & 4294967295n);
  buf[offset++] = hi;
  hi = hi >> 8;
  buf[offset++] = hi;
  hi = hi >> 8;
  buf[offset++] = hi;
  hi = hi >> 8;
  buf[offset++] = hi;
  return offset;
}

function wrtBigUInt64BE(buf, value, offset, min, max) {
  checkIntBI(value, min, max, buf, offset, 7);
  let lo = Number(value & 4294967295n);
  buf[offset + 7] = lo;
  lo = lo >> 8;
  buf[offset + 6] = lo;
  lo = lo >> 8;
  buf[offset + 5] = lo;
  lo = lo >> 8;
  buf[offset + 4] = lo;
  let hi = Number(value >> 32n & 4294967295n);
  buf[offset + 3] = hi;
  hi = hi >> 8;
  buf[offset + 2] = hi;
  hi = hi >> 8;
  buf[offset + 1] = hi;
  hi = hi >> 8;
  buf[offset] = hi;
  return offset + 8;
}

Buffer.prototype.writeBigUint64LE =
  Buffer.prototype.writeBigUInt64LE =
    function writeBigUInt64LE(value, offset = 0) {
      return wrtBigUInt64LE(
        this,
        value,
        offset,
        0n,
        0xffffffffffffffffn,
      );
    };

Buffer.prototype.writeBigUint64BE =
  Buffer.prototype.writeBigUInt64BE =
    function writeBigUInt64BE(value, offset = 0) {
      return wrtBigUInt64BE(
        this,
        value,
        offset,
        0n,
        0xffffffffffffffffn,
      );
    };

Buffer.prototype.writeIntLE = function writeIntLE(
  value,
  offset,
  byteLength,
) {
  if (byteLength === 6) {
    return writeU_Int48LE(
      this,
      value,
      offset,
      -0x800000000000,
      0x7fffffffffff,
    );
  }
  if (byteLength === 5) {
    return writeU_Int40LE(this, value, offset, -0x8000000000, 0x7fffffffff);
  }
  if (byteLength === 3) {
    return writeU_Int24LE(this, value, offset, -0x800000, 0x7fffff);
  }
  if (byteLength === 4) {
    return writeU_Int32LE(this, value, offset, -0x80000000, 0x7fffffff);
  }
  if (byteLength === 2) {
    return writeU_Int16LE(this, value, offset, -0x8000, 0x7fff);
  }
  if (byteLength === 1) {
    return writeU_Int8(this, value, offset, -0x80, 0x7f);
  }

  boundsError(byteLength, 6, "byteLength");
};

Buffer.prototype.writeIntBE = function writeIntBE(
  value,
  offset,
  byteLength,
) {
  if (byteLength === 6) {
    return writeU_Int48BE(
      this,
      value,
      offset,
      -0x800000000000,
      0x7fffffffffff,
    );
  }
  if (byteLength === 5) {
    return writeU_Int40BE(this, value, offset, -0x8000000000, 0x7fffffffff);
  }
  if (byteLength === 3) {
    return writeU_Int24BE(this, value, offset, -0x800000, 0x7fffff);
  }
  if (byteLength === 4) {
    return writeU_Int32BE(this, value, offset, -0x80000000, 0x7fffffff);
  }
  if (byteLength === 2) {
    return writeU_Int16BE(this, value, offset, -0x8000, 0x7fff);
  }
  if (byteLength === 1) {
    return writeU_Int8(this, value, offset, -0x80, 0x7f);
  }

  boundsError(byteLength, 6, "byteLength");
};

Buffer.prototype.writeInt8 = function writeInt8(value, offset = 0) {
  return writeU_Int8(this, value, offset, -0x80, 0x7f);
};

Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset = 0) {
  return writeU_Int16LE(this, value, offset, -0x8000, 0x7fff);
};

Buffer.prototype.writeInt16BE = function writeInt16BE(
  value,
  offset = 0,
) {
  return writeU_Int16BE(this, value, offset, -0x8000, 0x7fff);
};

Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset = 0) {
  return writeU_Int32LE(this, value, offset, -0x80000000, 0x7fffffff);
};

Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset = 0) {
  return writeU_Int32BE(this, value, offset, -0x80000000, 0x7fffffff);
};

Buffer.prototype.writeBigInt64LE = function writeBigInt64LE(value, offset = 0) {
  return wrtBigUInt64LE(
    this,
    value,
    offset,
    -0x8000000000000000n,
    0x7fffffffffffffffn,
  );
};

Buffer.prototype.writeBigInt64BE = function writeBigInt64BE(value, offset = 0) {
  return wrtBigUInt64BE(
    this,
    value,
    offset,
    -0x8000000000000000n,
    0x7fffffffffffffffn,
  );
};

Buffer.prototype.writeFloatLE = function writeFloatLE(
  value,
  offset,
) {
  return bigEndian
    ? writeFloatBackwards(this, value, offset)
    : writeFloatForwards(this, value, offset);
};

Buffer.prototype.writeFloatBE = function writeFloatBE(
  value,
  offset,
) {
  return bigEndian
    ? writeFloatForwards(this, value, offset)
    : writeFloatBackwards(this, value, offset);
};

Buffer.prototype.writeDoubleLE = function writeDoubleLE(
  value,
  offset,
) {
  return bigEndian
    ? writeDoubleBackwards(this, value, offset)
    : writeDoubleForwards(this, value, offset);
};

Buffer.prototype.writeDoubleBE = function writeDoubleBE(
  value,
  offset,
) {
  return bigEndian
    ? writeDoubleForwards(this, value, offset)
    : writeDoubleBackwards(this, value, offset);
};

Buffer.prototype.copy = function copy(
  target,
  targetStart,
  sourceStart,
  sourceEnd,
) {
  if (!isUint8Array(this)) {
    throw new codes.ERR_INVALID_ARG_TYPE(
      "source",
      ["Buffer", "Uint8Array"],
      this,
    );
  }

  if (!isUint8Array(target)) {
    throw new codes.ERR_INVALID_ARG_TYPE(
      "target",
      ["Buffer", "Uint8Array"],
      target,
    );
  }

  if (targetStart === undefined) {
    targetStart = 0;
  } else {
    targetStart = toInteger(targetStart, 0);
    if (targetStart < 0) {
      throw new codes.ERR_OUT_OF_RANGE("targetStart", ">= 0", targetStart);
    }
  }

  if (sourceStart === undefined) {
    sourceStart = 0;
  } else {
    sourceStart = toInteger(sourceStart, 0);
    if (sourceStart < 0 || sourceStart > this.length) {
      throw new codes.ERR_OUT_OF_RANGE(
        "sourceStart",
        `>= 0 && <= ${this.length}`,
        sourceStart,
      );
    }
    if (sourceStart >= MAX_UINT32) {
      throw new codes.ERR_OUT_OF_RANGE(
        "sourceStart",
        `< ${MAX_UINT32}`,
        sourceStart,
      );
    }
  }

  if (sourceEnd === undefined) {
    sourceEnd = this.length;
  } else {
    sourceEnd = toInteger(sourceEnd, 0);
    if (sourceEnd < 0) {
      throw new codes.ERR_OUT_OF_RANGE("sourceEnd", ">= 0", sourceEnd);
    }
    if (sourceEnd >= MAX_UINT32) {
      throw new codes.ERR_OUT_OF_RANGE(
        "sourceEnd",
        `< ${MAX_UINT32}`,
        sourceEnd,
      );
    }
  }

  if (targetStart >= target.length) {
    return 0;
  }

  if (sourceEnd > 0 && sourceEnd < sourceStart) {
    sourceEnd = sourceStart;
  }
  if (sourceEnd === sourceStart) {
    return 0;
  }
  if (target.length === 0 || this.length === 0) {
    return 0;
  }

  if (sourceEnd > this.length) {
    sourceEnd = this.length;
  }

  if (target.length - targetStart < sourceEnd - sourceStart) {
    sourceEnd = target.length - targetStart + sourceStart;
  }

  const len = sourceEnd - sourceStart;
  if (this === target) {
    TypedArrayPrototypeCopyWithin(this, targetStart, sourceStart, sourceEnd);
  } else {
    TypedArrayPrototypeSet(
      target,
      TypedArrayPrototypeSubarray(this, sourceStart, sourceEnd),
      targetStart,
    );
  }
  return len;
};

Buffer.prototype.fill = function fill(val, start, end, encoding) {
  if (typeof val === "string") {
    if (typeof start === "string") {
      encoding = start;
      start = 0;
      end = this.length;
    } else if (typeof end === "string") {
      encoding = end;
      end = this.length;
    }
    if (encoding !== void 0 && typeof encoding !== "string") {
      throw new TypeError("encoding must be a string");
    }
    if (typeof encoding === "string" && !BufferIsEncoding(encoding)) {
      throw new TypeError("Unknown encoding: " + encoding);
    }
    if (val.length === 1) {
      const code = StringPrototypeCharCodeAt(val, 0);
      if (encoding === "utf8" && code < 128 || encoding === "latin1") {
        val = code;
      }
    }
  } else if (typeof val === "number") {
    val = val & 255;
  } else if (typeof val === "boolean") {
    val = Number(val);
  }
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError("Out of range index");
  }
  if (end <= start) {
    return this;
  }
  start = start >>> 0;
  end = end === void 0 ? this.length : end >>> 0;
  if (!val) {
    val = 0;
  }
  let i;
  if (typeof val === "number") {
    for (i = start; i < end; ++i) {
      this[i] = val;
    }
  } else {
    const bytes = BufferIsBuffer(val) ? val : BufferFrom(val, encoding);
    const len = bytes.length;
    if (len === 0) {
      throw new codes.ERR_INVALID_ARG_VALUE(
        "value",
        val,
      );
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len];
    }
  }
  return this;
};

function checkBounds(buf, offset, byteLength2) {
  validateNumber(offset, "offset");
  if (buf[offset] === void 0 || buf[offset + byteLength2] === void 0) {
    boundsError(offset, buf.length - (byteLength2 + 1));
  }
}

function checkIntBI(value, min, max, buf, offset, byteLength2) {
  if (value > max || value < min) {
    const n = typeof min === "bigint" ? "n" : "";
    let range;
    if (byteLength2 > 3) {
      if (min === 0 || min === 0n) {
        range = `>= 0${n} and < 2${n} ** ${(byteLength2 + 1) * 8}${n}`;
      } else {
        range = `>= -(2${n} ** ${(byteLength2 + 1) * 8 - 1}${n}) and < 2 ** ${
          (byteLength2 + 1) * 8 - 1
        }${n}`;
      }
    } else {
      range = `>= ${min}${n} and <= ${max}${n}`;
    }
    throw new codes.ERR_OUT_OF_RANGE("value", range, value);
  }
  checkBounds(buf, offset, byteLength2);
}

/**
 * @param {Uint8Array} src Source buffer to read from
 * @param {Buffer} dst Destination buffer to write to
 * @param {number} [offset] Byte offset to write at in the destination buffer
 * @param {number} [byteLength] Optional number of bytes to, at most, write into destination buffer.
 * @returns {number} Number of bytes written to destination buffer
 */
function blitBuffer(src, dst, offset, byteLength = Infinity) {
  const srcLength = src.length;
  // Establish the number of bytes to be written
  const bytesToWrite = MathMin(
    // If byte length is defined in the call, then it sets an upper bound,
    // otherwise it is Infinity and is never chosen.
    byteLength,
    // The length of the source sets an upper bound being the source of data.
    srcLength,
    // The length of the destination minus any offset into it sets an upper bound.
    dst.length - (offset || 0),
  );
  if (bytesToWrite < srcLength) {
    // Resize the source buffer to the number of bytes we're about to write.
    // This both makes sure that we're actually only writing what we're told to
    // write but also prevents `Uint8Array#set` from throwing an error if the
    // source is longer than the target.
    src = src.subarray(0, bytesToWrite);
  }
  dst.set(src, offset);
  return bytesToWrite;
}

const hexSliceLookupTable = function () {
  const alphabet = "0123456789abcdef";
  const table = [];
  for (let i = 0; i < 16; ++i) {
    const i16 = i * 16;
    for (let j = 0; j < 16; ++j) {
      table[i16 + j] = alphabet[i] + alphabet[j];
    }
  }
  return table;
}();

export function readUInt48LE(buf, offset = 0) {
  validateNumber(offset, "offset");
  const first = buf[offset];
  const last = buf[offset + 5];
  if (first === undefined || last === undefined) {
    boundsError(offset, buf.length - 6);
  }

  return first +
    buf[++offset] * 2 ** 8 +
    buf[++offset] * 2 ** 16 +
    buf[++offset] * 2 ** 24 +
    (buf[++offset] + last * 2 ** 8) * 2 ** 32;
}

export function readUInt40LE(buf, offset = 0) {
  validateNumber(offset, "offset");
  const first = buf[offset];
  const last = buf[offset + 4];
  if (first === undefined || last === undefined) {
    boundsError(offset, buf.length - 5);
  }

  return first +
    buf[++offset] * 2 ** 8 +
    buf[++offset] * 2 ** 16 +
    buf[++offset] * 2 ** 24 +
    last * 2 ** 32;
}

export function readUInt24LE(buf, offset = 0) {
  validateNumber(offset, "offset");
  const first = buf[offset];
  const last = buf[offset + 2];
  if (first === undefined || last === undefined) {
    boundsError(offset, buf.length - 3);
  }

  return first + buf[++offset] * 2 ** 8 + last * 2 ** 16;
}

export function readUInt48BE(buf, offset = 0) {
  validateNumber(offset, "offset");
  const first = buf[offset];
  const last = buf[offset + 5];
  if (first === undefined || last === undefined) {
    boundsError(offset, buf.length - 6);
  }

  return (first * 2 ** 8 + buf[++offset]) * 2 ** 32 +
    buf[++offset] * 2 ** 24 +
    buf[++offset] * 2 ** 16 +
    buf[++offset] * 2 ** 8 +
    last;
}

export function readUInt40BE(buf, offset = 0) {
  validateNumber(offset, "offset");
  const first = buf[offset];
  const last = buf[offset + 4];
  if (first === undefined || last === undefined) {
    boundsError(offset, buf.length - 5);
  }

  return first * 2 ** 32 +
    buf[++offset] * 2 ** 24 +
    buf[++offset] * 2 ** 16 +
    buf[++offset] * 2 ** 8 +
    last;
}

export function readUInt24BE(buf, offset = 0) {
  validateNumber(offset, "offset");
  const first = buf[offset];
  const last = buf[offset + 2];
  if (first === undefined || last === undefined) {
    boundsError(offset, buf.length - 3);
  }

  return first * 2 ** 16 + buf[++offset] * 2 ** 8 + last;
}

export function readUInt16BE(offset = 0) {
  validateNumber(offset, "offset");
  const first = this[offset];
  const last = this[offset + 1];
  if (first === undefined || last === undefined) {
    boundsError(offset, this.length - 2);
  }

  return first * 2 ** 8 + last;
}

export function readUInt32BE(offset = 0) {
  validateNumber(offset, "offset");
  const first = this[offset];
  const last = this[offset + 3];
  if (first === undefined || last === undefined) {
    boundsError(offset, this.length - 4);
  }

  return first * 2 ** 24 +
    this[++offset] * 2 ** 16 +
    this[++offset] * 2 ** 8 +
    last;
}

export function readDoubleBackwards(buffer, offset = 0) {
  validateNumber(offset, "offset");
  const first = buffer[offset];
  const last = buffer[offset + 7];
  if (first === undefined || last === undefined) {
    boundsError(offset, buffer.length - 8);
  }

  uInt8Float64Array[7] = first;
  uInt8Float64Array[6] = buffer[++offset];
  uInt8Float64Array[5] = buffer[++offset];
  uInt8Float64Array[4] = buffer[++offset];
  uInt8Float64Array[3] = buffer[++offset];
  uInt8Float64Array[2] = buffer[++offset];
  uInt8Float64Array[1] = buffer[++offset];
  uInt8Float64Array[0] = last;
  return float64Array[0];
}

export function readDoubleForwards(buffer, offset = 0) {
  validateNumber(offset, "offset");
  const first = buffer[offset];
  const last = buffer[offset + 7];
  if (first === undefined || last === undefined) {
    boundsError(offset, buffer.length - 8);
  }

  uInt8Float64Array[0] = first;
  uInt8Float64Array[1] = buffer[++offset];
  uInt8Float64Array[2] = buffer[++offset];
  uInt8Float64Array[3] = buffer[++offset];
  uInt8Float64Array[4] = buffer[++offset];
  uInt8Float64Array[5] = buffer[++offset];
  uInt8Float64Array[6] = buffer[++offset];
  uInt8Float64Array[7] = last;
  return float64Array[0];
}

export function writeDoubleForwards(buffer, val, offset = 0) {
  val = +val;
  checkBounds(buffer, offset, 7);

  float64Array[0] = val;
  buffer[offset++] = uInt8Float64Array[0];
  buffer[offset++] = uInt8Float64Array[1];
  buffer[offset++] = uInt8Float64Array[2];
  buffer[offset++] = uInt8Float64Array[3];
  buffer[offset++] = uInt8Float64Array[4];
  buffer[offset++] = uInt8Float64Array[5];
  buffer[offset++] = uInt8Float64Array[6];
  buffer[offset++] = uInt8Float64Array[7];
  return offset;
}

export function writeDoubleBackwards(buffer, val, offset = 0) {
  val = +val;
  checkBounds(buffer, offset, 7);

  float64Array[0] = val;
  buffer[offset++] = uInt8Float64Array[7];
  buffer[offset++] = uInt8Float64Array[6];
  buffer[offset++] = uInt8Float64Array[5];
  buffer[offset++] = uInt8Float64Array[4];
  buffer[offset++] = uInt8Float64Array[3];
  buffer[offset++] = uInt8Float64Array[2];
  buffer[offset++] = uInt8Float64Array[1];
  buffer[offset++] = uInt8Float64Array[0];
  return offset;
}

export function readFloatBackwards(buffer, offset = 0) {
  validateNumber(offset, "offset");
  const first = buffer[offset];
  const last = buffer[offset + 3];
  if (first === undefined || last === undefined) {
    boundsError(offset, buffer.length - 4);
  }

  uInt8Float32Array[3] = first;
  uInt8Float32Array[2] = buffer[++offset];
  uInt8Float32Array[1] = buffer[++offset];
  uInt8Float32Array[0] = last;
  return float32Array[0];
}

export function readFloatForwards(buffer, offset = 0) {
  validateNumber(offset, "offset");
  const first = buffer[offset];
  const last = buffer[offset + 3];
  if (first === undefined || last === undefined) {
    boundsError(offset, buffer.length - 4);
  }

  uInt8Float32Array[0] = first;
  uInt8Float32Array[1] = buffer[++offset];
  uInt8Float32Array[2] = buffer[++offset];
  uInt8Float32Array[3] = last;
  return float32Array[0];
}

export function writeFloatForwards(buffer, val, offset = 0) {
  val = +val;
  checkBounds(buffer, offset, 3);

  float32Array[0] = val;
  buffer[offset++] = uInt8Float32Array[0];
  buffer[offset++] = uInt8Float32Array[1];
  buffer[offset++] = uInt8Float32Array[2];
  buffer[offset++] = uInt8Float32Array[3];
  return offset;
}

export function writeFloatBackwards(buffer, val, offset = 0) {
  val = +val;
  checkBounds(buffer, offset, 3);

  float32Array[0] = val;
  buffer[offset++] = uInt8Float32Array[3];
  buffer[offset++] = uInt8Float32Array[2];
  buffer[offset++] = uInt8Float32Array[1];
  buffer[offset++] = uInt8Float32Array[0];
  return offset;
}

export function readInt24LE(buf, offset = 0) {
  validateNumber(offset, "offset");
  const first = buf[offset];
  const last = buf[offset + 2];
  if (first === undefined || last === undefined) {
    boundsError(offset, buf.length - 3);
  }

  const val = first + buf[++offset] * 2 ** 8 + last * 2 ** 16;
  return val | (val & 2 ** 23) * 0x1fe;
}

export function readInt40LE(buf, offset = 0) {
  validateNumber(offset, "offset");
  const first = buf[offset];
  const last = buf[offset + 4];
  if (first === undefined || last === undefined) {
    boundsError(offset, buf.length - 5);
  }

  return (last | (last & 2 ** 7) * 0x1fffffe) * 2 ** 32 +
    first +
    buf[++offset] * 2 ** 8 +
    buf[++offset] * 2 ** 16 +
    buf[++offset] * 2 ** 24;
}

export function readInt48LE(buf, offset = 0) {
  validateNumber(offset, "offset");
  const first = buf[offset];
  const last = buf[offset + 5];
  if (first === undefined || last === undefined) {
    boundsError(offset, buf.length - 6);
  }

  const val = buf[offset + 4] + last * 2 ** 8;
  return (val | (val & 2 ** 15) * 0x1fffe) * 2 ** 32 +
    first +
    buf[++offset] * 2 ** 8 +
    buf[++offset] * 2 ** 16 +
    buf[++offset] * 2 ** 24;
}

export function readInt24BE(buf, offset = 0) {
  validateNumber(offset, "offset");
  const first = buf[offset];
  const last = buf[offset + 2];
  if (first === undefined || last === undefined) {
    boundsError(offset, buf.length - 3);
  }

  const val = first * 2 ** 16 + buf[++offset] * 2 ** 8 + last;
  return val | (val & 2 ** 23) * 0x1fe;
}

export function readInt48BE(buf, offset = 0) {
  validateNumber(offset, "offset");
  const first = buf[offset];
  const last = buf[offset + 5];
  if (first === undefined || last === undefined) {
    boundsError(offset, buf.length - 6);
  }

  const val = buf[++offset] + first * 2 ** 8;
  return (val | (val & 2 ** 15) * 0x1fffe) * 2 ** 32 +
    buf[++offset] * 2 ** 24 +
    buf[++offset] * 2 ** 16 +
    buf[++offset] * 2 ** 8 +
    last;
}

export function readInt40BE(buf, offset = 0) {
  validateNumber(offset, "offset");
  const first = buf[offset];
  const last = buf[offset + 4];
  if (first === undefined || last === undefined) {
    boundsError(offset, buf.length - 5);
  }

  return (first | (first & 2 ** 7) * 0x1fffffe) * 2 ** 32 +
    buf[++offset] * 2 ** 24 +
    buf[++offset] * 2 ** 16 +
    buf[++offset] * 2 ** 8 +
    last;
}

export function byteLengthUtf8(str) {
  return core.byteLength(str);
}

function base64ByteLength(str, bytes) {
  // Handle padding
  if (StringPrototypeCharCodeAt(str, bytes - 1) === 0x3D) {
    bytes--;
  }
  if (bytes > 1 && StringPrototypeCharCodeAt(str, bytes - 1) === 0x3D) {
    bytes--;
  }

  // Base64 ratio: 3/4
  return (bytes * 3) >>> 2;
}

export const encodingsMap = ObjectCreate(null);
for (let i = 0; i < encodings.length; ++i) {
  encodingsMap[encodings[i]] = i;
}

export const encodingOps = {
  ascii: {
    byteLength: (string) => string.length,
    encoding: "ascii",
    encodingVal: encodingsMap.ascii,
    indexOf: (buf, val, byteOffset, dir) =>
      indexOfBuffer(
        buf,
        asciiToBytes(val),
        byteOffset,
        encodingsMap.ascii,
        dir,
      ),
    slice: (buf, start, end) => buf.asciiSlice(start, end),
    write: (buf, string, offset, len) => buf.asciiWrite(string, offset, len),
  },
  base64: {
    byteLength: (string) => base64ByteLength(string, string.length),
    encoding: "base64",
    encodingVal: encodingsMap.base64,
    indexOf: (buf, val, byteOffset, dir) =>
      indexOfBuffer(
        buf,
        base64ToBytes(val),
        byteOffset,
        encodingsMap.base64,
        dir,
      ),
    slice: (buf, start, end) => buf.base64Slice(start, end),
    write: (buf, string, offset, len) => buf.base64Write(string, offset, len),
  },
  base64url: {
    byteLength: (string) => base64ByteLength(string, string.length),
    encoding: "base64url",
    encodingVal: encodingsMap.base64url,
    indexOf: (buf, val, byteOffset, dir) =>
      indexOfBuffer(
        buf,
        base64UrlToBytes(val),
        byteOffset,
        encodingsMap.base64url,
        dir,
      ),
    slice: (buf, start, end) => buf.base64urlSlice(start, end),
    write: (buf, string, offset, len) =>
      buf.base64urlWrite(string, offset, len),
  },
  hex: {
    byteLength: (string) => string.length >>> 1,
    encoding: "hex",
    encodingVal: encodingsMap.hex,
    indexOf: (buf, val, byteOffset, dir) =>
      indexOfBuffer(
        buf,
        hexToBytes(val),
        byteOffset,
        encodingsMap.hex,
        dir,
      ),
    slice: (buf, start, end) => buf.hexSlice(start, end),
    write: (buf, string, offset, len) => buf.hexWrite(string, offset, len),
  },
  latin1: {
    byteLength: (string) => string.length,
    encoding: "latin1",
    encodingVal: encodingsMap.latin1,
    indexOf: (buf, val, byteOffset, dir) =>
      indexOfBuffer(
        buf,
        asciiToBytes(val),
        byteOffset,
        encodingsMap.latin1,
        dir,
      ),
    slice: (buf, start, end) => buf.latin1Slice(start, end),
    write: (buf, string, offset, len) => buf.latin1Write(string, offset, len),
  },
  ucs2: {
    byteLength: (string) => string.length * 2,
    encoding: "ucs2",
    encodingVal: encodingsMap.utf16le,
    indexOf: (buf, val, byteOffset, dir) =>
      indexOfBuffer(
        buf,
        utf16leToBytes(val),
        byteOffset,
        encodingsMap.utf16le,
        dir,
      ),
    slice: (buf, start, end) => buf.ucs2Slice(start, end),
    write: (buf, string, offset, len) => buf.ucs2Write(string, offset, len),
  },
  utf8: {
    byteLength: byteLengthUtf8,
    encoding: "utf8",
    encodingVal: encodingsMap.utf8,
    indexOf: (buf, val, byteOffset, dir) =>
      indexOfBuffer(
        buf,
        utf8Encoder.encode(val),
        byteOffset,
        encodingsMap.utf8,
        dir,
      ),
    slice: (buf, start, end) => buf.utf8Slice(start, end),
    write: (buf, string, offset, len) => buf.utf8Write(string, offset, len),
  },
  utf16le: {
    byteLength: (string) => string.length * 2,
    encoding: "utf16le",
    encodingVal: encodingsMap.utf16le,
    indexOf: (buf, val, byteOffset, dir) =>
      indexOfBuffer(
        buf,
        utf16leToBytes(val),
        byteOffset,
        encodingsMap.utf16le,
        dir,
      ),
    slice: (buf, start, end) => buf.ucs2Slice(start, end),
    write: (buf, string, offset, len) => buf.ucs2Write(string, offset, len),
  },
};

export function getEncodingOps(encoding) {
  encoding = StringPrototypeToLowerCase(String(encoding));
  switch (encoding.length) {
    case 4:
      if (encoding === "utf8") return encodingOps.utf8;
      if (encoding === "ucs2") return encodingOps.ucs2;
      break;
    case 5:
      if (encoding === "utf-8") return encodingOps.utf8;
      if (encoding === "ascii") return encodingOps.ascii;
      if (encoding === "ucs-2") return encodingOps.ucs2;
      break;
    case 7:
      if (encoding === "utf16le") {
        return encodingOps.utf16le;
      }
      break;
    case 8:
      if (encoding === "utf-16le") {
        return encodingOps.utf16le;
      }
      break;
    // deno-lint-ignore no-fallthrough
    case 6:
      if (encoding === "latin1" || encoding === "binary") {
        return encodingOps.latin1;
      }
      if (encoding === "base64") return encodingOps.base64;
    case 3:
      if (encoding === "hex") {
        return encodingOps.hex;
      }
      break;
    case 9:
      if (encoding === "base64url") {
        return encodingOps.base64url;
      }
      break;
  }
}

/**
 * @param {Buffer} source
 * @param {Buffer} target
 * @param {number} targetStart
 * @param {number} sourceStart
 * @param {number} sourceEnd
 * @returns {number}
 */
export function _copyActual(
  source,
  target,
  targetStart,
  sourceStart,
  sourceEnd,
) {
  if (sourceEnd - sourceStart > target.length - targetStart) {
    sourceEnd = sourceStart + target.length - targetStart;
  }

  let nb = sourceEnd - sourceStart;
  const sourceLen = source.length - sourceStart;
  if (nb > sourceLen) {
    nb = sourceLen;
  }

  if (sourceStart !== 0 || sourceEnd < source.length) {
    // deno-lint-ignore prefer-primordials
    source = new Uint8Array(source.buffer, source.byteOffset + sourceStart, nb);
  }

  target.set(source, targetStart);

  return nb;
}

export function boundsError(value, length, type) {
  if (MathFloor(value) !== value) {
    validateNumber(value, type);
    throw new codes.ERR_OUT_OF_RANGE(type || "offset", "an integer", value);
  }

  if (length < 0) {
    throw new codes.ERR_BUFFER_OUT_OF_BOUNDS();
  }

  throw new codes.ERR_OUT_OF_RANGE(
    type || "offset",
    `>= ${type ? 1 : 0} and <= ${length}`,
    value,
  );
}

export function validateNumber(value, name, min = undefined, max) {
  if (typeof value !== "number") {
    throw new codes.ERR_INVALID_ARG_TYPE(name, "number", value);
  }

  if (
    (min != null && value < min) || (max != null && value > max) ||
    ((min != null || max != null) && NumberIsNaN(value))
  ) {
    throw new codes.ERR_OUT_OF_RANGE(
      name,
      `${min != null ? `>= ${min}` : ""}${
        min != null && max != null ? " && " : ""
      }${max != null ? `<= ${max}` : ""}`,
      value,
    );
  }
}

function checkInt(value, min, max, buf, offset, byteLength) {
  if (value > max || value < min) {
    const n = typeof min === "bigint" ? "n" : "";
    let range;
    if (byteLength > 3) {
      if (min === 0 || min === 0n) {
        range = `>= 0${n} and < 2${n} ** ${(byteLength + 1) * 8}${n}`;
      } else {
        range = `>= -(2${n} ** ${(byteLength + 1) * 8 - 1}${n}) and ` +
          `< 2${n} ** ${(byteLength + 1) * 8 - 1}${n}`;
      }
    } else {
      range = `>= ${min}${n} and <= ${max}${n}`;
    }
    throw new codes.ERR_OUT_OF_RANGE("value", range, value);
  }
  checkBounds(buf, offset, byteLength);
}

export function toInteger(n, defaultVal) {
  n = +n;
  if (
    !NumberIsNaN(n) &&
    n >= NumberMIN_SAFE_INTEGER &&
    n <= NumberMAX_SAFE_INTEGER
  ) {
    return ((n % 1) === 0 ? n : MathFloor(n));
  }
  return defaultVal;
}

// deno-lint-ignore camelcase
export function writeU_Int8(buf, value, offset, min, max) {
  value = +value;
  validateNumber(offset, "offset");
  if (value > max || value < min) {
    throw new codes.ERR_OUT_OF_RANGE("value", `>= ${min} and <= ${max}`, value);
  }
  if (buf[offset] === undefined) {
    boundsError(offset, buf.length - 1);
  }

  buf[offset] = value;
  return offset + 1;
}

// deno-lint-ignore camelcase
export function writeU_Int16BE(buf, value, offset, min, max) {
  value = +value;
  checkInt(value, min, max, buf, offset, 1);

  buf[offset++] = value >>> 8;
  buf[offset++] = value;
  return offset;
}

export function _writeUInt32LE(buf, value, offset, min, max) {
  value = +value;
  checkInt(value, min, max, buf, offset, 3);

  buf[offset++] = value;
  value = value >>> 8;
  buf[offset++] = value;
  value = value >>> 8;
  buf[offset++] = value;
  value = value >>> 8;
  buf[offset++] = value;
  return offset;
}

// deno-lint-ignore camelcase
export function writeU_Int16LE(buf, value, offset, min, max) {
  value = +value;
  checkInt(value, min, max, buf, offset, 1);

  buf[offset++] = value;
  buf[offset++] = value >>> 8;
  return offset;
}

export function _writeUInt32BE(buf, value, offset, min, max) {
  value = +value;
  checkInt(value, min, max, buf, offset, 3);

  buf[offset + 3] = value;
  value = value >>> 8;
  buf[offset + 2] = value;
  value = value >>> 8;
  buf[offset + 1] = value;
  value = value >>> 8;
  buf[offset] = value;
  return offset + 4;
}

// deno-lint-ignore camelcase
export function writeU_Int48BE(buf, value, offset, min, max) {
  value = +value;
  checkInt(value, min, max, buf, offset, 5);

  const newVal = MathFloor(value * 2 ** -32);
  buf[offset++] = newVal >>> 8;
  buf[offset++] = newVal;
  buf[offset + 3] = value;
  value = value >>> 8;
  buf[offset + 2] = value;
  value = value >>> 8;
  buf[offset + 1] = value;
  value = value >>> 8;
  buf[offset] = value;
  return offset + 4;
}

// deno-lint-ignore camelcase
export function writeU_Int40BE(buf, value, offset, min, max) {
  value = +value;
  checkInt(value, min, max, buf, offset, 4);

  buf[offset++] = MathFloor(value * 2 ** -32);
  buf[offset + 3] = value;
  value = value >>> 8;
  buf[offset + 2] = value;
  value = value >>> 8;
  buf[offset + 1] = value;
  value = value >>> 8;
  buf[offset] = value;
  return offset + 4;
}

// deno-lint-ignore camelcase
export function writeU_Int32BE(buf, value, offset, min, max) {
  value = +value;
  checkInt(value, min, max, buf, offset, 3);

  buf[offset + 3] = value;
  value = value >>> 8;
  buf[offset + 2] = value;
  value = value >>> 8;
  buf[offset + 1] = value;
  value = value >>> 8;
  buf[offset] = value;
  return offset + 4;
}

// deno-lint-ignore camelcase
export function writeU_Int24BE(buf, value, offset, min, max) {
  value = +value;
  checkInt(value, min, max, buf, offset, 2);

  buf[offset + 2] = value;
  value = value >>> 8;
  buf[offset + 1] = value;
  value = value >>> 8;
  buf[offset] = value;
  return offset + 3;
}

export function validateOffset(
  value,
  name,
  min = 0,
  max = NumberMAX_SAFE_INTEGER,
) {
  if (typeof value !== "number") {
    throw new codes.ERR_INVALID_ARG_TYPE(name, "number", value);
  }
  if (!NumberIsInteger(value)) {
    throw new codes.ERR_OUT_OF_RANGE(name, "an integer", value);
  }
  if (value < min || value > max) {
    throw new codes.ERR_OUT_OF_RANGE(name, `>= ${min} && <= ${max}`, value);
  }
}

// deno-lint-ignore camelcase
export function writeU_Int48LE(buf, value, offset, min, max) {
  value = +value;
  checkInt(value, min, max, buf, offset, 5);

  const newVal = MathFloor(value * 2 ** -32);
  buf[offset++] = value;
  value = value >>> 8;
  buf[offset++] = value;
  value = value >>> 8;
  buf[offset++] = value;
  value = value >>> 8;
  buf[offset++] = value;
  buf[offset++] = newVal;
  buf[offset++] = newVal >>> 8;
  return offset;
}

// deno-lint-ignore camelcase
export function writeU_Int40LE(buf, value, offset, min, max) {
  value = +value;
  checkInt(value, min, max, buf, offset, 4);

  const newVal = value;
  buf[offset++] = value;
  value = value >>> 8;
  buf[offset++] = value;
  value = value >>> 8;
  buf[offset++] = value;
  value = value >>> 8;
  buf[offset++] = value;
  buf[offset++] = MathFloor(newVal * 2 ** -32);
  return offset;
}

// deno-lint-ignore camelcase
export function writeU_Int32LE(buf, value, offset, min, max) {
  value = +value;
  checkInt(value, min, max, buf, offset, 3);

  buf[offset++] = value;
  value = value >>> 8;
  buf[offset++] = value;
  value = value >>> 8;
  buf[offset++] = value;
  value = value >>> 8;
  buf[offset++] = value;
  return offset;
}

// deno-lint-ignore camelcase
export function writeU_Int24LE(buf, value, offset, min, max) {
  value = +value;
  checkInt(value, min, max, buf, offset, 2);

  buf[offset++] = value;
  value = value >>> 8;
  buf[offset++] = value;
  value = value >>> 8;
  buf[offset++] = value;
  return offset;
}

export function isUtf8(input) {
  if (isTypedArray(input)) {
    if (isDetachedBuffer(TypedArrayPrototypeGetBuffer(input))) {
      throw new ERR_INVALID_STATE("Cannot validate on a detached buffer");
    }
    return op_is_utf8(input);
  }

  if (isAnyArrayBuffer(input)) {
    if (isDetachedBuffer(input)) {
      throw new ERR_INVALID_STATE("Cannot validate on a detached buffer");
    }
    return op_is_utf8(new Uint8Array(input));
  }

  throw new codes.ERR_INVALID_ARG_TYPE("input", [
    "ArrayBuffer",
    "Buffer",
    "TypedArray",
  ], input);
}

export function isAscii(input) {
  if (isTypedArray(input)) {
    if (isDetachedBuffer(TypedArrayPrototypeGetBuffer(input))) {
      throw new ERR_INVALID_STATE("Cannot validate on a detached buffer");
    }
    return op_is_ascii(input);
  }

  if (isAnyArrayBuffer(input)) {
    if (isDetachedBuffer(input)) {
      throw new ERR_INVALID_STATE("Cannot validate on a detached buffer");
    }
    return op_is_ascii(new Uint8Array(input));
  }

  throw new codes.ERR_INVALID_ARG_TYPE("input", [
    "ArrayBuffer",
    "Buffer",
    "TypedArray",
  ], input);
}

export function transcode(source, fromEnco, toEnco) {
  if (!isUint8Array(source)) {
    throw new codes.ERR_INVALID_ARG_TYPE(
      "source",
      ["Buffer", "Uint8Array"],
      source,
    );
  }
  if (source.length === 0) {
    return Buffer.alloc(0);
  }
  const code = "U_ILLEGAL_ARGUMENT_ERROR";
  const illegalArgumentError = genericNodeError(
    `Unable to transcode Buffer [${code}]`,
    { code: code, errno: 1 },
  );
  fromEnco = normalizeEncoding(fromEnco);
  toEnco = normalizeEncoding(toEnco);
  if (!fromEnco || !toEnco) {
    throw illegalArgumentError;
  }
  // Return the provided source when transcode is not required
  // for the from/to encoding pair.
  const returnSource = fromEnco === toEnco ||
    fromEnco === "ascii" && toEnco === "utf8" ||
    fromEnco === "ascii" && toEnco === "latin1";
  if (returnSource) {
    return Buffer.from(source);
  }

  try {
    const result = op_transcode(new Uint8Array(source), fromEnco, toEnco);
    return Buffer.from(result, toEnco);
  } catch (err) {
    if (StringPrototypeIncludes(err.message, "Unable to transcode Buffer")) {
      throw illegalArgumentError;
    } else {
      throw err;
    }
  }
}

export default {
  atob,
  btoa,
  Blob,
  Buffer,
  constants,
  isAscii,
  isUtf8,
  INSPECT_MAX_BYTES,
  kMaxLength,
  kStringMaxLength,
  SlowBuffer,
  transcode,
};
