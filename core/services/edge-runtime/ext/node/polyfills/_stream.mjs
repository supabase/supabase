// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// deno-fmt-ignore-file
// deno-lint-ignore-file
import { nextTick } from "ext:deno_node/_next_tick.ts";
import { EventEmitter as EE } from "ext:deno_node/_events.mjs";
import { AbortController } from "ext:deno_web/03_abort_signal.js";
import { Blob } from "ext:deno_web/09_file.js";
import { StringDecoder } from "node:string_decoder";
import {
  createDeferredPromise,
  kEmptyObject,
  normalizeEncoding,
  once,
  promisify,
} from "ext:deno_node/internal/util.mjs";
import {
  isArrayBufferView,
  isAsyncFunction,
} from "ext:deno_node/internal/util/types.ts";
import { debuglog } from "ext:deno_node/internal/util/debuglog.ts";
import { inspect } from "ext:deno_node/internal/util/inspect.mjs";

import {
  AbortError,
  aggregateTwoErrors,
  ERR_INVALID_ARG_TYPE,
  ERR_INVALID_ARG_VALUE,
  ERR_INVALID_RETURN_VALUE,
  ERR_METHOD_NOT_IMPLEMENTED,
  ERR_MISSING_ARGS,
  ERR_MULTIPLE_CALLBACK,
  ERR_OUT_OF_RANGE,
  ERR_SOCKET_BAD_PORT,
  ERR_STREAM_ALREADY_FINISHED,
  ERR_STREAM_CANNOT_PIPE,
  ERR_STREAM_DESTROYED,
  ERR_STREAM_NULL_VALUES,
  ERR_STREAM_PREMATURE_CLOSE,
  ERR_STREAM_PUSH_AFTER_EOF,
  ERR_STREAM_UNSHIFT_AFTER_END_EVENT,
  ERR_STREAM_WRITE_AFTER_END,
  ERR_UNKNOWN_ENCODING,
  ERR_UNKNOWN_SIGNAL,
  hideStackFrames,
} from "ext:deno_node/internal/errors.ts";

/* esm.sh - esbuild bundle(readable-stream@4.2.0) es2022 production */
// generated with
// $ esbuild --bundle --legal-comments=none --target=es2022 --tree-shaking=true --format=esm .
// ... then making sure the file uses the existing ext:deno_node stuff instead of bundling it
import __process$ from "node:process";
import __buffer$ from "node:buffer";
import __string_decoder$ from "node:string_decoder";
import __events$ from "node:events";

var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) =>
  function __require() {
    return mod ||
      (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod),
      mod.exports;
  };

// node_modules/buffer/index.js
var require_buffer = () => {
  return __buffer$;
};

// lib/ours/errors.js
var require_primordials = __commonJS({
  "lib/ours/primordials.js"(exports2, module2) {
    "use strict";
    module2.exports = {
      ArrayIsArray(self2) {
        return Array.isArray(self2);
      },
      ArrayPrototypeIncludes(self2, el) {
        return self2.includes(el);
      },
      ArrayPrototypeIndexOf(self2, el) {
        return self2.indexOf(el);
      },
      ArrayPrototypeJoin(self2, sep) {
        return self2.join(sep);
      },
      ArrayPrototypeMap(self2, fn) {
        return self2.map(fn);
      },
      ArrayPrototypePop(self2, el) {
        return self2.pop(el);
      },
      ArrayPrototypePush(self2, el) {
        return self2.push(el);
      },
      ArrayPrototypeSlice(self2, start, end) {
        return self2.slice(start, end);
      },
      Error,
      FunctionPrototypeCall(fn, thisArgs, ...args) {
        return fn.call(thisArgs, ...args);
      },
      FunctionPrototypeSymbolHasInstance(self2, instance) {
        return Function.prototype[Symbol.hasInstance].call(self2, instance);
      },
      MathFloor: Math.floor,
      Number,
      NumberIsInteger: Number.isInteger,
      NumberIsNaN: Number.isNaN,
      NumberMAX_SAFE_INTEGER: Number.MAX_SAFE_INTEGER,
      NumberMIN_SAFE_INTEGER: Number.MIN_SAFE_INTEGER,
      NumberParseInt: Number.parseInt,
      ObjectDefineProperties(self2, props) {
        return Object.defineProperties(self2, props);
      },
      ObjectDefineProperty(self2, name, prop) {
        return Object.defineProperty(self2, name, prop);
      },
      ObjectGetOwnPropertyDescriptor(self2, name) {
        return Object.getOwnPropertyDescriptor(self2, name);
      },
      ObjectKeys(obj) {
        return Object.keys(obj);
      },
      ObjectSetPrototypeOf(target, proto) {
        return Object.setPrototypeOf(target, proto);
      },
      Promise,
      PromisePrototypeCatch(self2, fn) {
        return self2.catch(fn);
      },
      PromisePrototypeThen(self2, thenFn, catchFn) {
        return self2.then(thenFn, catchFn);
      },
      PromiseReject(err) {
        return Promise.reject(err);
      },
      ReflectApply: Reflect.apply,
      RegExpPrototypeTest(self2, value) {
        return self2.test(value);
      },
      SafeSet: Set,
      String,
      StringPrototypeSlice(self2, start, end) {
        return self2.slice(start, end);
      },
      StringPrototypeToLowerCase(self2) {
        return self2.toLowerCase();
      },
      StringPrototypeToUpperCase(self2) {
        return self2.toUpperCase();
      },
      StringPrototypeTrim(self2) {
        return self2.trim();
      },
      Symbol,
      SymbolAsyncIterator: Symbol.asyncIterator,
      SymbolHasInstance: Symbol.hasInstance,
      SymbolIterator: Symbol.iterator,
      TypedArrayPrototypeSet(self2, buf, len) {
        return self2.set(buf, len);
      },
      Uint8Array,
    };
  },
});

// lib/internal/validators.js
var require_validators = __commonJS({
  "lib/internal/validators.js"(exports, module) {
    "use strict";
    var {
      ArrayIsArray,
      ArrayPrototypeIncludes,
      ArrayPrototypeJoin,
      ArrayPrototypeMap,
      NumberIsInteger,
      NumberIsNaN,
      NumberMAX_SAFE_INTEGER,
      NumberMIN_SAFE_INTEGER,
      NumberParseInt,
      ObjectPrototypeHasOwnProperty,
      RegExpPrototypeExec,
      String: String2,
      StringPrototypeToUpperCase,
      StringPrototypeTrim,
    } = require_primordials();
    var signals = {};
    function isInt32(value) {
      return value === (value | 0);
    }
    function isUint32(value) {
      return value === value >>> 0;
    }
    var octalReg = /^[0-7]+$/;
    var modeDesc = "must be a 32-bit unsigned integer or an octal string";
    function parseFileMode(value, name, def) {
      if (typeof value === "undefined") {
        value = def;
      }
      if (typeof value === "string") {
        if (RegExpPrototypeExec(octalReg, value) === null) {
          throw new ERR_INVALID_ARG_VALUE(name, value, modeDesc);
        }
        value = NumberParseInt(value, 8);
      }
      validateUint32(value, name);
      return value;
    }
    var validateInteger = hideStackFrames(
      (
        value,
        name,
        min = NumberMIN_SAFE_INTEGER,
        max = NumberMAX_SAFE_INTEGER,
      ) => {
        if (typeof value !== "number") {
          throw new ERR_INVALID_ARG_TYPE(name, "number", value);
        }
        if (!NumberIsInteger(value)) {
          throw new ERR_OUT_OF_RANGE(name, "an integer", value);
        }
        if (value < min || value > max) {
          throw new ERR_OUT_OF_RANGE(name, `>= ${min} && <= ${max}`, value);
        }
      },
    );
    var validateInt32 = hideStackFrames(
      (value, name, min = -2147483648, max = 2147483647) => {
        if (typeof value !== "number") {
          throw new ERR_INVALID_ARG_TYPE(name, "number", value);
        }
        if (!NumberIsInteger(value)) {
          throw new ERR_OUT_OF_RANGE(name, "an integer", value);
        }
        if (value < min || value > max) {
          throw new ERR_OUT_OF_RANGE(name, `>= ${min} && <= ${max}`, value);
        }
      },
    );
    var validateUint32 = hideStackFrames((value, name, positive = false) => {
      if (typeof value !== "number") {
        throw new ERR_INVALID_ARG_TYPE(name, "number", value);
      }
      if (!NumberIsInteger(value)) {
        throw new ERR_OUT_OF_RANGE(name, "an integer", value);
      }
      const min = positive ? 1 : 0;
      const max = 4294967295;
      if (value < min || value > max) {
        throw new ERR_OUT_OF_RANGE(name, `>= ${min} && <= ${max}`, value);
      }
    });
    function validateString(value, name) {
      if (typeof value !== "string") {
        throw new ERR_INVALID_ARG_TYPE(name, "string", value);
      }
    }
    function validateNumber(value, name, min = void 0, max) {
      if (typeof value !== "number") {
        throw new ERR_INVALID_ARG_TYPE(name, "number", value);
      }
      if (
        min != null && value < min || max != null && value > max ||
        (min != null || max != null) && NumberIsNaN(value)
      ) {
        throw new ERR_OUT_OF_RANGE(
          name,
          `${min != null ? `>= ${min}` : ""}${min != null && max != null ? " && " : ""
          }${max != null ? `<= ${max}` : ""}`,
          value,
        );
      }
    }
    var validateOneOf = hideStackFrames((value, name, oneOf) => {
      if (!ArrayPrototypeIncludes(oneOf, value)) {
        const allowed = ArrayPrototypeJoin(
          ArrayPrototypeMap(
            oneOf,
            (v) => typeof v === "string" ? `'${v}'` : String2(v),
          ),
          ", ",
        );
        const reason = "must be one of: " + allowed;
        throw new ERR_INVALID_ARG_VALUE(name, value, reason);
      }
    });
    function validateBoolean(value, name) {
      if (typeof value !== "boolean") {
        throw new ERR_INVALID_ARG_TYPE(name, "boolean", value);
      }
    }
    function getOwnPropertyValueOrDefault(options, key, defaultValue) {
      return options == null || !ObjectPrototypeHasOwnProperty(options, key)
        ? defaultValue
        : options[key];
    }
    var validateObject = hideStackFrames((value, name, options = null) => {
      const allowArray = getOwnPropertyValueOrDefault(
        options,
        "allowArray",
        false,
      );
      const allowFunction = getOwnPropertyValueOrDefault(
        options,
        "allowFunction",
        false,
      );
      const nullable = getOwnPropertyValueOrDefault(options, "nullable", false);
      if (
        !nullable && value === null || !allowArray && ArrayIsArray(value) ||
        typeof value !== "object" &&
        (!allowFunction || typeof value !== "function")
      ) {
        throw new ERR_INVALID_ARG_TYPE(name, "Object", value);
      }
    });
    var validateArray = hideStackFrames((value, name, minLength = 0) => {
      if (!ArrayIsArray(value)) {
        throw new ERR_INVALID_ARG_TYPE(name, "Array", value);
      }
      if (value.length < minLength) {
        const reason = `must be longer than ${minLength}`;
        throw new ERR_INVALID_ARG_VALUE(name, value, reason);
      }
    });
    function validateSignalName(signal, name = "signal") {
      validateString(signal, name);
      if (signals[signal] === void 0) {
        if (signals[StringPrototypeToUpperCase(signal)] !== void 0) {
          throw new ERR_UNKNOWN_SIGNAL(
            signal + " (signals must use all capital letters)",
          );
        }
        throw new ERR_UNKNOWN_SIGNAL(signal);
      }
    }
    var validateBuffer = hideStackFrames((buffer, name = "buffer") => {
      if (!isArrayBufferView(buffer)) {
        throw new ERR_INVALID_ARG_TYPE(name, [
          "Buffer",
          "TypedArray",
          "DataView",
        ], buffer);
      }
    });
    function validateEncoding(data, encoding) {
      const normalizedEncoding = normalizeEncoding(encoding);
      const length = data.length;
      if (normalizedEncoding === "hex" && length % 2 !== 0) {
        throw new ERR_INVALID_ARG_VALUE(
          "encoding",
          encoding,
          `is invalid for data of length ${length}`,
        );
      }
    }
    function validatePort(port, name = "Port", allowZero = true) {
      if (
        typeof port !== "number" && typeof port !== "string" ||
        typeof port === "string" && StringPrototypeTrim(port).length === 0 ||
        +port !== +port >>> 0 || port > 65535 || port === 0 && !allowZero
      ) {
        throw new ERR_SOCKET_BAD_PORT(name, port, allowZero);
      }
      return port | 0;
    }
    var validateAbortSignal = hideStackFrames((signal, name) => {
      if (
        signal !== void 0 &&
        (signal === null || typeof signal !== "object" ||
          !("aborted" in signal))
      ) {
        throw new ERR_INVALID_ARG_TYPE(name, "AbortSignal", signal);
      }
    });
    var validateFunction = hideStackFrames((value, name) => {
      if (typeof value !== "function") {
        throw new ERR_INVALID_ARG_TYPE(name, "Function", value);
      }
    });
    var validatePlainFunction = hideStackFrames((value, name) => {
      if (typeof value !== "function" || isAsyncFunction(value)) {
        throw new ERR_INVALID_ARG_TYPE(name, "Function", value);
      }
    });
    var validateUndefined = hideStackFrames((value, name) => {
      if (value !== void 0) {
        throw new ERR_INVALID_ARG_TYPE(name, "undefined", value);
      }
    });
    function validateUnion(value, name, union) {
      if (!ArrayPrototypeIncludes(union, value)) {
        throw new ERR_INVALID_ARG_TYPE(
          name,
          `('${ArrayPrototypeJoin(union, "|")}')`,
          value,
        );
      }
    }
    module.exports = {
      isInt32,
      isUint32,
      parseFileMode,
      validateArray,
      validateBoolean,
      validateBuffer,
      validateEncoding,
      validateFunction,
      validateInt32,
      validateInteger,
      validateNumber,
      validateObject,
      validateOneOf,
      validatePlainFunction,
      validatePort,
      validateSignalName,
      validateString,
      validateUint32,
      validateUndefined,
      validateUnion,
      validateAbortSignal,
    };
  },
});

// node_modules/process/browser.js
var require_browser2 = () => {
  return __process$;
};

// lib/internal/streams/utils.js
var require_utils = __commonJS({
  "lib/internal/streams/utils.js"(exports, module) {
    "use strict";
    var { Symbol: Symbol2, SymbolAsyncIterator, SymbolIterator } =
      require_primordials();
    var kDestroyed = Symbol2("kDestroyed");
    var kIsErrored = Symbol2("kIsErrored");
    var kIsReadable = Symbol2("kIsReadable");
    var kIsDisturbed = Symbol2("kIsDisturbed");
    function isReadableNodeStream(obj, strict = false) {
      var _obj$_readableState;
      return !!(obj && typeof obj.pipe === "function" &&
        typeof obj.on === "function" &&
        (!strict ||
          typeof obj.pause === "function" &&
          typeof obj.resume === "function") &&
        (!obj._writableState ||
          ((_obj$_readableState = obj._readableState) === null ||
            _obj$_readableState === void 0
            ? void 0
            : _obj$_readableState.readable) !== false) && // Duplex
        (!obj._writableState || obj._readableState));
    }
    function isWritableNodeStream(obj) {
      var _obj$_writableState;
      return !!(obj && typeof obj.write === "function" &&
        typeof obj.on === "function" &&
        (!obj._readableState ||
          ((_obj$_writableState = obj._writableState) === null ||
            _obj$_writableState === void 0
            ? void 0
            : _obj$_writableState.writable) !== false));
    }
    function isDuplexNodeStream(obj) {
      return !!(obj && typeof obj.pipe === "function" && obj._readableState &&
        typeof obj.on === "function" && typeof obj.write === "function");
    }
    function isNodeStream(obj) {
      return obj &&
        (obj._readableState || obj._writableState ||
          typeof obj.write === "function" && typeof obj.on === "function" ||
          typeof obj.pipe === "function" && typeof obj.on === "function");
    }
    function isIterable(obj, isAsync) {
      if (obj == null) {
        return false;
      }
      if (isAsync === true) {
        return typeof obj[SymbolAsyncIterator] === "function";
      }
      if (isAsync === false) {
        return typeof obj[SymbolIterator] === "function";
      }
      return typeof obj[SymbolAsyncIterator] === "function" ||
        typeof obj[SymbolIterator] === "function";
    }
    function isDestroyed(stream) {
      if (!isNodeStream(stream)) {
        return null;
      }
      const wState = stream._writableState;
      const rState = stream._readableState;
      const state = wState || rState;
      return !!(stream.destroyed || stream[kDestroyed] ||
        state !== null && state !== void 0 && state.destroyed);
    }
    function isWritableEnded(stream) {
      if (!isWritableNodeStream(stream)) {
        return null;
      }
      if (stream.writableEnded === true) {
        return true;
      }
      const wState = stream._writableState;
      if (wState !== null && wState !== void 0 && wState.errored) {
        return false;
      }
      if (
        typeof (wState === null || wState === void 0
          ? void 0
          : wState.ended) !== "boolean"
      ) {
        return null;
      }
      return wState.ended;
    }
    function isWritableFinished(stream, strict) {
      if (!isWritableNodeStream(stream)) {
        return null;
      }
      if (stream.writableFinished === true) {
        return true;
      }
      const wState = stream._writableState;
      if (wState !== null && wState !== void 0 && wState.errored) {
        return false;
      }
      if (
        typeof (wState === null || wState === void 0
          ? void 0
          : wState.finished) !== "boolean"
      ) {
        return null;
      }
      return !!(wState.finished ||
        strict === false && wState.ended === true && wState.length === 0);
    }
    function isReadableEnded(stream) {
      if (!isReadableNodeStream(stream)) {
        return null;
      }
      if (stream.readableEnded === true) {
        return true;
      }
      const rState = stream._readableState;
      if (!rState || rState.errored) {
        return false;
      }
      if (
        typeof (rState === null || rState === void 0
          ? void 0
          : rState.ended) !== "boolean"
      ) {
        return null;
      }
      return rState.ended;
    }
    function isReadableFinished(stream, strict) {
      if (!isReadableNodeStream(stream)) {
        return null;
      }
      const rState = stream._readableState;
      if (rState !== null && rState !== void 0 && rState.errored) {
        return false;
      }
      if (
        typeof (rState === null || rState === void 0
          ? void 0
          : rState.endEmitted) !== "boolean"
      ) {
        return null;
      }
      return !!(rState.endEmitted ||
        strict === false && rState.ended === true && rState.length === 0);
    }
    function isReadable(stream) {
      if (stream && stream[kIsReadable] != null) {
        return stream[kIsReadable];
      }
      if (
        typeof (stream === null || stream === void 0
          ? void 0
          : stream.readable) !== "boolean"
      ) {
        return null;
      }
      if (isDestroyed(stream)) {
        return false;
      }
      return isReadableNodeStream(stream) && stream.readable &&
        !isReadableFinished(stream);
    }
    function isWritable(stream) {
      if (
        typeof (stream === null || stream === void 0
          ? void 0
          : stream.writable) !== "boolean"
      ) {
        return null;
      }
      if (isDestroyed(stream)) {
        return false;
      }
      return isWritableNodeStream(stream) && stream.writable &&
        !isWritableEnded(stream);
    }
    function isFinished(stream, opts) {
      if (!isNodeStream(stream)) {
        return null;
      }
      if (isDestroyed(stream)) {
        return true;
      }
      if (
        (opts === null || opts === void 0 ? void 0 : opts.readable) !== false &&
        isReadable(stream)
      ) {
        return false;
      }
      if (
        (opts === null || opts === void 0 ? void 0 : opts.writable) !== false &&
        isWritable(stream)
      ) {
        return false;
      }
      return true;
    }
    function isWritableErrored(stream) {
      var _stream$_writableStat, _stream$_writableStat2;
      if (!isNodeStream(stream)) {
        return null;
      }
      if (stream.writableErrored) {
        return stream.writableErrored;
      }
      return (_stream$_writableStat =
        (_stream$_writableStat2 = stream._writableState) === null ||
          _stream$_writableStat2 === void 0
          ? void 0
          : _stream$_writableStat2.errored) !== null &&
        _stream$_writableStat !== void 0
        ? _stream$_writableStat
        : null;
    }
    function isReadableErrored(stream) {
      var _stream$_readableStat, _stream$_readableStat2;
      if (!isNodeStream(stream)) {
        return null;
      }
      if (stream.readableErrored) {
        return stream.readableErrored;
      }
      return (_stream$_readableStat =
        (_stream$_readableStat2 = stream._readableState) === null ||
          _stream$_readableStat2 === void 0
          ? void 0
          : _stream$_readableStat2.errored) !== null &&
        _stream$_readableStat !== void 0
        ? _stream$_readableStat
        : null;
    }
    function isClosed(stream) {
      if (!isNodeStream(stream)) {
        return null;
      }
      if (typeof stream.closed === "boolean") {
        return stream.closed;
      }
      const wState = stream._writableState;
      const rState = stream._readableState;
      if (
        typeof (wState === null || wState === void 0
          ? void 0
          : wState.closed) === "boolean" ||
        typeof (rState === null || rState === void 0
          ? void 0
          : rState.closed) === "boolean"
      ) {
        return (wState === null || wState === void 0
          ? void 0
          : wState.closed) ||
          (rState === null || rState === void 0 ? void 0 : rState.closed);
      }
      if (typeof stream._closed === "boolean" && isOutgoingMessage(stream)) {
        return stream._closed;
      }
      return null;
    }
    function isOutgoingMessage(stream) {
      return typeof stream._closed === "boolean" &&
        typeof stream._defaultKeepAlive === "boolean" &&
        typeof stream._removedConnection === "boolean" &&
        typeof stream._removedContLen === "boolean";
    }
    function isServerResponse(stream) {
      return typeof stream._sent100 === "boolean" && isOutgoingMessage(stream);
    }
    function isServerRequest(stream) {
      var _stream$req;
      return typeof stream._consuming === "boolean" &&
        typeof stream._dumped === "boolean" &&
        ((_stream$req = stream.req) === null || _stream$req === void 0
          ? void 0
          : _stream$req.upgradeOrConnect) === void 0;
    }
    function willEmitClose(stream) {
      if (!isNodeStream(stream)) {
        return null;
      }
      const wState = stream._writableState;
      const rState = stream._readableState;
      const state = wState || rState;
      return !state && isServerResponse(stream) ||
        !!(state && state.autoDestroy && state.emitClose &&
          state.closed === false);
    }
    function isDisturbed(stream) {
      var _stream$kIsDisturbed;
      return !!(stream &&
        ((_stream$kIsDisturbed = stream[kIsDisturbed]) !== null &&
          _stream$kIsDisturbed !== void 0
          ? _stream$kIsDisturbed
          : stream.readableDidRead || stream.readableAborted));
    }
    function isErrored(stream) {
      var _ref,
        _ref2,
        _ref3,
        _ref4,
        _ref5,
        _stream$kIsErrored,
        _stream$_readableStat3,
        _stream$_writableStat3,
        _stream$_readableStat4,
        _stream$_writableStat4;
      return !!(stream &&
        ((_ref =
          (_ref2 =
            (_ref3 =
              (_ref4 =
                (_ref5 =
                  (_stream$kIsErrored =
                    stream[kIsErrored]) !== null &&
                    _stream$kIsErrored !== void 0
                    ? _stream$kIsErrored
                    : stream.readableErrored) !== null &&
                  _ref5 !== void 0
                  ? _ref5
                  : stream.writableErrored) !== null &&
                _ref4 !== void 0
                ? _ref4
                : (_stream$_readableStat3 =
                  stream._readableState) === null ||
                  _stream$_readableStat3 === void 0
                  ? void 0
                  : _stream$_readableStat3.errorEmitted) !== null &&
              _ref3 !== void 0
              ? _ref3
              : (_stream$_writableStat3 = stream._writableState) ===
                null || _stream$_writableStat3 === void 0
                ? void 0
                : _stream$_writableStat3.errorEmitted) !== null &&
            _ref2 !== void 0
            ? _ref2
            : (_stream$_readableStat4 = stream._readableState) === null ||
              _stream$_readableStat4 === void 0
              ? void 0
              : _stream$_readableStat4.errored) !== null && _ref !== void 0
          ? _ref
          : (_stream$_writableStat4 = stream._writableState) === null ||
            _stream$_writableStat4 === void 0
            ? void 0
            : _stream$_writableStat4.errored));
    }
    module.exports = {
      kDestroyed,
      isDisturbed,
      kIsDisturbed,
      isErrored,
      kIsErrored,
      isReadable,
      kIsReadable,
      isClosed,
      isDestroyed,
      isDuplexNodeStream,
      isFinished,
      isIterable,
      isReadableNodeStream,
      isReadableEnded,
      isReadableFinished,
      isReadableErrored,
      isNodeStream,
      isWritable,
      isWritableNodeStream,
      isWritableEnded,
      isWritableFinished,
      isWritableErrored,
      isServerRequest,
      isServerResponse,
      willEmitClose,
    };
  },
});

// lib/internal/streams/end-of-stream.js
var require_end_of_stream = __commonJS({
  "lib/internal/streams/end-of-stream.js"(exports, module) {
    var process = require_browser2();
    var { validateAbortSignal, validateFunction, validateObject } =
      require_validators();
    var { Promise: Promise2 } = require_primordials();
    var {
      isClosed,
      isReadable,
      isReadableNodeStream,
      isReadableFinished,
      isReadableErrored,
      isWritable,
      isWritableNodeStream,
      isWritableFinished,
      isWritableErrored,
      isNodeStream,
      willEmitClose: _willEmitClose,
    } = require_utils();
    function isRequest(stream) {
      return stream.setHeader && typeof stream.abort === "function";
    }
    var nop = () => {
    };
    function eos(stream, options, callback) {
      var _options$readable, _options$writable;
      if (arguments.length === 2) {
        callback = options;
        options = kEmptyObject;
      } else if (options == null) {
        options = kEmptyObject;
      } else {
        validateObject(options, "options");
      }
      validateFunction(callback, "callback");
      validateAbortSignal(options.signal, "options.signal");
      callback = once(callback);
      const readable = (_options$readable = options.readable) !== null &&
        _options$readable !== void 0
        ? _options$readable
        : isReadableNodeStream(stream);
      const writable = (_options$writable = options.writable) !== null &&
        _options$writable !== void 0
        ? _options$writable
        : isWritableNodeStream(stream);
      if (!isNodeStream(stream)) {
        throw new ERR_INVALID_ARG_TYPE("stream", "Stream", stream);
      }
      const wState = stream._writableState;
      const rState = stream._readableState;
      const onlegacyfinish = () => {
        if (!stream.writable) {
          onfinish();
        }
      };
      let willEmitClose = _willEmitClose(stream) &&
        isReadableNodeStream(stream) === readable &&
        isWritableNodeStream(stream) === writable;
      let writableFinished = isWritableFinished(stream, false);
      const onfinish = () => {
        writableFinished = true;
        if (stream.destroyed) {
          willEmitClose = false;
        }
        if (willEmitClose && (!stream.readable || readable)) {
          return;
        }
        if (!readable || readableFinished) {
          callback.call(stream);
        }
      };
      let readableFinished = isReadableFinished(stream, false);
      const onend = () => {
        readableFinished = true;
        if (stream.destroyed) {
          willEmitClose = false;
        }
        if (willEmitClose && (!stream.writable || writable)) {
          return;
        }
        if (!writable || writableFinished) {
          callback.call(stream);
        }
      };
      const onerror = (err) => {
        callback.call(stream, err);
      };
      let closed = isClosed(stream);
      const onclose = () => {
        closed = true;
        const errored = isWritableErrored(stream) || isReadableErrored(stream);
        if (errored && typeof errored !== "boolean") {
          return callback.call(stream, errored);
        }
        if (
          readable && !readableFinished && isReadableNodeStream(stream, true)
        ) {
          if (!isReadableFinished(stream, false)) {
            return callback.call(stream, new ERR_STREAM_PREMATURE_CLOSE());
          }
        }
        if (writable && !writableFinished) {
          if (!isWritableFinished(stream, false)) {
            return callback.call(stream, new ERR_STREAM_PREMATURE_CLOSE());
          }
        }
        callback.call(stream);
      };
      const onrequest = () => {
        stream.req.on("finish", onfinish);
      };
      if (isRequest(stream)) {
        stream.on("complete", onfinish);
        if (!willEmitClose) {
          stream.on("abort", onclose);
        }
        if (stream.req) {
          onrequest();
        } else {
          stream.on("request", onrequest);
        }
      } else if (writable && !wState) {
        stream.on("end", onlegacyfinish);
        stream.on("close", onlegacyfinish);
      }
      if (!willEmitClose && typeof stream.aborted === "boolean") {
        stream.on("aborted", onclose);
      }
      stream.on("end", onend);
      stream.on("finish", onfinish);
      if (options.error !== false) {
        stream.on("error", onerror);
      }
      stream.on("close", onclose);
      if (closed) {
        process.nextTick(onclose);
      } else if (
        wState !== null && wState !== void 0 && wState.errorEmitted ||
        rState !== null && rState !== void 0 && rState.errorEmitted
      ) {
        if (!willEmitClose) {
          process.nextTick(onclose);
        }
      } else if (
        !readable && (!willEmitClose || isReadable(stream)) &&
        (writableFinished || isWritable(stream) === false)
      ) {
        process.nextTick(onclose);
      } else if (
        !writable && (!willEmitClose || isWritable(stream)) &&
        (readableFinished || isReadable(stream) === false)
      ) {
        process.nextTick(onclose);
      } else if (rState && stream.req && stream.aborted) {
        process.nextTick(onclose);
      }
      const cleanup = () => {
        callback = nop;
        stream.removeListener("aborted", onclose);
        stream.removeListener("complete", onfinish);
        stream.removeListener("abort", onclose);
        stream.removeListener("request", onrequest);
        if (stream.req) {
          stream.req.removeListener("finish", onfinish);
        }
        stream.removeListener("end", onlegacyfinish);
        stream.removeListener("close", onlegacyfinish);
        stream.removeListener("finish", onfinish);
        stream.removeListener("end", onend);
        stream.removeListener("error", onerror);
        stream.removeListener("close", onclose);
      };
      if (options.signal && !closed) {
        const abort = () => {
          const endCallback = callback;
          cleanup();
          endCallback.call(
            stream,
            new AbortError(void 0, {
              cause: options.signal.reason,
            }),
          );
        };
        if (options.signal.aborted) {
          process.nextTick(abort);
        } else {
          const originalCallback = callback;
          callback = once((...args) => {
            options.signal.removeEventListener("abort", abort);
            originalCallback.apply(stream, args);
          });
          options.signal.addEventListener("abort", abort);
        }
      }
      return cleanup;
    }
    function finished(stream, opts) {
      return new Promise2((resolve, reject) => {
        eos(stream, opts, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
    module.exports = eos;
    module.exports.finished = finished;
  },
});

// lib/internal/streams/operators.js
var require_operators = __commonJS({
  "lib/internal/streams/operators.js"(exports, module) {
    "use strict";
    var { validateAbortSignal, validateInteger, validateObject } =
      require_validators();
    var kWeakHandler = require_primordials().Symbol("kWeak");
    var { finished } = require_end_of_stream();
    var {
      ArrayPrototypePush,
      MathFloor,
      Number: Number2,
      NumberIsNaN,
      Promise: Promise2,
      PromiseReject,
      PromisePrototypeThen,
      Symbol: Symbol2,
    } = require_primordials();
    var kEmpty = Symbol2("kEmpty");
    var kEof = Symbol2("kEof");
    function map(fn, options) {
      if (typeof fn !== "function") {
        throw new ERR_INVALID_ARG_TYPE("fn", ["Function", "AsyncFunction"], fn);
      }
      if (options != null) {
        validateObject(options, "options");
      }
      if (
        (options === null || options === void 0 ? void 0 : options.signal) !=
        null
      ) {
        validateAbortSignal(options.signal, "options.signal");
      }
      let concurrency = 1;
      if (
        (options === null || options === void 0
          ? void 0
          : options.concurrency) != null
      ) {
        concurrency = MathFloor(options.concurrency);
      }
      validateInteger(concurrency, "concurrency", 1);
      return async function* map2() {
        var _options$signal, _options$signal2;
        const ac = new AbortController();
        const stream = this;
        const queue = [];
        const signal = ac.signal;
        const signalOpt = {
          signal,
        };
        const abort = () => ac.abort();
        if (
          options !== null && options !== void 0 &&
          (_options$signal = options.signal) !== null &&
          _options$signal !== void 0 && _options$signal.aborted
        ) {
          abort();
        }
        options === null || options === void 0
          ? void 0
          : (_options$signal2 = options.signal) === null ||
            _options$signal2 === void 0
            ? void 0
            : _options$signal2.addEventListener("abort", abort);
        let next;
        let resume;
        let done = false;
        function onDone() {
          done = true;
        }
        async function pump() {
          try {
            for await (let val of stream) {
              var _val;
              if (done) {
                return;
              }
              if (signal.aborted) {
                throw new AbortError();
              }
              try {
                val = fn(val, signalOpt);
              } catch (err) {
                val = PromiseReject(err);
              }
              if (val === kEmpty) {
                continue;
              }
              if (
                typeof ((_val = val) === null || _val === void 0
                  ? void 0
                  : _val.catch) === "function"
              ) {
                val.catch(onDone);
              }
              queue.push(val);
              if (next) {
                next();
                next = null;
              }
              if (!done && queue.length && queue.length >= concurrency) {
                await new Promise2((resolve) => {
                  resume = resolve;
                });
              }
            }
            queue.push(kEof);
          } catch (err) {
            const val = PromiseReject(err);
            PromisePrototypeThen(val, void 0, onDone);
            queue.push(val);
          } finally {
            var _options$signal3;
            done = true;
            if (next) {
              next();
              next = null;
            }
            options === null || options === void 0
              ? void 0
              : (_options$signal3 = options.signal) === null ||
                _options$signal3 === void 0
                ? void 0
                : _options$signal3.removeEventListener("abort", abort);
          }
        }
        pump();
        try {
          while (true) {
            while (queue.length > 0) {
              const val = await queue[0];
              if (val === kEof) {
                return;
              }
              if (signal.aborted) {
                throw new AbortError();
              }
              if (val !== kEmpty) {
                yield val;
              }
              queue.shift();
              if (resume) {
                resume();
                resume = null;
              }
            }
            await new Promise2((resolve) => {
              next = resolve;
            });
          }
        } finally {
          ac.abort();
          done = true;
          if (resume) {
            resume();
            resume = null;
          }
        }
      }.call(this);
    }
    function asIndexedPairs(options = void 0) {
      if (options != null) {
        validateObject(options, "options");
      }
      if (
        (options === null || options === void 0 ? void 0 : options.signal) !=
        null
      ) {
        validateAbortSignal(options.signal, "options.signal");
      }
      return async function* asIndexedPairs2() {
        let index = 0;
        for await (const val of this) {
          var _options$signal4;
          if (
            options !== null && options !== void 0 &&
            (_options$signal4 = options.signal) !== null &&
            _options$signal4 !== void 0 && _options$signal4.aborted
          ) {
            throw new AbortError({
              cause: options.signal.reason,
            });
          }
          yield [index++, val];
        }
      }.call(this);
    }
    async function some(fn, options = void 0) {
      for await (const unused of filter.call(this, fn, options)) {
        return true;
      }
      return false;
    }
    async function every(fn, options = void 0) {
      if (typeof fn !== "function") {
        throw new ERR_INVALID_ARG_TYPE("fn", ["Function", "AsyncFunction"], fn);
      }
      return !await some.call(
        this,
        async (...args) => {
          return !await fn(...args);
        },
        options,
      );
    }
    async function find(fn, options) {
      for await (const result of filter.call(this, fn, options)) {
        return result;
      }
      return void 0;
    }
    async function forEach(fn, options) {
      if (typeof fn !== "function") {
        throw new ERR_INVALID_ARG_TYPE("fn", ["Function", "AsyncFunction"], fn);
      }
      async function forEachFn(value, options2) {
        await fn(value, options2);
        return kEmpty;
      }
      for await (const unused of map.call(this, forEachFn, options));
    }
    function filter(fn, options) {
      if (typeof fn !== "function") {
        throw new ERR_INVALID_ARG_TYPE("fn", ["Function", "AsyncFunction"], fn);
      }
      async function filterFn(value, options2) {
        if (await fn(value, options2)) {
          return value;
        }
        return kEmpty;
      }
      return map.call(this, filterFn, options);
    }
    var ReduceAwareErrMissingArgs = class extends ERR_MISSING_ARGS {
      constructor() {
        super("reduce");
        this.message = "Reduce of an empty stream requires an initial value";
      }
    };
    async function reduce(reducer, initialValue, options) {
      var _options$signal5;
      if (typeof reducer !== "function") {
        throw new ERR_INVALID_ARG_TYPE(
          "reducer",
          ["Function", "AsyncFunction"],
          reducer,
        );
      }
      if (options != null) {
        validateObject(options, "options");
      }
      if (
        (options === null || options === void 0 ? void 0 : options.signal) !=
        null
      ) {
        validateAbortSignal(options.signal, "options.signal");
      }
      let hasInitialValue = arguments.length > 1;
      if (
        options !== null && options !== void 0 &&
        (_options$signal5 = options.signal) !== null &&
        _options$signal5 !== void 0 && _options$signal5.aborted
      ) {
        const err = new AbortError(void 0, {
          cause: options.signal.reason,
        });
        this.once("error", () => {
        });
        await finished(this.destroy(err));
        throw err;
      }
      const ac = new AbortController();
      const signal = ac.signal;
      if (options !== null && options !== void 0 && options.signal) {
        const opts = {
          once: true,
          [kWeakHandler]: this,
        };
        options.signal.addEventListener("abort", () => ac.abort(), opts);
      }
      let gotAnyItemFromStream = false;
      try {
        for await (const value of this) {
          var _options$signal6;
          gotAnyItemFromStream = true;
          if (
            options !== null && options !== void 0 &&
            (_options$signal6 = options.signal) !== null &&
            _options$signal6 !== void 0 && _options$signal6.aborted
          ) {
            throw new AbortError();
          }
          if (!hasInitialValue) {
            initialValue = value;
            hasInitialValue = true;
          } else {
            initialValue = await reducer(initialValue, value, {
              signal,
            });
          }
        }
        if (!gotAnyItemFromStream && !hasInitialValue) {
          throw new ReduceAwareErrMissingArgs();
        }
      } finally {
        ac.abort();
      }
      return initialValue;
    }
    async function toArray(options) {
      if (options != null) {
        validateObject(options, "options");
      }
      if (
        (options === null || options === void 0 ? void 0 : options.signal) !=
        null
      ) {
        validateAbortSignal(options.signal, "options.signal");
      }
      const result = [];
      for await (const val of this) {
        var _options$signal7;
        if (
          options !== null && options !== void 0 &&
          (_options$signal7 = options.signal) !== null &&
          _options$signal7 !== void 0 && _options$signal7.aborted
        ) {
          throw new AbortError(void 0, {
            cause: options.signal.reason,
          });
        }
        ArrayPrototypePush(result, val);
      }
      return result;
    }
    function flatMap(fn, options) {
      const values = map.call(this, fn, options);
      return async function* flatMap2() {
        for await (const val of values) {
          yield* val;
        }
      }.call(this);
    }
    function toIntegerOrInfinity(number) {
      number = Number2(number);
      if (NumberIsNaN(number)) {
        return 0;
      }
      if (number < 0) {
        throw new ERR_OUT_OF_RANGE("number", ">= 0", number);
      }
      return number;
    }
    function drop(number, options = void 0) {
      if (options != null) {
        validateObject(options, "options");
      }
      if (
        (options === null || options === void 0 ? void 0 : options.signal) !=
        null
      ) {
        validateAbortSignal(options.signal, "options.signal");
      }
      number = toIntegerOrInfinity(number);
      return async function* drop2() {
        var _options$signal8;
        if (
          options !== null && options !== void 0 &&
          (_options$signal8 = options.signal) !== null &&
          _options$signal8 !== void 0 && _options$signal8.aborted
        ) {
          throw new AbortError();
        }
        for await (const val of this) {
          var _options$signal9;
          if (
            options !== null && options !== void 0 &&
            (_options$signal9 = options.signal) !== null &&
            _options$signal9 !== void 0 && _options$signal9.aborted
          ) {
            throw new AbortError();
          }
          if (number-- <= 0) {
            yield val;
          }
        }
      }.call(this);
    }
    function take(number, options = void 0) {
      if (options != null) {
        validateObject(options, "options");
      }
      if (
        (options === null || options === void 0 ? void 0 : options.signal) !=
        null
      ) {
        validateAbortSignal(options.signal, "options.signal");
      }
      number = toIntegerOrInfinity(number);
      return async function* take2() {
        var _options$signal10;
        if (
          options !== null && options !== void 0 &&
          (_options$signal10 = options.signal) !== null &&
          _options$signal10 !== void 0 && _options$signal10.aborted
        ) {
          throw new AbortError();
        }
        for await (const val of this) {
          var _options$signal11;
          if (
            options !== null && options !== void 0 &&
            (_options$signal11 = options.signal) !== null &&
            _options$signal11 !== void 0 && _options$signal11.aborted
          ) {
            throw new AbortError();
          }
          if (number-- > 0) {
            yield val;
          } else {
            return;
          }
        }
      }.call(this);
    }
    module.exports.streamReturningOperators = {
      asIndexedPairs,
      drop,
      filter,
      flatMap,
      map,
      take,
    };
    module.exports.promiseReturningOperators = {
      every,
      forEach,
      reduce,
      toArray,
      some,
      find,
    };
  },
});

// lib/internal/streams/destroy.js
var require_destroy = __commonJS({
  "lib/internal/streams/destroy.js"(exports, module) {
    "use strict";
    var process = require_browser2();
    var { Symbol: Symbol2 } = require_primordials();
    var { kDestroyed, isDestroyed, isFinished, isServerRequest } =
      require_utils();
    var kDestroy = Symbol2("kDestroy");
    var kConstruct = Symbol2("kConstruct");
    function checkError(err, w, r) {
      if (err) {
        err.stack;
        if (w && !w.errored) {
          w.errored = err;
        }
        if (r && !r.errored) {
          r.errored = err;
        }
      }
    }
    function destroy(err, cb) {
      const r = this._readableState;
      const w = this._writableState;
      const s = w || r;
      if (w && w.destroyed || r && r.destroyed) {
        if (typeof cb === "function") {
          cb();
        }
        return this;
      }
      checkError(err, w, r);
      if (w) {
        w.destroyed = true;
      }
      if (r) {
        r.destroyed = true;
      }
      if (!s.constructed) {
        this.once(kDestroy, function (er) {
          _destroy(this, aggregateTwoErrors(er, err), cb);
        });
      } else {
        _destroy(this, err, cb);
      }
      return this;
    }
    function _destroy(self2, err, cb) {
      let called = false;
      function onDestroy(err2) {
        if (called) {
          return;
        }
        called = true;
        const r = self2._readableState;
        const w = self2._writableState;
        checkError(err2, w, r);
        if (w) {
          w.closed = true;
        }
        if (r) {
          r.closed = true;
        }
        if (typeof cb === "function") {
          cb(err2);
        }
        if (err2) {
          process.nextTick(emitErrorCloseNT, self2, err2);
        } else {
          process.nextTick(emitCloseNT, self2);
        }
      }
      try {
        self2._destroy(err || null, onDestroy);
      } catch (err2) {
        onDestroy(err2);
      }
    }
    function emitErrorCloseNT(self2, err) {
      emitErrorNT(self2, err);
      emitCloseNT(self2);
    }
    function emitCloseNT(self2) {
      const r = self2._readableState;
      const w = self2._writableState;
      if (w) {
        w.closeEmitted = true;
      }
      if (r) {
        r.closeEmitted = true;
      }
      if (w && w.emitClose || r && r.emitClose) {
        self2.emit("close");
      }
    }
    function emitErrorNT(self2, err) {
      const r = self2._readableState;
      const w = self2._writableState;
      if (w && w.errorEmitted || r && r.errorEmitted) {
        return;
      }
      if (w) {
        w.errorEmitted = true;
      }
      if (r) {
        r.errorEmitted = true;
      }
      self2.emit("error", err);
    }
    function undestroy() {
      const r = this._readableState;
      const w = this._writableState;
      if (r) {
        r.constructed = true;
        r.closed = false;
        r.closeEmitted = false;
        r.destroyed = false;
        r.errored = null;
        r.errorEmitted = false;
        r.reading = false;
        r.ended = r.readable === false;
        r.endEmitted = r.readable === false;
      }
      if (w) {
        w.constructed = true;
        w.destroyed = false;
        w.closed = false;
        w.closeEmitted = false;
        w.errored = null;
        w.errorEmitted = false;
        w.finalCalled = false;
        w.prefinished = false;
        w.ended = w.writable === false;
        w.ending = w.writable === false;
        w.finished = w.writable === false;
      }
    }
    function errorOrDestroy(stream, err, sync) {
      const r = stream._readableState;
      const w = stream._writableState;
      if (w && w.destroyed || r && r.destroyed) {
        return this;
      }
      if (r && r.autoDestroy || w && w.autoDestroy) {
        stream.destroy(err);
      } else if (err) {
        err.stack;
        if (w && !w.errored) {
          w.errored = err;
        }
        if (r && !r.errored) {
          r.errored = err;
        }
        if (sync) {
          process.nextTick(emitErrorNT, stream, err);
        } else {
          emitErrorNT(stream, err);
        }
      }
    }
    function construct(stream, cb) {
      if (typeof stream._construct !== "function") {
        return;
      }
      const r = stream._readableState;
      const w = stream._writableState;
      if (r) {
        r.constructed = false;
      }
      if (w) {
        w.constructed = false;
      }
      stream.once(kConstruct, cb);
      if (stream.listenerCount(kConstruct) > 1) {
        return;
      }
      process.nextTick(constructNT, stream);
    }
    function constructNT(stream) {
      let called = false;
      function onConstruct(err) {
        if (called) {
          errorOrDestroy(
            stream,
            err !== null && err !== void 0 ? err : new ERR_MULTIPLE_CALLBACK(),
          );
          return;
        }
        called = true;
        const r = stream._readableState;
        const w = stream._writableState;
        const s = w || r;
        if (r) {
          r.constructed = true;
        }
        if (w) {
          w.constructed = true;
        }
        if (s.destroyed) {
          stream.emit(kDestroy, err);
        } else if (err) {
          errorOrDestroy(stream, err, true);
        } else {
          stream.emit(kConstruct);
        }
      }
      try {
        stream._construct((err) => {
          nextTick(onConstruct, err);
        });
      } catch (err) {
        nextTick(onConstruct, err);
      }
    }
    function isRequest(stream) {
      return stream && stream.setHeader && typeof stream.abort === "function";
    }
    function emitCloseLegacy(stream) {
      stream.emit("close");
    }
    function emitErrorCloseLegacy(stream, err) {
      stream.emit("error", err);
      process.nextTick(emitCloseLegacy, stream);
    }
    function destroyer(stream, err) {
      if (!stream || isDestroyed(stream)) {
        return;
      }
      if (!err && !isFinished(stream)) {
        err = new AbortError();
      }
      if (isServerRequest(stream)) {
        stream.socket = null;
        stream.destroy(err);
      } else if (isRequest(stream)) {
        stream.abort();
      } else if (isRequest(stream.req)) {
        stream.req.abort();
      } else if (typeof stream.destroy === "function") {
        stream.destroy(err);
      } else if (typeof stream.close === "function") {
        stream.close();
      } else if (err) {
        process.nextTick(emitErrorCloseLegacy, stream, err);
      } else {
        process.nextTick(emitCloseLegacy, stream);
      }
      if (!stream.destroyed) {
        stream[kDestroyed] = true;
      }
    }
    module.exports = {
      construct,
      destroyer,
      destroy,
      undestroy,
      errorOrDestroy,
    };
  },
});

// lib/internal/streams/legacy.js
var require_legacy = __commonJS({
  "lib/internal/streams/legacy.js"(exports, module) {
    "use strict";
    var { ArrayIsArray, ObjectSetPrototypeOf } = require_primordials();
    function Stream(opts) {
      EE.call(this, opts);
    }
    ObjectSetPrototypeOf(Stream.prototype, EE.prototype);
    ObjectSetPrototypeOf(Stream, EE);
    Stream.prototype.pipe = function (dest, options) {
      const source = this;
      function ondata(chunk) {
        if (dest.writable && dest.write(chunk) === false && source.pause) {
          source.pause();
        }
      }
      source.on("data", ondata);
      function ondrain() {
        if (source.readable && source.resume) {
          source.resume();
        }
      }
      dest.on("drain", ondrain);
      if (!dest._isStdio && (!options || options.end !== false)) {
        source.on("end", onend);
        source.on("close", onclose);
      }
      let didOnEnd = false;
      function onend() {
        if (didOnEnd) {
          return;
        }
        didOnEnd = true;
        dest.end();
      }
      function onclose() {
        if (didOnEnd) {
          return;
        }
        didOnEnd = true;
        if (typeof dest.destroy === "function") {
          dest.destroy();
        }
      }
      function onerror(er) {
        cleanup();
        if (EE.listenerCount(this, "error") === 0) {
          this.emit("error", er);
        }
      }
      prependListener(source, "error", onerror);
      prependListener(dest, "error", onerror);
      function cleanup() {
        source.removeListener("data", ondata);
        dest.removeListener("drain", ondrain);
        source.removeListener("end", onend);
        source.removeListener("close", onclose);
        source.removeListener("error", onerror);
        dest.removeListener("error", onerror);
        source.removeListener("end", cleanup);
        source.removeListener("close", cleanup);
        dest.removeListener("close", cleanup);
      }
      source.on("end", cleanup);
      source.on("close", cleanup);
      dest.on("close", cleanup);
      dest.emit("pipe", source);
      return dest;
    };
    function prependListener(emitter, event, fn) {
      if (typeof emitter.prependListener === "function") {
        return emitter.prependListener(event, fn);
      }
      if (!emitter._events || !emitter._events[event]) {
        emitter.on(event, fn);
      } else if (ArrayIsArray(emitter._events[event])) {
        emitter._events[event].unshift(fn);
      } else {
        emitter._events[event] = [fn, emitter._events[event]];
      }
    }
    module.exports = {
      Stream,
      prependListener,
    };
  },
});

// lib/internal/streams/add-abort-signal.js
var require_add_abort_signal = __commonJS({
  "lib/internal/streams/add-abort-signal.js"(exports, module) {
    "use strict";
    var eos = require_end_of_stream();
    var validateAbortSignal = (signal, name) => {
      if (typeof signal !== "object" || !("aborted" in signal)) {
        throw new ERR_INVALID_ARG_TYPE(name, "AbortSignal", signal);
      }
    };
    function isNodeStream(obj) {
      return !!(obj && typeof obj.pipe === "function");
    }
    module.exports.addAbortSignal = function addAbortSignal(signal, stream) {
      validateAbortSignal(signal, "signal");
      if (!isNodeStream(stream)) {
        throw new ERR_INVALID_ARG_TYPE("stream", "stream.Stream", stream);
      }
      return module.exports.addAbortSignalNoValidate(signal, stream);
    };
    module.exports.addAbortSignalNoValidate = function (signal, stream) {
      if (typeof signal !== "object" || !("aborted" in signal)) {
        return stream;
      }
      const onAbort = () => {
        stream.destroy(
          new AbortError(void 0, {
            cause: signal.reason,
          }),
        );
      };
      if (signal.aborted) {
        onAbort();
      } else {
        signal.addEventListener("abort", onAbort);
        eos(stream, () => signal.removeEventListener("abort", onAbort));
      }
      return stream;
    };
  },
});

// lib/internal/streams/buffer_list.js
var require_buffer_list = __commonJS({
  "lib/internal/streams/buffer_list.js"(exports, module) {
    "use strict";
    var {
      StringPrototypeSlice,
      SymbolIterator,
      TypedArrayPrototypeSet,
      Uint8Array: Uint8Array2,
    } = require_primordials();
    var { Buffer: Buffer2 } = require_buffer();
    module.exports = class BufferList {
      constructor() {
        this.head = null;
        this.tail = null;
        this.length = 0;
      }
      push(v) {
        const entry = {
          data: v,
          next: null,
        };
        if (this.length > 0) {
          this.tail.next = entry;
        } else {
          this.head = entry;
        }
        this.tail = entry;
        ++this.length;
      }
      unshift(v) {
        const entry = {
          data: v,
          next: this.head,
        };
        if (this.length === 0) {
          this.tail = entry;
        }
        this.head = entry;
        ++this.length;
      }
      shift() {
        if (this.length === 0) {
          return;
        }
        const ret = this.head.data;
        if (this.length === 1) {
          this.head = this.tail = null;
        } else {
          this.head = this.head.next;
        }
        --this.length;
        return ret;
      }
      clear() {
        this.head = this.tail = null;
        this.length = 0;
      }
      join(s) {
        if (this.length === 0) {
          return "";
        }
        let p = this.head;
        let ret = "" + p.data;
        while ((p = p.next) !== null) {
          ret += s + p.data;
        }
        return ret;
      }
      concat(n) {
        if (this.length === 0) {
          return Buffer2.alloc(0);
        }
        const ret = Buffer2.allocUnsafe(n >>> 0);
        let p = this.head;
        let i = 0;
        while (p) {
          TypedArrayPrototypeSet(ret, p.data, i);
          i += p.data.length;
          p = p.next;
        }
        return ret;
      }
      // Consumes a specified amount of bytes or characters from the buffered data.
      consume(n, hasStrings) {
        const data = this.head.data;
        if (n < data.length) {
          const slice = data.slice(0, n);
          this.head.data = data.slice(n);
          return slice;
        }
        if (n === data.length) {
          return this.shift();
        }
        return hasStrings ? this._getString(n) : this._getBuffer(n);
      }
      first() {
        return this.head.data;
      }
      *[SymbolIterator]() {
        for (let p = this.head; p; p = p.next) {
          yield p.data;
        }
      }
      // Consumes a specified amount of characters from the buffered data.
      _getString(n) {
        let ret = "";
        let p = this.head;
        let c = 0;
        do {
          const str = p.data;
          if (n > str.length) {
            ret += str;
            n -= str.length;
          } else {
            if (n === str.length) {
              ret += str;
              ++c;
              if (p.next) {
                this.head = p.next;
              } else {
                this.head = this.tail = null;
              }
            } else {
              ret += StringPrototypeSlice(str, 0, n);
              this.head = p;
              p.data = StringPrototypeSlice(str, n);
            }
            break;
          }
          ++c;
        } while ((p = p.next) !== null);
        this.length -= c;
        return ret;
      }
      // Consumes a specified amount of bytes from the buffered data.
      _getBuffer(n) {
        const ret = Buffer2.allocUnsafe(n);
        const retLen = n;
        let p = this.head;
        let c = 0;
        do {
          const buf = p.data;
          if (n > buf.length) {
            TypedArrayPrototypeSet(ret, buf, retLen - n);
            n -= buf.length;
          } else {
            if (n === buf.length) {
              TypedArrayPrototypeSet(ret, buf, retLen - n);
              ++c;
              if (p.next) {
                this.head = p.next;
              } else {
                this.head = this.tail = null;
              }
            } else {
              TypedArrayPrototypeSet(
                ret,
                new Uint8Array2(buf.buffer, buf.byteOffset, n),
                retLen - n,
              );
              this.head = p;
              p.data = buf.slice(n);
            }
            break;
          }
          ++c;
        } while ((p = p.next) !== null);
        this.length -= c;
        return ret;
      }
      // Make sure the linked list only shows the minimal necessary information.
      [Symbol.for("nodejs.util.inspect.custom")](_, options) {
        return inspect(this, {
          ...options,
          // Only inspect one level.
          depth: 0,
          // It should not recurse.
          customInspect: false,
        });
      }
    };
  },
});

// lib/internal/streams/state.js
var require_state = __commonJS({
  "lib/internal/streams/state.js"(exports, module) {
    "use strict";
    var { MathFloor, NumberIsInteger } = require_primordials();
    function highWaterMarkFrom(options, isDuplex, duplexKey) {
      return options.highWaterMark != null
        ? options.highWaterMark
        : isDuplex
          ? options[duplexKey]
          : null;
    }
    function getDefaultHighWaterMark(objectMode) {
      return objectMode ? 16 : 16 * 1024;
    }
    function getHighWaterMark(state, options, duplexKey, isDuplex) {
      const hwm = highWaterMarkFrom(options, isDuplex, duplexKey);
      if (hwm != null) {
        if (!NumberIsInteger(hwm) || hwm < 0) {
          const name = isDuplex
            ? `options.${duplexKey}`
            : "options.highWaterMark";
          throw new ERR_INVALID_ARG_VALUE(name, hwm);
        }
        return MathFloor(hwm);
      }
      return getDefaultHighWaterMark(state.objectMode);
    }
    module.exports = {
      getHighWaterMark,
      getDefaultHighWaterMark,
    };
  },
});

// node_modules/safe-buffer/index.js
var require_safe_buffer = __commonJS({
  "node_modules/safe-buffer/index.js"(exports, module) {
    var buffer = require_buffer();
    var Buffer2 = buffer.Buffer;
    function copyProps(src, dst) {
      for (var key in src) {
        dst[key] = src[key];
      }
    }
    if (
      Buffer2.from && Buffer2.alloc && Buffer2.allocUnsafe &&
      Buffer2.allocUnsafeSlow
    ) {
      module.exports = buffer;
    } else {
      copyProps(buffer, exports);
      exports.Buffer = SafeBuffer;
    }
    function SafeBuffer(arg, encodingOrOffset, length) {
      return Buffer2(arg, encodingOrOffset, length);
    }
    SafeBuffer.prototype = Object.create(Buffer2.prototype);
    copyProps(Buffer2, SafeBuffer);
    SafeBuffer.from = function (arg, encodingOrOffset, length) {
      if (typeof arg === "number") {
        throw new TypeError("Argument must not be a number");
      }
      return Buffer2(arg, encodingOrOffset, length);
    };
    SafeBuffer.alloc = function (size, fill, encoding) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      var buf = Buffer2(size);
      if (fill !== void 0) {
        if (typeof encoding === "string") {
          buf.fill(fill, encoding);
        } else {
          buf.fill(fill);
        }
      } else {
        buf.fill(0);
      }
      return buf;
    };
    SafeBuffer.allocUnsafe = function (size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return Buffer2(size);
    };
    SafeBuffer.allocUnsafeSlow = function (size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return buffer.SlowBuffer(size);
    };
  },
});

// lib/internal/streams/from.js
var require_from = __commonJS({
  "lib/internal/streams/from.js"(exports, module) {
    "use strict";
    var process = require_browser2();
    var { PromisePrototypeThen, SymbolAsyncIterator, SymbolIterator } =
      require_primordials();
    var { Buffer: Buffer2 } = require_buffer();
    function from(Readable, iterable, opts) {
      let iterator;
      if (typeof iterable === "string" || iterable instanceof Buffer2) {
        return new Readable({
          objectMode: true,
          ...opts,
          read() {
            this.push(iterable);
            this.push(null);
          },
        });
      }
      let isAsync;
      if (iterable && iterable[SymbolAsyncIterator]) {
        isAsync = true;
        iterator = iterable[SymbolAsyncIterator]();
      } else if (iterable && iterable[SymbolIterator]) {
        isAsync = false;
        iterator = iterable[SymbolIterator]();
      } else {
        throw new ERR_INVALID_ARG_TYPE("iterable", ["Iterable"], iterable);
      }
      const readable = new Readable({
        objectMode: true,
        highWaterMark: 1,
        // TODO(ronag): What options should be allowed?
        ...opts,
      });
      let reading = false;
      readable._read = function () {
        if (!reading) {
          reading = true;
          next();
        }
      };
      readable._destroy = function (error, cb) {
        PromisePrototypeThen(
          close(error),
          () => process.nextTick(cb, error),
          // nextTick is here in case cb throws
          (e) => process.nextTick(cb, e || error),
        );
      };
      async function close(error) {
        const hadError = error !== void 0 && error !== null;
        const hasThrow = typeof iterator.throw === "function";
        if (hadError && hasThrow) {
          const { value, done } = await iterator.throw(error);
          await value;
          if (done) {
            return;
          }
        }
        if (typeof iterator.return === "function") {
          const { value } = await iterator.return();
          await value;
        }
      }
      async function next() {
        for (; ;) {
          try {
            const { value, done } = isAsync
              ? await iterator.next()
              : iterator.next();
            if (done) {
              readable.push(null);
            } else {
              const res = value && typeof value.then === "function"
                ? await value
                : value;
              if (res === null) {
                reading = false;
                throw new ERR_STREAM_NULL_VALUES();
              } else if (readable.push(res)) {
                continue;
              } else {
                reading = false;
              }
            }
          } catch (err) {
            readable.destroy(err);
          }
          break;
        }
      }
      return readable;
    }
    module.exports = from;
  },
});

// lib/internal/streams/readable.js
var require_readable = __commonJS({
  "lib/internal/streams/readable.js"(exports, module) {
    var process = require_browser2();
    var {
      ArrayPrototypeIndexOf,
      NumberIsInteger,
      NumberIsNaN,
      NumberParseInt,
      ObjectDefineProperties,
      ObjectKeys,
      ObjectSetPrototypeOf,
      Promise: Promise2,
      SafeSet,
      SymbolAsyncIterator,
      Symbol: Symbol2,
    } = require_primordials();
    module.exports = Readable;
    Readable.ReadableState = ReadableState;
    var { Stream, prependListener } = require_legacy();
    var { Buffer: Buffer2 } = require_buffer();
    var { addAbortSignal } = require_add_abort_signal();
    var eos = require_end_of_stream();
    var debug = debuglog("stream", (fn) => {
      debug = fn;
    });
    var BufferList = require_buffer_list();
    var destroyImpl = require_destroy();
    var { getHighWaterMark, getDefaultHighWaterMark } = require_state();
    var { validateObject } = require_validators();
    var kPaused = Symbol2("kPaused");
    var from = require_from();
    ObjectSetPrototypeOf(Readable.prototype, Stream.prototype);
    ObjectSetPrototypeOf(Readable, Stream);
    var nop = () => {
    };
    var { errorOrDestroy } = destroyImpl;
    function ReadableState(options, stream, isDuplex) {
      if (typeof isDuplex !== "boolean") {
        isDuplex = stream instanceof require_duplex();
      }
      this.objectMode = !!(options && options.objectMode);
      if (isDuplex) {
        this.objectMode = this.objectMode ||
          !!(options && options.readableObjectMode);
      }
      this.highWaterMark = options
        ? getHighWaterMark(this, options, "readableHighWaterMark", isDuplex)
        : getDefaultHighWaterMark(false);
      this.buffer = new BufferList();
      this.length = 0;
      this.pipes = [];
      this.flowing = null;
      this.ended = false;
      this.endEmitted = false;
      this.reading = false;
      this.constructed = true;
      this.sync = true;
      this.needReadable = false;
      this.emittedReadable = false;
      this.readableListening = false;
      this.resumeScheduled = false;
      this[kPaused] = null;
      this.errorEmitted = false;
      this.emitClose = !options || options.emitClose !== false;
      this.autoDestroy = !options || options.autoDestroy !== false;
      this.destroyed = false;
      this.errored = null;
      this.closed = false;
      this.closeEmitted = false;
      this.defaultEncoding = options && options.defaultEncoding || "utf8";
      this.awaitDrainWriters = null;
      this.multiAwaitDrain = false;
      this.readingMore = false;
      this.dataEmitted = false;
      this.decoder = null;
      this.encoding = null;
      if (options && options.encoding) {
        this.decoder = new StringDecoder(options.encoding);
        this.encoding = options.encoding;
      }
    }
    function Readable(options) {
      if (!(this instanceof Readable)) {
        return new Readable(options);
      }
      const isDuplex = this instanceof require_duplex();
      this._readableState = new ReadableState(options, this, isDuplex);
      if (options) {
        if (typeof options.read === "function") {
          this._read = options.read;
        }
        if (typeof options.destroy === "function") {
          this._destroy = options.destroy;
        }
        if (typeof options.construct === "function") {
          this._construct = options.construct;
        }
        if (options.signal && !isDuplex) {
          addAbortSignal(options.signal, this);
        }
      }
      Stream.call(this, options);
      destroyImpl.construct(this, () => {
        if (this._readableState.needReadable) {
          maybeReadMore(this, this._readableState);
        }
      });
    }
    Readable.prototype.destroy = destroyImpl.destroy;
    Readable.prototype._undestroy = destroyImpl.undestroy;
    Readable.prototype._destroy = function (err, cb) {
      cb(err);
    };
    Readable.prototype[EE.captureRejectionSymbol] = function (err) {
      this.destroy(err);
    };
    Readable.prototype.push = function (chunk, encoding) {
      return readableAddChunk(this, chunk, encoding, false);
    };
    Readable.prototype.unshift = function (chunk, encoding) {
      return readableAddChunk(this, chunk, encoding, true);
    };
    function readableAddChunk(stream, chunk, encoding, addToFront) {
      debug("readableAddChunk", chunk);
      const state = stream._readableState;
      let err;
      if (!state.objectMode) {
        if (typeof chunk === "string") {
          encoding = encoding || state.defaultEncoding;
          if (state.encoding !== encoding) {
            if (addToFront && state.encoding) {
              chunk = Buffer2.from(chunk, encoding).toString(state.encoding);
            } else {
              chunk = Buffer2.from(chunk, encoding);
              encoding = "";
            }
          }
        } else if (chunk instanceof Buffer2) {
          encoding = "";
        } else if (Stream._isUint8Array(chunk)) {
          chunk = Stream._uint8ArrayToBuffer(chunk);
          encoding = "";
        } else if (chunk != null) {
          err = new ERR_INVALID_ARG_TYPE("chunk", [
            "string",
            "Buffer",
            "Uint8Array",
          ], chunk);
        }
      }
      if (err) {
        errorOrDestroy(stream, err);
      } else if (chunk === null) {
        state.reading = false;
        onEofChunk(stream, state);
      } else if (state.objectMode || chunk && chunk.length > 0) {
        if (addToFront) {
          if (state.endEmitted) {
            errorOrDestroy(stream, new ERR_STREAM_UNSHIFT_AFTER_END_EVENT());
          } else if (state.destroyed || state.errored) {
            return false;
          } else {
            addChunk(stream, state, chunk, true);
          }
        } else if (state.ended) {
          errorOrDestroy(stream, new ERR_STREAM_PUSH_AFTER_EOF());
        } else if (state.destroyed || state.errored) {
          return false;
        } else {
          state.reading = false;
          if (state.decoder && !encoding) {
            chunk = state.decoder.write(chunk);
            if (state.objectMode || chunk.length !== 0) {
              addChunk(stream, state, chunk, false);
            } else {
              maybeReadMore(stream, state);
            }
          } else {
            addChunk(stream, state, chunk, false);
          }
        }
      } else if (!addToFront) {
        state.reading = false;
        maybeReadMore(stream, state);
      }
      return !state.ended &&
        (state.length < state.highWaterMark || state.length === 0);
    }
    function addChunk(stream, state, chunk, addToFront) {
      if (
        state.flowing && state.length === 0 && !state.sync &&
        stream.listenerCount("data") > 0
      ) {
        if (state.multiAwaitDrain) {
          state.awaitDrainWriters.clear();
        } else {
          state.awaitDrainWriters = null;
        }
        state.dataEmitted = true;
        stream.emit("data", chunk);
      } else {
        state.length += state.objectMode ? 1 : chunk.length;
        if (addToFront) {
          state.buffer.unshift(chunk);
        } else {
          state.buffer.push(chunk);
        }
        if (state.needReadable) {
          emitReadable(stream);
        }
      }
      maybeReadMore(stream, state);
    }
    Readable.prototype.isPaused = function () {
      const state = this._readableState;
      return state[kPaused] === true || state.flowing === false;
    };
    Readable.prototype.setEncoding = function (enc) {
      const decoder = new StringDecoder(enc);
      this._readableState.decoder = decoder;
      this._readableState.encoding = this._readableState.decoder.encoding;
      const buffer = this._readableState.buffer;
      let content = "";
      for (const data of buffer) {
        content += decoder.write(data);
      }
      buffer.clear();
      if (content !== "") {
        buffer.push(content);
      }
      this._readableState.length = content.length;
      return this;
    };
    var MAX_HWM = 1073741824;
    function computeNewHighWaterMark(n) {
      if (n > MAX_HWM) {
        throw new ERR_OUT_OF_RANGE("size", "<= 1GiB", n);
      } else {
        n--;
        n |= n >>> 1;
        n |= n >>> 2;
        n |= n >>> 4;
        n |= n >>> 8;
        n |= n >>> 16;
        n++;
      }
      return n;
    }
    function howMuchToRead(n, state) {
      if (n <= 0 || state.length === 0 && state.ended) {
        return 0;
      }
      if (state.objectMode) {
        return 1;
      }
      if (NumberIsNaN(n)) {
        if (state.flowing && state.length) {
          return state.buffer.first().length;
        }
        return state.length;
      }
      if (n <= state.length) {
        return n;
      }
      return state.ended ? state.length : 0;
    }
    Readable.prototype.read = function (n) {
      debug("read", n);
      if (n === void 0) {
        n = NaN;
      } else if (!NumberIsInteger(n)) {
        n = NumberParseInt(n, 10);
      }
      const state = this._readableState;
      const nOrig = n;
      if (n > state.highWaterMark) {
        state.highWaterMark = computeNewHighWaterMark(n);
      }
      if (n !== 0) {
        state.emittedReadable = false;
      }
      if (
        n === 0 && state.needReadable &&
        ((state.highWaterMark !== 0
          ? state.length >= state.highWaterMark
          : state.length > 0) || state.ended)
      ) {
        debug("read: emitReadable", state.length, state.ended);
        if (state.length === 0 && state.ended) {
          endReadable(this);
        } else {
          emitReadable(this);
        }
        return null;
      }
      n = howMuchToRead(n, state);
      if (n === 0 && state.ended) {
        if (state.length === 0) {
          endReadable(this);
        }
        return null;
      }
      let doRead = state.needReadable;
      debug("need readable", doRead);
      if (state.length === 0 || state.length - n < state.highWaterMark) {
        doRead = true;
        debug("length less than watermark", doRead);
      }
      if (
        state.ended || state.reading || state.destroyed || state.errored ||
        !state.constructed
      ) {
        doRead = false;
        debug("reading, ended or constructing", doRead);
      } else if (doRead) {
        debug("do read");
        state.reading = true;
        state.sync = true;
        if (state.length === 0) {
          state.needReadable = true;
        }
        try {
          this._read(state.highWaterMark);
        } catch (err) {
          errorOrDestroy(this, err);
        }
        state.sync = false;
        if (!state.reading) {
          n = howMuchToRead(nOrig, state);
        }
      }
      let ret;
      if (n > 0) {
        ret = fromList(n, state);
      } else {
        ret = null;
      }
      if (ret === null) {
        state.needReadable = state.length <= state.highWaterMark;
        n = 0;
      } else {
        state.length -= n;
        if (state.multiAwaitDrain) {
          state.awaitDrainWriters.clear();
        } else {
          state.awaitDrainWriters = null;
        }
      }
      if (state.length === 0) {
        if (!state.ended) {
          state.needReadable = true;
        }
        if (nOrig !== n && state.ended) {
          endReadable(this);
        }
      }
      if (ret !== null && !state.errorEmitted && !state.closeEmitted) {
        state.dataEmitted = true;
        this.emit("data", ret);
      }
      return ret;
    };
    function onEofChunk(stream, state) {
      debug("onEofChunk");
      if (state.ended) {
        return;
      }
      if (state.decoder) {
        const chunk = state.decoder.end();
        if (chunk && chunk.length) {
          state.buffer.push(chunk);
          state.length += state.objectMode ? 1 : chunk.length;
        }
      }
      state.ended = true;
      if (state.sync) {
        emitReadable(stream);
      } else {
        state.needReadable = false;
        state.emittedReadable = true;
        emitReadable_(stream);
      }
    }
    function emitReadable(stream) {
      const state = stream._readableState;
      debug("emitReadable", state.needReadable, state.emittedReadable);
      state.needReadable = false;
      if (!state.emittedReadable) {
        debug("emitReadable", state.flowing);
        state.emittedReadable = true;
        process.nextTick(emitReadable_, stream);
      }
    }
    function emitReadable_(stream) {
      const state = stream._readableState;
      debug("emitReadable_", state.destroyed, state.length, state.ended);
      if (!state.destroyed && !state.errored && (state.length || state.ended)) {
        stream.emit("readable");
        state.emittedReadable = false;
      }
      state.needReadable = !state.flowing && !state.ended &&
        state.length <= state.highWaterMark;
      flow(stream);
    }
    function maybeReadMore(stream, state) {
      if (!state.readingMore && state.constructed) {
        state.readingMore = true;
        process.nextTick(maybeReadMore_, stream, state);
      }
    }
    function maybeReadMore_(stream, state) {
      while (
        !state.reading && !state.ended &&
        (state.length < state.highWaterMark ||
          state.flowing && state.length === 0)
      ) {
        const len = state.length;
        debug("maybeReadMore read 0");
        stream.read(0);
        if (len === state.length) {
          break;
        }
      }
      state.readingMore = false;
    }
    Readable.prototype._read = function (n) {
      throw new ERR_METHOD_NOT_IMPLEMENTED("_read()");
    };
    Readable.prototype.pipe = function (dest, pipeOpts) {
      const src = this;
      const state = this._readableState;
      if (state.pipes.length === 1) {
        if (!state.multiAwaitDrain) {
          state.multiAwaitDrain = true;
          state.awaitDrainWriters = new SafeSet(
            state.awaitDrainWriters ? [state.awaitDrainWriters] : [],
          );
        }
      }
      state.pipes.push(dest);
      debug("pipe count=%d opts=%j", state.pipes.length, pipeOpts);
      const doEnd = (!pipeOpts || pipeOpts.end !== false) &&
        dest !== process.stdout && dest !== process.stderr;
      const endFn = doEnd ? onend : unpipe;
      if (state.endEmitted) {
        process.nextTick(endFn);
      } else {
        src.once("end", endFn);
      }
      dest.on("unpipe", onunpipe);
      function onunpipe(readable, unpipeInfo) {
        debug("onunpipe");
        if (readable === src) {
          if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
            unpipeInfo.hasUnpiped = true;
            cleanup();
          }
        }
      }
      function onend() {
        debug("onend");
        dest.end();
      }
      let ondrain;
      let cleanedUp = false;
      function cleanup() {
        debug("cleanup");
        dest.removeListener("close", onclose);
        dest.removeListener("finish", onfinish);
        if (ondrain) {
          dest.removeListener("drain", ondrain);
        }
        dest.removeListener("error", onerror);
        dest.removeListener("unpipe", onunpipe);
        src.removeListener("end", onend);
        src.removeListener("end", unpipe);
        src.removeListener("data", ondata);
        cleanedUp = true;
        if (
          ondrain && state.awaitDrainWriters &&
          (!dest._writableState || dest._writableState.needDrain)
        ) {
          ondrain();
        }
      }
      function pause() {
        if (!cleanedUp) {
          if (state.pipes.length === 1 && state.pipes[0] === dest) {
            debug("false write response, pause", 0);
            state.awaitDrainWriters = dest;
            state.multiAwaitDrain = false;
          } else if (state.pipes.length > 1 && state.pipes.includes(dest)) {
            debug("false write response, pause", state.awaitDrainWriters.size);
            state.awaitDrainWriters.add(dest);
          }
          src.pause();
        }
        if (!ondrain) {
          ondrain = pipeOnDrain(src, dest);
          dest.on("drain", ondrain);
        }
      }
      src.on("data", ondata);
      function ondata(chunk) {
        debug("ondata");
        const ret = dest.write(chunk);
        debug("dest.write", ret);
        if (ret === false) {
          pause();
        }
      }
      function onerror(er) {
        debug("onerror", er);
        unpipe();
        dest.removeListener("error", onerror);
        if (dest.listenerCount("error") === 0) {
          const s = dest._writableState || dest._readableState;
          if (s && !s.errorEmitted) {
            errorOrDestroy(dest, er);
          } else {
            dest.emit("error", er);
          }
        }
      }
      prependListener(dest, "error", onerror);
      function onclose() {
        dest.removeListener("finish", onfinish);
        unpipe();
      }
      dest.once("close", onclose);
      function onfinish() {
        debug("onfinish");
        dest.removeListener("close", onclose);
        unpipe();
      }
      dest.once("finish", onfinish);
      function unpipe() {
        debug("unpipe");
        src.unpipe(dest);
      }
      dest.emit("pipe", src);
      if (dest.writableNeedDrain === true) {
        if (state.flowing) {
          pause();
        }
      } else if (!state.flowing) {
        debug("pipe resume");
        src.resume();
      }
      return dest;
    };
    function pipeOnDrain(src, dest) {
      return function pipeOnDrainFunctionResult() {
        const state = src._readableState;
        if (state.awaitDrainWriters === dest) {
          debug("pipeOnDrain", 1);
          state.awaitDrainWriters = null;
        } else if (state.multiAwaitDrain) {
          debug("pipeOnDrain", state.awaitDrainWriters.size);
          state.awaitDrainWriters.delete(dest);
        }
        if (
          (!state.awaitDrainWriters || state.awaitDrainWriters.size === 0) &&
          src.listenerCount("data")
        ) {
          src.resume();
        }
      };
    }
    Readable.prototype.unpipe = function (dest) {
      const state = this._readableState;
      const unpipeInfo = {
        hasUnpiped: false,
      };
      if (state.pipes.length === 0) {
        return this;
      }
      if (!dest) {
        const dests = state.pipes;
        state.pipes = [];
        this.pause();
        for (let i = 0; i < dests.length; i++) {
          dests[i].emit("unpipe", this, {
            hasUnpiped: false,
          });
        }
        return this;
      }
      const index = ArrayPrototypeIndexOf(state.pipes, dest);
      if (index === -1) {
        return this;
      }
      state.pipes.splice(index, 1);
      if (state.pipes.length === 0) {
        this.pause();
      }
      dest.emit("unpipe", this, unpipeInfo);
      return this;
    };
    Readable.prototype.on = function (ev, fn) {
      const res = Stream.prototype.on.call(this, ev, fn);
      const state = this._readableState;
      if (ev === "data") {
        state.readableListening = this.listenerCount("readable") > 0;
        if (state.flowing !== false) {
          this.resume();
        }
      } else if (ev === "readable") {
        if (!state.endEmitted && !state.readableListening) {
          state.readableListening = state.needReadable = true;
          state.flowing = false;
          state.emittedReadable = false;
          debug("on readable", state.length, state.reading);
          if (state.length) {
            emitReadable(this);
          } else if (!state.reading) {
            process.nextTick(nReadingNextTick, this);
          }
        }
      }
      return res;
    };
    Readable.prototype.addListener = Readable.prototype.on;
    Readable.prototype.removeListener = function (ev, fn) {
      const res = Stream.prototype.removeListener.call(this, ev, fn);
      if (ev === "readable") {
        process.nextTick(updateReadableListening, this);
      }
      return res;
    };
    Readable.prototype.off = Readable.prototype.removeListener;
    Readable.prototype.removeAllListeners = function (ev) {
      const res = Stream.prototype.removeAllListeners.apply(this, arguments);
      if (ev === "readable" || ev === void 0) {
        process.nextTick(updateReadableListening, this);
      }
      return res;
    };
    function updateReadableListening(self2) {
      const state = self2._readableState;
      state.readableListening = self2.listenerCount("readable") > 0;
      if (state.resumeScheduled && state[kPaused] === false) {
        state.flowing = true;
      } else if (self2.listenerCount("data") > 0) {
        self2.resume();
      } else if (!state.readableListening) {
        state.flowing = null;
      }
    }
    function nReadingNextTick(self2) {
      debug("readable nexttick read 0");
      self2.read(0);
    }
    Readable.prototype.resume = function () {
      const state = this._readableState;
      if (!state.flowing) {
        debug("resume");
        state.flowing = !state.readableListening;
        resume(this, state);
      }
      state[kPaused] = false;
      return this;
    };
    function resume(stream, state) {
      if (!state.resumeScheduled) {
        state.resumeScheduled = true;
        process.nextTick(resume_, stream, state);
      }
    }
    function resume_(stream, state) {
      debug("resume", state.reading);
      if (!state.reading) {
        stream.read(0);
      }
      state.resumeScheduled = false;
      stream.emit("resume");
      flow(stream);
      if (state.flowing && !state.reading) {
        stream.read(0);
      }
    }
    Readable.prototype.pause = function () {
      debug("call pause flowing=%j", this._readableState.flowing);
      if (this._readableState.flowing !== false) {
        debug("pause");
        this._readableState.flowing = false;
        this.emit("pause");
      }
      this._readableState[kPaused] = true;
      return this;
    };
    function flow(stream) {
      const state = stream._readableState;
      debug("flow", state.flowing);
      while (state.flowing && stream.read() !== null);
    }
    Readable.prototype.wrap = function (stream) {
      let paused = false;
      stream.on("data", (chunk) => {
        if (!this.push(chunk) && stream.pause) {
          paused = true;
          stream.pause();
        }
      });
      stream.on("end", () => {
        this.push(null);
      });
      stream.on("error", (err) => {
        errorOrDestroy(this, err);
      });
      stream.on("close", () => {
        this.destroy();
      });
      stream.on("destroy", () => {
        this.destroy();
      });
      this._read = () => {
        if (paused && stream.resume) {
          paused = false;
          stream.resume();
        }
      };
      const streamKeys = ObjectKeys(stream);
      for (let j = 1; j < streamKeys.length; j++) {
        const i = streamKeys[j];
        if (this[i] === void 0 && typeof stream[i] === "function") {
          this[i] = stream[i].bind(stream);
        }
      }
      return this;
    };
    Readable.prototype[SymbolAsyncIterator] = function () {
      return streamToAsyncIterator(this);
    };
    Readable.prototype.iterator = function (options) {
      if (options !== void 0) {
        validateObject(options, "options");
      }
      return streamToAsyncIterator(this, options);
    };
    function streamToAsyncIterator(stream, options) {
      if (typeof stream.read !== "function") {
        stream = Readable.wrap(stream, {
          objectMode: true,
        });
      }
      const iter = createAsyncIterator(stream, options);
      iter.stream = stream;
      return iter;
    }
    async function* createAsyncIterator(stream, options) {
      let callback = nop;
      function next(resolve) {
        if (this === stream) {
          callback();
          callback = nop;
        } else {
          callback = resolve;
        }
      }
      stream.on("readable", next);
      let error;
      const cleanup = eos(
        stream,
        {
          writable: false,
        },
        (err) => {
          error = err ? aggregateTwoErrors(error, err) : null;
          callback();
          callback = nop;
        },
      );
      try {
        while (true) {
          const chunk = stream.destroyed ? null : stream.read();
          if (chunk !== null) {
            yield chunk;
          } else if (error) {
            throw error;
          } else if (error === null) {
            return;
          } else {
            await new Promise2(next);
          }
        }
      } catch (err) {
        error = aggregateTwoErrors(error, err);
        throw error;
      } finally {
        if (
          (error ||
            (options === null || options === void 0
              ? void 0
              : options.destroyOnReturn) !== false) &&
          (error === void 0 || stream._readableState.autoDestroy)
        ) {
          destroyImpl.destroyer(stream, null);
        } else {
          stream.off("readable", next);
          cleanup();
        }
      }
    }
    ObjectDefineProperties(Readable.prototype, {
      readable: {
        __proto__: null,
        get() {
          const r = this._readableState;
          return !!r && r.readable !== false && !r.destroyed &&
            !r.errorEmitted && !r.endEmitted;
        },
        set(val) {
          if (this._readableState) {
            this._readableState.readable = !!val;
          }
        },
      },
      readableDidRead: {
        __proto__: null,
        enumerable: false,
        get: function () {
          return this._readableState.dataEmitted;
        },
      },
      readableAborted: {
        __proto__: null,
        enumerable: false,
        get: function () {
          return !!(this._readableState.readable !== false &&
            (this._readableState.destroyed || this._readableState.errored) &&
            !this._readableState.endEmitted);
        },
      },
      readableHighWaterMark: {
        __proto__: null,
        enumerable: false,
        get: function () {
          return this._readableState.highWaterMark;
        },
      },
      readableBuffer: {
        __proto__: null,
        enumerable: false,
        get: function () {
          return this._readableState && this._readableState.buffer;
        },
      },
      readableFlowing: {
        __proto__: null,
        enumerable: false,
        get: function () {
          return this._readableState.flowing;
        },
        set: function (state) {
          if (this._readableState) {
            this._readableState.flowing = state;
          }
        },
      },
      readableLength: {
        __proto__: null,
        enumerable: false,
        get() {
          return this._readableState.length;
        },
      },
      readableObjectMode: {
        __proto__: null,
        enumerable: false,
        get() {
          return this._readableState ? this._readableState.objectMode : false;
        },
      },
      readableEncoding: {
        __proto__: null,
        enumerable: false,
        get() {
          return this._readableState ? this._readableState.encoding : null;
        },
      },
      errored: {
        __proto__: null,
        enumerable: false,
        get() {
          return this._readableState ? this._readableState.errored : null;
        },
      },
      closed: {
        __proto__: null,
        get() {
          return this._readableState ? this._readableState.closed : false;
        },
      },
      destroyed: {
        __proto__: null,
        enumerable: false,
        get() {
          return this._readableState ? this._readableState.destroyed : false;
        },
        set(value) {
          if (!this._readableState) {
            return;
          }
          this._readableState.destroyed = value;
        },
      },
      readableEnded: {
        __proto__: null,
        enumerable: false,
        get() {
          return this._readableState ? this._readableState.endEmitted : false;
        },
      },
    });
    ObjectDefineProperties(ReadableState.prototype, {
      // Legacy getter for `pipesCount`.
      pipesCount: {
        __proto__: null,
        get() {
          return this.pipes.length;
        },
      },
      // Legacy property for `paused`.
      paused: {
        __proto__: null,
        get() {
          return this[kPaused] !== false;
        },
        set(value) {
          this[kPaused] = !!value;
        },
      },
    });
    Readable._fromList = fromList;
    function fromList(n, state) {
      if (state.length === 0) {
        return null;
      }
      let ret;
      if (state.objectMode) {
        ret = state.buffer.shift();
      } else if (!n || n >= state.length) {
        if (state.decoder) {
          ret = state.buffer.join("");
        } else if (state.buffer.length === 1) {
          ret = state.buffer.first();
        } else {
          ret = state.buffer.concat(state.length);
        }
        state.buffer.clear();
      } else {
        ret = state.buffer.consume(n, state.decoder);
      }
      return ret;
    }
    function endReadable(stream) {
      const state = stream._readableState;
      debug("endReadable", state.endEmitted);
      if (!state.endEmitted) {
        state.ended = true;
        process.nextTick(endReadableNT, state, stream);
      }
    }
    function endReadableNT(state, stream) {
      debug("endReadableNT", state.endEmitted, state.length);
      if (
        !state.errored && !state.closeEmitted && !state.endEmitted &&
        state.length === 0
      ) {
        state.endEmitted = true;
        stream.emit("end");
        if (stream.writable && stream.allowHalfOpen === false) {
          process.nextTick(endWritableNT, stream);
        } else if (state.autoDestroy) {
          const wState = stream._writableState;
          const autoDestroy = !wState || wState.autoDestroy && // We don't expect the writable to ever 'finish'
            // if writable is explicitly set to false.
            (wState.finished || wState.writable === false);
          if (autoDestroy) {
            stream.destroy();
          }
        }
      }
    }
    function endWritableNT(stream) {
      const writable = stream.writable && !stream.writableEnded &&
        !stream.destroyed;
      if (writable) {
        stream.end();
      }
    }
    Readable.from = function (iterable, opts) {
      return from(Readable, iterable, opts);
    };
    var webStreamsAdapters;
    function lazyWebStreams() {
      if (webStreamsAdapters === void 0) {
        webStreamsAdapters = {};
      }
      return webStreamsAdapters;
    }
    Readable.fromWeb = function (readableStream, options) {
      return lazyWebStreams().newStreamReadableFromReadableStream(
        readableStream,
        options,
      );
    };
    Readable.toWeb = function (streamReadable, options) {
      return lazyWebStreams().newReadableStreamFromStreamReadable(
        streamReadable,
        options,
      );
    };
    Readable.wrap = function (src, options) {
      var _ref, _src$readableObjectMo;
      return new Readable({
        objectMode:
          (_ref = (_src$readableObjectMo = src.readableObjectMode) !== null &&
            _src$readableObjectMo !== void 0
            ? _src$readableObjectMo
            : src.objectMode) !== null && _ref !== void 0
            ? _ref
            : true,
        ...options,
        destroy(err, callback) {
          destroyImpl.destroyer(src, err);
          callback(err);
        },
      }).wrap(src);
    };
  },
});

// lib/internal/streams/writable.js
var require_writable = __commonJS({
  "lib/internal/streams/writable.js"(exports, module) {
    var process = require_browser2();
    var {
      ArrayPrototypeSlice,
      Error: Error2,
      FunctionPrototypeSymbolHasInstance,
      ObjectDefineProperty,
      ObjectDefineProperties,
      ObjectSetPrototypeOf,
      StringPrototypeToLowerCase,
      Symbol: Symbol2,
      SymbolHasInstance,
    } = require_primordials();
    module.exports = Writable;
    Writable.WritableState = WritableState;
    var Stream = require_legacy().Stream;
    var { Buffer: Buffer2 } = require_buffer();
    var destroyImpl = require_destroy();
    var { addAbortSignal } = require_add_abort_signal();
    var { getHighWaterMark, getDefaultHighWaterMark } = require_state();
    var { errorOrDestroy } = destroyImpl;
    ObjectSetPrototypeOf(Writable.prototype, Stream.prototype);
    ObjectSetPrototypeOf(Writable, Stream);
    function nop() {
    }
    var kOnFinished = Symbol2("kOnFinished");
    function WritableState(options, stream, isDuplex) {
      if (typeof isDuplex !== "boolean") {
        isDuplex = stream instanceof require_duplex();
      }
      this.objectMode = !!(options && options.objectMode);
      if (isDuplex) {
        this.objectMode = this.objectMode ||
          !!(options && options.writableObjectMode);
      }
      this.highWaterMark = options
        ? getHighWaterMark(this, options, "writableHighWaterMark", isDuplex)
        : getDefaultHighWaterMark(false);
      this.finalCalled = false;
      this.needDrain = false;
      this.ending = false;
      this.ended = false;
      this.finished = false;
      this.destroyed = false;
      const noDecode = !!(options && options.decodeStrings === false);
      this.decodeStrings = !noDecode;
      const defaultEncoding = options?.defaultEncoding;
      if (defaultEncoding == null) {
        this.defaultEncoding = 'utf8';
      } else if (Buffer2.isEncoding(defaultEncoding)) {
        this.defaultEncoding = defaultEncoding;
      } else {
        throw new ERR_UNKNOWN_ENCODING(defaultEncoding);
      }
      this.length = 0;
      this.writing = false;
      this.corked = 0;
      this.sync = true;
      this.bufferProcessing = false;
      this.onwrite = onwrite.bind(void 0, stream);
      this.writecb = null;
      this.writelen = 0;
      this.afterWriteTickInfo = null;
      resetBuffer(this);
      this.pendingcb = 0;
      this.constructed = true;
      this.prefinished = false;
      this.errorEmitted = false;
      this.emitClose = !options || options.emitClose !== false;
      this.autoDestroy = !options || options.autoDestroy !== false;
      this.errored = null;
      this.closed = false;
      this.closeEmitted = false;
      this[kOnFinished] = [];
    }
    function resetBuffer(state) {
      state.buffered = [];
      state.bufferedIndex = 0;
      state.allBuffers = true;
      state.allNoop = true;
    }
    WritableState.prototype.getBuffer = function getBuffer() {
      return ArrayPrototypeSlice(this.buffered, this.bufferedIndex);
    };
    ObjectDefineProperty(WritableState.prototype, "bufferedRequestCount", {
      __proto__: null,
      get() {
        return this.buffered.length - this.bufferedIndex;
      },
    });
    function Writable(options) {
      const isDuplex = this instanceof require_duplex();
      if (!isDuplex && !FunctionPrototypeSymbolHasInstance(Writable, this)) {
        return new Writable(options);
      }
      this._writableState = new WritableState(options, this, isDuplex);
      if (options) {
        if (typeof options.write === "function") {
          this._write = options.write;
        }
        if (typeof options.writev === "function") {
          this._writev = options.writev;
        }
        if (typeof options.destroy === "function") {
          this._destroy = options.destroy;
        }
        if (typeof options.final === "function") {
          this._final = options.final;
        }
        if (typeof options.construct === "function") {
          this._construct = options.construct;
        }
        if (options.signal) {
          addAbortSignal(options.signal, this);
        }
      }
      Stream.call(this, options);
      destroyImpl.construct(this, () => {
        const state = this._writableState;
        if (!state.writing) {
          clearBuffer(this, state);
        }
        finishMaybe(this, state);
      });
    }
    ObjectDefineProperty(Writable, SymbolHasInstance, {
      __proto__: null,
      value: function (object) {
        if (FunctionPrototypeSymbolHasInstance(this, object)) {
          return true;
        }
        if (this !== Writable) {
          return false;
        }
        return object && object._writableState instanceof WritableState;
      },
    });
    Writable.prototype.pipe = function () {
      errorOrDestroy(this, new ERR_STREAM_CANNOT_PIPE());
    };
    function _write(stream, chunk, encoding, cb) {
      const state = stream._writableState;
      if (typeof encoding === "function") {
        cb = encoding;
        // Simulates https://github.com/nodejs/node/commit/dbed0319ac438dcbd6e92483f3280b1dc6767e00
        encoding = state.objectMode ? undefined : state.defaultEncoding;
      } else {
        if (!encoding) {
          // Simulates https://github.com/nodejs/node/commit/dbed0319ac438dcbd6e92483f3280b1dc6767e00
          encoding = state.objectMode ? undefined : state.defaultEncoding;
        } else if (encoding !== "buffer" && !Buffer2.isEncoding(encoding)) {
          throw new ERR_UNKNOWN_ENCODING(encoding);
        }
        if (typeof cb !== "function") {
          cb = nop;
        }
      }
      if (chunk === null) {
        throw new ERR_STREAM_NULL_VALUES();
      } else if (!state.objectMode) {
        if (typeof chunk === "string") {
          if (state.decodeStrings !== false) {
            chunk = Buffer2.from(chunk, encoding);
            encoding = "buffer";
          }
        } else if (chunk instanceof Buffer2) {
          encoding = "buffer";
        } else if (Stream._isUint8Array(chunk)) {
          chunk = Stream._uint8ArrayToBuffer(chunk);
          encoding = "buffer";
        } else {
          throw new ERR_INVALID_ARG_TYPE("chunk", [
            "string",
            "Buffer",
            "Uint8Array",
          ], chunk);
        }
      }
      let err;
      if (state.ending) {
        err = new ERR_STREAM_WRITE_AFTER_END();
      } else if (state.destroyed) {
        err = new ERR_STREAM_DESTROYED("write");
      }
      if (err) {
        process.nextTick(cb, err);
        errorOrDestroy(stream, err, true);
        return err;
      }
      state.pendingcb++;
      return writeOrBuffer(stream, state, chunk, encoding, cb);
    }
    Writable.prototype.write = function (chunk, encoding, cb) {
      return _write(this, chunk, encoding, cb) === true;
    };
    Writable.prototype.cork = function () {
      this._writableState.corked++;
    };
    Writable.prototype.uncork = function () {
      const state = this._writableState;
      if (state.corked) {
        state.corked--;
        if (!state.writing) {
          clearBuffer(this, state);
        }
      }
    };
    Writable.prototype.setDefaultEncoding = function setDefaultEncoding(
      encoding,
    ) {
      if (typeof encoding === "string") {
        encoding = StringPrototypeToLowerCase(encoding);
      }
      if (!Buffer2.isEncoding(encoding)) {
        throw new ERR_UNKNOWN_ENCODING(encoding);
      }
      this._writableState.defaultEncoding = encoding;
      return this;
    };
    function writeOrBuffer(stream, state, chunk, encoding, callback) {
      const len = state.objectMode ? 1 : chunk.length;
      state.length += len;
      const ret = state.length < state.highWaterMark;
      if (!ret) {
        state.needDrain = true;
      }
      if (
        state.writing || state.corked || state.errored || !state.constructed
      ) {
        state.buffered.push({
          chunk,
          encoding,
          callback,
        });
        if (state.allBuffers && encoding !== "buffer") {
          state.allBuffers = false;
        }
        if (state.allNoop && callback !== nop) {
          state.allNoop = false;
        }
      } else {
        state.writelen = len;
        state.writecb = callback;
        state.writing = true;
        state.sync = true;
        stream._write(chunk, encoding, state.onwrite);
        state.sync = false;
      }
      return ret && !state.errored && !state.destroyed;
    }
    function doWrite(stream, state, writev, len, chunk, encoding, cb) {
      state.writelen = len;
      state.writecb = cb;
      state.writing = true;
      state.sync = true;
      if (state.destroyed) {
        state.onwrite(new ERR_STREAM_DESTROYED("write"));
      } else if (writev) {
        stream._writev(chunk, state.onwrite);
      } else {
        stream._write(chunk, encoding, state.onwrite);
      }
      state.sync = false;
    }
    function onwriteError(stream, state, er, cb) {
      --state.pendingcb;
      cb(er);
      errorBuffer(state);
      errorOrDestroy(stream, er);
    }
    function onwrite(stream, er) {
      const state = stream._writableState;
      const sync = state.sync;
      const cb = state.writecb;
      if (typeof cb !== "function") {
        errorOrDestroy(stream, new ERR_MULTIPLE_CALLBACK());
        return;
      }
      state.writing = false;
      state.writecb = null;
      state.length -= state.writelen;
      state.writelen = 0;
      if (er) {
        er.stack;
        if (!state.errored) {
          state.errored = er;
        }
        if (stream._readableState && !stream._readableState.errored) {
          stream._readableState.errored = er;
        }
        if (sync) {
          process.nextTick(onwriteError, stream, state, er, cb);
        } else {
          onwriteError(stream, state, er, cb);
        }
      } else {
        if (state.buffered.length > state.bufferedIndex) {
          clearBuffer(stream, state);
        }
        if (sync) {
          if (
            state.afterWriteTickInfo !== null &&
            state.afterWriteTickInfo.cb === cb
          ) {
            state.afterWriteTickInfo.count++;
          } else {
            state.afterWriteTickInfo = {
              count: 1,
              cb,
              stream,
              state,
            };
            process.nextTick(afterWriteTick, state.afterWriteTickInfo);
          }
        } else {
          afterWrite(stream, state, 1, cb);
        }
      }
    }
    function afterWriteTick({ stream, state, count, cb }) {
      state.afterWriteTickInfo = null;
      return afterWrite(stream, state, count, cb);
    }
    function afterWrite(stream, state, count, cb) {
      const needDrain = !state.ending && !stream.destroyed &&
        state.length === 0 && state.needDrain;
      if (needDrain) {
        state.needDrain = false;
        stream.emit("drain");
      }
      while (count-- > 0) {
        state.pendingcb--;
        cb(null);
      }
      if (state.destroyed) {
        errorBuffer(state);
      }
      finishMaybe(stream, state);
    }
    function errorBuffer(state) {
      if (state.writing) {
        return;
      }
      for (let n = state.bufferedIndex; n < state.buffered.length; ++n) {
        var _state$errored;
        const { chunk, callback } = state.buffered[n];
        const len = state.objectMode ? 1 : chunk.length;
        state.length -= len;
        callback(
          (_state$errored = state.errored) !== null && _state$errored !== void 0
            ? _state$errored
            : new ERR_STREAM_DESTROYED("write"),
        );
      }
      const onfinishCallbacks = state[kOnFinished].splice(0);
      for (let i = 0; i < onfinishCallbacks.length; i++) {
        var _state$errored2;
        onfinishCallbacks[i](
          (_state$errored2 = state.errored) !== null &&
            _state$errored2 !== void 0
            ? _state$errored2
            : new ERR_STREAM_DESTROYED("end"),
        );
      }
      resetBuffer(state);
    }
    function clearBuffer(stream, state) {
      if (
        state.corked || state.bufferProcessing || state.destroyed ||
        !state.constructed
      ) {
        return;
      }
      const { buffered, bufferedIndex, objectMode } = state;
      const bufferedLength = buffered.length - bufferedIndex;
      if (!bufferedLength) {
        return;
      }
      let i = bufferedIndex;
      state.bufferProcessing = true;
      if (bufferedLength > 1 && stream._writev) {
        state.pendingcb -= bufferedLength - 1;
        const callback = state.allNoop ? nop : (err) => {
          for (let n = i; n < buffered.length; ++n) {
            buffered[n].callback(err);
          }
        };
        const chunks = state.allNoop && i === 0
          ? buffered
          : ArrayPrototypeSlice(buffered, i);
        chunks.allBuffers = state.allBuffers;
        doWrite(stream, state, true, state.length, chunks, "", callback);
        resetBuffer(state);
      } else {
        do {
          const { chunk, encoding, callback } = buffered[i];
          buffered[i++] = null;
          const len = objectMode ? 1 : chunk.length;
          doWrite(stream, state, false, len, chunk, encoding, callback);
        } while (i < buffered.length && !state.writing);
        if (i === buffered.length) {
          resetBuffer(state);
        } else if (i > 256) {
          buffered.splice(0, i);
          state.bufferedIndex = 0;
        } else {
          state.bufferedIndex = i;
        }
      }
      state.bufferProcessing = false;
    }
    Writable.prototype._write = function (chunk, encoding, cb) {
      if (this._writev) {
        this._writev(
          [
            {
              chunk,
              encoding,
            },
          ],
          cb,
        );
      } else {
        throw new ERR_METHOD_NOT_IMPLEMENTED("_write()");
      }
    };
    Writable.prototype._writev = null;
    Writable.prototype.end = function (chunk, encoding, cb) {
      const state = this._writableState;
      if (typeof chunk === "function") {
        cb = chunk;
        chunk = null;
        encoding = null;
      } else if (typeof encoding === "function") {
        cb = encoding;
        encoding = null;
      }
      let err;
      if (chunk !== null && chunk !== void 0) {
        const ret = _write(this, chunk, encoding);
        if (ret instanceof Error2) {
          err = ret;
        }
      }
      if (state.corked) {
        state.corked = 1;
        this.uncork();
      }
      if (err) {
      } else if (!state.errored && !state.ending) {
        state.ending = true;
        finishMaybe(this, state, true);
        state.ended = true;
      } else if (state.finished) {
        err = new ERR_STREAM_ALREADY_FINISHED("end");
      } else if (state.destroyed) {
        err = new ERR_STREAM_DESTROYED("end");
      }
      if (typeof cb === "function") {
        if (err) {
          process.nextTick(cb, err);
        } else if (state.finished) {
          process.nextTick(cb, null);
        } else {
          state[kOnFinished].push(cb);
        }
      }
      return this;
    };
    function needFinish(state) {
      return state.ending && !state.destroyed && state.constructed &&
        state.length === 0 && !state.errored && state.buffered.length === 0 &&
        !state.finished && !state.writing && !state.errorEmitted &&
        !state.closeEmitted;
    }
    function callFinal(stream, state) {
      let called = false;
      function onFinish(err) {
        if (called) {
          errorOrDestroy(
            stream,
            err !== null && err !== void 0 ? err : ERR_MULTIPLE_CALLBACK(),
          );
          return;
        }
        called = true;
        state.pendingcb--;
        if (err) {
          const onfinishCallbacks = state[kOnFinished].splice(0);
          for (let i = 0; i < onfinishCallbacks.length; i++) {
            onfinishCallbacks[i](err);
          }
          errorOrDestroy(stream, err, state.sync);
        } else if (needFinish(state)) {
          state.prefinished = true;
          stream.emit("prefinish");
          state.pendingcb++;
          process.nextTick(finish, stream, state);
        }
      }
      state.sync = true;
      state.pendingcb++;
      try {
        stream._final(onFinish);
      } catch (err) {
        onFinish(err);
      }
      state.sync = false;
    }
    function prefinish(stream, state) {
      if (!state.prefinished && !state.finalCalled) {
        if (typeof stream._final === "function" && !state.destroyed) {
          state.finalCalled = true;
          callFinal(stream, state);
        } else {
          state.prefinished = true;
          stream.emit("prefinish");
        }
      }
    }
    function finishMaybe(stream, state, sync) {
      if (needFinish(state)) {
        prefinish(stream, state);
        if (state.pendingcb === 0) {
          if (sync) {
            state.pendingcb++;
            process.nextTick(
              (stream2, state2) => {
                if (needFinish(state2)) {
                  finish(stream2, state2);
                } else {
                  state2.pendingcb--;
                }
              },
              stream,
              state,
            );
          } else if (needFinish(state)) {
            state.pendingcb++;
            finish(stream, state);
          }
        }
      }
    }
    function finish(stream, state) {
      state.pendingcb--;
      state.finished = true;
      const onfinishCallbacks = state[kOnFinished].splice(0);
      for (let i = 0; i < onfinishCallbacks.length; i++) {
        onfinishCallbacks[i](null);
      }
      stream.emit("finish");
      if (state.autoDestroy) {
        const rState = stream._readableState;
        const autoDestroy = !rState || rState.autoDestroy && // We don't expect the readable to ever 'end'
          // if readable is explicitly set to false.
          (rState.endEmitted || rState.readable === false);
        if (autoDestroy) {
          stream.destroy();
        }
      }
    }
    ObjectDefineProperties(Writable.prototype, {
      closed: {
        __proto__: null,
        get() {
          return this._writableState ? this._writableState.closed : false;
        },
      },
      destroyed: {
        __proto__: null,
        get() {
          return this._writableState ? this._writableState.destroyed : false;
        },
        set(value) {
          if (this._writableState) {
            this._writableState.destroyed = value;
          }
        },
      },
      writable: {
        __proto__: null,
        get() {
          const w = this._writableState;
          return !!w && w.writable !== false && !w.destroyed && !w.errored &&
            !w.ending && !w.ended;
        },
        set(val) {
          if (this._writableState) {
            this._writableState.writable = !!val;
          }
        },
      },
      writableFinished: {
        __proto__: null,
        get() {
          return this._writableState ? this._writableState.finished : false;
        },
      },
      writableObjectMode: {
        __proto__: null,
        get() {
          return this._writableState ? this._writableState.objectMode : false;
        },
      },
      writableBuffer: {
        __proto__: null,
        get() {
          return this._writableState && this._writableState.getBuffer();
        },
      },
      writableEnded: {
        __proto__: null,
        get() {
          return this._writableState ? this._writableState.ending : false;
        },
      },
      writableNeedDrain: {
        __proto__: null,
        get() {
          const wState = this._writableState;
          if (!wState) {
            return false;
          }
          return !wState.destroyed && !wState.ending && wState.needDrain;
        },
      },
      writableHighWaterMark: {
        __proto__: null,
        get() {
          return this._writableState && this._writableState.highWaterMark;
        },
      },
      writableCorked: {
        __proto__: null,
        get() {
          return this._writableState ? this._writableState.corked : 0;
        },
      },
      writableLength: {
        __proto__: null,
        get() {
          return this._writableState && this._writableState.length;
        },
      },
      errored: {
        __proto__: null,
        enumerable: false,
        get() {
          return this._writableState ? this._writableState.errored : null;
        },
      },
      writableAborted: {
        __proto__: null,
        enumerable: false,
        get: function () {
          return !!(this._writableState.writable !== false &&
            (this._writableState.destroyed || this._writableState.errored) &&
            !this._writableState.finished);
        },
      },
    });
    var destroy = destroyImpl.destroy;
    Writable.prototype.destroy = function (err, cb) {
      const state = this._writableState;
      if (
        !state.destroyed &&
        (state.bufferedIndex < state.buffered.length ||
          state[kOnFinished].length)
      ) {
        process.nextTick(errorBuffer, state);
      }
      destroy.call(this, err, cb);
      return this;
    };
    Writable.prototype._undestroy = destroyImpl.undestroy;
    Writable.prototype._destroy = function (err, cb) {
      cb(err);
    };
    Writable.prototype[EE.captureRejectionSymbol] = function (err) {
      this.destroy(err);
    };
    var webStreamsAdapters;
    function lazyWebStreams() {
      if (webStreamsAdapters === void 0) {
        webStreamsAdapters = {};
      }
      return webStreamsAdapters;
    }
    Writable.fromWeb = function (writableStream, options) {
      return lazyWebStreams().newStreamWritableFromWritableStream(
        writableStream,
        options,
      );
    };
    Writable.toWeb = function (streamWritable) {
      return lazyWebStreams().newWritableStreamFromStreamWritable(
        streamWritable,
      );
    };
  },
});

// lib/internal/streams/duplexify.js
var require_duplexify = __commonJS({
  "lib/internal/streams/duplexify.js"(exports, module) {
    var process = require_browser2();
    var bufferModule = require_buffer();
    var {
      isReadable,
      isWritable,
      isIterable,
      isNodeStream,
      isReadableNodeStream,
      isWritableNodeStream,
      isDuplexNodeStream,
    } = require_utils();
    var eos = require_end_of_stream();
    var { destroyer } = require_destroy();
    var Duplex = require_duplex();
    var Readable = require_readable();
    var from = require_from();
    var isBlob = typeof Blob !== "undefined"
      ? function isBlob2(b) {
        return b instanceof Blob;
      }
      : function isBlob2(b) {
        return false;
      };
    var { FunctionPrototypeCall } = require_primordials();
    var Duplexify = class extends Duplex {
      constructor(options) {
        super(options);
        if (
          (options === null || options === void 0
            ? void 0
            : options.readable) === false
        ) {
          this._readableState.readable = false;
          this._readableState.ended = true;
          this._readableState.endEmitted = true;
        }
        if (
          (options === null || options === void 0
            ? void 0
            : options.writable) === false
        ) {
          this._writableState.writable = false;
          this._writableState.ending = true;
          this._writableState.ended = true;
          this._writableState.finished = true;
        }
      }
    };
    module.exports = function duplexify(body, name) {
      if (isDuplexNodeStream(body)) {
        return body;
      }
      if (isReadableNodeStream(body)) {
        return _duplexify({
          readable: body,
        });
      }
      if (isWritableNodeStream(body)) {
        return _duplexify({
          writable: body,
        });
      }
      if (isNodeStream(body)) {
        return _duplexify({
          writable: false,
          readable: false,
        });
      }

      if (typeof body === "function") {
        const { value, write, final, destroy } = fromAsyncGen(body);
        if (isIterable(value)) {
          return from(Duplexify, value, {
            // TODO (ronag): highWaterMark?
            objectMode: true,
            write,
            final,
            destroy,
          });
        }
        const then2 = value === null || value === void 0 ? void 0 : value.then;
        if (typeof then2 === "function") {
          let d;
          const promise = FunctionPrototypeCall(
            then2,
            value,
            (val) => {
              if (val != null) {
                throw new ERR_INVALID_RETURN_VALUE("nully", "body", val);
              }
            },
            (err) => {
              destroyer(d, err);
            },
          );
          return d = new Duplexify({
            // TODO (ronag): highWaterMark?
            objectMode: true,
            readable: false,
            write,
            final(cb) {
              final(async () => {
                try {
                  await promise;
                  process.nextTick(cb, null);
                } catch (err) {
                  process.nextTick(cb, err);
                }
              });
            },
            destroy,
          });
        }
        throw new ERR_INVALID_RETURN_VALUE(
          "Iterable, AsyncIterable or AsyncFunction",
          name,
          value,
        );
      }
      if (isBlob(body)) {
        return duplexify(body.arrayBuffer());
      }
      if (isIterable(body)) {
        return from(Duplexify, body, {
          // TODO (ronag): highWaterMark?
          objectMode: true,
          writable: false,
        });
      }
      if (
        typeof (body === null || body === void 0 ? void 0 : body.writable) ===
        "object" ||
        typeof (body === null || body === void 0 ? void 0 : body.readable) ===
        "object"
      ) {
        const readable = body !== null && body !== void 0 && body.readable
          ? isReadableNodeStream(
            body === null || body === void 0 ? void 0 : body.readable,
          )
            ? body === null || body === void 0 ? void 0 : body.readable
            : duplexify(body.readable)
          : void 0;
        const writable = body !== null && body !== void 0 && body.writable
          ? isWritableNodeStream(
            body === null || body === void 0 ? void 0 : body.writable,
          )
            ? body === null || body === void 0 ? void 0 : body.writable
            : duplexify(body.writable)
          : void 0;
        return _duplexify({
          readable,
          writable,
        });
      }
      const then = body === null || body === void 0 ? void 0 : body.then;
      if (typeof then === "function") {
        let d;
        FunctionPrototypeCall(
          then,
          body,
          (val) => {
            if (val != null) {
              d.push(val);
            }
            d.push(null);
          },
          (err) => {
            destroyer(d, err);
          },
        );
        return d = new Duplexify({
          objectMode: true,
          writable: false,
          read() {
          },
        });
      }
      throw new ERR_INVALID_ARG_TYPE(
        name,
        [
          "Blob",
          "ReadableStream",
          "WritableStream",
          "Stream",
          "Iterable",
          "AsyncIterable",
          "Function",
          "{ readable, writable } pair",
          "Promise",
        ],
        body,
      );
    };
    function fromAsyncGen(fn) {
      let { promise, resolve } = createDeferredPromise();
      const ac = new AbortController();
      const signal = ac.signal;
      const value = fn(
        async function* () {
          while (true) {
            const _promise = promise;
            promise = null;
            const { chunk, done, cb } = await _promise;
            process.nextTick(cb);
            if (done) {
              return;
            }
            if (signal.aborted) {
              throw new AbortError(void 0, {
                cause: signal.reason,
              });
            }
            ({ promise, resolve } = createDeferredPromise());
            yield chunk;
          }
        }(),
        {
          signal,
        },
      );
      return {
        value,
        write(chunk, encoding, cb) {
          const _resolve = resolve;
          resolve = null;
          _resolve({
            chunk,
            done: false,
            cb,
          });
        },
        final(cb) {
          const _resolve = resolve;
          resolve = null;
          _resolve({
            done: true,
            cb,
          });
        },
        destroy(err, cb) {
          ac.abort();
          cb(err);
        },
      };
    }
    function _duplexify(pair) {
      const r = pair.readable && typeof pair.readable.read !== "function"
        ? Readable.wrap(pair.readable)
        : pair.readable;
      const w = pair.writable;
      let readable = !!isReadable(r);
      let writable = !!isWritable(w);
      let ondrain;
      let onfinish;
      let onreadable;
      let onclose;
      let d;
      function onfinished(err) {
        const cb = onclose;
        onclose = null;
        if (cb) {
          cb(err);
        } else if (err) {
          d.destroy(err);
        }
      }
      d = new Duplexify({
        // TODO (ronag): highWaterMark?
        readableObjectMode:
          !!(r !== null && r !== void 0 && r.readableObjectMode),
        writableObjectMode:
          !!(w !== null && w !== void 0 && w.writableObjectMode),
        readable,
        writable,
      });
      if (writable) {
        eos(w, (err) => {
          writable = false;
          if (err) {
            destroyer(r, err);
          }
          onfinished(err);
        });
        d._write = function (chunk, encoding, callback) {
          if (w.write(chunk, encoding)) {
            callback();
          } else {
            ondrain = callback;
          }
        };
        d._final = function (callback) {
          w.end();
          onfinish = callback;
        };
        w.on("drain", function () {
          if (ondrain) {
            const cb = ondrain;
            ondrain = null;
            cb();
          }
        });
        w.on("finish", function () {
          if (onfinish) {
            const cb = onfinish;
            onfinish = null;
            cb();
          }
        });
      }
      if (readable) {
        eos(r, (err) => {
          readable = false;
          if (err) {
            destroyer(r, err);
          }
          onfinished(err);
        });
        r.on("readable", function () {
          if (onreadable) {
            const cb = onreadable;
            onreadable = null;
            cb();
          }
        });
        r.on("end", function () {
          d.push(null);
        });
        d._read = function () {
          while (true) {
            const buf = r.read();
            if (buf === null) {
              onreadable = d._read;
              return;
            }
            if (!d.push(buf)) {
              return;
            }
          }
        };
      }
      d._destroy = function (err, callback) {
        if (!err && onclose !== null) {
          err = new AbortError();
        }
        onreadable = null;
        ondrain = null;
        onfinish = null;
        if (onclose === null) {
          callback(err);
        } else {
          onclose = callback;
          destroyer(w, err);
          destroyer(r, err);
        }
      };
      return d;
    }
  },
});

// lib/internal/streams/duplex.js
var require_duplex = __commonJS({
  "lib/internal/streams/duplex.js"(exports, module) {
    "use strict";
    var {
      ObjectDefineProperties,
      ObjectGetOwnPropertyDescriptor,
      ObjectKeys,
      ObjectSetPrototypeOf,
    } = require_primordials();
    module.exports = Duplex;
    var Readable = require_readable();
    var Writable = require_writable();
    ObjectSetPrototypeOf(Duplex.prototype, Readable.prototype);
    ObjectSetPrototypeOf(Duplex, Readable);
    {
      const keys = ObjectKeys(Writable.prototype);
      for (let i = 0; i < keys.length; i++) {
        const method = keys[i];
        if (!Duplex.prototype[method]) {
          Duplex.prototype[method] = Writable.prototype[method];
        }
      }
    }
    function Duplex(options) {
      if (!(this instanceof Duplex)) {
        return new Duplex(options);
      }
      Readable.call(this, options);
      Writable.call(this, options);
      if (options) {
        this.allowHalfOpen = options.allowHalfOpen !== false;
        if (options.readable === false) {
          this._readableState.readable = false;
          this._readableState.ended = true;
          this._readableState.endEmitted = true;
        }
        if (options.writable === false) {
          this._writableState.writable = false;
          this._writableState.ending = true;
          this._writableState.ended = true;
          this._writableState.finished = true;
        }
      } else {
        this.allowHalfOpen = true;
      }
    }
    ObjectDefineProperties(Duplex.prototype, {
      writable: {
        __proto__: null,
        ...ObjectGetOwnPropertyDescriptor(Writable.prototype, "writable"),
      },
      writableHighWaterMark: {
        __proto__: null,
        ...ObjectGetOwnPropertyDescriptor(
          Writable.prototype,
          "writableHighWaterMark",
        ),
      },
      writableObjectMode: {
        __proto__: null,
        ...ObjectGetOwnPropertyDescriptor(
          Writable.prototype,
          "writableObjectMode",
        ),
      },
      writableBuffer: {
        __proto__: null,
        ...ObjectGetOwnPropertyDescriptor(Writable.prototype, "writableBuffer"),
      },
      writableLength: {
        __proto__: null,
        ...ObjectGetOwnPropertyDescriptor(Writable.prototype, "writableLength"),
      },
      writableFinished: {
        __proto__: null,
        ...ObjectGetOwnPropertyDescriptor(
          Writable.prototype,
          "writableFinished",
        ),
      },
      writableCorked: {
        __proto__: null,
        ...ObjectGetOwnPropertyDescriptor(Writable.prototype, "writableCorked"),
      },
      writableEnded: {
        __proto__: null,
        ...ObjectGetOwnPropertyDescriptor(Writable.prototype, "writableEnded"),
      },
      writableNeedDrain: {
        __proto__: null,
        ...ObjectGetOwnPropertyDescriptor(
          Writable.prototype,
          "writableNeedDrain",
        ),
      },
      destroyed: {
        __proto__: null,
        get() {
          if (
            this._readableState === void 0 || this._writableState === void 0
          ) {
            return false;
          }
          return this._readableState.destroyed && this._writableState.destroyed;
        },
        set(value) {
          if (this._readableState && this._writableState) {
            this._readableState.destroyed = value;
            this._writableState.destroyed = value;
          }
        },
      },
    });
    var webStreamsAdapters;
    function lazyWebStreams() {
      if (webStreamsAdapters === void 0) {
        webStreamsAdapters = {};
      }
      return webStreamsAdapters;
    }
    Duplex.fromWeb = function (pair, options) {
      return lazyWebStreams().newStreamDuplexFromReadableWritablePair(
        pair,
        options,
      );
    };
    Duplex.toWeb = function (duplex) {
      return lazyWebStreams().newReadableWritablePairFromDuplex(duplex);
    };
    var duplexify;
    Duplex.from = function (body) {
      if (!duplexify) {
        duplexify = require_duplexify();
      }
      return duplexify(body, "body");
    };
  },
});

// lib/internal/streams/transform.js
var require_transform = __commonJS({
  "lib/internal/streams/transform.js"(exports, module) {
    "use strict";
    var { ObjectSetPrototypeOf, Symbol: Symbol2 } = require_primordials();
    module.exports = Transform;
    var Duplex = require_duplex();
    var { getHighWaterMark } = require_state();
    ObjectSetPrototypeOf(Transform.prototype, Duplex.prototype);
    ObjectSetPrototypeOf(Transform, Duplex);
    var kCallback = Symbol2("kCallback");
    function Transform(options) {
      if (!(this instanceof Transform)) {
        return new Transform(options);
      }
      const readableHighWaterMark = options
        ? getHighWaterMark(this, options, "readableHighWaterMark", true)
        : null;
      if (readableHighWaterMark === 0) {
        options = {
          ...options,
          highWaterMark: null,
          readableHighWaterMark,
          // TODO (ronag): 0 is not optimal since we have
          // a "bug" where we check needDrain before calling _write and not after.
          // Refs: https://github.com/nodejs/node/pull/32887
          // Refs: https://github.com/nodejs/node/pull/35941
          writableHighWaterMark: options.writableHighWaterMark || 0,
        };
      }
      Duplex.call(this, options);
      this._readableState.sync = false;
      this[kCallback] = null;
      if (options) {
        if (typeof options.transform === "function") {
          this._transform = options.transform;
        }
        if (typeof options.flush === "function") {
          this._flush = options.flush;
        }
      }
      this.on("prefinish", prefinish);
    }
    function final(cb) {
      if (typeof this._flush === "function" && !this.destroyed) {
        this._flush((er, data) => {
          if (er) {
            if (cb) {
              cb(er);
            } else {
              this.destroy(er);
            }
            return;
          }
          if (data != null) {
            this.push(data);
          }
          this.push(null);
          if (cb) {
            cb();
          }
        });
      } else {
        this.push(null);
        if (cb) {
          cb();
        }
      }
    }
    function prefinish() {
      if (this._final !== final) {
        final.call(this);
      }
    }
    Transform.prototype._final = final;
    Transform.prototype._transform = function (chunk, encoding, callback) {
      throw new ERR_METHOD_NOT_IMPLEMENTED("_transform()");
    };
    Transform.prototype._write = function (chunk, encoding, callback) {
      const rState = this._readableState;
      const wState = this._writableState;
      const length = rState.length;
      this._transform(chunk, encoding, (err, val) => {
        if (err) {
          callback(err);
          return;
        }
        if (val != null) {
          this.push(val);
        }
        if (
          wState.ended || // Backwards compat.
          length === rState.length || // Backwards compat.
          rState.length < rState.highWaterMark
        ) {
          callback();
        } else {
          this[kCallback] = callback;
        }
      });
    };
    Transform.prototype._read = function () {
      if (this[kCallback]) {
        const callback = this[kCallback];
        this[kCallback] = null;
        callback();
      }
    };
  },
});

// lib/internal/streams/passthrough.js
var require_passthrough = __commonJS({
  "lib/internal/streams/passthrough.js"(exports, module) {
    "use strict";
    var { ObjectSetPrototypeOf } = require_primordials();
    module.exports = PassThrough;
    var Transform = require_transform();
    ObjectSetPrototypeOf(PassThrough.prototype, Transform.prototype);
    ObjectSetPrototypeOf(PassThrough, Transform);
    function PassThrough(options) {
      if (!(this instanceof PassThrough)) {
        return new PassThrough(options);
      }
      Transform.call(this, options);
    }
    PassThrough.prototype._transform = function (chunk, encoding, cb) {
      cb(null, chunk);
    };
  },
});

// lib/internal/streams/pipeline.js
var require_pipeline = __commonJS({
  "lib/internal/streams/pipeline.js"(exports, module) {
    var process = require_browser2();
    var { ArrayIsArray, Promise: Promise2, SymbolAsyncIterator } =
      require_primordials();
    var eos = require_end_of_stream();
    var destroyImpl = require_destroy();
    var Duplex = require_duplex();
    var { validateFunction, validateAbortSignal } = require_validators();
    var { isIterable, isReadable, isReadableNodeStream, isNodeStream } =
      require_utils();
    var PassThrough;
    var Readable;
    function destroyer(stream, reading, writing) {
      let finished = false;
      stream.on("close", () => {
        finished = true;
      });
      const cleanup = eos(
        stream,
        {
          readable: reading,
          writable: writing,
        },
        (err) => {
          finished = !err;
        },
      );
      return {
        destroy: (err) => {
          if (finished) {
            return;
          }
          finished = true;
          destroyImpl.destroyer(
            stream,
            err || new ERR_STREAM_DESTROYED("pipe"),
          );
        },
        cleanup,
      };
    }
    function popCallback(streams) {
      validateFunction(
        streams[streams.length - 1],
        "streams[stream.length - 1]",
      );
      return streams.pop();
    }
    function makeAsyncIterable(val) {
      if (isIterable(val)) {
        return val;
      } else if (isReadableNodeStream(val)) {
        return fromReadable(val);
      }
      throw new ERR_INVALID_ARG_TYPE("val", [
        "Readable",
        "Iterable",
        "AsyncIterable",
      ], val);
    }
    async function* fromReadable(val) {
      if (!Readable) {
        Readable = require_readable();
      }
      yield* Readable.prototype[SymbolAsyncIterator].call(val);
    }
    async function pump(iterable, writable, finish, { end }) {
      let error;
      let onresolve = null;
      const resume = (err) => {
        if (err) {
          error = err;
        }
        if (onresolve) {
          const callback = onresolve;
          onresolve = null;
          callback();
        }
      };
      const wait = () =>
        new Promise2((resolve, reject) => {
          if (error) {
            reject(error);
          } else {
            onresolve = () => {
              if (error) {
                reject(error);
              } else {
                resolve();
              }
            };
          }
        });
      writable.on("drain", resume);
      const cleanup = eos(
        writable,
        {
          readable: false,
        },
        resume,
      );
      try {
        if (writable.writableNeedDrain) {
          await wait();
        }
        for await (const chunk of iterable) {
          if (!writable.write(chunk)) {
            await wait();
          }
        }
        if (end) {
          writable.end();
        }
        await wait();
        finish();
      } catch (err) {
        finish(error !== err ? aggregateTwoErrors(error, err) : err);
      } finally {
        cleanup();
        writable.off("drain", resume);
      }
    }
    function pipeline(...streams) {
      return pipelineImpl(streams, once(popCallback(streams)));
    }
    function pipelineImpl(streams, callback, opts) {
      if (streams.length === 1 && ArrayIsArray(streams[0])) {
        streams = streams[0];
      }
      if (streams.length < 2) {
        throw new ERR_MISSING_ARGS("streams");
      }
      const ac = new AbortController();
      const signal = ac.signal;
      const outerSignal = opts === null || opts === void 0
        ? void 0
        : opts.signal;
      const lastStreamCleanup = [];
      validateAbortSignal(outerSignal, "options.signal");
      function abort() {
        finishImpl(new AbortError());
      }
      outerSignal === null || outerSignal === void 0
        ? void 0
        : outerSignal.addEventListener("abort", abort);
      let error;
      let value;
      const destroys = [];
      let finishCount = 0;
      function finish(err) {
        finishImpl(err, --finishCount === 0);
      }
      function finishImpl(err, final) {
        if (err && (!error || error.code === "ERR_STREAM_PREMATURE_CLOSE")) {
          error = err;
        }
        if (!error && !final) {
          return;
        }
        while (destroys.length) {
          destroys.shift()(error);
        }
        outerSignal === null || outerSignal === void 0
          ? void 0
          : outerSignal.removeEventListener("abort", abort);
        ac.abort();
        if (final) {
          if (!error) {
            lastStreamCleanup.forEach((fn) => fn());
          }
          process.nextTick(callback, error, value);
        }
      }
      let ret;
      for (let i = 0; i < streams.length; i++) {
        const stream = streams[i];
        const reading = i < streams.length - 1;
        const writing = i > 0;
        const end = reading ||
          (opts === null || opts === void 0 ? void 0 : opts.end) !== false;
        const isLastStream = i === streams.length - 1;
        if (isNodeStream(stream)) {
          let onError2 = function (err) {
            if (
              err && err.name !== "AbortError" &&
              err.code !== "ERR_STREAM_PREMATURE_CLOSE"
            ) {
              finish(err);
            }
          };
          var onError = onError2;
          if (end) {
            const { destroy, cleanup } = destroyer(stream, reading, writing);
            destroys.push(destroy);
            if (isReadable(stream) && isLastStream) {
              lastStreamCleanup.push(cleanup);
            }
          }
          stream.on("error", onError2);
          if (isReadable(stream) && isLastStream) {
            lastStreamCleanup.push(() => {
              stream.removeListener("error", onError2);
            });
          }
        }
        if (i === 0) {
          if (typeof stream === "function") {
            ret = stream({
              signal,
            });
            if (!isIterable(ret)) {
              throw new ERR_INVALID_RETURN_VALUE(
                "Iterable, AsyncIterable or Stream",
                "source",
                ret,
              );
            }
          } else if (isIterable(stream) || isReadableNodeStream(stream)) {
            ret = stream;
          } else {
            ret = Duplex.from(stream);
          }
        } else if (typeof stream === "function") {
          ret = makeAsyncIterable(ret);
          ret = stream(ret, {
            signal,
          });
          if (reading) {
            if (!isIterable(ret, true)) {
              throw new ERR_INVALID_RETURN_VALUE(
                "AsyncIterable",
                `transform[${i - 1}]`,
                ret,
              );
            }
          } else {
            var _ret;
            if (!PassThrough) {
              PassThrough = require_passthrough();
            }
            const pt = new PassThrough({
              objectMode: true,
            });
            const then = (_ret = ret) === null || _ret === void 0
              ? void 0
              : _ret.then;
            if (typeof then === "function") {
              finishCount++;
              then.call(
                ret,
                (val) => {
                  value = val;
                  if (val != null) {
                    pt.write(val);
                  }
                  if (end) {
                    pt.end();
                  }
                  process.nextTick(finish);
                },
                (err) => {
                  pt.destroy(err);
                  process.nextTick(finish, err);
                },
              );
            } else if (isIterable(ret, true)) {
              finishCount++;
              pump(ret, pt, finish, {
                end,
              });
            } else {
              throw new ERR_INVALID_RETURN_VALUE(
                "AsyncIterable or Promise",
                "destination",
                ret,
              );
            }
            ret = pt;
            const { destroy, cleanup } = destroyer(ret, false, true);
            destroys.push(destroy);
            if (isLastStream) {
              lastStreamCleanup.push(cleanup);
            }
          }
        } else if (isNodeStream(stream)) {
          if (isReadableNodeStream(ret)) {
            finishCount += 2;
            const cleanup = pipe(ret, stream, finish, {
              end,
            });
            if (isReadable(stream) && isLastStream) {
              lastStreamCleanup.push(cleanup);
            }
          } else if (isIterable(ret)) {
            finishCount++;
            pump(ret, stream, finish, {
              end,
            });
          } else {
            throw new ERR_INVALID_ARG_TYPE("val", [
              "Readable",
              "Iterable",
              "AsyncIterable",
            ], ret);
          }
          ret = stream;
        } else {
          ret = Duplex.from(stream);
        }
      }
      if (
        signal !== null && signal !== void 0 && signal.aborted ||
        outerSignal !== null && outerSignal !== void 0 && outerSignal.aborted
      ) {
        process.nextTick(abort);
      }
      return ret;
    }
    function pipe(src, dst, finish, { end }) {
      let ended = false;
      dst.on("close", () => {
        if (!ended) {
          finish(new ERR_STREAM_PREMATURE_CLOSE());
        }
      });
      src.pipe(dst, {
        end,
      });
      if (end) {
        src.once("end", () => {
          ended = true;
          dst.end();
        });
      } else {
        finish();
      }
      eos(
        src,
        {
          readable: true,
          writable: false,
        },
        (err) => {
          const rState = src._readableState;
          if (
            err && err.code === "ERR_STREAM_PREMATURE_CLOSE" && rState &&
            rState.ended && !rState.errored && !rState.errorEmitted
          ) {
            src.once("end", finish).once("error", finish);
          } else {
            finish(err);
          }
        },
      );
      return eos(
        dst,
        {
          readable: false,
          writable: true,
        },
        finish,
      );
    }
    module.exports = {
      pipelineImpl,
      pipeline,
    };
  },
});

// lib/internal/streams/compose.js
var require_compose = __commonJS({
  "lib/internal/streams/compose.js"(exports, module) {
    "use strict";
    var { pipeline } = require_pipeline();
    var Duplex = require_duplex();
    var { destroyer } = require_destroy();
    var { isNodeStream, isReadable, isWritable } = require_utils();
    module.exports = function compose(...streams) {
      if (streams.length === 0) {
        throw new ERR_MISSING_ARGS("streams");
      }
      if (streams.length === 1) {
        return Duplex.from(streams[0]);
      }
      const orgStreams = [...streams];
      if (typeof streams[0] === "function") {
        streams[0] = Duplex.from(streams[0]);
      }
      if (typeof streams[streams.length - 1] === "function") {
        const idx = streams.length - 1;
        streams[idx] = Duplex.from(streams[idx]);
      }
      for (let n = 0; n < streams.length; ++n) {
        if (!isNodeStream(streams[n])) {
          continue;
        }
        if (n < streams.length - 1 && !isReadable(streams[n])) {
          throw new ERR_INVALID_ARG_VALUE(
            `streams[${n}]`,
            orgStreams[n],
            "must be readable",
          );
        }
        if (n > 0 && !isWritable(streams[n])) {
          throw new ERR_INVALID_ARG_VALUE(
            `streams[${n}]`,
            orgStreams[n],
            "must be writable",
          );
        }
      }
      let ondrain;
      let onfinish;
      let onreadable;
      let onclose;
      let d;
      function onfinished(err) {
        const cb = onclose;
        onclose = null;
        if (cb) {
          cb(err);
        } else if (err) {
          d.destroy(err);
        } else if (!readable && !writable) {
          d.destroy();
        }
      }
      const head = streams[0];
      const tail = pipeline(streams, onfinished);
      const writable = !!isWritable(head);
      const readable = !!isReadable(tail);
      d = new Duplex({
        // TODO (ronag): highWaterMark?
        writableObjectMode:
          !!(head !== null && head !== void 0 && head.writableObjectMode),
        readableObjectMode:
          !!(tail !== null && tail !== void 0 && tail.writableObjectMode),
        writable,
        readable,
      });
      if (writable) {
        d._write = function (chunk, encoding, callback) {
          if (head.write(chunk, encoding)) {
            callback();
          } else {
            ondrain = callback;
          }
        };
        d._final = function (callback) {
          head.end();
          onfinish = callback;
        };
        head.on("drain", function () {
          if (ondrain) {
            const cb = ondrain;
            ondrain = null;
            cb();
          }
        });
        tail.on("finish", function () {
          if (onfinish) {
            const cb = onfinish;
            onfinish = null;
            cb();
          }
        });
      }
      if (readable) {
        tail.on("readable", function () {
          if (onreadable) {
            const cb = onreadable;
            onreadable = null;
            cb();
          }
        });
        tail.on("end", function () {
          d.push(null);
        });
        d._read = function () {
          while (true) {
            const buf = tail.read();
            if (buf === null) {
              onreadable = d._read;
              return;
            }
            if (!d.push(buf)) {
              return;
            }
          }
        };
      }
      d._destroy = function (err, callback) {
        if (!err && onclose !== null) {
          err = new AbortError();
        }
        onreadable = null;
        ondrain = null;
        onfinish = null;
        if (onclose === null) {
          callback(err);
        } else {
          onclose = callback;
          destroyer(tail, err);
        }
      };
      return d;
    };
  },
});

// lib/stream/promises.js
var require_promises = __commonJS({
  "lib/stream/promises.js"(exports, module) {
    "use strict";
    var { ArrayPrototypePop, Promise: Promise2 } = require_primordials();
    var { isIterable, isNodeStream } = require_utils();
    var { pipelineImpl: pl } = require_pipeline();
    var { finished } = require_end_of_stream();
    function pipeline(...streams) {
      return new Promise2((resolve, reject) => {
        let signal;
        let end;
        const lastArg = streams[streams.length - 1];
        if (
          lastArg && typeof lastArg === "object" && !isNodeStream(lastArg) &&
          !isIterable(lastArg)
        ) {
          const options = ArrayPrototypePop(streams);
          signal = options.signal;
          end = options.end;
        }
        pl(
          streams,
          (err, value) => {
            if (err) {
              reject(err);
            } else {
              resolve(value);
            }
          },
          {
            signal,
            end,
          },
        );
      });
    }
    module.exports = {
      finished,
      pipeline,
    };
  },
});

// lib/stream.js
var require_stream = __commonJS({
  "lib/stream.js"(exports, module) {
    var { Buffer: Buffer2 } = require_buffer();
    var { ObjectDefineProperty, ObjectKeys, ReflectApply } =
      require_primordials();
    var { streamReturningOperators, promiseReturningOperators } =
      require_operators();
    var compose = require_compose();
    var { pipeline } = require_pipeline();
    var { destroyer } = require_destroy();
    var eos = require_end_of_stream();
    var promises = require_promises();
    var utils = require_utils();
    var Stream = module.exports = require_legacy().Stream;
    Stream.isDisturbed = utils.isDisturbed;
    Stream.isErrored = utils.isErrored;
    Stream.isReadable = utils.isReadable;
    Stream.Readable = require_readable();
    for (const key of ObjectKeys(streamReturningOperators)) {
      let fn2 = function (...args) {
        if (new.target) {
          throw ERR_ILLEGAL_CONSTRUCTOR();
        }
        return Stream.Readable.from(ReflectApply(op, this, args));
      };
      fn = fn2;
      const op = streamReturningOperators[key];
      ObjectDefineProperty(fn2, "name", {
        __proto__: null,
        value: op.name,
      });
      ObjectDefineProperty(fn2, "length", {
        __proto__: null,
        value: op.length,
      });
      ObjectDefineProperty(Stream.Readable.prototype, key, {
        __proto__: null,
        value: fn2,
        enumerable: false,
        configurable: true,
        writable: true,
      });
    }
    var fn;
    for (const key of ObjectKeys(promiseReturningOperators)) {
      let fn2 = function (...args) {
        if (new.target) {
          throw ERR_ILLEGAL_CONSTRUCTOR();
        }
        return ReflectApply(op, this, args);
      };
      fn = fn2;
      const op = promiseReturningOperators[key];
      ObjectDefineProperty(fn2, "name", {
        __proto__: null,
        value: op.name,
      });
      ObjectDefineProperty(fn2, "length", {
        __proto__: null,
        value: op.length,
      });
      ObjectDefineProperty(Stream.Readable.prototype, key, {
        __proto__: null,
        value: fn2,
        enumerable: false,
        configurable: true,
        writable: true,
      });
    }
    var fn;
    Stream.Writable = require_writable();
    Stream.Duplex = require_duplex();
    Stream.Transform = require_transform();
    Stream.PassThrough = require_passthrough();
    Stream.pipeline = pipeline;
    var { addAbortSignal } = require_add_abort_signal();
    Stream.addAbortSignal = addAbortSignal;
    Stream.finished = eos;
    Stream.destroy = destroyer;
    Stream.compose = compose;
    ObjectDefineProperty(Stream, "promises", {
      __proto__: null,
      configurable: true,
      enumerable: true,
      get() {
        return promises;
      },
    });
    ObjectDefineProperty(pipeline, promisify, {
      __proto__: null,
      enumerable: true,
      get() {
        return promises.pipeline;
      },
    });
    ObjectDefineProperty(eos, promisify, {
      __proto__: null,
      enumerable: true,
      get() {
        return promises.finished;
      },
    });
    Stream.Stream = Stream;
    Stream._isUint8Array = function isUint8Array(value) {
      return value instanceof Uint8Array;
    };
    Stream._uint8ArrayToBuffer = function _uint8ArrayToBuffer(chunk) {
      return Buffer2.from(chunk.buffer, chunk.byteOffset, chunk.byteLength);
    };
    Stream._isArrayBufferView = isArrayBufferView;
  },
});
/* End esm.sh bundle */

// The following code implements Readable.fromWeb(), Writable.fromWeb(), and
// Duplex.fromWeb(). These functions are not properly implemented in the
// readable-stream module yet. This can be removed once the following upstream
// issue is resolved: https://github.com/nodejs/readable-stream/issues/482

import { destroy } from "ext:deno_node/internal/streams/destroy.mjs";
import finished from "ext:deno_node/internal/streams/end-of-stream.mjs";
import {
  isDestroyed,
  isReadable,
  isReadableEnded,
  isWritable,
  isWritableEnded,
} from "ext:deno_node/internal/streams/utils.mjs";
import { ReadableStream, WritableStream } from "node:stream/web";
import {
  validateBoolean,
  validateObject,
} from "ext:deno_node/internal/validators.mjs";

const CustomStream = require_stream();
const process = __process$;
const { Buffer } = __buffer$;

export const Readable = CustomStream.Readable;
export const Writable = CustomStream.Writable;
export const Duplex = CustomStream.Duplex;
export const PassThrough = CustomStream.PassThrough;
export const Stream = CustomStream.Stream;
export const Transform = CustomStream.Transform;
export const _isArrayBufferView = isArrayBufferView;
export const _isUint8Array = CustomStream._isUint8Array;
export const _uint8ArrayToBuffer = CustomStream._uint8ArrayToBuffer;
export const addAbortSignal = CustomStream.addAbortSignal;
export const pipeline = CustomStream.pipeline;
export const isDisturbed = CustomStream.isDisturbed;
export const isErrored = CustomStream.isErrored;
export const compose = CustomStream.compose;
export { destroy, finished, isDestroyed, isReadable, isWritable };

function isWritableStream(object) {
  return object instanceof WritableStream;
}

function isReadableStream(object) {
  return object instanceof ReadableStream;
}

Readable.fromWeb = function (
  readableStream,
  options = kEmptyObject,
) {
  if (!isReadableStream(readableStream)) {
    throw new ERR_INVALID_ARG_TYPE(
      "readableStream",
      "ReadableStream",
      readableStream,
    );
  }

  validateObject(options, "options");
  const {
    highWaterMark,
    encoding,
    objectMode = false,
    signal,
  } = options;

  if (encoding !== undefined && !Buffer.isEncoding(encoding)) {
    throw new ERR_INVALID_ARG_VALUE(encoding, "options.encoding");
  }
  validateBoolean(objectMode, "options.objectMode");

  const reader = readableStream.getReader();
  let closed = false;

  const readable = new Readable({
    objectMode,
    highWaterMark,
    encoding,
    signal,

    read() {
      reader.read().then(
        (chunk) => {
          if (chunk.done) {
            readable.push(null);
          } else {
            readable.push(chunk.value);
          }
        },
        (error) => destroy.call(readable, error),
      );
    },

    destroy(error, callback) {
      function done() {
        try {
          callback(error);
        } catch (error) {
          // In a next tick because this is happening within
          // a promise context, and if there are any errors
          // thrown we don't want those to cause an unhandled
          // rejection. Let's just escape the promise and
          // handle it separately.
          process.nextTick(() => {
            throw error;
          });
        }
      }

      if (!closed) {
        reader.cancel(error).then(done, done);
        return;
      }

      done();
    },
  });

  reader.closed.then(
    () => {
      closed = true;
      if (!isReadableEnded(readable)) {
        readable.push(null);
      }
    },
    (error) => {
      closed = true;
      destroy.call(readable, error);
    },
  );

  return readable;
};

Writable.fromWeb = function (
  writableStream,
  options = kEmptyObject,
) {
  if (!isWritableStream(writableStream)) {
    throw new ERR_INVALID_ARG_TYPE(
      "writableStream",
      "WritableStream",
      writableStream,
    );
  }

  validateObject(options, "options");
  const {
    highWaterMark,
    decodeStrings = true,
    objectMode = false,
    signal,
  } = options;

  validateBoolean(objectMode, "options.objectMode");
  validateBoolean(decodeStrings, "options.decodeStrings");

  const writer = writableStream.getWriter();
  let closed = false;

  const writable = new Writable({
    highWaterMark,
    objectMode,
    decodeStrings,
    signal,

    writev(chunks, callback) {
      function done(error) {
        error = error.filter((e) => e);
        try {
          callback(error.length === 0 ? undefined : error);
        } catch (error) {
          // In a next tick because this is happening within
          // a promise context, and if there are any errors
          // thrown we don't want those to cause an unhandled
          // rejection. Let's just escape the promise and
          // handle it separately.
          process.nextTick(() => destroy.call(writable, error));
        }
      }

      writer.ready.then(
        () =>
          Promise.all(
            chunks.map((data) => writer.write(data.chunk)),
          ).then(done, done),
        done,
      );
    },

    write(chunk, encoding, callback) {
      if (typeof chunk === "string" && decodeStrings && !objectMode) {
        chunk = Buffer.from(chunk, encoding);
        chunk = new Uint8Array(
          chunk.buffer,
          chunk.byteOffset,
          chunk.byteLength,
        );
      }

      function done(error) {
        try {
          callback(error);
        } catch (error) {
          destroy(this, duplex, error);
        }
      }

      writer.ready.then(
        () => writer.write(chunk).then(done, done),
        done,
      );
    },

    destroy(error, callback) {
      function done() {
        try {
          callback(error);
        } catch (error) {
          // In a next tick because this is happening within
          // a promise context, and if there are any errors
          // thrown we don't want those to cause an unhandled
          // rejection. Let's just escape the promise and
          // handle it separately.
          process.nextTick(() => {
            throw error;
          });
        }
      }

      if (!closed) {
        if (error != null) {
          writer.abort(error).then(done, done);
        } else {
          writer.close().then(done, done);
        }
        return;
      }

      done();
    },

    final(callback) {
      function done(error) {
        try {
          callback(error);
        } catch (error) {
          // In a next tick because this is happening within
          // a promise context, and if there are any errors
          // thrown we don't want those to cause an unhandled
          // rejection. Let's just escape the promise and
          // handle it separately.
          process.nextTick(() => destroy.call(writable, error));
        }
      }

      if (!closed) {
        writer.close().then(done, done);
      }
    },
  });

  writer.closed.then(
    () => {
      closed = true;
      if (!isWritableEnded(writable)) {
        destroy.call(writable, new ERR_STREAM_PREMATURE_CLOSE());
      }
    },
    (error) => {
      closed = true;
      destroy.call(writable, error);
    },
  );

  return writable;
};

Duplex.fromWeb = function (pair, options = kEmptyObject) {
  validateObject(pair, "pair");
  const {
    readable: readableStream,
    writable: writableStream,
  } = pair;

  if (!isReadableStream(readableStream)) {
    throw new ERR_INVALID_ARG_TYPE(
      "pair.readable",
      "ReadableStream",
      readableStream,
    );
  }
  if (!isWritableStream(writableStream)) {
    throw new ERR_INVALID_ARG_TYPE(
      "pair.writable",
      "WritableStream",
      writableStream,
    );
  }

  validateObject(options, "options");
  const {
    allowHalfOpen = false,
    objectMode = false,
    encoding,
    decodeStrings = true,
    highWaterMark,
    signal,
  } = options;

  validateBoolean(objectMode, "options.objectMode");
  if (encoding !== undefined && !Buffer.isEncoding(encoding)) {
    throw new ERR_INVALID_ARG_VALUE(encoding, "options.encoding");
  }

  const writer = writableStream.getWriter();
  const reader = readableStream.getReader();
  let writableClosed = false;
  let readableClosed = false;

  const duplex = new Duplex({
    allowHalfOpen,
    highWaterMark,
    objectMode,
    encoding,
    decodeStrings,
    signal,

    writev(chunks, callback) {
      function done(error) {
        error = error.filter((e) => e);
        try {
          callback(error.length === 0 ? undefined : error);
        } catch (error) {
          // In a next tick because this is happening within
          // a promise context, and if there are any errors
          // thrown we don't want those to cause an unhandled
          // rejection. Let's just escape the promise and
          // handle it separately.
          process.nextTick(() => destroy(duplex, error));
        }
      }

      writer.ready.then(
        () =>
          Promise.all(
            chunks.map((data) => writer.write(data.chunk)),
          ).then(done, done),
        done,
      );
    },

    write(chunk, encoding, callback) {
      if (typeof chunk === "string" && decodeStrings && !objectMode) {
        chunk = Buffer.from(chunk, encoding);
        chunk = new Uint8Array(
          chunk.buffer,
          chunk.byteOffset,
          chunk.byteLength,
        );
      }

      function done(error) {
        try {
          callback(error);
        } catch (error) {
          destroy(duplex, error);
        }
      }

      writer.ready.then(
        () => writer.write(chunk).then(done, done),
        done,
      );
    },

    final(callback) {
      function done(error) {
        try {
          callback(error);
        } catch (error) {
          // In a next tick because this is happening within
          // a promise context, and if there are any errors
          // thrown we don't want those to cause an unhandled
          // rejection. Let's just escape the promise and
          // handle it separately.
          process.nextTick(() => destroy(duplex, error));
        }
      }

      if (!writableClosed) {
        writer.close().then(done, done);
      }
    },

    read() {
      reader.read().then(
        (chunk) => {
          if (chunk.done) {
            duplex.push(null);
          } else {
            duplex.push(chunk.value);
          }
        },
        (error) => destroy(duplex, error),
      );
    },

    destroy(error, callback) {
      function done() {
        try {
          callback(error);
        } catch (error) {
          // In a next tick because this is happening within
          // a promise context, and if there are any errors
          // thrown we don't want those to cause an unhandled
          // rejection. Let's just escape the promise and
          // handle it separately.
          process.nextTick(() => {
            throw error;
          });
        }
      }

      async function closeWriter() {
        if (!writableClosed) {
          await writer.abort(error);
        }
      }

      async function closeReader() {
        if (!readableClosed) {
          await reader.cancel(error);
        }
      }

      if (!writableClosed || !readableClosed) {
        Promise.all([
          closeWriter(),
          closeReader(),
        ]).then(done, done);
        return;
      }

      done();
    },
  });

  writer.closed.then(
    () => {
      writableClosed = true;
      if (!isWritableEnded(duplex)) {
        destroy(duplex, new ERR_STREAM_PREMATURE_CLOSE());
      }
    },
    (error) => {
      writableClosed = true;
      readableClosed = true;
      destroy(duplex, error);
    },
  );

  reader.closed.then(
    () => {
      readableClosed = true;
      if (!isReadableEnded(duplex)) {
        duplex.push(null);
      }
    },
    (error) => {
      writableClosed = true;
      readableClosed = true;
      destroy(duplex, error);
    },
  );

  return duplex;
};

// readable-stream attaches these to Readable, but Node.js core does not.
// Delete them here to better match Node.js core. These can be removed once
// https://github.com/nodejs/readable-stream/issues/485 is resolved.
delete Readable.Duplex;
delete Readable.PassThrough;
delete Readable.Readable;
delete Readable.Stream;
delete Readable.Transform;
delete Readable.Writable;
delete Readable._isUint8Array;
delete Readable._uint8ArrayToBuffer;
delete Readable.addAbortSignal;
delete Readable.compose;
delete Readable.destroy;
delete Readable.finished;
delete Readable.isDisturbed;
delete Readable.isErrored;
delete Readable.isReadable;
delete Readable.pipeline;

// The following code implements Readable.toWeb(), Writable.toWeb(), and
// Duplex.toWeb(). These functions are not properly implemented in the
// readable-stream module yet. This can be removed once the following upstream
// issue is resolved: https://github.com/nodejs/readable-stream/issues/482
function newReadableStreamFromStreamReadable(
  streamReadable,
  options = kEmptyObject,
) {
  // Not using the internal/streams/utils isReadableNodeStream utility
  // here because it will return false if streamReadable is a Duplex
  // whose readable option is false. For a Duplex that is not readable,
  // we want it to pass this check but return a closed ReadableStream.
  if (typeof streamReadable?._readableState !== "object") {
    throw new ERR_INVALID_ARG_TYPE(
      "streamReadable",
      "stream.Readable",
      streamReadable,
    );
  }

  if (isDestroyed(streamReadable) || !isReadable(streamReadable)) {
    const readable = new ReadableStream();
    readable.cancel();
    return readable;
  }

  const objectMode = streamReadable.readableObjectMode;
  const highWaterMark = streamReadable.readableHighWaterMark;

  const evaluateStrategyOrFallback = (strategy) => {
    // If there is a strategy available, use it
    if (strategy) {
      return strategy;
    }

    if (objectMode) {
      // When running in objectMode explicitly but no strategy, we just fall
      // back to CountQueuingStrategy
      return new CountQueuingStrategy({ highWaterMark });
    }

    // When not running in objectMode explicitly, we just fall
    // back to a minimal strategy that just specifies the highWaterMark
    // and no size algorithm. Using a ByteLengthQueuingStrategy here
    // is unnecessary.
    return { highWaterMark };
  };

  const strategy = evaluateStrategyOrFallback(options?.strategy);

  let controller;

  function onData(chunk) {
    // Copy the Buffer to detach it from the pool.
    if (Buffer.isBuffer(chunk) && !objectMode) {
      chunk = new Uint8Array(chunk);
    }
    controller.enqueue(chunk);
    if (controller.desiredSize <= 0) {
      streamReadable.pause();
    }
  }

  streamReadable.pause();

  const cleanup = finished(streamReadable, (error) => {
    if (error?.code === "ERR_STREAM_PREMATURE_CLOSE") {
      const err = new AbortError(undefined, { cause: error });
      error = err;
    }

    cleanup();
    // This is a protection against non-standard, legacy streams
    // that happen to emit an error event again after finished is called.
    streamReadable.on("error", () => { });
    if (error) {
      return controller.error(error);
    }
    controller.close();
  });

  streamReadable.on("data", onData);

  return new ReadableStream({
    start(c) {
      controller = c;
    },

    pull() {
      streamReadable.resume();
    },

    cancel(reason) {
      destroy(streamReadable, reason);
    },
  }, strategy);
}

function newWritableStreamFromStreamWritable(streamWritable) {
  // Not using the internal/streams/utils isWritableNodeStream utility
  // here because it will return false if streamWritable is a Duplex
  // whose writable option is false. For a Duplex that is not writable,
  // we want it to pass this check but return a closed WritableStream.
  if (typeof streamWritable?._writableState !== "object") {
    throw new ERR_INVALID_ARG_TYPE(
      "streamWritable",
      "stream.Writable",
      streamWritable,
    );
  }

  if (isDestroyed(streamWritable) || !isWritable(streamWritable)) {
    const writable = new WritableStream();
    writable.close();
    return writable;
  }

  const highWaterMark = streamWritable.writableHighWaterMark;
  const strategy = streamWritable.writableObjectMode
    ? new CountQueuingStrategy({ highWaterMark })
    : { highWaterMark };

  let controller;
  let backpressurePromise;
  let closed;

  function onDrain() {
    if (backpressurePromise !== undefined) {
      backpressurePromise.resolve();
    }
  }

  const cleanup = finished(streamWritable, (error) => {
    if (error?.code === "ERR_STREAM_PREMATURE_CLOSE") {
      const err = new AbortError(undefined, { cause: error });
      error = err;
    }

    cleanup();
    // This is a protection against non-standard, legacy streams
    // that happen to emit an error event again after finished is called.
    streamWritable.on("error", () => { });
    if (error != null) {
      if (backpressurePromise !== undefined) {
        backpressurePromise.reject(error);
      }
      // If closed is not undefined, the error is happening
      // after the WritableStream close has already started.
      // We need to reject it here.
      if (closed !== undefined) {
        closed.reject(error);
        closed = undefined;
      }
      controller.error(error);
      controller = undefined;
      return;
    }

    if (closed !== undefined) {
      closed.resolve();
      closed = undefined;
      return;
    }
    controller.error(new AbortError());
    controller = undefined;
  });

  streamWritable.on("drain", onDrain);

  return new WritableStream({
    start(c) {
      controller = c;
    },

    async write(chunk) {
      if (streamWritable.writableNeedDrain || !streamWritable.write(chunk)) {
        backpressurePromise = createDeferredPromise();
        return backpressurePromise.promise.finally(() => {
          backpressurePromise = undefined;
        });
      }
    },

    abort(reason) {
      destroy(streamWritable, reason);
    },

    close() {
      if (closed === undefined && !isWritableEnded(streamWritable)) {
        closed = createDeferredPromise();
        streamWritable.end();
        return closed.promise;
      }

      controller = undefined;
      return Promise.resolve();
    },
  }, strategy);
}

function newReadableWritablePairFromDuplex(duplex) {
  // Not using the internal/streams/utils isWritableNodeStream and
  // isReadableNodestream utilities here because they will return false
  // if the duplex was created with writable or readable options set to
  // false. Instead, we'll check the readable and writable state after
  // and return closed WritableStream or closed ReadableStream as
  // necessary.
  if (
    typeof duplex?._writableState !== "object" ||
    typeof duplex?._readableState !== "object"
  ) {
    throw new ERR_INVALID_ARG_TYPE("duplex", "stream.Duplex", duplex);
  }

  if (isDestroyed(duplex)) {
    const writable = new WritableStream();
    const readable = new ReadableStream();
    writable.close();
    readable.cancel();
    return { readable, writable };
  }

  const writable = isWritable(duplex)
    ? newWritableStreamFromStreamWritable(duplex)
    : new WritableStream();

  if (!isWritable(duplex)) {
    writable.close();
  }

  const readable = isReadable(duplex)
    ? newReadableStreamFromStreamReadable(duplex)
    : new ReadableStream();

  if (!isReadable(duplex)) {
    readable.cancel();
  }

  return { writable, readable };
}

Readable.toWeb = newReadableStreamFromStreamReadable;
Writable.toWeb = newWritableStreamFromStreamWritable;
Duplex.toWeb = newReadableWritablePairFromDuplex;
