// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.

import { primordials } from "ext:deno_node/internal/test/binding.ts";
const { queueMicrotask } = primordials;
import { SymbolDispose } from "ext:deno_web/00_infra.js";
import * as abortSignal from "ext:deno_web/03_abort_signal.js";
import { validateAbortSignal, validateFunction } from "../validators.mjs";
import { codes } from "../errors.ts";
const { ERR_INVALID_ARG_TYPE } = codes;

/**
 * @param {AbortSignal} signal
 * @param {EventListener} listener
 * @returns {Disposable}
 */
function addAbortListener(signal, listener) {
  if (signal === undefined) {
    throw new ERR_INVALID_ARG_TYPE("signal", "AbortSignal", signal);
  }
  validateAbortSignal(signal, "signal");
  validateFunction(listener, "listener");

  let removeEventListener;
  if (signal.aborted) {
    queueMicrotask(() => listener());
  } else {
    signal[abortSignal.add](() => {
      removeEventListener?.();
      listener();
    });
    removeEventListener = () => {
      signal[abortSignal.remove](listener);
    };
  }
  return {
    __proto__: null,
    [SymbolDispose]() {
      removeEventListener?.();
    },
  };
}

export { addAbortListener };
