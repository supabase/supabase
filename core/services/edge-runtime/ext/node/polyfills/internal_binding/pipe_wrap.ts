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

// This module ports:
// - https://github.com/nodejs/node/blob/master/src/pipe_wrap.cc
// - https://github.com/nodejs/node/blob/master/src/pipe_wrap.h

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { notImplemented } from "ext:deno_node/_utils.ts";
import { unreachable } from "ext:deno_node/_util/asserts.ts";
import { ConnectionWrap } from "ext:deno_node/internal_binding/connection_wrap.ts";
import {
  AsyncWrap,
  providerType,
} from "ext:deno_node/internal_binding/async_wrap.ts";
import { LibuvStreamWrap } from "ext:deno_node/internal_binding/stream_wrap.ts";
import { codeMap } from "ext:deno_node/internal_binding/uv.ts";
import { delay } from "ext:deno_node/_util/async.ts";
import {
  kStreamBaseField,
  StreamBase,
} from "ext:deno_node/internal_binding/stream_wrap.ts";
import {
  ceilPowOf2,
  INITIAL_ACCEPT_BACKOFF_DELAY,
  MAX_ACCEPT_BACKOFF_DELAY,
} from "ext:deno_node/internal_binding/_listen.ts";
import { isWindows } from "ext:deno_node/_util/os.ts";
import { fs } from "ext:deno_node/internal_binding/constants.ts";

export enum socketType {
  SOCKET,
  SERVER,
  IPC,
}

export class Pipe extends ConnectionWrap {
  override reading = false;
  ipc: boolean;

  // REF: https://github.com/nodejs/node/blob/master/deps/uv/src/win/pipe.c#L48
  #pendingInstances = 4;

  #address?: string;

  #backlog?: number;
  #listener!: Deno.Listener;
  #connections = 0;

  #closed = false;
  #acceptBackoffDelay?: number;

  constructor(type: number, conn?: Deno.UnixConn | StreamBase) {
    let provider: providerType;
    let ipc: boolean;

    switch (type) {
      case socketType.SOCKET: {
        provider = providerType.PIPEWRAP;
        ipc = false;

        break;
      }
      case socketType.SERVER: {
        provider = providerType.PIPESERVERWRAP;
        ipc = false;

        break;
      }
      case socketType.IPC: {
        provider = providerType.PIPEWRAP;
        ipc = true;

        break;
      }
      default: {
        unreachable();
      }
    }

    super(provider, conn);

    this.ipc = ipc;

    if (conn && provider === providerType.PIPEWRAP && "localAddr" in conn) {
      const localAddr = conn.localAddr;
      this.#address = localAddr.path;
    }
  }

  open(_fd: number): number {
    // REF: https://github.com/denoland/deno/issues/6529
    notImplemented("Pipe.prototype.open");
  }

  /**
   * Bind to a Unix domain or Windows named pipe.
   * @param name Unix domain or Windows named pipe the server should listen to.
   * @return An error status code.
   */
  bind(name: string) {
    // Deno doesn't currently separate bind from connect. For now we noop under
    // the assumption we will connect shortly.
    // REF: https://doc.deno.land/deno/unstable/~/Deno.connect

    this.#address = name;

    return 0;
  }

  /**
   * Connect to a Unix domain or Windows named pipe.
   * @param req A PipeConnectWrap instance.
   * @param address Unix domain or Windows named pipe the server should connect to.
   * @return An error status code.
   */
  connect(req: PipeConnectWrap, address: string) {
    if (isWindows) {
      // REF: https://github.com/denoland/deno/issues/10244
      notImplemented("Pipe.prototype.connect - Windows");
    }

    const connectOptions: Deno.UnixConnectOptions = {
      path: address,
      transport: "unix",
    };

    Deno.connect(connectOptions).then(
      (conn: Deno.UnixConn) => {
        const localAddr = conn.localAddr as Deno.UnixAddr;

        this.#address = req.address = localAddr.path;
        this[kStreamBaseField] = conn;

        try {
          this.afterConnect(req, 0);
        } catch {
          // swallow callback errors.
        }
      },
      (e) => {
        const code = codeMap.get(e.code ?? "UNKNOWN") ??
          codeMap.get("UNKNOWN")!;

        try {
          this.afterConnect(req, code);
        } catch {
          // swallow callback errors.
        }
      },
    );

    return 0;
  }

  /**
   * Listen for new connections.
   * @param backlog The maximum length of the queue of pending connections.
   * @return An error status code.
   */
  listen(backlog: number): number {
    if (isWindows) {
      // REF: https://github.com/denoland/deno/issues/10244
      notImplemented("Pipe.prototype.listen - Windows");
    }

    this.#backlog = isWindows
      ? this.#pendingInstances
      : ceilPowOf2(backlog + 1);

    const listenOptions = {
      path: this.#address!,
      transport: "unix" as const,
    };

    let listener;

    try {
      listener = Deno.listen(listenOptions);
    } catch (e) {
      if (e instanceof Deno.errors.NotCapable) {
        throw e;
      }
      return codeMap.get(e.code ?? "UNKNOWN") ?? codeMap.get("UNKNOWN")!;
    }

    const address = listener.addr as Deno.UnixAddr;
    this.#address = address.path;

    this.#listener = listener;
    this.#accept();

    return 0;
  }

  override ref() {
    if (this.#listener) {
      this.#listener.ref();
    }
  }

  override unref() {
    if (this.#listener) {
      this.#listener.unref();
    }
  }

  /**
   * Set the number of pending pipe instance handles when the pipe server is
   * waiting for connections. This setting applies to Windows only.
   * @param instances Number of pending pipe instances.
   */
  setPendingInstances(instances: number) {
    this.#pendingInstances = instances;
  }

  /**
   * Alters pipe permissions, allowing it to be accessed from processes run by
   * different users. Makes the pipe writable or readable by all users. Mode
   * can be `UV_WRITABLE`, `UV_READABLE` or `UV_WRITABLE | UV_READABLE`. This
   * function is blocking.
   * @param mode Pipe permissions mode.
   * @return An error status code.
   */
  fchmod(mode: number) {
    if (
      mode != constants.UV_READABLE &&
      mode != constants.UV_WRITABLE &&
      mode != (constants.UV_WRITABLE | constants.UV_READABLE)
    ) {
      return codeMap.get("EINVAL");
    }

    let desiredMode = 0;

    if (mode & constants.UV_READABLE) {
      desiredMode |= fs.S_IRUSR | fs.S_IRGRP | fs.S_IROTH;
    }
    if (mode & constants.UV_WRITABLE) {
      desiredMode |= fs.S_IWUSR | fs.S_IWGRP | fs.S_IWOTH;
    }

    // TODO(cmorten): this will incorrectly throw on Windows
    // REF: https://github.com/denoland/deno/issues/4357
    try {
      Deno.chmodSync(this.#address!, desiredMode);
    } catch {
      // TODO(cmorten): map errors to appropriate error codes.
      return codeMap.get("UNKNOWN")!;
    }

    return 0;
  }

  /** Handle backoff delays following an unsuccessful accept. */
  async #acceptBackoff() {
    // Backoff after transient errors to allow time for the system to
    // recover, and avoid blocking up the event loop with a continuously
    // running loop.
    if (!this.#acceptBackoffDelay) {
      this.#acceptBackoffDelay = INITIAL_ACCEPT_BACKOFF_DELAY;
    } else {
      this.#acceptBackoffDelay *= 2;
    }

    if (this.#acceptBackoffDelay >= MAX_ACCEPT_BACKOFF_DELAY) {
      this.#acceptBackoffDelay = MAX_ACCEPT_BACKOFF_DELAY;
    }

    await delay(this.#acceptBackoffDelay);

    this.#accept();
  }

  /** Accept new connections. */
  async #accept(): Promise<void> {
    if (this.#closed) {
      return;
    }

    if (this.#connections > this.#backlog!) {
      this.#acceptBackoff();

      return;
    }

    let connection: Deno.Conn;

    try {
      connection = await this.#listener.accept();
    } catch (e) {
      if (e instanceof Deno.errors.BadResource && this.#closed) {
        // Listener and server has closed.
        return;
      }

      try {
        // TODO(cmorten): map errors to appropriate error codes.
        this.onconnection!(codeMap.get("UNKNOWN")!, undefined);
      } catch {
        // swallow callback errors.
      }

      this.#acceptBackoff();

      return;
    }

    // Reset the backoff delay upon successful accept.
    this.#acceptBackoffDelay = undefined;

    const connectionHandle = new Pipe(socketType.SOCKET, connection);
    this.#connections++;

    try {
      this.onconnection!(0, connectionHandle);
    } catch {
      // swallow callback errors.
    }

    return this.#accept();
  }

  /** Handle server closure. */
  override _onClose(): number {
    this.#closed = true;
    this.reading = false;

    this.#address = undefined;

    this.#backlog = undefined;
    this.#connections = 0;
    this.#acceptBackoffDelay = undefined;

    if (this.provider === providerType.PIPESERVERWRAP) {
      try {
        this.#listener.close();
      } catch {
        // listener already closed
      }
    }

    return LibuvStreamWrap.prototype._onClose.call(this);
  }
}

export class PipeConnectWrap extends AsyncWrap {
  oncomplete!: (
    status: number,
    handle: ConnectionWrap,
    req: PipeConnectWrap,
    readable: boolean,
    writeable: boolean,
  ) => void;
  address!: string;

  constructor() {
    super(providerType.PIPECONNECTWRAP);
  }
}

export enum constants {
  SOCKET = socketType.SOCKET,
  SERVER = socketType.SERVER,
  IPC = socketType.IPC,
  UV_READABLE = 1,
  UV_WRITABLE = 2,
}
