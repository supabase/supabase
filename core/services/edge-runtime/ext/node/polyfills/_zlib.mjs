// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright (c) 2014-2015 Devon Govett <devongovett@gmail.com>
// Forked from https://github.com/browserify/browserify-zlib

// deno-lint-ignore-file

import { Buffer, kMaxLength } from "node:buffer";
import { Transform } from "node:stream";
import * as binding from "ext:deno_node/_zlib_binding.mjs";
import util from "node:util";
import { ok as assert } from "node:assert";
import { zlib as zlibConstants } from "ext:deno_node/internal_binding/constants.ts";
import { nextTick } from "ext:deno_node/_next_tick.ts";
import {
  isAnyArrayBuffer,
  isArrayBufferView,
  isUint8Array,
} from "ext:deno_node/internal/util/types.ts";

var kRangeErrorMessage = "Cannot create final Buffer. It would be larger " +
  "than 0x" + kMaxLength.toString(16) + " bytes";

// translation table for return codes.
export const codes = Object.freeze({
  Z_OK: binding.Z_OK,
  Z_STREAM_END: binding.Z_STREAM_END,
  Z_NEED_DICT: binding.Z_NEED_DICT,
  Z_ERRNO: binding.Z_ERRNO,
  Z_STREAM_ERROR: binding.Z_STREAM_ERROR,
  Z_DATA_ERROR: binding.Z_DATA_ERROR,
  Z_MEM_ERROR: binding.Z_MEM_ERROR,
  Z_BUF_ERROR: binding.Z_BUF_ERROR,
  Z_VERSION_ERROR: binding.Z_VERSION_ERROR,
  [binding.Z_OK]: "Z_OK",
  [binding.Z_STREAM_END]: "Z_STREAM_END",
  [binding.Z_NEED_DICT]: "Z_NEED_DICT",
  [binding.Z_ERRNO]: "Z_ERRNO",
  [binding.Z_STREAM_ERROR]: "Z_STREAM_ERROR",
  [binding.Z_DATA_ERROR]: "Z_DATA_ERROR",
  [binding.Z_MEM_ERROR]: "Z_MEM_ERROR",
  [binding.Z_BUF_ERROR]: "Z_BUF_ERROR",
  [binding.Z_VERSION_ERROR]: "Z_VERSION_ERROR",
});

export const createDeflate = function (o) {
  return new Deflate(o);
};

export const createInflate = function (o) {
  return new Inflate(o);
};

export const createDeflateRaw = function (o) {
  return new DeflateRaw(o);
};

export const createInflateRaw = function (o) {
  return new InflateRaw(o);
};

export const createGzip = function (o) {
  return new Gzip(o);
};

export const createGunzip = function (o) {
  return new Gunzip(o);
};

export const createUnzip = function (o) {
  return new Unzip(o);
};

// Convenience methods.
// compress/decompress a string or buffer in one step.
export const deflate = function (buffer, opts, callback) {
  if (typeof opts === "function") {
    callback = opts;
    opts = {};
  }
  return zlibBuffer(new Deflate(opts), buffer, callback);
};

export const deflateSync = function (buffer, opts) {
  return zlibBufferSync(new Deflate(opts), buffer);
};

export const gzip = function (buffer, opts, callback) {
  if (typeof opts === "function") {
    callback = opts;
    opts = {};
  }
  return zlibBuffer(new Gzip(opts), buffer, callback);
};

export const gzipSync = function (buffer, opts) {
  return zlibBufferSync(new Gzip(opts), buffer);
};

export const deflateRaw = function (buffer, opts, callback) {
  if (typeof opts === "function") {
    callback = opts;
    opts = {};
  }
  return zlibBuffer(new DeflateRaw(opts), buffer, callback);
};

export const deflateRawSync = function (buffer, opts) {
  return zlibBufferSync(new DeflateRaw(opts), buffer);
};

export const unzip = function (buffer, opts, callback) {
  if (typeof opts === "function") {
    callback = opts;
    opts = {};
  }
  return zlibBuffer(new Unzip(opts), buffer, callback);
};

export const unzipSync = function (buffer, opts) {
  return zlibBufferSync(new Unzip(opts), buffer);
};

export const inflate = function (buffer, opts, callback) {
  if (typeof opts === "function") {
    callback = opts;
    opts = {};
  }
  return zlibBuffer(new Inflate(opts), buffer, callback);
};

export const inflateSync = function (buffer, opts) {
  return zlibBufferSync(new Inflate(opts), buffer);
};

export const gunzip = function (buffer, opts, callback) {
  if (typeof opts === "function") {
    callback = opts;
    opts = {};
  }
  return zlibBuffer(new Gunzip(opts), buffer, callback);
};

export const gunzipSync = function (buffer, opts) {
  return zlibBufferSync(new Gunzip(opts), buffer);
};

export const inflateRaw = function (buffer, opts, callback) {
  if (typeof opts === "function") {
    callback = opts;
    opts = {};
  }
  return zlibBuffer(new InflateRaw(opts), buffer, callback);
};

export const inflateRawSync = function (buffer, opts) {
  return zlibBufferSync(new InflateRaw(opts), buffer);
};

function sanitizeInput(input) {
  if (typeof input === "string") input = Buffer.from(input);

  if (isArrayBufferView(input) && !isUint8Array(input)) {
    input = Buffer.from(input.buffer, input.byteOffset, input.byteLength);
  } else if (isAnyArrayBuffer(input)) {
    input = Buffer.from(input);
  }

  if (
    !Buffer.isBuffer(input) &&
    (input.buffer && !input.buffer.constructor === ArrayBuffer)
  ) throw new TypeError("Not a string, buffer or dataview");

  if (input.buffer) {
    input = new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  }

  return input;
}

function zlibBuffer(engine, buffer, callback) {
  var buffers = [];
  var nread = 0;

  buffer = sanitizeInput(buffer);

  engine.on("error", onError);
  engine.on("end", onEnd);

  engine.end(buffer);
  flow();

  function flow() {
    var chunk;
    while (null !== (chunk = engine.read())) {
      buffers.push(chunk);
      nread += chunk.length;
    }
    engine.once("readable", flow);
  }

  function onError(err) {
    engine.removeListener("end", onEnd);
    engine.removeListener("readable", flow);
    callback(err);
  }

  function onEnd() {
    var buf;
    var err = null;

    if (nread >= kMaxLength) {
      err = new RangeError(kRangeErrorMessage);
    } else {
      buf = Buffer.concat(buffers, nread);
    }

    buffers = [];
    engine.close();
    callback(err, buf);
  }
}

function zlibBufferSync(engine, buffer) {
  buffer = sanitizeInput(buffer);

  var flushFlag = engine._finishFlushFlag;

  return engine._processChunk(buffer, flushFlag);
}

// generic zlib
// minimal 2-byte header
function Deflate(opts) {
  if (!(this instanceof Deflate)) return new Deflate(opts);
  Zlib.call(this, opts, binding.DEFLATE);
}

function Inflate(opts) {
  if (!(this instanceof Inflate)) return new Inflate(opts);
  Zlib.call(this, opts, binding.INFLATE);
}

// gzip - bigger header, same deflate compression
function Gzip(opts) {
  if (!(this instanceof Gzip)) return new Gzip(opts);
  Zlib.call(this, opts, binding.GZIP);
}

function Gunzip(opts) {
  if (!(this instanceof Gunzip)) return new Gunzip(opts);
  Zlib.call(this, opts, binding.GUNZIP);
}

// raw - no header
function DeflateRaw(opts) {
  if (!(this instanceof DeflateRaw)) return new DeflateRaw(opts);
  Zlib.call(this, opts, binding.DEFLATERAW);
}

function InflateRaw(opts) {
  if (!(this instanceof InflateRaw)) return new InflateRaw(opts);
  Zlib.call(this, opts, binding.INFLATERAW);
}

// auto-detect header.
function Unzip(opts) {
  if (!(this instanceof Unzip)) return new Unzip(opts);
  Zlib.call(this, opts, binding.UNZIP);
}

function isValidFlushFlag(flag) {
  return flag === binding.Z_NO_FLUSH || flag === binding.Z_PARTIAL_FLUSH ||
    flag === binding.Z_SYNC_FLUSH || flag === binding.Z_FULL_FLUSH ||
    flag === binding.Z_FINISH || flag === binding.Z_BLOCK;
}

// the Zlib class they all inherit from
// This thing manages the queue of requests, and returns
// true or false if there is anything in the queue when
// you call the .write() method.

function Zlib(opts, mode) {
  var _this = this;

  this._opts = opts = opts || {};
  this._chunkSize = opts.chunkSize || zlibConstants.Z_DEFAULT_CHUNK;

  Transform.call(this, opts);

  if (opts.flush && !isValidFlushFlag(opts.flush)) {
    throw new Error("Invalid flush flag: " + opts.flush);
  }
  if (opts.finishFlush && !isValidFlushFlag(opts.finishFlush)) {
    throw new Error("Invalid flush flag: " + opts.finishFlush);
  }

  this._flushFlag = opts.flush || binding.Z_NO_FLUSH;
  this._finishFlushFlag = typeof opts.finishFlush !== "undefined"
    ? opts.finishFlush
    : binding.Z_FINISH;

  if (opts.chunkSize) {
    if (
      opts.chunkSize < zlibConstants.Z_MIN_CHUNK ||
      opts.chunkSize > zlibConstants.Z_MAX_CHUNK
    ) {
      throw new Error("Invalid chunk size: " + opts.chunkSize);
    }
  }

  if (opts.windowBits) {
    if (
      opts.windowBits < zlibConstants.Z_MIN_WINDOWBITS ||
      opts.windowBits > zlibConstants.Z_MAX_WINDOWBITS
    ) {
      throw new Error("Invalid windowBits: " + opts.windowBits);
    }
  }

  if (opts.level) {
    if (
      opts.level < zlibConstants.Z_MIN_LEVEL ||
      opts.level > zlibConstants.Z_MAX_LEVEL
    ) {
      throw new Error("Invalid compression level: " + opts.level);
    }
  }

  if (opts.memLevel) {
    if (
      opts.memLevel < zlibConstants.Z_MIN_MEMLEVEL ||
      opts.memLevel > zlibConstants.Z_MAX_MEMLEVEL
    ) {
      throw new Error("Invalid memLevel: " + opts.memLevel);
    }
  }

  if (opts.strategy) {
    if (
      opts.strategy != zlibConstants.Z_FILTERED &&
      opts.strategy != zlibConstants.Z_HUFFMAN_ONLY &&
      opts.strategy != zlibConstants.Z_RLE &&
      opts.strategy != zlibConstants.Z_FIXED &&
      opts.strategy != zlibConstants.Z_DEFAULT_STRATEGY
    ) {
      throw new Error("Invalid strategy: " + opts.strategy);
    }
  }

  let dictionary = opts.dictionary;
  if (dictionary !== undefined && !isArrayBufferView(dictionary)) {
    if (isAnyArrayBuffer(dictionary)) {
      dictionary = Buffer.from(dictionary);
    } else {
      throw new TypeError("Invalid dictionary");
    }
  }

  this._handle = new binding.Zlib(mode);

  var self = this;
  this._hadError = false;
  this._handle.onerror = function (message, errno) {
    // there is no way to cleanly recover.
    // continuing only obscures problems.
    _close(self);
    self._hadError = true;

    var error = new Error(message);
    error.errno = errno;
    error.code = codes[errno];
    self.emit("error", error);
  };

  var level = zlibConstants.Z_DEFAULT_COMPRESSION;
  if (typeof opts.level === "number") level = opts.level;

  var strategy = zlibConstants.Z_DEFAULT_STRATEGY;
  if (typeof opts.strategy === "number") strategy = opts.strategy;

  this._handle.init(
    opts.windowBits || zlibConstants.Z_DEFAULT_WINDOWBITS,
    level,
    opts.memLevel || zlibConstants.Z_DEFAULT_MEMLEVEL,
    strategy,
    dictionary,
  );

  this._buffer = Buffer.allocUnsafe(this._chunkSize);
  this._offset = 0;
  this._level = level;
  this._strategy = strategy;

  this.once("end", this.close);

  Object.defineProperty(this, "_closed", {
    get: function () {
      return !_this._handle;
    },
    configurable: true,
    enumerable: true,
  });
}

util.inherits(Zlib, Transform);

Zlib.prototype.params = function (level, strategy, callback) {
  if (level < zlibConstants.Z_MIN_LEVEL || level > zlibConstants.Z_MAX_LEVEL) {
    throw new RangeError("Invalid compression level: " + level);
  }
  if (
    strategy != zlibConstants.Z_FILTERED &&
    strategy != zlibConstants.Z_HUFFMAN_ONLY &&
    strategy != zlibConstants.Z_RLE &&
    strategy != zlibConstants.Z_FIXED &&
    strategy != zlibConstants.Z_DEFAULT_STRATEGY
  ) {
    throw new TypeError("Invalid strategy: " + strategy);
  }

  if (this._level !== level || this._strategy !== strategy) {
    var self = this;
    this.flush(binding.Z_SYNC_FLUSH, function () {
      assert(self._handle, "zlib binding closed");
      self._handle.params(level, strategy);
      if (!self._hadError) {
        self._level = level;
        self._strategy = strategy;
        if (callback) callback();
      }
    });
  } else {
    nextTick(callback);
  }
};

Zlib.prototype.reset = function () {
  assert(this._handle, "zlib binding closed");
  return this._handle.reset();
};

// This is the _flush function called by the transform class,
// internally, when the last chunk has been written.
Zlib.prototype._flush = function (callback) {
  this._transform(Buffer.alloc(0), "", callback);
};

Zlib.prototype.flush = function (kind, callback) {
  var _this2 = this;

  var ws = this._writableState;

  if (typeof kind === "function" || kind === undefined && !callback) {
    callback = kind;
    kind = binding.Z_FULL_FLUSH;
  }

  if (ws.ended) {
    if (callback) nextTick(callback);
  } else if (ws.ending) {
    if (callback) this.once("end", callback);
  } else if (ws.needDrain) {
    if (callback) {
      this.once("drain", function () {
        return _this2.flush(kind, callback);
      });
    }
  } else {
    this._flushFlag = kind;
    this.write(Buffer.alloc(0), "", callback);
  }
};

Zlib.prototype.close = function (callback) {
  _close(this, callback);
  nextTick(emitCloseNT, this);
};

function _close(engine, callback) {
  if (callback) nextTick(callback);

  // Caller may invoke .close after a zlib error (which will null _handle).
  if (!engine._handle) return;

  engine._handle.close();
  engine._handle = null;
}

function emitCloseNT(self) {
  self.emit("close");
}

Zlib.prototype._transform = function (chunk, encoding, cb) {
  var flushFlag;
  var ws = this._writableState;
  var ending = ws.ending || ws.ended;
  var last = ending && (!chunk || ws.length === chunk.length);

  if (chunk !== null && !Buffer.isBuffer(chunk)) {
    return cb(new Error("invalid input"));
  }

  if (!this._handle) return cb(new Error("zlib binding closed"));

  // If it's the last chunk, or a final flush, we use the Z_FINISH flush flag
  // (or whatever flag was provided using opts.finishFlush).
  // If it's explicitly flushing at some other time, then we use
  // Z_FULL_FLUSH. Otherwise, use Z_NO_FLUSH for maximum compression
  // goodness.
  if (last) flushFlag = this._finishFlushFlag;
  else {
    flushFlag = this._flushFlag;
    // once we've flushed the last of the queue, stop flushing and
    // go back to the normal behavior.
    if (chunk.length >= ws.length) {
      this._flushFlag = this._opts.flush || binding.Z_NO_FLUSH;
    }
  }

  this._processChunk(chunk, flushFlag, cb);
};

Zlib.prototype._processChunk = function (chunk, flushFlag, cb) {
  var availInBefore = chunk && chunk.length;
  var availOutBefore = this._chunkSize - this._offset;
  var inOff = 0;

  var self = this;

  var async = typeof cb === "function";

  if (!async) {
    var buffers = [];
    var nread = 0;

    var error;
    this.on("error", function (er) {
      error = er;
    });

    assert(this._handle, "zlib binding closed");
    do {
      var res = this._handle.writeSync(
        flushFlag,
        chunk, // in
        inOff, // in_off
        availInBefore, // in_len
        this._buffer, // out
        this._offset, //out_off
        availOutBefore,
      ); // out_len
    } while (!this._hadError && callback(res[0], res[1]));

    if (this._hadError) {
      throw error;
    }

    if (nread >= kMaxLength) {
      _close(this);
      throw new RangeError(kRangeErrorMessage);
    }

    var buf = Buffer.concat(buffers, nread);
    _close(this);

    return buf;
  }

  assert(this._handle, "zlib binding closed");
  var req = this._handle.write(
    flushFlag,
    chunk, // in
    inOff, // in_off
    availInBefore, // in_len
    this._buffer, // out
    this._offset, //out_off
    availOutBefore,
  ); // out_len

  req.buffer = chunk;
  req.callback = callback;

  function callback(availInAfter, availOutAfter) {
    // When the callback is used in an async write, the callback's
    // context is the `req` object that was created. The req object
    // is === this._handle, and that's why it's important to null
    // out the values after they are done being used. `this._handle`
    // can stay in memory longer than the callback and buffer are needed.
    if (this) {
      this.buffer = null;
      this.callback = null;
    }

    if (self._hadError) return;

    var have = availOutBefore - availOutAfter;
    assert(have >= 0, "have should not go down");

    if (have > 0) {
      var out = self._buffer.slice(self._offset, self._offset + have);
      self._offset += have;
      // serve some output to the consumer.
      if (async) {
        self.push(out);
      } else {
        buffers.push(out);
        nread += out.length;
      }
    }

    // exhausted the output buffer, or used all the input create a new one.
    if (availOutAfter === 0 || self._offset >= self._chunkSize) {
      availOutBefore = self._chunkSize;
      self._offset = 0;
      self._buffer = Buffer.allocUnsafe(self._chunkSize);
    }

    if (availOutAfter === 0) {
      // Not actually done.  Need to reprocess.
      // Also, update the availInBefore to the availInAfter value,
      // so that if we have to hit it a third (fourth, etc.) time,
      // it'll have the correct byte counts.
      inOff += availInBefore - availInAfter;
      availInBefore = availInAfter;

      if (!async) return true;

      var newReq = self._handle.write(
        flushFlag,
        chunk,
        inOff,
        availInBefore,
        self._buffer,
        self._offset,
        self._chunkSize,
      );
      newReq.callback = callback; // this same function
      newReq.buffer = chunk;
      return;
    }

    if (!async) return false;

    // finished with the chunk.
    cb();
  }
};

util.inherits(Deflate, Zlib);
util.inherits(Inflate, Zlib);
util.inherits(Gzip, Zlib);
util.inherits(Gunzip, Zlib);
util.inherits(DeflateRaw, Zlib);
util.inherits(InflateRaw, Zlib);
util.inherits(Unzip, Zlib);

export { Deflate, DeflateRaw, Gunzip, Gzip, Inflate, InflateRaw, Unzip };
