// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { core, primordials } from "ext:core/mod.js";
const { internalRidSymbol } = core;
import {
  op_http2_client_get_response,
  op_http2_client_get_response_body_chunk,
  op_http2_client_get_response_trailers,
  op_http2_client_request,
  op_http2_client_reset_stream,
  op_http2_client_send_data,
  op_http2_client_send_trailers,
  op_http2_connect,
  op_http2_poll_client_connection,
  op_http_set_response_trailers,
} from "ext:core/ops";

import { notImplemented, warnNotImplemented } from "ext:deno_node/_utils.ts";
import { toInnerRequest } from "ext:deno_fetch/23_request.js";
import { Readable } from "node:stream";
import { EventEmitter } from "node:events";
import { Buffer } from "node:buffer";
import { emitWarning } from "node:process";
import Stream from "node:stream";
import { connect as netConnect, Server, Socket, TCP } from "node:net";
import { connect as tlsConnect } from "node:tls";
import { TypedArray } from "ext:deno_node/internal/util/types.ts";
import {
  kHandle,
  kMaybeDestroy,
  kUpdateTimer,
  setStreamTimeout,
} from "ext:deno_node/internal/stream_base_commons.ts";
import { FileHandle } from "node:fs/promises";
import { kStreamBaseField } from "ext:deno_node/internal_binding/stream_wrap.ts";
import { serveHttpOnConnection } from "ext:deno_http/00_serve.ts";
import { nextTick } from "ext:deno_node/_next_tick.ts";
import { TextEncoder } from "ext:deno_web/08_text_encoding.js";
import { Duplex } from "node:stream";
import {
  AbortError,
  ERR_HTTP2_CONNECT_AUTHORITY,
  ERR_HTTP2_CONNECT_PATH,
  ERR_HTTP2_CONNECT_SCHEME,
  ERR_HTTP2_GOAWAY_SESSION,
  ERR_HTTP2_HEADERS_SENT,
  ERR_HTTP2_INFO_STATUS_NOT_ALLOWED,
  ERR_HTTP2_INVALID_PSEUDOHEADER,
  ERR_HTTP2_INVALID_SESSION,
  ERR_HTTP2_INVALID_STREAM,
  ERR_HTTP2_NO_SOCKET_MANIPULATION,
  ERR_HTTP2_SESSION_ERROR,
  ERR_HTTP2_SOCKET_UNBOUND,
  ERR_HTTP2_STATUS_INVALID,
  ERR_HTTP2_STREAM_CANCEL,
  ERR_HTTP2_STREAM_ERROR,
  ERR_HTTP2_TOO_MANY_CUSTOM_SETTINGS,
  ERR_HTTP2_TRAILERS_ALREADY_SENT,
  ERR_HTTP2_TRAILERS_NOT_READY,
  ERR_HTTP2_UNSUPPORTED_PROTOCOL,
  ERR_INVALID_ARG_VALUE,
  ERR_INVALID_HTTP_TOKEN,
  ERR_SOCKET_CLOSED,
  ERR_STREAM_WRITE_AFTER_END,
} from "ext:deno_node/internal/errors.ts";
import { _checkIsHttpToken } from "node:_http_common";
const {
  StringPrototypeTrim,
  FunctionPrototypeBind,
  ObjectKeys,
  ReflectGetPrototypeOf,
  ObjectAssign,
  StringPrototypeToLowerCase,
  ReflectApply,
  ArrayIsArray,
  ObjectPrototypeHasOwnProperty,
} = primordials;

const kSession = Symbol("session");
const kOptions = Symbol("options");
const kAlpnProtocol = Symbol("alpnProtocol");
const kAuthority = Symbol("authority");
const kEncrypted = Symbol("encrypted");
const kID = Symbol("id");
const kInit = Symbol("init");
const kInfoHeaders = Symbol("sent-info-headers");
const kOrigin = Symbol("origin");
const kPendingRequestCalls = Symbol("kPendingRequestCalls");
const kProtocol = Symbol("protocol");
const kSentHeaders = Symbol("sent-headers");
const kSentTrailers = Symbol("sent-trailers");
const kState = Symbol("state");
const kType = Symbol("type");
const kTimeout = Symbol("timeout");
const kSocket = Symbol("socket");
const kProxySocket = Symbol("proxySocket");

const kDenoResponse = Symbol("kDenoResponse");
const kDenoRid = Symbol("kDenoRid");
const kDenoClientRid = Symbol("kDenoClientRid");
const kDenoConnRid = Symbol("kDenoConnRid");
const kPollConnPromise = Symbol("kPollConnPromise");

const STREAM_FLAGS_PENDING = 0x0;
const STREAM_FLAGS_READY = 0x1;
const STREAM_FLAGS_CLOSED = 0x2;
const STREAM_FLAGS_HEADERS_SENT = 0x4;
const STREAM_FLAGS_HEAD_REQUEST = 0x8;
const STREAM_FLAGS_ABORTED = 0x10;
const STREAM_FLAGS_HAS_TRAILERS = 0x20;

// Maximum number of allowed additional settings
const MAX_ADDITIONAL_SETTINGS = 10;

const SESSION_FLAGS_PENDING = 0x0;
const SESSION_FLAGS_READY = 0x1;
const SESSION_FLAGS_CLOSED = 0x2;
const SESSION_FLAGS_DESTROYED = 0x4;

const ENCODER = new TextEncoder();
type Http2Headers = Record<string, string | string[]>;

const debugHttp2Enabled = false;
function debugHttp2(...args) {
  if (debugHttp2Enabled) {
    // deno-lint-ignore no-console
    console.log(...args);
  }
}

const sessionProxySocketHandler = {
  get(session, prop) {
    switch (prop) {
      case "setTimeout":
      case "ref":
      case "unref":
        return FunctionPrototypeBind(session[prop], session);
      case "destroy":
      case "emit":
      case "end":
      case "pause":
      case "read":
      case "resume":
      case "write":
      case "setEncoding":
      case "setKeepAlive":
      case "setNoDelay":
        throw new ERR_HTTP2_NO_SOCKET_MANIPULATION();
      default: {
        const socket = session[kSocket];
        if (socket === undefined) {
          throw new ERR_HTTP2_SOCKET_UNBOUND();
        }
        const value = socket[prop];
        return typeof value === "function"
          ? FunctionPrototypeBind(value, socket)
          : value;
      }
    }
  },
  getPrototypeOf(session) {
    const socket = session[kSocket];
    if (socket === undefined) {
      throw new ERR_HTTP2_SOCKET_UNBOUND();
    }
    return ReflectGetPrototypeOf(socket);
  },
  set(session, prop, value) {
    switch (prop) {
      case "setTimeout":
      case "ref":
      case "unref":
        session[prop] = value;
        return true;
      case "destroy":
      case "emit":
      case "end":
      case "pause":
      case "read":
      case "resume":
      case "write":
      case "setEncoding":
      case "setKeepAlive":
      case "setNoDelay":
        throw new ERR_HTTP2_NO_SOCKET_MANIPULATION();
      default: {
        const socket = session[kSocket];
        if (socket === undefined) {
          throw new ERR_HTTP2_SOCKET_UNBOUND();
        }
        socket[prop] = value;
        return true;
      }
    }
  },
};

export class Http2Session extends EventEmitter {
  constructor(type, _options, socket) {
    super();

    this[kState] = {
      destroyCode: constants.NGHTTP2_NO_ERROR,
      flags: SESSION_FLAGS_PENDING,
      goawayCode: null,
      goawayLastStreamID: null,
      streams: new Map(),
      pendingStreams: new Set(),
      pendingAck: 0,
      writeQueueSize: 0,
      originSet: undefined,
    };

    this[kEncrypted] = undefined;
    this[kAlpnProtocol] = undefined;
    this[kType] = type;
    this[kProxySocket] = null;
    this[kSocket] = socket;
    this[kTimeout] = null;

    debugHttp2(type, "created");
  }

  get encrypted(): boolean {
    return this[kEncrypted];
  }

  get alpnProtocol(): string | undefined {
    return this[kAlpnProtocol];
  }

  get originSet(): string[] | undefined {
    if (!this.encrypted || this.destroyed) {
      return undefined;
    }
    // TODO(bartlomieju):
    return [];
  }

  get connecting(): boolean {
    return (this[kState].flags & SESSION_FLAGS_READY) === 0;
  }

  get closed(): boolean {
    return !!(this[kState].flags & SESSION_FLAGS_CLOSED);
  }

  get destroyed(): boolean {
    return !!(this[kState].flags & SESSION_FLAGS_DESTROYED);
  }

  [kUpdateTimer]() {
    if (this.destroyed) {
      return;
    }
    if (this[kTimeout]) {
      this[kTimeout].refresh();
    }
  }

  setLocalWindowSize(_windowSize: number) {
    notImplemented("Http2Session.setLocalWindowSize");
  }

  ping(
    _payload: Buffer | TypedArray | DataView,
    _callback: () => void,
  ): boolean {
    notImplemented("Http2Session.ping");
    return false;
  }

  get socket(): Socket {
    const proxySocket = this[kProxySocket];
    if (proxySocket === null) {
      return this[kProxySocket] = new Proxy(this, sessionProxySocketHandler);
    }
    return proxySocket;
  }

  get type(): number {
    return this[kType];
  }

  get pendingSettingsAck() {
    return this[kState].pendingAck > 0;
  }

  get state(): Record<string, unknown> {
    return {};
  }

  get localSettings(): Record<string, unknown> {
    notImplemented("Http2Session.localSettings");
    return {};
  }

  get remoteSettings(): Record<string, unknown> {
    notImplemented("Http2Session.remoteSettings");
    return {};
  }

  settings(_settings: Record<string, unknown>, _callback: () => void) {
    notImplemented("Http2Session.settings");
  }

  goaway(
    code?: number,
    lastStreamID?: number,
    opaqueData?: Buffer | TypedArray | DataView,
  ) {
    // TODO(satyarohith): create goaway op and pass the args
    debugHttp2(">>> goaway - ignored args", code, lastStreamID, opaqueData);
    if (this[kDenoConnRid]) {
      core.tryClose(this[kDenoConnRid]);
    }
    if (this[kDenoClientRid]) {
      core.tryClose(this[kDenoClientRid]);
    }
  }

  destroy(error = constants.NGHTTP2_NO_ERROR, code?: number) {
    if (this.destroyed) {
      return;
    }

    if (typeof error === "number") {
      code = error;
      error = code !== constants.NGHTTP2_NO_ERROR
        ? new ERR_HTTP2_SESSION_ERROR(code)
        : undefined;
    }
    if (code === undefined && error != null) {
      code = constants.NGHTTP2_INTERNAL_ERROR;
    }

    closeSession(this, code, error);
  }

  close(callback?: () => void) {
    if (this.closed || this.destroyed) {
      return;
    }
    debugHttp2(this, "marking session closed");
    this[kState].flags |= SESSION_FLAGS_CLOSED;
    if (typeof callback === "function") {
      this.once("close", callback);
    }
    this.goaway();
    this[kMaybeDestroy]();
  }

  [kMaybeDestroy](error?: number) {
    if (!error) {
      const state = this[kState];
      // Don't destroy if the session is not closed or there are pending or open
      // streams.
      if (
        !this.closed || state.streams.size > 0 || state.pendingStreams.size >
          0
      ) {
        return;
      }
    }
    this.destroy(error);
  }

  ref() {
    warnNotImplemented("Http2Session.ref");
  }

  unref() {
    warnNotImplemented("Http2Session.unref");
  }

  _onTimeout() {
    callTimeout(this, this);
  }

  setTimeout(msecs: number, callback?: () => void) {
    setStreamTimeout.call(this, msecs, callback);
  }
}

function emitClose(session: Http2Session, error?: Error) {
  if (error) {
    session.emit("error", error);
  }
  session.emit("close");
}

function finishSessionClose(session: Http2Session, error?: Error) {
  // TODO(bartlomieju): handle sockets

  nextTick(emitClose, session, error);
}

function closeSession(session: Http2Session, code?: number, error?: Error) {
  const state = session[kState];
  state.flags |= SESSION_FLAGS_DESTROYED;
  state.destroyCode = code;

  session.setTimeout(0);
  session.removeAllListeners("timeout");

  // Destroy open and pending streams
  if (state.pendingStreams.size > 0 || state.streams.size > 0) {
    const cancel = new ERR_HTTP2_STREAM_CANCEL(error);
    state.pendingStreams.forEach((stream) => stream.destroy(cancel));
    state.streams.forEach((stream) => stream.destroy(cancel));
  }

  // TODO(bartlomieju): handle sockets
  debugHttp2(
    ">>> closeSession",
    session[kDenoConnRid],
    session[kDenoClientRid],
  );
  if (session[kDenoConnRid]) {
    core.tryClose(session[kDenoConnRid]);
  }
  if (session[kDenoClientRid]) {
    core.tryClose(session[kDenoClientRid]);
  }

  finishSessionClose(session, error);
}

export class ServerHttp2Session extends Http2Session {
  constructor() {
    // TODO(satyarohith): pass socket instead of undefined
    super(constants.NGHTTP2_SESSION_SERVER, {}, undefined);
  }

  altsvc(
    _alt: string,
    _originOrStream: number | string | URL | { origin: string },
  ) {
    notImplemented("ServerHttp2Session.altsvc");
  }

  origin(..._origins: (string | URL | { origin: string })[]) {
    notImplemented("ServerHttp2Session.origins");
  }
}

function assertValidPseudoHeader(header: string) {
  switch (header) {
    case ":authority":
    case ":path":
    case ":method":
    case ":scheme":
    case ":status":
      return;
    default:
      throw new ERR_HTTP2_INVALID_PSEUDOHEADER(header);
  }
}

export class ClientHttp2Session extends Http2Session {
  #connectPromise: Promise<void>;
  #refed = true;

  constructor(
    // deno-lint-ignore no-explicit-any
    socket: any,
    url: string,
    options: Record<string, unknown>,
  ) {
    super(constants.NGHTTP2_SESSION_CLIENT, options, socket);
    this[kPendingRequestCalls] = null;
    this[kDenoClientRid] = undefined;
    this[kDenoConnRid] = undefined;
    this[kPollConnPromise] = undefined;

    socket.on("error", socketOnError);
    socket.on("close", socketOnClose);

    socket[kHandle].pauseOnCreate = true;
    const connPromise = new Promise((resolve) => {
      const eventName = url.startsWith("https") ? "secureConnect" : "connect";
      socket.once(eventName, () => {
        const rid = socket[kHandle][kStreamBaseField][internalRidSymbol];
        nextTick(() => resolve(rid));
      });
    });
    socket[kSession] = this;

    // TODO(bartlomieju): cleanup
    this.#connectPromise = (async () => {
      debugHttp2(">>> before connect");
      const connRid_ = await connPromise;
      // console.log(">>>> awaited connRid", connRid_, url);
      const [clientRid, connRid] = await op_http2_connect(connRid_, url);
      debugHttp2(">>> after connect", clientRid, connRid);
      this[kDenoClientRid] = clientRid;
      this[kDenoConnRid] = connRid;
      (async () => {
        try {
          const promise = op_http2_poll_client_connection(
            this[kDenoConnRid],
          );
          this[kPollConnPromise] = promise;
          if (!this.#refed) {
            this.unref();
          }
          await promise;
        } catch (e) {
          this.emit("error", e);
        }
      })();
      this[kState].flags |= SESSION_FLAGS_READY;
      this.emit("connect", this, {});
    })();
  }

  ref() {
    this.#refed = true;
    if (this[kPollConnPromise]) {
      core.refOpPromise(this[kPollConnPromise]);
    }
  }

  unref() {
    this.#refed = false;
    if (this[kPollConnPromise]) {
      core.unrefOpPromise(this[kPollConnPromise]);
    }
  }

  request(
    headers: Http2Headers,
    options?: Record<string, unknown>,
  ): ClientHttp2Stream {
    if (this.destroyed) {
      throw new ERR_HTTP2_INVALID_SESSION();
    }

    if (this.closed) {
      throw new ERR_HTTP2_GOAWAY_SESSION();
    }

    this[kUpdateTimer]();
    if (headers !== null && headers !== undefined) {
      const keys = Object.keys(headers);
      for (let i = 0; i < keys.length; i++) {
        const header = keys[i];
        if (header[0] === ":") {
          assertValidPseudoHeader(header);
        } else if (header && !_checkIsHttpToken(header)) {
          this.destroy(new ERR_INVALID_HTTP_TOKEN("Header name", header));
        }
      }
    }

    headers = Object.assign({ __proto__: null }, headers);
    options = { ...options };

    if (headers[constants.HTTP2_HEADER_METHOD] === undefined) {
      headers[constants.HTTP2_HEADER_METHOD] = constants.HTTP2_METHOD_GET;
    }

    const connect =
      headers[constants.HTTP2_HEADER_METHOD] === constants.HTTP2_METHOD_CONNECT;

    if (!connect || headers[constants.HTTP2_HEADER_PROTOCOL] !== undefined) {
      if (getAuthority(headers) === undefined) {
        headers[constants.HTTP2_HEADER_AUTHORITY] = this[kAuthority];
      }
      if (headers[constants.HTTP2_HEADER_SCHEME] === undefined) {
        headers[constants.HTTP2_HEADER_SCHEME] = this[kProtocol].slice(0, -1);
      }
      if (headers[constants.HTTP2_HEADER_PATH] === undefined) {
        headers[constants.HTTP2_HEADER_PATH] = "/";
      }
    } else {
      if (headers[constants.HTTP2_HEADER_AUTHORITY] === undefined) {
        throw new ERR_HTTP2_CONNECT_AUTHORITY();
      }
      if (headers[constants.HTTP2_HEADER_SCHEME] === undefined) {
        throw new ERR_HTTP2_CONNECT_SCHEME();
      }
      if (headers[constants.HTTP2_HEADER_PATH] === undefined) {
        throw new ERR_HTTP2_CONNECT_PATH();
      }
    }

    if (options.endStream === undefined) {
      const method = headers[constants.HTTP2_HEADER_METHOD];
      options.endStream = method === constants.HTTP2_METHOD_DELETE ||
        method === constants.HTTP2_METHOD_GET ||
        method === constants.HTTP2_METHOD_HEAD;
    } else {
      options.endStream = !!options.endStream;
    }

    const stream = new ClientHttp2Stream(
      options,
      this,
      this.#connectPromise,
      headers,
    );
    stream[kSentHeaders] = headers;
    stream[kOrigin] = `${headers[constants.HTTP2_HEADER_SCHEME]}://${
      getAuthority(headers)
    }`;

    if (options.endStream) {
      stream.end();
    }

    if (options.waitForTrailers) {
      stream[kState].flags |= STREAM_FLAGS_HAS_TRAILERS;
    }

    const { signal } = options;
    if (signal) {
      const aborter = () => {
        stream.destroy(new AbortError(undefined, { cause: signal.reason }));
      };
      if (signal.aborted) {
        aborter();
      } else {
        // TODO(bartlomieju): handle this
        // const disposable = EventEmitter.addAbortListener(signal, aborter);
        // stream.once("close", disposable[Symbol.dispose]);
      }
    }

    // TODO(bartlomieju): handle this
    const onConnect = () => {};
    if (this.connecting) {
      if (this[kPendingRequestCalls] !== null) {
        this[kPendingRequestCalls].push(onConnect);
      } else {
        this[kPendingRequestCalls] = [onConnect];
        this.once("connect", () => {
          this[kPendingRequestCalls].forEach((f) => f());
          this[kPendingRequestCalls] = null;
        });
      }
    } else {
      onConnect();
    }

    return stream;
  }
}

function getAuthority(headers) {
  if (headers[constants.HTTP2_HEADER_AUTHORITY] !== undefined) {
    return headers[constants.HTTP2_HEADER_AUTHORITY];
  }
  if (headers[constants.HTTP2_HEADER_HOST] !== undefined) {
    return headers[constants.HTTP2_HEADER_HOST];
  }
  return undefined;
}

export class Http2Stream extends EventEmitter {
  #session: Http2Session;
  #headers: Promise<Http2Headers>;
  #controllerPromise: Promise<ReadableStreamDefaultController<Uint8Array>>;
  #readerPromise: Promise<ReadableStream<Uint8Array>>;
  #closed: boolean;
  _response: Response;
  // This is required to set the trailers on the response.
  _request: Request;

  constructor(
    session: Http2Session,
    headers: Promise<Http2Headers>,
    controllerPromise: Promise<ReadableStreamDefaultController<Uint8Array>>,
    readerPromise: Promise<ReadableStream<Uint8Array>>,
  ) {
    super();
    this.#session = session;
    this.#headers = headers;
    this.#controllerPromise = controllerPromise;
    this.#readerPromise = readerPromise;
    this.#closed = false;
    nextTick(() => {
      (async () => {
        const headers = await this.#headers;
        this.emit("headers", headers);
      })();
      (async () => {
        const reader = await this.#readerPromise;
        if (reader) {
          for await (const data of reader) {
            this.emit("data", new Buffer(data));
          }
        }
        this.emit("end");
      })();
    });
  }

  // TODO(mmastrac): Implement duplex
  end() {
    (async () => {
      const controller = await this.#controllerPromise;
      controller.close();
    })();
  }

  write(buffer, callback?: () => void) {
    (async () => {
      const controller = await this.#controllerPromise;
      if (typeof buffer === "string") {
        controller.enqueue(ENCODER.encode(buffer));
      } else {
        controller.enqueue(buffer);
      }
      callback?.();
    })();
  }

  setEncoding(_encoding) {}

  resume() {
  }

  pause() {
  }

  get aborted(): boolean {
    notImplemented("Http2Stream.aborted");
    return false;
  }

  get bufferSize(): number {
    notImplemented("Http2Stream.bufferSize");
    return 0;
  }

  close(_code: number, _callback: () => void) {
    this.#closed = true;
    this.emit("close");
  }

  get closed(): boolean {
    return this.#closed;
  }

  get destroyed(): boolean {
    return false;
  }

  get endAfterHeaders(): boolean {
    notImplemented("Http2Stream.endAfterHeaders");
    return false;
  }

  get id(): number | undefined {
    notImplemented("Http2Stream.id");
    return undefined;
  }

  get pending(): boolean {
    notImplemented("Http2Stream.pending");
    return false;
  }

  priority(_options: Record<string, unknown>) {
    notImplemented("Http2Stream.priority");
  }

  get rstCode(): number {
    // notImplemented("Http2Stream.rstCode");
    return 0;
  }

  get sentHeaders(): boolean {
    notImplemented("Http2Stream.sentHeaders");
    return false;
  }

  get sentInfoHeaders(): Record<string, unknown> {
    notImplemented("Http2Stream.sentInfoHeaders");
    return {};
  }

  get sentTrailers(): Record<string, unknown> {
    notImplemented("Http2Stream.sentTrailers");
    return {};
  }

  get session(): Http2Session {
    return this.#session;
  }

  setTimeout(msecs: number, callback?: () => void) {
    setStreamTimeout(this, msecs, callback);
  }

  get state(): Record<string, unknown> {
    notImplemented("Http2Stream.state");
    return {};
  }

  sendTrailers(headers: Record<string, unknown>) {
    const request = toInnerRequest(this._request);
    op_http_set_response_trailers(request.external, Object.entries(headers));
  }
}

async function clientHttp2Request(
  session,
  sessionConnectPromise,
  headers,
  options,
) {
  debugHttp2(
    ">>> waiting for connect promise",
    sessionConnectPromise,
    headers,
    options,
  );
  await sessionConnectPromise;

  const reqHeaders: string[][] = [];
  const pseudoHeaders = {};

  for (const [key, value] of Object.entries(headers)) {
    if (key[0] === ":") {
      pseudoHeaders[key] = value;
    } else {
      reqHeaders.push([key, Array.isArray(value) ? value[0] : value]);
    }
  }
  debugHttp2(
    "waited for connect promise",
    !!options.waitForTrailers,
    pseudoHeaders,
    reqHeaders,
  );

  if (session.closed || session.destroyed) {
    debugHttp2(">>> session closed during request promise");
    throw new ERR_HTTP2_STREAM_CANCEL();
  }

  return await op_http2_client_request(
    session[kDenoClientRid],
    pseudoHeaders,
    reqHeaders,
  );
}

export class ClientHttp2Stream extends Duplex {
  #requestPromise: Promise<[number, number]>;
  #responsePromise: Promise<void>;
  #rid: number | undefined = undefined;
  #encoding = "utf8";

  constructor(
    options: Record<string, unknown>,
    session: Http2Session,
    sessionConnectPromise: Promise<void>,
    headers: Record<string, string>,
  ) {
    options.allowHalfOpen = true;
    options.decodeString = false;
    options.autoDestroy = false;
    super(options);
    this.cork();
    this[kSession] = session;
    session[kState].pendingStreams.add(this);

    this._readableState.readingMore = true;

    this[kState] = {
      didRead: false,
      flags: STREAM_FLAGS_PENDING | STREAM_FLAGS_HEADERS_SENT,
      rstCode: constants.NGHTTP2_NO_ERROR,
      writeQueueSize: 0,
      trailersReady: false,
      endAfterHeaders: false,
      shutdownWritableCalled: false,
      serverEndedCall: false,
    };
    this[kDenoResponse] = undefined;
    this[kDenoRid] = undefined;

    this.#requestPromise = clientHttp2Request(
      session,
      sessionConnectPromise,
      headers,
      options,
    );
    debugHttp2(">>> created clienthttp2stream");
    // TODO(bartlomieju): save it so we can unref
    this.#responsePromise = (async () => {
      debugHttp2(">>> before request promise", session[kDenoClientRid]);
      const [streamRid, streamId] = await this.#requestPromise;
      this.#rid = streamRid;
      this[kDenoRid] = streamRid;
      this[kInit](streamId);
      debugHttp2(
        ">>> after request promise",
        session[kDenoClientRid],
        this.#rid,
      );

      if (session.closed || session.destroyed) {
        debugHttp2(">>> session closed during response promise");
        throw new ERR_HTTP2_STREAM_CANCEL();
      }

      const [response, endStream] = await op_http2_client_get_response(
        this.#rid,
      );
      debugHttp2(">>> after get response", response);
      const headers = {
        ":status": response.statusCode,
        ...Object.fromEntries(response.headers),
      };
      debugHttp2(">>> emitting response", headers);
      this.emit(
        "response",
        headers,
        endStream
          ? constants.NGHTTP2_FLAG_END_STREAM
          : constants.NGHTTP2_FLAG_NONE,
      );
      this[kDenoResponse] = response;
      this.emit("ready");
    })().catch((e) => {
      if (!(e instanceof ERR_HTTP2_STREAM_CANCEL)) {
        debugHttp2(">>> request/response promise error", e);
      }
      this.destroy(e);
    });
  }

  [kUpdateTimer]() {
    if (this.destroyed) {
      return;
    }
    if (this[kTimeout]) {
      this[kTimeout].refresh();
    }
    if (this[kSession]) {
      this[kSession][kUpdateTimer]();
    }
  }

  [kInit](id) {
    const state = this[kState];
    state.flags |= STREAM_FLAGS_READY;

    const session = this[kSession];
    session[kState].pendingStreams.delete(this);
    session[kState].streams.set(id, this);

    // TODO(bartlomieju): handle socket handle

    this[kID] = id;
    this.uncork();
    this.emit("ready");
  }

  get bufferSize() {
    return this[kState].writeQueueSize + this.writableLength;
  }

  get endAfterHeaders() {
    return this[kState].endAfterHeaders;
  }

  get sentHeaders() {
    return this[kSentHeaders];
  }

  get sentTrailers() {
    return this[kSentTrailers];
  }

  get sendInfoHeaders() {
    return this[kInfoHeaders];
  }

  get pending(): boolean {
    return this[kID] === undefined;
  }

  get id(): number | undefined {
    return this[kID];
  }

  get session(): Http2Session {
    return this[kSession];
  }

  _onTimeout() {
    callTimeout(this, kSession);
  }

  get headersSent() {
    return !!(this[kState].flags & STREAM_FLAGS_HEADERS_SENT);
  }

  get aborted() {
    return !!(this[kState].flags & STREAM_FLAGS_ABORTED);
  }

  get headRequest() {
    return !!(this[kState].flags & STREAM_FLAGS_HEAD_REQUEST);
  }

  get rstCode() {
    return this[kState].rstCode;
  }

  get state(): Record<string, unknown> {
    notImplemented("Http2Stream.state");
    return {};
  }

  // [kAfterAsyncWrite]() {}

  // [kWriteGeneric]() {}

  // TODO(bartlomieju): clean up
  _write(chunk, encoding, callback?: () => void) {
    debugHttp2(">>> _write", encoding, callback);
    if (typeof encoding === "function") {
      callback = encoding;
      encoding = this.#encoding;
    }
    let data;
    if (encoding === "utf8") {
      data = ENCODER.encode(chunk);
    } else if (encoding === "buffer") {
      this.#encoding = encoding;
      data = chunk.buffer;
    }

    this.#requestPromise
      .then(() => {
        debugHttp2(">>> _write", this.#rid, data, encoding, callback);
        return op_http2_client_send_data(this.#rid, new Uint8Array(data));
      })
      .then(() => {
        callback?.();
        debugHttp2(
          "this.writableFinished",
          this.pending,
          this.destroyed,
          this.writableFinished,
        );
      })
      .catch((e) => {
        callback?.(e);
      });
  }

  // TODO(bartlomieju): finish this method
  _writev(_chunks, _callback?) {
    notImplemented("ClientHttp2Stream._writev");
  }

  _final(cb) {
    debugHttp2("_final", new Error());
    if (this.pending) {
      this.once("ready", () => this._final(cb));
      return;
    }

    shutdownWritable(this, cb, this.#rid);
  }

  // TODO(bartlomieju): needs a proper cleanup
  _read() {
    if (this.destroyed) {
      this.push(null);
      return;
    }

    if (!this[kState].didRead) {
      this._readableState.readingMore = false;
      this[kState].didRead = true;
    }
    // if (!this.pending) {
    //   streamOnResume(this);
    // } else {
    //   this.once("ready", () => streamOnResume(this));
    // }

    if (!this[kDenoResponse]) {
      this.once("ready", this._read);
      return;
    }

    debugHttp2(">>> read");

    (async () => {
      const [chunk, finished, cancelled] =
        await op_http2_client_get_response_body_chunk(
          this[kDenoResponse].bodyRid,
        );

      if (cancelled) {
        return;
      }

      debugHttp2(">>> chunk", chunk, finished, this[kDenoResponse].bodyRid);
      if (finished || chunk === null) {
        this[kState].serverEndedCall = true;

        const trailerList = await op_http2_client_get_response_trailers(
          this[kDenoResponse].bodyRid,
        );
        if (trailerList) {
          const trailers = Object.fromEntries(trailerList);
          this.emit("trailers", trailers);
        }

        debugHttp2(">>> tryClose", this[kDenoResponse]?.bodyRid);
        core.tryClose(this[kDenoResponse].bodyRid);
        this.push(null);
        debugHttp2(">>> read null chunk");
        this.read(0);
        this[kMaybeDestroy]();
        return;
      }

      let result;
      if (this.#encoding === "utf8") {
        result = this.push(new TextDecoder().decode(new Uint8Array(chunk)));
      } else {
        result = this.push(new Uint8Array(chunk));
      }
      debugHttp2(">>> read result", result);
    })();
  }

  // TODO(bartlomieju):
  priority(_options: Record<string, unknown>) {
    notImplemented("Http2Stream.priority");
  }

  sendTrailers(trailers: Record<string, unknown>) {
    debugHttp2("sendTrailers", trailers);
    if (this.destroyed || this.closed) {
      throw new ERR_HTTP2_INVALID_STREAM();
    }
    if (this[kSentTrailers]) {
      throw new ERR_HTTP2_TRAILERS_ALREADY_SENT();
    }
    if (!this[kState].trailersReady) {
      throw new ERR_HTTP2_TRAILERS_NOT_READY();
    }

    trailers = Object.assign({ __proto__: null }, trailers);
    const trailerList = [];
    for (const [key, value] of Object.entries(trailers)) {
      trailerList.push([key, value]);
    }
    this[kSentTrailers] = trailers;

    // deno-lint-ignore no-this-alias
    const stream = this;
    stream[kState].flags &= ~STREAM_FLAGS_HAS_TRAILERS;
    debugHttp2("sending trailers", this.#rid, trailers);

    op_http2_client_send_trailers(
      this.#rid,
      trailerList,
    ).then(() => {
      stream[kMaybeDestroy]();
      core.tryClose(this.#rid);
    }).catch((e) => {
      debugHttp2(">>> send trailers error", e);
      core.tryClose(this.#rid);
      stream._destroy(e);
    });
  }

  get closed(): boolean {
    return !!(this[kState].flags & STREAM_FLAGS_CLOSED);
  }

  close(code: number = constants.NGHTTP2_NO_ERROR, callback?: () => void) {
    debugHttp2(">>> close", code, this.closed, callback);

    if (this.closed) {
      return;
    }
    if (typeof callback !== "undefined") {
      this.once("close", callback);
    }
    closeStream(this, code);
  }

  _destroy(err, callback) {
    debugHttp2(">>> ClientHttp2Stream._destroy", err, callback);
    const session = this[kSession];
    const id = this[kID];

    const state = this[kState];
    const sessionState = session[kState];
    const sessionCode = sessionState.goawayCode || sessionState.destroyCode;

    let code = this.closed ? this.rstCode : sessionCode;
    if (err != null) {
      if (sessionCode) {
        code = sessionCode;
      } else if (err instanceof AbortError) {
        code = constants.NGHTTP2_CANCEL;
      } else {
        code = constants.NGHTTP2_INTERNAL_ERROR;
      }
    }

    if (!this.closed) {
      // TODO(bartlomieju): this not handle `socket handle`
      closeStream(this, code, kNoRstStream);
    }

    sessionState.streams.delete(id);
    sessionState.pendingStreams.delete(this);

    sessionState.writeQueueSize -= state.writeQueueSize;
    state.writeQueueSize = 0;

    const nameForErrorCode = {};
    if (
      err == null && code !== constants.NGHTTP2_NO_ERROR &&
      code !== constants.NGHTTP2_CANCEL
    ) {
      err = new ERR_HTTP2_STREAM_ERROR(nameForErrorCode[code] || code);
    }

    this[kSession] = undefined;

    session[kMaybeDestroy]();
    if (callback) {
      callback(err);
    }
  }

  [kMaybeDestroy](code = constants.NGHTTP2_NO_ERROR) {
    debugHttp2(
      ">>> ClientHttp2Stream[kMaybeDestroy]",
      code,
      this.writableFinished,
      this.readable,
      this.closed,
    );
    if (code !== constants.NGHTTP2_NO_ERROR) {
      this._destroy();
      return;
    }

    if (this.writableFinished) {
      if (!this.readable && this.closed) {
        debugHttp2("going into _destroy");
        this._destroy();
        return;
      }
    }
  }

  setTimeout(msecs: number, callback?: () => void) {
    // TODO(bartlomieju): fix this call, it's crashing on `this` being undefined;
    // some strange transpilation quirk going on here.
    setStreamTimeout.call(this, msecs, callback);
  }
}

function shutdownWritable(stream, callback, streamRid) {
  debugHttp2(">>> shutdownWritable", callback);
  const state = stream[kState];
  if (state.shutdownWritableCalled) {
    debugHttp2(">>> shutdownWritable() already called");
    return callback();
  }
  state.shutdownWritableCalled = true;
  if (state.flags & STREAM_FLAGS_HAS_TRAILERS) {
    onStreamTrailers(stream);
    callback();
  } else if (state.serverEndedCall) {
    debugHttp2(">>> stream finished");
    callback();
  } else {
    op_http2_client_send_data(streamRid, new Uint8Array(), true)
      .then(() => {
        callback();
        stream[kMaybeDestroy]();
        core.tryClose(streamRid);
      })
      .catch((e) => {
        callback(e);
        core.tryClose(streamRid);
        stream._destroy(e);
      });
  }
  // TODO(bartlomieju): might have to add "finish" event listener here,
  // check it.
}

function onStreamTrailers(stream) {
  stream[kState].trailersReady = true;
  debugHttp2(">>> onStreamTrailers", stream.destroyed, stream.closed);
  if (stream.destroyed || stream.closed) {
    return;
  }
  if (!stream.emit("wantTrailers")) {
    debugHttp2(">>> onStreamTrailers no wantTrailers");
    stream.sendTrailers({});
  }
  debugHttp2(">>> onStreamTrailers wantTrailers");
}

const kNoRstStream = 0;
const kSubmitRstStream = 1;
const kForceRstStream = 2;

function closeStream(stream, code, rstStreamStatus = kSubmitRstStream) {
  const state = stream[kState];
  state.flags |= STREAM_FLAGS_CLOSED;
  state.rstCode = code;

  stream.setTimeout(0);
  stream.removeAllListeners("timeout");

  const { ending } = stream._writableState;

  if (!ending) {
    if (!stream.aborted) {
      state.flags |= STREAM_FLAGS_ABORTED;
      stream.emit("aborted");
    }

    stream.end();
  }

  if (rstStreamStatus != kNoRstStream) {
    debugHttp2(
      ">>> closeStream",
      !ending,
      stream.writableFinished,
      code !== constants.NGHTTP2_NO_ERROR,
      rstStreamStatus === kForceRstStream,
    );
    if (
      !ending || stream.writableFinished ||
      code !== constants.NGHTTP2_NO_ERROR || rstStreamStatus === kForceRstStream
    ) {
      finishCloseStream(stream, code);
    } else {
      stream.once("finish", () => finishCloseStream(stream, code));
    }
  }
}

function finishCloseStream(stream, code) {
  debugHttp2(">>> finishCloseStream", stream.readableEnded, code);
  if (stream.pending) {
    stream.push(null);
    stream.once("ready", () => {
      op_http2_client_reset_stream(
        stream[kDenoRid],
        code,
      ).then(() => {
        debugHttp2(
          ">>> finishCloseStream close",
          stream[kDenoRid],
          stream[kDenoResponse]?.bodyRid,
        );
        core.tryClose(stream[kDenoRid]);
        if (stream[kDenoResponse]) {
          core.tryClose(stream[kDenoResponse].bodyRid);
        }
        stream.emit("close");
      });
    });
  } else {
    stream.resume();
    op_http2_client_reset_stream(
      stream[kDenoRid],
      code,
    ).then(() => {
      debugHttp2(
        ">>> finishCloseStream close2",
        stream[kDenoRid],
        stream[kDenoResponse].bodyRid,
      );
      core.tryClose(stream[kDenoRid]);
      if (stream[kDenoResponse]) {
        core.tryClose(stream[kDenoResponse].bodyRid);
      }
      nextTick(() => {
        stream.emit("close");
      });
    }).catch(() => {
      debugHttp2(
        ">>> finishCloseStream close2 catch",
        stream[kDenoRid],
        stream[kDenoResponse]?.bodyRid,
      );
      core.tryClose(stream[kDenoRid]);
      if (stream[kDenoResponse]) {
        core.tryClose(stream[kDenoResponse].bodyRid);
      }
      nextTick(() => {
        stream.emit("close");
      });
    });
  }
}

function callTimeout() {
  notImplemented("callTimeout");
}

export class ServerHttp2Stream extends Http2Stream {
  _deferred: ReturnType<typeof Promise.withResolvers<Response>>;
  #body: ReadableStream<Uint8Array>;
  #waitForTrailers: boolean;
  #headersSent: boolean;

  constructor(
    session: Http2Session,
    headers: Promise<Http2Headers>,
    controllerPromise: Promise<ReadableStreamDefaultController<Uint8Array>>,
    reader: ReadableStream<Uint8Array>,
    body: ReadableStream<Uint8Array>,
    // This is required to set the trailers on the response.
    req: Request,
  ) {
    super(session, headers, controllerPromise, Promise.resolve(reader));
    this._deferred = Promise.withResolvers<Response>();
    this.#body = body;
    this._request = req;
  }

  additionalHeaders(_headers: Record<string, unknown>) {
    notImplemented("ServerHttp2Stream.additionalHeaders");
  }

  end(): void {
    super.end();
    if (this.#waitForTrailers) {
      this.emit("wantTrailers");
    }
  }

  get headersSent(): boolean {
    return this.#headersSent;
  }

  get pushAllowed(): boolean {
    notImplemented("ServerHttp2Stream.pushAllowed");
    return false;
  }

  pushStream(
    _headers: Record<string, unknown>,
    _options: Record<string, unknown>,
    _callback: () => unknown,
  ) {
    notImplemented("ServerHttp2Stream.pushStream");
  }

  respond(
    headers: Http2Headers,
    options: Record<string, unknown>,
  ) {
    this.#headersSent = true;
    const response: ResponseInit = {};
    if (headers) {
      for (const [name, value] of Object.entries(headers)) {
        if (name == constants.HTTP2_HEADER_STATUS) {
          response.status = Number(value);
        }
      }
    }
    if (options?.endStream) {
      this._deferred.resolve(this._response = new Response("", response));
    } else {
      this.#waitForTrailers = options?.waitForTrailers;
      this._deferred.resolve(
        this._response = new Response(this.#body, response),
      );
    }
  }

  respondWithFD(
    _fd: number | FileHandle,
    _headers: Record<string, unknown>,
    _options: Record<string, unknown>,
  ) {
    notImplemented("ServerHttp2Stream.respondWithFD");
  }

  respondWithFile(
    _path: string | Buffer | URL,
    _headers: Record<string, unknown>,
    _options: Record<string, unknown>,
  ) {
    notImplemented("ServerHttp2Stream.respondWithFile");
  }
}

function setupCompat(ev) {
  if (ev === "request") {
    this.removeListener("newListener", setupCompat);
    this.on(
      "stream",
      FunctionPrototypeBind(
        onServerStream,
        this,
        this[kOptions].Http2ServerRequest,
        this[kOptions].Http2ServerResponse,
      ),
    );
  }
}

function onServerStream(
  ServerRequest,
  ServerResponse,
  stream,
  headers,
  _flags,
  rawHeaders,
) {
  const request = new ServerRequest(stream, headers, undefined, rawHeaders);
  const response = new ServerResponse(stream);

  // Check for the CONNECT method
  const method = headers[constants.HTTP2_HEADER_METHOD];
  if (method === "CONNECT") {
    if (!this.emit("connect", request, response)) {
      response.statusCode = constants.HTTP_STATUS_METHOD_NOT_ALLOWED;
      response.end();
    }
    return;
  }

  // Check for Expectations
  if (headers.expect !== undefined) {
    if (headers.expect === "100-continue") {
      if (this.listenerCount("checkContinue")) {
        this.emit("checkContinue", request, response);
      } else {
        response.writeContinue();
        this.emit("request", request, response);
      }
    } else if (this.listenerCount("checkExpectation")) {
      this.emit("checkExpectation", request, response);
    } else {
      response.statusCode = constants.HTTP_STATUS_EXPECTATION_FAILED;
      response.end();
    }
    return;
  }

  this.emit("request", request, response);
}

function initializeOptions(options) {
  // assertIsObject(options, 'options');
  options = { ...options };
  // assertIsObject(options.settings, 'options.settings');
  options.settings = { ...options.settings };

  // assertIsArray(options.remoteCustomSettings, 'options.remoteCustomSettings');
  if (options.remoteCustomSettings) {
    options.remoteCustomSettings = [...options.remoteCustomSettings];
    if (options.remoteCustomSettings.length > MAX_ADDITIONAL_SETTINGS) {
      throw new ERR_HTTP2_TOO_MANY_CUSTOM_SETTINGS();
    }
  }

  // if (options.maxSessionInvalidFrames !== undefined)
  // validateUint32(options.maxSessionInvalidFrames, 'maxSessionInvalidFrames');

  // if (options.maxSessionRejectedStreams !== undefined) {
  //   validateUint32(
  //     options.maxSessionRejectedStreams,
  //     'maxSessionRejectedStreams',
  //   );
  // }

  if (options.unknownProtocolTimeout !== undefined) {
    // validateUint32(options.unknownProtocolTimeout, 'unknownProtocolTimeout');
  } else {
    // TODO(danbev): is this a good default value?
    options.unknownProtocolTimeout = 10000;
  }

  // Used only with allowHTTP1
  // options.Http1IncomingMessage = options.Http1IncomingMessage ||
  //   http.IncomingMessage;
  // options.Http1ServerResponse = options.Http1ServerResponse ||
  //   http.ServerResponse;

  options.Http2ServerRequest = options.Http2ServerRequest ||
    Http2ServerRequest;
  options.Http2ServerResponse = options.Http2ServerResponse ||
    Http2ServerResponse;
  return options;
}

export class Http2Server extends Server {
  #options: Record<string, unknown> = {};
  #abortController;
  #server;
  timeout = 0;

  constructor(
    options: Record<string, unknown>,
    requestListener: () => unknown,
  ) {
    options = initializeOptions(options);
    super(options);
    this[kOptions] = options;
    this.#abortController = new AbortController();
    this.on("newListener", setupCompat);

    this.on(
      "connection",
      (conn: Deno.Conn) => {
        try {
          const session = new ServerHttp2Session();
          this.emit("session", session);
          this.#server = serveHttpOnConnection(
            conn,
            this.#abortController.signal,
            async (req: Request) => {
              try {
                const controllerDeferred = Promise.withResolvers<
                  ReadableStreamDefaultController<Uint8Array>
                >();
                const body = new ReadableStream({
                  start(controller) {
                    controllerDeferred.resolve(controller);
                  },
                });
                const headers: Http2Headers = {};
                for (const [name, value] of req.headers) {
                  headers[name] = value;
                }
                headers[constants.HTTP2_HEADER_PATH] =
                  new URL(req.url).pathname;
                const stream = new ServerHttp2Stream(
                  session,
                  Promise.resolve(headers),
                  controllerDeferred.promise,
                  req.body,
                  body,
                  req,
                );
                this.emit("stream", stream, headers);
                return await stream._deferred.promise;
              } catch (e) {
                // deno-lint-ignore no-console
                console.log(">>> Error in serveHttpOnConnection", e);
              }
              return new Response("");
            },
            () => {
              // deno-lint-ignore no-console
              console.log(">>> error");
            },
            () => {},
          );
        } catch (e) {
          // deno-lint-ignore no-console
          console.log(">>> Error in Http2Server", e);
        }
      },
    );
    this.#options = options;
    if (typeof requestListener === "function") {
      this.on("request", requestListener);
    }
  }

  // Prevent the TCP server from wrapping this in a socket, since we need it to serve HTTP
  _createSocket(clientHandle: TCP) {
    return clientHandle[kStreamBaseField];
  }

  setTimeout(msecs: number, callback?: () => unknown) {
    this.timeout = msecs;
    if (callback !== undefined) {
      this.on("timeout", callback);
    }
  }

  updateSettings(settings: Record<string, unknown>) {
    this.#options.settings = { ...this.#options.settings, ...settings };
  }
}

export class Http2SecureServer extends Server {
  #options: Record<string, unknown> = {};
  timeout = 0;

  constructor(
    options: Record<string, unknown>,
    requestListener: () => unknown,
  ) {
    super(options, function () {
      notImplemented("connectionListener");
    });
    this.#options = options;
    if (typeof requestListener === "function") {
      this.on("request", requestListener);
    }
  }

  close(_callback?: () => unknown) {
    notImplemented("Http2SecureServer.close");
  }

  setTimeout(msecs: number, callback?: () => unknown) {
    this.timeout = msecs;
    if (callback !== undefined) {
      this.on("timeout", callback);
    }
  }

  updateSettings(settings: Record<string, unknown>) {
    this.#options.settings = { ...this.#options.settings, ...settings };
  }
}

export function createServer(
  options: Record<string, unknown>,
  onRequestHandler: () => unknown,
): Http2Server {
  if (typeof options === "function") {
    onRequestHandler = options;
    options = {};
  }
  return new Http2Server(options, onRequestHandler);
}

export function createSecureServer(
  _options: Record<string, unknown>,
  _onRequestHandler: () => unknown,
): Http2SecureServer {
  notImplemented("http2.createSecureServer");
  return new Http2SecureServer();
}

export function connect(
  authority: string | URL,
  options: Record<string, unknown>,
  callback: (session: ClientHttp2Session) => void,
): ClientHttp2Session {
  debugHttp2(">>> http2.connect", options);

  if (typeof options === "function") {
    callback = options;
    options = undefined;
  }

  options = { ...options };

  if (typeof authority === "string") {
    authority = new URL(authority);
  }

  const protocol = authority.protocol || options.protocol || "https:";
  let port = 0;

  if (authority.port !== "") {
    port = Number(authority.port);
  } else if (protocol === "http:") {
    port = 80;
  } else {
    port = 443;
  }

  if (port == 0) {
    throw new Error("Invalid port");
  }

  let host = "localhost";

  if (authority.hostname) {
    host = authority.hostname;

    if (host[0] === "[") {
      host = host.slice(1, -1);
    }
  } else if (authority.host) {
    host = authority.host;
  }

  let url, socket;

  if (typeof options.createConnection === "function") {
    url = `http://${host}${port == 80 ? "" : (":" + port)}`;
    socket = options.createConnection(host, options);
  } else {
    switch (protocol) {
      case "http:":
        url = `http://${host}${port == 80 ? "" : (":" + port)}`;
        socket = netConnect({ port, host, ...options, pauseOnCreate: true });
        break;
      case "https:":
        // TODO(bartlomieju): handle `initializeTLSOptions` here
        url = `https://${host}${port == 443 ? "" : (":" + port)}`;
        socket = tlsConnect(port, host, {
          manualStart: true,
          ALPNProtocols: ["h2", "http/1.1"],
        });
        break;
      default:
        throw new ERR_HTTP2_UNSUPPORTED_PROTOCOL(protocol);
    }
  }

  // Pause so no "socket.read()" starts in the background that would
  // prevent us from taking ownership of the socket in `ClientHttp2Session`
  socket.pause();
  const session = new ClientHttp2Session(socket, url, options);

  session[kAuthority] = `${options.servername || host}:${port}`;
  session[kProtocol] = protocol;

  if (typeof callback === "function") {
    session.once("connect", callback);
  }
  return session;
}

function socketOnError(error) {
  const session = this[kSession];
  if (session !== undefined) {
    if (error.code === "ECONNRESET" && session[kState].goawayCode !== null) {
      return session.destroy();
    }
    debugHttp2(">>>> socket error", error);
    session.destroy(error);
  }
}

function socketOnClose() {
  const session = this[kSession];
  if (session !== undefined) {
    debugHttp2(">>>> socket closed");
    const err = session.connecting ? new ERR_SOCKET_CLOSED() : null;
    const state = session[kState];
    state.streams.forEach((stream) => stream.close(constants.NGHTTP2_CANCEL));
    state.pendingStreams.forEach((stream) =>
      stream.close(constants.NGHTTP2_CANCEL)
    );
    session.close();
    session[kMaybeDestroy](err);
  }
}

export const constants = {
  NGHTTP2_ERR_FRAME_SIZE_ERROR: -522,
  NGHTTP2_NV_FLAG_NONE: 0,
  NGHTTP2_NV_FLAG_NO_INDEX: 1,
  NGHTTP2_SESSION_SERVER: 0,
  NGHTTP2_SESSION_CLIENT: 1,
  NGHTTP2_STREAM_STATE_IDLE: 1,
  NGHTTP2_STREAM_STATE_OPEN: 2,
  NGHTTP2_STREAM_STATE_RESERVED_LOCAL: 3,
  NGHTTP2_STREAM_STATE_RESERVED_REMOTE: 4,
  NGHTTP2_STREAM_STATE_HALF_CLOSED_LOCAL: 5,
  NGHTTP2_STREAM_STATE_HALF_CLOSED_REMOTE: 6,
  NGHTTP2_STREAM_STATE_CLOSED: 7,
  NGHTTP2_FLAG_NONE: 0,
  NGHTTP2_FLAG_END_STREAM: 1,
  NGHTTP2_FLAG_END_HEADERS: 4,
  NGHTTP2_FLAG_ACK: 1,
  NGHTTP2_FLAG_PADDED: 8,
  NGHTTP2_FLAG_PRIORITY: 32,
  DEFAULT_SETTINGS_HEADER_TABLE_SIZE: 4096,
  DEFAULT_SETTINGS_ENABLE_PUSH: 1,
  DEFAULT_SETTINGS_MAX_CONCURRENT_STREAMS: 4294967295,
  DEFAULT_SETTINGS_INITIAL_WINDOW_SIZE: 65535,
  DEFAULT_SETTINGS_MAX_FRAME_SIZE: 16384,
  DEFAULT_SETTINGS_MAX_HEADER_LIST_SIZE: 65535,
  DEFAULT_SETTINGS_ENABLE_CONNECT_PROTOCOL: 0,
  MAX_MAX_FRAME_SIZE: 16777215,
  MIN_MAX_FRAME_SIZE: 16384,
  MAX_INITIAL_WINDOW_SIZE: 2147483647,
  NGHTTP2_SETTINGS_HEADER_TABLE_SIZE: 1,
  NGHTTP2_SETTINGS_ENABLE_PUSH: 2,
  NGHTTP2_SETTINGS_MAX_CONCURRENT_STREAMS: 3,
  NGHTTP2_SETTINGS_INITIAL_WINDOW_SIZE: 4,
  NGHTTP2_SETTINGS_MAX_FRAME_SIZE: 5,
  NGHTTP2_SETTINGS_MAX_HEADER_LIST_SIZE: 6,
  NGHTTP2_SETTINGS_ENABLE_CONNECT_PROTOCOL: 8,
  PADDING_STRATEGY_NONE: 0,
  PADDING_STRATEGY_ALIGNED: 1,
  PADDING_STRATEGY_MAX: 2,
  PADDING_STRATEGY_CALLBACK: 1,
  NGHTTP2_NO_ERROR: 0,
  NGHTTP2_PROTOCOL_ERROR: 1,
  NGHTTP2_INTERNAL_ERROR: 2,
  NGHTTP2_FLOW_CONTROL_ERROR: 3,
  NGHTTP2_SETTINGS_TIMEOUT: 4,
  NGHTTP2_STREAM_CLOSED: 5,
  NGHTTP2_FRAME_SIZE_ERROR: 6,
  NGHTTP2_REFUSED_STREAM: 7,
  NGHTTP2_CANCEL: 8,
  NGHTTP2_COMPRESSION_ERROR: 9,
  NGHTTP2_CONNECT_ERROR: 10,
  NGHTTP2_ENHANCE_YOUR_CALM: 11,
  NGHTTP2_INADEQUATE_SECURITY: 12,
  NGHTTP2_HTTP_1_1_REQUIRED: 13,
  NGHTTP2_DEFAULT_WEIGHT: 16,
  HTTP2_HEADER_STATUS: ":status",
  HTTP2_HEADER_METHOD: ":method",
  HTTP2_HEADER_AUTHORITY: ":authority",
  HTTP2_HEADER_SCHEME: ":scheme",
  HTTP2_HEADER_PATH: ":path",
  HTTP2_HEADER_PROTOCOL: ":protocol",
  HTTP2_HEADER_ACCEPT_ENCODING: "accept-encoding",
  HTTP2_HEADER_ACCEPT_LANGUAGE: "accept-language",
  HTTP2_HEADER_ACCEPT_RANGES: "accept-ranges",
  HTTP2_HEADER_ACCEPT: "accept",
  HTTP2_HEADER_ACCESS_CONTROL_ALLOW_CREDENTIALS:
    "access-control-allow-credentials",
  HTTP2_HEADER_ACCESS_CONTROL_ALLOW_HEADERS: "access-control-allow-headers",
  HTTP2_HEADER_ACCESS_CONTROL_ALLOW_METHODS: "access-control-allow-methods",
  HTTP2_HEADER_ACCESS_CONTROL_ALLOW_ORIGIN: "access-control-allow-origin",
  HTTP2_HEADER_ACCESS_CONTROL_EXPOSE_HEADERS: "access-control-expose-headers",
  HTTP2_HEADER_ACCESS_CONTROL_REQUEST_HEADERS: "access-control-request-headers",
  HTTP2_HEADER_ACCESS_CONTROL_REQUEST_METHOD: "access-control-request-method",
  HTTP2_HEADER_AGE: "age",
  HTTP2_HEADER_AUTHORIZATION: "authorization",
  HTTP2_HEADER_CACHE_CONTROL: "cache-control",
  HTTP2_HEADER_CONNECTION: "connection",
  HTTP2_HEADER_CONTENT_DISPOSITION: "content-disposition",
  HTTP2_HEADER_CONTENT_ENCODING: "content-encoding",
  HTTP2_HEADER_CONTENT_LENGTH: "content-length",
  HTTP2_HEADER_CONTENT_TYPE: "content-type",
  HTTP2_HEADER_COOKIE: "cookie",
  HTTP2_HEADER_DATE: "date",
  HTTP2_HEADER_ETAG: "etag",
  HTTP2_HEADER_FORWARDED: "forwarded",
  HTTP2_HEADER_HOST: "host",
  HTTP2_HEADER_IF_MODIFIED_SINCE: "if-modified-since",
  HTTP2_HEADER_IF_NONE_MATCH: "if-none-match",
  HTTP2_HEADER_IF_RANGE: "if-range",
  HTTP2_HEADER_LAST_MODIFIED: "last-modified",
  HTTP2_HEADER_LINK: "link",
  HTTP2_HEADER_LOCATION: "location",
  HTTP2_HEADER_RANGE: "range",
  HTTP2_HEADER_REFERER: "referer",
  HTTP2_HEADER_SERVER: "server",
  HTTP2_HEADER_SET_COOKIE: "set-cookie",
  HTTP2_HEADER_STRICT_TRANSPORT_SECURITY: "strict-transport-security",
  HTTP2_HEADER_TRANSFER_ENCODING: "transfer-encoding",
  HTTP2_HEADER_TE: "te",
  HTTP2_HEADER_UPGRADE_INSECURE_REQUESTS: "upgrade-insecure-requests",
  HTTP2_HEADER_UPGRADE: "upgrade",
  HTTP2_HEADER_USER_AGENT: "user-agent",
  HTTP2_HEADER_VARY: "vary",
  HTTP2_HEADER_X_CONTENT_TYPE_OPTIONS: "x-content-type-options",
  HTTP2_HEADER_X_FRAME_OPTIONS: "x-frame-options",
  HTTP2_HEADER_KEEP_ALIVE: "keep-alive",
  HTTP2_HEADER_PROXY_CONNECTION: "proxy-connection",
  HTTP2_HEADER_X_XSS_PROTECTION: "x-xss-protection",
  HTTP2_HEADER_ALT_SVC: "alt-svc",
  HTTP2_HEADER_CONTENT_SECURITY_POLICY: "content-security-policy",
  HTTP2_HEADER_EARLY_DATA: "early-data",
  HTTP2_HEADER_EXPECT_CT: "expect-ct",
  HTTP2_HEADER_ORIGIN: "origin",
  HTTP2_HEADER_PURPOSE: "purpose",
  HTTP2_HEADER_TIMING_ALLOW_ORIGIN: "timing-allow-origin",
  HTTP2_HEADER_X_FORWARDED_FOR: "x-forwarded-for",
  HTTP2_HEADER_PRIORITY: "priority",
  HTTP2_HEADER_ACCEPT_CHARSET: "accept-charset",
  HTTP2_HEADER_ACCESS_CONTROL_MAX_AGE: "access-control-max-age",
  HTTP2_HEADER_ALLOW: "allow",
  HTTP2_HEADER_CONTENT_LANGUAGE: "content-language",
  HTTP2_HEADER_CONTENT_LOCATION: "content-location",
  HTTP2_HEADER_CONTENT_MD5: "content-md5",
  HTTP2_HEADER_CONTENT_RANGE: "content-range",
  HTTP2_HEADER_DNT: "dnt",
  HTTP2_HEADER_EXPECT: "expect",
  HTTP2_HEADER_EXPIRES: "expires",
  HTTP2_HEADER_FROM: "from",
  HTTP2_HEADER_IF_MATCH: "if-match",
  HTTP2_HEADER_IF_UNMODIFIED_SINCE: "if-unmodified-since",
  HTTP2_HEADER_MAX_FORWARDS: "max-forwards",
  HTTP2_HEADER_PREFER: "prefer",
  HTTP2_HEADER_PROXY_AUTHENTICATE: "proxy-authenticate",
  HTTP2_HEADER_PROXY_AUTHORIZATION: "proxy-authorization",
  HTTP2_HEADER_REFRESH: "refresh",
  HTTP2_HEADER_RETRY_AFTER: "retry-after",
  HTTP2_HEADER_TRAILER: "trailer",
  HTTP2_HEADER_TK: "tk",
  HTTP2_HEADER_VIA: "via",
  HTTP2_HEADER_WARNING: "warning",
  HTTP2_HEADER_WWW_AUTHENTICATE: "www-authenticate",
  HTTP2_HEADER_HTTP2_SETTINGS: "http2-settings",
  HTTP2_METHOD_ACL: "ACL",
  HTTP2_METHOD_BASELINE_CONTROL: "BASELINE-CONTROL",
  HTTP2_METHOD_BIND: "BIND",
  HTTP2_METHOD_CHECKIN: "CHECKIN",
  HTTP2_METHOD_CHECKOUT: "CHECKOUT",
  HTTP2_METHOD_CONNECT: "CONNECT",
  HTTP2_METHOD_COPY: "COPY",
  HTTP2_METHOD_DELETE: "DELETE",
  HTTP2_METHOD_GET: "GET",
  HTTP2_METHOD_HEAD: "HEAD",
  HTTP2_METHOD_LABEL: "LABEL",
  HTTP2_METHOD_LINK: "LINK",
  HTTP2_METHOD_LOCK: "LOCK",
  HTTP2_METHOD_MERGE: "MERGE",
  HTTP2_METHOD_MKACTIVITY: "MKACTIVITY",
  HTTP2_METHOD_MKCALENDAR: "MKCALENDAR",
  HTTP2_METHOD_MKCOL: "MKCOL",
  HTTP2_METHOD_MKREDIRECTREF: "MKREDIRECTREF",
  HTTP2_METHOD_MKWORKSPACE: "MKWORKSPACE",
  HTTP2_METHOD_MOVE: "MOVE",
  HTTP2_METHOD_OPTIONS: "OPTIONS",
  HTTP2_METHOD_ORDERPATCH: "ORDERPATCH",
  HTTP2_METHOD_PATCH: "PATCH",
  HTTP2_METHOD_POST: "POST",
  HTTP2_METHOD_PRI: "PRI",
  HTTP2_METHOD_PROPFIND: "PROPFIND",
  HTTP2_METHOD_PROPPATCH: "PROPPATCH",
  HTTP2_METHOD_PUT: "PUT",
  HTTP2_METHOD_REBIND: "REBIND",
  HTTP2_METHOD_REPORT: "REPORT",
  HTTP2_METHOD_SEARCH: "SEARCH",
  HTTP2_METHOD_TRACE: "TRACE",
  HTTP2_METHOD_UNBIND: "UNBIND",
  HTTP2_METHOD_UNCHECKOUT: "UNCHECKOUT",
  HTTP2_METHOD_UNLINK: "UNLINK",
  HTTP2_METHOD_UNLOCK: "UNLOCK",
  HTTP2_METHOD_UPDATE: "UPDATE",
  HTTP2_METHOD_UPDATEREDIRECTREF: "UPDATEREDIRECTREF",
  HTTP2_METHOD_VERSION_CONTROL: "VERSION-CONTROL",
  HTTP_STATUS_CONTINUE: 100,
  HTTP_STATUS_SWITCHING_PROTOCOLS: 101,
  HTTP_STATUS_PROCESSING: 102,
  HTTP_STATUS_EARLY_HINTS: 103,
  HTTP_STATUS_OK: 200,
  HTTP_STATUS_CREATED: 201,
  HTTP_STATUS_ACCEPTED: 202,
  HTTP_STATUS_NON_AUTHORITATIVE_INFORMATION: 203,
  HTTP_STATUS_NO_CONTENT: 204,
  HTTP_STATUS_RESET_CONTENT: 205,
  HTTP_STATUS_PARTIAL_CONTENT: 206,
  HTTP_STATUS_MULTI_STATUS: 207,
  HTTP_STATUS_ALREADY_REPORTED: 208,
  HTTP_STATUS_IM_USED: 226,
  HTTP_STATUS_MULTIPLE_CHOICES: 300,
  HTTP_STATUS_MOVED_PERMANENTLY: 301,
  HTTP_STATUS_FOUND: 302,
  HTTP_STATUS_SEE_OTHER: 303,
  HTTP_STATUS_NOT_MODIFIED: 304,
  HTTP_STATUS_USE_PROXY: 305,
  HTTP_STATUS_TEMPORARY_REDIRECT: 307,
  HTTP_STATUS_PERMANENT_REDIRECT: 308,
  HTTP_STATUS_BAD_REQUEST: 400,
  HTTP_STATUS_UNAUTHORIZED: 401,
  HTTP_STATUS_PAYMENT_REQUIRED: 402,
  HTTP_STATUS_FORBIDDEN: 403,
  HTTP_STATUS_NOT_FOUND: 404,
  HTTP_STATUS_METHOD_NOT_ALLOWED: 405,
  HTTP_STATUS_NOT_ACCEPTABLE: 406,
  HTTP_STATUS_PROXY_AUTHENTICATION_REQUIRED: 407,
  HTTP_STATUS_REQUEST_TIMEOUT: 408,
  HTTP_STATUS_CONFLICT: 409,
  HTTP_STATUS_GONE: 410,
  HTTP_STATUS_LENGTH_REQUIRED: 411,
  HTTP_STATUS_PRECONDITION_FAILED: 412,
  HTTP_STATUS_PAYLOAD_TOO_LARGE: 413,
  HTTP_STATUS_URI_TOO_LONG: 414,
  HTTP_STATUS_UNSUPPORTED_MEDIA_TYPE: 415,
  HTTP_STATUS_RANGE_NOT_SATISFIABLE: 416,
  HTTP_STATUS_EXPECTATION_FAILED: 417,
  HTTP_STATUS_TEAPOT: 418,
  HTTP_STATUS_MISDIRECTED_REQUEST: 421,
  HTTP_STATUS_UNPROCESSABLE_ENTITY: 422,
  HTTP_STATUS_LOCKED: 423,
  HTTP_STATUS_FAILED_DEPENDENCY: 424,
  HTTP_STATUS_TOO_EARLY: 425,
  HTTP_STATUS_UPGRADE_REQUIRED: 426,
  HTTP_STATUS_PRECONDITION_REQUIRED: 428,
  HTTP_STATUS_TOO_MANY_REQUESTS: 429,
  HTTP_STATUS_REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
  HTTP_STATUS_UNAVAILABLE_FOR_LEGAL_REASONS: 451,
  HTTP_STATUS_INTERNAL_SERVER_ERROR: 500,
  HTTP_STATUS_NOT_IMPLEMENTED: 501,
  HTTP_STATUS_BAD_GATEWAY: 502,
  HTTP_STATUS_SERVICE_UNAVAILABLE: 503,
  HTTP_STATUS_GATEWAY_TIMEOUT: 504,
  HTTP_STATUS_HTTP_VERSION_NOT_SUPPORTED: 505,
  HTTP_STATUS_VARIANT_ALSO_NEGOTIATES: 506,
  HTTP_STATUS_INSUFFICIENT_STORAGE: 507,
  HTTP_STATUS_LOOP_DETECTED: 508,
  HTTP_STATUS_BANDWIDTH_LIMIT_EXCEEDED: 509,
  HTTP_STATUS_NOT_EXTENDED: 510,
  HTTP_STATUS_NETWORK_AUTHENTICATION_REQUIRED: 511,
};

// const kSingleValueHeaders = new Set([
//   constants.HTTP2_HEADER_STATUS,
//   constants.HTTP2_HEADER_METHOD,
//   constants.HTTP2_HEADER_AUTHORITY,
//   constants.HTTP2_HEADER_SCHEME,
//   constants.HTTP2_HEADER_PATH,
//   constants.HTTP2_HEADER_PROTOCOL,
//   constants.HTTP2_HEADER_ACCESS_CONTROL_ALLOW_CREDENTIALS,
//   constants.HTTP2_HEADER_ACCESS_CONTROL_MAX_AGE,
//   constants.HTTP2_HEADER_ACCESS_CONTROL_REQUEST_METHOD,
//   constants.HTTP2_HEADER_AGE,
//   constants.HTTP2_HEADER_AUTHORIZATION,
//   constants.HTTP2_HEADER_CONTENT_ENCODING,
//   constants.HTTP2_HEADER_CONTENT_LANGUAGE,
//   constants.HTTP2_HEADER_CONTENT_LENGTH,
//   constants.HTTP2_HEADER_CONTENT_LOCATION,
//   constants.HTTP2_HEADER_CONTENT_MD5,
//   constants.HTTP2_HEADER_CONTENT_RANGE,
//   constants.HTTP2_HEADER_CONTENT_TYPE,
//   constants.HTTP2_HEADER_DATE,
//   constants.HTTP2_HEADER_DNT,
//   constants.HTTP2_HEADER_ETAG,
//   constants.HTTP2_HEADER_EXPIRES,
//   constants.HTTP2_HEADER_FROM,
//   constants.HTTP2_HEADER_HOST,
//   constants.HTTP2_HEADER_IF_MATCH,
//   constants.HTTP2_HEADER_IF_MODIFIED_SINCE,
//   constants.HTTP2_HEADER_IF_NONE_MATCH,
//   constants.HTTP2_HEADER_IF_RANGE,
//   constants.HTTP2_HEADER_IF_UNMODIFIED_SINCE,
//   constants.HTTP2_HEADER_LAST_MODIFIED,
//   constants.HTTP2_HEADER_LOCATION,
//   constants.HTTP2_HEADER_MAX_FORWARDS,
//   constants.HTTP2_HEADER_PROXY_AUTHORIZATION,
//   constants.HTTP2_HEADER_RANGE,
//   constants.HTTP2_HEADER_REFERER,
//   constants.HTTP2_HEADER_RETRY_AFTER,
//   constants.HTTP2_HEADER_TK,
//   constants.HTTP2_HEADER_UPGRADE_INSECURE_REQUESTS,
//   constants.HTTP2_HEADER_USER_AGENT,
//   constants.HTTP2_HEADER_X_CONTENT_TYPE_OPTIONS,
// ]);

export function getDefaultSettings(): Record<string, unknown> {
  notImplemented("http2.getDefaultSettings");
  return {};
}

export function getPackedSettings(_settings: Record<string, unknown>): Buffer {
  notImplemented("http2.getPackedSettings");
  return {};
}

export function getUnpackedSettings(
  _buffer: Buffer | TypedArray,
): Record<string, unknown> {
  notImplemented("http2.getUnpackedSettings");
  return {};
}

export const sensitiveHeaders = Symbol("nodejs.http2.sensitiveHeaders");

const kBeginSend = Symbol("begin-send");
const kStream = Symbol("stream");
const kResponse = Symbol("response");
const kHeaders = Symbol("headers");
const kRawHeaders = Symbol("rawHeaders");
const kTrailers = Symbol("trailers");
const kRawTrailers = Symbol("rawTrailers");
const kSetHeader = Symbol("setHeader");
const kAppendHeader = Symbol("appendHeader");
const kAborted = Symbol("aborted");
const kRequest = Symbol("request");

const streamProxySocketHandler = {
  has(stream, prop) {
    const ref = stream.session !== undefined ? stream.session[kSocket] : stream;
    return (prop in stream) || (prop in ref);
  },

  get(stream, prop) {
    switch (prop) {
      case "on":
      case "once":
      case "end":
      case "emit":
      case "destroy":
        return FunctionPrototypeBind(stream[prop], stream);
      case "writable":
      case "destroyed":
        return stream[prop];
      case "readable": {
        if (stream.destroyed) {
          return false;
        }
        const request = stream[kRequest];
        return request ? request.readable : stream.readable;
      }
      case "setTimeout": {
        const session = stream.session;
        if (session !== undefined) {
          return FunctionPrototypeBind(session.setTimeout, session);
        }
        return FunctionPrototypeBind(stream.setTimeout, stream);
      }
      case "write":
      case "read":
      case "pause":
      case "resume":
        throw new ERR_HTTP2_NO_SOCKET_MANIPULATION();
      default: {
        const ref = stream.session !== undefined
          ? stream.session[kSocket]
          : stream;
        const value = ref[prop];
        return typeof value === "function"
          ? FunctionPrototypeBind(value, ref)
          : value;
      }
    }
  },
  getPrototypeOf(stream) {
    if (stream.session !== undefined) {
      return ReflectGetPrototypeOf(stream.session[kSocket]);
    }
    return ReflectGetPrototypeOf(stream);
  },
  set(stream, prop, value) {
    switch (prop) {
      case "writable":
      case "readable":
      case "destroyed":
      case "on":
      case "once":
      case "end":
      case "emit":
      case "destroy":
        stream[prop] = value;
        return true;
      case "setTimeout": {
        const session = stream.session;
        if (session !== undefined) {
          session.setTimeout = value;
        } else {
          stream.setTimeout = value;
        }
        return true;
      }
      case "write":
      case "read":
      case "pause":
      case "resume":
        throw new ERR_HTTP2_NO_SOCKET_MANIPULATION();
      default: {
        const ref = stream.session !== undefined
          ? stream.session[kSocket]
          : stream;
        ref[prop] = value;
        return true;
      }
    }
  },
};

function onStreamCloseRequest() {
  const req = this[kRequest];

  if (req === undefined) {
    return;
  }

  const state = req[kState];
  state.closed = true;

  req.push(null);
  // If the user didn't interact with incoming data and didn't pipe it,
  // dump it for compatibility with http1
  if (!state.didRead && !req._readableState.resumeScheduled) {
    req.resume();
  }

  this[kProxySocket] = null;
  this[kRequest] = undefined;

  req.emit("close");
}

function onStreamTimeout(kind) {
  return function onStreamTimeout() {
    const obj = this[kind];
    obj.emit("timeout");
  };
}

export class Http2ServerRequest extends Readable {
  readableEnded = false;

  constructor(stream, headers, options, rawHeaders) {
    super({ autoDestroy: false, ...options });
    this[kState] = {
      closed: false,
      didRead: false,
    };
    // Headers in HTTP/1 are not initialized using Object.create(null) which,
    // although preferable, would simply break too much code. Ergo header
    // initialization using Object.create(null) in HTTP/2 is intentional.
    this[kHeaders] = headers;
    this[kRawHeaders] = rawHeaders;
    this[kTrailers] = {};
    this[kRawTrailers] = [];
    this[kStream] = stream;
    this[kAborted] = false;
    stream[kProxySocket] = null;
    stream[kRequest] = this;

    // Pause the stream..
    stream.on("trailers", onStreamTrailers);
    stream.on("end", onStreamEnd);
    stream.on("error", onStreamError);
    stream.on("aborted", onStreamAbortedRequest);
    stream.on("close", onStreamCloseRequest);
    stream.on("timeout", onStreamTimeout(kRequest));
    this.on("pause", onRequestPause);
    this.on("resume", onRequestResume);
  }

  get aborted() {
    return this[kAborted];
  }

  get complete() {
    return this[kAborted] ||
      this.readableEnded ||
      this[kState].closed ||
      this[kStream].destroyed;
  }

  get stream() {
    return this[kStream];
  }

  get headers() {
    return this[kHeaders];
  }

  get rawHeaders() {
    return this[kRawHeaders];
  }

  get trailers() {
    return this[kTrailers];
  }

  get rawTrailers() {
    return this[kRawTrailers];
  }

  get httpVersionMajor() {
    return 2;
  }

  get httpVersionMinor() {
    return 0;
  }

  get httpVersion() {
    return "2.0";
  }

  get socket() {
    const stream = this[kStream];
    const proxySocket = stream[kProxySocket];
    if (proxySocket === null) {
      return stream[kProxySocket] = new Proxy(stream, streamProxySocketHandler);
    }
    return proxySocket;
  }

  get connection() {
    return this.socket;
  }

  // _read(nread) {
  //   const state = this[kState];
  //   assert(!state.closed);
  //   if (!state.didRead) {
  //     state.didRead = true;
  //     this[kStream].on("data", onStreamData);
  //   } else {
  //     nextTick(resumeStream, this[kStream]);
  //   }
  // }

  get method() {
    return this[kHeaders][constants.HTTP2_HEADER_METHOD];
  }

  set method(method) {
    // validateString(method, "method");
    if (StringPrototypeTrim(method) === "") {
      throw new ERR_INVALID_ARG_VALUE("method", method);
    }

    this[kHeaders][constants.HTTP2_HEADER_METHOD] = method;
  }

  get authority() {
    return getAuthority(this[kHeaders]);
  }

  get scheme() {
    return this[kHeaders][constants.HTTP2_HEADER_SCHEME];
  }

  get url() {
    return this[kHeaders][constants.HTTP2_HEADER_PATH];
  }

  set url(url) {
    this[kHeaders][constants.HTTP2_HEADER_PATH] = url;
  }

  setTimeout(msecs, callback) {
    if (!this[kState].closed) {
      this[kStream].setTimeout(msecs, callback);
    }
    return this;
  }
}

function onStreamEnd() {
  // Cause the request stream to end as well.
  const request = this[kRequest];
  if (request !== undefined) {
    this[kRequest].push(null);
  }
}

function onStreamError(_error) {
  // This is purposefully left blank
  //
  // errors in compatibility mode are
  // not forwarded to the request
  // and response objects.
}

function onRequestPause() {
  this[kStream].pause();
}

function onRequestResume() {
  this[kStream].resume();
}

function onStreamDrain() {
  const response = this[kResponse];
  if (response !== undefined) {
    response.emit("drain");
  }
}

function onStreamAbortedRequest() {
  const request = this[kRequest];
  if (request !== undefined && request[kState].closed === false) {
    request[kAborted] = true;
    request.emit("aborted");
  }
}

function onStreamTrailersReady() {
  this.sendTrailers(this[kResponse][kTrailers]);
}

function onStreamCloseResponse() {
  const res = this[kResponse];

  if (res === undefined) {
    return;
  }

  const state = res[kState];

  if (this.headRequest !== state.headRequest) {
    return;
  }

  state.closed = true;

  this[kProxySocket] = null;

  this.removeListener("wantTrailers", onStreamTrailersReady);
  this[kResponse] = undefined;

  res.emit("finish");
  res.emit("close");
}

function onStreamAbortedResponse() {
  // non-op for now
}

let statusMessageWarned = false;

// Defines and implements an API compatibility layer on top of the core
// HTTP/2 implementation, intended to provide an interface that is as
// close as possible to the current require('http') API

function statusMessageWarn() {
  if (statusMessageWarned === false) {
    emitWarning(
      "Status message is not supported by HTTP/2 (RFC7540 8.1.2.4)",
      "UnsupportedWarning",
    );
    statusMessageWarned = true;
  }
}

function isConnectionHeaderAllowed(name, value) {
  return name !== constants.HTTP2_HEADER_CONNECTION ||
    value === "trailers";
}

export class Http2ServerResponse extends Stream {
  writable = false;
  req = null;

  constructor(stream, options) {
    super(options);
    this[kState] = {
      closed: false,
      ending: false,
      destroyed: false,
      headRequest: false,
      sendDate: true,
      statusCode: constants.HTTP_STATUS_OK,
    };
    this[kHeaders] = { __proto__: null };
    this[kTrailers] = { __proto__: null };
    this[kStream] = stream;
    stream[kProxySocket] = null;
    stream[kResponse] = this;
    this.writable = true;
    this.req = stream[kRequest];
    stream.on("drain", onStreamDrain);
    stream.on("aborted", onStreamAbortedResponse);
    stream.on("close", onStreamCloseResponse);
    stream.on("wantTrailers", onStreamTrailersReady);
    stream.on("timeout", onStreamTimeout(kResponse));
  }

  // User land modules such as finalhandler just check truthiness of this
  // but if someone is actually trying to use this for more than that
  // then we simply can't support such use cases
  get _header() {
    return this.headersSent;
  }

  get writableEnded() {
    const state = this[kState];
    return state.ending;
  }

  get finished() {
    const state = this[kState];
    return state.ending;
  }

  get socket() {
    // This is compatible with http1 which removes socket reference
    // only from ServerResponse but not IncomingMessage
    if (this[kState].closed) {
      return undefined;
    }

    const stream = this[kStream];
    const proxySocket = stream[kProxySocket];
    if (proxySocket === null) {
      return stream[kProxySocket] = new Proxy(stream, streamProxySocketHandler);
    }
    return proxySocket;
  }

  get connection() {
    return this.socket;
  }

  get stream() {
    return this[kStream];
  }

  get headersSent() {
    return this[kStream].headersSent;
  }

  get sendDate() {
    return this[kState].sendDate;
  }

  set sendDate(bool) {
    this[kState].sendDate = Boolean(bool);
  }

  get writableCorked() {
    return this[kStream].writableCorked;
  }

  get writableHighWaterMark() {
    return this[kStream].writableHighWaterMark;
  }

  get writableFinished() {
    return this[kStream].writableFinished;
  }

  get writableLength() {
    return this[kStream].writableLength;
  }

  get statusCode() {
    return this[kState].statusCode;
  }

  set statusCode(code) {
    code |= 0;
    if (code >= 100 && code < 200) {
      throw new ERR_HTTP2_INFO_STATUS_NOT_ALLOWED();
    }
    if (code < 100 || code > 599) {
      throw new ERR_HTTP2_STATUS_INVALID(code);
    }
    this[kState].statusCode = code;
  }

  setTrailer(name, value) {
    // validateString(name, "name");
    name = StringPrototypeToLowerCase(StringPrototypeTrim(name));
    // assertValidHeader(name, value);
    this[kTrailers][name] = value;
  }

  addTrailers(headers) {
    const keys = ObjectKeys(headers);
    let key = "";
    for (let i = 0; i < keys.length; i++) {
      key = keys[i];
      this.setTrailer(key, headers[key]);
    }
  }

  getHeader(name) {
    // validateString(name, "name");
    name = StringPrototypeToLowerCase(StringPrototypeTrim(name));
    return this[kHeaders][name];
  }

  getHeaderNames() {
    return ObjectKeys(this[kHeaders]);
  }

  getHeaders() {
    const headers = { __proto__: null };
    return ObjectAssign(headers, this[kHeaders]);
  }

  hasHeader(name) {
    // validateString(name, "name");
    name = StringPrototypeToLowerCase(StringPrototypeTrim(name));
    return ObjectPrototypeHasOwnProperty(this[kHeaders], name);
  }

  removeHeader(name) {
    // validateString(name, "name");
    if (this[kStream].headersSent) {
      throw new ERR_HTTP2_HEADERS_SENT();
    }

    name = StringPrototypeToLowerCase(StringPrototypeTrim(name));

    if (name === "date") {
      this[kState].sendDate = false;

      return;
    }

    delete this[kHeaders][name];
  }

  setHeader(name, value) {
    // validateString(name, "name");
    if (this[kStream].headersSent) {
      throw new ERR_HTTP2_HEADERS_SENT();
    }

    this[kSetHeader](name, value);
  }

  [kSetHeader](name, value) {
    name = StringPrototypeToLowerCase(StringPrototypeTrim(name));
    // assertValidHeader(name, value);

    if (!isConnectionHeaderAllowed(name, value)) {
      return;
    }

    if (name[0] === ":") {
      assertValidPseudoHeader(name);
    } else if (!_checkIsHttpToken(name)) {
      this.destroy(new ERR_INVALID_HTTP_TOKEN("Header name", name));
    }

    this[kHeaders][name] = value;
  }

  appendHeader(name, value) {
    // validateString(name, "name");
    if (this[kStream].headersSent) {
      throw new ERR_HTTP2_HEADERS_SENT();
    }

    this[kAppendHeader](name, value);
  }

  [kAppendHeader](name, value) {
    name = StringPrototypeToLowerCase(StringPrototypeTrim(name));
    // assertValidHeader(name, value);

    if (!isConnectionHeaderAllowed(name, value)) {
      return;
    }

    if (name[0] === ":") {
      assertValidPseudoHeader(name);
    } else if (!_checkIsHttpToken(name)) {
      this.destroy(new ERR_INVALID_HTTP_TOKEN("Header name", name));
    }

    // Handle various possible cases the same as OutgoingMessage.appendHeader:
    const headers = this[kHeaders];
    if (headers === null || !headers[name]) {
      return this.setHeader(name, value);
    }

    if (!ArrayIsArray(headers[name])) {
      headers[name] = [headers[name]];
    }

    const existingValues = headers[name];
    if (ArrayIsArray(value)) {
      for (let i = 0, length = value.length; i < length; i++) {
        existingValues.push(value[i]);
      }
    } else {
      existingValues.push(value);
    }
  }

  get statusMessage() {
    statusMessageWarn();

    return "";
  }

  set statusMessage(msg) {
    statusMessageWarn();
  }

  flushHeaders() {
    const state = this[kState];
    if (!state.closed && !this[kStream].headersSent) {
      this.writeHead(state.statusCode);
    }
  }

  writeHead(statusCode, statusMessage, headers) {
    const state = this[kState];

    if (state.closed || this.stream.destroyed) {
      return this;
    }
    if (this[kStream].headersSent) {
      throw new ERR_HTTP2_HEADERS_SENT();
    }

    if (typeof statusMessage === "string") {
      statusMessageWarn();
    }

    if (headers === undefined && typeof statusMessage === "object") {
      headers = statusMessage;
    }

    let i;
    if (ArrayIsArray(headers)) {
      if (this[kHeaders]) {
        // Headers in obj should override previous headers but still
        // allow explicit duplicates. To do so, we first remove any
        // existing conflicts, then use appendHeader. This is the
        // slow path, which only applies when you use setHeader and
        // then pass headers in writeHead too.

        // We need to handle both the tuple and flat array formats, just
        // like the logic further below.
        if (headers.length && ArrayIsArray(headers[0])) {
          for (let n = 0; n < headers.length; n += 1) {
            const key = headers[n + 0][0];
            this.removeHeader(key);
          }
        } else {
          for (let n = 0; n < headers.length; n += 2) {
            const key = headers[n + 0];
            this.removeHeader(key);
          }
        }
      }

      // Append all the headers provided in the array:
      if (headers.length && ArrayIsArray(headers[0])) {
        for (i = 0; i < headers.length; i++) {
          const header = headers[i];
          this[kAppendHeader](header[0], header[1]);
        }
      } else {
        if (headers.length % 2 !== 0) {
          throw new ERR_INVALID_ARG_VALUE("headers", headers);
        }

        for (i = 0; i < headers.length; i += 2) {
          this[kAppendHeader](headers[i], headers[i + 1]);
        }
      }
    } else if (typeof headers === "object") {
      const keys = ObjectKeys(headers);
      let key = "";
      for (i = 0; i < keys.length; i++) {
        key = keys[i];
        this[kSetHeader](key, headers[key]);
      }
    }

    state.statusCode = statusCode;
    this[kBeginSend]();

    return this;
  }

  cork() {
    this[kStream].cork();
  }

  uncork() {
    this[kStream].uncork();
  }

  write(chunk, encoding, cb) {
    const state = this[kState];

    if (typeof encoding === "function") {
      cb = encoding;
      encoding = "utf8";
    }

    let err;
    if (state.ending) {
      err = new ERR_STREAM_WRITE_AFTER_END();
    } else if (state.closed) {
      err = new ERR_HTTP2_INVALID_STREAM();
    } else if (state.destroyed) {
      return false;
    }

    if (err) {
      if (typeof cb === "function") {
        nextTick(cb, err);
      }
      this.destroy(err);
      return false;
    }

    const stream = this[kStream];
    if (!stream.headersSent) {
      this.writeHead(state.statusCode);
    }
    return stream.write(chunk, encoding, cb);
  }

  end(chunk, encoding, cb) {
    const stream = this[kStream];
    const state = this[kState];

    if (typeof chunk === "function") {
      cb = chunk;
      chunk = null;
    } else if (typeof encoding === "function") {
      cb = encoding;
      encoding = "utf8";
    }

    if (
      (state.closed || state.ending) &&
      state.headRequest === stream.headRequest
    ) {
      if (typeof cb === "function") {
        nextTick(cb);
      }
      return this;
    }

    if (chunk !== null && chunk !== undefined) {
      this.write(chunk, encoding);
    }

    state.headRequest = stream.headRequest;
    state.ending = true;

    if (typeof cb === "function") {
      if (stream.writableEnded) {
        this.once("finish", cb);
      } else {
        stream.once("finish", cb);
      }
    }

    if (!stream.headersSent) {
      this.writeHead(this[kState].statusCode);
    }

    if (this[kState].closed || stream.destroyed) {
      ReflectApply(onStreamCloseResponse, stream, []);
    } else {
      stream.end();
    }

    return this;
  }

  destroy(err) {
    if (this[kState].destroyed) {
      return;
    }

    this[kState].destroyed = true;
    this[kStream].destroy(err);
  }

  setTimeout(msecs, callback) {
    if (this[kState].closed) {
      return;
    }
    this[kStream].setTimeout(msecs, callback);
  }

  createPushResponse(headers, callback) {
    // validateFunction(callback, "callback");
    if (this[kState].closed) {
      nextTick(callback, new ERR_HTTP2_INVALID_STREAM());
      return;
    }
    this[kStream].pushStream(headers, {}, (err, stream, _headers, options) => {
      if (err) {
        callback(err);
        return;
      }
      callback(null, new Http2ServerResponse(stream, options));
    });
  }

  [kBeginSend]() {
    const state = this[kState];
    const headers = this[kHeaders];
    headers[constants.HTTP2_HEADER_STATUS] = state.statusCode;
    const options = {
      endStream: state.ending,
      waitForTrailers: true,
      sendDate: state.sendDate,
    };
    this[kStream].respond(headers, options);
  }

  writeContinue() {
    const stream = this[kStream];
    if (stream.headersSent || this[kState].closed) {
      return false;
    }
    stream.additionalHeaders({
      [constants.HTTP2_HEADER_STATUS]: constants.HTTP_STATUS_CONTINUE,
    });
    return true;
  }

  writeEarlyHints(hints) {
    // validateObject(hints, "hints");

    const headers = { __proto__: null };

    // const linkHeaderValue = validateLinkHeaderValue(hints.link);

    for (const key of ObjectKeys(hints)) {
      if (key !== "link") {
        headers[key] = hints[key];
      }
    }

    // if (linkHeaderValue.length === 0) {
    //   return false;
    // }

    const stream = this[kStream];

    if (stream.headersSent || this[kState].closed) {
      return false;
    }

    stream.additionalHeaders({
      ...headers,
      [constants.HTTP2_HEADER_STATUS]: constants.HTTP_STATUS_EARLY_HINTS,
      // "Link": linkHeaderValue,
    });

    return true;
  }
}

export default {
  createServer,
  createSecureServer,
  connect,
  constants,
  getDefaultSettings,
  getPackedSettings,
  getUnpackedSettings,
  sensitiveHeaders,
  Http2ServerRequest,
  Http2ServerResponse,
};
