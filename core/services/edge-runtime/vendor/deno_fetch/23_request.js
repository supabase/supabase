// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// @ts-check
/// <reference path="../webidl/internal.d.ts" />
/// <reference path="../web/internal.d.ts" />
/// <reference path="../web/lib.deno_web.d.ts" />
/// <reference path="./internal.d.ts" />
/// <reference path="../web/06_streams_types.d.ts" />
/// <reference path="./lib.deno_fetch.d.ts" />
/// <reference lib="esnext" />

import { core, internals, primordials } from "ext:core/mod.js";
const {
  ArrayPrototypeMap,
  ArrayPrototypeSlice,
  ArrayPrototypeSplice,
  ObjectFreeze,
  ObjectKeys,
  ObjectPrototypeIsPrototypeOf,
  RegExpPrototypeExec,
  StringPrototypeStartsWith,
  Symbol,
  SymbolFor,
  TypeError,
} = primordials;

import * as webidl from "ext:deno_webidl/00_webidl.js";
import { createFilteredInspectProxy } from "ext:deno_console/01_console.js";
import {
  byteUpperCase,
  HTTP_TOKEN_CODE_POINT_RE,
} from "ext:deno_web/00_infra.js";
import { URL } from "ext:deno_url/00_url.js";
import { extractBody, mixinBody } from "ext:deno_fetch/22_body.js";
import { getLocationHref } from "ext:deno_web/12_location.js";
import { extractMimeType } from "ext:deno_web/01_mimesniff.js";
import { blobFromObjectUrl } from "ext:deno_web/09_file.js";
import {
  fillHeaders,
  getDecodeSplitHeader,
  guardFromHeaders,
  headerListFromHeaders,
  headersFromHeaderList,
} from "ext:deno_fetch/20_headers.js";
import { HttpClientPrototype } from "ext:deno_fetch/22_http_client.js";
import {
  createDependentAbortSignal,
  newSignal,
  signalAbort,
} from "ext:deno_web/03_abort_signal.js";
import { DOMException } from "ext:deno_web/01_dom_exception.js";
const { internalRidSymbol } = core;

const _request = Symbol("request");
const _headers = Symbol("headers");
const _getHeaders = Symbol("get headers");
const _headersCache = Symbol("headers cache");
const _signal = Symbol("signal");
const _signalCache = Symbol("signalCache");
const _mimeType = Symbol("mime type");
const _body = Symbol("body");
const _url = Symbol("url");
const _method = Symbol("method");
const _brand = webidl.brand;

/**
 * @param {(() => string)[]} urlList
 * @param {string[]} urlListProcessed
 */
function processUrlList(urlList, urlListProcessed) {
  for (let i = 0; i < urlList.length; i++) {
    if (urlListProcessed[i] === undefined) {
      urlListProcessed[i] = urlList[i]();
    }
  }
  return urlListProcessed;
}

/**
 * @typedef InnerRequest
 * @property {() => string} method
 * @property {() => string} url
 * @property {() => string} currentUrl
 * @property {() => [string, string][]} headerList
 * @property {null | typeof __window.bootstrap.fetchBody.InnerBody} body
 * @property {"follow" | "error" | "manual"} redirectMode
 * @property {number} redirectCount
 * @property {(() => string)[]} urlList
 * @property {string[]} urlListProcessed
 * @property {number | null} clientRid NOTE: non standard extension for `Deno.HttpClient`.
 * @property {Blob | null} blobUrlEntry
 */

/**
 * @param {string} method
 * @param {string | () => string} url
 * @param {() => [string, string][]} headerList
 * @param {typeof __window.bootstrap.fetchBody.InnerBody} body
 * @param {boolean} maybeBlob
 * @returns {InnerRequest}
 */
function newInnerRequest(method, url, headerList, body, maybeBlob) {
  let blobUrlEntry = null;
  if (
    maybeBlob &&
    typeof url === "string" &&
    StringPrototypeStartsWith(url, "blob:")
  ) {
    blobUrlEntry = blobFromObjectUrl(url);
  }
  return {
    methodInner: method,
    get method() {
      return this.methodInner;
    },
    set method(value) {
      this.methodInner = value;
    },
    headerListInner: null,
    get headerList() {
      if (this.headerListInner === null) {
        try {
          this.headerListInner = headerList();
        } catch {
          throw new TypeError("Cannot read headers: request closed");
        }
      }
      return this.headerListInner;
    },
    set headerList(value) {
      this.headerListInner = value;
    },
    body,
    redirectMode: "follow",
    redirectCount: 0,
    urlList: [typeof url === "string" ? () => url : url],
    urlListProcessed: [],
    clientRid: null,
    blobUrlEntry,
    url() {
      if (this.urlListProcessed[0] === undefined) {
        try {
          this.urlListProcessed[0] = this.urlList[0]();
        } catch {
          throw new TypeError("cannot read url: request closed");
        }
      }
      return this.urlListProcessed[0];
    },
    currentUrl() {
      const currentIndex = this.urlList.length - 1;
      if (this.urlListProcessed[currentIndex] === undefined) {
        try {
          this.urlListProcessed[currentIndex] = this.urlList[currentIndex]();
        } catch {
          throw new TypeError("Cannot read url: request closed");
        }
      }
      return this.urlListProcessed[currentIndex];
    },
  };
}

/**
 * https://fetch.spec.whatwg.org/#concept-request-clone
 * @param {InnerRequest} request
 * @param {boolean} skipBody
 * @returns {InnerRequest}
 */
function cloneInnerRequest(request, skipBody = false) {
  const headerList = ArrayPrototypeMap(
    request.headerList,
    (x) => [x[0], x[1]],
  );

  let body = null;
  if (request.body !== null && !skipBody) {
    body = request.body.clone();
  }

  return {
    method: request.method,
    headerList,
    body,
    redirectMode: request.redirectMode,
    redirectCount: request.redirectCount,
    urlList: [() => request.url()],
    urlListProcessed: [request.url()],
    clientRid: request.clientRid,
    blobUrlEntry: request.blobUrlEntry,
    url() {
      if (this.urlListProcessed[0] === undefined) {
        try {
          this.urlListProcessed[0] = this.urlList[0]();
        } catch {
          throw new TypeError("Cannot read url: request closed");
        }
      }
      return this.urlListProcessed[0];
    },
    currentUrl() {
      const currentIndex = this.urlList.length - 1;
      if (this.urlListProcessed[currentIndex] === undefined) {
        try {
          this.urlListProcessed[currentIndex] = this.urlList[currentIndex]();
        } catch {
          throw new TypeError("Cannot read url: request closed");
        }
      }
      return this.urlListProcessed[currentIndex];
    },
  };
}

// method => normalized method
const KNOWN_METHODS = {
  "DELETE": "DELETE",
  "delete": "DELETE",
  "GET": "GET",
  "get": "GET",
  "HEAD": "HEAD",
  "head": "HEAD",
  "OPTIONS": "OPTIONS",
  "options": "OPTIONS",
  "PATCH": "PATCH",
  "patch": "PATCH",
  "POST": "POST",
  "post": "POST",
  "PUT": "PUT",
  "put": "PUT",
};

/**
 * @param {string} m
 * @returns {string}
 */
function validateAndNormalizeMethod(m) {
  if (RegExpPrototypeExec(HTTP_TOKEN_CODE_POINT_RE, m) === null) {
    throw new TypeError("Method is not valid");
  }
  const upperCase = byteUpperCase(m);
  if (
    upperCase === "CONNECT" || upperCase === "TRACE" || upperCase === "TRACK"
  ) {
    throw new TypeError("Method is forbidden");
  }
  return upperCase;
}

class Request {
  /** @type {InnerRequest} */
  [_request];
  /** @type {Headers} */
  [_headersCache];
  [_getHeaders];

  /** @type {Headers} */
  get [_headers]() {
    if (this[_headersCache] === undefined) {
      this[_headersCache] = this[_getHeaders]();
    }
    return this[_headersCache];
  }

  set [_headers](value) {
    this[_headersCache] = value;
  }

  /** @type {AbortSignal} */
  get [_signal]() {
    const signal = this[_signalCache];
    // This signal has not been created yet, but the request has already completed
    if (signal === false) {
      const signal = newSignal();
      this[_signalCache] = signal;
      signal[signalAbort](signalAbortError);
      return signal;
    }

    // This signal not been created yet, and the request is still in progress
    if (signal === undefined) {
      const signal = newSignal();
      this[_signalCache] = signal;
      this[_request].onCancel?.(() => {
        signal[signalAbort](signalAbortError);
      });

      return signal;
    }

    return signal;
  }
  get [_mimeType]() {
    const values = getDecodeSplitHeader(
      headerListFromHeaders(this[_headers]),
      "Content-Type",
    );
    return extractMimeType(values);
  }
  get [_body]() {
    return this[_request].body;
  }

  /**
   * https://fetch.spec.whatwg.org/#dom-request
   * @param {RequestInfo} input
   * @param {RequestInit} init
   */
  constructor(input, init = { __proto__: null }) {
    if (input === _brand) {
      this[_brand] = _brand;
      return;
    }

    const prefix = "Failed to construct 'Request'";
    webidl.requiredArguments(arguments.length, 1, prefix);
    input = webidl.converters["RequestInfo_DOMString"](
      input,
      prefix,
      "Argument 1",
    );
    init = webidl.converters["RequestInit"](init, prefix, "Argument 2");

    this[_brand] = _brand;

    /** @type {InnerRequest} */
    let request;
    const baseURL = getLocationHref();

    // 4.
    let signal = null;

    // 5.
    if (typeof input === "string") {
      const parsedURL = new URL(input, baseURL);
      request = newInnerRequest(
        "GET",
        parsedURL.href,
        () => [],
        null,
        true,
      );
    } else { // 6.
      if (!ObjectPrototypeIsPrototypeOf(RequestPrototype, input)) {
        throw new TypeError("Unreachable");
      }
      const originalReq = input[_request];
      // fold in of step 12 from below
      request = cloneInnerRequest(originalReq, true);
      request.redirectCount = 0; // reset to 0 - cloneInnerRequest copies the value
      signal = input[_signal];
    }

    // 12. is folded into the else statement of step 6 above.

    // 22.
    if (init.redirect !== undefined) {
      request.redirectMode = init.redirect;
    }

    // 25.
    if (init.method !== undefined) {
      const method = init.method;
      // fast path: check for known methods
      request.method = KNOWN_METHODS[method] ??
        validateAndNormalizeMethod(method);
    }

    // 26.
    if (init.signal !== undefined) {
      signal = init.signal;
    }

    // NOTE: non standard extension. This handles Deno.HttpClient parameter
    if (init.client !== undefined) {
      if (
        init.client !== null &&
        !ObjectPrototypeIsPrototypeOf(HttpClientPrototype, init.client)
      ) {
        throw webidl.makeException(
          TypeError,
          "`client` must be a Deno.HttpClient",
          prefix,
          "Argument 2",
        );
      }
      request.clientRid = init.client?.[internalRidSymbol] ?? null;
    }

    // 28.
    this[_request] = request;

    // 29 & 30.
    if (signal !== null) {
      this[_signalCache] = createDependentAbortSignal([signal], prefix);
    }

    // 31.
    this[_headers] = headersFromHeaderList(request.headerList, "request");

    // 33.
    if (init.headers || ObjectKeys(init).length > 0) {
      const headerList = headerListFromHeaders(this[_headers]);
      const headers = init.headers ?? ArrayPrototypeSlice(
        headerList,
        0,
        headerList.length,
      );
      if (headerList.length !== 0) {
        ArrayPrototypeSplice(headerList, 0, headerList.length);
      }
      fillHeaders(this[_headers], headers);
    }

    // 34.
    let inputBody = null;
    if (ObjectPrototypeIsPrototypeOf(RequestPrototype, input)) {
      inputBody = input[_body];
    }

    // 35.
    if (
      (request.method === "GET" || request.method === "HEAD") &&
      ((init.body !== undefined && init.body !== null) ||
        inputBody !== null)
    ) {
      throw new TypeError("Request with GET/HEAD method cannot have body");
    }

    // 36.
    let initBody = null;

    // 37.
    if (init.body !== undefined && init.body !== null) {
      const res = extractBody(init.body);
      initBody = res.body;
      if (res.contentType !== null && !this[_headers].has("content-type")) {
        this[_headers].append("Content-Type", res.contentType);
      }
    }

    // 38.
    const inputOrInitBody = initBody ?? inputBody;

    // 40.
    let finalBody = inputOrInitBody;

    // 41.
    if (initBody === null && inputBody !== null) {
      if (input[_body] && input[_body].unusable()) {
        throw new TypeError("Input request's body is unusable");
      }
      finalBody = inputBody.createProxy();
    }

    // 42.
    request.body = finalBody;
  }

  get method() {
    webidl.assertBranded(this, RequestPrototype);
    if (this[_method]) {
      return this[_method];
    }
    this[_method] = this[_request].method;
    return this[_method];
  }

  get url() {
    webidl.assertBranded(this, RequestPrototype);
    if (this[_url]) {
      return this[_url];
    }

    this[_url] = this[_request].url();
    return this[_url];
  }

  get headers() {
    webidl.assertBranded(this, RequestPrototype);
    return this[_headers];
  }

  get redirect() {
    webidl.assertBranded(this, RequestPrototype);
    return this[_request].redirectMode;
  }

  get signal() {
    webidl.assertBranded(this, RequestPrototype);
    return this[_signal];
  }

  clone() {
    const prefix = "Failed to execute 'Request.clone'";
    webidl.assertBranded(this, RequestPrototype);
    if (this[_body] && this[_body].unusable()) {
      throw new TypeError("Body is unusable");
    }
    const clonedReq = cloneInnerRequest(this[_request]);

    const materializedSignal = this[_signal];
    const clonedSignal = createDependentAbortSignal(
      [materializedSignal],
      prefix,
    );

    const request = new Request(_brand);
    request[_request] = clonedReq;
    request[_signalCache] = clonedSignal;
    request[_getHeaders] = () =>
      headersFromHeaderList(
        clonedReq.headerList,
        guardFromHeaders(this[_headers]),
      );
    return request;
  }

  [SymbolFor("Deno.privateCustomInspect")](inspect, inspectOptions) {
    return inspect(
      createFilteredInspectProxy({
        object: this,
        evaluate: ObjectPrototypeIsPrototypeOf(RequestPrototype, this),
        keys: [
          "bodyUsed",
          "headers",
          "method",
          "redirect",
          "url",
        ],
      }),
      inspectOptions,
    );
  }
}

webidl.configureInterface(Request);
const RequestPrototype = Request.prototype;
mixinBody(RequestPrototype, _body, _mimeType);

webidl.converters["Request"] = webidl.createInterfaceConverter(
  "Request",
  RequestPrototype,
);
webidl.converters["RequestInfo_DOMString"] = (V, prefix, context, opts) => {
  // Union for (Request or USVString)
  if (typeof V == "object") {
    if (ObjectPrototypeIsPrototypeOf(RequestPrototype, V)) {
      return webidl.converters["Request"](V, prefix, context, opts);
    }
  }
  // Passed to new URL(...) which implicitly converts DOMString -> USVString
  return webidl.converters["DOMString"](V, prefix, context, opts);
};
webidl.converters["RequestRedirect"] = webidl.createEnumConverter(
  "RequestRedirect",
  [
    "follow",
    "error",
    "manual",
  ],
);
webidl.converters["RequestInit"] = webidl.createDictionaryConverter(
  "RequestInit",
  [
    { key: "method", converter: webidl.converters["ByteString"] },
    { key: "headers", converter: webidl.converters["HeadersInit"] },
    {
      key: "body",
      converter: webidl.createNullableConverter(
        webidl.converters["BodyInit_DOMString"],
      ),
    },
    { key: "redirect", converter: webidl.converters["RequestRedirect"] },
    {
      key: "signal",
      converter: webidl.createNullableConverter(
        webidl.converters["AbortSignal"],
      ),
    },
    { key: "client", converter: webidl.converters.any },
  ],
);

/**
 * @param {Request} request
 * @returns {InnerRequest}
 */
function toInnerRequest(request) {
  return request[_request];
}

/**
 * @param {InnerRequest} inner
 * @param {"request" | "immutable" | "request-no-cors" | "response" | "none"} guard
 * @returns {Request}
 */
function fromInnerRequest(inner, guard) {
  const request = new Request(_brand);
  request[_request] = inner;
  request[_getHeaders] = () => headersFromHeaderList(inner.headerList, guard);
  return request;
}

const signalAbortError = new DOMException(
  "The request has been cancelled.",
  "AbortError",
);
ObjectFreeze(signalAbortError);

function abortRequest(request) {
  if (request[_signalCache] !== undefined) {
    request[_signal][signalAbort](signalAbortError);
  } else {
    request[_signalCache] = false;
  }
}

function getCachedAbortSignal(request) {
  return request[_signalCache];
}

// For testing
internals.getCachedAbortSignal = getCachedAbortSignal;

export {
  abortRequest,
  fromInnerRequest,
  newInnerRequest,
  processUrlList,
  Request,
  RequestPrototype,
  toInnerRequest,
};
