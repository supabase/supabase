import { core, primordials } from "ext:core/mod.js";
import {
  readableStreamForRid,
  writableStreamForRid,
} from "ext:deno_web/06_streams.js";
import { getSupabaseTag } from "ext:runtime/http.js";
import {
  builtinTracer,
  enterSpan,
  TRACING_ENABLED,
} from "ext:deno_telemetry/telemetry.ts";

const ops = core.ops;

const { TypeError } = primordials;

const {
  op_user_worker_fetch_send,
  op_user_worker_create,
  op_user_worker_cleanup_idle_workers,
  op_user_worker_mem_stats,
} = ops;

const NO_SUPABASE_TAG_WARN_MSG =
  `Unable to find the supabase tag from the request instance.\n\
Invoke \`EdgeRuntime.applySupabaseTag(origReq, newReq)\` if you have cloned the original request.`;

function nullBodyStatus(status) {
  return status === 101 || status === 204 || status === 205 || status === 304;
}

function redirectStatus(status) {
  return status === 301 || status === 302 || status === 303 ||
    status === 307 || status === 308;
}

class UserWorker {
  constructor(key) {
    this.key = key;
  }

  async fetch(request, options = {}) {
    const tag = getSupabaseTag(request);

    const { method, url, headers, body, bodyUsed } = request;
    const { signal } = options;

    signal?.throwIfAborted();

    if (tag === void 0) {
      console.warn(NO_SUPABASE_TAG_WARN_MSG);
    }

    const headersArray = Array.from(headers.entries());
    const hasBody = !bodyUsed && !!body;

    const userWorkerReq = {
      method,
      url,
      hasBody,
      headers: headersArray,
    };

    const { requestRid, requestBodyRid } = await ops.op_user_worker_fetch_build(
      userWorkerReq,
    );

    // stream the request body
    let requestBodyPromise = null;

    if (hasBody) {
      requestBodyPromise = body.pipeTo(writableStreamForRid(requestBodyRid), {
        signal,
      });
    }

    const responsePromise = op_user_worker_fetch_send(
      this.key,
      requestRid,
      requestBodyRid,
      tag.streamRid,
      tag.watcherRid,
    );

    const [requestBodyPromiseResult, responsePromiseResult] = await Promise
      .allSettled([
        requestBodyPromise,
        responsePromise,
      ]);

    if (requestBodyPromiseResult.status === "rejected") {
      // console.warn(requestBodyPromiseResult.reason);
    }

    if (responsePromiseResult.status === "rejected") {
      throw responsePromiseResult.reason;
    }

    const result = responsePromiseResult.value;
    const response = {
      headers: result.headers,
      status: result.status,
      statusText: result.statusText,
      body: null,
    };

    // TODO: add a test
    if (nullBodyStatus(result.status) || redirectStatus(result.status)) {
      core.tryClose(result.bodyRid);
    } else {
      if (request.method === "HEAD" || request.method === "CONNECT") {
        core.tryClose(result.bodyRid);
      } else {
        const stream = readableStreamForRid(result.bodyRid);

        signal?.addEventListener("abort", () => {
          core.tryClose(result.bodyRid);
        });

        response.body = stream;
      }
    }

    return new Response(response.body ? response.body : null, {
      headers: response.headers,
      status: response.status,
      statusText: response.statusText,
    });
  }

  static async create(opts) {
    const readyOptions = {
      noModuleCache: false,
      envVars: [],
      forceCreate: false,
      allowRemoteModules: true,
      customModuleRoot: "",
      maybeEszip: null,
      maybeEntrypoint: null,
      maybeModuleCode: null,
      ...opts,
    };

    const { servicePath, maybeEszip } = readyOptions;

    if (!maybeEszip && (!servicePath || servicePath === "")) {
      throw new TypeError("service path must be defined");
    }

    let span;
    if (TRACING_ENABLED) {
      span = builtinTracer().startSpan("edge_runtime.user_worker.create");
      enterSpan(span);
    }
    try {
      const [key, reused] = await op_user_worker_create(readyOptions);
      if (TRACING_ENABLED) {
        span.setAttribute("worker.id", key);
        span.setAttribute("worker.reused", reused);
      }
      return new UserWorker(key);
    } catch (err) {
      if (TRACING_ENABLED) {
        try {
          span.setStatus({ code: 2, message: JSON.stringify(err) });
        } catch {
          span.setStatus({ code: 2, message: "unknown" });
        }
      }
      throw err;
    } finally {
      span?.end();
    }
  }

  static async tryCleanupIdleWorkers(timeoutMs) {
    return await op_user_worker_cleanup_idle_workers(timeoutMs);
  }

  static async memStats() {
    return await op_user_worker_mem_stats();
  }
}

const SUPABASE_USER_WORKERS = UserWorker;

export { SUPABASE_USER_WORKERS };
