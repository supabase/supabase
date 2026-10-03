// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import {
  ERR_INVALID_ARG_TYPE,
  ERR_OUT_OF_RANGE,
} from "ext:deno_node/internal/errors.ts";
import { kEmptyObject } from "ext:deno_node/internal/util.mjs";
import { deprecate } from "node:util";
import {
  validateFunction,
  validateInteger,
} from "ext:deno_node/internal/validators.mjs";
import { errorOrDestroy } from "ext:deno_node/internal/streams/destroy.mjs";
import { open as fsOpen } from "ext:deno_node/_fs/_fs_open.ts";
import { read as fsRead } from "ext:deno_node/_fs/_fs_read.ts";
import { write as fsWrite } from "ext:deno_node/_fs/_fs_write.mjs";
import { writev as fsWritev } from "ext:deno_node/_fs/_fs_writev.mjs";
import { close as fsClose } from "ext:deno_node/_fs/_fs_close.ts";
import { Buffer } from "node:buffer";
import {
  copyObject,
  getOptions,
  getValidatedFd,
  validatePath,
} from "ext:deno_node/internal/fs/utils.mjs";
import { finished, Readable, Writable } from "node:stream";
import { toPathIfFileURL } from "ext:deno_node/internal/url.ts";
import { nextTick } from "ext:deno_node/_next_tick.ts";
const kIoDone = Symbol("kIoDone");
const kIsPerformingIO = Symbol("kIsPerformingIO");

const kFs = Symbol("kFs");

function _construct(callback) {
  // deno-lint-ignore no-this-alias
  const stream = this;
  if (typeof stream.fd === "number") {
    callback();
    return;
  }

  if (stream.open !== openWriteFs && stream.open !== openReadFs) {
    // Backwards compat for monkey patching open().
    const orgEmit = stream.emit;
    stream.emit = function (...args) {
      if (args[0] === "open") {
        this.emit = orgEmit;
        callback();
        Reflect.apply(orgEmit, this, args);
      } else if (args[0] === "error") {
        this.emit = orgEmit;
        callback(args[1]);
      } else {
        Reflect.apply(orgEmit, this, args);
      }
    };
    stream.open();
  } else {
    stream[kFs].open(
      stream.path.toString(),
      stream.flags,
      stream.mode,
      (er, fd) => {
        if (er) {
          callback(er);
        } else {
          stream.fd = fd;
          callback();
          stream.emit("open", stream.fd);
          stream.emit("ready");
        }
      },
    );
  }
}

function close(stream, err, cb) {
  if (!stream.fd) {
    cb(err);
  } else {
    stream[kFs].close(stream.fd, (er) => {
      cb(er || err);
    });
    stream.fd = null;
  }
}

function importFd(stream, options) {
  if (typeof options.fd === "number") {
    // When fd is a raw descriptor, we must keep our fingers crossed
    // that the descriptor won't get closed, or worse, replaced with
    // another one
    // https://github.com/nodejs/node/issues/35862
    if (stream instanceof ReadStream) {
      stream[kFs] = options.fs || { read: fsRead, close: fsClose };
    }
    if (stream instanceof WriteStream) {
      stream[kFs] = options.fs ||
        { write: fsWrite, writev: fsWritev, close: fsClose };
    }
    return options.fd;
  }

  throw new ERR_INVALID_ARG_TYPE("options.fd", ["number"], options.fd);
}

export function ReadStream(path, options) {
  if (!(this instanceof ReadStream)) {
    return new ReadStream(path, options);
  }

  // A little bit bigger buffer and water marks by default
  options = copyObject(getOptions(options, kEmptyObject));
  if (options.highWaterMark === undefined) {
    options.highWaterMark = 64 * 1024;
  }

  if (options.autoDestroy === undefined) {
    options.autoDestroy = false;
  }

  if (options.fd == null) {
    this.fd = null;
    this[kFs] = options.fs || { open: fsOpen, read: fsRead, close: fsClose };
    validateFunction(this[kFs].open, "options.fs.open");

    // Path will be ignored when fd is specified, so it can be falsy
    this.path = toPathIfFileURL(path);
    this.flags = options.flags === undefined ? "r" : options.flags;
    this.mode = options.mode === undefined ? 0o666 : options.mode;

    validatePath(this.path);
  } else {
    this.fd = getValidatedFd(importFd(this, options));
  }

  options.autoDestroy = options.autoClose === undefined
    ? true
    : options.autoClose;

  validateFunction(this[kFs].read, "options.fs.read");

  if (options.autoDestroy) {
    validateFunction(this[kFs].close, "options.fs.close");
  }

  this.start = options.start;
  this.end = options.end ?? Infinity;
  this.pos = undefined;
  this.bytesRead = 0;
  this[kIsPerformingIO] = false;

  if (this.start !== undefined) {
    validateInteger(this.start, "start", 0);

    this.pos = this.start;
  }

  if (this.end !== Infinity) {
    validateInteger(this.end, "end", 0);

    if (this.start !== undefined && this.start > this.end) {
      throw new ERR_OUT_OF_RANGE(
        "start",
        `<= "end" (here: ${this.end})`,
        this.start,
      );
    }
  }

  Reflect.apply(Readable, this, [options]);
}

Object.setPrototypeOf(ReadStream.prototype, Readable.prototype);
Object.setPrototypeOf(ReadStream, Readable);

Object.defineProperty(ReadStream.prototype, "autoClose", {
  get() {
    return this._readableState.autoDestroy;
  },
  set(val) {
    this._readableState.autoDestroy = val;
  },
});

const openReadFs = deprecate(
  function () {
    // Noop.
  },
  "ReadStream.prototype.open() is deprecated",
  "DEP0135",
);
ReadStream.prototype.open = openReadFs;

ReadStream.prototype._construct = _construct;

ReadStream.prototype._read = async function (n) {
  n = this.pos !== undefined
    ? Math.min(this.end - this.pos + 1, n)
    : Math.min(this.end - this.bytesRead + 1, n);

  if (n <= 0) {
    this.push(null);
    return;
  }

  const buf = Buffer.allocUnsafeSlow(n);

  let error = null;
  let bytesRead = null;
  let buffer = undefined;

  this[kIsPerformingIO] = true;

  await new Promise((resolve) => {
    this[kFs]
      .read(
        this.fd,
        buf,
        0,
        n,
        this.pos ?? null,
        (_er, _bytesRead, _buf) => {
          error = _er;
          bytesRead = _bytesRead;
          buffer = _buf;
          return resolve(true);
        },
      );
  });

  this[kIsPerformingIO] = false;

  // Tell ._destroy() that it's safe to close the fd now.
  if (this.destroyed) {
    this.emit(kIoDone, error);
    return;
  }

  if (error) {
    errorOrDestroy(this, error);
  } else if (
    typeof bytesRead === "number" &&
    bytesRead > 0
  ) {
    if (this.pos !== undefined) {
      this.pos += bytesRead;
    }

    this.bytesRead += bytesRead;

    if (bytesRead !== buffer.length) {
      // Slow path. Shrink to fit.
      // Copy instead of slice so that we don't retain
      // large backing buffer for small reads.
      const dst = Buffer.allocUnsafeSlow(bytesRead);
      buffer.copy(dst, 0, 0, bytesRead);
      buffer = dst;
    }

    this.push(buffer);
  } else {
    this.push(null);
  }
};

ReadStream.prototype._destroy = function (err, cb) {
  // Usually for async IO it is safe to close a file descriptor
  // even when there are pending operations. However, due to platform
  // differences file IO is implemented using synchronous operations
  // running in a thread pool. Therefore, file descriptors are not safe
  // to close while used in a pending read or write operation. Wait for
  // any pending IO (kIsPerformingIO) to complete (kIoDone).
  if (this[kIsPerformingIO]) {
    this.once(kIoDone, (er) => close(this, err || er, cb));
  } else {
    close(this, err, cb);
  }
};

ReadStream.prototype.close = function (cb) {
  if (typeof cb === "function") finished(this, cb);
  this.destroy();
};

Object.defineProperty(ReadStream.prototype, "pending", {
  get() {
    return this.fd === null;
  },
  configurable: true,
});

export function WriteStream(path, options) {
  if (!(this instanceof WriteStream)) {
    return new WriteStream(path, options);
  }

  options = copyObject(getOptions(options, kEmptyObject));

  // Only buffers are supported.
  options.decodeStrings = true;

  if (options.fd == null) {
    this.fd = null;
    this[kFs] = options.fs ||
      { open: fsOpen, write: fsWrite, writev: fsWritev, close: fsClose };
    validateFunction(this[kFs].open, "options.fs.open");

    // Path will be ignored when fd is specified, so it can be falsy
    this.path = toPathIfFileURL(path);
    this.flags = options.flags === undefined ? "w" : options.flags;
    this.mode = options.mode === undefined ? 0o666 : options.mode;

    validatePath(this.path);
  } else {
    this.fd = getValidatedFd(importFd(this, options));
  }

  options.autoDestroy = options.autoClose === undefined
    ? true
    : options.autoClose;

  if (!this[kFs].write && !this[kFs].writev) {
    throw new ERR_INVALID_ARG_TYPE(
      "options.fs.write",
      "function",
      this[kFs].write,
    );
  }

  if (this[kFs].write) {
    validateFunction(this[kFs].write, "options.fs.write");
  }

  if (this[kFs].writev) {
    validateFunction(this[kFs].writev, "options.fs.writev");
  }

  if (options.autoDestroy) {
    validateFunction(this[kFs].close, "options.fs.close");
  }

  // It's enough to override either, in which case only one will be used.
  if (!this[kFs].write) {
    this._write = null;
  }
  if (!this[kFs].writev) {
    this._writev = null;
  }

  this.start = options.start;
  this.pos = undefined;
  this.bytesWritten = 0;
  this[kIsPerformingIO] = false;

  if (this.start !== undefined) {
    validateInteger(this.start, "start", 0);

    this.pos = this.start;
  }

  Reflect.apply(Writable, this, [options]);

  if (options.encoding) {
    this.setDefaultEncoding(options.encoding);
  }
}

Object.setPrototypeOf(WriteStream.prototype, Writable.prototype);
Object.setPrototypeOf(WriteStream, Writable);

Object.defineProperty(WriteStream.prototype, "autoClose", {
  get() {
    return this._writableState.autoDestroy;
  },
  set(val) {
    this._writableState.autoDestroy = val;
  },
});

const openWriteFs = deprecate(
  function () {
    // Noop.
  },
  "WriteStream.prototype.open() is deprecated",
  "DEP0135",
);
WriteStream.prototype.open = openWriteFs;

WriteStream.prototype._construct = _construct;

WriteStream.prototype._write = function (data, _encoding, cb) {
  this[kIsPerformingIO] = true;
  this[kFs].write(this.fd, data, 0, data.length, this.pos, (er, bytes) => {
    this[kIsPerformingIO] = false;
    if (this.destroyed) {
      // Tell ._destroy() that it's safe to close the fd now.
      cb(er);
      return this.emit(kIoDone, er);
    }

    if (er) {
      return cb(er);
    }

    this.bytesWritten += bytes;
    cb();
  });

  if (this.pos !== undefined) {
    this.pos += data.length;
  }
};

WriteStream.prototype._writev = function (data, cb) {
  const len = data.length;
  const chunks = new Array(len);
  let size = 0;

  for (let i = 0; i < len; i++) {
    const chunk = data[i].chunk;

    chunks[i] = chunk;
    size += chunk.length;
  }

  this[kIsPerformingIO] = true;
  this[kFs].writev(this.fd, chunks, this.pos ?? null, (er, bytes) => {
    this[kIsPerformingIO] = false;
    if (this.destroyed) {
      // Tell ._destroy() that it's safe to close the fd now.
      cb(er);
      return this.emit(kIoDone, er);
    }

    if (er) {
      return cb(er);
    }

    this.bytesWritten += bytes;
    cb();
  });

  if (this.pos !== undefined) {
    this.pos += size;
  }
};

WriteStream.prototype._destroy = function (err, cb) {
  // Usually for async IO it is safe to close a file descriptor
  // even when there are pending operations. However, due to platform
  // differences file IO is implemented using synchronous operations
  // running in a thread pool. Therefore, file descriptors are not safe
  // to close while used in a pending read or write operation. Wait for
  // any pending IO (kIsPerformingIO) to complete (kIoDone).
  if (this[kIsPerformingIO]) {
    this.once(kIoDone, (er) => close(this, err || er, cb));
  } else {
    close(this, err, cb);
  }
};

WriteStream.prototype.close = function (cb) {
  if (cb) {
    if (this.closed) {
      nextTick(cb);
      return;
    }
    this.on("close", cb);
  }

  // If we are not autoClosing, we should call
  // destroy on 'finish'.
  if (!this.autoClose) {
    this.on("finish", this.destroy);
  }

  // We use end() instead of destroy() because of
  // https://github.com/nodejs/node/issues/2006
  this.end();
};

// There is no shutdown() for files.
WriteStream.prototype.destroySoon = WriteStream.prototype.end;

Object.defineProperty(WriteStream.prototype, "pending", {
  get() {
    return this.fd === null;
  },
  configurable: true,
});

export function createReadStream(path, options) {
  return new ReadStream(path, options);
}

export function createWriteStream(path, options) {
  return new WriteStream(path, options);
}
