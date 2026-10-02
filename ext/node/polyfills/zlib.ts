// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { notImplemented } from "ext:deno_node/_utils.ts";
import { zlib as constants } from "ext:deno_node/internal_binding/constants.ts";
import {
  codes,
  createDeflate,
  createDeflateRaw,
  createGunzip,
  createGzip,
  createInflate,
  createInflateRaw,
  createUnzip,
  Deflate,
  deflate,
  DeflateRaw,
  deflateRaw,
  deflateRawSync,
  deflateSync,
  Gunzip,
  gunzip,
  gunzipSync,
  Gzip,
  gzip,
  gzipSync,
  Inflate,
  inflate,
  InflateRaw,
  inflateRaw,
  inflateRawSync,
  inflateSync,
  Unzip,
  unzip,
  unzipSync,
} from "ext:deno_node/_zlib.mjs";
import {
  brotliCompress,
  brotliCompressSync,
  brotliDecompress,
  brotliDecompressSync,
  createBrotliCompress,
  createBrotliDecompress,
} from "ext:deno_node/_brotli.js";
import { ERR_INVALID_ARG_TYPE } from "ext:deno_node/internal/errors.ts";
import { validateUint32 } from "ext:deno_node/internal/validators.mjs";
import { op_zlib_crc32 } from "ext:core/ops";
import { core, primordials } from "ext:core/mod.js";
import { TextEncoder } from "ext:deno_web/08_text_encoding.js";
import { isArrayBufferView } from "ext:deno_node/internal/util/types.ts";
const {
  Uint8Array,
  TypedArrayPrototypeGetBuffer,
  TypedArrayPrototypeGetByteLength,
  TypedArrayPrototypeGetByteOffset,
  DataViewPrototypeGetBuffer,
  DataViewPrototypeGetByteLength,
  DataViewPrototypeGetByteOffset,
} = primordials;
const { isTypedArray, isDataView } = core;

const enc = new TextEncoder();
const toU8 = (input) => {
  if (typeof input === "string") {
    return enc.encode(input);
  }

  if (isTypedArray(input)) {
    return new Uint8Array(
      TypedArrayPrototypeGetBuffer(input),
      TypedArrayPrototypeGetByteOffset(input),
      TypedArrayPrototypeGetByteLength(input),
    );
  } else if (isDataView(input)) {
    return new Uint8Array(
      DataViewPrototypeGetBuffer(input),
      DataViewPrototypeGetByteOffset(input),
      DataViewPrototypeGetByteLength(input),
    );
  }

  return input;
};

export function crc32(data, value = 0) {
  if (typeof data !== "string" && !isArrayBufferView(data)) {
    throw new ERR_INVALID_ARG_TYPE("data", [
      "Buffer",
      "TypedArray",
      "DataView",
      "string",
    ], data);
  }
  validateUint32(value, "value");

  return op_zlib_crc32(toU8(data), value);
}

export class Options {
  constructor() {
    notImplemented("Options.prototype.constructor");
  }
}

interface IBrotliOptions {
  flush?: number;
  finishFlush?: number;
  chunkSize?: number;
  params?: Record<number, number>;
  maxOutputLength?: number;
}

export class BrotliOptions {
  constructor() {
    notImplemented("BrotliOptions.prototype.constructor");
  }
}
export class BrotliCompress {
  constructor() {
    notImplemented("BrotliCompress.prototype.constructor");
  }
}
export class BrotliDecompress {
  constructor() {
    notImplemented("BrotliDecompress.prototype.constructor");
  }
}
export class ZlibBase {
  constructor() {
    notImplemented("ZlibBase.prototype.constructor");
  }
}
export { constants };

export default {
  brotliCompress,
  BrotliCompress,
  brotliCompressSync,
  brotliDecompress,
  BrotliDecompress,
  brotliDecompressSync,
  BrotliOptions,
  codes,
  constants,
  crc32,
  createBrotliCompress,
  createBrotliDecompress,
  createDeflate,
  createDeflateRaw,
  createGunzip,
  createGzip,
  createInflate,
  createInflateRaw,
  createUnzip,
  deflate,
  Deflate,
  DEFLATE: constants.DEFLATE,
  deflateRaw,
  DeflateRaw,
  DEFLATERAW: constants.DEFLATERAW,
  deflateRawSync,
  deflateSync,
  gunzip,
  Gunzip,
  GUNZIP: constants.GUNZIP,
  gunzipSync,
  gzip,
  Gzip,
  GZIP: constants.GZIP,
  gzipSync,
  inflate,
  Inflate,
  INFLATE: constants.INFLATE,
  inflateRaw,
  InflateRaw,
  INFLATERAW: constants.INFLATERAW,
  inflateRawSync,
  inflateSync,
  Options,
  unzip,
  Unzip,
  UNZIP: constants.UNZIP,
  unzipSync,
  Z_BEST_COMPRESSION: constants.Z_BEST_COMPRESSION,
  Z_BEST_SPEED: constants.Z_BEST_SPEED,
  Z_BLOCK: constants.Z_BLOCK,
  Z_BUF_ERROR: constants.Z_BUF_ERROR,
  Z_DATA_ERROR: constants.Z_DATA_ERROR,
  Z_DEFAULT_CHUNK: constants.Z_DEFAULT_CHUNK,
  Z_DEFAULT_COMPRESSION: constants.Z_DEFAULT_COMPRESSION,
  Z_DEFAULT_LEVEL: constants.Z_DEFAULT_LEVEL,
  Z_DEFAULT_MEMLEVEL: constants.Z_DEFAULT_MEMLEVEL,
  Z_DEFAULT_STRATEGY: constants.Z_DEFAULT_STRATEGY,
  Z_DEFAULT_WINDOWBITS: constants.Z_DEFAULT_WINDOWBITS,
  Z_ERRNO: constants.Z_ERRNO,
  Z_FILTERED: constants.Z_FILTERED,
  Z_FINISH: constants.Z_FINISH,
  Z_FIXED: constants.Z_FIXED,
  Z_FULL_FLUSH: constants.Z_FULL_FLUSH,
  Z_HUFFMAN_ONLY: constants.Z_HUFFMAN_ONLY,
  Z_MAX_CHUNK: constants.Z_MAX_CHUNK,
  Z_MAX_LEVEL: constants.Z_MAX_LEVEL,
  Z_MAX_MEMLEVEL: constants.Z_MAX_MEMLEVEL,
  Z_MAX_WINDOWBITS: constants.Z_MAX_WINDOWBITS,
  Z_MEM_ERROR: constants.Z_MEM_ERROR,
  Z_MIN_CHUNK: constants.Z_MIN_CHUNK,
  Z_MIN_LEVEL: constants.Z_MIN_LEVEL,
  Z_MIN_MEMLEVEL: constants.Z_MIN_MEMLEVEL,
  Z_MIN_WINDOWBITS: constants.Z_MIN_WINDOWBITS,
  Z_NEED_DICT: constants.Z_NEED_DICT,
  Z_NO_COMPRESSION: constants.Z_NO_COMPRESSION,
  Z_NO_FLUSH: constants.Z_NO_FLUSH,
  Z_OK: constants.Z_OK,
  Z_PARTIAL_FLUSH: constants.Z_PARTIAL_FLUSH,
  Z_RLE: constants.Z_RLE,
  Z_STREAM_END: constants.Z_STREAM_END,
  Z_STREAM_ERROR: constants.Z_STREAM_ERROR,
  Z_SYNC_FLUSH: constants.Z_SYNC_FLUSH,
  Z_VERSION_ERROR: constants.Z_VERSION_ERROR,
  ZLIB_VERNUM: constants.ZLIB_VERNUM,
  ZlibBase,
};

export {
  brotliCompress,
  brotliCompressSync,
  brotliDecompress,
  brotliDecompressSync,
  codes,
  createBrotliCompress,
  createBrotliDecompress,
  createDeflate,
  createDeflateRaw,
  createGunzip,
  createGzip,
  createInflate,
  createInflateRaw,
  createUnzip,
  Deflate,
  deflate,
  DeflateRaw,
  deflateRaw,
  deflateRawSync,
  deflateSync,
  Gunzip,
  gunzip,
  gunzipSync,
  Gzip,
  gzip,
  gzipSync,
  Inflate,
  inflate,
  InflateRaw,
  inflateRaw,
  inflateRawSync,
  inflateSync,
  Unzip,
  unzip,
  unzipSync,
};
