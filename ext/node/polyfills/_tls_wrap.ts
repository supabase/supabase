// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file no-explicit-any prefer-primordials

import {
  ObjectAssign,
  StringPrototypeReplace,
} from "ext:deno_node/internal/primordials.mjs";
import assert from "ext:deno_node/internal/assert.mjs";
import * as net from "node:net";
import { createSecureContext } from "node:_tls_common";
import { kStreamBaseField } from "ext:deno_node/internal_binding/stream_wrap.ts";
import { connResetException } from "ext:deno_node/internal/errors.ts";
import { emitWarning } from "node:process";
import { debuglog } from "ext:deno_node/internal/util/debuglog.ts";
import {
  constants as TCPConstants,
  TCP,
} from "ext:deno_node/internal_binding/tcp_wrap.ts";
import {
  constants as PipeConstants,
  Pipe,
} from "ext:deno_node/internal_binding/pipe_wrap.ts";
import { EventEmitter } from "node:events";
import { kEmptyObject } from "ext:deno_node/internal/util.mjs";
import { nextTick } from "ext:deno_node/_next_tick.ts";
import { kHandle } from "ext:deno_node/internal/stream_base_commons.ts";
import {
  isAnyArrayBuffer,
  isArrayBufferView,
} from "ext:deno_node/internal/util/types.ts";

const kConnectOptions = Symbol("connect-options");
const kIsVerified = Symbol("verified");
const kPendingSession = Symbol("pendingSession");
const kRes = Symbol("res");

let debug = debuglog("tls", (fn) => {
  debug = fn;
});

function onConnectEnd(this: any) {
  // NOTE: This logic is shared with _http_client.js
  if (!this._hadError) {
    const options = this[kConnectOptions];
    this._hadError = true;
    const error: any = connResetException(
      "Client network socket disconnected " +
        "before secure TLS connection was " +
        "established",
    );
    error.path = options.path;
    error.host = options.host;
    error.port = options.port;
    error.localAddress = options.localAddress;
    this.destroy(error);
  }
}

export class TLSSocket extends net.Socket {
  _tlsOptions: any;
  _secureEstablished: boolean;
  _securePending: boolean;
  _newSessionPending: boolean;
  _controlReleased: boolean;
  secureConnecting: boolean;
  _SNICallback: any;
  servername: string | null;
  alpnProtocol: string | boolean | null;
  alpnProtocols: string[] | null;
  authorized: boolean;
  authorizationError: any;
  [kRes]: any;
  [kIsVerified]: boolean;
  [kPendingSession]: any;
  [kConnectOptions]: any;
  ssl: any;

  _start() {
    this[kHandle].afterConnect();
  }

  constructor(socket: any, opts: any = kEmptyObject) {
    const tlsOptions = { ...opts };

    const hostname = opts.servername ?? opts.host ?? socket._host;
    tlsOptions.hostname = hostname;

    const _cert = tlsOptions?.secureContext?.cert;
    const _key = tlsOptions?.secureContext?.key;

    let caCerts = tlsOptions?.secureContext?.ca;
    if (typeof caCerts === "string") caCerts = [caCerts];
    else if (isArrayBufferView(caCerts) || isAnyArrayBuffer(caCerts)) {
      caCerts = [new TextDecoder().decode(caCerts)];
    }
    tlsOptions.caCerts = caCerts;
    tlsOptions.alpnProtocols = opts.ALPNProtocols;

    super({
      handle: _wrapHandle(tlsOptions, socket),
      ...opts,
      manualStart: true, // This prevents premature reading from TLS handle
    });
    if (socket) {
      this.on("close", () => this._parent?.emit("close"));
      this._parent = socket;
    }
    this._tlsOptions = tlsOptions;
    this._secureEstablished = false;
    this._securePending = false;
    this._newSessionPending = false;
    this._controlReleased = false;
    this.secureConnecting = true;
    this._SNICallback = null;
    this.servername = null;
    this.alpnProtocol = null;
    this.alpnProtocols = tlsOptions.ALPNProtocols;
    this.authorized = false;
    this.authorizationError = null;
    this[kRes] = null;
    this[kIsVerified] = false;
    this[kPendingSession] = null;

    this.ssl = new class {
      verifyError() {
        return null; // Never fails, rejectUnauthorized is always true in Deno.
      }
    }();

    // deno-lint-ignore no-this-alias
    const tlssock = this;

    /** Wraps the given socket and adds the tls capability to the underlying
     * handle */
    function _wrapHandle(tlsOptions: any, wrap: net.Socket | undefined) {
      let handle: any;

      if (wrap) {
        handle = wrap._handle;
      }

      const options = tlsOptions;
      if (!handle) {
        handle = options.pipe
          ? new Pipe(PipeConstants.SOCKET)
          : new TCP(TCPConstants.SOCKET);
      }

      const { promise, resolve } = Promise.withResolvers();

      // Patches `afterConnect` hook to replace TCP conn with TLS conn
      const afterConnect = handle.afterConnect;
      handle.afterConnect = async (req: any, status: number) => {
        options.hostname ??= undefined; // coerce to undefined if null, startTls expects hostname to be undefined

        try {
          const conn = await Deno.startTls(handle[kStreamBaseField], options);
          try {
            const hs = await conn.handshake();
            if (hs.alpnProtocol) {
              tlssock.alpnProtocol = hs.alpnProtocol;
            } else {
              tlssock.alpnProtocol = false;
            }
          } catch {
            // Don't interrupt "secure" event to let the first read/write
            // operation emit the error.
          }

          // Assign the TLS connection to the handle and resume reading.
          handle[kStreamBaseField] = conn;
          handle.upgrading = false;
          if (!handle.pauseOnCreate) {
            handle.readStart();
          }

          resolve();

          tlssock.emit("secure");
          tlssock.removeListener("end", onConnectEnd);
        } catch {
          // TODO(kt3k): Handle this
        }
        return afterConnect.call(handle, req, status);
      };

      handle.upgrading = promise;
      (handle as any).verifyError = function () {
        return null; // Never fails, rejectUnauthorized is always true in Deno.
      };
      // Pretends `handle` is `tls_wrap.wrap(handle, ...)` to make some npm modules happy
      // An example usage of `_parentWrap` in npm module:
      // https://github.com/szmarczak/http2-wrapper/blob/51eeaf59ff9344fb192b092241bfda8506983620/source/utils/js-stream-socket.js#L6
      handle._parent = handle;
      handle._parentWrap = wrap;

      return handle;
    }
  }

  _tlsError(err: Error) {
    this.emit("_tlsError", err);
    if (this._controlReleased) {
      return err;
    }
    return null;
  }

  _releaseControl() {
    if (this._controlReleased) {
      return false;
    }
    this._controlReleased = true;
    this.removeListener("error", this._tlsError);
    return true;
  }

  getEphemeralKeyInfo() {
    return {};
  }

  isSessionReused() {
    return false;
  }

  setSession(_session: any) {
    // TODO(kt3k): implement this
  }

  setServername(_servername: any) {
    // TODO(kt3k): implement this
  }

  getPeerCertificate(_detailed: boolean) {
    // TODO(kt3k): implement this
    return {
      subject: "localhost",
      subjectaltname: "IP Address:127.0.0.1, IP Address:::1",
    };
  }
}

function normalizeConnectArgs(listArgs: any) {
  const args = net._normalizeArgs(listArgs);
  const options = args[0];
  const cb = args[1];

  // If args[0] was options, then normalize dealt with it.
  // If args[0] is port, or args[0], args[1] is host, port, we need to
  // find the options and merge them in, normalize's options has only
  // the host/port/path args that it knows about, not the tls options.
  // This means that options.host overrides a host arg.
  if (listArgs[1] !== null && typeof listArgs[1] === "object") {
    ObjectAssign(options, listArgs[1]);
  } else if (listArgs[2] !== null && typeof listArgs[2] === "object") {
    ObjectAssign(options, listArgs[2]);
  }

  return cb ? [options, cb] : [options];
}

let ipServernameWarned = false;

export function Server(options: any, listener: any) {
  return new ServerImpl(options, listener);
}

export class ServerImpl extends EventEmitter {
  listener?: Deno.TlsListener;
  #closed = false;
  constructor(public options: any, listener: any) {
    super();
    if (listener) {
      this.on("secureConnection", listener);
    }
  }

  listen(port: any, callback: any): this {
    const key = this.options.key?.toString();
    const cert = this.options.cert?.toString();
    // TODO(kt3k): The default host should be "localhost"
    const hostname = this.options.host ?? "0.0.0.0";

    this.listener = Deno.listenTls({ port, hostname, cert, key });

    callback?.call(this);
    this.#listen(this.listener);
    return this;
  }

  async #listen(listener: Deno.TlsListener) {
    while (!this.#closed) {
      try {
        // Creates TCP handle and socket directly from Deno.TlsConn.
        // This works as TLS socket. We don't use TLSSocket class for doing
        // this because Deno.startTls only supports client side tcp connection.
        // TODO(@satyarohith): set TLSSocket.alpnProtocol when we use TLSSocket class.
        const handle = new TCP(TCPConstants.SOCKET, await listener.accept());
        const socket = new net.Socket({ handle });
        this.emit("secureConnection", socket);
      } catch (e) {
        if (e instanceof Deno.errors.BadResource) {
          this.#closed = true;
        }
        // swallow
      }
    }
  }

  close(cb?: (err?: Error) => void): this {
    if (this.listener) {
      this.listener.close();
    }
    cb?.();
    nextTick(() => {
      this.emit("close");
    });
    return this;
  }

  address() {
    const addr = this.listener!.addr as Deno.NetAddr;
    return {
      port: addr.port,
      address: addr.hostname,
    };
  }
}

Server.prototype = ServerImpl.prototype;

export function createServer(options: any, listener: any) {
  return new ServerImpl(options, listener);
}

function onConnectSecure(this: TLSSocket) {
  this.authorized = true;
  this.secureConnecting = false;
  debug("client emit secureConnect. authorized:", this.authorized);
  this.emit("secureConnect");

  this.removeListener("end", onConnectEnd);
}

export function connect(...args: any[]) {
  args = normalizeConnectArgs(args);
  let options = args[0];
  const cb = args[1];
  const allowUnauthorized = getAllowUnauthorized();

  options = {
    rejectUnauthorized: !allowUnauthorized,
    ciphers: DEFAULT_CIPHERS,
    checkServerIdentity,
    minDHSize: 1024,
    ...options,
  };

  if (!options.keepAlive) {
    options.singleUse = true;
  }

  assert(typeof options.checkServerIdentity === "function");
  assert(
    typeof options.minDHSize === "number",
    "options.minDHSize is not a number: " + options.minDHSize,
  );
  assert(
    options.minDHSize > 0,
    "options.minDHSize is not a positive number: " +
      options.minDHSize,
  );

  const context = options.secureContext || createSecureContext(options);

  const tlssock = new TLSSocket(options.socket, {
    allowHalfOpen: options.allowHalfOpen,
    pipe: !!options.path,
    secureContext: context,
    isServer: false,
    requestCert: true,
    rejectUnauthorized: options.rejectUnauthorized !== false,
    session: options.session,
    ALPNProtocols: options.ALPNProtocols,
    requestOCSP: options.requestOCSP,
    enableTrace: options.enableTrace,
    pskCallback: options.pskCallback,
    highWaterMark: options.highWaterMark,
    onread: options.onread,
    signal: options.signal,
    ...options, // Caveat emptor: Node does not do this.
  });

  // rejectUnauthorized property can be explicitly defined as `undefined`
  // causing the assignment to default value (`true`) fail. Before assigning
  // it to the tlssock connection options, explicitly check if it is false
  // and update rejectUnauthorized property. The property gets used by TLSSocket
  // connection handler to allow or reject connection if unauthorized
  options.rejectUnauthorized = options.rejectUnauthorized !== false;

  tlssock[kConnectOptions] = options;

  if (cb) {
    tlssock.once("secureConnect", cb);
  }

  if (!options.socket) {
    // If user provided the socket, it's their responsibility to manage its
    // connectivity. If we created one internally, we connect it.
    if (options.timeout) {
      tlssock.setTimeout(options.timeout);
    }

    tlssock.connect(options, tlssock._start);
  }

  tlssock._releaseControl();

  if (options.session) {
    tlssock.setSession(options.session);
  }

  if (options.servername) {
    if (!ipServernameWarned && net.isIP(options.servername)) {
      emitWarning(
        "Setting the TLS ServerName to an IP address is not permitted by " +
          "RFC 6066. This will be ignored in a future version.",
        "DeprecationWarning",
        "DEP0123",
      );
      ipServernameWarned = true;
    }
    tlssock.setServername(options.servername);
  }

  if (options.socket) {
    tlssock._start();
  }

  tlssock.on("secure", onConnectSecure);
  tlssock.prependListener("end", onConnectEnd);

  return tlssock;
}

function getAllowUnauthorized() {
  return false;
}

// TODO(kt3k): Implement this when Deno provides APIs for getting peer
// certificates.
export function checkServerIdentity(_hostname: string, _cert: any) {
}

function unfqdn(host: string): string {
  return StringPrototypeReplace(host, /[.]$/, "");
}

// Order matters. Mirrors ALL_CIPHER_SUITES from rustls/src/suites.rs but
// using openssl cipher names instead. Mutable in Node but not (yet) in Deno.
export const DEFAULT_CIPHERS = [
  // TLSv1.3 suites
  "AES256-GCM-SHA384",
  "AES128-GCM-SHA256",
  "TLS_CHACHA20_POLY1305_SHA256",
  // TLSv1.2 suites
  "ECDHE-ECDSA-AES256-GCM-SHA384",
  "ECDHE-ECDSA-AES128-GCM-SHA256",
  "ECDHE-ECDSA-CHACHA20-POLY1305",
  "ECDHE-RSA-AES256-GCM-SHA384",
  "ECDHE-RSA-AES128-GCM-SHA256",
  "ECDHE-RSA-CHACHA20-POLY1305",
].join(":");

export default {
  TLSSocket,
  connect,
  createServer,
  checkServerIdentity,
  DEFAULT_CIPHERS,
  Server,
  unfqdn,
};
