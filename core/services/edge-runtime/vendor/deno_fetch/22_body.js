// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// @ts-check
/// <reference path="../webidl/internal.d.ts" />
/// <reference path="../url/internal.d.ts" />
/// <reference path="../url/lib.deno_url.d.ts" />
/// <reference path="../web/internal.d.ts" />
/// <reference path="../web/lib.deno_web.d.ts" />
/// <reference path="./internal.d.ts" />
/// <reference path="../web/06_streams_types.d.ts" />
/// <reference path="./lib.deno_fetch.d.ts" />
/// <reference lib="esnext" />

import { core, primordials } from "ext:core/mod.js";
const {
  isAnyArrayBuffer,
  isArrayBuffer,
  isStringObject,
} = core;
const {
  ArrayBufferIsView,
  ArrayPrototypeMap,
  DataViewPrototypeGetBuffer,
  DataViewPrototypeGetByteLength,
  DataViewPrototypeGetByteOffset,
  JSONParse,
  ObjectDefineProperties,
  ObjectPrototypeIsPrototypeOf,
  TypedArrayPrototypeGetBuffer,
  TypedArrayPrototypeGetByteLength,
  TypedArrayPrototypeGetByteOffset,
  TypedArrayPrototypeGetSymbolToStringTag,
  TypedArrayPrototypeSlice,
  TypeError,
  Uint8Array,
} = primordials;

import * as webidl from "ext:deno_webidl/00_webidl.js";
import {
  parseUrlEncoded,
  URLSearchParamsPrototype,
} from "ext:deno_url/00_url.js";
import {
  formDataFromEntries,
  FormDataPrototype,
  formDataToBlob,
  parseFormData,
} from "ext:deno_fetch/21_formdata.js";
import * as mimesniff from "ext:deno_web/01_mimesniff.js";
import { BlobPrototype } from "ext:deno_web/09_file.js";
import {
  createProxy,
  errorReadableStream,
  isReadableStreamDisturbed,
  readableStreamClose,
  readableStreamCollectIntoUint8Array,
  readableStreamDisturb,
  ReadableStreamPrototype,
  readableStreamTee,
  readableStreamThrowIfErrored,
} from "ext:deno_web/06_streams.js";

/**
 * @param {Uint8Array | string} chunk
 * @returns {Uint8Array}
 */
function chunkToU8(chunk) {
  return typeof chunk === "string" ? core.encode(chunk) : chunk;
}

/**
 * @param {Uint8Array | string} chunk
 * @returns {string}
 */
function chunkToString(chunk) {
  return typeof chunk === "string" ? chunk : core.decode(chunk);
}

class InnerBody {
  /**
   * @param {ReadableStream<Uint8Array> | { body: Uint8Array | string, consumed: boolean }} stream
   */
  constructor(stream) {
    /** @type {ReadableStream<Uint8Array> | { body: Uint8Array | string, consumed: boolean }} */
    this.streamOrStatic = stream ??
      { body: new Uint8Array(), consumed: false };
    /** @type {null | Uint8Array | string | Blob | FormData} */
    this.source = null;
    /** @type {null | number} */
    this.length = null;
  }

  get stream() {
    if (
      !ObjectPrototypeIsPrototypeOf(
        ReadableStreamPrototype,
        this.streamOrStatic,
      )
    ) {
      const { body, consumed } = this.streamOrStatic;
      if (consumed) {
        this.streamOrStatic = new ReadableStream();
        this.streamOrStatic.getReader();
        readableStreamDisturb(this.streamOrStatic);
        readableStreamClose(this.streamOrStatic);
      } else {
        this.streamOrStatic = new ReadableStream({
          start(controller) {
            controller.enqueue(chunkToU8(body));
            controller.close();
          },
        });
      }
    }
    return this.streamOrStatic;
  }

  /**
   * https://fetch.spec.whatwg.org/#body-unusable
   * @returns {boolean}
   */
  unusable() {
    if (
      ObjectPrototypeIsPrototypeOf(
        ReadableStreamPrototype,
        this.streamOrStatic,
      )
    ) {
      return this.streamOrStatic.locked ||
        isReadableStreamDisturbed(this.streamOrStatic);
    }
    return this.streamOrStatic.consumed;
  }

  /**
   * @returns {boolean}
   */
  consumed() {
    if (
      ObjectPrototypeIsPrototypeOf(
        ReadableStreamPrototype,
        this.streamOrStatic,
      )
    ) {
      return isReadableStreamDisturbed(this.streamOrStatic);
    }
    return this.streamOrStatic.consumed;
  }

  /**
   * https://fetch.spec.whatwg.org/#concept-body-consume-body
   * @returns {Promise<Uint8Array>}
   */
  consume() {
    if (this.unusable()) throw new TypeError("Body already consumed");
    if (
      ObjectPrototypeIsPrototypeOf(
        ReadableStreamPrototype,
        this.streamOrStatic,
      )
    ) {
      readableStreamThrowIfErrored(this.stream);
      return readableStreamCollectIntoUint8Array(this.stream);
    } else {
      this.streamOrStatic.consumed = true;
      return this.streamOrStatic.body;
    }
  }

  cancel(error) {
    if (
      ObjectPrototypeIsPrototypeOf(
        ReadableStreamPrototype,
        this.streamOrStatic,
      )
    ) {
      this.streamOrStatic.cancel(error);
    } else {
      this.streamOrStatic.consumed = true;
    }
  }

  error(error) {
    if (
      ObjectPrototypeIsPrototypeOf(
        ReadableStreamPrototype,
        this.streamOrStatic,
      )
    ) {
      errorReadableStream(this.streamOrStatic, error);
    } else {
      this.streamOrStatic.consumed = true;
    }
  }

  /**
   * @returns {InnerBody}
   */
  clone() {
    let second;
    if (
      !ObjectPrototypeIsPrototypeOf(
        ReadableStreamPrototype,
        this.streamOrStatic,
      ) && !this.streamOrStatic.consumed
    ) {
      second = new InnerBody({
        body: this.streamOrStatic.body,
        consumed: false,
      });
    } else {
      const { 0: out1, 1: out2 } = readableStreamTee(this.stream, true);
      this.streamOrStatic = out1;
      second = new InnerBody(out2);
    }
    second.source = this.source;
    second.length = this.length;
    return second;
  }

  /**
   * @returns {InnerBody}
   */
  createProxy() {
    let proxyStreamOrStatic;
    if (
      ObjectPrototypeIsPrototypeOf(
        ReadableStreamPrototype,
        this.streamOrStatic,
      )
    ) {
      proxyStreamOrStatic = createProxy(this.streamOrStatic);
    } else {
      proxyStreamOrStatic = { ...this.streamOrStatic };
      this.streamOrStatic.consumed = true;
    }
    const proxy = new InnerBody(proxyStreamOrStatic);
    proxy.source = this.source;
    proxy.length = this.length;
    return proxy;
  }
}

/**
 * @param {any} prototype
 * @param {symbol} bodySymbol
 * @param {symbol} mimeTypeSymbol
 * @returns {void}
 */
function mixinBody(prototype, bodySymbol, mimeTypeSymbol) {
  async function consumeBody(object, type) {
    webidl.assertBranded(object, prototype);

    const body = object[bodySymbol] !== null
      ? await object[bodySymbol].consume()
      : new Uint8Array();

    const mimeType = type === "Blob" || type === "FormData"
      ? object[mimeTypeSymbol]
      : null;
    return packageData(body, type, mimeType);
  }

  /** @type {PropertyDescriptorMap} */
  const mixin = {
    body: {
      __proto__: null,
      /**
       * @returns {ReadableStream<Uint8Array> | null}
       */
      get() {
        webidl.assertBranded(this, prototype);
        if (this[bodySymbol] === null) {
          return null;
        } else {
          return this[bodySymbol].stream;
        }
      },
      configurable: true,
      enumerable: true,
    },
    bodyUsed: {
      __proto__: null,
      /**
       * @returns {boolean}
       */
      get() {
        webidl.assertBranded(this, prototype);
        try {
          if (this[bodySymbol] !== null) {
            return this[bodySymbol].consumed();
          }
        } catch (_) {
          // Request is closed.
          return true;
        }
        return false;
      },
      configurable: true,
      enumerable: true,
    },
    arrayBuffer: {
      __proto__: null,
      /** @returns {Promise<ArrayBuffer>} */
      value: function arrayBuffer() {
        return consumeBody(this, "ArrayBuffer");
      },
      writable: true,
      configurable: true,
      enumerable: true,
    },
    blob: {
      __proto__: null,
      /** @returns {Promise<Blob>} */
      value: function blob() {
        return consumeBody(this, "Blob");
      },
      writable: true,
      configurable: true,
      enumerable: true,
    },
    bytes: {
      __proto__: null,
      /** @returns {Promise<Uint8Array>} */
      value: function bytes() {
        return consumeBody(this, "bytes");
      },
      writable: true,
      configurable: true,
      enumerable: true,
    },
    formData: {
      __proto__: null,
      /** @returns {Promise<FormData>} */
      value: function formData() {
        return consumeBody(this, "FormData");
      },
      writable: true,
      configurable: true,
      enumerable: true,
    },
    json: {
      __proto__: null,
      /** @returns {Promise<any>} */
      value: function json() {
        return consumeBody(this, "JSON");
      },
      writable: true,
      configurable: true,
      enumerable: true,
    },
    text: {
      __proto__: null,
      /** @returns {Promise<string>} */
      value: function text() {
        return consumeBody(this, "text");
      },
      writable: true,
      configurable: true,
      enumerable: true,
    },
  };
  return ObjectDefineProperties(prototype, mixin);
}

/**
 * https://fetch.spec.whatwg.org/#concept-body-package-data
 * @param {Uint8Array | string} bytes
 * @param {"ArrayBuffer" | "Blob" | "FormData" | "JSON" | "text" | "bytes"} type
 * @param {MimeType | null} [mimeType]
 */
function packageData(bytes, type, mimeType) {
  switch (type) {
    case "ArrayBuffer":
      return TypedArrayPrototypeGetBuffer(chunkToU8(bytes));
    case "Blob":
      return new Blob([bytes], {
        type: mimeType !== null ? mimesniff.serializeMimeType(mimeType) : "",
      });
    case "bytes":
      return chunkToU8(bytes);
    case "FormData": {
      if (mimeType !== null) {
        const essence = mimesniff.essence(mimeType);
        if (essence === "multipart/form-data") {
          const boundary = mimeType.parameters.get("boundary");
          if (boundary === null) {
            throw new TypeError(
              "Cannot turn into form data: missing boundary parameter in mime type of multipart form data",
            );
          }
          return parseFormData(chunkToU8(bytes), boundary);
        } else if (essence === "application/x-www-form-urlencoded") {
          // TODO(@AaronO): pass as-is with StringOrBuffer in op-layer
          const entries = parseUrlEncoded(chunkToU8(bytes));
          return formDataFromEntries(
            ArrayPrototypeMap(
              entries,
              (x) => ({ name: x[0], value: x[1] }),
            ),
          );
        }
        throw new TypeError("Body can not be decoded as form data");
      }
      throw new TypeError("Missing content type");
    }
    case "JSON":
      return JSONParse(chunkToString(bytes));
    case "text":
      return chunkToString(bytes);
  }
}

/**
 * @param {BodyInit} object
 * @returns {{body: InnerBody, contentType: string | null}}
 */
function extractBody(object) {
  /** @type {ReadableStream<Uint8Array> | { body: Uint8Array | string, consumed: boolean }} */
  let stream;
  let source = null;
  let length = null;
  let contentType = null;
  if (typeof object === "string") {
    source = object;
    contentType = "text/plain;charset=UTF-8";
  } else if (ObjectPrototypeIsPrototypeOf(BlobPrototype, object)) {
    stream = object.stream();
    source = object;
    length = object.size;
    if (object.type.length !== 0) {
      contentType = object.type;
    }
  } else if (ArrayBufferIsView(object)) {
    const tag = TypedArrayPrototypeGetSymbolToStringTag(object);
    if (tag !== undefined) {
      // TypedArray
      if (tag !== "Uint8Array") {
        // TypedArray, unless it's Uint8Array
        object = new Uint8Array(
          TypedArrayPrototypeGetBuffer(/** @type {Uint8Array} */ (object)),
          TypedArrayPrototypeGetByteOffset(/** @type {Uint8Array} */ (object)),
          TypedArrayPrototypeGetByteLength(/** @type {Uint8Array} */ (object)),
        );
      }
    } else {
      // DataView
      object = new Uint8Array(
        DataViewPrototypeGetBuffer(/** @type {DataView} */ (object)),
        DataViewPrototypeGetByteOffset(/** @type {DataView} */ (object)),
        DataViewPrototypeGetByteLength(/** @type {DataView} */ (object)),
      );
    }
    source = TypedArrayPrototypeSlice(object);
  } else if (isArrayBuffer(object)) {
    source = TypedArrayPrototypeSlice(new Uint8Array(object));
  } else if (ObjectPrototypeIsPrototypeOf(FormDataPrototype, object)) {
    const res = formDataToBlob(object);
    stream = res.stream();
    source = res;
    length = res.size;
    contentType = res.type;
  } else if (
    ObjectPrototypeIsPrototypeOf(URLSearchParamsPrototype, object)
  ) {
    // TODO(@satyarohith): not sure what primordial here.
    // deno-lint-ignore prefer-primordials
    source = object.toString();
    contentType = "application/x-www-form-urlencoded;charset=UTF-8";
  } else if (ObjectPrototypeIsPrototypeOf(ReadableStreamPrototype, object)) {
    stream = object;
    if (object.locked || isReadableStreamDisturbed(object)) {
      throw new TypeError("ReadableStream is locked or disturbed");
    }
  } else if (object[webidl.AsyncIterable] === webidl.AsyncIterable) {
    stream = ReadableStream.from(object.open());
  }
  if (typeof source === "string") {
    // WARNING: this deviates from spec (expects length to be set)
    // https://fetch.spec.whatwg.org/#bodyinit > 7.
    // no observable side-effect for users so far, but could change
    stream = { body: source, consumed: false };
    length = null; // NOTE: string length != byte length
  } else if (TypedArrayPrototypeGetSymbolToStringTag(source) === "Uint8Array") {
    stream = { body: source, consumed: false };
    length = TypedArrayPrototypeGetByteLength(source);
  }
  const body = new InnerBody(stream);
  body.source = source;
  body.length = length;
  return { body, contentType };
}

webidl.converters["async iterable<Uint8Array>"] = webidl
  .createAsyncIterableConverter(webidl.converters.Uint8Array);

webidl.converters["BodyInit_DOMString"] = (V, prefix, context, opts) => {
  // Union for (ReadableStream or Blob or ArrayBufferView or ArrayBuffer or FormData or URLSearchParams or USVString)
  if (ObjectPrototypeIsPrototypeOf(ReadableStreamPrototype, V)) {
    return webidl.converters["ReadableStream"](V, prefix, context, opts);
  } else if (ObjectPrototypeIsPrototypeOf(BlobPrototype, V)) {
    return webidl.converters["Blob"](V, prefix, context, opts);
  } else if (ObjectPrototypeIsPrototypeOf(FormDataPrototype, V)) {
    return webidl.converters["FormData"](V, prefix, context, opts);
  } else if (ObjectPrototypeIsPrototypeOf(URLSearchParamsPrototype, V)) {
    return webidl.converters["URLSearchParams"](V, prefix, context, opts);
  }
  if (typeof V === "object") {
    if (isAnyArrayBuffer(V)) {
      return webidl.converters["ArrayBuffer"](V, prefix, context, opts);
    }
    if (ArrayBufferIsView(V)) {
      return webidl.converters["ArrayBufferView"](V, prefix, context, opts);
    }
    if (webidl.isAsyncIterable(V) && !isStringObject(V)) {
      return webidl.converters["async iterable<Uint8Array>"](
        V,
        prefix,
        context,
        opts,
      );
    }
  }
  // BodyInit conversion is passed to extractBody(), which calls core.encode().
  // core.encode() will UTF-8 encode strings with replacement, being equivalent to the USV normalization.
  // Therefore we can convert to DOMString instead of USVString and avoid a costly redundant conversion.
  return webidl.converters["DOMString"](V, prefix, context, opts);
};
webidl.converters["BodyInit_DOMString?"] = webidl.createNullableConverter(
  webidl.converters["BodyInit_DOMString"],
);

export { extractBody, InnerBody, mixinBody };
