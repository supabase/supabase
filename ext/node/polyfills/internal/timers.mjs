// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { primordials } from "ext:core/mod.js";
const {
  MapPrototypeDelete,
  MapPrototypeSet,
  SafeMap,
} = primordials;

import { inspect } from "ext:deno_node/internal/util/inspect.mjs";
import {
  validateFunction,
  validateNumber,
} from "ext:deno_node/internal/validators.mjs";
import { ERR_OUT_OF_RANGE } from "ext:deno_node/internal/errors.ts";
import { emitWarning } from "node:process";
import {
  clearTimeout as clearTimeout_,
  setImmediate as setImmediate_,
  setInterval as setInterval_,
  setTimeout as setTimeout_,
} from "ext:deno_web/02_timers.js";

// Timeout values > TIMEOUT_MAX are set to 1.
export const TIMEOUT_MAX = 2 ** 31 - 1;

export const kTimerId = Symbol("timerId");
export const kTimeout = Symbol("timeout");
const kRefed = Symbol("refed");
const createTimer = Symbol("createTimer");

/**
 * The keys in this map correspond to the key ID's in the spec's map of active
 * timers. The values are the timeout's status.
 *
 * @type {Map<number, Timeout>}
 */
export const activeTimers = new SafeMap();

// Timer constructor function.
export function Timeout(callback, after, args, isRepeat, isRefed) {
  if (typeof after === "number" && after > TIMEOUT_MAX) {
    after = 1;
  }
  this._idleTimeout = after;
  this._onTimeout = callback;
  this._timerArgs = args;
  this._isRepeat = isRepeat;
  this._destroyed = false;
  this[kRefed] = isRefed;
  this[kTimerId] = this[createTimer]();
}

Timeout.prototype[createTimer] = function () {
  const callback = this._onTimeout;
  const cb = (...args) => {
    if (!this._isRepeat) {
      MapPrototypeDelete(activeTimers, this[kTimerId]);
    }
    return callback.bind(this)(...args);
  };
  const id = this._isRepeat
    ? setInterval_(cb, this._idleTimeout, ...this._timerArgs)
    : setTimeout_(cb, this._idleTimeout, ...this._timerArgs);
  if (!this[kRefed]) {
    Deno.unrefTimer(id);
  }
  MapPrototypeSet(activeTimers, id, this);
  return id;
};

// Make sure the linked list only shows the minimal necessary information.
Timeout.prototype[inspect.custom] = function (_, options) {
  return inspect(this, {
    ...options,
    // Only inspect one level.
    depth: 0,
    // It should not recurse.
    customInspect: false,
  });
};

Timeout.prototype.refresh = function () {
  if (!this._destroyed) {
    clearTimeout_(this[kTimerId]);
    this[kTimerId] = this[createTimer]();
  }
  return this;
};

Timeout.prototype.unref = function () {
  if (this[kRefed]) {
    this[kRefed] = false;
    Deno.unrefTimer(this[kTimerId]);
  }
  return this;
};

Timeout.prototype.ref = function () {
  if (!this[kRefed]) {
    this[kRefed] = true;
    Deno.refTimer(this[kTimerId]);
  }
  return this;
};

Timeout.prototype.hasRef = function () {
  return this[kRefed];
};

Timeout.prototype[Symbol.toPrimitive] = function () {
  return this[kTimerId];
};

// Immediate constructor function.
export function Immediate(callback, ...args) {
  this._immediateId = setImmediate_(callback, ...args);
}

// Make sure the linked list only shows the minimal necessary information.
Immediate.prototype[inspect.custom] = function (_, options) {
  return inspect(this, {
    ...options,
    // Only inspect one level.
    depth: 0,
    // It should not recurse.
    customInspect: false,
  });
};

// FIXME(nathanwhit): actually implement {ref,unref,hasRef} once deno_core supports it
Immediate.prototype.unref = function () {
  return this;
};

Immediate.prototype.ref = function () {
  return this;
};

Immediate.prototype.hasRef = function () {
  return true;
};

/**
 * @param {number} msecs
 * @param {string} name
 * @returns
 */
export function getTimerDuration(msecs, name) {
  validateNumber(msecs, name);

  if (msecs < 0 || !Number.isFinite(msecs)) {
    throw new ERR_OUT_OF_RANGE(name, "a non-negative finite number", msecs);
  }

  // Ensure that msecs fits into signed int32
  if (msecs > TIMEOUT_MAX) {
    emitWarning(
      `${msecs} does not fit into a 32-bit signed integer.` +
        `\nTimer duration was truncated to ${TIMEOUT_MAX}.`,
      "TimeoutOverflowWarning",
    );

    return TIMEOUT_MAX;
  }

  return msecs;
}

export function setUnrefTimeout(callback, timeout, ...args) {
  validateFunction(callback, "callback");
  return new Timeout(callback, timeout, args, false, false);
}

export default {
  getTimerDuration,
  kTimerId,
  kTimeout,
  setUnrefTimeout,
  Timeout,
  TIMEOUT_MAX,
};
