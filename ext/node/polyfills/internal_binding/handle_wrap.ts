// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// This module ports:
// - https://github.com/nodejs/node/blob/master/src/handle_wrap.cc
// - https://github.com/nodejs/node/blob/master/src/handle_wrap.h

// TODO(petamoriken): enable prefer-primordials for node polyfills
import { unreachable } from "ext:deno_node/_util/asserts.ts";
import {
  AsyncWrap,
  providerType,
} from "ext:deno_node/internal_binding/async_wrap.ts";
import { nextTick } from "ext:deno_node/_process/process.ts";

export class HandleWrap extends AsyncWrap {
  constructor(provider: providerType) {
    super(provider);
  }

  close(cb: () => void = () => {}) {
    this._onClose();
    // We need to delay 'cb' at least 2 ticks to avoid "close" event happening before "error" event in net.Socket
    // See https://github.com/denoland/deno/pull/24656 for more information
    nextTick(nextTick, cb);
  }

  ref() {
    unreachable();
  }

  unref() {
    unreachable();
  }

  // deno-lint-ignore no-explicit-any
  _onClose(): any {}
}
