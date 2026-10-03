// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { getDefaultHighWaterMark } from "ext:deno_node/internal/streams/state.mjs";
import assert from "ext:deno_node/internal/assert.mjs";
import EE from "node:events";
import { Stream } from "node:stream";
import { deprecate } from "node:util";
import type { Socket } from "node:net";
import {
  kNeedDrain,
  kOutHeaders,
  utcDate,
} from "ext:deno_node/internal/http.ts";
import { notImplemented } from "ext:deno_node/_utils.ts";
import { Buffer } from "node:buffer";
import {
  _checkInvalidHeaderChar as checkInvalidHeaderChar,
  _checkIsHttpToken as checkIsHttpToken,
  chunkExpression as RE_TE_CHUNKED,
} from "node:_http_common";
import {
  defaultTriggerAsyncIdScope,
  symbols,
} from "ext:deno_node/internal/async_hooks.ts";
const { async_id_symbol } = symbols;
import {
  ERR_HTTP_HEADERS_SENT,
  ERR_HTTP_INVALID_HEADER_VALUE,
  ERR_HTTP_TRAILER_INVALID,
  ERR_INVALID_ARG_TYPE,
  // ERR_INVALID_ARG_VALUE,
  ERR_INVALID_CHAR,
  ERR_INVALID_HTTP_TOKEN,
  ERR_METHOD_NOT_IMPLEMENTED,
  // ERR_STREAM_ALREADY_FINISHED,
  ERR_STREAM_CANNOT_PIPE,
  // ERR_STREAM_DESTROYED,
  ERR_STREAM_NULL_VALUES,
  // ERR_STREAM_WRITE_AFTER_END,
  hideStackFrames,
} from "ext:deno_node/internal/errors.ts";
import { validateString } from "ext:deno_node/internal/validators.mjs";
import { isUint8Array } from "ext:deno_node/internal/util/types.ts";
// import { kStreamBaseField } from "ext:deno_node/internal_binding/stream_wrap.ts";

import { debuglog } from "ext:deno_node/internal/util/debuglog.ts";
let debug = debuglog("http", (fn) => {
  debug = fn;
});

const HIGH_WATER_MARK = getDefaultHighWaterMark();

export const kUniqueHeaders = Symbol("kUniqueHeaders");
export const kHighWaterMark = Symbol("kHighWaterMark");
const kCorked = Symbol("corked");

const nop = () => {};

const RE_CONN_CLOSE = /(?:^|\W)close(?:$|\W)/i;

export function OutgoingMessage() {
  Stream.call(this);

  // Queue that holds all currently pending data, until the response will be
  // assigned to the socket (until it will its turn in the HTTP pipeline).
  this.outputData = [];

  // `outputSize` is an approximate measure of how much data is queued on this
  // response. `_onPendingData` will be invoked to update similar global
  // per-connection counter. That counter will be used to pause/unpause the
  // TCP socket and HTTP Parser and thus handle the backpressure.
  this.outputSize = 0;

  this.writable = true;
  this.destroyed = false;

  this._last = false;
  this.chunkedEncoding = false;
  this.shouldKeepAlive = true;
  this.maxRequestsOnConnectionReached = false;
  this._defaultKeepAlive = true;
  this.useChunkedEncodingByDefault = true;
  this.sendDate = false;
  this._removedConnection = false;
  this._removedContLen = false;
  this._removedTE = false;

  this._contentLength = null;
  this._hasBody = true;
  this._trailer = "";
  this[kNeedDrain] = false;

  this.finished = false;
  this._headerSent = false;
  this[kCorked] = 0;
  this._closed = false;

  this.socket = null;
  this._header = null;
  this[kOutHeaders] = null;

  this._keepAliveTimeout = 0;

  this._onPendingData = nop;

  this._bodyWriter = null;
}

Object.setPrototypeOf(OutgoingMessage.prototype, Stream.prototype);
Object.setPrototypeOf(OutgoingMessage, Stream);

Object.defineProperties(
  OutgoingMessage.prototype,
  Object.getOwnPropertyDescriptors({
    get writableFinished() {
      return (
        this.finished &&
        this.outputSize === 0 &&
        (!this.socket || this.socket.writableLength === 0)
      );
    },

    get writableObjectMode() {
      return false;
    },

    get writableLength() {
      return this.outputSize + (this.socket ? this.socket.writableLength : 0);
    },

    get writableHighWaterMark() {
      return this.socket ? this.socket.writableHighWaterMark : HIGH_WATER_MARK;
    },

    get writableCorked() {
      const corked = this.socket ? this.socket.writableCorked : 0;
      return corked + this[kCorked];
    },

    get connection() {
      return this.socket;
    },

    set connection(val) {
      this.socket = val;
    },

    get writableEnded() {
      return this.finished;
    },

    get writableNeedDrain() {
      return !this.destroyed && !this.finished && this[kNeedDrain];
    },

    cork() {
      if (this.socket) {
        this.socket.cork();
      } else {
        this[kCorked]++;
      }
    },

    uncork() {
      if (this.socket) {
        this.socket.uncork();
      } else if (this[kCorked]) {
        this[kCorked]--;
      }
    },

    setTimeout(msecs: number, callback?: (...args: unknown[]) => void) {
      if (callback) {
        this.on("timeout", callback);
      }

      if (!this.socket) {
        // deno-lint-ignore no-explicit-any
        this.once("socket", function socketSetTimeoutOnConnect(socket: any) {
          socket.setTimeout(msecs);
        });
      } else {
        this.socket.setTimeout(msecs);
      }
      return this;
    },

    // It's possible that the socket will be destroyed, and removed from
    // any messages, before ever calling this.  In that case, just skip
    // it, since something else is destroying this connection anyway.
    destroy(error: unknown) {
      if (this.destroyed) {
        return this;
      }
      this.destroyed = true;

      if (this.socket) {
        this.socket.destroy(error);
      } else {
        // deno-lint-ignore no-explicit-any
        this.once("socket", function socketDestroyOnConnect(socket: any) {
          socket.destroy(error);
        });
      }

      return this;
    },

    setHeader(name: string, value: string) {
      if (this._header) {
        throw new ERR_HTTP_HEADERS_SENT("set");
      }
      validateHeaderName(name);
      validateHeaderValue(name, value);

      let headers = this[kOutHeaders];
      if (headers === null) {
        this[kOutHeaders] = headers = Object.create(null);
      }

      name = name.toString();
      headers[name.toLowerCase()] = [name, String(value)];
      return this;
    },

    appendHeader(name, value) {
      if (this._header) {
        throw new ERR_HTTP_HEADERS_SENT("append");
      }
      validateHeaderName(name);
      validateHeaderValue(name, value);

      name = name.toString();

      const field = name.toLowerCase();
      const headers = this[kOutHeaders];
      if (headers === null || !headers[field]) {
        return this.setHeader(name, value);
      }

      // Prepare the field for appending, if required
      if (!Array.isArray(headers[field][1])) {
        headers[field][1] = [headers[field][1]];
      }

      const existingValues = headers[field][1];
      if (Array.isArray(value)) {
        for (let i = 0, length = value.length; i < length; i++) {
          existingValues.push(value[i].toString());
        }
      } else {
        existingValues.push(value.toString());
      }

      return this;
    },

    // Returns a shallow copy of the current outgoing headers.
    getHeaders() {
      const headers = this[kOutHeaders];
      const ret = Object.create(null);
      if (headers) {
        const keys = Object.keys(headers);
        // Retain for(;;) loop for performance reasons
        // Refs: https://github.com/nodejs/node/pull/30958
        for (let i = 0; i < keys.length; ++i) {
          const key = keys[i];
          const val = headers[key][1];
          ret[key] = val;
        }
      }
      return ret;
    },

    hasHeader(name: string) {
      validateString(name, "name");
      return this[kOutHeaders] !== null &&
        !!this[kOutHeaders][name.toLowerCase()];
    },

    removeHeader(name: string) {
      validateString(name, "name");

      if (this._header) {
        throw new ERR_HTTP_HEADERS_SENT("remove");
      }

      const key = name.toLowerCase();

      switch (key) {
        case "connection":
          this._removedConnection = true;
          break;
        case "content-length":
          this._removedContLen = true;
          break;
        case "transfer-encoding":
          this._removedTE = true;
          break;
        case "date":
          this.sendDate = false;
          break;
      }

      if (this[kOutHeaders] !== null) {
        delete this[kOutHeaders][key];
      }
    },

    getHeader(name: string) {
      validateString(name, "name");

      const headers = this[kOutHeaders];
      if (headers === null) {
        return;
      }

      const entry = headers[name.toLowerCase()];
      return entry && entry[1];
    },

    // Returns an array of the names of the current outgoing headers.
    getHeaderNames() {
      return this[kOutHeaders] !== null ? Object.keys(this[kOutHeaders]) : [];
    },

    // Returns an array of the names of the current outgoing raw headers.
    getRawHeaderNames() {
      const headersMap = this[kOutHeaders];
      if (headersMap === null) return [];

      const values = Object.values(headersMap);
      const headers = Array(values.length);
      // Retain for(;;) loop for performance reasons
      // Refs: https://github.com/nodejs/node/pull/30958
      for (let i = 0, l = values.length; i < l; i++) {
        // deno-lint-ignore no-explicit-any
        headers[i] = (values as any)[i][0];
      }

      return headers;
    },

    write(
      chunk: string | Uint8Array | Buffer,
      encoding: string | null,
      callback: () => void,
    ): boolean {
      if (typeof encoding === "function") {
        callback = encoding;
        encoding = null;
      }
      return this.write_(chunk, encoding, callback, false);
    },

    write_(
      chunk: string | Uint8Array | Buffer,
      encoding: string | null,
      callback: () => void,
      fromEnd: boolean,
    ): boolean {
      // Ignore lint to keep the code as similar to Nodejs as possible
      // deno-lint-ignore no-this-alias
      const msg = this;

      if (chunk === null) {
        throw new ERR_STREAM_NULL_VALUES();
      } else if (typeof chunk !== "string" && !isUint8Array(chunk)) {
        throw new ERR_INVALID_ARG_TYPE(
          "chunk",
          ["string", "Buffer", "Uint8Array"],
          chunk,
        );
      }

      let len: number;

      if (!msg._header) {
        if (fromEnd) {
          len ??= typeof chunk === "string"
            ? Buffer.byteLength(chunk, encoding)
            : chunk.byteLength;
          msg._contentLength = len;
        }
        msg._implicitHeader();
      }

      return msg._send(chunk, encoding, callback);
    },

    // deno-lint-ignore no-explicit-any
    addTrailers(_headers: any) {
      // TODO(crowlKats): finish it
      notImplemented("OutgoingMessage.addTrailers");
    },

    // deno-lint-ignore no-explicit-any
    end(_chunk: any, _encoding: any, _callback: any) {
      notImplemented("OutgoingMessage.end");
    },

    flushHeaders() {
      if (!this._header) {
        this._implicitHeader();
      }

      // Force-flush the headers.
      this._send("");
    },

    pipe() {
      // OutgoingMessage should be write-only. Piping from it is disabled.
      this.emit("error", new ERR_STREAM_CANNOT_PIPE());
    },

    _implicitHeader() {
      throw new ERR_METHOD_NOT_IMPLEMENTED("_implicitHeader()");
    },

    _finish() {
      assert(this.socket);
      this.emit("prefinish");
    },

    // This logic is probably a bit confusing. Let me explain a bit:
    //
    // In both HTTP servers and clients it is possible to queue up several
    // outgoing messages. This is easiest to imagine in the case of a client.
    // Take the following situation:
    //
    //    req1 = client.request('GET', '/');
    //    req2 = client.request('POST', '/');
    //
    // When the user does
    //
    //   req2.write('hello world\n');
    //
    // it's possible that the first request has not been completely flushed to
    // the socket yet. Thus the outgoing messages need to be prepared to queue
    // up data internally before sending it on further to the socket's queue.
    //
    // This function, outgoingFlush(), is called by both the Server and Client
    // to attempt to flush any pending messages out to the socket.
    _flush() {
      const socket = this.socket;

      if (socket && socket.writable) {
        // There might be remaining data in this.output; write it out
        const ret = this._flushOutput(socket);

        if (this.finished) {
          // This is a queue to the server or client to bring in the next this.
          this._finish();
        } else if (ret && this[kNeedDrain]) {
          this[kNeedDrain] = false;
          this.emit("drain");
        }
      }
    },

    _flushOutput(socket: Socket) {
      while (this[kCorked]) {
        this[kCorked]--;
        socket.cork();
      }

      const outputLength = this.outputData.length;
      if (outputLength <= 0) {
        return undefined;
      }

      const outputData = this.outputData;
      socket.cork();
      let ret;
      // Retain for(;;) loop for performance reasons
      // Refs: https://github.com/nodejs/node/pull/30958
      for (let i = 0; i < outputLength; i++) {
        const { data, encoding, callback } = outputData[i];
        ret = socket.write(data, encoding, callback);
      }
      socket.uncork();

      this.outputData = [];
      this._onPendingData(-this.outputSize);
      this.outputSize = 0;

      return ret;
    },

    // deno-lint-ignore no-explicit-any
    _send(data: any, encoding?: string | null, callback?: () => void) {
      if (!this._headerSent && this._header !== null) {
        this._writeHeader();
        this._headerSent = true;
      }
      return this._writeRaw(data, encoding, callback);
    },

    _writeHeader() {
      throw new ERR_METHOD_NOT_IMPLEMENTED("_writeHeader()");
    },

    _writeRaw(
      // deno-lint-ignore no-explicit-any
      data: any,
      encoding?: string | null,
      callback?: () => void,
    ) {
      if (typeof data === "string") {
        data = Buffer.from(data, encoding);
      }
      if (data instanceof Buffer) {
        data = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
      }
      if (data.buffer.byteLength > 0) {
        this._bodyWriter.write(data).then(() => {
          callback?.();
          this.emit("drain");
        }).catch((e) => {
          this._requestSendError = e;
        });
      }
      return false;
    },

    _renderHeaders() {
      if (this._header) {
        throw new ERR_HTTP_HEADERS_SENT("render");
      }

      const headersMap = this[kOutHeaders];
      // deno-lint-ignore no-explicit-any
      const headers: any = {};

      if (headersMap !== null) {
        const keys = Object.keys(headersMap);
        // Retain for(;;) loop for performance reasons
        // Refs: https://github.com/nodejs/node/pull/30958
        for (let i = 0, l = keys.length; i < l; i++) {
          const key = keys[i];
          headers[headersMap[key][0]] = headersMap[key][1];
        }
      }
      return headers;
    },

    _storeHeader(firstLine: string, _headers: never) {
      // firstLine in the case of request is: 'GET /index.html HTTP/1.1\r\n'
      // in the case of response it is: 'HTTP/1.1 200 OK\r\n'
      const state = {
        connection: false,
        contLen: false,
        te: false,
        date: false,
        expect: false,
        trailer: false,
        header: firstLine,
      };

      const headers = this[kOutHeaders];
      if (headers) {
        // headers is null-prototype object, so ignore the guard lint
        // deno-lint-ignore guard-for-in
        for (const key in headers) {
          const entry = headers[key];
          this._matchHeader(state, entry[0], entry[1]);
        }
      }

      // Date header
      if (this.sendDate && !state.date) {
        this.setHeader("Date", utcDate());
      }

      // Force the connection to close when the response is a 204 No Content or
      // a 304 Not Modified and the user has set a "Transfer-Encoding: chunked"
      // header.
      //
      // RFC 2616 mandates that 204 and 304 responses MUST NOT have a body but
      // node.js used to send out a zero chunk anyway to accommodate clients
      // that don't have special handling for those responses.
      //
      // It was pointed out that this might confuse reverse proxies to the point
      // of creating security liabilities, so suppress the zero chunk and force
      // the connection to close.
      if (
        this.chunkedEncoding && (this.statusCode === 204 ||
          this.statusCode === 304)
      ) {
        debug(
          this.statusCode + " response should not use chunked encoding," +
            " closing connection.",
        );
        this.chunkedEncoding = false;
        this.shouldKeepAlive = false;
      }

      // TODO(osddeitf): this depends on agent and underlying socket
      // keep-alive logic
      // if (this._removedConnection) {
      //   this._last = true;
      //   this.shouldKeepAlive = false;
      // } else if (!state.connection) {
      //   const shouldSendKeepAlive = this.shouldKeepAlive &&
      //       (state.contLen || this.useChunkedEncodingByDefault || this.agent);
      //   if (shouldSendKeepAlive && this.maxRequestsOnConnectionReached) {
      //     this.setHeader('Connection', 'close');
      //   } else if (shouldSendKeepAlive) {
      //     this.setHeader('Connection', 'keep-alive');
      //     if (this._keepAliveTimeout && this._defaultKeepAlive) {
      //       const timeoutSeconds = Math.floor(this._keepAliveTimeout / 1000);
      //       let max = '';
      //       if (~~this._maxRequestsPerSocket > 0) {
      //         max = `, max=${this._maxRequestsPerSocket}`;
      //       }
      //       this.setHeader('Keep-Alive', `timeout=${timeoutSeconds}${max}`);
      //     }
      //   } else {
      //     this._last = true;
      //     this.setHeader('Connection', 'close');
      //   }
      // }

      if (!state.contLen && !state.te) {
        if (!this._hasBody) {
          // Make sure we don't end the 0\r\n\r\n at the end of the message.
          this.chunkedEncoding = false;
        } else if (!this.useChunkedEncodingByDefault) {
          this._last = true;
        } else if (
          !state.trailer &&
          !this._removedContLen &&
          typeof this._contentLength === "number"
        ) {
          this.setHeader("Content-Length", this._contentLength);
        } else if (!this._removedTE) {
          this.setHeader("Transfer-Encoding", "chunked");
          this.chunkedEncoding = true;
        } else {
          // We should only be able to get here if both Content-Length and
          // Transfer-Encoding are removed by the user.
          // See: test/parallel/test-http-remove-header-stays-removed.js
          debug("Both Content-Length and Transfer-Encoding are removed");
        }
      }

      // Test non-chunked message does not have trailer header set,
      // message will be terminated by the first empty line after the
      // header fields, regardless of the header fields present in the
      // message, and thus cannot contain a message body or 'trailers'.
      if (this.chunkedEncoding !== true && state.trailer) {
        throw new ERR_HTTP_TRAILER_INVALID();
      }

      const { header } = state;
      this._header = header + "\r\n";
      this._headerSent = false;

      // Wait until the first body chunk, or close(), is sent to flush,
      // UNLESS we're sending Expect: 100-continue.
      if (state.expect) this._send("");
    },

    _matchHeader(
      // deno-lint-ignore no-explicit-any
      state: any,
      field: string,
      // deno-lint-ignore no-explicit-any
      value: any,
    ) {
      // Ignore lint to keep the code as similar to Nodejs as possible
      // deno-lint-ignore no-this-alias
      const self = this;
      if (field.length < 4 || field.length > 17) {
        return;
      }
      field = field.toLowerCase();
      switch (field) {
        case "connection":
          state.connection = true;
          self._removedConnection = false;
          if (RE_CONN_CLOSE.exec(value) !== null) {
            self._last = true;
          } else {
            self.shouldKeepAlive = true;
          }
          break;
        case "transfer-encoding":
          state.te = true;
          self._removedTE = false;
          if (RE_TE_CHUNKED.exec(value) !== null) {
            self.chunkedEncoding = true;
          }
          break;
        case "content-length":
          state.contLen = true;
          self._contentLength = value;
          self._removedContLen = false;
          break;
        case "date":
        case "expect":
        case "trailer":
          state[field] = true;
          break;
        case "keep-alive":
          self._defaultKeepAlive = false;
          break;
      }
    },

    // deno-lint-ignore no-explicit-any
    [EE.captureRejectionSymbol](err: any, _event: any) {
      this.destroy(err);
    },
  }),
);

Object.defineProperty(OutgoingMessage.prototype, "_headers", {
  get: deprecate(
    // deno-lint-ignore no-explicit-any
    function (this: any) {
      return this.getHeaders();
    },
    "OutgoingMessage.prototype._headers is deprecated",
    "DEP0066",
  ),
  set: deprecate(
    // deno-lint-ignore no-explicit-any
    function (this: any, val: any) {
      if (val == null) {
        this[kOutHeaders] = null;
      } else if (typeof val === "object") {
        const headers = this[kOutHeaders] = Object.create(null);
        const keys = Object.keys(val);
        // Retain for(;;) loop for performance reasons
        // Refs: https://github.com/nodejs/node/pull/30958
        for (let i = 0; i < keys.length; ++i) {
          const name = keys[i];
          headers[name.toLowerCase()] = [name, val[name]];
        }
      }
    },
    "OutgoingMessage.prototype._headers is deprecated",
    "DEP0066",
  ),
});

Object.defineProperty(OutgoingMessage.prototype, "_headerNames", {
  get: deprecate(
    // deno-lint-ignore no-explicit-any
    function (this: any) {
      const headers = this[kOutHeaders];
      if (headers !== null) {
        const out = Object.create(null);
        const keys = Object.keys(headers);
        // Retain for(;;) loop for performance reasons
        // Refs: https://github.com/nodejs/node/pull/30958
        for (let i = 0; i < keys.length; ++i) {
          const key = keys[i];
          const val = headers[key][0];
          out[key] = val;
        }
        return out;
      }
      return null;
    },
    "OutgoingMessage.prototype._headerNames is deprecated",
    "DEP0066",
  ),
  set: deprecate(
    // deno-lint-ignore no-explicit-any
    function (this: any, val: any) {
      if (typeof val === "object" && val !== null) {
        const headers = this[kOutHeaders];
        if (!headers) {
          return;
        }
        const keys = Object.keys(val);
        // Retain for(;;) loop for performance reasons
        // Refs: https://github.com/nodejs/node/pull/30958
        for (let i = 0; i < keys.length; ++i) {
          const header = headers[keys[i]];
          if (header) {
            header[0] = val[keys[i]];
          }
        }
      }
    },
    "OutgoingMessage.prototype._headerNames is deprecated",
    "DEP0066",
  ),
});

export const validateHeaderName = hideStackFrames(
  (name: string, label?: string): void => {
    if (typeof name !== "string" || !name || !checkIsHttpToken(name)) {
      throw new ERR_INVALID_HTTP_TOKEN(label || "Header name", name);
    }
  },
);

export const validateHeaderValue = hideStackFrames(
  (name: string, value: string): void => {
    if (value === undefined) {
      throw new ERR_HTTP_INVALID_HEADER_VALUE(value, name);
    }
    if (checkInvalidHeaderChar(value)) {
      debug('Header "%s" contains invalid characters', name);
      throw new ERR_INVALID_CHAR("header content", name);
    }
  },
);

export function parseUniqueHeadersOption(headers) {
  if (!Array.isArray(headers)) {
    return null;
  }

  const unique = new Set();
  const l = headers.length;
  for (let i = 0; i < l; i++) {
    unique.add(headers[i].toLowerCasee());
  }

  return unique;
}

Object.defineProperty(OutgoingMessage.prototype, "headersSent", {
  configurable: true,
  enumerable: true,
  get: function () {
    return !!this._header;
  },
});

// TODO(bartlomieju): use it
// deno-lint-ignore camelcase
const _crlf_buf = Buffer.from("\r\n");

// TODO(bartlomieju): use it
// deno-lint-ignore no-explicit-any
function _onError(msg: any, err: any, callback: any) {
  const triggerAsyncId = msg.socket ? msg.socket[async_id_symbol] : undefined;
  defaultTriggerAsyncIdScope(
    triggerAsyncId,
    // deno-lint-ignore no-explicit-any
    (globalThis as any).process.nextTick,
    emitErrorNt,
    msg,
    err,
    callback,
  );
}

// deno-lint-ignore no-explicit-any
function emitErrorNt(msg: any, err: any, callback: any) {
  callback(err);
  if (typeof msg.emit === "function" && !msg._closed) {
    msg.emit("error", err);
  }
}

// TODO(bartlomieju): use it
function _write_(
  // deno-lint-ignore no-explicit-any
  _msg: any,
  // deno-lint-ignore no-explicit-any
  _chunk: any,
  _encoding: string | null,
  // deno-lint-ignore no-explicit-any
  _callback: any,
  // deno-lint-ignore no-explicit-any
  _fromEnd: any,
) {
  // TODO(crowlKats): finish
}

// TODO(bartlomieju): use it
// deno-lint-ignore no-explicit-any
function _connectionCorkNT(conn: any) {
  conn.uncork();
}

// TODO(bartlomieju): use it
// deno-lint-ignore no-explicit-any
function _onFinish(outmsg: any) {
  if (outmsg && outmsg.socket && outmsg.socket._hadError) return;
  outmsg.emit("finish");
}

export default {
  kUniqueHeaders,
  kHighWaterMark,
  validateHeaderName,
  validateHeaderValue,
  parseUniqueHeadersOption,
  OutgoingMessage,
};
