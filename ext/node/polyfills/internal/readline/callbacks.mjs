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

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

"use strict";

import {
  ERR_INVALID_ARG_VALUE,
  ERR_INVALID_CURSOR_POS,
} from "ext:deno_node/internal/errors.ts";

import { validateFunction } from "ext:deno_node/internal/validators.mjs";

import { CSI } from "ext:deno_node/internal/readline/utils.mjs";

const {
  kClearLine,
  kClearScreenDown,
  kClearToLineBeginning,
  kClearToLineEnd,
} = CSI;

/**
 * moves the cursor to the x and y coordinate on the given stream
 */

export function cursorTo(stream, x, y, callback) {
  if (callback !== undefined) {
    validateFunction(callback, "callback");
  }

  if (typeof y === "function") {
    callback = y;
    y = undefined;
  }

  if (Number.isNaN(x)) throw new ERR_INVALID_ARG_VALUE("x", x);
  if (Number.isNaN(y)) throw new ERR_INVALID_ARG_VALUE("y", y);

  if (stream == null || (typeof x !== "number" && typeof y !== "number")) {
    if (typeof callback === "function") process.nextTick(callback, null);
    return true;
  }

  if (typeof x !== "number") throw new ERR_INVALID_CURSOR_POS();

  const data = typeof y !== "number" ? CSI`${x + 1}G` : CSI`${y + 1};${x + 1}H`;
  return stream.write(data, callback);
}

/**
 * moves the cursor relative to its current location
 */

export function moveCursor(stream, dx, dy, callback) {
  if (callback !== undefined) {
    validateFunction(callback, "callback");
  }

  if (stream == null || !(dx || dy)) {
    if (typeof callback === "function") process.nextTick(callback, null);
    return true;
  }

  let data = "";

  if (dx < 0) {
    data += CSI`${-dx}D`;
  } else if (dx > 0) {
    data += CSI`${dx}C`;
  }

  if (dy < 0) {
    data += CSI`${-dy}A`;
  } else if (dy > 0) {
    data += CSI`${dy}B`;
  }

  return stream.write(data, callback);
}

/**
 * clears the current line the cursor is on:
 *   -1 for left of the cursor
 *   +1 for right of the cursor
 *    0 for the entire line
 */

export function clearLine(stream, dir, callback) {
  if (callback !== undefined) {
    validateFunction(callback, "callback");
  }

  if (stream === null || stream === undefined) {
    if (typeof callback === "function") process.nextTick(callback, null);
    return true;
  }

  const type = dir < 0
    ? kClearToLineBeginning
    : dir > 0
    ? kClearToLineEnd
    : kClearLine;
  return stream.write(type, callback);
}

/**
 * clears the screen from the current position of the cursor down
 */

export function clearScreenDown(stream, callback) {
  if (callback !== undefined) {
    validateFunction(callback, "callback");
  }

  if (stream === null || stream === undefined) {
    if (typeof callback === "function") process.nextTick(callback, null);
    return true;
  }

  return stream.write(kClearScreenDown, callback);
}
