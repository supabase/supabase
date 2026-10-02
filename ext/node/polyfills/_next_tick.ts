// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and other Node contributors.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { core } from "ext:core/mod.js";

import { validateFunction } from "ext:deno_node/internal/validators.mjs";
import { _exiting } from "ext:deno_node/_process/exiting.ts";
import { FixedQueue } from "ext:deno_node/internal/fixed_queue.ts";

const {
  getAsyncContext,
  setAsyncContext,
} = core;

interface Tock {
  callback: (...args: Array<unknown>) => void;
  args: Array<unknown>;
  snapshot: unknown;
}

let nextTickEnabled = false;
export function enableNextTick() {
  nextTickEnabled = true;
}

const queue = new FixedQueue();

export function processTicksAndRejections() {
  let tock: Tock;
  do {
    // deno-lint-ignore no-cond-assign
    while (tock = queue.shift()) {
      // FIXME(bartlomieju): Deno currently doesn't support async hooks
      // const asyncId = tock[async_id_symbol];
      // emitBefore(asyncId, tock[trigger_async_id_symbol], tock);

      const oldContext = getAsyncContext();
      try {
        setAsyncContext(tock.snapshot);
        const callback = tock.callback;
        if (tock.args === undefined) {
          callback();
        } else {
          const args = (tock as Tock).args;
          switch (args.length) {
            case 1:
              callback(args[0]);
              break;
            case 2:
              callback(args[0], args[1]);
              break;
            case 3:
              callback(args[0], args[1], args[2]);
              break;
            case 4:
              callback(args[0], args[1], args[2], args[3]);
              break;
            default:
              callback(...args);
          }
        }
      } catch (e) {
        reportError(e);
      } finally {
        // FIXME(bartlomieju): Deno currently doesn't support async hooks
        // if (destroyHooksExist())
        // emitDestroy(asyncId);
        setAsyncContext(oldContext);
      }

      // FIXME(bartlomieju): Deno currently doesn't support async hooks
      // emitAfter(asyncId);
    }
    core.runMicrotasks();
    // FIXME(bartlomieju): Deno currently doesn't unhandled rejections
    // } while (!queue.isEmpty() || processPromiseRejections());
  } while (!queue.isEmpty());
  core.setHasTickScheduled(false);
  // FIXME(bartlomieju): Deno currently doesn't unhandled rejections
  // setHasRejectionToWarn(false);
}

export function runNextTicks() {
  // FIXME(bartlomieju): Deno currently doesn't unhandled rejections
  // if (!hasTickScheduled() && !hasRejectionToWarn())
  //   runMicrotasks();
  // if (!hasTickScheduled() && !hasRejectionToWarn())
  //   return;
  if (queue.isEmpty() || !core.hasTickScheduled()) {
    return true;
  }

  processTicksAndRejections();
  return true;
}

// `nextTick()` will not enqueue any callback when the process is about to
// exit since the callback would not have a chance to be executed.
export function nextTick(this: unknown, callback: () => void): void;
export function nextTick<T extends Array<unknown>>(
  this: unknown,
  callback: (...args: T) => void,
  ...args: T
): void;
export function nextTick<T extends Array<unknown>>(
  this: unknown,
  callback: (...args: T) => void,
  ...args: T
) {
  // If we're snapshotting we don't want to push nextTick to be run. We'll
  // enable next ticks in "__bootstrapNodeProcess()";
  if (!nextTickEnabled) {
    return;
  }

  validateFunction(callback, "callback");

  if (_exiting) {
    return;
  }

  // TODO(bartlomieju): seems superfluous if we don't depend on `arguments`
  let args_;
  switch (args.length) {
    case 0:
      break;
    case 1:
      args_ = [args[0]];
      break;
    case 2:
      args_ = [args[0], args[1]];
      break;
    case 3:
      args_ = [args[0], args[1], args[2]];
      break;
    default:
      args_ = new Array(args.length);
      for (let i = 0; i < args.length; i++) {
        args_[i] = args[i];
      }
  }

  if (queue.isEmpty()) {
    core.setHasTickScheduled(true);
  }
  // FIXME(bartlomieju): Deno currently doesn't support async hooks
  // const asyncId = newAsyncId();
  // const triggerAsyncId = getDefaultTriggerAsyncId();
  const tickObject = {
    // FIXME(bartlomieju): Deno currently doesn't support async hooks
    // [async_id_symbol]: asyncId,
    // [trigger_async_id_symbol]: triggerAsyncId,
    snapshot: getAsyncContext(),
    callback,
    args: args_,
  };
  // FIXME(bartlomieju): Deno currently doesn't support async hooks
  // if (initHooksExist())
  //   emitInit(asyncId, 'TickObject', triggerAsyncId, tickObject);
  queue.push(tickObject);
}
