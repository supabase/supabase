// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// deno-lint-ignore-file

import { getDefaultEncoding } from "ext:deno_node/internal/crypto/util.ts";
import stream from "node:stream";

function LazyTransform(options) {
  this._options = options;
}
Object.setPrototypeOf(LazyTransform.prototype, stream.Transform.prototype);
Object.setPrototypeOf(LazyTransform, stream.Transform);

function makeGetter(name) {
  return function () {
    stream.Transform.call(this, this._options);
    this._writableState.decodeStrings = false;

    if (!this._options || !this._options.defaultEncoding) {
      this._writableState.defaultEncoding = getDefaultEncoding();
    }

    return this[name];
  };
}

function makeSetter(name) {
  return function (val) {
    Object.defineProperty(this, name, {
      value: val,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  };
}

Object.defineProperties(LazyTransform.prototype, {
  _readableState: {
    get: makeGetter("_readableState"),
    set: makeSetter("_readableState"),
    configurable: true,
    enumerable: true,
  },
  _writableState: {
    get: makeGetter("_writableState"),
    set: makeSetter("_writableState"),
    configurable: true,
    enumerable: true,
  },
});

export default LazyTransform;
