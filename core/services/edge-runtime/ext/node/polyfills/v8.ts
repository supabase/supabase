// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

/// <reference path="../../core/internal.d.ts" />

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { primordials } from "ext:core/mod.js";
const { ObjectPrototypeToString } = primordials;
import {
  op_v8_cached_data_version_tag,
  op_v8_get_heap_statistics,
  op_v8_get_wire_format_version,
  op_v8_new_deserializer,
  op_v8_new_serializer,
  op_v8_read_double,
  op_v8_read_header,
  op_v8_read_raw_bytes,
  op_v8_read_uint32,
  op_v8_read_uint64,
  op_v8_read_value,
  op_v8_release_buffer,
  op_v8_set_treat_array_buffer_views_as_host_objects,
  op_v8_transfer_array_buffer,
  op_v8_transfer_array_buffer_de,
  op_v8_write_double,
  op_v8_write_header,
  op_v8_write_raw_bytes,
  op_v8_write_uint32,
  op_v8_write_uint64,
  op_v8_write_value,
} from "ext:core/ops";

import { Buffer } from "node:buffer";

import { notImplemented } from "ext:deno_node/_utils.ts";
import { isArrayBufferView } from "ext:deno_node/internal/util/types.ts";

export function cachedDataVersionTag() {
  return op_v8_cached_data_version_tag();
}
export function getHeapCodeStatistics() {
  notImplemented("v8.getHeapCodeStatistics");
}
export function getHeapSnapshot() {
  notImplemented("v8.getHeapSnapshot");
}
export function getHeapSpaceStatistics() {
  notImplemented("v8.getHeapSpaceStatistics");
}

const buffer = new Float64Array(14);

export function getHeapStatistics() {
  op_v8_get_heap_statistics(buffer);

  return {
    total_heap_size: buffer[0],
    total_heap_size_executable: buffer[1],
    total_physical_size: buffer[2],
    total_available_size: buffer[3],
    used_heap_size: buffer[4],
    heap_size_limit: buffer[5],
    malloced_memory: buffer[6],
    peak_malloced_memory: buffer[7],
    does_zap_garbage: buffer[8],
    number_of_native_contexts: buffer[9],
    number_of_detached_contexts: buffer[10],
    total_global_handles_size: buffer[11],
    used_global_handles_size: buffer[12],
    external_memory: buffer[13],
  };
}

export function setFlagsFromString() {
  // NOTE(bartlomieju): From Node.js docs:
  // The v8.setFlagsFromString() method can be used to programmatically set V8
  // command-line flags. This method should be used with care. Changing settings
  // after the VM has started may result in unpredictable behavior, including
  // crashes and data loss; or it may simply do nothing.
  //
  // Notice: "or it may simply do nothing". This is what we're gonna do,
  // this function will just be a no-op.
}
export function stopCoverage() {
  notImplemented("v8.stopCoverage");
}
export function takeCoverage() {
  notImplemented("v8.takeCoverage");
}
export function writeHeapSnapshot() {
  notImplemented("v8.writeHeapSnapshot");
}
// deno-lint-ignore no-explicit-any
export function serialize(value: any) {
  const ser = new DefaultSerializer();
  ser.writeHeader();
  ser.writeValue(value);
  return ser.releaseBuffer();
}
export function deserialize(buffer: Buffer | ArrayBufferView | DataView) {
  if (!isArrayBufferView(buffer)) {
    throw new TypeError(
      "buffer must be a TypedArray or a DataView",
    );
  }
  const der = new DefaultDeserializer(buffer);
  der.readHeader();
  return der.readValue();
}

const kHandle = Symbol("kHandle");

export class Serializer {
  [kHandle]: object;
  constructor() {
    this[kHandle] = op_v8_new_serializer(this);
  }

  _setTreatArrayBufferViewsAsHostObjects(value: boolean): void {
    op_v8_set_treat_array_buffer_views_as_host_objects(this[kHandle], value);
  }

  releaseBuffer(): Buffer {
    return Buffer.from(op_v8_release_buffer(this[kHandle]));
  }

  transferArrayBuffer(_id: number, _arrayBuffer: ArrayBuffer): void {
    op_v8_transfer_array_buffer(this[kHandle], _id, _arrayBuffer);
  }

  writeDouble(value: number): void {
    op_v8_write_double(this[kHandle], value);
  }

  writeHeader(): void {
    op_v8_write_header(this[kHandle]);
  }

  writeRawBytes(source: ArrayBufferView): void {
    if (!isArrayBufferView(source)) {
      throw new TypeError(
        "source must be a TypedArray or a DataView",
      );
    }
    op_v8_write_raw_bytes(this[kHandle], source);
  }

  writeUint32(value: number): void {
    op_v8_write_uint32(this[kHandle], value);
  }

  writeUint64(hi: number, lo: number): void {
    op_v8_write_uint64(this[kHandle], hi, lo);
  }

  // deno-lint-ignore no-explicit-any
  writeValue(value: any): void {
    op_v8_write_value(this[kHandle], value);
  }

  _getDataCloneError = Error;
}

export class Deserializer {
  buffer: ArrayBufferView;
  [kHandle]: object;
  constructor(buffer: ArrayBufferView) {
    if (!isArrayBufferView(buffer)) {
      throw new TypeError(
        "buffer must be a TypedArray or a DataView",
      );
    }
    this.buffer = buffer;
    this[kHandle] = op_v8_new_deserializer(this, buffer);
  }
  readRawBytes(length: number): Buffer {
    const offset = this._readRawBytes(length);
    return Buffer.from(
      this.buffer.buffer,
      this.buffer.byteOffset + offset,
      length,
    );
  }
  _readRawBytes(length: number): number {
    return op_v8_read_raw_bytes(this[kHandle], length);
  }
  getWireFormatVersion(): number {
    return op_v8_get_wire_format_version(this[kHandle]);
  }
  readDouble(): number {
    return op_v8_read_double(this[kHandle]);
  }
  readHeader(): boolean {
    return op_v8_read_header(this[kHandle]);
  }

  readUint32(): number {
    return op_v8_read_uint32(this[kHandle]);
  }
  readUint64(): [hi: number, lo: number] {
    return op_v8_read_uint64(this[kHandle]);
  }
  readValue(): unknown {
    return op_v8_read_value(this[kHandle]);
  }
  transferArrayBuffer(
    id: number,
    arrayBuffer: ArrayBuffer | SharedArrayBuffer,
  ): void {
    return op_v8_transfer_array_buffer_de(this[kHandle], id, arrayBuffer);
  }
}
function arrayBufferViewTypeToIndex(abView: ArrayBufferView) {
  const type = ObjectPrototypeToString(abView);
  if (type === "[object Int8Array]") return 0;
  if (type === "[object Uint8Array]") return 1;
  if (type === "[object Uint8ClampedArray]") return 2;
  if (type === "[object Int16Array]") return 3;
  if (type === "[object Uint16Array]") return 4;
  if (type === "[object Int32Array]") return 5;
  if (type === "[object Uint32Array]") return 6;
  if (type === "[object Float32Array]") return 7;
  if (type === "[object Float64Array]") return 8;
  if (type === "[object DataView]") return 9;
  // Index 10 is FastBuffer.
  if (type === "[object BigInt64Array]") return 11;
  if (type === "[object BigUint64Array]") return 12;
  if (type === "[object Float16Array]") return 13;
  return -1;
}
export class DefaultSerializer extends Serializer {
  constructor() {
    super();
    this._setTreatArrayBufferViewsAsHostObjects(true);
  }

  // deno-lint-ignore no-explicit-any
  _writeHostObject(abView: any) {
    // Keep track of how to handle different ArrayBufferViews. The default
    // Serializer for Node does not use the V8 methods for serializing those
    // objects because Node's `Buffer` objects use pooled allocation in many
    // cases, and their underlying `ArrayBuffer`s would show up in the
    // serialization. Because a) those may contain sensitive data and the user
    // may not be aware of that and b) they are often much larger than the
    // `Buffer` itself, custom serialization is applied.
    let i = 10; // FastBuffer
    if (abView.constructor !== Buffer) {
      i = arrayBufferViewTypeToIndex(abView);
      if (i === -1) {
        throw new this._getDataCloneError(
          `Unserializable host object: ${abView}`,
        );
      }
    }
    this.writeUint32(i);
    this.writeUint32(abView.byteLength);
    this.writeRawBytes(
      new Uint8Array(abView.buffer, abView.byteOffset, abView.byteLength),
    );
  }
}

// deno-lint-ignore no-explicit-any
function arrayBufferViewIndexToType(index: number): any {
  if (index === 0) return Int8Array;
  if (index === 1) return Uint8Array;
  if (index === 2) return Uint8ClampedArray;
  if (index === 3) return Int16Array;
  if (index === 4) return Uint16Array;
  if (index === 5) return Int32Array;
  if (index === 6) return Uint32Array;
  if (index === 7) return Float32Array;
  if (index === 8) return Float64Array;
  if (index === 9) return DataView;
  if (index === 10) return Buffer;
  if (index === 11) return BigInt64Array;
  if (index === 12) return BigUint64Array;
  if (index === 13) return Float16Array;
  return undefined;
}

export class DefaultDeserializer extends Deserializer {
  constructor(buffer: ArrayBufferView) {
    super(buffer);
  }

  _readHostObject() {
    const typeIndex = this.readUint32();
    const ctor = arrayBufferViewIndexToType(typeIndex);
    const byteLength = this.readUint32();
    const byteOffset = this._readRawBytes(byteLength);
    const BYTES_PER_ELEMENT = ctor?.BYTES_PER_ELEMENT ?? 1;

    const offset = this.buffer.byteOffset + byteOffset;
    if (offset % BYTES_PER_ELEMENT === 0) {
      return new ctor(
        this.buffer.buffer,
        offset,
        byteLength / BYTES_PER_ELEMENT,
      );
    }
    // Copy to an aligned buffer first.
    const bufferCopy = Buffer.allocUnsafe(byteLength);
    Buffer.from(
      this.buffer.buffer,
      byteOffset,
      byteLength,
    ).copy(bufferCopy);
    return new ctor(
      bufferCopy.buffer,
      bufferCopy.byteOffset,
      byteLength / BYTES_PER_ELEMENT,
    );
  }
}
export default {
  cachedDataVersionTag,
  getHeapCodeStatistics,
  getHeapSnapshot,
  getHeapSpaceStatistics,
  getHeapStatistics,
  setFlagsFromString,
  stopCoverage,
  takeCoverage,
  writeHeapSnapshot,
  serialize,
  deserialize,
  Serializer,
  Deserializer,
  DefaultSerializer,
  DefaultDeserializer,
};
