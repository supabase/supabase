import { core, primordials } from "ext:core/mod.js";

const ops = core.ops;
const { Promise } = primordials;

const PROMISES = new Set();

function waitUntilInner(maybePromise) {
  if (maybePromise instanceof Promise) {
    ops.op_tap_promise_metrics("init");
    PROMISES.add(maybePromise);
  }

  return maybePromise;
}

function waitUntil(maybePromise) {
  return waitUntilInner(maybePromise);
}

/**
 * @param {"user" | "main" | "event"} kind
 */
function installPromiseHook(kind) {
  if (kind !== "user") {
    return;
  }

  core.setPromiseHooks(
    null,
    null,
    null,
    (promise) => {
      if (PROMISES.delete(promise)) {
        ops.op_tap_promise_metrics("resolve");
      }
    },
  );
}

export { installPromiseHook, waitUntil };
