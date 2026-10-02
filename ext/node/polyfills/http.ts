// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { core, internals, primordials } from "ext:core/mod.js";
import {
  op_check_outbound_rate_limit,
  op_http_upgrade_raw2,
  op_node_http_fetch_response_upgrade,
  op_node_http_fetch_send,
  op_node_http_request,
} from "ext:core/ops";

import { TextEncoder } from "ext:deno_web/08_text_encoding.js";
import { setTimeout } from "ext:deno_web/02_timers.js";
import { updateSpanFromError } from "ext:deno_telemetry/util.ts";
import {
  _normalizeArgs,
  // createConnection,
  ListenOptions,
  Socket,
} from "node:net";
import { Buffer } from "node:buffer";
import { ERR_SERVER_NOT_RUNNING } from "ext:deno_node/internal/errors.ts";
import { EventEmitter } from "node:events";
import { nextTick } from "ext:deno_node/_next_tick.ts";
import {
  validateBoolean,
  validateInteger,
  validateObject,
  validatePort,
} from "ext:deno_node/internal/validators.mjs";
import {
  addAbortSignal,
  Duplex as NodeDuplex,
  finished,
  Readable as NodeReadable,
  Writable as NodeWritable,
  WritableOptions as NodeWritableOptions,
} from "node:stream";
import {
  kUniqueHeaders,
  OutgoingMessage,
  parseUniqueHeadersOption,
  validateHeaderName,
  validateHeaderValue,
} from "node:_http_outgoing";
import { ok as assert } from "node:assert";
import { kOutHeaders } from "ext:deno_node/internal/http.ts";
import { _checkIsHttpToken as checkIsHttpToken } from "node:_http_common";
import { Agent, globalAgent } from "node:_http_agent";
import { urlToHttpOptions } from "ext:deno_node/internal/url.ts";
import { kEmptyObject } from "ext:deno_node/internal/util.mjs";
import { constants, TCP } from "ext:deno_node/internal_binding/tcp_wrap.ts";
import { notImplemented, warnNotImplemented } from "ext:deno_node/_utils.ts";
import {
  connResetException,
  ERR_HTTP_HEADERS_SENT,
  ERR_HTTP_SOCKET_ASSIGNED,
  ERR_INVALID_ARG_TYPE,
  ERR_INVALID_HTTP_TOKEN,
  ERR_INVALID_PROTOCOL,
  ERR_UNESCAPED_CHARACTERS,
} from "ext:deno_node/internal/errors.ts";
import { getTimerDuration } from "ext:deno_node/internal/timers.mjs";
// import { serve, upgradeHttpRaw } from "ext:deno_http/00_serve.ts";
import { createHttpClient } from "ext:deno_fetch/22_http_client.js";
import { headersEntries } from "ext:deno_fetch/20_headers.js";
import {
  builtinTracer,
  ContextManager,
  enterSpan,
  PROPAGATORS,
  restoreSnapshot,
  TRACING_ENABLED,
} from "ext:deno_telemetry/telemetry.ts";
import { timerId } from "ext:deno_web/03_abort_signal.js";
import { clearTimeout as webClearTimeout } from "ext:deno_web/02_timers.js";
import { resourceForReadableStream } from "ext:deno_web/06_streams.js";
import { UpgradedConn } from "ext:deno_net/01_net.js";
import { STATUS_CODES } from "node:_http_server";
import { methods as METHODS } from "node:_http_common";
import { deprecate } from "node:util";

const { internalRidSymbol } = core;
const { ArrayIsArray, StringPrototypeToLowerCase, SafeArrayIterator } =
  primordials;

type Chunk = string | Buffer | Uint8Array;

const ENCODER = new TextEncoder();

export interface RequestOptions {
  agent?: Agent;
  auth?: string;
  createConnection?: () => unknown;
  defaultPort?: number;
  family?: number;
  headers?: Record<string, string>;
  hints?: number;
  host?: string;
  hostname?: string;
  insecureHTTPParser?: boolean;
  localAddress?: string;
  localPort?: number;
  lookup?: () => void;
  maxHeaderSize?: number;
  method?: string;
  path?: string;
  port?: number;
  protocol?: string;
  setHost?: boolean;
  socketPath?: string;
  timeout?: number;
  signal?: AbortSignal;
  href?: string;
}

function validateHost(host, name) {
  if (host !== null && host !== undefined && typeof host !== "string") {
    throw new ERR_INVALID_ARG_TYPE(`options.${name}`, [
      "string",
      "undefined",
      "null",
    ], host);
  }
  return host;
}

const INVALID_PATH_REGEX = /[^\u0021-\u00ff]/;
const kError = Symbol("kError");

const kUniqueHeaders = Symbol("kUniqueHeaders");

class FakeSocket extends EventEmitter {
  constructor(
    opts: {
      encrypted?: boolean | undefined;
      remotePort?: number | undefined;
      remoteAddress?: string | undefined;
      reader?: ReadableStreamDefaultReader | undefined;
    } = {},
  ) {
    super();
    this.remoteAddress = opts.remoteAddress;
    this.remotePort = opts.remotePort;
    this.encrypted = opts.encrypted;
    this.reader = opts.reader;
    this.writable = true;
    this.readable = true;
  }

  setKeepAlive() {}

  end() {}

  destroy() {}

  setTimeout(callback, timeout = 0, ...args) {
    setTimeout(callback, timeout, args);
  }
}

/** ClientRequest represents the http(s) request from the client */
class ClientRequest extends OutgoingMessage {
  defaultProtocol = "http:";
  aborted = false;
  destroyed = false;
  agent: Agent;
  method: string;
  maxHeaderSize: number | undefined;
  insecureHTTPParser: boolean;
  useChunkedEncodingByDefault: boolean;
  path: string;
  _req: { requestRid: number; cancelHandleRid: number | null } | undefined;

  constructor(
    input: string | URL,
    options?: RequestOptions,
    cb?: (res: IncomingMessageForClient) => void,
  ) {
    super();

    if (typeof input === "string") {
      const urlStr = input;
      input = urlToHttpOptions(new URL(urlStr));
    } else if (input instanceof URL) {
      // url.URL instance
      input = urlToHttpOptions(input);
    } else {
      cb = options;
      options = input;
      input = null;
    }

    if (typeof options === "function") {
      cb = options;
      options = input || kEmptyObject;
    } else {
      options = Object.assign(input || {}, options);
    }

    let agent = options!.agent;
    const defaultAgent = options!._defaultAgent || globalAgent;
    if (agent === false) {
      agent = new defaultAgent.constructor();
    } else if (agent === null || agent === undefined) {
      if (typeof options!.createConnection !== "function") {
        agent = defaultAgent;
      }
      // Explicitly pass through this statement as agent will not be used
      // when createConnection is provided.
    } else if (typeof agent.addRequest !== "function") {
      throw new ERR_INVALID_ARG_TYPE("options.agent", [
        "Agent-like Object",
        "undefined",
        "false",
      ], agent);
    }
    this.agent = agent;

    const protocol = options!.protocol || defaultAgent.protocol;
    let expectedProtocol = defaultAgent.protocol;
    if (this.agent?.protocol) {
      expectedProtocol = this.agent!.protocol;
    }

    if (options!.path) {
      const path = String(options.path);
      if (INVALID_PATH_REGEX.exec(path) !== null) {
        throw new ERR_UNESCAPED_CHARACTERS("Request path");
      }
    }

    if (protocol !== expectedProtocol) {
      throw new ERR_INVALID_PROTOCOL(protocol, expectedProtocol);
    }

    const defaultPort = options!.defaultPort || this.agent?.defaultPort;

    const port = options!.port = options!.port || defaultPort || 80;
    const host = options!.host = validateHost(options!.hostname, "hostname") ||
      validateHost(options!.host, "host") || "localhost";

    const setHost = options!.setHost === undefined || Boolean(options!.setHost);

    this.socketPath = options!.socketPath;

    if (options!.timeout !== undefined) {
      this.setTimeout(options.timeout);
    }

    const signal = options!.signal;
    if (signal) {
      addAbortSignal(signal, this);
    }
    let method = options!.method;
    const methodIsString = typeof method === "string";
    if (method !== null && method !== undefined && !methodIsString) {
      throw new ERR_INVALID_ARG_TYPE("options.method", "string", method);
    }

    if (methodIsString && method) {
      if (!checkIsHttpToken(method)) {
        throw new ERR_INVALID_HTTP_TOKEN("Method", method);
      }
      method = this.method = method.toUpperCase();
    } else {
      method = this.method = "GET";
    }

    const maxHeaderSize = options!.maxHeaderSize;
    if (maxHeaderSize !== undefined) {
      validateInteger(maxHeaderSize, "maxHeaderSize", 0);
    }
    this.maxHeaderSize = maxHeaderSize;

    const insecureHTTPParser = options!.insecureHTTPParser;
    if (insecureHTTPParser !== undefined) {
      validateBoolean(insecureHTTPParser, "options.insecureHTTPParser");
    }

    this.insecureHTTPParser = insecureHTTPParser;

    if (options!.joinDuplicateHeaders !== undefined) {
      validateBoolean(
        options!.joinDuplicateHeaders,
        "options.joinDuplicateHeaders",
      );
    }

    this.joinDuplicateHeaders = options!.joinDuplicateHeaders;

    this.path = options!.path || "/";
    if (cb) {
      this.once("response", cb);
    }

    if (
      method === "GET" ||
      method === "HEAD" ||
      method === "DELETE" ||
      method === "OPTIONS" ||
      method === "TRACE" ||
      method === "CONNECT"
    ) {
      this.useChunkedEncodingByDefault = false;
    } else {
      this.useChunkedEncodingByDefault = true;
    }

    this._ended = false;
    this.res = null;
    this.aborted = false;
    this.upgradeOrConnect = false;
    this.parser = null;
    this.maxHeadersCount = null;
    this.reusedSocket = false;
    this.host = host;
    this.protocol = protocol;
    this.port = port;
    this.hash = options.hash;
    this.search = options.search;
    this.auth = options.auth;

    if (this.agent) {
      // If there is an agent we should default to Connection:keep-alive,
      // but only if the Agent will actually reuse the connection!
      // If it's not a keepAlive agent, and the maxSockets==Infinity, then
      // there's never a case where this socket will actually be reused
      if (!this.agent.keepAlive && !Number.isFinite(this.agent.maxSockets)) {
        this._last = true;
        this.shouldKeepAlive = false;
      } else {
        this._last = false;
        this.shouldKeepAlive = true;
      }
    }

    const headersArray = Array.isArray(options!.headers);
    if (!headersArray) {
      if (options!.headers) {
        const keys = Object.keys(options!.headers);
        // Retain for(;;) loop for performance reasons
        // Refs: https://github.com/nodejs/node/pull/30958
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          this.setHeader(key, options!.headers[key]);
        }
      }

      if (host && !this.getHeader("host") && setHost) {
        let hostHeader = host;

        // For the Host header, ensure that IPv6 addresses are enclosed
        // in square brackets, as defined by URI formatting
        // https://tools.ietf.org/html/rfc3986#section-3.2.2
        const posColon = hostHeader.indexOf(":");
        if (
          posColon !== -1 &&
          hostHeader.includes(":", posColon + 1) &&
          hostHeader.charCodeAt(0) !== 91 /* '[' */
        ) {
          hostHeader = `[${hostHeader}]`;
        }

        if (port && +port !== defaultPort) {
          hostHeader += ":" + port;
        }
        this.setHeader("Host", hostHeader);
      }

      if (options!.auth && !this.getHeader("Authorization")) {
        this.setHeader(
          "Authorization",
          "Basic " +
            Buffer.from(options!.auth).toString("base64"),
        );
      }

      if (this.getHeader("expect") && this._header) {
        throw new ERR_HTTP_HEADERS_SENT("render");
      }
    } else {
      for (const [key, val] of options!.headers) {
        this.setHeader(key, val);
      }
    }

    this[kUniqueHeaders] = parseUniqueHeadersOption(options!.uniqueHeaders);

    let optsWithoutSignal = options as RequestOptions;
    if (optsWithoutSignal.signal) {
      optsWithoutSignal = Object.assign({}, options);
      delete optsWithoutSignal.signal;
    }

    if (options!.createConnection) {
      warnNotImplemented("ClientRequest.options.createConnection");
    }

    if (options!.lookup) {
      notImplemented("ClientRequest.options.lookup");
    }

    // initiate connection
    // TODO(crowlKats): finish this
    /*if (this.agent) {
      this.agent.addRequest(this, optsWithoutSignal);
    } else {
      // No agent, default to Connection:close.
      this._last = true;
      this.shouldKeepAlive = false;
      if (typeof optsWithoutSignal.createConnection === "function") {
        const oncreate = once((err, socket) => {
          if (err) {
            this.emit("error", err);
          } else {
            this.onSocket(socket);
          }
        });

        try {
          const newSocket = optsWithoutSignal.createConnection(
            optsWithoutSignal,
            oncreate,
          );
          if (newSocket) {
            oncreate(null, newSocket);
          }
        } catch (err) {
          oncreate(err);
        }
      } else {
        debug("CLIENT use net.createConnection", optsWithoutSignal);
        this.onSocket(createConnection(optsWithoutSignal));
      }
    }*/
    this.onSocket(new FakeSocket({ encrypted: this._encrypted }));
  }

  _writeHeader() {
    const url = this._createUrlStrFromOptions();

    const headers = [];
    for (const key in this[kOutHeaders]) {
      if (Object.hasOwn(this[kOutHeaders], key)) {
        const entry = this[kOutHeaders][key];
        this._processHeader(headers, entry[0], entry[1], false);
      }
    }

    const client = this._getClient() ?? createHttpClient({ http2: false });
    this._client = client;

    if (
      this.method === "POST" || this.method === "PATCH" || this.method === "PUT"
    ) {
      const { readable, writable } = new TransformStream({
        cancel: (e) => {
          this._requestSendError = e;
        },
      });

      this._bodyWritable = writable;
      this._bodyWriter = writable.getWriter();

      this._bodyWriteRid = resourceForReadableStream(readable);
    }

    let span;
    let snapshot;
    if (TRACING_ENABLED) {
      span = builtinTracer().startSpan(this.method, { kind: 2 }); // Kind 2 = Client
      snapshot = enterSpan(span);
    }
    (async () => {
      try {
        const parsedUrl = new URL(url);
        if (span) {
          const context = ContextManager.active();
          for (const propagator of new SafeArrayIterator(PROPAGATORS)) {
            propagator.inject(context, headers, {
              set(carrier, key, value) {
                carrier.push([key, value]);
              },
            });
          }
          span.setAttribute("http.request.method", this.method);
          span.setAttribute("url.full", parsedUrl.href);
          span.setAttribute("url.scheme", parsedUrl.protocol.slice(0, -1));
          span.setAttribute("url.path", parsedUrl.pathname);
          span.setAttribute("url.query", parsedUrl.search.slice(1));
        }

        const traceId = internals.getRequestTraceId?.();
        const isTraced = traceId !== null && traceId !== undefined;
        const rlKey = isTraced ? traceId : "";
        // op returns u32::MAX when allowed, or retry_after_ms (< 0xFFFFFFFF) when denied.
        const rlResult = op_check_outbound_rate_limit(
          parsedUrl.href,
          rlKey,
          isTraced,
        );
        if (rlResult !== 0xFFFFFFFF) {
          const retryAfterMs = rlResult;
          const retryHint = retryAfterMs > 0
            ? ` Retry after ${retryAfterMs}ms.`
            : "";
          const msg = isTraced
            ? `Rate limit exceeded for trace ${rlKey}.${retryHint}`
            : `Rate limit exceeded for function.${retryHint}`;
          throw new Deno.errors.RateLimitError(msg, retryAfterMs);
        }

        this._req = op_node_http_request(
          this.method,
          url,
          headers,
          client[internalRidSymbol],
          this._bodyWriteRid,
        );

        const res = await op_node_http_fetch_send(this._req.requestRid);

        if (span) {
          span.setAttribute("http.response.status_code", res.status);
          if (res.status >= 400) {
            span.setAttribute("error.type", String(res.status));
            span.setStatus({ code: 2 }); // Code 2 = Error
          }
        }

        if (this._req.cancelHandleRid !== null) {
          core.tryClose(this._req.cancelHandleRid);
        }
        if (this._timeout) {
          this._timeout.removeEventListener("abort", this._timeoutCb);
          webClearTimeout(this._timeout[timerId]);
        }
        this._client.close();
        const incoming = new IncomingMessageForClient(this.socket);
        incoming.req = this;
        this.res = incoming;

        // TODO(@crowlKats):
        // incoming.httpVersionMajor = versionMajor;
        // incoming.httpVersionMinor = versionMinor;
        // incoming.httpVersion = `${versionMajor}.${versionMinor}`;
        // incoming.joinDuplicateHeaders = socket?.server?.joinDuplicateHeaders ||
        //  parser.joinDuplicateHeaders;

        incoming.url = res.url;
        incoming.statusCode = res.status;
        incoming.statusMessage = res.statusText;
        incoming.upgrade = null;

        for (const [key, _value] of res.headers) {
          if (key.toLowerCase() === "upgrade") {
            incoming.upgrade = true;
            break;
          }
        }

        incoming._addHeaderLines(
          res.headers,
          Object.entries(res.headers).flat().length,
        );

        if (incoming.upgrade) {
          if (this.listenerCount("upgrade") === 0) {
            // No listeners, so we got nothing to do
            // destroy?
            return;
          }

          if (this.method === "CONNECT") {
            throw new Error("not implemented CONNECT");
          }

          const upgradeRid = await op_node_http_fetch_response_upgrade(
            res.responseRid,
          );
          assert(typeof res.remoteAddrIp !== "undefined");
          assert(typeof res.remoteAddrIp !== "undefined");
          const conn = new UpgradedConn(
            upgradeRid,
            {
              transport: "tcp",
              hostname: res.remoteAddrIp,
              port: res.remoteAddrIp,
            },
            // TODO(bartlomieju): figure out actual values
            {
              transport: "tcp",
              hostname: "127.0.0.1",
              port: 80,
            },
          );
          const socket = new Socket({
            handle: new TCP(constants.SERVER, conn),
          });

          this.upgradeOrConnect = true;

          this.emit("upgrade", incoming, socket, Buffer.from([]));
          this.destroyed = true;
          this._closed = true;
          this.emit("close");
        } else {
          {
            incoming._bodyRid = res.responseRid;
          }
          this.emit("response", incoming);
        }
      } catch (err) {
        if (span) {
          updateSpanFromError(span, err);
        }

        if (this._req !== undefined && this._req.cancelHandleRid !== null) {
          core.tryClose(this._req.cancelHandleRid);
        }

        if (this._requestSendError !== undefined) {
          // if the request body stream errored, we want to propagate that error
          // instead of the original error from opFetchSend
          throw new TypeError(
            "Failed to fetch: request body stream errored",
            {
              cause: this._requestSendError,
            },
          );
        }

        if (
          err.message.includes("connection closed before message completed")
        ) {
          // Node.js seems ignoring this error
        } else if (err.message.includes("The signal has been aborted")) {
          // Remap this error
          this.emit("error", connResetException("socket hang up"));
        } else {
          this.emit("error", err);
        }
      } finally {
        span?.end();
      }
    })();

    if (snapshot) {
      restoreSnapshot(snapshot);
    }
  }

  _implicitHeader() {
    if (this._header) {
      throw new ERR_HTTP_HEADERS_SENT("render");
    }
    this._storeHeader(
      this.method + " " + this.path + " HTTP/1.1\r\n",
      this[kOutHeaders],
    );
  }

  _getClient(): Deno.HttpClient | undefined {
    return undefined;
  }

  // TODO(bartlomieju): handle error
  onSocket(socket, _err) {
    nextTick(() => {
      this.socket = socket;
      this.emit("socket", socket);
    });
  }

  // deno-lint-ignore no-explicit-any
  end(chunk?: any, encoding?: any, cb?: any): this {
    // Do nothing if request is already destroyed.
    if (this.destroyed) return this;

    if (typeof chunk === "function") {
      cb = chunk;
      chunk = null;
      encoding = null;
    } else if (typeof encoding === "function") {
      cb = encoding;
      encoding = null;
    }

    this.finished = true;
    if (chunk) {
      this.write_(chunk, encoding, null, true);
    } else if (!this._headerSent) {
      this._contentLength = 0;
      this._implicitHeader();
      this._send("", "latin1");
    }
    (async () => {
      try {
        await this._bodyWriter?.close();
      } catch (_) {
        // The readable stream resource is dropped right after
        // read is complete closing the writable stream resource.
        // If we try to close the writer again, it will result in an
        // error which we can safely ignore.
      }
      try {
        cb?.();
      } catch (_) {
        //
      }
    })();

    return this;
  }

  abort() {
    if (this.aborted) {
      return;
    }
    this.aborted = true;
    this.emit("abort");
    //process.nextTick(emitAbortNT, this);
    this.destroy();
  }

  // deno-lint-ignore no-explicit-any
  destroy(err?: any) {
    if (this.destroyed) {
      return this;
    }
    this.destroyed = true;

    const rid = this._client?.[internalRidSymbol];
    if (rid) {
      core.tryClose(rid);
    }

    // Request might be closed before we actually made it
    if (this._req !== undefined && this._req.cancelHandleRid !== null) {
      core.tryClose(this._req.cancelHandleRid);
    }
    // If we're aborting, we don't care about any more response data.
    if (this.res) {
      this.res._dump();
    }

    this[kError] = err;
    this.socket?.destroy(err);

    return this;
  }

  _createCustomClient(): Promise<Deno.HttpClient | undefined> {
    return Promise.resolve(undefined);
  }

  _createUrlStrFromOptions(): string {
    if (this.href) {
      return this.href;
    }
    const protocol = this.protocol ?? this.defaultProtocol;
    const auth = this.auth;
    const host = this.host ?? this.hostname ?? "localhost";
    const hash = this.hash ? `#${this.hash}` : "";
    const defaultPort = this.agent?.defaultPort;
    const port = this.port ?? defaultPort ?? 80;
    let path = this.path ?? "/";
    if (!path.startsWith("/")) {
      path = "/" + path;
    }
    const url = new URL(
      `${protocol}//${auth ? `${auth}@` : ""}${host}${
        port === 80 ? "" : `:${port}`
      }${path}`,
    );
    url.hash = hash;
    return url.href;
  }

  setTimeout(msecs: number, callback?: () => void) {
    if (msecs === 0) {
      if (this._timeout) {
        this.removeAllListeners("timeout");
        this._timeout.removeEventListener("abort", this._timeoutCb);
        this._timeout = undefined;
      }

      return this;
    }
    if (this._ended || this._timeout) {
      return this;
    }

    msecs = getTimerDuration(msecs, "msecs");
    if (callback) this.once("timeout", callback);

    const timeout = AbortSignal.timeout(msecs);
    this._timeoutCb = () => this.emit("timeout");
    timeout.addEventListener("abort", this._timeoutCb);
    this._timeout = timeout;

    return this;
  }

  _processHeader(headers, key, value, validate) {
    if (validate) {
      validateHeaderName(key);
    }

    // If key is content-disposition and there is content-length
    // encode the value in latin1
    // https://www.rfc-editor.org/rfc/rfc6266#section-4.3
    // Refs: https://github.com/nodejs/node/pull/46528
    if (isContentDispositionField(key) && this._contentLength) {
      value = Buffer.from(value).toString("latin1");
    }

    if (Array.isArray(value)) {
      if (
        (value.length < 2 || !isCookieField(key)) &&
        (!this[kUniqueHeaders] || !this[kUniqueHeaders].has(key.toLowerCase()))
      ) {
        // Retain for(;;) loop for performance reasons
        // Refs: https://github.com/nodejs/node/pull/30958
        for (let i = 0; i < value.length; i++) {
          headers.push([key, value[i]]);
        }
        return;
      }
      value = value.join("; ");
    }
    headers.push([key, value]);
  }

  // Once a socket is assigned to this request and is connected socket.setNoDelay() will be called.
  setNoDelay() {
    this.socket?.setNoDelay?.();
  }
}

// isCookieField performs a case-insensitive comparison of a provided string
// against the word "cookie." As of V8 6.6 this is faster than handrolling or
// using a case-insensitive RegExp.
function isCookieField(s) {
  return s.length === 6 && s.toLowerCase() === "cookie";
}

function isContentDispositionField(s) {
  return s.length === 19 &&
    s.toLowerCase() === "content-disposition";
}

const kHeaders = Symbol("kHeaders");
const kHeadersDistinct = Symbol("kHeadersDistinct");
const kHeadersCount = Symbol("kHeadersCount");
const kTrailers = Symbol("kTrailers");
const kTrailersDistinct = Symbol("kTrailersDistinct");
const kTrailersCount = Symbol("kTrailersCount");

/** IncomingMessage for http(s) client */
export class IncomingMessageForClient extends NodeReadable {
  decoder = new TextDecoder();

  constructor(socket: Socket) {
    super();

    this._readableState.readingMore = true;

    this.socket = socket;

    this.httpVersionMajor = null;
    this.httpVersionMinor = null;
    this.httpVersion = null;
    this.complete = false;
    this[kHeaders] = null;
    this[kHeadersCount] = 0;
    this.rawHeaders = [];
    this[kTrailers] = null;
    this[kTrailersCount] = 0;
    this.rawTrailers = [];
    this.joinDuplicateHeaders = false;
    this.aborted = false;

    this.upgrade = null;

    // request (server) only
    this.url = "";
    this.method = null;

    // response (client) only
    this.statusCode = null;
    this.statusMessage = null;
    this.client = socket;

    this._consuming = false;
    // Flag for when we decide that this message cannot possibly be
    // read by the user, so there's no point continuing to handle it.
    this._dumped = false;
  }

  get connection() {
    return this.socket;
  }

  set connection(val) {
    this.socket = val;
  }

  get headers() {
    if (!this[kHeaders]) {
      this[kHeaders] = {};

      const src = this.rawHeaders;
      const dst = this[kHeaders];

      for (let n = 0; n < this[kHeadersCount]; n += 2) {
        this._addHeaderLine(src[n + 0], src[n + 1], dst);
      }
    }
    return this[kHeaders];
  }

  set headers(val) {
    this[kHeaders] = val;
  }

  get headersDistinct() {
    if (!this[kHeadersDistinct]) {
      this[kHeadersDistinct] = {};

      const src = this.rawHeaders;
      const dst = this[kHeadersDistinct];

      for (let n = 0; n < this[kHeadersCount]; n += 2) {
        this._addHeaderLineDistinct(src[n + 0], src[n + 1], dst);
      }
    }
    return this[kHeadersDistinct];
  }

  set headersDistinct(val) {
    this[kHeadersDistinct] = val;
  }

  get trailers() {
    if (!this[kTrailers]) {
      this[kTrailers] = {};

      const src = this.rawTrailers;
      const dst = this[kTrailers];

      for (let n = 0; n < this[kTrailersCount]; n += 2) {
        this._addHeaderLine(src[n + 0], src[n + 1], dst);
      }
    }
    return this[kTrailers];
  }

  set trailers(val) {
    this[kTrailers] = val;
  }

  get trailersDistinct() {
    if (!this[kTrailersDistinct]) {
      this[kTrailersDistinct] = {};

      const src = this.rawTrailers;
      const dst = this[kTrailersDistinct];

      for (let n = 0; n < this[kTrailersCount]; n += 2) {
        this._addHeaderLineDistinct(src[n + 0], src[n + 1], dst);
      }
    }
    return this[kTrailersDistinct];
  }

  set trailersDistinct(val) {
    this[kTrailersDistinct] = val;
  }

  setTimeout(msecs, callback) {
    if (callback) {
      this.on("timeout", callback);
    }
    this.socket.setTimeout(msecs);
    return this;
  }

  _read(_n) {
    if (!this._consuming) {
      this._readableState.readingMore = false;
      this._consuming = true;
    }

    const buf = new Uint8Array(16 * 1024);

    core.read(this._bodyRid, buf).then((bytesRead) => {
      if (bytesRead === 0) {
        this.push(null);
      } else {
        this.push(Buffer.from(buf.subarray(0, bytesRead)));
      }
    });
  }

  // It's possible that the socket will be destroyed, and removed from
  // any messages, before ever calling this.  In that case, just skip
  // it, since something else is destroying this connection anyway.
  _destroy(err, cb) {
    this.complete = true;
    if (!this.readableEnded || !this.complete) {
      this.aborted = true;
      this.emit("aborted");
    }

    core.tryClose(this._bodyRid);

    // If aborted and the underlying socket is not already destroyed,
    // destroy it.
    // We have to check if the socket is already destroyed because finished
    // does not call the callback when this method is invoked from `_http_client`
    // in `test/parallel/test-http-client-spurious-aborted.js`
    if (this.socket && !this.socket.destroyed && this.aborted) {
      this.socket.destroy(err);
      const cleanup = finished(this.socket, (e) => {
        if (e?.code === "ERR_STREAM_PREMATURE_CLOSE") {
          e = null;
        }
        cleanup();
        onError(this, e || err, cb);
      });
    } else {
      onError(this, err, cb);
    }
  }

  _addHeaderLines(headers, n) {
    if (headers && headers.length) {
      let dest;
      if (this.complete) {
        this.rawTrailers = headers.flat();
        this[kTrailersCount] = n;
        dest = this[kTrailers];
      } else {
        this.rawHeaders = headers.flat();
        this[kHeadersCount] = n;
        dest = this[kHeaders];
      }

      if (dest) {
        for (const header of headers) {
          this._addHeaderLine(header[0], header[1], dest);
        }
      }
    }
  }

  // Add the given (field, value) pair to the message
  //
  // Per RFC2616, section 4.2 it is acceptable to join multiple instances of the
  // same header with a ', ' if the header in question supports specification of
  // multiple values this way. The one exception to this is the Cookie header,
  // which has multiple values joined with a '; ' instead. If a header's values
  // cannot be joined in either of these ways, we declare the first instance the
  // winner and drop the second. Extended header fields (those beginning with
  // 'x-') are always joined.
  _addHeaderLine(field, value, dest) {
    field = matchKnownFields(field);
    const flag = field.charCodeAt(0);
    if (flag === 0 || flag === 2) {
      field = field.slice(1);
      // Make a delimited list
      if (typeof dest[field] === "string") {
        dest[field] += (flag === 0 ? ", " : "; ") + value;
      } else {
        dest[field] = value;
      }
    } else if (flag === 1) {
      // Array header -- only Set-Cookie at the moment
      if (dest["set-cookie"] !== undefined) {
        dest["set-cookie"].push(value);
      } else {
        dest["set-cookie"] = [value];
      }
    } else if (this.joinDuplicateHeaders) {
      // RFC 9110 https://www.rfc-editor.org/rfc/rfc9110#section-5.2
      // https://github.com/nodejs/node/issues/45699
      // allow authorization multiple fields
      // Make a delimited list
      if (dest[field] === undefined) {
        dest[field] = value;
      } else {
        dest[field] += ", " + value;
      }
    } else if (dest[field] === undefined) {
      // Drop duplicates
      dest[field] = value;
    }
  }

  _addHeaderLineDistinct(field, value, dest) {
    field = field.toLowerCase();
    if (!dest[field]) {
      dest[field] = [value];
    } else {
      dest[field].push(value);
    }
  }

  // Call this instead of resume() if we want to just
  // dump all the data to /dev/null
  _dump() {
    if (!this._dumped) {
      this._dumped = true;
      // If there is buffered data, it may trigger 'data' events.
      // Remove 'data' event listeners explicitly.
      this.removeAllListeners("data");
      this.resume();
    }
  }
}

// This function is used to help avoid the lowercasing of a field name if it
// matches a 'traditional cased' version of a field name. It then returns the
// lowercased name to both avoid calling toLowerCase() a second time and to
// indicate whether the field was a 'no duplicates' field. If a field is not a
// 'no duplicates' field, a `0` byte is prepended as a flag. The one exception
// to this is the Set-Cookie header which is indicated by a `1` byte flag, since
// it is an 'array' field and thus is treated differently in _addHeaderLines().
function matchKnownFields(field, lowercased) {
  switch (field.length) {
    case 3:
      if (field === "Age" || field === "age") return "age";
      break;
    case 4:
      if (field === "Host" || field === "host") return "host";
      if (field === "From" || field === "from") return "from";
      if (field === "ETag" || field === "etag") return "etag";
      if (field === "Date" || field === "date") return "\u0000date";
      if (field === "Vary" || field === "vary") return "\u0000vary";
      break;
    case 6:
      if (field === "Server" || field === "server") return "server";
      if (field === "Cookie" || field === "cookie") return "\u0002cookie";
      if (field === "Origin" || field === "origin") return "\u0000origin";
      if (field === "Expect" || field === "expect") return "\u0000expect";
      if (field === "Accept" || field === "accept") return "\u0000accept";
      break;
    case 7:
      if (field === "Referer" || field === "referer") return "referer";
      if (field === "Expires" || field === "expires") return "expires";
      if (field === "Upgrade" || field === "upgrade") return "\u0000upgrade";
      break;
    case 8:
      if (field === "Location" || field === "location") {
        return "location";
      }
      if (field === "If-Match" || field === "if-match") {
        return "\u0000if-match";
      }
      break;
    case 10:
      if (field === "User-Agent" || field === "user-agent") {
        return "user-agent";
      }
      if (field === "Set-Cookie" || field === "set-cookie") {
        return "\u0001";
      }
      if (field === "Connection" || field === "connection") {
        return "\u0000connection";
      }
      break;
    case 11:
      if (field === "Retry-After" || field === "retry-after") {
        return "retry-after";
      }
      break;
    case 12:
      if (field === "Content-Type" || field === "content-type") {
        return "content-type";
      }
      if (field === "Max-Forwards" || field === "max-forwards") {
        return "max-forwards";
      }
      break;
    case 13:
      if (field === "Authorization" || field === "authorization") {
        return "authorization";
      }
      if (field === "Last-Modified" || field === "last-modified") {
        return "last-modified";
      }
      if (field === "Cache-Control" || field === "cache-control") {
        return "\u0000cache-control";
      }
      if (field === "If-None-Match" || field === "if-none-match") {
        return "\u0000if-none-match";
      }
      break;
    case 14:
      if (field === "Content-Length" || field === "content-length") {
        return "content-length";
      }
      break;
    case 15:
      if (field === "Accept-Encoding" || field === "accept-encoding") {
        return "\u0000accept-encoding";
      }
      if (field === "Accept-Language" || field === "accept-language") {
        return "\u0000accept-language";
      }
      if (field === "X-Forwarded-For" || field === "x-forwarded-for") {
        return "\u0000x-forwarded-for";
      }
      break;
    case 16:
      if (field === "Content-Encoding" || field === "content-encoding") {
        return "\u0000content-encoding";
      }
      if (field === "X-Forwarded-Host" || field === "x-forwarded-host") {
        return "\u0000x-forwarded-host";
      }
      break;
    case 17:
      if (field === "If-Modified-Since" || field === "if-modified-since") {
        return "if-modified-since";
      }
      if (field === "Transfer-Encoding" || field === "transfer-encoding") {
        return "\u0000transfer-encoding";
      }
      if (field === "X-Forwarded-Proto" || field === "x-forwarded-proto") {
        return "\u0000x-forwarded-proto";
      }
      break;
    case 19:
      if (field === "Proxy-Authorization" || field === "proxy-authorization") {
        return "proxy-authorization";
      }
      if (field === "If-Unmodified-Since" || field === "if-unmodified-since") {
        return "if-unmodified-since";
      }
      break;
  }
  if (lowercased) {
    return "\u0000" + field;
  }
  return matchKnownFields(field.toLowerCase(), true);
}

function onError(self, error, cb) {
  // This is to keep backward compatible behavior.
  // An error is emitted only if there are listeners attached to the event.
  if (self.listenerCount("error") === 0) {
    cb();
  } else {
    cb(error);
  }
}

export type ServerResponse = {
  statusCode: number;
  statusMessage?: string;

  _headers: Record<string, string | string[]>;
  _hasNonStringHeaders: boolean;

  _readable: ReadableStream;
  finished: boolean;
  headersSent: boolean;
  _resolve: (value: Response | PromiseLike<Response>) => void;
  // deno-lint-ignore no-explicit-any
  _socketOverride: any | null;
  // deno-lint-ignore no-explicit-any
  socket: any | null;

  setHeader(name: string, value: string | string[]): void;
  appendHeader(name: string, value: string | string[]): void;
  getHeader(name: string): string | string[];
  removeHeader(name: string): void;
  getHeaderNames(): string[];
  getHeaders(): Record<string, string | number | string[]>;
  hasHeader(name: string): boolean;

  writeHead(
    status: number,
    statusMessage?: string,
    headers?:
      | Record<string, string | number | string[]>
      | Array<[string, string]>,
  ): void;
  writeHead(
    status: number,
    headers?:
      | Record<string, string | number | string[]>
      | Array<[string, string]>,
  ): void;

  _ensureHeaders(singleChunk?: Chunk): void;

  respond(final: boolean, singleChunk?: Chunk): void;
  // deno-lint-ignore no-explicit-any
  end(chunk?: any, encoding?: any, cb?: any): void;

  flushHeaders(): void;
  _implicitHeader(): void;

  // Undocumented field used by `npm:light-my-request`.
  _header: string;

  assignSocket(socket): void;
  detachSocket(socket): void;
} & { -readonly [K in keyof NodeWritable]: NodeWritable[K] };

type ServerResponseStatic = {
  new (
    resolve: (value: Response | PromiseLike<Response>) => void,
    socket: FakeSocket,
  ): ServerResponse;
  _enqueue(controller: ReadableStreamDefaultController, chunk: Chunk): void;
  _bodyShouldBeNull(statusCode: number): boolean;
};

export const ServerResponse = function (
  this: ServerResponse,
  resolve: (value: Response | PromiseLike<Response>) => void,
  socket: FakeSocket,
) {
  this.statusCode = 200;
  this.statusMessage = undefined;
  this._headers = { __proto__: null };
  this._hasNonStringHeaders = false;
  this.writable = true;

  // used by `npm:on-finished`
  this.finished = false;
  this.headersSent = false;
  this._socketOverride = null;

  let controller: ReadableByteStreamController;
  const readable = new ReadableStream({
    start(c) {
      controller = c as ReadableByteStreamController;
    },
  });

  NodeWritable.call(
    this,
    {
      autoDestroy: true,
      defaultEncoding: "utf-8",
      emitClose: true,
      // FIXME: writes don't work when a socket is assigned and then
      // detached.
      write: (chunk, encoding, cb) => {
        // Writes chunks are directly written to the socket if
        // one is assigned via assignSocket()
        if (this._socketOverride && this._socketOverride.writable) {
          this._socketOverride.write(chunk, encoding);
          return cb();
        }
        if (!this.headersSent) {
          ServerResponse._enqueue(controller, chunk);
          this.respond(false);
          return cb();
        }
        ServerResponse._enqueue(controller, chunk);
        return cb();
      },
      final: (cb) => {
        if (!this.headersSent) {
          this.respond(true);
        }
        controller.close();
        return cb();
      },
      destroy: (err, cb) => {
        if (err) {
          controller.error(err);
        }
        return cb(null);
      },
    } satisfies NodeWritableOptions,
  );

  this._readable = readable;
  this._resolve = resolve;
  this.socket = socket;

  this._header = "";
} as unknown as ServerResponseStatic;

Object.setPrototypeOf(ServerResponse.prototype, NodeWritable.prototype);
Object.setPrototypeOf(ServerResponse, NodeWritable);

ServerResponse._enqueue = function (
  this: ServerResponse,
  controller: ReadableStreamDefaultController,
  chunk: Chunk,
) {
  try {
    if (typeof chunk === "string") {
      controller.enqueue(ENCODER.encode(chunk));
    } else {
      controller.enqueue(chunk);
    }
  } catch (_) {
    // The stream might have been closed. Ignore the error.
  }
};

/** Returns true if the response body should be null with the given
 * http status code */
ServerResponse._bodyShouldBeNull = function (
  this: ServerResponse,
  status: number,
) {
  return status === 101 || status === 204 || status === 205 || status === 304;
};

ServerResponse.prototype.setHeader = function (
  this: ServerResponse,
  name: string,
  value: string | string[],
) {
  if (Array.isArray(value)) {
    this._hasNonStringHeaders = true;
  }
  this._headers[StringPrototypeToLowerCase(name)] = value;
  return this;
};

ServerResponse.prototype.appendHeader = function (
  this: ServerResponse,
  name: string,
  value: string | string[],
) {
  const key = StringPrototypeToLowerCase(name);
  if (this._headers[key] === undefined) {
    if (Array.isArray(value)) this._hasNonStringHeaders = true;
    this._headers[key] = value;
  } else {
    this._hasNonStringHeaders = true;
    if (!Array.isArray(this._headers[key])) {
      this._headers[key] = [this._headers[key]];
    }
    const header = this._headers[key];
    if (Array.isArray(value)) {
      header.push(...value);
    } else {
      header.push(value);
    }
  }
  return this;
};

ServerResponse.prototype.getHeader = function (
  this: ServerResponse,
  name: string,
) {
  return this._headers[StringPrototypeToLowerCase(name)];
};

ServerResponse.prototype.removeHeader = function (
  this: ServerResponse,
  name: string,
) {
  delete this._headers[StringPrototypeToLowerCase(name)];
};

ServerResponse.prototype.getHeaderNames = function (this: ServerResponse) {
  return Object.keys(this._headers);
};

ServerResponse.prototype.getHeaders = function (
  this: ServerResponse,
): Record<string, string | number | string[]> {
  return { __proto__: null, ...this._headers };
};

ServerResponse.prototype.hasHeader = function (
  this: ServerResponse,
  name: string,
) {
  return Object.hasOwn(this._headers, StringPrototypeToLowerCase(name));
};

ServerResponse.prototype.writeHead = function (
  this: ServerResponse,
  status: number,
  statusMessageOrHeaders?:
    | string
    | Record<string, string | number | string[]>
    | Array<[string, string]>,
  maybeHeaders?:
    | Record<string, string | number | string[]>
    | Array<[string, string]>,
) {
  this.statusCode = status;

  let headers = null;
  if (typeof statusMessageOrHeaders === "string") {
    this.statusMessage = statusMessageOrHeaders;
    if (maybeHeaders !== undefined) {
      headers = maybeHeaders;
    }
  } else if (statusMessageOrHeaders !== undefined) {
    headers = statusMessageOrHeaders;
  }

  if (headers !== null) {
    if (ArrayIsArray(headers)) {
      headers = headers as Array<[string, string]>;
      for (let i = 0; i < headers.length; i++) {
        this.appendHeader(headers[i][0], headers[i][1]);
      }
    } else {
      headers = headers as Record<string, string>;
      for (const k in headers) {
        if (Object.hasOwn(headers, k)) {
          this.setHeader(k, headers[k]);
        }
      }
    }
  }

  return this;
};

ServerResponse.prototype._ensureHeaders = function (
  this: ServerResponse,
  singleChunk?: Chunk,
) {
  if (this.statusCode === 200 && this.statusMessage === undefined) {
    this.statusMessage = "OK";
  }
  if (typeof singleChunk === "string" && !this.hasHeader("content-type")) {
    this.setHeader("content-type", "text/plain;charset=UTF-8");
  }
};

ServerResponse.prototype.respond = function (
  this: ServerResponse,
  final: boolean,
  singleChunk?: Chunk,
) {
  this.headersSent = true;
  this._ensureHeaders(singleChunk);
  let body = singleChunk ?? (final ? null : this._readable);
  if (ServerResponse._bodyShouldBeNull(this.statusCode)) {
    body = null;
  }
  let headers: Record<string, string> | [string, string][] = this
    ._headers as Record<string, string>;
  if (this._hasNonStringHeaders) {
    headers = [];
    // Guard is not needed as this is a null prototype object.
    // deno-lint-ignore guard-for-in
    for (const key in this._headers) {
      const entry = this._headers[key];
      if (Array.isArray(entry)) {
        for (const value of entry) {
          headers.push([key, value]);
        }
      } else {
        headers.push([key, entry]);
      }
    }
  }
  this._resolve(
    new Response(body, {
      headers,
      status: this.statusCode,
      statusText: this.statusMessage,
    }),
  );
};

ServerResponse.prototype.end = function (
  this: ServerResponse,
  // deno-lint-ignore no-explicit-any
  chunk?: any,
  // deno-lint-ignore no-explicit-any
  encoding?: any,
  // deno-lint-ignore no-explicit-any
  cb?: any,
) {
  this.finished = true;
  if (!chunk && "transfer-encoding" in this._headers) {
    // FIXME(bnoordhuis) Node sends a zero length chunked body instead, i.e.,
    // the trailing "0\r\n", but respondWith() just hangs when I try that.
    this._headers["content-length"] = "0";
    delete this._headers["transfer-encoding"];
  }

  // @ts-expect-error The signature for cb is stricter than the one implemented here
  NodeWritable.prototype.end.call(this, chunk, encoding, cb);
};

ServerResponse.prototype.flushHeaders = function (this: ServerResponse) {
  // no-op
};

// Undocumented API used by `npm:compression`.
ServerResponse.prototype._implicitHeader = function (this: ServerResponse) {
  this.writeHead(this.statusCode);
};

ServerResponse.prototype.assignSocket = function (
  this: ServerResponse,
  socket,
) {
  if (socket._httpMessage) {
    throw new ERR_HTTP_SOCKET_ASSIGNED();
  }
  socket._httpMessage = this;
  this._socketOverride = socket;
};

ServerResponse.prototype.detachSocket = function (
  this: ServerResponse,
  socket,
) {
  assert(socket._httpMessage === this);
  socket._httpMessage = null;
  this._socketOverride = null;
};

Object.defineProperty(ServerResponse.prototype, "connection", {
  get: deprecate(
    function (this: ServerResponse) {
      return this._socketOverride;
    },
    "ServerResponse.prototype.connection is deprecated",
    "DEP0066",
  ),
  set: deprecate(
    // deno-lint-ignore no-explicit-any
    function (this: ServerResponse, socket: any) {
      this._socketOverride = socket;
    },
    "ServerResponse.prototype.connection is deprecated",
    "DEP0066",
  ),
});

// TODO(@AaronO): optimize
export class IncomingMessageForServer extends NodeReadable {
  #headers: Record<string, string>;
  url: string;
  method: string;
  socket: Socket | FakeSocket;

  constructor(socket: FakeSocket | Socket) {
    const reader = socket instanceof FakeSocket
      ? socket.reader
      : socket instanceof Socket
      ? NodeDuplex.toWeb(socket).readable.getReader()
      : null;
    super({
      autoDestroy: true,
      emitClose: true,
      objectMode: false,
      read: async function (_size) {
        if (!reader) {
          return this.push(null);
        }

        try {
          const { value } = await reader!.read();
          this.push(value !== undefined ? Buffer.from(value) : null);
        } catch (err) {
          this.destroy(err as Error);
        }
      },
      destroy: (err, cb) => {
        reader?.cancel().catch(() => {
          // Don't throw error - it's propagated to the user via 'error' event.
        }).finally(nextTick(onError, this, err, cb));
      },
    });
    this.url = "";
    this.method = "";
    this.socket = socket;
    this.upgrade = null;
    this.rawHeaders = [];
  }

  get aborted() {
    return false;
  }

  get httpVersion() {
    return "1.1";
  }

  set httpVersion(val) {
    assert(val === "1.1");
  }

  get headers() {
    if (!this.#headers) {
      this.#headers = {};
      const entries = headersEntries(this.rawHeaders);
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        this.#headers[entry[0]] = entry[1];
      }
    }
    return this.#headers;
  }

  set headers(val) {
    this.#headers = val;
  }

  // connection is deprecated, but still tested in unit test.
  get connection() {
    return this.socket;
  }

  setTimeout(msecs, callback) {
    if (callback) {
      this.on("timeout", callback);
    }
    this.socket.setTimeout(msecs);
    return this;
  }
}

export type ServerHandler = (
  req: IncomingMessageForServer,
  res: ServerResponse,
) => void;

export function Server(opts, requestListener?: ServerHandler): ServerImpl {
  return new ServerImpl(opts, requestListener);
}

export class ServerImpl extends EventEmitter {
  #addr: Deno.NetAddr | null = null;
  #hasClosed = false;
  #server: Deno.HttpServer;
  #unref = false;
  #ac?: AbortController;
  #serveDeferred: ReturnType<typeof Promise.withResolvers<void>>;
  listening = false;

  constructor(opts, requestListener?: ServerHandler) {
    super();

    if (typeof opts === "function") {
      requestListener = opts;
      opts = kEmptyObject;
    } else if (opts == null) {
      opts = kEmptyObject;
    } else {
      validateObject(opts, "options");
    }

    this._opts = opts;

    this.#serveDeferred = Promise.withResolvers<void>();
    this.#serveDeferred.promise.then(() => this.emit("close"));
    if (requestListener !== undefined) {
      this.on("request", requestListener);
    }
  }

  listen(...args: unknown[]): this {
    // TODO(bnoordhuis) Delegate to net.Server#listen().
    const normalized = _normalizeArgs(args);
    const options = normalized[0] as Partial<ListenOptions>;
    const cb = normalized[1];

    if (cb !== null) {
      // @ts-ignore change EventEmitter's sig to use CallableFunction
      this.once("listening", cb);
    }

    let port = 0;
    if (typeof options.port === "number" || typeof options.port === "string") {
      validatePort(options.port, "options.port");
      port = options.port | 0;
    }

    // TODO(bnoordhuis) Node prefers [::] when host is omitted,
    // we on the other hand default to 0.0.0.0.
    let hostname = options.host ?? "0.0.0.0";
    if (hostname == "localhost") {
      hostname = "127.0.0.1";
    }
    this.#addr = {
      hostname,
      port,
    } as Deno.NetAddr;
    this.listening = true;
    nextTick(() => this._serve());

    return this;
  }

  _serve() {
    const ac = new AbortController();
    const handler = (request: Request, info: Deno.ServeHandlerInfo) => {
      const socket = new FakeSocket({
        remoteAddress: info.remoteAddr.hostname,
        remotePort: info.remoteAddr.port,
        encrypted: this._encrypted,
        reader: request.body?.getReader(),
      });

      const req = new IncomingMessageForServer(socket);
      // Slice off the origin so that we only have pathname + search
      req.url = request.url?.slice(request.url.indexOf("/", 8));
      req.method = request.method;
      req.upgrade =
        request.headers.get("connection")?.toLowerCase().includes("upgrade") &&
        request.headers.get("upgrade");
      req.rawHeaders = request.headers;

      if (req.upgrade && this.listenerCount("upgrade") > 0) {
        const tag = internals.getSupabaseTag(request);

        if (tag === void 0) {
          throw new TypeError("Unable to find supabase tag");
        }

        const { streamRid } = tag;
        const [upgradeRid, fenceRid] = op_http_upgrade_raw2(streamRid);
        const conn = new UpgradedConn(
          upgradeRid,
          info?.remoteAddr,
          void 0,
        );

        const socket = new Socket({
          handle: new TCP(constants.SERVER, conn),
        });
        // Update socket held by `req`.
        req.socket = socket;

        tag.fenceRid = fenceRid;
        this.emit("upgrade", req, socket, Buffer.from([]));

        return internals.RAW_UPGRADE_RESPONSE_SENTINEL;
      } else {
        return new Promise<Response>((resolve): void => {
          const res = new ServerResponse(resolve, socket);
          this.emit("request", req, res);
        });
      }
    };

    if (this.#hasClosed) {
      return;
    }

    this.#ac = ac;

    try {
      this.#server = Deno.serve({
        handler: (req) => {
          return handler(req, {
            remoteAddr: {
              transport: "tcp",
              hostname: "0.0.0.0",
              port: 9999,
            },
            completed: Promise.resolve(undefined),
          });
        },
        // @ts-ignore Might be any without `--unstable` flag
        onListen: ({ port }) => {
          this.#addr!.port = port;
          this.emit("listening");
        },
      });
      // this.#server = serve(
      //   {
      //     handler: handler as Deno.ServeHandler,
      //     ...this.#addr,
      //     signal: ac.signal,
      //     // @ts-ignore Might be any without `--unstable` flag
      //     onListen: ({ port }) => {
      //       this.#addr!.port = port;
      //       this.emit("listening");
      //     },
      //     ...this._additionalServeOptions?.(),
      //   },
      // );
    } catch (e) {
      this.emit("error", e);
      return;
    }

    if (this.#unref) {
      this.#server.unref();
    }
    this.#server.finished.then(() => this.#serveDeferred!.resolve());
  }

  setTimeout() {
    // deno-lint-ignore no-console
    console.error("Not implemented: Server.setTimeout()");
  }

  ref() {
    if (this.#server) {
      this.#server.ref();
    }
    this.#unref = false;

    return this;
  }

  unref() {
    if (this.#server) {
      this.#server.unref();
    }
    this.#unref = true;

    return this;
  }

  close(cb?: (err?: Error) => void): this {
    const listening = this.listening;
    this.listening = false;

    this.#hasClosed = true;
    if (typeof cb === "function") {
      if (listening) {
        this.once("close", cb);
      } else {
        this.once("close", function close() {
          cb(new ERR_SERVER_NOT_RUNNING());
        });
      }
    }

    if (listening && this.#ac) {
      if (this.#server) {
        this.#server.shutdown();
      } else if (this.#ac) {
        this.#ac.abort();
        this.#ac = undefined;
      }
    } else {
      this.#serveDeferred!.resolve();
    }

    this.#server = undefined;
    return this;
  }

  closeAllConnections() {
    if (this.#hasClosed) {
      return;
    }
    if (this.#ac) {
      this.#ac.abort();
      this.#ac = undefined;
    }
  }

  closeIdleConnections() {
    if (this.#hasClosed) {
      return;
    }

    if (this.#server) {
      this.#server.shutdown();
    }
  }

  address() {
    if (this.#addr === null) return null;
    return {
      port: this.#addr.port,
      address: this.#addr.hostname,
    };
  }
}

Server.prototype = ServerImpl.prototype;

export function createServer(opts, requestListener?: ServerHandler) {
  return Server(opts, requestListener);
}

/** Makes an HTTP request. */
export function request(
  url: string | URL,
  cb?: (res: IncomingMessageForClient) => void,
): ClientRequest;
export function request(
  opts: RequestOptions,
  cb?: (res: IncomingMessageForClient) => void,
): ClientRequest;
export function request(
  url: string | URL,
  opts: RequestOptions,
  cb?: (res: IncomingMessageForClient) => void,
): ClientRequest;
// deno-lint-ignore no-explicit-any
export function request(...args: any[]) {
  return new ClientRequest(args[0], args[1], args[2]);
}

/** Makes a `GET` HTTP request. */
export function get(
  url: string | URL,
  cb?: (res: IncomingMessageForClient) => void,
): ClientRequest;
export function get(
  opts: RequestOptions,
  cb?: (res: IncomingMessageForClient) => void,
): ClientRequest;
export function get(
  url: string | URL,
  opts: RequestOptions,
  cb?: (res: IncomingMessageForClient) => void,
): ClientRequest;
// deno-lint-ignore no-explicit-any
export function get(...args: any[]) {
  const req = request(args[0], args[1], args[2]);
  req.end();
  return req;
}

export const maxHeaderSize = 16_384;

export {
  Agent,
  ClientRequest,
  globalAgent,
  IncomingMessageForServer as IncomingMessage,
  METHODS,
  OutgoingMessage,
  STATUS_CODES,
  validateHeaderName,
  validateHeaderValue,
};
export default {
  Agent,
  globalAgent,
  ClientRequest,
  STATUS_CODES,
  METHODS,
  createServer,
  Server,
  IncomingMessage: IncomingMessageForServer,
  IncomingMessageForClient,
  IncomingMessageForServer,
  OutgoingMessage,
  ServerResponse,
  request,
  get,
  validateHeaderName,
  validateHeaderValue,
  maxHeaderSize,
};
