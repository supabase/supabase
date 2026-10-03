// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { core, primordials } from "ext:core/mod.js";
const {
  Uint8Array,
  Number,
  PromisePrototypeThen,
  PromisePrototypeCatch,
  ObjectEntries,
  ArrayPrototypeMap,
  TypedArrayPrototypeSlice,
  TypedArrayPrototypeSubarray,
  TypedArrayPrototypeGetByteLength,
  DataViewPrototypeGetBuffer,
  TypedArrayPrototypeGetBuffer,
} = primordials;
const { isTypedArray, isDataView, close } = core;
import {
  op_brotli_compress,
  op_brotli_compress_async,
  op_brotli_compress_stream,
  op_brotli_compress_stream_end,
  op_brotli_decompress,
  op_brotli_decompress_async,
  op_brotli_decompress_stream,
  op_brotli_decompress_stream_end,
  op_create_brotli_compress,
  op_create_brotli_decompress,
} from "ext:core/ops";

import { zlib as constants } from "ext:deno_node/internal_binding/constants.ts";
import { TextEncoder } from "ext:deno_web/08_text_encoding.js";
import { Transform } from "node:stream";
import { Buffer } from "node:buffer";

const enc = new TextEncoder();
const toU8 = (input) => {
  if (typeof input === "string") {
    return enc.encode(input);
  }

  if (isTypedArray(input)) {
    return new Uint8Array(TypedArrayPrototypeGetBuffer(input));
  } else if (isDataView(input)) {
    return new Uint8Array(DataViewPrototypeGetBuffer(input));
  }

  return input;
};

export function createBrotliCompress(options) {
  return new BrotliCompress(options);
}

export function createBrotliDecompress(options) {
  return new BrotliDecompress(options);
}

export class BrotliDecompress extends Transform {
  #context;

  // TODO(littledivy): use `options` argument
  constructor(_options = { __proto__: null }) {
    super({
      // TODO(littledivy): use `encoding` argument
      transform(chunk, _encoding, callback) {
        const input = toU8(chunk);
        const output = new Uint8Array(TypedArrayPrototypeGetByteLength(chunk));
        const avail = op_brotli_decompress_stream(context, input, output);
        // deno-lint-ignore prefer-primordials
        this.push(TypedArrayPrototypeSlice(output, 0, avail));
        callback();
      },
      flush(callback) {
        const output = new Uint8Array(1024);
        let avail;
        while ((avail = op_brotli_decompress_stream_end(context, output)) > 0) {
          // deno-lint-ignore prefer-primordials
          this.push(TypedArrayPrototypeSlice(output, 0, avail));
        }
        close(context);
        callback();
      },
    });

    this.#context = op_create_brotli_decompress();
    const context = this.#context;
  }
}

export class BrotliCompress extends Transform {
  #context;

  constructor(options = { __proto__: null }) {
    super({
      // TODO(littledivy): use `encoding` argument
      transform(chunk, _encoding, callback) {
        const input = toU8(chunk);
        const output = new Uint8Array(brotliMaxCompressedSize(input.length));
        const written = op_brotli_compress_stream(context, input, output);
        if (written > 0) {
          // deno-lint-ignore prefer-primordials
          this.push(TypedArrayPrototypeSlice(output, 0, written));
        }
        callback();
      },
      flush(callback) {
        const output = new Uint8Array(1024);
        let avail;
        while ((avail = op_brotli_compress_stream_end(context, output)) > 0) {
          // deno-lint-ignore prefer-primordials
          this.push(TypedArrayPrototypeSlice(output, 0, avail));
        }
        close(context);
        callback();
      },
    });

    const params = ArrayPrototypeMap(
      ObjectEntries(options?.params ?? {}),
      // Undo the stringification of the keys
      (o) => [Number(o[0]), o[1]],
    );
    this.#context = op_create_brotli_compress(params);
    const context = this.#context;
  }
}

function oneOffCompressOptions(options) {
  let quality = options?.params?.[constants.BROTLI_PARAM_QUALITY] ??
    constants.BROTLI_DEFAULT_QUALITY;
  const lgwin = options?.params?.[constants.BROTLI_PARAM_LGWIN] ??
    constants.BROTLI_DEFAULT_WINDOW;
  const mode = options?.params?.[constants.BROTLI_PARAM_MODE] ??
    constants.BROTLI_MODE_GENERIC;

  // NOTE(bartlomieju): currently the rust-brotli crate panics if the quality
  // is set to 10. Coerce it down to 9.5 which is the maximum supported value.
  // https://github.com/dropbox/rust-brotli/issues/216
  if (quality == 10) {
    quality = 9.5;
  }

  return {
    quality,
    lgwin,
    mode,
  };
}

function brotliMaxCompressedSize(input) {
  if (input == 0) return 2;

  // [window bits / empty metadata] + N * [uncompressed] + [last empty]
  const numLargeBlocks = input >> 24;
  const overhead = 2 + (4 * numLargeBlocks) + 3 + 1;
  const result = input + overhead;

  return result < input ? 0 : result;
}

export function brotliCompress(
  input,
  options,
  callback,
) {
  const buf = toU8(input);

  if (typeof options === "function") {
    callback = options;
    options = {};
  }

  const { quality, lgwin, mode } = oneOffCompressOptions(options);
  PromisePrototypeCatch(
    PromisePrototypeThen(
      op_brotli_compress_async(buf, quality, lgwin, mode),
      (result) => callback(null, Buffer.from(result)),
    ),
    (err) => callback(err),
  );
}

export function brotliCompressSync(
  input,
  options,
) {
  const buf = toU8(input);
  const output = new Uint8Array(brotliMaxCompressedSize(buf.length));

  const { quality, lgwin, mode } = oneOffCompressOptions(options);
  const len = op_brotli_compress(buf, output, quality, lgwin, mode);
  return Buffer.from(TypedArrayPrototypeSubarray(output, 0, len));
}

export function brotliDecompress(input, options, callback) {
  const buf = toU8(input);

  if (typeof options === "function") {
    callback = options;
    options = {};
  }

  return PromisePrototypeCatch(
    PromisePrototypeThen(
      op_brotli_decompress_async(buf),
      (result) => callback(null, Buffer.from(result)),
    ),
    (err) => callback(err),
  );
}

export function brotliDecompressSync(input) {
  return Buffer.from(op_brotli_decompress(toU8(input)));
}
