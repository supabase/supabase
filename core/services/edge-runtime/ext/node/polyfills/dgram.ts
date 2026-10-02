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

import { Buffer } from "node:buffer";
import { EventEmitter } from "node:events";
import { lookup as defaultLookup } from "node:dns";
import type {
  ErrnoException,
  NodeSystemErrorCtx,
} from "ext:deno_node/internal/errors.ts";
import {
  ERR_BUFFER_OUT_OF_BOUNDS,
  ERR_INVALID_ARG_TYPE,
  ERR_INVALID_FD_TYPE,
  ERR_MISSING_ARGS,
  ERR_SOCKET_ALREADY_BOUND,
  ERR_SOCKET_BAD_BUFFER_SIZE,
  ERR_SOCKET_BUFFER_SIZE,
  ERR_SOCKET_DGRAM_IS_CONNECTED,
  ERR_SOCKET_DGRAM_NOT_CONNECTED,
  ERR_SOCKET_DGRAM_NOT_RUNNING,
  errnoException,
  exceptionWithHostPort,
} from "ext:deno_node/internal/errors.ts";
import type { Abortable } from "ext:deno_node/_events.d.ts";
import { kStateSymbol, newHandle } from "ext:deno_node/internal/dgram.ts";
import type { SocketType } from "ext:deno_node/internal/dgram.ts";
import {
  asyncIdSymbol,
  defaultTriggerAsyncIdScope,
  ownerSymbol,
} from "ext:deno_node/internal/async_hooks.ts";
import { SendWrap, UDP } from "ext:deno_node/internal_binding/udp_wrap.ts";
import {
  isInt32,
  validateAbortSignal,
  validateNumber,
  validatePort,
  validateString,
} from "ext:deno_node/internal/validators.mjs";
import { guessHandleType } from "ext:deno_node/internal_binding/util.ts";
import { os } from "ext:deno_node/internal_binding/constants.ts";
import { nextTick } from "node:process";
import { channel } from "node:diagnostics_channel";
import { isArrayBufferView } from "ext:deno_node/internal/util/types.ts";

const { UV_UDP_REUSEADDR, UV_UDP_IPV6ONLY } = os;

const udpSocketChannel = channel("udp.socket");

const BIND_STATE_UNBOUND = 0;
const BIND_STATE_BINDING = 1;
const BIND_STATE_BOUND = 2;

const CONNECT_STATE_DISCONNECTED = 0;
const CONNECT_STATE_CONNECTING = 1;
const CONNECT_STATE_CONNECTED = 2;

const RECV_BUFFER = true;
const SEND_BUFFER = false;

export interface AddressInfo {
  address: string;
  family: number;
  port: number;
}

export type MessageType = string | Uint8Array | Buffer | DataView;

export type RemoteInfo = {
  address: string;
  family: "IPv4" | "IPv6";
  port: number;
  size?: number;
};

export interface BindOptions {
  port?: number;
  address?: string;
  exclusive?: boolean;
  fd?: number;
}

export interface SocketOptions extends Abortable {
  type: SocketType;
  reuseAddr?: boolean;
  /**
   * @default false
   */
  ipv6Only?: boolean;
  recvBufferSize?: number;
  sendBufferSize?: number;
  lookup?: typeof defaultLookup;
}

interface SocketInternalState {
  handle: UDP | null;
  receiving: boolean;
  bindState:
    | typeof BIND_STATE_UNBOUND
    | typeof BIND_STATE_BINDING
    | typeof BIND_STATE_BOUND;
  connectState:
    | typeof CONNECT_STATE_DISCONNECTED
    | typeof CONNECT_STATE_CONNECTING
    | typeof CONNECT_STATE_CONNECTED;
  queue?: Array<() => void>;
  reuseAddr?: boolean;
  ipv6Only?: boolean;
  recvBufferSize?: number;
  sendBufferSize?: number;
}

const isSocketOptions = (
  socketOption: unknown,
): socketOption is SocketOptions =>
  socketOption !== null && typeof socketOption === "object";

const isUdpHandle = (handle: unknown): handle is UDP =>
  handle !== null &&
  typeof handle === "object" &&
  typeof (handle as UDP).recvStart === "function";

const isBindOptions = (options: unknown): options is BindOptions =>
  options !== null && typeof options === "object";

/**
 * Encapsulates the datagram functionality.
 *
 * New instances of `dgram.Socket` are created using `createSocket`.
 * The `new` keyword is not to be used to create `dgram.Socket` instances.
 */
export class Socket extends EventEmitter {
  [asyncIdSymbol]!: number;
  [kStateSymbol]!: SocketInternalState;

  type!: SocketType;

  constructor(
    type: SocketType | SocketOptions,
    listener?: (msg: Buffer, rinfo: RemoteInfo) => void,
  ) {
    super();

    let lookup;
    let recvBufferSize;
    let sendBufferSize;

    let options: SocketOptions | undefined;

    if (isSocketOptions(type)) {
      options = type;
      type = options.type;
      lookup = options.lookup;
      recvBufferSize = options.recvBufferSize;
      sendBufferSize = options.sendBufferSize;
    }

    const handle = newHandle(type, lookup);
    handle[ownerSymbol] = this;

    this[asyncIdSymbol] = handle.getAsyncId();
    this.type = type;

    if (typeof listener === "function") {
      this.on("message", listener);
    }

    this[kStateSymbol] = {
      handle,
      receiving: false,
      bindState: BIND_STATE_UNBOUND,
      connectState: CONNECT_STATE_DISCONNECTED,
      queue: undefined,
      reuseAddr: options && options.reuseAddr, // Use UV_UDP_REUSEADDR if true.
      ipv6Only: options && options.ipv6Only,
      recvBufferSize,
      sendBufferSize,
    };

    if (options?.signal !== undefined) {
      const { signal } = options;

      validateAbortSignal(signal, "options.signal");

      const onAborted = () => {
        this.close();
      };

      if (signal.aborted) {
        onAborted();
      } else {
        signal.addEventListener("abort", onAborted);

        this.once(
          "close",
          () => signal.removeEventListener("abort", onAborted),
        );
      }
    }

    if (udpSocketChannel.hasSubscribers) {
      udpSocketChannel.publish({
        socket: this,
      });
    }
  }

  /**
   * Tells the kernel to join a multicast group at the given `multicastAddress`
   * and `multicastInterface` using the `IP_ADD_MEMBERSHIP` socket option. If
   * the`multicastInterface` argument is not specified, the operating system
   * will choose one interface and will add membership to it. To add membership
   * to every available interface, call `addMembership` multiple times, once
   * per interface.
   *
   * When called on an unbound socket, this method will implicitly bind to a
   * random port, listening on all interfaces.
   *
   * When sharing a UDP socket across multiple `cluster` workers, the
   * `socket.addMembership()` function must be called only once or an
   * `EADDRINUSE` error will occur:
   *
   * ```js
   * import cluster from "ext:deno_node/cluster";
   * import dgram from "ext:deno_node/dgram";
   *
   * if (cluster.isPrimary) {
   *   cluster.fork(); // Works ok.
   *   cluster.fork(); // Fails with EADDRINUSE.
   * } else {
   *   const s = dgram.createSocket('udp4');
   *   s.bind(1234, () => {
   *     s.addMembership('224.0.0.114');
   *   });
   * }
   * ```
   */
  addMembership(multicastAddress: string, interfaceAddress?: string) {
    healthCheck(this);

    if (!multicastAddress) {
      throw new ERR_MISSING_ARGS("multicastAddress");
    }

    const { handle } = this[kStateSymbol];
    const err = handle!.addMembership(multicastAddress, interfaceAddress);

    if (err) {
      throw errnoException(err, "addMembership");
    }
  }

  /**
   * Tells the kernel to join a source-specific multicast channel at the given
   * `sourceAddress` and `groupAddress`, using the `multicastInterface` with
   * the `IP_ADD_SOURCE_MEMBERSHIP` socket option. If the `multicastInterface`
   * argument is not specified, the operating system will choose one interface
   * and will add membership to it. To add membership to every available
   * interface, call `socket.addSourceSpecificMembership()` multiple times,
   * once per interface.
   *
   * When called on an unbound socket, this method will implicitly bind to a
   * random port, listening on all interfaces.
   */
  addSourceSpecificMembership(
    sourceAddress: string,
    groupAddress: string,
    interfaceAddress?: string,
  ) {
    healthCheck(this);

    validateString(sourceAddress, "sourceAddress");
    validateString(groupAddress, "groupAddress");

    const err = this[kStateSymbol].handle!.addSourceSpecificMembership(
      sourceAddress,
      groupAddress,
      interfaceAddress,
    );

    if (err) {
      throw errnoException(err, "addSourceSpecificMembership");
    }
  }

  /**
   * Returns an object containing the address information for a socket.
   * For UDP sockets, this object will contain `address`, `family` and `port`properties.
   *
   * This method throws `EBADF` if called on an unbound socket.
   */
  address(): AddressInfo {
    healthCheck(this);

    const out = {};
    const err = this[kStateSymbol].handle!.getsockname(out);

    if (err) {
      throw errnoException(err, "getsockname");
    }

    return out as AddressInfo;
  }

  /**
   * For UDP sockets, causes the `dgram.Socket` to listen for datagram
   * messages on a named `port` and optional `address`. If `port` is not
   * specified or is `0`, the operating system will attempt to bind to a
   * random port. If `address` is not specified, the operating system will
   * attempt to listen on all addresses. Once binding is complete, a
   * `'listening'` event is emitted and the optional `callback` function is
   * called.
   *
   * Specifying both a `'listening'` event listener and passing a `callback` to
   * the `socket.bind()` method is not harmful but not very useful.
   *
   * A bound datagram socket keeps the Node.js process running to receive
   * datagram messages.
   *
   * If binding fails, an `'error'` event is generated. In rare case (e.g.
   * attempting to bind with a closed socket), an `Error` may be thrown.
   *
   * Example of a UDP server listening on port 41234:
   *
   * ```js
   * import dgram from "ext:deno_node/dgram";
   *
   * const server = dgram.createSocket('udp4');
   *
   * server.on('error', (err) => {
   *   console.log(`server error:\n${err.stack}`);
   *   server.close();
   * });
   *
   * server.on('message', (msg, rinfo) => {
   *   console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
   * });
   *
   * server.on('listening', () => {
   *   const address = server.address();
   *   console.log(`server listening ${address.address}:${address.port}`);
   * });
   *
   * server.bind(41234);
   * // Prints: server listening 0.0.0.0:41234
   * ```
   *
   * @param callback with no parameters. Called when binding is complete.
   */
  bind(port?: number, address?: string, callback?: () => void): this;
  bind(port: number, callback?: () => void): this;
  bind(callback: () => void): this;
  bind(options: BindOptions, callback?: () => void): this;
  bind(port_?: unknown, address_?: unknown /* callback */): this {
    let port = typeof port_ === "function" ? null : port_;

    healthCheck(this);

    const state = this[kStateSymbol];

    if (state.bindState !== BIND_STATE_UNBOUND) {
      throw new ERR_SOCKET_ALREADY_BOUND();
    }

    state.bindState = BIND_STATE_BINDING;

    const cb = arguments.length && arguments[arguments.length - 1];

    if (typeof cb === "function") {
      // deno-lint-ignore no-inner-declarations
      function removeListeners(this: Socket) {
        this.removeListener("error", removeListeners);
        this.removeListener("listening", onListening);
      }

      // deno-lint-ignore no-inner-declarations
      function onListening(this: Socket) {
        removeListeners.call(this);
        cb.call(this);
      }

      this.on("error", removeListeners);
      this.on("listening", onListening);
    }

    if (isUdpHandle(port)) {
      replaceHandle(this, port);
      startListening(this);

      return this;
    }

    // Open an existing fd instead of creating a new one.
    if (isBindOptions(port) && isInt32(port.fd!) && port.fd! > 0) {
      const fd = port.fd!;
      const state = this[kStateSymbol];

      // TODO(cmorten): here we deviate somewhat from the Node implementation which
      // makes use of the https://nodejs.org/api/cluster.html module to run servers
      // across a "cluster" of Node processes to take advantage of multi-core
      // systems.
      //
      // Though Deno has has a Worker capability from which we could simulate this,
      // for now we assert that we are _always_ on the primary process.

      const type = guessHandleType(fd);

      if (type !== "UDP") {
        throw new ERR_INVALID_FD_TYPE(type);
      }

      const err = state.handle!.open(fd);

      if (err) {
        throw errnoException(err, "open");
      }

      startListening(this);

      return this;
    }

    let address: string;

    if (isBindOptions(port)) {
      address = port.address || "";
      port = port.port;
    } else {
      address = typeof address_ === "function" ? "" : (address_ as string);
    }

    // Defaulting address for bind to all interfaces
    if (!address) {
      if (this.type === "udp4") {
        address = "0.0.0.0";
      } else {
        address = "::";
      }
    }

    // Resolve address first
    state.handle!.lookup(address, (lookupError, ip) => {
      if (lookupError) {
        state.bindState = BIND_STATE_UNBOUND;
        this.emit("error", lookupError);

        return;
      }

      let flags: number | undefined = 0;

      if (state.reuseAddr) {
        flags |= UV_UDP_REUSEADDR;
      }
      if (state.ipv6Only) {
        flags |= UV_UDP_IPV6ONLY!;
      }

      // TODO(cmorten): here we deviate somewhat from the Node implementation which
      // makes use of the https://nodejs.org/api/cluster.html module to run servers
      // across a "cluster" of Node processes to take advantage of multi-core
      // systems.
      //
      // Though Deno has has a Worker capability from which we could simulate this,
      // for now we assert that we are _always_ on the primary process.

      if (!state.handle) {
        return; // Handle has been closed in the mean time
      }

      const err = state.handle.bind(ip, port as number || 0, flags);

      if (err) {
        const ex = exceptionWithHostPort(err, "bind", ip, port as number);
        state.bindState = BIND_STATE_UNBOUND;
        this.emit("error", ex);

        // Todo(@bartlomieju): close?
        return;
      }

      startListening(this);
    });

    return this;
  }

  /**
   * Close the underlying socket and stop listening for data on it. If a
   * callback is provided, it is added as a listener for the `'close'` event.
   *
   * @param callback Called when the socket has been closed.
   */
  close(callback?: () => void): this {
    const state = this[kStateSymbol];
    const queue = state.queue;

    if (typeof callback === "function") {
      this.on("close", callback);
    }

    if (queue !== undefined) {
      queue.push(this.close.bind(this));

      return this;
    }

    healthCheck(this);
    stopReceiving(this);

    state.handle!.close(() => {
      // Deviates from the Node implementation to avoid leaking the timer ops at 'close' event
      defaultTriggerAsyncIdScope(
        this[asyncIdSymbol],
        nextTick,
        socketCloseNT,
        this,
      );
    });
    state.handle = null;

    return this;
  }

  /**
   * Associates the `dgram.Socket` to a remote address and port. Every
   * message sent by this handle is automatically sent to that destination.
   * Also, the socket will only receive messages from that remote peer.
   * Trying to call `connect()` on an already connected socket will result
   * in an `ERR_SOCKET_DGRAM_IS_CONNECTED` exception. If `address` is not
   * provided, `'127.0.0.1'` (for `udp4` sockets) or `'::1'` (for `udp6` sockets)
   * will be used by default. Once the connection is complete, a `'connect'` event
   * is emitted and the optional `callback` function is called. In case of failure,
   * the `callback` is called or, failing this, an `'error'` event is emitted.
   *
   * @param callback Called when the connection is completed or on error.
   */
  connect(
    port: number,
    address?: string,
    callback?: (err?: ErrnoException) => void,
  ): void;
  connect(port: number, callback: (err?: ErrnoException) => void): void;
  connect(port: number, address?: unknown, callback?: unknown) {
    port = validatePort(port, "Port", false);

    if (typeof address === "function") {
      callback = address;
      address = "";
    } else if (address === undefined) {
      address = "";
    }

    validateString(address, "address");

    const state = this[kStateSymbol];

    if (state.connectState !== CONNECT_STATE_DISCONNECTED) {
      throw new ERR_SOCKET_DGRAM_IS_CONNECTED();
    }

    state.connectState = CONNECT_STATE_CONNECTING;

    if (state.bindState === BIND_STATE_UNBOUND) {
      this.bind({ port: 0, exclusive: true });
    }

    if (state.bindState !== BIND_STATE_BOUND) {
      enqueue(
        this,
        _connect.bind(
          this,
          port,
          address as string,
          callback as (err?: ErrnoException) => void,
        ),
      );

      return;
    }

    Reflect.apply(_connect, this, [port, address, callback]);
  }

  /**
   * A synchronous function that disassociates a connected `dgram.Socket` from
   * its remote address. Trying to call `disconnect()` on an unbound or already
   * disconnected socket will result in an `ERR_SOCKET_DGRAM_NOT_CONNECTED`
   * exception.
   */
  disconnect() {
    const state = this[kStateSymbol];

    if (state.connectState !== CONNECT_STATE_CONNECTED) {
      throw new ERR_SOCKET_DGRAM_NOT_CONNECTED();
    }

    const err = state.handle!.disconnect();

    if (err) {
      throw errnoException(err, "connect");
    } else {
      state.connectState = CONNECT_STATE_DISCONNECTED;
    }
  }

  /**
   * Instructs the kernel to leave a multicast group at `multicastAddress`
   * using the `IP_DROP_MEMBERSHIP` socket option. This method is automatically
   * called by the kernel when the socket is closed or the process terminates,
   * so most apps will never have reason to call this.
   *
   * If `multicastInterface` is not specified, the operating system will
   * attempt to drop membership on all valid interfaces.
   */
  dropMembership(multicastAddress: string, interfaceAddress?: string) {
    healthCheck(this);

    if (!multicastAddress) {
      throw new ERR_MISSING_ARGS("multicastAddress");
    }

    const err = this[kStateSymbol].handle!.dropMembership(
      multicastAddress,
      interfaceAddress,
    );

    if (err) {
      throw errnoException(err, "dropMembership");
    }
  }

  /**
   * Instructs the kernel to leave a source-specific multicast channel at the
   * given `sourceAddress` and `groupAddress` using the
   * `IP_DROP_SOURCE_MEMBERSHIP` socket option. This method is automatically
   * called by the kernel when the socket is closed or the process terminates,
   * so most apps will never have reason to call this.
   *
   * If `multicastInterface` is not specified, the operating system will
   * attempt to drop membership on all valid interfaces.
   */
  dropSourceSpecificMembership(
    sourceAddress: string,
    groupAddress: string,
    interfaceAddress?: string,
  ) {
    healthCheck(this);

    validateString(sourceAddress, "sourceAddress");
    validateString(groupAddress, "groupAddress");

    const err = this[kStateSymbol].handle!.dropSourceSpecificMembership(
      sourceAddress,
      groupAddress,
      interfaceAddress,
    );

    if (err) {
      throw errnoException(err, "dropSourceSpecificMembership");
    }
  }

  /**
   * This method throws `ERR_SOCKET_BUFFER_SIZE` if called on an unbound
   * socket.
   *
   * @return the `SO_RCVBUF` socket receive buffer size in bytes.
   */
  getRecvBufferSize(): number {
    return bufferSize(this, 0, RECV_BUFFER);
  }

  /**
   * This method throws `ERR_SOCKET_BUFFER_SIZE` if called on an unbound
   * socket.
   *
   * @return the `SO_SNDBUF` socket send buffer size in bytes.
   */
  getSendBufferSize(): number {
    return bufferSize(this, 0, SEND_BUFFER);
  }

  /**
   * By default, binding a socket will cause it to block the Node.js process
   * from exiting as long as the socket is open. The `socket.unref()` method
   * can be used to exclude the socket from the reference counting that keeps
   * the Node.js process active. The `socket.ref()` method adds the socket back
   * to the reference counting and restores the default behavior.
   *
   * Calling `socket.ref()` multiples times will have no additional effect.
   *
   * The `socket.ref()` method returns a reference to the socket so calls can
   * be chained.
   */
  ref(): this {
    const handle = this[kStateSymbol].handle;

    if (handle) {
      handle.ref();
    }

    return this;
  }

  /**
   * Returns an object containing the `address`, `family`, and `port` of the
   * remote endpoint. This method throws an `ERR_SOCKET_DGRAM_NOT_CONNECTED`
   * exception if the socket is not connected.
   */
  remoteAddress(): AddressInfo {
    healthCheck(this);

    const state = this[kStateSymbol];

    if (state.connectState !== CONNECT_STATE_CONNECTED) {
      throw new ERR_SOCKET_DGRAM_NOT_CONNECTED();
    }

    const out = {};
    const err = state.handle!.getpeername(out);

    if (err) {
      throw errnoException(err, "getpeername");
    }

    return out as AddressInfo;
  }

  /**
   * Broadcasts a datagram on the socket.
   * For connectionless sockets, the destination `port` and `address` must be
   * specified. Connected sockets, on the other hand, will use their associated
   * remote endpoint, so the `port` and `address` arguments must not be set.
   *
   * The `msg` argument contains the message to be sent.
   * Depending on its type, different behavior can apply. If `msg` is a
   * `Buffer`, any `TypedArray` or a `DataView`,
   * the `offset` and `length` specify the offset within the `Buffer` where the
   * message begins and the number of bytes in the message, respectively.
   * If `msg` is a `String`, then it is automatically converted to a `Buffer`
   * with `'utf8'` encoding. With messages that contain multi-byte characters,
   * `offset` and `length` will be calculated with respect to `byte length` and
   * not the character position. If `msg` is an array, `offset` and `length`
   * must not be specified.
   *
   * The `address` argument is a string. If the value of `address` is a host
   * name, DNS will be used to resolve the address of the host. If `address`
   * is not provided or otherwise nullish, `'127.0.0.1'` (for `udp4` sockets)
   * or `'::1'`(for `udp6` sockets) will be used by default.
   *
   * If the socket has not been previously bound with a call to `bind`, the
   * socket is assigned a random port number and is bound to the "all
   * interfaces" address (`'0.0.0.0'` for `udp4` sockets, `'::0'` for `udp6`
   * sockets.)
   *
   * An optional `callback` function may be specified to as a way of
   * reporting DNS errors or for determining when it is safe to reuse the `buf`
   * object. DNS lookups delay the time to send for at least one tick of the
   * Node.js event loop.
   *
   * The only way to know for sure that the datagram has been sent is by using
   * a `callback`. If an error occurs and a `callback` is given, the error will
   * be passed as the first argument to the `callback`. If a `callback` is not
   * given, the error is emitted as an `'error'` event on the `socket` object.
   *
   * Offset and length are optional but both _must_ be set if either are used.
   * They are supported only when the first argument is a `Buffer`, a
   * `TypedArray`, or a `DataView`.
   *
   * This method throws `ERR_SOCKET_BAD_PORT` if called on an unbound socket.
   *
   * Example of sending a UDP packet to a port on `localhost`;
   *
   * ```js
   * import dgram from "ext:deno_node/dgram";
   * import { Buffer } from "ext:deno_node/buffer";
   *
   * const message = Buffer.from('Some bytes');
   * const client = dgram.createSocket('udp4');
   * client.send(message, 41234, 'localhost', (err) => {
   *   client.close();
   * });
   * ```
   *
   * Example of sending a UDP packet composed of multiple buffers to a port on
   * `127.0.0.1`;
   *
   * ```js
   * import dgram from "ext:deno_node/dgram";
   * import { Buffer } from "ext:deno_node/buffer";
   *
   * const buf1 = Buffer.from('Some ');
   * const buf2 = Buffer.from('bytes');
   * const client = dgram.createSocket('udp4');
   * client.send([buf1, buf2], 41234, (err) => {
   *   client.close();
   * });
   * ```
   *
   * Sending multiple buffers might be faster or slower depending on the
   * application and operating system. Run benchmarks to
   * determine the optimal strategy on a case-by-case basis. Generally
   * speaking, however, sending multiple buffers is faster.
   *
   * Example of sending a UDP packet using a socket connected to a port on
   * `localhost`:
   *
   * ```js
   * import dgram from "ext:deno_node/dgram";
   * import { Buffer } from "ext:deno_node/buffer";
   *
   * const message = Buffer.from('Some bytes');
   * const client = dgram.createSocket('udp4');
   * client.connect(41234, 'localhost', (err) => {
   *   client.send(message, (err) => {
   *     client.close();
   *   });
   * });
   * ```
   *
   * @param msg Message to be sent.
   * @param offset Offset in the buffer where the message starts.
   * @param length Number of bytes in the message.
   * @param port Destination port.
   * @param address Destination host name or IP address.
   * @param callback Called when the message has been sent.
   */
  send(
    msg: MessageType | ReadonlyArray<MessageType>,
    port?: number,
    address?: string,
    callback?: (error: ErrnoException | null, bytes?: number) => void,
  ): void;
  send(
    msg: MessageType | ReadonlyArray<MessageType>,
    port?: number,
    callback?: (error: ErrnoException | null, bytes?: number) => void,
  ): void;
  send(
    msg: MessageType | ReadonlyArray<MessageType>,
    callback?: (error: ErrnoException | null, bytes?: number) => void,
  ): void;
  send(
    msg: MessageType,
    offset: number,
    length: number,
    port?: number,
    address?: string,
    callback?: (error: ErrnoException | null, bytes?: number) => void,
  ): void;
  send(
    msg: MessageType,
    offset: number,
    length: number,
    port?: number,
    callback?: (error: ErrnoException | null, bytes?: number) => void,
  ): void;
  send(
    msg: MessageType,
    offset: number,
    length: number,
    callback?: (error: ErrnoException | null, bytes?: number) => void,
  ): void;
  send(
    buffer: unknown,
    offset?: unknown,
    length?: unknown,
    port?: unknown,
    address?: unknown,
    callback?: unknown,
  ) {
    let list: MessageType[] | null;

    const state = this[kStateSymbol];
    const connected = state.connectState === CONNECT_STATE_CONNECTED;

    if (!connected) {
      if (address || (port && typeof port !== "function")) {
        buffer = sliceBuffer(
          buffer as MessageType,
          offset as number,
          length as number,
        );
      } else {
        callback = port;
        port = offset;
        address = length;
      }
    } else {
      if (typeof length === "number") {
        buffer = sliceBuffer(buffer as MessageType, offset as number, length);

        if (typeof port === "function") {
          callback = port;
          port = null;
        }
      } else {
        callback = offset;
      }

      if (port || address) {
        throw new ERR_SOCKET_DGRAM_IS_CONNECTED();
      }
    }

    if (!Array.isArray(buffer)) {
      if (typeof buffer === "string") {
        list = [Buffer.from(buffer)];
      } else if (!isArrayBufferView(buffer)) {
        throw new ERR_INVALID_ARG_TYPE(
          "buffer",
          ["Buffer", "TypedArray", "DataView", "string"],
          buffer,
        );
      } else {
        list = [buffer as MessageType];
      }
    } else if (!(list = fixBufferList(buffer))) {
      throw new ERR_INVALID_ARG_TYPE(
        "buffer list arguments",
        ["Buffer", "TypedArray", "DataView", "string"],
        buffer,
      );
    }

    if (!connected) {
      port = validatePort(port, "Port", false);
    }

    // Normalize callback so it's either a function or undefined but not anything
    // else.
    if (typeof callback !== "function") {
      callback = undefined;
    }

    if (typeof address === "function") {
      callback = address;
      address = undefined;
    } else if (address && typeof address !== "string") {
      throw new ERR_INVALID_ARG_TYPE("address", ["string", "falsy"], address);
    }

    healthCheck(this);

    if (state.bindState === BIND_STATE_UNBOUND) {
      this.bind({ port: 0, exclusive: true });
    }

    if (list.length === 0) {
      list.push(Buffer.alloc(0));
    }

    // If the socket hasn't been bound yet, push the outbound packet onto the
    // send queue and send after binding is complete.
    if (state.bindState !== BIND_STATE_BOUND) {
      // @ts-ignore mapping unknowns back onto themselves doesn't type nicely
      enqueue(this, this.send.bind(this, list, port, address, callback));

      return;
    }

    const afterDns = (ex: ErrnoException | null, ip: string) => {
      defaultTriggerAsyncIdScope(
        this[asyncIdSymbol],
        doSend,
        ex,
        this,
        ip,
        list,
        address,
        port,
        callback,
      );
    };

    if (!connected) {
      state.handle!.lookup(address as string, afterDns);
    } else {
      afterDns(null, "");
    }
  }

  /**
   * Sets or clears the `SO_BROADCAST` socket option. When set to `true`, UDP
   * packets may be sent to a local interface's broadcast address.
   *
   * This method throws `EBADF` if called on an unbound socket.
   */
  setBroadcast(arg: boolean) {
    const err = this[kStateSymbol].handle!.setBroadcast(arg ? 1 : 0);

    if (err) {
      throw errnoException(err, "setBroadcast");
    }
  }

  /**
   * _All references to scope in this section are referring to [IPv6 Zone Indices](https://en.wikipedia.org/wiki/IPv6_address#Scoped_literal_IPv6_addresses), which are defined by [RFC
   * 4007](https://tools.ietf.org/html/rfc4007). In string form, an IP_
   * _with a scope index is written as `'IP%scope'` where scope is an interface name_
   * _or interface number._
   *
   * Sets the default outgoing multicast interface of the socket to a chosen
   * interface or back to system interface selection. The `multicastInterface` must
   * be a valid string representation of an IP from the socket's family.
   *
   * For IPv4 sockets, this should be the IP configured for the desired physical
   * interface. All packets sent to multicast on the socket will be sent on the
   * interface determined by the most recent successful use of this call.
   *
   * For IPv6 sockets, `multicastInterface` should include a scope to indicate the
   * interface as in the examples that follow. In IPv6, individual `send` calls can
   * also use explicit scope in addresses, so only packets sent to a multicast
   * address without specifying an explicit scope are affected by the most recent
   * successful use of this call.
   *
   * This method throws `EBADF` if called on an unbound socket.
   *
   * #### Example: IPv6 outgoing multicast interface
   *
   * On most systems, where scope format uses the interface name:
   *
   * ```js
   * const socket = dgram.createSocket('udp6');
   *
   * socket.bind(1234, () => {
   *   socket.setMulticastInterface('::%eth1');
   * });
   * ```
   *
   * On Windows, where scope format uses an interface number:
   *
   * ```js
   * const socket = dgram.createSocket('udp6');
   *
   * socket.bind(1234, () => {
   *   socket.setMulticastInterface('::%2');
   * });
   * ```
   *
   * #### Example: IPv4 outgoing multicast interface
   *
   * All systems use an IP of the host on the desired physical interface:
   *
   * ```js
   * const socket = dgram.createSocket('udp4');
   *
   * socket.bind(1234, () => {
   *   socket.setMulticastInterface('10.0.0.2');
   * });
   * ```
   */
  setMulticastInterface(interfaceAddress: string) {
    healthCheck(this);
    validateString(interfaceAddress, "interfaceAddress");

    const err = this[kStateSymbol].handle!.setMulticastInterface(
      interfaceAddress,
    );

    if (err) {
      throw errnoException(err, "setMulticastInterface");
    }
  }

  /**
   * Sets or clears the `IP_MULTICAST_LOOP` socket option. When set to `true`,
   * multicast packets will also be received on the local interface.
   *
   * This method throws `EBADF` if called on an unbound socket.
   */
  setMulticastLoopback(arg: boolean): typeof arg {
    const err = this[kStateSymbol].handle!.setMulticastLoopback(arg ? 1 : 0);

    if (err) {
      throw errnoException(err, "setMulticastLoopback");
    }

    return arg; // 0.4 compatibility
  }

  /**
   * Sets the `IP_MULTICAST_TTL` socket option. While TTL generally stands for
   * "Time to Live", in this context it specifies the number of IP hops that a
   * packet is allowed to travel through, specifically for multicast traffic. Each
   * router or gateway that forwards a packet decrements the TTL. If the TTL is
   * decremented to 0 by a router, it will not be forwarded.
   *
   * The `ttl` argument may be between 0 and 255\. The default on most systems is `1`.
   *
   * This method throws `EBADF` if called on an unbound socket.
   */
  setMulticastTTL(ttl: number): typeof ttl {
    validateNumber(ttl, "ttl");

    const err = this[kStateSymbol].handle!.setMulticastTTL(ttl);

    if (err) {
      throw errnoException(err, "setMulticastTTL");
    }

    return ttl;
  }

  /**
   * Sets the `SO_RCVBUF` socket option. Sets the maximum socket receive buffer
   * in bytes.
   *
   * This method throws `ERR_SOCKET_BUFFER_SIZE` if called on an unbound socket.
   */
  setRecvBufferSize(size: number) {
    bufferSize(this, size, RECV_BUFFER);
  }

  /**
   * Sets the `SO_SNDBUF` socket option. Sets the maximum socket send buffer
   * in bytes.
   *
   * This method throws `ERR_SOCKET_BUFFER_SIZE` if called on an unbound socket.
   */
  setSendBufferSize(size: number) {
    bufferSize(this, size, SEND_BUFFER);
  }

  /**
   * Sets the `IP_TTL` socket option. While TTL generally stands for "Time to Live",
   * in this context it specifies the number of IP hops that a packet is allowed to
   * travel through. Each router or gateway that forwards a packet decrements the
   * TTL. If the TTL is decremented to 0 by a router, it will not be forwarded.
   * Changing TTL values is typically done for network probes or when multicasting.
   *
   * The `ttl` argument may be between between 1 and 255\. The default on most systems
   * is 64.
   *
   * This method throws `EBADF` if called on an unbound socket.
   */
  setTTL(ttl: number): typeof ttl {
    validateNumber(ttl, "ttl");

    const err = this[kStateSymbol].handle!.setTTL(ttl);

    if (err) {
      throw errnoException(err, "setTTL");
    }

    return ttl;
  }

  /**
   * By default, binding a socket will cause it to block the Node.js process from
   * exiting as long as the socket is open. The `socket.unref()` method can be used
   * to exclude the socket from the reference counting that keeps the Node.js
   * process active, allowing the process to exit even if the socket is still
   * listening.
   *
   * Calling `socket.unref()` multiple times will have no addition effect.
   *
   * The `socket.unref()` method returns a reference to the socket so calls can be
   * chained.
   */
  unref(): this {
    const handle = this[kStateSymbol].handle;

    if (handle) {
      handle.unref();
    }

    return this;
  }
}

/**
 * Creates a `dgram.Socket` object. Once the socket is created, calling
 * `socket.bind()` will instruct the socket to begin listening for datagram
 * messages. When `address` and `port` are not passed to `socket.bind()` the
 * method will bind the socket to the "all interfaces" address on a random port
 * (it does the right thing for both `udp4` and `udp6` sockets). The bound
 * address and port can be retrieved using `socket.address().address` and
 * `socket.address().port`.
 *
 * If the `signal` option is enabled, calling `.abort()` on the corresponding
 * `AbortController` is similar to calling `.close()` on the socket:
 *
 * ```js
 * const controller = new AbortController();
 * const { signal } = controller;
 * const server = dgram.createSocket({ type: 'udp4', signal });
 * server.on('message', (msg, rinfo) => {
 *   console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
 * });
 * // Later, when you want to close the server.
 * controller.abort();
 * ```
 *
 * @param options
 * @param callback Attached as a listener for `'message'` events. Optional.
 */
export function createSocket(
  type: SocketType,
  listener?: (msg: Buffer, rinfo: RemoteInfo) => void,
): Socket;
export function createSocket(
  type: SocketOptions,
  listener?: (msg: Buffer, rinfo: RemoteInfo) => void,
): Socket;
export function createSocket(
  type: SocketType | SocketOptions,
  listener?: (msg: Buffer, rinfo: RemoteInfo) => void,
): Socket {
  return new Socket(type, listener);
}

function startListening(socket: Socket) {
  const state = socket[kStateSymbol];

  state.handle!.onmessage = onMessage;
  // Todo(@bartlomieju): handle errors
  state.handle!.recvStart();
  state.receiving = true;
  state.bindState = BIND_STATE_BOUND;

  if (state.recvBufferSize) {
    bufferSize(socket, state.recvBufferSize, RECV_BUFFER);
  }

  if (state.sendBufferSize) {
    bufferSize(socket, state.sendBufferSize, SEND_BUFFER);
  }

  socket.emit("listening");
}

function replaceHandle(self: Socket, newHandle: UDP) {
  const state = self[kStateSymbol];
  const oldHandle = state.handle!;

  // Set up the handle that we got from primary.
  newHandle.lookup = oldHandle.lookup;
  newHandle.bind = oldHandle.bind;
  newHandle.send = oldHandle.send;
  newHandle[ownerSymbol] = self;

  // Replace the existing handle by the handle we got from primary.
  oldHandle.close();
  state.handle = newHandle;
}

function bufferSize(self: Socket, size: number, buffer: boolean): number {
  if (size >>> 0 !== size) {
    throw new ERR_SOCKET_BAD_BUFFER_SIZE();
  }

  const ctx = {};
  const ret = self[kStateSymbol].handle!.bufferSize(size, buffer, ctx);

  if (ret === undefined) {
    throw new ERR_SOCKET_BUFFER_SIZE(ctx as NodeSystemErrorCtx);
  }

  return ret;
}

function socketCloseNT(self: Socket) {
  self.emit("close");
}

function healthCheck(socket: Socket) {
  if (!socket[kStateSymbol].handle) {
    // Error message from dgram_legacy.js.
    throw new ERR_SOCKET_DGRAM_NOT_RUNNING();
  }
}

function stopReceiving(socket: Socket) {
  const state = socket[kStateSymbol];

  if (!state.receiving) {
    return;
  }

  state.handle!.recvStop();
  state.receiving = false;
}

function onMessage(
  nread: number,
  handle: UDP,
  buf?: Buffer,
  rinfo?: RemoteInfo,
) {
  const self = handle[ownerSymbol] as Socket;

  if (nread < 0) {
    self.emit("error", errnoException(nread, "recvmsg"));

    return;
  }

  rinfo!.size = buf!.length; // compatibility

  self.emit("message", buf, rinfo);
}

function sliceBuffer(buffer: MessageType, offset: number, length: number) {
  if (typeof buffer === "string") {
    buffer = Buffer.from(buffer);
  } else if (!isArrayBufferView(buffer)) {
    throw new ERR_INVALID_ARG_TYPE(
      "buffer",
      ["Buffer", "TypedArray", "DataView", "string"],
      buffer,
    );
  }

  offset = offset >>> 0;
  length = length >>> 0;

  if (offset > buffer.byteLength) {
    throw new ERR_BUFFER_OUT_OF_BOUNDS("offset");
  }

  if (offset + length > buffer.byteLength) {
    throw new ERR_BUFFER_OUT_OF_BOUNDS("length");
  }

  return Buffer.from(buffer.buffer, buffer.byteOffset + offset, length);
}

function fixBufferList(
  list: ReadonlyArray<MessageType>,
): Array<MessageType> | null {
  const newList = new Array(list.length);

  for (let i = 0, l = list.length; i < l; i++) {
    const buf = list[i];

    if (typeof buf === "string") {
      newList[i] = Buffer.from(buf);
    } else if (!isArrayBufferView(buf)) {
      return null;
    } else {
      newList[i] = Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength);
    }
  }

  return newList;
}

function enqueue(self: Socket, toEnqueue: () => void) {
  const state = self[kStateSymbol];

  // If the send queue hasn't been initialized yet, do it, and install an
  // event handler that flushes the send queue after binding is done.
  if (state.queue === undefined) {
    state.queue = [];

    self.once(EventEmitter.errorMonitor, onListenError);
    self.once("listening", onListenSuccess);
  }

  state.queue.push(toEnqueue);
}

function onListenSuccess(this: Socket) {
  this.removeListener(EventEmitter.errorMonitor, onListenError);
  clearQueue.call(this);
}

function onListenError(this: Socket) {
  this.removeListener("listening", onListenSuccess);
  this[kStateSymbol].queue = undefined;
}

function clearQueue(this: Socket) {
  const state = this[kStateSymbol];
  const queue = state.queue;
  state.queue = undefined;

  // Flush the send queue.
  for (const queueEntry of queue!) {
    queueEntry();
  }
}

function _connect(
  this: Socket,
  port: number,
  address: string,
  callback: (err?: ErrnoException) => void,
) {
  const state = this[kStateSymbol];

  if (callback) {
    this.once("connect", callback);
  }

  const afterDns = (ex: ErrnoException | null, ip: string) => {
    defaultTriggerAsyncIdScope(
      this[asyncIdSymbol],
      doConnect,
      ex,
      this,
      ip,
      address,
      port,
      callback,
    );
  };

  state.handle!.lookup(address, afterDns);
}

function doConnect(
  ex: ErrnoException | null,
  self: Socket,
  ip: string,
  address: string,
  port: number,
  callback: (err?: ErrnoException) => void,
) {
  const state = self[kStateSymbol];

  if (!state.handle) {
    return;
  }

  if (!ex) {
    const err = state.handle.connect(ip, port);

    if (err) {
      ex = exceptionWithHostPort(err, "connect", address, port);
    }
  }

  if (ex) {
    state.connectState = CONNECT_STATE_DISCONNECTED;

    return nextTick(() => {
      if (callback) {
        self.removeListener("connect", callback);

        callback(ex!);
      } else {
        self.emit("error", ex);
      }
    });
  }

  state.connectState = CONNECT_STATE_CONNECTED;

  nextTick(() => self.emit("connect"));
}

function doSend(
  ex: ErrnoException | null,
  self: Socket,
  ip: string,
  list: MessageType[],
  address: string,
  port: number,
  callback?: (error: ErrnoException | null, bytes?: number) => void,
) {
  const state = self[kStateSymbol];

  if (ex) {
    if (typeof callback === "function") {
      nextTick(callback, ex);

      return;
    }

    nextTick(() => self.emit("error", ex));

    return;
  } else if (!state.handle) {
    return;
  }

  const req = new SendWrap();
  req.list = list; // Keep reference alive.
  req.address = address;
  req.port = port;

  if (callback) {
    req.callback = callback;
    req.oncomplete = afterSend;
  }

  let err;

  if (port) {
    err = state.handle.send(req, list, list.length, port, ip, !!callback);
  } else {
    err = state.handle.send(req, list, list.length, !!callback);
  }

  if (err >= 1) {
    // Synchronous finish. The return code is msg_length + 1 so that we can
    // distinguish between synchronous success and asynchronous success.
    if (callback) {
      nextTick(callback, null, err - 1);
    }

    return;
  }

  if (err && callback) {
    // Don't emit as error, dgram_legacy.js compatibility
    const ex = exceptionWithHostPort(err, "send", address, port);

    nextTick(callback, ex);
  }
}

function afterSend(this: SendWrap, err: number | null, sent?: number) {
  let ex: ErrnoException | null;

  if (err) {
    ex = exceptionWithHostPort(err, "send", this.address, this.port);
  } else {
    ex = null;
  }

  this.callback(ex, sent);
}

export type { SocketType };

export default {
  createSocket,
  Socket,
};
