// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { core, primordials } from "ext:core/mod.js";
const {
  BadResourcePrototype,
  InterruptedPrototype,
  internalRidSymbol,
} = core;
import {
  op_http_accept,
  op_http_headers,
  op_http_shutdown,
  op_http_start,
  op_http_upgrade_websocket,
  op_http_write,
  op_http_write_headers,
  op_http_write_resource,
} from "ext:core/ops";
const {
  ObjectPrototypeIsPrototypeOf,
  SafeSet,
  SafeSetIterator,
  SetPrototypeAdd,
  SetPrototypeDelete,
  StringPrototypeIncludes,
  Symbol,
  SymbolAsyncIterator,
  TypeError,
  TypedArrayPrototypeGetSymbolToStringTag,
  Uint8Array,
} = primordials;
import { _ws } from "ext:deno_http/02_websocket.ts";
import { InnerBody } from "ext:deno_fetch/22_body.js";
import { Event } from "ext:deno_web/02_event.js";
import { BlobPrototype } from "ext:deno_web/09_file.js";
import {
  ResponsePrototype,
  toInnerResponse,
} from "ext:deno_fetch/23_response.js";
import {
  abortRequest,
  fromInnerRequest,
  newInnerRequest,
} from "ext:deno_fetch/23_request.js";
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
  getReadableStreamResourceBacking,
  readableStreamClose,
  readableStreamForRid,
  ReadableStreamPrototype,
} from "ext:deno_web/06_streams.js";
import { SymbolDispose } from "ext:deno_web/00_infra.js";

const connErrorSymbol = Symbol("connError");

/** @type {(self: HttpConn, rid: number) => boolean} */
let deleteManagedResource;

class HttpConn {
  #rid = 0;
  #closed = false;
  #remoteAddr;
  #localAddr;

  // This set holds resource ids of resources
  // that were created during lifecycle of this request.
  // When the connection is closed these resources should be closed
  // as well.
  #managedResources = new SafeSet();

  static {
    deleteManagedResource = (self, rid) =>
      SetPrototypeDelete(self.#managedResources, rid);
  }

  constructor(rid, remoteAddr, localAddr) {
    this.#rid = rid;
    this.#remoteAddr = remoteAddr;
    this.#localAddr = localAddr;
  }

  /** @returns {number} */
  get rid() {
    return this.#rid;
  }

  /** @returns {Promise<RequestEvent | null>} */
  async nextRequest() {
    let nextRequest;
    try {
      nextRequest = await op_http_accept(this.#rid);
    } catch (error) {
      this.close();
      // A connection error seen here would cause disrupted responses to throw
      // a generic `BadResource` error. Instead store this error and replace
      // those with it.
      this[connErrorSymbol] = error;
      if (
        ObjectPrototypeIsPrototypeOf(BadResourcePrototype, error) ||
        ObjectPrototypeIsPrototypeOf(InterruptedPrototype, error) ||
        StringPrototypeIncludes(error.message, "connection closed")
      ) {
        return null;
      }
      throw error;
    }
    if (nextRequest == null) {
      // Work-around for servers (deno_std/http in particular) that call
      // `nextRequest()` before upgrading a previous request which has a
      // `connection: upgrade` header.
      await null;

      this.close();
      return null;
    }

    const { 0: readStreamRid, 1: writeStreamRid, 2: method, 3: url } =
      nextRequest;
    SetPrototypeAdd(this.#managedResources, readStreamRid);
    SetPrototypeAdd(this.#managedResources, writeStreamRid);

    /** @type {ReadableStream<Uint8Array> | undefined} */
    let body = null;
    // There might be a body, but we don't expose it for GET/HEAD requests.
    // It will be closed automatically once the request has been handled and
    // the response has been sent.
    if (method !== "GET" && method !== "HEAD") {
      body = readableStreamForRid(readStreamRid, false);
    }

    const innerRequest = newInnerRequest(
      method,
      url,
      () => op_http_headers(readStreamRid),
      body !== null ? new InnerBody(body) : null,
      false,
    );
    const request = fromInnerRequest(
      innerRequest,
      "immutable",
      false,
    );

    const respondWith = createRespondWith(
      this,
      request,
      readStreamRid,
      writeStreamRid,
    );

    return { request, respondWith };
  }

  /** @returns {void} */
  close() {
    if (!this.#closed) {
      this.#closed = true;
      core.tryClose(this.#rid);
      for (const rid of new SafeSetIterator(this.#managedResources)) {
        SetPrototypeDelete(this.#managedResources, rid);
        core.tryClose(rid);
      }
    }
  }

  [SymbolDispose]() {
    core.tryClose(this.#rid);
    for (const rid of new SafeSetIterator(this.#managedResources)) {
      SetPrototypeDelete(this.#managedResources, rid);
      core.tryClose(rid);
    }
  }

  [SymbolAsyncIterator]() {
    // deno-lint-ignore no-this-alias
    const httpConn = this;
    return {
      async next() {
        const reqEvt = await httpConn.nextRequest();
        // Change with caution, current form avoids a v8 deopt
        return { value: reqEvt ?? undefined, done: reqEvt === null };
      },
    };
  }
}

function createRespondWith(
  httpConn,
  request,
  readStreamRid,
  writeStreamRid,
) {
  return async function respondWith(resp) {
    try {
      resp = await resp;
      if (!(ObjectPrototypeIsPrototypeOf(ResponsePrototype, resp))) {
        throw new TypeError(
          "First argument to 'respondWith' must be a Response or a promise resolving to a Response",
        );
      }

      const innerResp = toInnerResponse(resp);

      // If response body length is known, it will be sent synchronously in a
      // single op, in other case a "response body" resource will be created and
      // we'll be streaming it.
      /** @type {ReadableStream<Uint8Array> | Uint8Array | null} */
      let respBody = null;
      if (innerResp.body !== null) {
        if (innerResp.body.unusable()) {
          throw new TypeError("Body is unusable");
        }
        if (
          ObjectPrototypeIsPrototypeOf(
            ReadableStreamPrototype,
            innerResp.body.streamOrStatic,
          )
        ) {
          if (
            innerResp.body.length === null ||
            ObjectPrototypeIsPrototypeOf(
              BlobPrototype,
              innerResp.body.source,
            )
          ) {
            respBody = innerResp.body.stream;
          } else {
            const reader = innerResp.body.stream.getReader();
            const r1 = await reader.read();
            if (r1.done) {
              respBody = new Uint8Array(0);
            } else {
              respBody = r1.value;
              const r2 = await reader.read();
              if (!r2.done) throw new TypeError("Unreachable");
            }
          }
        } else {
          innerResp.body.streamOrStatic.consumed = true;
          respBody = innerResp.body.streamOrStatic.body;
        }
      } else {
        respBody = new Uint8Array(0);
      }
      const isStreamingResponseBody = !(
        typeof respBody === "string" ||
        TypedArrayPrototypeGetSymbolToStringTag(respBody) === "Uint8Array"
      );
      try {
        await op_http_write_headers(
          writeStreamRid,
          innerResp.status ?? 200,
          innerResp.headerList,
          isStreamingResponseBody ? null : respBody,
        );
      } catch (error) {
        const connError = httpConn[connErrorSymbol];
        if (
          ObjectPrototypeIsPrototypeOf(BadResourcePrototype, error) &&
          connError != null
        ) {
          // deno-lint-ignore no-ex-assign
          error = new connError.constructor(connError.message);
        }
        if (
          respBody !== null &&
          ObjectPrototypeIsPrototypeOf(ReadableStreamPrototype, respBody)
        ) {
          await respBody.cancel(error);
        }
        throw error;
      }

      if (isStreamingResponseBody) {
        let success = false;
        if (
          respBody === null ||
          !ObjectPrototypeIsPrototypeOf(ReadableStreamPrototype, respBody)
        ) {
          throw new TypeError("Unreachable");
        }
        const resourceBacking = getReadableStreamResourceBacking(respBody);
        let reader;
        if (resourceBacking) {
          if (respBody.locked) {
            throw new TypeError("ReadableStream is locked");
          }
          reader = respBody.getReader(); // Acquire JS lock.
          try {
            await op_http_write_resource(
              writeStreamRid,
              resourceBacking.rid,
            );
            if (resourceBacking.autoClose) core.tryClose(resourceBacking.rid);
            readableStreamClose(respBody); // Release JS lock.
            success = true;
          } catch (error) {
            const connError = httpConn[connErrorSymbol];
            if (
              ObjectPrototypeIsPrototypeOf(BadResourcePrototype, error) &&
              connError != null
            ) {
              // deno-lint-ignore no-ex-assign
              error = new connError.constructor(connError.message);
            }
            await reader.cancel(error);
            throw error;
          }
        } else {
          reader = respBody.getReader();
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (
              TypedArrayPrototypeGetSymbolToStringTag(value) !== "Uint8Array"
            ) {
              await reader.cancel(new TypeError("Value not a Uint8Array"));
              break;
            }
            try {
              await op_http_write(writeStreamRid, value);
            } catch (error) {
              const connError = httpConn[connErrorSymbol];
              if (
                ObjectPrototypeIsPrototypeOf(BadResourcePrototype, error) &&
                connError != null
              ) {
                // deno-lint-ignore no-ex-assign
                error = new connError.constructor(connError.message);
              }
              await reader.cancel(error);
              throw error;
            }
          }
          success = true;
        }

        if (success) {
          try {
            await op_http_shutdown(writeStreamRid);
          } catch (error) {
            await reader.cancel(error);
            throw error;
          }
        }
      }

      const ws = resp[_ws];
      if (ws) {
        const wsRid = await op_http_upgrade_websocket(
          readStreamRid,
        );
        ws[_rid] = wsRid;
        ws[_protocol] = resp.headers.get("sec-websocket-protocol");

        httpConn.close();

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
      }
    } catch (error) {
      abortRequest(request);
      throw error;
    } finally {
      if (deleteManagedResource(httpConn, readStreamRid)) {
        core.tryClose(readStreamRid);
      }
      if (deleteManagedResource(httpConn, writeStreamRid)) {
        core.tryClose(writeStreamRid);
      }
    }
  };
}

function serveHttp(conn) {
  const rid = op_http_start(conn[internalRidSymbol]);
  return new HttpConn(rid, conn.remoteAddr, conn.localAddr);
}

export { HttpConn, serveHttp };
