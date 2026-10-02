// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// @deno-types="./_events.d.ts"
export {
  addAbortListener,
  captureRejectionSymbol,
  default,
  defaultMaxListeners,
  errorMonitor,
  EventEmitter,
  EventEmitterAsyncResource,
  getEventListeners,
  listenerCount,
  on,
  once,
  setMaxListeners,
} from "ext:deno_node/_events.mjs";
