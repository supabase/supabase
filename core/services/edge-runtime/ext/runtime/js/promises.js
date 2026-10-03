import * as event from "ext:deno_web/02_event.js";
import { core, primordials } from "ext:core/mod.js";
const ops = core.ops;

const {
  ArrayPrototypeIndexOf,
  ArrayPrototypePush,
  ArrayPrototypeSplice,
  WeakMapPrototypeSet,
  ArrayPrototypeShift,
  WeakMapPrototypeGet,
  WeakMapPrototypeDelete,
  SafeWeakMap,
} = primordials;

const pendingRejections = [];
const pendingRejectionsReasons = new SafeWeakMap();

function promiseRejectCallback(type, promise, reason) {
  switch (type) {
    case 0: {
      ops.op_store_pending_promise_rejection(promise, reason);
      ArrayPrototypePush(pendingRejections, promise);
      WeakMapPrototypeSet(pendingRejectionsReasons, promise, reason);
      break;
    }
    case 1: {
      ops.op_remove_pending_promise_rejection(promise);
      const index = ArrayPrototypeIndexOf(pendingRejections, promise);
      if (index > -1) {
        ArrayPrototypeSplice(pendingRejections, index, 1);
        WeakMapPrototypeDelete(pendingRejectionsReasons, promise);
      }
      break;
    }
    default:
      return false;
  }

  return !!globalThis.onunhandledrejection ||
    event.listenerCount(globalThis, "unhandledrejection") > 0;
}

core.setUnhandledPromiseRejectionHandler(promiseRejectCallback);

function promiseRejectMacrotaskCallback() {
  while (pendingRejections.length > 0) {
    const promise = ArrayPrototypeShift(pendingRejections);
    const hasPendingException = ops.op_has_pending_promise_rejection(
      promise,
    );
    const reason = WeakMapPrototypeGet(pendingRejectionsReasons, promise);
    WeakMapPrototypeDelete(pendingRejectionsReasons, promise);

    if (!hasPendingException) {
      continue;
    }

    const rejectionEvent = new event.PromiseRejectionEvent(
      "unhandledrejection",
      {
        cancelable: true,
        promise,
        reason,
      },
    );

    const errorEventCb = (event) => {
      if (event.error === reason) {
        ops.op_remove_pending_promise_rejection(promise);
      }
    };
    // Add a callback for "error" event - it will be dispatched
    // if error is thrown during dispatch of "unhandledrejection"
    // event.
    globalThis.addEventListener("error", errorEventCb);
    globalThis.dispatchEvent(rejectionEvent);
    globalThis.removeEventListener("error", errorEventCb);

    // If event was not prevented (or "unhandledrejection" listeners didn't
    // throw) we will let Rust side handle it.
    if (rejectionEvent.defaultPrevented) {
      ops.op_remove_pending_promise_rejection(promise);
    }
  }
  return true;
}
export { promiseRejectMacrotaskCallback };
