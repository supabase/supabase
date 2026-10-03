// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// compose, destroy and isDisturbed are experimental APIs without
// typings. They can be exposed once they are released as stable in Node

// @deno-types="./_stream.d.ts"
import {
  _isArrayBufferView,
  _isUint8Array,
  _uint8ArrayToBuffer,
  addAbortSignal,
  compose,
  destroy,
  Duplex,
  finished,
  isDestroyed,
  isDisturbed,
  isErrored,
  isReadable,
  isWritable,
  PassThrough,
  pipeline,
  Readable,
  Stream,
  Transform,
  Writable,
} from "ext:deno_node/_stream.mjs";
import {
  getDefaultHighWaterMark,
  setDefaultHighWaterMark,
} from "ext:deno_node/internal/streams/state.mjs";

export {
  _isArrayBufferView,
  _isUint8Array,
  _uint8ArrayToBuffer,
  addAbortSignal,
  compose,
  destroy,
  Duplex,
  finished,
  getDefaultHighWaterMark,
  isDestroyed,
  isDisturbed,
  isErrored,
  isReadable,
  isWritable,
  PassThrough,
  pipeline,
  Readable,
  setDefaultHighWaterMark,
  Stream,
  Transform,
  Writable,
};

export default Stream;
