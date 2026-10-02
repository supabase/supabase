// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.

import { primordials } from "ext:core/mod.js";
const {
  Uint8ArrayPrototype,
  Error,
  ObjectDefineProperties,
  ObjectDefineProperty,
  TypedArrayPrototypeSlice,
  PromisePrototypeThen,
  ObjectValues,
  ObjectPrototypeIsPrototypeOf,
} = primordials;

import { Buffer } from "node:buffer";
import {
  clearLine,
  clearScreenDown,
  cursorTo,
  moveCursor,
} from "ext:deno_node/internal/readline/callbacks.mjs";
import { Duplex, Readable, Writable } from "node:stream";
import * as io from "ext:deno_io/12_io.js";
import { guessHandleType } from "ext:deno_node/internal_binding/util.ts";

// https://github.com/nodejs/node/blob/00738314828074243c9a52a228ab4c68b04259ef/lib/internal/bootstrap/switches/is_main_thread.js#L41
export function createWritableStdioStream(writer, name, warmup = false) {
  const stream = new Writable({
    emitClose: false,
    write(buf, enc, cb) {
      if (!writer) {
        this.destroy(
          new Error(`Deno.${name} is not available in this environment`),
        );
        return;
      }
      writer.writeSync(
        ObjectPrototypeIsPrototypeOf(Uint8ArrayPrototype, buf)
          ? buf
          : Buffer.from(buf, enc),
      );
      cb();
    },
    destroy(err, cb) {
      cb(err);
      this._undestroy();
      if (!this._writableState.emitClose) {
        nextTick(() => this.emit("close"));
      }
    },
  });
  let fd = -1;

  // deno-lint-ignore prefer-primordials
  if (writer instanceof io.Stdout) {
    fd = io.STDOUT_RID;
    // deno-lint-ignore prefer-primordials
  } else if (writer instanceof io.Stderr) {
    fd = io.STDERR_RID;
  }
  stream.fd = fd;
  stream.destroySoon = stream.destroy;
  stream._isStdio = true;
  stream.once("close", () => writer?.close());

  // We cannot call `writer?.isTerminal()` eagerly here
  let getIsTTY = () => writer?.isTerminal();
  const getColumns = () =>
    stream._columns ||
    (writer?.isTerminal() ? Deno.consoleSize?.().columns : undefined);

  ObjectDefineProperties(stream, {
    columns: {
      __proto__: null,
      enumerable: true,
      configurable: true,
      get: () => getColumns(),
      set: (value) => {
        stream._columns = value;
      },
    },
    rows: {
      __proto__: null,
      enumerable: true,
      configurable: true,
      get: () => writer?.isTerminal() ? Deno.consoleSize?.().rows : undefined,
    },
    isTTY: {
      __proto__: null,
      enumerable: true,
      configurable: true,
      // Allow users to overwrite it
      get: () => getIsTTY(),
      set: (value) => {
        getIsTTY = () => value;
      },
    },
    getWindowSize: {
      __proto__: null,
      enumerable: true,
      configurable: true,
      value: () =>
        writer?.isTerminal() ? ObjectValues(Deno.consoleSize?.()) : undefined,
    },
  });

  // If we're warming up, create a stdout/stderr stream that assumes a terminal (the most likely case).
  // If we're wrong at boot time, we'll recreate it.
  if (warmup || writer?.isTerminal()) {
    // These belong on tty.WriteStream(), but the TTY streams currently have
    // following problems:
    // 1. Using them here introduces a circular dependency.
    // 2. Creating a net.Socket() from a fd is not currently supported.
    stream.cursorTo = function (x, y, callback) {
      return cursorTo(this, x, y, callback);
    };

    stream.moveCursor = function (dx, dy, callback) {
      return moveCursor(this, dx, dy, callback);
    };

    stream.clearLine = function (dir, callback) {
      return clearLine(this, dir, callback);
    };

    stream.clearScreenDown = function (callback) {
      return clearScreenDown(this, callback);
    };
  }

  return stream;
}

function _guessStdinType(fd) {
  if (typeof fd !== "number" || fd < 0) return "UNKNOWN";
  return guessHandleType(fd);
}

const _read = function (size) {
  const p = Buffer.alloc(size || 16 * 1024);
  PromisePrototypeThen(io.stdin?.read(p), (length) => {
    // deno-lint-ignore prefer-primordials
    this.push(length === null ? null : TypedArrayPrototypeSlice(p, 0, length));
  }, (error) => {
    this.destroy(error);
  });
};

let readStream;
export function setReadStream(s) {
  readStream = s;
}

/** https://nodejs.org/api/process.html#process_process_stdin */
// https://github.com/nodejs/node/blob/v18.12.1/lib/internal/bootstrap/switches/is_main_thread.js#L189
/** Create process.stdin */
export const initStdin = (warmup = false) => {
  const fd = io.stdin ? io.STDIN_RID : undefined;
  let stdin;
  // Warmup assumes a TTY for all stdio
  const stdinType = warmup ? "TTY" : _guessStdinType(fd);

  switch (stdinType) {
    case "FILE": {
      // Since `fs.ReadStream` cannot be imported before process initialization,
      // use `Readable` instead.
      // https://github.com/nodejs/node/blob/v18.12.1/lib/internal/bootstrap/switches/is_main_thread.js#L200
      // https://github.com/nodejs/node/blob/v18.12.1/lib/internal/fs/streams.js#L148
      stdin = new Readable({
        highWaterMark: 64 * 1024,
        autoDestroy: false,
        read: _read,
      });
      break;
    }
    case "TTY": {
      // If it's a TTY, we know that the stdin we created during warmup is the correct one and
      // just return null to re-use it.
      if (!warmup) {
        return null;
      }
      stdin = new readStream(fd);
      break;
    }
    case "PIPE":
    case "TCP": {
      // For PIPE and TCP, `new Duplex()` should be replaced `new net.Socket()` if possible.
      // There are two problems that need to be resolved.
      // 1. Using them here introduces a circular dependency.
      // 2. Creating a net.Socket() from a fd is not currently supported.
      // https://github.com/nodejs/node/blob/v18.12.1/lib/internal/bootstrap/switches/is_main_thread.js#L206
      // https://github.com/nodejs/node/blob/v18.12.1/lib/net.js#L329
      stdin = new Duplex({
        readable: stdinType === "TTY" ? undefined : true,
        writable: stdinType === "TTY" ? undefined : false,
        readableHighWaterMark: stdinType === "TTY" ? 0 : undefined,
        allowHalfOpen: false,
        emitClose: false,
        autoDestroy: true,
        decodeStrings: false,
        read: _read,
      });

      if (stdinType !== "TTY") {
        // Make sure the stdin can't be `.end()`-ed
        stdin._writableState.ended = true;
      }
      break;
    }
    default: {
      // Provide a dummy contentless input for e.g. non-console
      // Windows applications.
      stdin = new Readable({ read() {} });
      // deno-lint-ignore prefer-primordials
      stdin.push(null);
    }
  }

  stdin.on("close", () => io.stdin?.close());
  stdin.fd = io.stdin ? io.STDIN_RID : -1;
  ObjectDefineProperty(stdin, "isTTY", {
    __proto__: null,
    enumerable: true,
    configurable: true,
    get() {
      return io.stdin.isTerminal();
    },
  });
  stdin._isRawMode = false;
  stdin.setRawMode = (enable) => {
    io.stdin?.setRaw?.(enable);
    stdin._isRawMode = enable;
    return stdin;
  };
  ObjectDefineProperty(stdin, "isRaw", {
    __proto__: null,
    enumerable: true,
    configurable: true,
    get() {
      return stdin._isRawMode;
    },
  });

  return stdin;
};
