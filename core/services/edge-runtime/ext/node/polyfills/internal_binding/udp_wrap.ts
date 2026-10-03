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

import {
  op_node_unstable_net_listen_udp,
  op_node_unstable_net_listen_unixpacket,
} from "ext:core/ops";

import {
  AsyncWrap,
  providerType,
} from "ext:deno_node/internal_binding/async_wrap.ts";
import { GetAddrInfoReqWrap } from "ext:deno_node/internal_binding/cares_wrap.ts";
import { HandleWrap } from "ext:deno_node/internal_binding/handle_wrap.ts";
import { ownerSymbol } from "ext:deno_node/internal_binding/symbols.ts";
import { codeMap, errorMap } from "ext:deno_node/internal_binding/uv.ts";
import { notImplemented } from "ext:deno_node/_utils.ts";
import { Buffer } from "node:buffer";
import type { ErrnoException } from "ext:deno_node/internal/errors.ts";
import { isIP } from "ext:deno_node/internal/net.ts";
import * as net from "ext:deno_net/01_net.js";
import { isLinux, isWindows } from "ext:deno_node/_util/os.ts";

const DenoListenDatagram = net.createListenDatagram(
  op_node_unstable_net_listen_udp,
  op_node_unstable_net_listen_unixpacket,
);

type MessageType = string | Uint8Array | Buffer | DataView;

const AF_INET = 2;
const AF_INET6 = 10;

const UDP_DGRAM_MAXSIZE = 64 * 1024;

export class SendWrap extends AsyncWrap {
  list!: MessageType[];
  address!: string;
  port!: number;

  callback!: (error: ErrnoException | null, bytes?: number) => void;
  oncomplete!: (err: number | null, sent?: number) => void;

  constructor() {
    super(providerType.UDPSENDWRAP);
  }
}

export class UDP extends HandleWrap {
  [ownerSymbol]: unknown = null;

  #address?: string;
  #family?: string;
  #port?: number;

  #remoteAddress?: string;
  #remoteFamily?: string;
  #remotePort?: number;

  #listener?: Deno.DatagramConn;
  #receiving = false;
  #unrefed = false;

  #recvBufferSize = UDP_DGRAM_MAXSIZE;
  #sendBufferSize = UDP_DGRAM_MAXSIZE;

  onmessage!: (
    nread: number,
    handle: UDP,
    buf?: Buffer,
    rinfo?: {
      address: string;
      family: "IPv4" | "IPv6";
      port: number;
      size?: number;
    },
  ) => void;

  lookup!: (
    address: string,
    callback: (
      err: ErrnoException | null,
      address: string,
      family: number,
    ) => void,
  ) => GetAddrInfoReqWrap | Record<string, never>;

  constructor() {
    super(providerType.UDPWRAP);
  }

  addMembership(_multicastAddress: string, _interfaceAddress?: string): number {
    notImplemented("udp.UDP.prototype.addMembership");
  }

  addSourceSpecificMembership(
    _sourceAddress: string,
    _groupAddress: string,
    _interfaceAddress?: string,
  ): number {
    notImplemented("udp.UDP.prototype.addSourceSpecificMembership");
  }

  /**
   * Bind to an IPv4 address.
   * @param ip The hostname to bind to.
   * @param port The port to bind to
   * @return An error status code.
   */
  bind(ip: string, port: number, flags: number): number {
    return this.#doBind(ip, port, flags, AF_INET);
  }

  /**
   * Bind to an IPv6 address.
   * @param ip The hostname to bind to.
   * @param port The port to bind to
   * @return An error status code.
   */
  bind6(ip: string, port: number, flags: number): number {
    return this.#doBind(ip, port, flags, AF_INET6);
  }

  bufferSize(
    size: number,
    buffer: boolean,
    ctx: Record<string, string | number>,
  ): number | undefined {
    let err: string | undefined;

    if (size > UDP_DGRAM_MAXSIZE) {
      err = "EINVAL";
    } else if (!this.#address) {
      err = isWindows ? "ENOTSOCK" : "EBADF";
    }

    if (err) {
      ctx.errno = codeMap.get(err)!;
      ctx.code = err;
      ctx.message = errorMap.get(ctx.errno)![1];
      ctx.syscall = buffer ? "uv_recv_buffer_size" : "uv_send_buffer_size";

      return;
    }

    if (size !== 0) {
      size = isLinux ? size * 2 : size;

      if (buffer) {
        return (this.#recvBufferSize = size);
      }

      return (this.#sendBufferSize = size);
    }

    return buffer ? this.#recvBufferSize : this.#sendBufferSize;
  }

  connect(ip: string, port: number): number {
    return this.#doConnect(ip, port, AF_INET);
  }

  connect6(ip: string, port: number): number {
    return this.#doConnect(ip, port, AF_INET6);
  }

  disconnect(): number {
    this.#remoteAddress = undefined;
    this.#remotePort = undefined;
    this.#remoteFamily = undefined;

    return 0;
  }

  dropMembership(
    _multicastAddress: string,
    _interfaceAddress?: string,
  ): number {
    notImplemented("udp.UDP.prototype.dropMembership");
  }

  dropSourceSpecificMembership(
    _sourceAddress: string,
    _groupAddress: string,
    _interfaceAddress?: string,
  ): number {
    notImplemented("udp.UDP.prototype.dropSourceSpecificMembership");
  }

  /**
   * Populates the provided object with remote address entries.
   * @param peername An object to add the remote address entries to.
   * @return An error status code.
   */
  getpeername(peername: Record<string, string | number>): number {
    if (this.#remoteAddress === undefined) {
      return codeMap.get("EBADF")!;
    }

    peername.address = this.#remoteAddress;
    peername.port = this.#remotePort!;
    peername.family = this.#remoteFamily!;

    return 0;
  }

  /**
   * Populates the provided object with local address entries.
   * @param sockname An object to add the local address entries to.
   * @return An error status code.
   */
  getsockname(sockname: Record<string, string | number>): number {
    if (this.#address === undefined) {
      return codeMap.get("EBADF")!;
    }

    sockname.address = this.#address;
    sockname.port = this.#port!;
    sockname.family = this.#family!;

    return 0;
  }

  /**
   * Opens a file descriptor.
   * @param fd The file descriptor to open.
   * @return An error status code.
   */
  open(_fd: number): number {
    // REF: https://github.com/denoland/deno/issues/6529
    notImplemented("udp.UDP.prototype.open");
  }

  /**
   * Start receiving on the connection.
   * @return An error status code.
   */
  recvStart(): number {
    if (!this.#receiving) {
      this.#receiving = true;
      this.#receive();
    }

    return 0;
  }

  /**
   * Stop receiving on the connection.
   * @return An error status code.
   */
  recvStop(): number {
    this.#receiving = false;

    return 0;
  }

  override ref() {
    this.#listener?.ref();
    this.#unrefed = false;
  }

  send(
    req: SendWrap,
    bufs: MessageType[],
    count: number,
    ...args: [number, string, boolean] | [boolean]
  ): number {
    return this.#doSend(req, bufs, count, args, AF_INET);
  }

  send6(
    req: SendWrap,
    bufs: MessageType[],
    count: number,
    ...args: [number, string, boolean] | [boolean]
  ): number {
    return this.#doSend(req, bufs, count, args, AF_INET6);
  }

  setBroadcast(_bool: 0 | 1): number {
    notImplemented("udp.UDP.prototype.setBroadcast");
  }

  setMulticastInterface(_interfaceAddress: string): number {
    notImplemented("udp.UDP.prototype.setMulticastInterface");
  }

  setMulticastLoopback(_bool: 0 | 1): number {
    notImplemented("udp.UDP.prototype.setMulticastLoopback");
  }

  setMulticastTTL(_ttl: number): number {
    notImplemented("udp.UDP.prototype.setMulticastTTL");
  }

  setTTL(_ttl: number): number {
    notImplemented("udp.UDP.prototype.setTTL");
  }

  override unref() {
    this.#listener?.unref();
    this.#unrefed = true;
  }

  #doBind(ip: string, port: number, _flags: number, family: number): number {
    // TODO(cmorten): use flags to inform socket reuse etc.
    const listenOptions = {
      port,
      hostname: ip,
      transport: "udp" as const,
    };

    let listener;

    try {
      listener = DenoListenDatagram(listenOptions);
    } catch (e) {
      if (e instanceof Deno.errors.NotCapable) {
        throw e;
      }
      return codeMap.get(e.code ?? "UNKNOWN") ?? codeMap.get("UNKNOWN")!;
    }

    const address = listener.addr as Deno.NetAddr;
    this.#address = address.hostname;
    this.#port = address.port;
    this.#family = family === AF_INET6 ? ("IPv6" as const) : ("IPv4" as const);
    this.#listener = listener;

    return 0;
  }

  #doConnect(ip: string, port: number, family: number): number {
    this.#remoteAddress = ip;
    this.#remotePort = port;
    this.#remoteFamily = family === AF_INET6
      ? ("IPv6" as const)
      : ("IPv4" as const);

    return 0;
  }

  #doSend(
    req: SendWrap,
    bufs: MessageType[],
    _count: number,
    args: [number, string, boolean] | [boolean],
    _family: number,
  ): number {
    let hasCallback: boolean;

    if (args.length === 3) {
      this.#remotePort = args[0] as number;
      this.#remoteAddress = args[1] as string;
      hasCallback = args[2] as boolean;
    } else {
      hasCallback = args[0] as boolean;
    }

    const addr: Deno.NetAddr = {
      hostname: this.#remoteAddress!,
      port: this.#remotePort!,
      transport: "udp",
    };

    // Deno.DatagramConn.prototype.send accepts only one Uint8Array
    const payload = new Uint8Array(
      Buffer.concat(
        bufs.map((buf) => {
          if (typeof buf === "string") {
            return Buffer.from(buf);
          }

          return Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength);
        }),
      ),
    );

    (async () => {
      let sent: number;
      let err: number | null = null;

      try {
        sent = await this.#listener!.send(payload, addr);
      } catch (e) {
        // TODO(cmorten): map errors to appropriate error codes.
        if (e instanceof Deno.errors.BadResource) {
          err = codeMap.get("EBADF")!;
        } else if (
          e instanceof Error &&
          e.message.match(/os error (40|90|10040)/)
        ) {
          err = codeMap.get("EMSGSIZE")!;
        } else {
          err = codeMap.get("UNKNOWN")!;
        }

        sent = 0;
      }

      if (hasCallback) {
        try {
          req.oncomplete(err, sent);
        } catch {
          // swallow callback errors
        }
      }
    })();

    return 0;
  }

  async #receive() {
    if (!this.#receiving) {
      return;
    }

    const p = new Uint8Array(this.#recvBufferSize);

    let buf: Uint8Array;
    let remoteAddr: Deno.NetAddr | null;
    let nread: number | null;

    if (this.#unrefed) {
      this.#listener!.unref();
    }

    try {
      [buf, remoteAddr] = (await this.#listener!.receive(p)) as [
        Uint8Array,
        Deno.NetAddr,
      ];

      nread = buf.length;
    } catch (e) {
      // TODO(cmorten): map errors to appropriate error codes.
      if (
        e instanceof Deno.errors.Interrupted ||
        e instanceof Deno.errors.BadResource
      ) {
        nread = 0;
      } else {
        nread = codeMap.get("UNKNOWN")!;
      }

      buf = new Uint8Array(0);
      remoteAddr = null;
    }

    nread ??= 0;

    const rinfo = remoteAddr
      ? {
        address: remoteAddr.hostname,
        port: remoteAddr.port,
        family: isIP(remoteAddr.hostname) === 6
          ? ("IPv6" as const)
          : ("IPv4" as const),
      }
      : undefined;

    try {
      this.onmessage(nread, this, Buffer.from(buf), rinfo);
    } catch {
      // swallow callback errors.
    }

    this.#receive();
  }

  /** Handle socket closure. */
  override _onClose(): number {
    this.#receiving = false;

    this.#address = undefined;
    this.#port = undefined;
    this.#family = undefined;

    try {
      this.#listener!.close();
    } catch {
      // listener already closed
    }

    this.#listener = undefined;

    return 0;
  }
}
