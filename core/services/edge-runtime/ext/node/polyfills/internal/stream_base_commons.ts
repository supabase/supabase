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

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { ownerSymbol } from "ext:deno_node/internal/async_hooks.ts";
import {
  kArrayBufferOffset,
  kBytesWritten,
  kLastWriteWasAsync,
  LibuvStreamWrap,
  streamBaseState,
  WriteWrap,
} from "ext:deno_node/internal_binding/stream_wrap.ts";
import { isUint8Array } from "ext:deno_node/internal/util/types.ts";
import { errnoException } from "ext:deno_node/internal/errors.ts";
import { getTimerDuration, kTimeout } from "ext:deno_node/internal/timers.mjs";
import { clearTimeout, setUnrefTimeout } from "node:timers";
import { validateFunction } from "ext:deno_node/internal/validators.mjs";
import { codeMap } from "ext:deno_node/internal_binding/uv.ts";
import { Buffer } from "node:buffer";

export const kMaybeDestroy = Symbol("kMaybeDestroy");
export const kUpdateTimer = Symbol("kUpdateTimer");
export const kAfterAsyncWrite = Symbol("kAfterAsyncWrite");
export const kHandle = Symbol("kHandle");
export const kSession = Symbol("kSession");
export const kBuffer = Symbol("kBuffer");
export const kBufferGen = Symbol("kBufferGen");
export const kBufferCb = Symbol("kBufferCb");

// deno-lint-ignore no-explicit-any
function handleWriteReq(req: any, data: any, encoding: string) {
  const { handle } = req;

  switch (encoding) {
    case "buffer": {
      const ret = handle.writeBuffer(req, data);

      if (streamBaseState[kLastWriteWasAsync]) {
        req.buffer = data;
      }

      return ret;
    }
    case "latin1":
    case "binary":
      return handle.writeLatin1String(req, data);
    case "utf8":
    case "utf-8":
      return handle.writeUtf8String(req, data);
    case "ascii":
      return handle.writeAsciiString(req, data);
    case "ucs2":
    case "ucs-2":
    case "utf16le":
    case "utf-16le":
      return handle.writeUcs2String(req, data);
    default: {
      const buffer = Buffer.from(data, encoding);
      const ret = handle.writeBuffer(req, buffer);

      if (streamBaseState[kLastWriteWasAsync]) {
        req.buffer = buffer;
      }

      return ret;
    }
  }
}

// deno-lint-ignore no-explicit-any
function onWriteComplete(this: any, status: number) {
  let stream = this.handle[ownerSymbol];

  if (stream.constructor.name === "ReusedHandle") {
    stream = stream.handle;
  }

  if (stream.destroyed) {
    if (typeof this.callback === "function") {
      this.callback(null);
    }

    return;
  }

  if (status < 0) {
    const ex = errnoException(status, "write", this.error);

    if (typeof this.callback === "function") {
      this.callback(ex);
    } else {
      stream.destroy(ex);
    }

    return;
  }

  stream[kUpdateTimer]();
  stream[kAfterAsyncWrite](this);

  if (typeof this.callback === "function") {
    this.callback(null);
  }
}

function createWriteWrap(
  handle: LibuvStreamWrap,
  callback: (err?: Error | null) => void,
) {
  const req = new WriteWrap<LibuvStreamWrap>();

  req.handle = handle;
  req.oncomplete = onWriteComplete;
  req.async = false;
  req.bytes = 0;
  req.buffer = null;
  req.callback = callback;

  return req;
}

export function writevGeneric(
  // deno-lint-ignore no-explicit-any
  owner: any,
  // deno-lint-ignore no-explicit-any
  data: any,
  cb: (err?: Error | null) => void,
) {
  const req = createWriteWrap(owner[kHandle], cb);
  const allBuffers = data.allBuffers;
  let chunks;

  if (allBuffers) {
    chunks = data;

    for (let i = 0; i < data.length; i++) {
      data[i] = data[i].chunk;
    }
  } else {
    chunks = new Array(data.length << 1);

    for (let i = 0; i < data.length; i++) {
      const entry = data[i];
      chunks[i * 2] = entry.chunk;
      chunks[i * 2 + 1] = entry.encoding;
    }
  }

  const err = req.handle.writev(req, chunks, allBuffers);

  // Retain chunks
  if (err === 0) {
    req._chunks = chunks;
  }

  afterWriteDispatched(req, err, cb);

  return req;
}

export function writeGeneric(
  // deno-lint-ignore no-explicit-any
  owner: any,
  // deno-lint-ignore no-explicit-any
  data: any,
  encoding: string,
  cb: (err?: Error | null) => void,
) {
  const req = createWriteWrap(owner[kHandle], cb);
  const err = handleWriteReq(req, data, encoding);

  afterWriteDispatched(req, err, cb);

  return req;
}

function afterWriteDispatched(
  // deno-lint-ignore no-explicit-any
  req: any,
  err: number,
  cb: (err?: Error | null) => void,
) {
  req.bytes = streamBaseState[kBytesWritten];
  req.async = !!streamBaseState[kLastWriteWasAsync];

  if (err !== 0) {
    return cb(errnoException(err, "write", req.error));
  }

  if (!req.async && typeof req.callback === "function") {
    req.callback();
  }
}

// Here we differ from Node slightly. Node makes use of the `kReadBytesOrError`
// entry of the `streamBaseState` array from the `stream_wrap` internal binding.
// Here we pass the `nread` value directly to this method as async Deno APIs
// don't grant us the ability to rely on some mutable array entry setting.
export function onStreamRead(
  // deno-lint-ignore no-explicit-any
  this: any,
  arrayBuffer: Uint8Array,
  nread: number,
) {
  // deno-lint-ignore no-this-alias
  const handle = this;

  let stream = this[ownerSymbol];

  if (stream.constructor.name === "ReusedHandle") {
    stream = stream.handle;
  }

  stream[kUpdateTimer]();

  if (nread > 0 && !stream.destroyed) {
    let ret;
    let result;
    const userBuf = stream[kBuffer];

    if (userBuf) {
      result = stream[kBufferCb](nread, userBuf) !== false;
      const bufGen = stream[kBufferGen];

      if (bufGen !== null) {
        const nextBuf = bufGen();

        if (isUint8Array(nextBuf)) {
          stream[kBuffer] = ret = nextBuf;
        }
      }
    } else {
      const offset = streamBaseState[kArrayBufferOffset];
      // Performance note: Pass ArrayBuffer to Buffer#from to avoid
      // copy.
      const buf = Buffer.from(arrayBuffer.buffer, offset, nread);
      result = stream.push(buf);
    }

    if (!result) {
      handle.reading = false;

      if (!stream.destroyed) {
        const err = handle.readStop();

        if (err) {
          stream.destroy(errnoException(err, "read"));
        }
      }
    }

    return ret;
  }

  if (nread === 0) {
    return;
  }

  if (nread !== codeMap.get("EOF")) {
    // CallJSOnreadMethod expects the return value to be a buffer.
    // Ref: https://github.com/nodejs/node/pull/34375
    stream.destroy(errnoException(nread, "read"));

    return;
  }

  // Defer this until we actually emit end
  if (stream._readableState.endEmitted) {
    if (stream[kMaybeDestroy]) {
      stream[kMaybeDestroy]();
    }
  } else {
    if (stream[kMaybeDestroy]) {
      stream.on("end", stream[kMaybeDestroy]);
    }

    if (handle.readStop) {
      const err = handle.readStop();

      if (err) {
        // CallJSOnreadMethod expects the return value to be a buffer.
        // Ref: https://github.com/nodejs/node/pull/34375
        stream.destroy(errnoException(err, "read"));

        return;
      }
    }

    // Push a null to signal the end of data.
    // Do it before `maybeDestroy` for correct order of events:
    // `end` -> `close`
    stream.push(null);
    stream.read(0);
  }
}

export function setStreamTimeout(
  // deno-lint-ignore no-explicit-any
  this: any,
  msecs: number,
  callback?: () => void,
) {
  if (this.destroyed) {
    return this;
  }

  this.timeout = msecs;

  // Type checking identical to timers.enroll()
  msecs = getTimerDuration(msecs, "msecs");

  // Attempt to clear an existing timer in both cases -
  //  even if it will be rescheduled we don't want to leak an existing timer.
  clearTimeout(this[kTimeout]);

  if (msecs === 0) {
    if (callback !== undefined) {
      validateFunction(callback, "callback");
      this.removeListener("timeout", callback);
    }
  } else {
    this[kTimeout] = setUnrefTimeout(this._onTimeout.bind(this), msecs);

    if (this[kSession]) {
      this[kSession][kUpdateTimer]();
    }

    if (callback !== undefined) {
      validateFunction(callback, "callback");
      this.once("timeout", callback);
    }
  }

  return this;
}
