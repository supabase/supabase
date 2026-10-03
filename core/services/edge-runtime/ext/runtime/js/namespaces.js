import { core, primordials } from "ext:core/mod.js";

import { MAIN_WORKER_API, USER_WORKER_API } from "ext:ai/ai.js";
import { SUPABASE_USER_WORKERS } from "ext:user_workers/user_workers.js";
import { applySupabaseTag } from "ext:runtime/http.js";
import { waitUntil } from "ext:runtime/async_hook.js";
import {
  builtinTracer,
  enterSpan,
  METRICS_ENABLED,
  TRACING_ENABLED,
} from "ext:deno_telemetry/telemetry.ts";

const ops = core.ops;
const { ObjectDefineProperty } = primordials;

/**
 * @param {"user" | "main" | "event"} kind
 * @param {number} terminationRequestTokenRid
 */
function installEdgeRuntimeNamespace(kind, terminationRequestTokenRid) {
  let props = {
    scheduleTermination: () =>
      ops.op_cancel_drop_token(terminationRequestTokenRid),
  };

  switch (kind) {
    case "main":
      props = {
        ai: MAIN_WORKER_API,
        userWorkers: SUPABASE_USER_WORKERS,
        getRuntimeMetrics: () => /* async */ ops.op_runtime_metrics(),
        applySupabaseTag: (src, dest) => applySupabaseTag(src, dest),
        systemMemoryInfo: () => ops.op_system_memory_info(),
        raiseSegfault: () => ops.op_raise_segfault(),
        miCollect: () => ops.op_mi_collect(),
        ...props,
      };
      break;

    case "event":
      props = {
        builtinTracer,
        enterSpan,
        METRICS_ENABLED,
        TRACING_ENABLED,
        ...props,
      };
      break;

    case "user":
      props = {
        waitUntil,
      };
      break;
  }

  if (props === void 0) {
    return;
  }

  ObjectDefineProperty(globalThis, "EdgeRuntime", {
    get() {
      return props;
    },
    configurable: true,
  });
}

/**
 * @param {"user" | "main" | "event"} _kind
 */
function installSupabaseNamespace(_kind) {
  const props = {
    ai: USER_WORKER_API,
  };

  ObjectDefineProperty(globalThis, "Supabase", {
    get() {
      return props;
    },
    configurable: true,
  });
}

export { installEdgeRuntimeNamespace, installSupabaseNamespace };
