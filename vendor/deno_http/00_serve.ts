// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { core, internals, primordials } from "ext:core/mod.js";
const {
  BadResourcePrototype,
  InterruptedPrototype,
  Interrupted,
  internalRidSymbol,
} = core;
import {
  op_http_cancel,
  op_http_close,
  op_http_close_after_finish,
  op_http_get_request_headers,
  op_http_get_request_method_and_url,
  op_http_read_request_body,
  op_http_request_on_cancel,
  op_http_serve,
  op_http_serve_on,
  op_http_set_promise_complete,
  op_http_set_response_body_bytes,
  op_http_set_response_body_resource,
  op_http_set_response_body_text,
  op_http_set_response_header,
  op_http_set_response_headers,
  op_http_set_response_trailers,
  op_http_try_wait,
  op_http_upgrade_raw,
  op_http_upgrade_websocket_next,
  op_http_wait,
} from "ext:core/ops";
const {
  ArrayPrototypePush,
  ObjectHasOwn,
  ObjectPrototypeIsPrototypeOf,
  PromisePrototypeCatch,
  SafePromisePrototypeFinally,
  PromisePrototypeThen,
  StringPrototypeIncludes,
  Symbol,
  TypeError,
  TypedArrayPrototypeGetSymbolToStringTag,
  Uint8Array,
  Promise,
} = primordials;
const {
  getAsyncContext,
  setAsyncContext,
} = core;

import { InnerBody } from "ext:deno_fetch/22_body.js";
import { Event } from "ext:deno_web/02_event.js";
import {
  fromInnerResponse,
  newInnerResponse,
  ResponsePrototype,
  toInnerResponse,
} from "ext:deno_fetch/23_response.js";
import {
  abortRequest,
  fromInnerRequest,
  toInnerRequest,
} from "ext:deno_fetch/23_request.js";
import { AbortController } from "ext:deno_web/03_abort_signal.js";
import {
  _eventLoop,
  _idleTimeoutDuration,
  _idleTimeoutTimeout,
  _protocol,
  _readyState,
  _rid,
  _role,
  _server,
  _serverHandleIdleTimeout,
  SERVER,
  WebSocket,
} from "ext:deno_websocket/01_websocket.js";
import {
  Deferred,
  getReadableStreamResourceBacking,
  readableStreamForRid,
  ReadableStreamPrototype,
  resourceForReadableStream,
} from "ext:deno_web/06_streams.js";
import {
  listen,
  listenOptionApiName,
  UpgradedConn,
} from "ext:deno_net/01_net.js";
import { hasTlsKeyPairOptions, listenTls } from "ext:deno_net/02_tls.js";
import { SymbolAsyncDispose } from "ext:deno_web/00_infra.js";
import {
  builtinTracer,
  enterSpan,
  TRACING_ENABLED,
} from "ext:deno_telemetry/telemetry.ts";
import {
  updateSpanFromRequest,
  updateSpanFromResponse,
} from "ext:deno_telemetry/util.ts";

const _upgraded = Symbol("_upgraded");

function internalServerError() {
  // "Internal Server Error"
  return new Response(
    new Uint8Array([
      73,
      110,
      116,
      101,
      114,
      110,
      97,
      108,
      32,
      83,
      101,
      114,
      118,
      101,
      114,
      32,
      69,
      114,
      114,
      111,
      114,
    ]),
    { status: 500 },
  );
}

// Used to ensure that user returns a valid response (but not a different response) from handlers that are upgraded.
const UPGRADE_RESPONSE_SENTINEL = fromInnerResponse(
  newInnerResponse(101),
  "immutable",
);

function upgradeHttpRaw(req, conn) {
  const inner = toInnerRequest(req);
  if (inner._wantsUpgrade) {
    return inner._wantsUpgrade("upgradeHttpRaw", conn);
  }
  throw new TypeError("'upgradeHttpRaw' may only be used with Deno.serve");
}

function addTrailers(resp, headerList) {
  const inner = toInnerResponse(resp);
  op_http_set_response_trailers(inner.external, headerList);
}

class InnerRequest {
  #external;
  #context;
  #methodAndUri;
  #streamRid;
  #body;
  #upgraded;
  #urlValue;
  #completed;
  request;

  constructor(external, context) {
    this.#external = external;
    this.#context = context;
    this.#upgraded = false;
    this.#completed = undefined;
  }

  close(success = true) {
    // The completion signal fires only if someone cares
    if (this.#completed) {
      if (success) {
        this.#completed.resolve(undefined);
      } else {
        this.#completed.reject(
          new Interrupted("HTTP response was not sent successfully"),
        );
      }
    }
    abortRequest(this.request);
    this.#external = null;
  }

  get [_upgraded]() {
    return this.#upgraded;
  }

  _wantsUpgrade(upgradeType, ...originalArgs) {
    if (this.#upgraded) {
      throw new Deno.errors.Http("Already upgraded");
    }
    if (this.#external === null) {
      throw new Deno.errors.Http("Already closed");
    }

    // upgradeHttpRaw is sync
    if (upgradeType == "upgradeHttpRaw") {
      const external = this.#external;
      const underlyingConn = originalArgs[0];

      this.url();
      this.headerList;
      this.close();

      this.#upgraded = () => {};

      const upgradeRid = op_http_upgrade_raw(external);

      const conn = new UpgradedConn(
        upgradeRid,
        underlyingConn?.remoteAddr,
        underlyingConn?.localAddr,
      );

      return { response: UPGRADE_RESPONSE_SENTINEL, conn };
    }

    // upgradeWebSocket is sync
    if (upgradeType == "upgradeWebSocket") {
      const response = originalArgs[0];
      const ws = originalArgs[1];

      const external = this.#external;

      this.url();
      this.headerList;
      this.close();

      const goAhead = new Deferred();
      this.#upgraded = () => {
        goAhead.resolve();
      };
      const wsPromise = op_http_upgrade_websocket_next(
        external,
        response.headerList,
      );

      // Start the upgrade in the background.
      (async () => {
        try {
          // Returns the upgraded websocket connection
          const wsRid = await wsPromise;

          // We have to wait for the go-ahead signal
          await goAhead.promise;

          ws[_rid] = wsRid;
          ws[_readyState] = WebSocket.OPEN;
          ws[_role] = SERVER;
          const event = new Event("open");
          ws.dispatchEvent(event);

          ws[_eventLoop]();
          if (ws[_idleTimeoutDuration]) {
            ws.addEventListener(
              "close",
              () => clearTimeout(ws[_idleTimeoutTimeout]),
            );
          }
          ws[_serverHandleIdleTimeout]();
        } catch (error) {
          const event = new ErrorEvent("error", { error });
          ws.dispatchEvent(event);
        }
      })();
      return { response: UPGRADE_RESPONSE_SENTINEL, socket: ws };
    }
  }

  url() {
    if (this.#urlValue !== undefined) {
      return this.#urlValue;
    }

    if (this.#methodAndUri === undefined) {
      if (this.#external === null) {
        throw new TypeError("Request closed");
      }
      // TODO(mmastrac): This is quite slow as we're serializing a large number of values. We may want to consider
      // splitting this up into multiple ops.
      this.#methodAndUri = op_http_get_request_method_and_url(this.#external);
    }

    const path = this.#methodAndUri[2];

    // * is valid for OPTIONS
    if (path === "*") {
      return this.#urlValue = "*";
    }

    // If the path is empty, return the authority (valid for CONNECT)
    if (path == "") {
      return this.#urlValue = this.#methodAndUri[1];
    }

    // CONNECT requires an authority
    if (this.#methodAndUri[0] == "CONNECT") {
      return this.#urlValue = this.#methodAndUri[1];
    }

    const hostname = this.#methodAndUri[1];
    if (hostname) {
      // Construct a URL from the scheme, the hostname, and the path
      return this.#urlValue = this.#context.scheme + hostname + path;
    }

    // Construct a URL from the scheme, the fallback hostname, and the path
    return this.#urlValue = this.#context.scheme + this.#context.fallbackHost +
      path;
  }

  get completed() {
    if (!this.#completed) {
      // NOTE: this is faster than Promise.withResolvers()
      let resolve, reject;
      const promise = new Promise((r1, r2) => {
        resolve = r1;
        reject = r2;
      });
      this.#completed = { promise, resolve, reject };
    }
    return this.#completed.promise;
  }

  get remoteAddr() {
    const transport = this.#context.listener?.addr.transport;
    if (transport === "unix" || transport === "unixpacket") {
      return {
        transport,
        path: this.#context.listener.addr.path,
      };
    }
    if (this.#methodAndUri === undefined) {
      if (this.#external === null) {
        throw new TypeError("Request closed");
      }
      this.#methodAndUri = op_http_get_request_method_and_url(this.#external);
    }
    return {
      transport: "tcp",
      hostname: this.#methodAndUri[3],
      port: this.#methodAndUri[4],
    };
  }

  get method() {
    if (this.#methodAndUri === undefined) {
      if (this.#external === null) {
        throw new TypeError("Request closed");
      }
      this.#methodAndUri = op_http_get_request_method_and_url(this.#external);
    }
    return this.#methodAndUri[0];
  }

  get body() {
    if (this.#external === null) {
      throw new TypeError("Request closed");
    }
    if (this.#body !== undefined) {
      return this.#body;
    }
    // If the method is GET or HEAD, we do not want to include a body here, even if the Rust
    // side of the code is willing to provide it to us.
    if (this.method == "GET" || this.method == "HEAD") {
      this.#body = null;
      return null;
    }
    this.#streamRid = op_http_read_request_body(this.#external);
    this.#body = new InnerBody(readableStreamForRid(this.#streamRid, false));
    return this.#body;
  }

  get headerList() {
    if (this.#external === null) {
      throw new TypeError("Request closed");
    }
    const headers = [];
    const reqHeaders = op_http_get_request_headers(this.#external);
    for (let i = 0; i < reqHeaders.length; i += 2) {
      ArrayPrototypePush(headers, [reqHeaders[i], reqHeaders[i + 1]]);
    }
    return headers;
  }

  get external() {
    return this.#external;
  }

  onCancel(callback) {
    if (this.#external === null) {
      callback();
      return;
    }

    PromisePrototypeThen(
      op_http_request_on_cancel(this.#external),
      callback,
    );
  }
}

class CallbackContext {
  abortController;
  scheme;
  fallbackHost;
  serverRid;
  closed;
  /** @type {Promise<void> | undefined} */
  closing;
  listener;
  asyncContext;

  constructor(signal, args, listener) {
    this.asyncContext = getAsyncContext();
    // The abort signal triggers a non-graceful shutdown
    signal?.addEventListener(
      "abort",
      () => {
        op_http_cancel(this.serverRid, false);
      },
      { once: true },
    );
    this.abortController = new AbortController();
    this.serverRid = args[0];
    this.scheme = args[1];
    this.fallbackHost = args[2];
    this.closed = false;
    this.listener = listener;
  }

  close() {
    try {
      this.closed = true;
      core.tryClose(this.serverRid);
    } catch {
      // Pass
    }
  }
}

class ServeHandlerInfo {
  #inner: InnerRequest;
  constructor(inner: InnerRequest) {
    this.#inner = inner;
  }
  get remoteAddr() {
    return this.#inner.remoteAddr;
  }
  get completed() {
    return this.#inner.completed;
  }
}

function fastSyncResponseOrStream(
  req,
  respBody,
  status,
  innerRequest: InnerRequest,
) {
  if (respBody === null || respBody === undefined) {
    // Don't set the body
    innerRequest?.close();
    op_http_set_promise_complete(req, status);
    return;
  }

  const stream = respBody.streamOrStatic;
  const body = stream.body;
  if (body !== undefined) {
    // We ensure the response has not been consumed yet in the caller of this
    // function.
    stream.consumed = true;
  }

  if (TypedArrayPrototypeGetSymbolToStringTag(body) === "Uint8Array") {
    innerRequest?.close();
    op_http_set_response_body_bytes(req, body, status);
    return;
  }

  if (typeof body === "string") {
    innerRequest?.close();
    op_http_set_response_body_text(req, body, status);
    return;
  }

  // At this point in the response it needs to be a stream
  if (!ObjectPrototypeIsPrototypeOf(ReadableStreamPrototype, stream)) {
    innerRequest?.close();
    throw new TypeError("Invalid response");
  }
  const resourceBacking = getReadableStreamResourceBacking(stream);
  let rid, autoClose;
  if (resourceBacking) {
    rid = resourceBacking.rid;
    autoClose = resourceBacking.autoClose;
  } else {
    rid = resourceForReadableStream(stream);
    autoClose = true;
  }
  PromisePrototypeThen(
    op_http_set_response_body_resource(
      req,
      rid,
      autoClose,
      status,
    ),
    (success) => {
      innerRequest?.close(success);
      op_http_close_after_finish(req);
    },
  );
}

/**
 * Maps the incoming request slab ID to a fully-fledged Request object, passes it to the user-provided
 * callback, then extracts the response that was returned from that callback. The response is then pulled
 * apart and handled on the Rust side.
 *
 * This function returns a promise that will only reject in the case of abnormal exit.
 */
function mapToCallback(context, callback, onError) {
  let mapped = async function (req, span) {
    // Get the response from the user-provided callback. If that fails, use onError. If that fails, return a fallback
    // 500 error.
    let innerRequest;
    let response;
    try {
      innerRequest = new InnerRequest(req, context);
      const request = fromInnerRequest(innerRequest, "immutable");
      innerRequest.request = request;

      if (span) {
        updateSpanFromRequest(span, request);
      }

      response = await callback(
        request,
        new ServeHandlerInfo(innerRequest),
      );

      // Throwing Error if the handler return value is not a Response class
      if (!ObjectPrototypeIsPrototypeOf(ResponsePrototype, response)) {
        throw new TypeError(
          "Return value from serve handler must be a response or a promise resolving to a response",
        );
      }

      if (response.type === "error") {
        throw new TypeError(
          "Return value from serve handler must not be an error response (like Response.error())",
        );
      }

      if (response.bodyUsed) {
        throw new TypeError(
          "The body of the Response returned from the serve handler has already been consumed",
        );
      }
    } catch (error) {
      try {
        response = await onError(error);
        if (!ObjectPrototypeIsPrototypeOf(ResponsePrototype, response)) {
          throw new TypeError(
            "Return value from onError handler must be a response or a promise resolving to a response",
          );
        }
      } catch (error) {
        // deno-lint-ignore no-console
        console.error("Exception in onError while handling exception", error);
        response = internalServerError();
      }
    }

    if (span) {
      updateSpanFromResponse(span, response);
    }

    const inner = toInnerResponse(response);
    if (innerRequest?.[_upgraded]) {
      // We're done here as the connection has been upgraded during the callback and no longer requires servicing.
      if (response !== UPGRADE_RESPONSE_SENTINEL) {
        // deno-lint-ignore no-console
        console.error("Upgrade response was not returned from callback");
        context.close();
      }
      innerRequest?.[_upgraded]();
      return;
    }

    // Did everything shut down while we were waiting?
    if (context.closed) {
      // We're shutting down, so this status shouldn't make it back to the client but "Service Unavailable" seems appropriate
      innerRequest?.close();
      op_http_set_promise_complete(req, 503);
      return;
    }

    const status = inner.status;
    const headers = inner.headerList;
    if (headers && headers.length > 0) {
      if (headers.length == 1) {
        op_http_set_response_header(req, headers[0][0], headers[0][1]);
      } else {
        op_http_set_response_headers(req, headers);
      }
    }

    fastSyncResponseOrStream(req, inner.body, status, innerRequest);
  };

  if (TRACING_ENABLED) {
    const origMapped = mapped;
    mapped = function (req, _span) {
      const oldCtx = getAsyncContext();
      setAsyncContext(context.asyncContext);
      const span = builtinTracer().startSpan("deno.serve", { kind: 1 });
      try {
        enterSpan(span);
        return SafePromisePrototypeFinally(
          origMapped(req, span),
          () => span.end(),
        );
      } finally {
        // equiv to exitSpan.
        setAsyncContext(oldCtx);
      }
    };
  } else {
    const origMapped = mapped;
    mapped = function (req, span) {
      const oldCtx = getAsyncContext();
      setAsyncContext(context.asyncContext);
      try {
        return origMapped(req, span);
      } finally {
        setAsyncContext(oldCtx);
      }
    };
  }

  return mapped;
}

type RawHandler = (
  request: Request,
  info: ServeHandlerInfo,
) => Response | Promise<Response>;

type RawServeOptions = {
  port?: number;
  hostname?: string;
  signal?: AbortSignal;
  reusePort?: boolean;
  key?: string;
  cert?: string;
  onError?: (error: unknown) => Response | Promise<Response>;
  onListen?: (params: { hostname: string; port: number }) => void;
  handler?: RawHandler;
};

const kLoadBalanced = Symbol("kLoadBalanced");

function formatHostName(hostname: string): string {
  // If the hostname is "0.0.0.0", we display "localhost" in console
  // because browsers in Windows don't resolve "0.0.0.0".
  // See the discussion in https://github.com/denoland/deno_std/issues/1165
  if (
    (Deno.build.os === "windows") &&
    (hostname == "0.0.0.0" || hostname == "::")
  ) {
    return "localhost";
  }

  // Add brackets around ipv6 hostname
  return StringPrototypeIncludes(hostname, ":") ? `[${hostname}]` : hostname;
}

function serve(arg1, arg2) {
  let options: RawServeOptions | undefined;
  let handler: RawHandler | undefined;

  if (typeof arg1 === "function") {
    handler = arg1;
  } else if (typeof arg2 === "function") {
    handler = arg2;
    options = arg1;
  } else {
    options = arg1;
  }
  if (handler === undefined) {
    if (options === undefined) {
      throw new TypeError(
        "Cannot serve HTTP requests: either a `handler` or `options` must be specified",
      );
    }
    handler = options.handler;
  }
  if (typeof handler !== "function") {
    throw new TypeError(
      `Cannot serve HTTP requests: handler must be a function, received ${typeof handler}`,
    );
  }
  if (options === undefined) {
    options = { __proto__: null };
  }

  const wantsHttps = hasTlsKeyPairOptions(options);
  const wantsUnix = ObjectHasOwn(options, "path");
  const signal = options.signal;
  const onError = options.onError ?? function (error) {
    // deno-lint-ignore no-console
    console.error(error);
    return internalServerError();
  };

  if (wantsUnix) {
    const listener = listen({
      transport: "unix",
      path: options.path,
      [listenOptionApiName]: "Deno.serve",
    });
    const path = listener.addr.path;
    return serveHttpOnListener(listener, signal, handler, onError, () => {
      if (options.onListen) {
        options.onListen(listener.addr);
      } else {
        // deno-lint-ignore no-console
        console.error(`Listening on ${path}`);
      }
    });
  }

  const listenOpts = {
    hostname: options.hostname ?? "0.0.0.0",
    port: options.port ?? 8000,
    reusePort: options.reusePort ?? false,
    loadBalanced: options[kLoadBalanced] ?? false,
  };

  if (options.certFile || options.keyFile) {
    throw new TypeError(
      "Unsupported 'certFile' / 'keyFile' options provided: use 'cert' / 'key' instead.",
    );
  }
  if (options.alpnProtocols) {
    throw new TypeError(
      "Unsupported 'alpnProtocols' option provided. 'h2' and 'http/1.1' are automatically supported.",
    );
  }

  let listener;
  if (wantsHttps) {
    if (!options.cert || !options.key) {
      throw new TypeError(
        "Both 'cert' and 'key' must be provided to enable HTTPS",
      );
    }
    listenOpts.cert = options.cert;
    listenOpts.key = options.key;
    listenOpts.alpnProtocols = ["h2", "http/1.1"];
    listener = listenTls(listenOpts);
    listenOpts.port = listener.addr.port;
  } else {
    listener = listen(listenOpts);
    listenOpts.port = listener.addr.port;
  }

  const addr = listener.addr;

  const onListen = (scheme) => {
    if (options.onListen) {
      options.onListen(addr);
    } else {
      const host = formatHostName(addr.hostname);

      // deno-lint-ignore no-console
      console.error(`Listening on ${scheme}${host}:${addr.port}/`);
    }
  };

  return serveHttpOnListener(listener, signal, handler, onError, onListen);
}

/**
 * Serve HTTP/1.1 and/or HTTP/2 on an arbitrary listener.
 */
function serveHttpOnListener(listener, signal, handler, onError, onListen) {
  const context = new CallbackContext(
    signal,
    op_http_serve(listener[internalRidSymbol]),
    listener,
  );
  const callback = mapToCallback(context, handler, onError);

  onListen(context.scheme);

  return serveHttpOn(context, listener.addr, callback);
}

/**
 * Serve HTTP/1.1 and/or HTTP/2 on an arbitrary connection.
 */
function serveHttpOnConnection(connection, signal, handler, onError, onListen) {
  const context = new CallbackContext(
    signal,
    op_http_serve_on(connection[internalRidSymbol]),
    null,
  );
  const callback = mapToCallback(context, handler, onError);

  onListen(context.scheme);

  return serveHttpOn(context, connection.localAddr, callback);
}

function serveHttpOn(context, addr, callback) {
  let ref = true;
  let currentPromise = null;

  const promiseErrorHandler = (error) => {
    // Abnormal exit
    // deno-lint-ignore no-console
    console.error(
      "Terminating Deno.serve loop due to unexpected error",
      error,
    );
    context.close();
  };

  // Run the server
  const finished = (async () => {
    const rid = context.serverRid;
    while (true) {
      let req;
      try {
        // Attempt to pull as many requests out of the queue as possible before awaiting. This API is
        // a synchronous, non-blocking API that returns u32::MAX if anything goes wrong.
        while ((req = op_http_try_wait(rid)) !== null) {
          PromisePrototypeCatch(callback(req, undefined), promiseErrorHandler);
        }
        currentPromise = op_http_wait(rid);
        if (!ref) {
          core.unrefOpPromise(currentPromise);
        }
        req = await currentPromise;
        currentPromise = null;
      } catch (error) {
        if (ObjectPrototypeIsPrototypeOf(BadResourcePrototype, error)) {
          break;
        }
        if (ObjectPrototypeIsPrototypeOf(InterruptedPrototype, error)) {
          break;
        }
        throw new Deno.errors.Http(error);
      }
      if (req === null) {
        break;
      }
      PromisePrototypeCatch(callback(req, undefined), promiseErrorHandler);
    }

    try {
      if (!context.closing && !context.closed) {
        context.closing = await op_http_close(rid, false);
        context.close();
      }

      await context.closing;
    } catch (error) {
      if (ObjectPrototypeIsPrototypeOf(InterruptedPrototype, error)) {
        return;
      }
      if (ObjectPrototypeIsPrototypeOf(BadResourcePrototype, error)) {
        return;
      }

      throw error;
    } finally {
      context.close();
      context.closed = true;
    }
  })();

  return {
    addr,
    finished,
    async shutdown() {
      try {
        if (!context.closing && !context.closed) {
          // Shut this HTTP server down gracefully
          context.closing = op_http_close(context.serverRid, true);
        }

        await context.closing;
      } catch (error) {
        // The server was interrupted
        if (ObjectPrototypeIsPrototypeOf(InterruptedPrototype, error)) {
          return;
        }
        if (ObjectPrototypeIsPrototypeOf(BadResourcePrototype, error)) {
          return;
        }

        throw error;
      } finally {
        context.closed = true;
      }
    },
    ref() {
      ref = true;
      if (currentPromise) {
        core.refOpPromise(currentPromise);
      }
    },
    unref() {
      ref = false;
      if (currentPromise) {
        core.unrefOpPromise(currentPromise);
      }
    },
    [SymbolAsyncDispose]() {
      return this.shutdown();
    },
  };
}

internals.addTrailers = addTrailers;
internals.upgradeHttpRaw = upgradeHttpRaw;
internals.serveHttpOnListener = serveHttpOnListener;
internals.serveHttpOnConnection = serveHttpOnConnection;

function registerDeclarativeServer(exports) {
  if (ObjectHasOwn(exports, "fetch")) {
    if (typeof exports.fetch !== "function") {
      throw new TypeError(
        "Invalid type for fetch: must be a function with a single or no parameter",
      );
    }
    return ({ servePort, serveHost, serveIsMain, serveWorkerCount }) => {
      Deno.serve({
        port: servePort,
        hostname: serveHost,
        [kLoadBalanced]: (serveIsMain && serveWorkerCount > 1) ||
          (serveWorkerCount !== null),
        onListen: ({ port, hostname }) => {
          if (serveIsMain) {
            const nThreads = serveWorkerCount > 1
              ? ` with ${serveWorkerCount} threads`
              : "";
            const host = formatHostName(hostname);

            // deno-lint-ignore no-console
            console.error(
              `%cdeno serve%c: Listening on %chttp://${host}:${port}/%c${nThreads}`,
              "color: green",
              "color: inherit",
              "color: yellow",
              "color: inherit",
            );
          }
        },
        handler: (req, connInfo) => {
          return exports.fetch(req, connInfo);
        },
      });
    };
  }
}

export {
  addTrailers,
  registerDeclarativeServer,
  serve,
  serveHttpOnConnection,
  serveHttpOnListener,
  upgradeHttpRaw,
};
