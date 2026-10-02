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

import { notImplemented } from "ext:deno_node/_utils.ts";
import { BlockList, SocketAddress } from "ext:deno_node/internal/blocklist.mjs";

import { EventEmitter } from "node:events";
import {
  isIP,
  isIPv4,
  isIPv6,
  kReinitializeHandle,
  normalizedArgsSymbol,
} from "ext:deno_node/internal/net.ts";
import { Duplex } from "node:stream";
import {
  asyncIdSymbol,
  defaultTriggerAsyncIdScope,
  newAsyncId,
  ownerSymbol,
} from "ext:deno_node/internal/async_hooks.ts";
import {
  ERR_INVALID_ADDRESS_FAMILY,
  ERR_INVALID_ARG_TYPE,
  ERR_INVALID_ARG_VALUE,
  ERR_INVALID_FD_TYPE,
  ERR_INVALID_IP_ADDRESS,
  ERR_MISSING_ARGS,
  ERR_SERVER_ALREADY_LISTEN,
  ERR_SERVER_NOT_RUNNING,
  ERR_SOCKET_CLOSED,
  ERR_SOCKET_CONNECTION_TIMEOUT,
  errnoException,
  exceptionWithHostPort,
  genericNodeError,
  NodeAggregateError,
  uvExceptionWithHostPort,
} from "ext:deno_node/internal/errors.ts";
import type { ErrnoException } from "ext:deno_node/internal/errors.ts";
import { Encodings } from "ext:deno_node/_utils.ts";
import { isUint8Array } from "ext:deno_node/internal/util/types.ts";
import {
  kAfterAsyncWrite,
  kBuffer,
  kBufferCb,
  kBufferGen,
  kHandle,
  kUpdateTimer,
  onStreamRead,
  setStreamTimeout,
  writeGeneric,
  writevGeneric,
} from "ext:deno_node/internal/stream_base_commons.ts";
import { kTimeout } from "ext:deno_node/internal/timers.mjs";
import { nextTick } from "ext:deno_node/_next_tick.ts";
import {
  DTRACE_NET_SERVER_CONNECTION,
  DTRACE_NET_STREAM_END,
} from "ext:deno_node/internal/dtrace.ts";
import { Buffer } from "node:buffer";
import type { LookupOneOptions } from "ext:deno_node/internal/dns/utils.ts";
import {
  validateAbortSignal,
  validateBoolean,
  validateFunction,
  validateInt32,
  validateNumber,
  validatePort,
  validateString,
} from "ext:deno_node/internal/validators.mjs";
import {
  constants as TCPConstants,
  TCP,
  TCPConnectWrap,
} from "ext:deno_node/internal_binding/tcp_wrap.ts";
import {
  constants as PipeConstants,
  Pipe,
  PipeConnectWrap,
} from "ext:deno_node/internal_binding/pipe_wrap.ts";
import { ShutdownWrap } from "ext:deno_node/internal_binding/stream_wrap.ts";
import { assert } from "ext:deno_node/_util/asserts.ts";
import { isWindows } from "ext:deno_node/_util/os.ts";
import { ADDRCONFIG, lookup as dnsLookup } from "node:dns";
import {
  codeMap,
  UV_ECANCELED,
  UV_ETIMEDOUT,
} from "ext:deno_node/internal_binding/uv.ts";
import { guessHandleType } from "ext:deno_node/internal_binding/util.ts";
import { debuglog } from "ext:deno_node/internal/util/debuglog.ts";
import type { DuplexOptions } from "ext:deno_node/_stream.d.ts";
import type { BufferEncoding } from "ext:deno_node/_global.d.ts";
import type { Abortable } from "ext:deno_node/_events.d.ts";
import { channel } from "node:diagnostics_channel";
import { primordials } from "ext:core/mod.js";

const {
  ArrayPrototypeIncludes,
  ArrayPrototypePush,
  FunctionPrototypeBind,
  MathMax,
} = primordials;

let debug = debuglog("net", (fn) => {
  debug = fn;
});

const kLastWriteQueueSize = Symbol("lastWriteQueueSize");
const kSetNoDelay = Symbol("kSetNoDelay");
const kBytesRead = Symbol("kBytesRead");
const kBytesWritten = Symbol("kBytesWritten");

const DEFAULT_IPV4_ADDR = "0.0.0.0";
const DEFAULT_IPV6_ADDR = "::";

let autoSelectFamilyDefault = true;
let autoSelectFamilyAttemptTimeoutDefault = 250;

type Handle = TCP | Pipe;

interface HandleOptions {
  pauseOnCreate?: boolean;
  manualStart?: boolean;
  handle?: Handle;
}

interface OnReadOptions {
  buffer: Uint8Array | (() => Uint8Array);
  /**
   * This function is called for every chunk of incoming data.
   *
   * Two arguments are passed to it: the number of bytes written to buffer and
   * a reference to buffer.
   *
   * Return `false` from this function to implicitly `pause()` the socket.
   */
  callback(bytesWritten: number, buf: Uint8Array): boolean;
}

interface ConnectOptions {
  /**
   * If specified, incoming data is stored in a single buffer and passed to the
   * supplied callback when data arrives on the socket.
   *
   * Note: this will cause the streaming functionality to not provide any data,
   * however events like `"error"`, `"end"`, and `"close"` will still be
   * emitted as normal and methods like `pause()` and `resume()` will also
   * behave as expected.
   */
  onread?: OnReadOptions;
}

interface SocketOptions extends ConnectOptions, HandleOptions, DuplexOptions {
  /**
   * If specified, wrap around an existing socket with the given file
   * descriptor, otherwise a new socket will be created.
   */
  fd?: number;
  /**
   * If set to `false`, then the socket will automatically end the writable
   * side when the readable side ends. See `net.createServer()` and the `"end"`
   * event for details. Default: `false`.
   */
  allowHalfOpen?: boolean;
  /**
   * Allow reads on the socket when an fd is passed, otherwise ignored.
   * Default: `false`.
   */
  readable?: boolean;
  /**
   * Allow writes on the socket when an fd is passed, otherwise ignored.
   * Default: `false`.
   */
  writable?: boolean;
  /** An Abort signal that may be used to destroy the socket. */
  signal?: AbortSignal;
}

interface TcpNetConnectOptions extends TcpSocketConnectOptions, SocketOptions {
  timeout?: number;
}

interface IpcNetConnectOptions extends IpcSocketConnectOptions, SocketOptions {
  timeout?: number;
}

type NetConnectOptions = TcpNetConnectOptions | IpcNetConnectOptions;

interface AddressInfo {
  address: string;
  family?: string;
  port: number;
}

type LookupFunction = (
  hostname: string,
  options: LookupOneOptions,
  callback: (
    err: ErrnoException | null,
    address: string,
    family: number,
  ) => void,
) => void;

interface TcpSocketConnectOptions extends ConnectOptions {
  port: number;
  host?: string;
  localAddress?: string;
  localPort?: number;
  hints?: number;
  family?: number;
  lookup?: LookupFunction;
  autoSelectFamily?: boolean | undefined;
  autoSelectFamilyAttemptTimeout?: number | undefined;
}

interface IpcSocketConnectOptions extends ConnectOptions {
  path: string;
}

type SocketConnectOptions = TcpSocketConnectOptions | IpcSocketConnectOptions;

function _getNewAsyncId(handle?: Handle): number {
  return !handle || typeof handle.getAsyncId !== "function"
    ? newAsyncId()
    : handle.getAsyncId();
}

interface NormalizedArgs {
  0: Partial<NetConnectOptions | ListenOptions>;
  1: ConnectionListener | null;
  [normalizedArgsSymbol]?: boolean;
}

const _noop = (_arrayBuffer: Uint8Array, _nread: number): undefined => {
  return;
};

const netClientSocketChannel = channel("net.client.socket");
const netServerSocketChannel = channel("net.server.socket");

function _toNumber(x: unknown): number | false {
  return (x = Number(x)) >= 0 ? (x as number) : false;
}

function _isPipeName(s: unknown): s is string {
  return typeof s === "string" && _toNumber(s) === false;
}

function _createHandle(fd: number, isServer: boolean): Handle {
  validateInt32(fd, "fd", 0);

  const type = guessHandleType(fd);

  if (type === "PIPE") {
    return new Pipe(isServer ? PipeConstants.SERVER : PipeConstants.SOCKET);
  }

  if (type === "TCP") {
    return new TCP(isServer ? TCPConstants.SERVER : TCPConstants.SOCKET);
  }

  throw new ERR_INVALID_FD_TYPE(type);
}

// Returns an array [options, cb], where options is an object,
// cb is either a function or null.
// Used to normalize arguments of `Socket.prototype.connect()` and
// `Server.prototype.listen()`. Possible combinations of parameters:
// - (options[...][, cb])
// - (path[...][, cb])
// - ([port][, host][...][, cb])
// For `Socket.prototype.connect()`, the [...] part is ignored
// For `Server.prototype.listen()`, the [...] part is [, backlog]
// but will not be handled here (handled in listen())
export function _normalizeArgs(args: unknown[]): NormalizedArgs {
  let arr: NormalizedArgs;

  if (args.length === 0) {
    arr = [{}, null];
    arr[normalizedArgsSymbol] = true;

    return arr;
  }

  const arg0 = args[0] as Partial<NetConnectOptions> | number | string;
  let options: Partial<SocketConnectOptions> = {};

  if (typeof arg0 === "object" && arg0 !== null) {
    // (options[...][, cb])
    options = arg0;
  } else if (_isPipeName(arg0)) {
    // (path[...][, cb])
    (options as IpcSocketConnectOptions).path = arg0;
  } else {
    // ([port][, host][...][, cb])
    (options as TcpSocketConnectOptions).port = arg0;

    if (args.length > 1 && typeof args[1] === "string") {
      (options as TcpSocketConnectOptions).host = args[1];
    }
  }

  const cb = args[args.length - 1];

  if (!_isConnectionListener(cb)) {
    arr = [options, null];
  } else {
    arr = [options, cb];
  }

  arr[normalizedArgsSymbol] = true;

  return arr;
}

function _afterConnect(
  status: number,
  // deno-lint-ignore no-explicit-any
  handle: any,
  req: PipeConnectWrap | TCPConnectWrap,
  readable: boolean,
  writable: boolean,
) {
  let socket = handle[ownerSymbol];

  if (socket.constructor.name === "ReusedHandle") {
    socket = socket.handle;
  }

  // Callback may come after call to destroy
  if (socket.destroyed) {
    return;
  }

  debug("afterConnect");

  assert(socket.connecting);

  socket.connecting = false;
  socket._sockname = null;

  if (status === 0) {
    if (socket.readable && !readable) {
      socket.push(null);
      socket.read();
    }

    if (socket.writable && !writable) {
      socket.end();
    }

    socket._unrefTimer();

    socket.emit("connect");
    socket.emit("ready");

    // Start the first read, or get an immediate EOF.
    // this doesn't actually consume any bytes, because len=0.
    if (readable && !socket.isPaused()) {
      socket.read(0);
    }
  } else {
    socket.connecting = false;
    let details;

    if (req.localAddress && req.localPort) {
      details = req.localAddress + ":" + req.localPort;
    }

    const ex = exceptionWithHostPort(
      status,
      "connect",
      req.address,
      (req as TCPConnectWrap).port,
      details,
    );

    if (details) {
      ex.localAddress = req.localAddress;
      ex.localPort = req.localPort;
    }

    socket.destroy(ex);
  }
}

function _createConnectionError(req, status) {
  let details;

  if (req.localAddress && req.localPort) {
    details = req.localAddress + ":" + req.localPort;
  }

  const ex = exceptionWithHostPort(
    status,
    "connect",
    req.address,
    req.port,
    details,
  );
  if (details) {
    ex.localAddress = req.localAddress;
    ex.localPort = req.localPort;
  }

  return ex;
}

function _afterConnectMultiple(
  context,
  current,
  status,
  handle,
  req,
  readable,
  writable,
) {
  debug(
    "connect/multiple: connection attempt to %s:%s completed with status %s",
    req.address,
    req.port,
    status,
  );

  // Make sure another connection is not spawned
  clearTimeout(context[kTimeout]);

  // One of the connection has completed and correctly dispatched but after timeout, ignore this one
  if (status === 0 && current !== context.current - 1) {
    debug(
      "connect/multiple: ignoring successful but timedout connection to %s:%s",
      req.address,
      req.port,
    );
    handle.close();
    return;
  }

  const self = context.socket;

  // Some error occurred, add to the list of exceptions
  if (status !== 0) {
    const ex = _createConnectionError(req, status);
    ArrayPrototypePush(context.errors, ex);

    self.emit(
      "connectionAttemptFailed",
      req.address,
      req.port,
      req.addressType,
      ex,
    );

    // Try the next address, unless we were aborted
    if (context.socket.connecting) {
      _internalConnectMultiple(context, status === UV_ECANCELED);
    }

    return;
  }

  _afterConnect(status, self._handle, req, readable, writable);
}

function _internalConnectMultipleTimeout(context, req, handle) {
  debug(
    "connect/multiple: connection to %s:%s timed out",
    req.address,
    req.port,
  );
  context.socket.emit(
    "connectionAttemptTimeout",
    req.address,
    req.port,
    req.addressType,
  );

  req.oncomplete = undefined;
  ArrayPrototypePush(context.errors, _createConnectionError(req, UV_ETIMEDOUT));
  handle.close();

  // Try the next address, unless we were aborted
  if (context.socket.connecting) {
    _internalConnectMultiple(context);
  }
}

function _checkBindError(err: number, port: number, handle: TCP) {
  // EADDRINUSE may not be reported until we call `listen()` or `connect()`.
  // To complicate matters, a failed `bind()` followed by `listen()` or `connect()`
  // will implicitly bind to a random port. Ergo, check that the socket is
  // bound to the expected port before calling `listen()` or `connect()`.
  if (err === 0 && port > 0 && handle.getsockname) {
    const out: AddressInfo | Record<string, never> = {};
    err = handle.getsockname(out);

    if (err === 0 && port !== out.port) {
      err = codeMap.get("EADDRINUSE")!;
    }
  }

  return err;
}

function _isPipe(
  options: Partial<SocketConnectOptions>,
): options is IpcSocketConnectOptions {
  return "path" in options && !!options.path;
}

function _connectErrorNT(socket: Socket, err: Error) {
  socket.destroy(err);
}

function _internalConnect(
  socket: Socket,
  address: string,
  port: number,
  addressType: number,
  localAddress: string,
  localPort: number,
  flags: number,
) {
  assert(socket.connecting);

  let err;

  if (localAddress || localPort) {
    if (addressType === 4) {
      localAddress = localAddress || DEFAULT_IPV4_ADDR;
      err = (socket._handle as TCP).bind(localAddress, localPort);
    } else {
      // addressType === 6
      localAddress = localAddress || DEFAULT_IPV6_ADDR;
      err = (socket._handle as TCP).bind6(localAddress, localPort, flags);
    }

    debug(
      "binding to localAddress: %s and localPort: %d (addressType: %d)",
      localAddress,
      localPort,
      addressType,
    );

    err = _checkBindError(err, localPort, socket._handle as TCP);

    if (err) {
      const ex = exceptionWithHostPort(err, "bind", localAddress, localPort);
      socket.destroy(ex);

      return;
    }
  }

  if (addressType === 6 || addressType === 4) {
    const req = new TCPConnectWrap();
    req.oncomplete = _afterConnect;
    req.address = address;
    req.port = port;
    req.localAddress = localAddress;
    req.localPort = localPort;

    if (addressType === 4) {
      err = (socket._handle as TCP).connect(req, address, port);
    } else {
      err = (socket._handle as TCP).connect6(req, address, port);
    }
  } else {
    const req = new PipeConnectWrap();
    req.oncomplete = _afterConnect;
    req.address = address;

    err = (socket._handle as Pipe).connect(req, address);
  }

  if (err) {
    let details = "";

    const sockname = socket._getsockname();

    if (sockname) {
      details = `${sockname.address}:${sockname.port}`;
    }

    const ex = exceptionWithHostPort(err, "connect", address, port, details);
    socket.destroy(ex);
  }
}

function _internalConnectMultiple(context, canceled?: boolean) {
  clearTimeout(context[kTimeout]);
  const self = context.socket;

  // We were requested to abort. Stop all operations
  if (self._aborted) {
    return;
  }

  // All connections have been tried without success, destroy with error
  if (canceled || context.current === context.addresses.length) {
    if (context.errors.length === 0) {
      self.destroy(new ERR_SOCKET_CONNECTION_TIMEOUT());
      return;
    }

    self.destroy(new NodeAggregateError(context.errors));
    return;
  }

  assert(self.connecting);

  const current = context.current++;

  if (current > 0) {
    self[kReinitializeHandle](new TCP(TCPConstants.SOCKET));
  }

  const { localPort, port, flags } = context;
  const { address, family: addressType } = context.addresses[current];
  let localAddress;
  let err;

  if (localPort) {
    if (addressType === 4) {
      localAddress = DEFAULT_IPV4_ADDR;
      err = self._handle.bind(localAddress, localPort);
    } else { // addressType === 6
      localAddress = DEFAULT_IPV6_ADDR;
      err = self._handle.bind6(localAddress, localPort, flags);
    }

    debug(
      "connect/multiple: binding to localAddress: %s and localPort: %d (addressType: %d)",
      localAddress,
      localPort,
      addressType,
    );

    err = _checkBindError(err, localPort, self._handle);
    if (err) {
      ArrayPrototypePush(
        context.errors,
        exceptionWithHostPort(err, "bind", localAddress, localPort),
      );
      _internalConnectMultiple(context);
      return;
    }
  }

  debug(
    "connect/multiple: attempting to connect to %s:%d (addressType: %d)",
    address,
    port,
    addressType,
  );
  self.emit("connectionAttempt", address, port, addressType);

  const req = new TCPConnectWrap();
  req.oncomplete = FunctionPrototypeBind(
    _afterConnectMultiple,
    undefined,
    context,
    current,
  );
  req.address = address;
  req.port = port;
  req.localAddress = localAddress;
  req.localPort = localPort;
  req.addressType = addressType;

  ArrayPrototypePush(
    self.autoSelectFamilyAttemptedAddresses,
    `${address}:${port}`,
  );

  if (addressType === 4) {
    err = self._handle.connect(req, address, port);
  } else {
    err = self._handle.connect6(req, address, port);
  }

  if (err) {
    const sockname = self._getsockname();
    let details;

    if (sockname) {
      details = sockname.address + ":" + sockname.port;
    }

    const ex = exceptionWithHostPort(err, "connect", address, port, details);
    ArrayPrototypePush(context.errors, ex);

    self.emit("connectionAttemptFailed", address, port, addressType, ex);
    _internalConnectMultiple(context);
    return;
  }

  if (current < context.addresses.length - 1) {
    debug(
      "connect/multiple: setting the attempt timeout to %d ms",
      context.timeout,
    );

    // If the attempt has not returned an error, start the connection timer
    context[kTimeout] = setTimeout(
      _internalConnectMultipleTimeout,
      context.timeout,
      context,
      req,
      self._handle,
    );
  }
}

// Provide a better error message when we call end() as a result
// of the other side sending a FIN.  The standard "write after end"
// is overly vague, and makes it seem like the user's code is to blame.
function _writeAfterFIN(
  this: Socket,
  // deno-lint-ignore no-explicit-any
  chunk: any,
  encoding?:
    | BufferEncoding
    | null
    | ((error: Error | null | undefined) => void),
  cb?: (error: Error | null | undefined) => void,
): boolean {
  if (!this.writableEnded) {
    return Duplex.prototype.write.call(
      this,
      chunk,
      encoding as BufferEncoding | null,
      // @ts-expect-error Using `call` seem to be interfering with the overload for write
      cb,
    );
  }

  if (typeof encoding === "function") {
    cb = encoding;
    encoding = null;
  }

  const err = genericNodeError(
    "This socket has been ended by the other party",
    { code: "EPIPE" },
  );

  if (typeof cb === "function") {
    defaultTriggerAsyncIdScope(this[asyncIdSymbol], nextTick, cb, err);
  }

  if (this._server) {
    nextTick(() => this.destroy(err));
  } else {
    this.destroy(err);
  }

  return false;
}

function _tryReadStart(socket: Socket) {
  // Not already reading, start the flow.
  debug("Socket._handle.readStart");
  socket._handle!.reading = true;
  const err = socket._handle!.readStart();

  if (err) {
    socket.destroy(errnoException(err, "read"));
  }
}

// Called when the "end" event is emitted.
function _onReadableStreamEnd(this: Socket) {
  if (!this.allowHalfOpen) {
    this.write = _writeAfterFIN;
  }
}

// Called when creating new Socket, or when re-using a closed Socket
function _initSocketHandle(socket: Socket) {
  socket._undestroy();
  socket._sockname = undefined;

  // Handle creation may be deferred to bind() or connect() time.
  if (socket._handle) {
    // deno-lint-ignore no-explicit-any
    (socket._handle as any)[ownerSymbol] = socket;
    socket._handle.onread = onStreamRead;
    socket[asyncIdSymbol] = _getNewAsyncId(socket._handle);

    let userBuf = socket[kBuffer];

    if (userBuf) {
      const bufGen = socket[kBufferGen];

      if (bufGen !== null) {
        userBuf = bufGen();

        if (!isUint8Array(userBuf)) {
          return;
        }

        socket[kBuffer] = userBuf;
      }

      socket._handle.useUserBuffer(userBuf);
    }
  }
}

function _lookupAndConnect(
  self: Socket,
  options: TcpSocketConnectOptions,
) {
  const { localAddress, localPort } = options;
  const host = options.host || "localhost";
  let { port, autoSelectFamilyAttemptTimeout, autoSelectFamily } = options;

  if (localAddress && !isIP(localAddress)) {
    throw new ERR_INVALID_IP_ADDRESS(localAddress);
  }

  if (localPort) {
    validateNumber(localPort, "options.localPort");
  }

  if (typeof port !== "undefined") {
    if (typeof port !== "number" && typeof port !== "string") {
      throw new ERR_INVALID_ARG_TYPE(
        "options.port",
        ["number", "string"],
        port,
      );
    }

    validatePort(port);
  }

  port |= 0;

  if (autoSelectFamily != null) {
    validateBoolean(autoSelectFamily, "options.autoSelectFamily");
  } else {
    autoSelectFamily = autoSelectFamilyDefault;
  }

  if (autoSelectFamilyAttemptTimeout !== undefined) {
    validateInt32(autoSelectFamilyAttemptTimeout);

    if (autoSelectFamilyAttemptTimeout < 10) {
      autoSelectFamilyAttemptTimeout = 10;
    }
  } else {
    autoSelectFamilyAttemptTimeout = autoSelectFamilyAttemptTimeoutDefault;
  }

  // If host is an IP, skip performing a lookup
  const addressType = isIP(host);
  if (addressType) {
    defaultTriggerAsyncIdScope(self[asyncIdSymbol], nextTick, () => {
      if (self.connecting) {
        defaultTriggerAsyncIdScope(
          self[asyncIdSymbol],
          _internalConnect,
          self,
          host,
          port,
          addressType,
          localAddress,
          localPort,
        );
      }
    });

    return;
  }

  if (options.lookup !== undefined) {
    validateFunction(options.lookup, "options.lookup");
  }

  const dnsOpts = {
    family: options.family,
    hints: options.hints || 0,
    all: false,
  };

  if (
    !isWindows &&
    dnsOpts.family !== 4 &&
    dnsOpts.family !== 6 &&
    dnsOpts.hints === 0
  ) {
    dnsOpts.hints = ADDRCONFIG;
  }

  debug("connect: find host", host);
  debug("connect: dns options", dnsOpts);
  self._host = host;
  const lookup = options.lookup || dnsLookup;

  if (
    dnsOpts.family !== 4 && dnsOpts.family !== 6 && !localAddress &&
    autoSelectFamily
  ) {
    debug("connect: autodetecting");

    dnsOpts.all = true;
    defaultTriggerAsyncIdScope(self[asyncIdSymbol], function () {
      _lookupAndConnectMultiple(
        self,
        asyncIdSymbol,
        lookup,
        host,
        options,
        dnsOpts,
        port,
        localAddress,
        localPort,
        autoSelectFamilyAttemptTimeout,
      );
    });

    return;
  }

  defaultTriggerAsyncIdScope(self[asyncIdSymbol], function () {
    lookup(
      host,
      dnsOpts,
      function emitLookup(
        err: ErrnoException | null,
        ip: string,
        addressType: number,
      ) {
        self.emit("lookup", err, ip, addressType, host);

        // It's possible we were destroyed while looking this up.
        // XXX it would be great if we could cancel the promise returned by
        // the look up.
        if (!self.connecting) {
          return;
        }

        if (err) {
          // net.createConnection() creates a net.Socket object and immediately
          // calls net.Socket.connect() on it (that's us). There are no event
          // listeners registered yet so defer the error event to the next tick.
          nextTick(_connectErrorNT, self, err);
        } else if (!isIP(ip)) {
          err = new ERR_INVALID_IP_ADDRESS(ip);

          nextTick(_connectErrorNT, self, err);
        } else if (addressType !== 4 && addressType !== 6) {
          err = new ERR_INVALID_ADDRESS_FAMILY(
            `${addressType}`,
            options.host!,
            options.port,
          );

          nextTick(_connectErrorNT, self, err);
        } else {
          self._unrefTimer();

          defaultTriggerAsyncIdScope(
            self[asyncIdSymbol],
            _internalConnect,
            self,
            ip,
            port,
            addressType,
            localAddress,
            localPort,
          );
        }
      },
    );
  });
}

function _lookupAndConnectMultiple(
  self: Socket,
  asyncIdSymbol: number,
  // deno-lint-ignore no-explicit-any
  lookup: any,
  host: string,
  options: TcpSocketConnectOptions,
  dnsopts,
  port: number,
  localAddress: string,
  localPort: number,
  timeout: number | undefined,
) {
  defaultTriggerAsyncIdScope(self[asyncIdSymbol], function emitLookup() {
    lookup(host, dnsopts, function emitLookup(err, addresses) {
      // It's possible we were destroyed while looking this up.
      // XXX it would be great if we could cancel the promise returned by
      // the look up.
      if (!self.connecting) {
        return;
      } else if (err) {
        self.emit("lookup", err, undefined, undefined, host);

        // net.createConnection() creates a net.Socket object and immediately
        // calls net.Socket.connect() on it (that's us). There are no event
        // listeners registered yet so defer the error event to the next tick.
        nextTick(_connectErrorNT, self, err);
        return;
      }

      // Filter addresses by only keeping the one which are either IPv4 or IPV6.
      // The first valid address determines which group has preference on the
      // alternate family sorting which happens later.
      const validAddresses = [[], []];
      const validIps = [[], []];
      let destinations;
      for (let i = 0, l = addresses.length; i < l; i++) {
        const address = addresses[i];
        const { address: ip, family: addressType } = address;
        self.emit("lookup", err, ip, addressType, host);
        // It's possible we were destroyed while looking this up.
        if (!self.connecting) {
          return;
        }
        if (isIP(ip) && (addressType === 4 || addressType === 6)) {
          destinations ||= addressType === 6 ? { 6: 0, 4: 1 } : { 4: 0, 6: 1 };

          const destination = destinations[addressType];

          // Only try an address once
          if (!ArrayPrototypeIncludes(validIps[destination], ip)) {
            ArrayPrototypePush(validAddresses[destination], address);
            ArrayPrototypePush(validIps[destination], ip);
          }
        }
      }

      // When no AAAA or A records are available, fail on the first one
      if (!validAddresses[0].length && !validAddresses[1].length) {
        const { address: firstIp, family: firstAddressType } = addresses[0];

        if (!isIP(firstIp)) {
          err = new ERR_INVALID_IP_ADDRESS(firstIp);
          nextTick(_connectErrorNT, self, err);
        } else if (firstAddressType !== 4 && firstAddressType !== 6) {
          err = new ERR_INVALID_ADDRESS_FAMILY(
            firstAddressType,
            options.host,
            options.port,
          );
          nextTick(_connectErrorNT, self, err);
        }

        return;
      }

      // Sort addresses alternating families
      const toAttempt = [];
      for (
        let i = 0,
          l = MathMax(validAddresses[0].length, validAddresses[1].length);
        i < l;
        i++
      ) {
        if (i in validAddresses[0]) {
          ArrayPrototypePush(toAttempt, validAddresses[0][i]);
        }
        if (i in validAddresses[1]) {
          ArrayPrototypePush(toAttempt, validAddresses[1][i]);
        }
      }

      if (toAttempt.length === 1) {
        debug(
          "connect/multiple: only one address found, switching back to single connection",
        );
        const { address: ip, family: addressType } = toAttempt[0];

        self._unrefTimer();
        defaultTriggerAsyncIdScope(
          self[asyncIdSymbol],
          _internalConnect,
          self,
          ip,
          port,
          addressType,
          localAddress,
          localPort,
        );

        return;
      }

      self.autoSelectFamilyAttemptedAddresses = [];
      debug("connect/multiple: will try the following addresses", toAttempt);

      const context = {
        socket: self,
        addresses: toAttempt,
        current: 0,
        port,
        localPort,
        timeout,
        [kTimeout]: null,
        errors: [],
      };

      self._unrefTimer();
      defaultTriggerAsyncIdScope(
        self[asyncIdSymbol],
        _internalConnectMultiple,
        context,
      );
    });
  });
}

function _afterShutdown(this: ShutdownWrap<TCP>) {
  // deno-lint-ignore no-explicit-any
  const self: any = this.handle[ownerSymbol];

  debug("afterShutdown destroyed=%j", self.destroyed, self._readableState);

  this.callback();
}

function _emitCloseNT(s: Socket | Server) {
  debug("SERVER: emit close");
  s.emit("close");
}

/**
 * This class is an abstraction of a TCP socket or a streaming `IPC` endpoint
 * (uses named pipes on Windows, and Unix domain sockets otherwise). It is also
 * an `EventEmitter`.
 *
 * A `net.Socket` can be created by the user and used directly to interact with
 * a server. For example, it is returned by `createConnection`,
 * so the user can use it to talk to the server.
 *
 * It can also be created by Node.js and passed to the user when a connection
 * is received. For example, it is passed to the listeners of a `"connection"` event emitted on a `Server`, so the user can use
 * it to interact with the client.
 */
export class Socket extends Duplex {
  // Problem with this is that users can supply their own handle, that may not
  // have `handle.getAsyncId()`. In this case an `[asyncIdSymbol]` should
  // probably be supplied by `async_hooks`.
  [asyncIdSymbol] = -1;

  [kHandle]: Handle | null = null;
  [kSetNoDelay] = false;
  [kLastWriteQueueSize] = 0;
  // deno-lint-ignore no-explicit-any
  [kTimeout]: any = null;
  [kBuffer]: Uint8Array | boolean | null = null;
  [kBufferCb]: OnReadOptions["callback"] | null = null;
  [kBufferGen]: (() => Uint8Array) | null = null;

  // Used after `.destroy()`
  [kBytesRead] = 0;
  [kBytesWritten] = 0;

  // Reserved properties
  server = null;
  // deno-lint-ignore no-explicit-any
  _server: any = null;

  _peername?: AddressInfo | Record<string, never>;
  _sockname?: AddressInfo | Record<string, never>;
  _pendingData: Uint8Array | string | null = null;
  _pendingEncoding = "";
  _host: string | null = null;
  // deno-lint-ignore no-explicit-any
  _parent: any = null;
  autoSelectFamilyAttemptedAddresses: AddressInfo[] | undefined = undefined;

  constructor(options: SocketOptions | number) {
    if (typeof options === "number") {
      // Legacy interface.
      options = { fd: options };
    } else {
      options = { ...options };
    }

    // Default to *not* allowing half open sockets.
    options.allowHalfOpen = Boolean(options.allowHalfOpen);
    // For backwards compat do not emit close on destroy.
    options.emitClose = false;
    options.autoDestroy = true;
    // Handle strings directly.
    options.decodeStrings = false;

    super(options);

    if (options.handle) {
      this._handle = options.handle;
      this[asyncIdSymbol] = _getNewAsyncId(this._handle);
    } else if (options.fd !== undefined) {
      // REF: https://github.com/denoland/deno/issues/6529
      notImplemented("net.Socket.prototype.constructor with fd option");
    }

    const onread = options.onread;

    if (
      onread !== null &&
      typeof onread === "object" &&
      (isUint8Array(onread.buffer) || typeof onread.buffer === "function") &&
      typeof onread.callback === "function"
    ) {
      if (typeof onread.buffer === "function") {
        this[kBuffer] = true;
        this[kBufferGen] = onread.buffer;
      } else {
        this[kBuffer] = onread.buffer;
      }

      this[kBufferCb] = onread.callback;
    }

    this.on("end", _onReadableStreamEnd);

    _initSocketHandle(this);

    // If we have a handle, then start the flow of data into the
    // buffer. If not, then this will happen when we connect.
    if (this._handle && options.readable !== false) {
      if (options.pauseOnCreate) {
        // Stop the handle from reading and pause the stream
        this._handle.reading = false;
        this._handle.readStop();
        // @ts-expect-error This property shouldn't be modified
        this.readableFlowing = false;
      } else if (!options.manualStart) {
        this.read(0);
      }
    }
  }

  /**
   * Initiate a connection on a given socket.
   *
   * Possible signatures:
   *
   * - `socket.connect(options[, connectListener])`
   * - `socket.connect(path[, connectListener])` for `IPC` connections.
   * - `socket.connect(port[, host][, connectListener])` for TCP connections.
   * - Returns: `net.Socket` The socket itself.
   *
   * This function is asynchronous. When the connection is established, the `"connect"` event will be emitted. If there is a problem connecting,
   * instead of a `"connect"` event, an `"error"` event will be emitted with
   * the error passed to the `"error"` listener.
   * The last parameter `connectListener`, if supplied, will be added as a listener
   * for the `"connect"` event **once**.
   *
   * This function should only be used for reconnecting a socket after `"close"` has been emitted or otherwise it may lead to undefined
   * behavior.
   */
  connect(
    options: SocketConnectOptions | NormalizedArgs,
    connectionListener?: ConnectionListener,
  ): this;
  connect(
    port: number,
    host: string,
    connectionListener?: ConnectionListener,
  ): this;
  connect(port: number, connectionListener?: ConnectionListener): this;
  connect(path: string, connectionListener?: ConnectionListener): this;
  connect(...args: unknown[]): this {
    let normalized: NormalizedArgs;

    // If passed an array, it's treated as an array of arguments that have
    // already been normalized (so we don't normalize more than once). This has
    // been solved before in https://github.com/nodejs/node/pull/12342, but was
    // reverted as it had unintended side effects.
    if (
      Array.isArray(args[0]) &&
      (args[0] as unknown as NormalizedArgs)[normalizedArgsSymbol]
    ) {
      normalized = args[0] as unknown as NormalizedArgs;
    } else {
      normalized = _normalizeArgs(args);
    }

    const options = normalized[0];
    const cb = normalized[1];

    // `options.port === null` will be checked later.
    if (
      (options as TcpSocketConnectOptions).port === undefined &&
      (options as IpcSocketConnectOptions).path == null
    ) {
      throw new ERR_MISSING_ARGS(["options", "port", "path"]);
    }

    if (this.write !== Socket.prototype.write) {
      this.write = Socket.prototype.write;
    }

    if (this.destroyed) {
      this._handle = null;
      this._peername = undefined;
      this._sockname = undefined;
    }

    const { path } = options as IpcNetConnectOptions;
    const pipe = _isPipe(options);
    debug("pipe", pipe, path);

    if (!this._handle) {
      this._handle = pipe
        ? new Pipe(PipeConstants.SOCKET)
        : new TCP(TCPConstants.SOCKET);

      _initSocketHandle(this);
    }

    if (cb !== null) {
      this.once("connect", cb);
    }

    this._unrefTimer();

    this.connecting = true;

    if (pipe) {
      validateString(path, "options.path");
      defaultTriggerAsyncIdScope(
        this[asyncIdSymbol],
        _internalConnect,
        this,
        path,
      );
    } else {
      _lookupAndConnect(this, options as TcpSocketConnectOptions);
    }

    return this;
  }

  /**
   * Pauses the reading of data. That is, `"data"` events will not be emitted.
   * Useful to throttle back an upload.
   *
   * @return The socket itself.
   */
  override pause(): this {
    if (
      !this.connecting &&
      this._handle &&
      this._handle.reading
    ) {
      this._handle.reading = false;

      if (!this.destroyed) {
        const err = this._handle.readStop();

        if (err) {
          this.destroy(errnoException(err, "read"));
        }
      }
    }

    return Duplex.prototype.pause.call(this) as unknown as this;
  }

  /**
   * Resumes reading after a call to `socket.pause()`.
   *
   * @return The socket itself.
   */
  override resume(): this {
    if (
      this[kBuffer] &&
      !this.connecting &&
      this._handle &&
      !this._handle.reading
    ) {
      _tryReadStart(this);
    }

    return Duplex.prototype.resume.call(this) as this;
  }

  /**
   * Sets the socket to timeout after `timeout` milliseconds of inactivity on
   * the socket. By default `net.Socket` do not have a timeout.
   *
   * When an idle timeout is triggered the socket will receive a `"timeout"` event but the connection will not be severed. The user must manually call `socket.end()` or `socket.destroy()` to
   * end the connection.
   *
   * If `timeout` is `0`, then the existing idle timeout is disabled.
   *
   * The optional `callback` parameter will be added as a one-time listener for the `"timeout"` event.
   * @return The socket itself.
   */
  setTimeout = setStreamTimeout;

  /**
   * Enable/disable the use of Nagle's algorithm.
   *
   * When a TCP connection is created, it will have Nagle's algorithm enabled.
   *
   * Nagle's algorithm delays data before it is sent via the network. It attempts
   * to optimize throughput at the expense of latency.
   *
   * Passing `true` for `noDelay` or not passing an argument will disable Nagle's
   * algorithm for the socket. Passing `false` for `noDelay` will enable Nagle's
   * algorithm.
   *
   * @param noDelay
   * @return The socket itself.
   */
  setNoDelay(noDelay?: boolean): this {
    if (!this._handle) {
      this.once(
        "connect",
        noDelay ? this.setNoDelay : () => this.setNoDelay(noDelay),
      );

      return this;
    }

    // Backwards compatibility: assume true when `noDelay` is omitted
    const newValue = noDelay === undefined ? true : !!noDelay;

    if (
      "setNoDelay" in this._handle &&
      this._handle.setNoDelay &&
      newValue !== this[kSetNoDelay]
    ) {
      this[kSetNoDelay] = newValue;
      this._handle.setNoDelay(newValue);
    }

    return this;
  }

  /**
   * Enable/disable keep-alive functionality, and optionally set the initial
   * delay before the first keepalive probe is sent on an idle socket.
   *
   * Set `initialDelay` (in milliseconds) to set the delay between the last
   * data packet received and the first keepalive probe. Setting `0` for`initialDelay` will leave the value unchanged from the default
   * (or previous) setting.
   *
   * Enabling the keep-alive functionality will set the following socket options:
   *
   * - `SO_KEEPALIVE=1`
   * - `TCP_KEEPIDLE=initialDelay`
   * - `TCP_KEEPCNT=10`
   * - `TCP_KEEPINTVL=1`
   *
   * @param enable
   * @param initialDelay
   * @return The socket itself.
   */
  setKeepAlive(enable: boolean, initialDelay?: number): this {
    if (!this._handle) {
      this.once("connect", () => this.setKeepAlive(enable, initialDelay));

      return this;
    }

    if ("setKeepAlive" in this._handle) {
      this._handle.setKeepAlive(enable, ~~(initialDelay! / 1000));
    }

    return this;
  }

  /**
   * Returns the bound `address`, the address `family` name and `port` of the
   * socket as reported by the operating system:`{ port: 12346, family: "IPv4", address: "127.0.0.1" }`
   */
  address(): AddressInfo | Record<string, never> {
    return this._getsockname();
  }

  /**
   * Calling `unref()` on a socket will allow the program to exit if this is the only
   * active socket in the event system. If the socket is already `unref`ed calling`unref()` again will have no effect.
   *
   * @return The socket itself.
   */
  unref(): this {
    if (!this._handle) {
      this.once("connect", this.unref);

      return this;
    }

    if (typeof this._handle.unref === "function") {
      this._handle.unref();
    }

    return this;
  }

  /**
   * Opposite of `unref()`, calling `ref()` on a previously `unref`ed socket will_not_ let the program exit if it's the only socket left (the default behavior).
   * If the socket is `ref`ed calling `ref` again will have no effect.
   *
   * @return The socket itself.
   */
  ref(): this {
    if (!this._handle) {
      this.once("connect", this.ref);

      return this;
    }

    if (typeof this._handle.ref === "function") {
      this._handle.ref();
    }

    return this;
  }

  /**
   * This property shows the number of characters buffered for writing. The buffer
   * may contain strings whose length after encoding is not yet known. So this number
   * is only an approximation of the number of bytes in the buffer.
   *
   * `net.Socket` has the property that `socket.write()` always works. This is to
   * help users get up and running quickly. The computer cannot always keep up
   * with the amount of data that is written to a socket. The network connection
   * simply might be too slow. Node.js will internally queue up the data written to a
   * socket and send it out over the wire when it is possible.
   *
   * The consequence of this internal buffering is that memory may grow.
   * Users who experience large or growing `bufferSize` should attempt to
   * "throttle" the data flows in their program with `socket.pause()` and `socket.resume()`.
   *
   * @deprecated Use `writableLength` instead.
   */
  get bufferSize(): number {
    if (this._handle) {
      return this.writableLength;
    }

    return 0;
  }

  /**
   * The amount of received bytes.
   */
  get bytesRead(): number {
    return this._handle ? this._handle.bytesRead : this[kBytesRead];
  }

  /**
   * The amount of bytes sent.
   */
  get bytesWritten(): number | undefined {
    let bytes = this._bytesDispatched;
    const data = this._pendingData;
    const encoding = this._pendingEncoding;
    const writableBuffer = this.writableBuffer;

    if (!writableBuffer) {
      return undefined;
    }

    for (const el of writableBuffer) {
      bytes += el!.chunk instanceof Buffer
        ? el!.chunk.length
        : Buffer.byteLength(el!.chunk, el!.encoding);
    }

    if (Array.isArray(data)) {
      // Was a writev, iterate over chunks to get total length
      for (let i = 0; i < data.length; i++) {
        const chunk = data[i];

        // deno-lint-ignore no-explicit-any
        if ((data as any).allBuffers || chunk instanceof Buffer) {
          bytes += chunk.length;
        } else {
          bytes += Buffer.byteLength(chunk.chunk, chunk.encoding);
        }
      }
    } else if (data) {
      // Writes are either a string or a Buffer.
      if (typeof data !== "string") {
        bytes += (data as Buffer).length;
      } else {
        bytes += Buffer.byteLength(data, encoding);
      }
    }

    return bytes;
  }

  /**
   * If `true`,`socket.connect(options[, connectListener])` was
   * called and has not yet finished. It will stay `true` until the socket becomes
   * connected, then it is set to `false` and the `"connect"` event is emitted. Note
   * that the `socket.connect(options[, connectListener])` callback is a listener for the `"connect"` event.
   */
  connecting = false;

  /**
   * The string representation of the local IP address the remote client is
   * connecting on. For example, in a server listening on `"0.0.0.0"`, if a client
   * connects on `"192.168.1.1"`, the value of `socket.localAddress` would be`"192.168.1.1"`.
   */
  get localAddress(): string {
    return this._getsockname().address;
  }

  /**
   * The numeric representation of the local port. For example, `80` or `21`.
   */
  get localPort(): number {
    return this._getsockname().port;
  }

  /**
   * The string representation of the local IP family. `"IPv4"` or `"IPv6"`.
   */
  get localFamily(): string | undefined {
    return this._getsockname().family;
  }

  /**
   * The string representation of the remote IP address. For example,`"74.125.127.100"` or `"2001:4860:a005::68"`. Value may be `undefined` if
   * the socket is destroyed (for example, if the client disconnected).
   */
  get remoteAddress(): string | undefined {
    return this._getpeername().address;
  }

  /**
   * The string representation of the remote IP family. `"IPv4"` or `"IPv6"`.
   */
  get remoteFamily(): string | undefined {
    const { family } = this._getpeername();

    return family ? `IPv${family}` : family;
  }

  /**
   * The numeric representation of the remote port. For example, `80` or `21`.
   */
  get remotePort(): number | undefined {
    return this._getpeername().port;
  }

  get pending(): boolean {
    return !this._handle || this.connecting;
  }

  get readyState(): string {
    if (this.connecting) {
      return "opening";
    } else if (this.readable && this.writable) {
      return "open";
    } else if (this.readable && !this.writable) {
      return "readOnly";
    } else if (!this.readable && this.writable) {
      return "writeOnly";
    }
    return "closed";
  }

  /**
   * Half-closes the socket. i.e., it sends a FIN packet. It is possible the
   * server will still send some data.
   *
   * See `writable.end()` for further details.
   *
   * @param encoding Only used when data is `string`.
   * @param cb Optional callback for when the socket is finished.
   * @return The socket itself.
   */
  override end(cb?: () => void): this;
  override end(buffer: Uint8Array | string, cb?: () => void): this;
  override end(
    data: Uint8Array | string,
    encoding?: Encodings,
    cb?: () => void,
  ): this;
  override end(
    data?: Uint8Array | string | (() => void),
    encoding?: Encodings | (() => void),
    cb?: () => void,
  ): this {
    Duplex.prototype.end.call(this, data, encoding as Encodings, cb);
    DTRACE_NET_STREAM_END(this);

    return this;
  }

  /**
   * @param size Optional argument to specify how much data to read.
   */
  override read(
    size?: number,
  ): string | Uint8Array | Buffer | null | undefined {
    if (
      this[kBuffer] &&
      !this.connecting &&
      this._handle &&
      !this._handle.reading
    ) {
      _tryReadStart(this);
    }

    return Duplex.prototype.read.call(this, size);
  }

  destroySoon() {
    if (this.writable) {
      this.end();
    }

    if (this.writableFinished) {
      this.destroy();
    } else {
      this.once("finish", this.destroy);
    }
  }

  _unrefTimer() {
    // deno-lint-ignore no-this-alias
    for (let s = this; s !== null; s = s._parent) {
      if (s[kTimeout]) {
        s[kTimeout].refresh();
      }
    }
  }

  // The user has called .end(), and all the bytes have been
  // sent out to the other side.
  // deno-lint-ignore no-explicit-any
  override _final(cb: any): any {
    // If still connecting - defer handling `_final` until 'connect' will happen
    if (this.pending) {
      debug("_final: not yet connected");
      return this.once("connect", () => this._final(cb));
    }

    if (!this._handle) {
      return cb();
    }

    debug("_final: not ended, call shutdown()");

    const req = new ShutdownWrap<Handle>();
    req.oncomplete = _afterShutdown;
    req.handle = this._handle;
    req.callback = cb;
    const err = this._handle.shutdown(req);

    if (err === 1 || err === codeMap.get("ENOTCONN")) {
      // synchronous finish
      return cb();
    } else if (err !== 0) {
      return cb(errnoException(err, "shutdown"));
    }
  }

  _onTimeout() {
    const handle = this._handle;
    const lastWriteQueueSize = this[kLastWriteQueueSize];

    if (lastWriteQueueSize > 0 && handle) {
      // `lastWriteQueueSize !== writeQueueSize` means there is
      // an active write in progress, so we suppress the timeout.
      const { writeQueueSize } = handle;

      if (lastWriteQueueSize !== writeQueueSize) {
        this[kLastWriteQueueSize] = writeQueueSize;
        this._unrefTimer();

        return;
      }
    }

    debug("_onTimeout");
    this.emit("timeout");
  }

  override _read(size?: number) {
    debug("_read");
    if (this.connecting || !this._handle) {
      debug("_read wait for connection");
      this.once("connect", () => this._read(size));
    } else if (!this._handle.reading) {
      _tryReadStart(this);
    }
  }

  override _destroy(exception: Error | null, cb: (err: Error | null) => void) {
    debug("destroy");
    this.connecting = false;

    // deno-lint-ignore no-this-alias
    for (let s = this; s !== null; s = s._parent) {
      clearTimeout(s[kTimeout]);
    }

    debug("close");
    if (this._handle) {
      debug("close handle");
      const isException = exception ? true : false;
      // `bytesRead` and `kBytesWritten` should be accessible after `.destroy()`
      this[kBytesRead] = this._handle.bytesRead;
      this[kBytesWritten] = this._handle.bytesWritten;

      this._handle.close(() => {
        this._handle!.onread = _noop;
        this._handle = null;
        this._sockname = undefined;

        debug("emit close");
        this.emit("close", isException);
      });
      cb(exception);
    } else {
      cb(exception);
      nextTick(_emitCloseNT, this);
    }

    if (this._server) {
      debug("has server");
      this._server._connections--;

      if (this._server._emitCloseIfDrained) {
        this._server._emitCloseIfDrained();
      }
    }
  }

  _getpeername(): AddressInfo | Record<string, never> {
    if (!this._handle || !("getpeername" in this._handle) || this.connecting) {
      return this._peername || {};
    } else if (!this._peername) {
      this._peername = {};
      this._handle.getpeername(this._peername);
    }

    return this._peername;
  }

  _getsockname(): AddressInfo | Record<string, never> {
    if (!this._handle || !("getsockname" in this._handle)) {
      return {};
    } else if (!this._sockname) {
      this._sockname = {};
      this._handle.getsockname(this._sockname);
    }

    return this._sockname;
  }

  _writeGeneric(
    writev: boolean,
    // deno-lint-ignore no-explicit-any
    data: any,
    encoding: string,
    cb: (error?: Error | null) => void,
  ) {
    // If we are still connecting, then buffer this for later.
    // The Writable logic will buffer up any more writes while
    // waiting for this one to be done.
    if (this.connecting) {
      this._pendingData = data;
      this._pendingEncoding = encoding;
      this.once("connect", function connect(this: Socket) {
        this._writeGeneric(writev, data, encoding, cb);
      });

      return;
    }

    this._pendingData = null;
    this._pendingEncoding = "";

    if (!this._handle) {
      cb(new ERR_SOCKET_CLOSED());

      return false;
    }

    this._unrefTimer();

    let req;

    if (writev) {
      req = writevGeneric(this, data, cb);
    } else {
      req = writeGeneric(this, data, encoding, cb);
    }
    if (req.async) {
      this[kLastWriteQueueSize] = req.bytes;
    }
  }

  // @ts-ignore Duplex defining as a property when want a method.
  _writev(
    // deno-lint-ignore no-explicit-any
    chunks: Array<{ chunk: any; encoding: string }>,
    cb: (error?: Error | null) => void,
  ) {
    this._writeGeneric(true, chunks, "", cb);
  }

  override _write(
    // deno-lint-ignore no-explicit-any
    data: any,
    encoding: string,
    cb: (error?: Error | null) => void,
  ) {
    this._writeGeneric(false, data, encoding, cb);
  }

  [kAfterAsyncWrite]() {
    this[kLastWriteQueueSize] = 0;
  }

  get [kUpdateTimer]() {
    return this._unrefTimer;
  }

  get _connecting(): boolean {
    return this.connecting;
  }

  // Legacy alias. Having this is probably being overly cautious, but it doesn't
  // really hurt anyone either. This can probably be removed safely if desired.
  get _bytesDispatched(): number {
    return this._handle ? this._handle.bytesWritten : this[kBytesWritten];
  }

  get _handle(): Handle | null {
    return this[kHandle];
  }

  set _handle(v: Handle | null) {
    this[kHandle] = v;
  }

  // deno-lint-ignore no-explicit-any
  [kReinitializeHandle](handle: any) {
    this._handle?.close();

    this._handle = handle;
    this._handle[ownerSymbol] = this;

    _initSocketHandle(this);
  }
}

export const Stream = Socket;

// Target API:
//
// let s = net.connect({port: 80, host: 'google.com'}, function() {
//   ...
// });
//
// There are various forms:
//
// connect(options, [cb])
// connect(port, [host], [cb])
// connect(path, [cb]);
//
export function connect(
  options: NetConnectOptions,
  connectionListener?: () => void,
): Socket;
export function connect(
  port: number,
  host?: string,
  connectionListener?: () => void,
): Socket;
export function connect(path: string, connectionListener?: () => void): Socket;
export function connect(...args: unknown[]) {
  const normalized = _normalizeArgs(args);
  const options = normalized[0] as Partial<NetConnectOptions>;
  debug("createConnection", normalized);
  const socket = new Socket(options);

  if (netClientSocketChannel.hasSubscribers) {
    netClientSocketChannel.publish({
      socket,
    });
  }

  if (options.timeout) {
    socket.setTimeout(options.timeout);
  }

  return socket.connect(normalized);
}

export const createConnection = connect;

/** https://docs.deno.com/api/node/net/#namespace_getdefaultautoselectfamily */
export function getDefaultAutoSelectFamily() {
  return autoSelectFamilyDefault;
}

/** https://docs.deno.com/api/node/net/#namespace_setdefaultautoselectfamily */
export function setDefaultAutoSelectFamily(value: boolean) {
  validateBoolean(value, "value");
  autoSelectFamilyDefault = value;
}

/** https://docs.deno.com/api/node/net/#namespace_getdefaultautoselectfamilyattempttimeout */
export function getDefaultAutoSelectFamilyAttemptTimeout() {
  return autoSelectFamilyAttemptTimeoutDefault;
}

/** https://docs.deno.com/api/node/net/#namespace_setdefaultautoselectfamilyattempttimeout */
export function setDefaultAutoSelectFamilyAttemptTimeout(value: number) {
  validateInt32(value, "value", 1);

  if (value < 10) {
    value = 10;
  }

  autoSelectFamilyAttemptTimeoutDefault = value;
}

export interface ListenOptions extends Abortable {
  fd?: number;
  port?: number | undefined;
  host?: string | undefined;
  backlog?: number | undefined;
  path?: string | undefined;
  exclusive?: boolean | undefined;
  readableAll?: boolean | undefined;
  writableAll?: boolean | undefined;
  /**
   * Default: `false`
   */
  ipv6Only?: boolean | undefined;
}

type ConnectionListener = (socket: Socket) => void;

interface ServerOptions {
  /**
   * Indicates whether half-opened TCP connections are allowed.
   * Default: false
   */
  allowHalfOpen?: boolean | undefined;
  /**
   * Indicates whether the socket should be paused on incoming connections.
   * Default: false
   */
  pauseOnConnect?: boolean | undefined;
}

function _isServerSocketOptions(
  options: unknown,
): options is null | undefined | ServerOptions {
  return (
    options === null ||
    typeof options === "undefined" ||
    typeof options === "object"
  );
}

function _isConnectionListener(
  connectionListener: unknown,
): connectionListener is ConnectionListener {
  return typeof connectionListener === "function";
}

function _getFlags(ipv6Only?: boolean): number {
  return ipv6Only === true ? TCPConstants.UV_TCP_IPV6ONLY : 0;
}

function _listenInCluster(
  server: Server,
  address: string | null,
  port: number | null,
  addressType: number | null,
  backlog: number,
  fd?: number | null,
  exclusive?: boolean,
  flags?: number,
) {
  exclusive = !!exclusive;

  // TODO(cmorten): here we deviate somewhat from the Node implementation which
  // makes use of the https://nodejs.org/api/cluster.html module to run servers
  // across a "cluster" of Node processes to take advantage of multi-core
  // systems.
  //
  // Though Deno has has a Worker capability from which we could simulate this,
  // for now we assert that we are _always_ on the primary process.
  const isPrimary = true;

  if (isPrimary || exclusive) {
    // Will create a new handle
    // _listen2 sets up the listened handle, it is still named like this
    // to avoid breaking code that wraps this method
    server._listen2(address, port, addressType, backlog, fd, flags);

    return;
  }
}

function _lookupAndListen(
  server: Server,
  port: number,
  address: string,
  backlog: number,
  exclusive: boolean,
  flags: number,
) {
  dnsLookup(address, function doListen(err, ip, addressType) {
    if (err) {
      server.emit("error", err);
    } else {
      addressType = ip ? addressType : 4;

      _listenInCluster(
        server,
        ip,
        port,
        addressType,
        backlog,
        null,
        exclusive,
        flags,
      );
    }
  });
}

function _addAbortSignalOption(server: Server, options: ListenOptions) {
  if (options?.signal === undefined) {
    return;
  }

  validateAbortSignal(options.signal, "options.signal");

  const { signal } = options;

  const onAborted = () => {
    server.close();
  };

  if (signal.aborted) {
    nextTick(onAborted);
  } else {
    signal.addEventListener("abort", onAborted);
    server.once("close", () => signal.removeEventListener("abort", onAborted));
  }
}

// Returns handle if it can be created, or error code if it can't
export function _createServerHandle(
  address: string | null,
  port: number | null,
  addressType: number | null,
  fd?: number | null,
  flags?: number,
): Handle | number {
  let err = 0;
  // Assign handle in listen, and clean up if bind or listen fails
  let handle;
  let isTCP = false;

  if (typeof fd === "number" && fd >= 0) {
    try {
      handle = _createHandle(fd, true);
    } catch (e) {
      // Not a fd we can listen on. This will trigger an error.
      debug("listen invalid fd=%d:", fd, (e as Error).message);

      return codeMap.get("EINVAL")!;
    }

    err = handle.open(fd);

    if (err) {
      return err;
    }

    assert(!address && !port);
  } else if (port === -1 && addressType === -1) {
    handle = new Pipe(PipeConstants.SERVER);

    if (isWindows) {
      const instances = Number.parseInt(
        Deno.env.get("NODE_PENDING_PIPE_INSTANCES") ?? "",
      );

      if (!Number.isNaN(instances)) {
        handle.setPendingInstances!(instances);
      }
    }
  } else {
    handle = new TCP(TCPConstants.SERVER);
    isTCP = true;
  }

  if (address || port || isTCP) {
    debug("bind to", address || "any");

    if (!address) {
      // TODO(@bartlomieju): differs from Node which tries to bind to IPv6 first when no
      // address is provided.
      //
      // Forcing IPv4 as a workaround for Deno not aligning with Node on
      // implicit binding on Windows.
      //
      // REF: https://github.com/denoland/deno/issues/10762

      // Try binding to ipv6 first
      // err = (handle as TCP).bind6(DEFAULT_IPV6_ADDR, port ?? 0, flags ?? 0);

      // if (err) {
      //   handle.close();

      // Fallback to ipv4
      return _createServerHandle(DEFAULT_IPV4_ADDR, port, 4, null, flags);
      // }
    } else if (addressType === 6) {
      err = (handle as TCP).bind6(address, port ?? 0, flags ?? 0);
    } else {
      err = (handle as TCP).bind(address, port ?? 0);
    }
  }

  if (err) {
    handle.close();

    return err;
  }

  return handle;
}

function _emitErrorNT(server: Server, err: Error) {
  server.emit("error", err);
}

function _emitListeningNT(server: Server) {
  // Ensure handle hasn't closed
  if (server._handle) {
    server.emit("listening");
  }
}

// deno-lint-ignore no-explicit-any
function _onconnection(this: any, err: number, clientHandle?: Handle) {
  // deno-lint-ignore no-this-alias
  const handle = this;
  const self = handle[ownerSymbol];

  debug("onconnection");

  if (err) {
    self.emit("error", errnoException(err, "accept"));

    return;
  }

  if (self.maxConnections && self._connections >= self.maxConnections) {
    clientHandle!.close();

    return;
  }

  const socket = self._createSocket(clientHandle);
  this._connections++;
  self.emit("connection", socket);

  if (netServerSocketChannel.hasSubscribers) {
    netServerSocketChannel.publish({
      socket,
    });
  }
}

function _setupListenHandle(
  this: Server,
  address: string | null,
  port: number | null,
  addressType: number | null,
  backlog: number,
  fd?: number | null,
  flags?: number,
) {
  debug("setupListenHandle", address, port, addressType, backlog, fd);

  // If there is not yet a handle, we need to create one and bind.
  // In the case of a server sent via IPC, we don't need to do this.
  if (this._handle) {
    debug("setupListenHandle: have a handle already");
  } else {
    debug("setupListenHandle: create a handle");

    let rval = null;

    // Try to bind to the unspecified IPv6 address, see if IPv6 is available
    if (!address && typeof fd !== "number") {
      // TODO(@bartlomieju): differs from Node which tries to bind to IPv6 first
      // when no address is provided.
      //
      // Forcing IPv4 as a workaround for Deno not aligning with Node on
      // implicit binding on Windows.
      //
      // REF: https://github.com/denoland/deno/issues/10762
      // rval = _createServerHandle(DEFAULT_IPV6_ADDR, port, 6, fd, flags);

      // if (typeof rval === "number") {
      //   rval = null;
      address = DEFAULT_IPV4_ADDR;
      addressType = 4;
      // } else {
      //   address = DEFAULT_IPV6_ADDR;
      //   addressType = 6;
      // }
    }

    if (rval === null) {
      rval = _createServerHandle(address, port, addressType, fd, flags);
    }

    if (typeof rval === "number") {
      const error = uvExceptionWithHostPort(rval, "listen", address, port);
      nextTick(_emitErrorNT, this, error);

      return;
    }

    this._handle = rval;
  }

  this[asyncIdSymbol] = _getNewAsyncId(this._handle);
  this._handle.onconnection = _onconnection;
  this._handle[ownerSymbol] = this;

  // Use a backlog of 512 entries. We pass 511 to the listen() call because
  // the kernel does: backlogsize = roundup_pow_of_two(backlogsize + 1);
  // which will thus give us a backlog of 512 entries.
  const err = this._handle.listen(backlog || 511);

  if (err) {
    const ex = uvExceptionWithHostPort(err, "listen", address, port);
    this._handle.close();
    this._handle = null;

    defaultTriggerAsyncIdScope(
      this[asyncIdSymbol],
      nextTick,
      _emitErrorNT,
      this,
      ex,
    );

    return;
  }

  // Generate connection key, this should be unique to the connection
  this._connectionKey = addressType + ":" + address + ":" + port;

  // Unref the handle if the server was unref'ed prior to listening
  if (this._unref) {
    this.unref();
  }

  defaultTriggerAsyncIdScope(
    this[asyncIdSymbol],
    nextTick,
    _emitListeningNT,
    this,
  );
}

/** This class is used to create a TCP or IPC server. */
export class Server extends EventEmitter {
  [asyncIdSymbol] = -1;

  allowHalfOpen = false;
  pauseOnConnect = false;

  // deno-lint-ignore no-explicit-any
  _handle: any = null;
  _connections = 0;
  _usingWorkers = false;
  // deno-lint-ignore no-explicit-any
  _workers: any[] = [];
  _unref = false;
  _pipeName?: string;
  _connectionKey?: string;

  /**
   * `net.Server` is an `EventEmitter` with the following events:
   *
   * - `"close"` - Emitted when the server closes. If connections exist, this
   * event is not emitted until all connections are ended.
   * - `"connection"` - Emitted when a new connection is made. `socket` is an
   * instance of `net.Socket`.
   * - `"error"` - Emitted when an error occurs. Unlike `net.Socket`, the
   * `"close"` event will not be emitted directly following this event unless
   * `server.close()` is manually called. See the example in discussion of
   * `server.listen()`.
   * - `"listening"` - Emitted when the server has been bound after calling
   * `server.listen()`.
   */
  constructor(connectionListener?: ConnectionListener);
  constructor(options?: ServerOptions, connectionListener?: ConnectionListener);
  constructor(
    options?: ServerOptions | ConnectionListener,
    connectionListener?: ConnectionListener,
  ) {
    super();

    if (_isConnectionListener(options)) {
      this.on("connection", options);
    } else if (_isServerSocketOptions(options)) {
      this.allowHalfOpen = options?.allowHalfOpen || false;
      this.pauseOnConnect = !!options?.pauseOnConnect;

      if (_isConnectionListener(connectionListener)) {
        this.on("connection", connectionListener);
      }
    } else {
      throw new ERR_INVALID_ARG_TYPE("options", "Object", options);
    }
  }

  /**
   * Start a server listening for connections. A `net.Server` can be a TCP or
   * an `IPC` server depending on what it listens to.
   *
   * Possible signatures:
   *
   * - `server.listen(handle[, backlog][, callback])`
   * - `server.listen(options[, callback])`
   * - `server.listen(path[, backlog][, callback])` for `IPC` servers
   * - `server.listen([port[, host[, backlog]]][, callback])` for TCP servers
   *
   * This function is asynchronous. When the server starts listening, the `'listening'` event will be emitted. The last parameter `callback`will be added as a listener for the `'listening'`
   * event.
   *
   * All `listen()` methods can take a `backlog` parameter to specify the maximum
   * length of the queue of pending connections. The actual length will be determined
   * by the OS through sysctl settings such as `tcp_max_syn_backlog` and `somaxconn` on Linux. The default value of this parameter is 511 (not 512).
   *
   * All `Socket` are set to `SO_REUSEADDR` (see [`socket(7)`](https://man7.org/linux/man-pages/man7/socket.7.html) for
   * details).
   *
   * The `server.listen()` method can be called again if and only if there was an
   * error during the first `server.listen()` call or `server.close()` has been
   * called. Otherwise, an `ERR_SERVER_ALREADY_LISTEN` error will be thrown.
   *
   * One of the most common errors raised when listening is `EADDRINUSE`.
   * This happens when another server is already listening on the requested`port`/`path`/`handle`. One way to handle this would be to retry
   * after a certain amount of time:
   */
  listen(
    port?: number,
    hostname?: string,
    backlog?: number,
    listeningListener?: () => void,
  ): this;
  listen(
    port?: number,
    hostname?: string,
    listeningListener?: () => void,
  ): this;
  listen(port?: number, backlog?: number, listeningListener?: () => void): this;
  listen(port?: number, listeningListener?: () => void): this;
  listen(path: string, backlog?: number, listeningListener?: () => void): this;
  listen(path: string, listeningListener?: () => void): this;
  listen(options: ListenOptions, listeningListener?: () => void): this;
  // deno-lint-ignore no-explicit-any
  listen(handle: any, backlog?: number, listeningListener?: () => void): this;
  // deno-lint-ignore no-explicit-any
  listen(handle: any, listeningListener?: () => void): this;
  listen(...args: unknown[]): this {
    const normalized = _normalizeArgs(args);
    let options = normalized[0] as Partial<ListenOptions>;
    const cb = normalized[1];

    if (this._handle) {
      throw new ERR_SERVER_ALREADY_LISTEN();
    }

    if (cb !== null) {
      this.once("listening", cb);
    }

    const backlogFromArgs: number =
      // (handle, backlog) or (path, backlog) or (port, backlog)
      _toNumber(args.length > 1 && args[1]) ||
      (_toNumber(args.length > 2 && args[2]) as number); // (port, host, backlog)

    // deno-lint-ignore no-explicit-any
    options = (options as any)._handle || (options as any).handle || options;
    const flags = _getFlags(options.ipv6Only);

    // (handle[, backlog][, cb]) where handle is an object with a handle
    if (options instanceof TCP) {
      this._handle = options;
      this[asyncIdSymbol] = this._handle.getAsyncId();

      _listenInCluster(this, null, -1, -1, backlogFromArgs);

      return this;
    }

    _addAbortSignalOption(this, options);

    // (handle[, backlog][, cb]) where handle is an object with a fd
    if (typeof options.fd === "number" && options.fd >= 0) {
      _listenInCluster(this, null, null, null, backlogFromArgs, options.fd);

      return this;
    }

    // ([port][, host][, backlog][, cb]) where port is omitted,
    // that is, listen(), listen(null), listen(cb), or listen(null, cb)
    // or (options[, cb]) where options.port is explicitly set as undefined or
    // null, bind to an arbitrary unused port
    if (
      args.length === 0 ||
      typeof args[0] === "function" ||
      (typeof options.port === "undefined" && "port" in options) ||
      options.port === null
    ) {
      options.port = 0;
    }

    // ([port][, host][, backlog][, cb]) where port is specified
    // or (options[, cb]) where options.port is specified
    // or if options.port is normalized as 0 before
    let backlog;

    if (typeof options.port === "number" || typeof options.port === "string") {
      validatePort(options.port, "options.port");
      backlog = options.backlog || backlogFromArgs;

      // start TCP server listening on host:port
      if (options.host) {
        _lookupAndListen(
          this,
          options.port | 0,
          options.host,
          backlog,
          !!options.exclusive,
          flags,
        );
      } else {
        // Undefined host, listens on unspecified address
        // Default addressType 4 will be used to search for primary server
        _listenInCluster(
          this,
          null,
          options.port | 0,
          4,
          backlog,
          undefined,
          options.exclusive,
        );
      }

      return this;
    }

    // (path[, backlog][, cb]) or (options[, cb])
    // where path or options.path is a UNIX domain socket or Windows pipe
    if (options.path && _isPipeName(options.path)) {
      const pipeName = (this._pipeName = options.path);
      backlog = options.backlog || backlogFromArgs;

      _listenInCluster(
        this,
        pipeName,
        -1,
        -1,
        backlog,
        undefined,
        options.exclusive,
      );

      if (!this._handle) {
        // Failed and an error shall be emitted in the next tick.
        // Therefore, we directly return.
        return this;
      }

      let mode = 0;

      if (options.readableAll === true) {
        mode |= PipeConstants.UV_READABLE;
      }

      if (options.writableAll === true) {
        mode |= PipeConstants.UV_WRITABLE;
      }

      if (mode !== 0) {
        const err = this._handle.fchmod(mode);

        if (err) {
          this._handle.close();
          this._handle = null;

          throw errnoException(err, "uv_pipe_chmod");
        }
      }

      return this;
    }

    if (!("port" in options || "path" in options)) {
      throw new ERR_INVALID_ARG_VALUE(
        "options",
        options,
        'must have the property "port" or "path"',
      );
    }

    throw new ERR_INVALID_ARG_VALUE("options", options);
  }

  /**
   * Stops the server from accepting new connections and keeps existing
   * connections. This function is asynchronous, the server is finally closed
   * when all connections are ended and the server emits a `"close"` event.
   * The optional `callback` will be called once the `"close"` event occurs. Unlike
   * that event, it will be called with an `Error` as its only argument if the server
   * was not open when it was closed.
   *
   * @param cb Called when the server is closed.
   */
  close(cb?: (err?: Error) => void): this {
    if (typeof cb === "function") {
      if (!this._handle) {
        this.once("close", function close() {
          cb(new ERR_SERVER_NOT_RUNNING());
        });
      } else {
        this.once("close", cb);
      }
    }

    if (this._handle) {
      (this._handle as TCP).close();
      this._handle = null;
    }

    if (this._usingWorkers) {
      let left = this._workers.length;
      const onWorkerClose = () => {
        if (--left !== 0) {
          return;
        }

        this._connections = 0;
        this._emitCloseIfDrained();
      };

      // Increment connections to be sure that, even if all sockets will be closed
      // during polling of workers, `close` event will be emitted only once.
      this._connections++;

      // Poll workers
      for (let n = 0; n < this._workers.length; n++) {
        this._workers[n].close(onWorkerClose);
      }
    } else {
      this._emitCloseIfDrained();
    }

    return this;
  }

  /**
   * Returns the bound `address`, the address `family` name, and `port` of the server
   * as reported by the operating system if listening on an IP socket
   * (useful to find which port was assigned when getting an OS-assigned address):`{ port: 12346, family: "IPv4", address: "127.0.0.1" }`.
   *
   * For a server listening on a pipe or Unix domain socket, the name is returned
   * as a string.
   *
   * `server.address()` returns `null` before the `"listening"` event has been
   * emitted or after calling `server.close()`.
   */
  address(): AddressInfo | string | null {
    if (this._handle && this._handle.getsockname) {
      const out = {};
      const err = this._handle.getsockname(out);

      if (err) {
        throw errnoException(err, "address");
      }

      return out as AddressInfo;
    } else if (this._pipeName) {
      return this._pipeName;
    }

    return null;
  }

  /**
   * Asynchronously get the number of concurrent connections on the server. Works
   * when sockets were sent to forks.
   *
   * Callback should take two arguments `err` and `count`.
   */
  getConnections(cb: (err: Error | null, count: number) => void): this {
    // deno-lint-ignore no-this-alias
    const server = this;

    function end(err: Error | null, connections?: number) {
      defaultTriggerAsyncIdScope(
        server[asyncIdSymbol],
        nextTick,
        cb,
        err,
        connections,
      );
    }

    if (!this._usingWorkers) {
      end(null, this._connections);

      return this;
    }

    // Poll workers
    let left = this._workers.length;
    let total = this._connections;

    function oncount(err: Error, count: number) {
      if (err) {
        left = -1;

        return end(err);
      }

      total += count;

      if (--left === 0) {
        return end(null, total);
      }
    }

    for (let n = 0; n < this._workers.length; n++) {
      this._workers[n].getConnections(oncount);
    }

    return this;
  }

  /**
   * Calling `unref()` on a server will allow the program to exit if this is the only
   * active server in the event system. If the server is already `unref`ed calling `unref()` again will have no effect.
   */
  unref(): this {
    this._unref = true;

    if (this._handle) {
      this._handle.unref();
    }

    return this;
  }

  /**
   * Opposite of `unref()`, calling `ref()` on a previously `unref`ed server will _not_ let the program exit if it's the only server left (the default behavior).
   * If the server is `ref`ed calling `ref()` again will have no effect.
   */
  ref(): this {
    this._unref = false;

    if (this._handle) {
      this._handle.ref();
    }

    return this;
  }

  /**
   * Indicates whether or not the server is listening for connections.
   */
  get listening(): boolean {
    return !!this._handle;
  }

  _createSocket(clientHandle) {
    const socket = new Socket({
      handle: clientHandle,
      allowHalfOpen: this.allowHalfOpen,
      pauseOnCreate: this.pauseOnConnect,
      readable: true,
      writable: true,
    });

    // TODO(@bartlomieju): implement noDelay and setKeepAlive

    socket.server = this;
    socket._server = this;

    DTRACE_NET_SERVER_CONNECTION(socket);

    return socket;
  }

  _listen2 = _setupListenHandle;

  _emitCloseIfDrained() {
    debug("SERVER _emitCloseIfDrained");
    if (this._handle || this._connections) {
      debug(
        `SERVER handle? ${!!this._handle}   connections? ${this._connections}`,
      );
      return;
    }

    // We use setTimeout instead of nextTick here to avoid EADDRINUSE error
    // when the same port listened immediately after the 'close' event.
    // ref: https://github.com/denoland/deno_std/issues/2788
    defaultTriggerAsyncIdScope(
      this[asyncIdSymbol],
      setTimeout,
      _emitCloseNT,
      0,
      this,
    );
  }

  _setupWorker(socketList: EventEmitter) {
    this._usingWorkers = true;
    this._workers.push(socketList);

    // deno-lint-ignore no-explicit-any
    socketList.once("exit", (socketList: any) => {
      const index = this._workers.indexOf(socketList);
      this._workers.splice(index, 1);
    });
  }

  [EventEmitter.captureRejectionSymbol](
    err: Error,
    event: string,
    sock: Socket,
  ) {
    switch (event) {
      case "connection": {
        sock.destroy(err);
        break;
      }
      default: {
        this.emit("error", err);
      }
    }
  }
}

/**
 * Creates a new TCP or IPC server.
 *
 * Accepts an `options` object with properties `allowHalfOpen` (default `false`)
 * and `pauseOnConnect` (default `false`).
 *
 * If `allowHalfOpen` is set to `false`, then the socket will
 * automatically end the writable side when the readable side ends.
 *
 * If `allowHalfOpen` is set to `true`, when the other end of the socket
 * signals the end of transmission, the server will only send back the end of
 * transmission when `socket.end()` is explicitly called. For example, in the
 * context of TCP, when a FIN packed is received, a FIN packed is sent back
 * only when `socket.end()` is explicitly called. Until then the connection is
 * half-closed (non-readable but still writable). See `"end"` event and RFC 1122
 * (section 4.2.2.13) for more information.
 *
 * `pauseOnConnect` indicates whether the socket should be paused on incoming
 * connections.
 *
 * If `pauseOnConnect` is set to `true`, then the socket associated with each
 * incoming connection will be paused, and no data will be read from its
 * handle. This allows connections to be passed between processes without any
 * data being read by the original process. To begin reading data from a paused
 * socket, call `socket.resume()`.
 *
 * The server can be a TCP server or an IPC server, depending on what it
 * `listen()` to.
 *
 * Here is an example of an TCP echo server which listens for connections on
 * port 8124:
 *
 * @param options Socket options.
 * @param connectionListener Automatically set as a listener for the `"connection"` event.
 * @return A `net.Server`.
 */
export function createServer(
  options?: ServerOptions,
  connectionListener?: ConnectionListener,
): Server {
  return new Server(options, connectionListener);
}

export { BlockList, isIP, isIPv4, isIPv6, SocketAddress };

export default {
  _createServerHandle,
  _normalizeArgs,
  BlockList,
  connect,
  createConnection,
  createServer,
  getDefaultAutoSelectFamily,
  getDefaultAutoSelectFamilyAttemptTimeout,
  isIP,
  isIPv4,
  isIPv6,
  Server,
  setDefaultAutoSelectFamily,
  setDefaultAutoSelectFamilyAttemptTimeout,
  Socket,
  SocketAddress,
  Stream,
};
