declare type BeforeunloadReason =
  | "cpu"
  | "memory"
  | "wall_clock"
  | "early_drop"
  | "termination";

declare interface WindowEventMap {
  "load": Event;
  "unload": Event;
  "beforeunload": CustomEvent<BeforeunloadReason>;
  "drain": Event;
}

// TODO(Nyannyacha): These two type defs will be provided later.

// deno-lint-ignore no-explicit-any
type S3FsConfig = any;

// deno-lint-ignore no-explicit-any
type TmpFsConfig = any;

type OtelPropagators = "TraceContext" | "Baggage";
type OtelConsoleConfig = "Ignore" | "Capture" | "Replace";
type OtelConfig = {
  tracing_enabled?: boolean;
  metrics_enabled?: boolean;
  console?: OtelConsoleConfig;
  propagators?: OtelPropagators[];
};

interface UserWorkerFetchOptions {
  signal?: AbortSignal;
}

interface PermissionsOptions {
  allow_all?: boolean | null;
  allow_env?: string[] | null;
  deny_env?: string[] | null;
  allow_net?: string[] | null;
  deny_net?: string[] | null;
  allow_ffi?: string[] | null;
  deny_ffi?: string[] | null;
  allow_read?: string[] | null;
  deny_read?: string[] | null;
  allow_run?: string[] | null;
  deny_run?: string[] | null;
  allow_sys?: string[] | null;
  deny_sys?: string[] | null;
  allow_write?: string[] | null;
  deny_write?: string[] | null;
  allow_import?: string[] | null;
}

interface UserWorkerCreateContext {
  sourceMap?: boolean | null;
  importMapPath?: string | null;
  /**
   * Ref of the project the worker belongs to. Stamped into the `User-Agent` of
   * every request the worker makes, so outbound traffic can be attributed back
   * to the project.
   */
  projectRef?: string | null;
  shouldBootstrapMockFnThrowError?: boolean | null;
  suppressEszipMigrationWarning?: boolean | null;
  useReadSyncFileAPI?: boolean | null;
  supervisor?: {
    requestAbsentTimeoutMs?: number | null;
  };
  otel?: {
    [attribute: string]: string;
  };

  exposeRequestTraceId?: boolean | null;
}

interface UserWorkerCreateOptions {
  poolKey?: string | null;
  servicePath?: string | null;
  envVars?: string[][] | [string, string][] | null;
  noModuleCache?: boolean | null;
  noNpm?: boolean | null;

  forceCreate?: boolean | null;
  allowRemoteModules?: boolean | null;
  customModuleRoot?: string | null;
  permissions?: PermissionsOptions | null;

  maybeEszip?: Uint8Array | null;
  maybeEntrypoint?: string | null;
  maybeModuleCode?: string | null;

  memoryLimitMb?: number | null;
  lowMemoryMultiplier?: number | null;
  workerTimeoutMs?: number | null;
  cpuTimeSoftLimitMs?: number | null;
  cpuTimeHardLimitMs?: number | null;
  staticPatterns?: string[] | null;

  s3FsConfig?: S3FsConfig | null;
  tmpFsConfig?: TmpFsConfig | null;
  otelConfig?: OtelConfig | null;

  context?: UserWorkerCreateContext | null;
  traceRateLimitOptions?: TraceRateLimitOptions | null;
}

/** Per-URL budget split between traced (local) and untraced (global) requests. */
interface TraceRateLimitBudget {
  /** Max outbound requests allowed per trace ID within the TTL window. */
  local: number;
  /** Max outbound requests allowed across all untraced requests within the TTL window. */
  global: number;
}

/** A single rate-limit rule applied to outbound URLs matching `matches`. */
interface TraceRateLimitRule {
  /** Regular expression matched against the outbound request URL. */
  matches: string;
  /** Window duration in seconds. The counter resets after this period. */
  ttl: number;
  budget: TraceRateLimitBudget;
}

/**
 * Rate-limit configuration for outbound HTTP requests made by a user worker.
 *
 * Rules are evaluated in order; the first matching rule applies.
 * Traced requests (those carrying a `traceparent` header) share a budget
 * identified by their trace ID (`local` budget).  Untraced requests share a
 * single global budget identified by `key` (`global` budget).
 */
interface TraceRateLimitOptions {
  /**
   * Stable identifier shared across all instances of the same function.
   * Used as the rate-limit key for untraced requests so the global budget
   * accumulates correctly regardless of how many worker instances exist.
   */
  key: string;
  rules: TraceRateLimitRule[];
}

interface HeapStatistics {
  totalHeapSize: number;
  totalHeapSizeExecutable: number;
  totalPhysicalSize: number;
  totalAvailableSize: number;
  totalGlobalHandlesSize: number;
  usedGlobalHandlesSize: number;
  usedHeapSize: number;
  mallocedMemory: number;
  externalMemory: number;
  peakMallocedMemory: number;
}

interface WorkerHeapStatisticsWithServicePath {
  servicePath: string;
  stats?: HeapStatistics;
}

interface RuntimeMetrics {
  mainWorkerHeapStats: HeapStatistics;
  eventWorkerHeapStats?: HeapStatistics;
  activeUserWorkersCount: number;
  retiredUserWorkersCount: number;
  receivedRequestsCount: number;
  handledRequestsCount: number;
}

interface MemInfo {
  total: number;
  free: number;
  available: number;
  buffers: number;
  cached: number;
  swapTotal: number;
  swapFree: number;
}

declare namespace EdgeRuntime {
  export namespace ai {
    function tryCleanupUnusedSession(): Promise<number>;
  }

  class UserWorker {
    constructor(key: string);

    fetch(
      request: Request,
      options?: UserWorkerFetchOptions,
    ): Promise<Response>;

    static create(opts: UserWorkerCreateOptions): Promise<UserWorker>;
    static tryCleanupIdleWorkers(timeoutMs: number): Promise<number>;
    static memStats(): Promise<
      Map<string, WorkerHeapStatisticsWithServicePath>
    >;
  }

  export function scheduleTermination(): void;
  export function waitUntil<T>(promise: Promise<T>): Promise<T>;
  export function getRuntimeMetrics(): Promise<RuntimeMetrics>;
  export function applySupabaseTag(src: Request, dest: Request): void;
  export function systemMemoryInfo(): MemInfo;
  export function raiseSegfault(): void;
  export function miCollect(): void;

  /** Snapshot handle returned by {@linkcode enterSpan}. */
  interface AsyncContextSnapshot {
    __brand: "AsyncContextSnapshot";
  }

  /**
   * Returns the tracer backing the runtime's built-in OpenTelemetry support.
   *
   * @remarks
   * **Environment:** Event Worker only.
   * This feature is only available when running as `--event-worker` environment.
   */
  export function builtinTracer(): import("npm:@opentelemetry/api").Tracer;

  /**
   * Makes the given span the current span of the active context.
   *
   * @remarks
   * **Environment:** Event Worker only.
   * This feature is only available when running as `--event-worker` environment.
   */
  export function enterSpan(
    span: import("npm:@opentelemetry/api").Span,
  ): AsyncContextSnapshot | undefined;

  /**
   * Whether OpenTelemetry metrics collection is enabled.
   *
   * @remarks
   * **Environment:** Event Worker only.
   * This feature is only available when running as `--event-worker` environment.
   */
  export const METRICS_ENABLED: boolean;

  /**
   * Whether OpenTelemetry tracing is enabled.
   *
   * @remarks
   * **Environment:** Event Worker only.
   * This feature is only available when running as `--event-worker` environment.
   */
  export const TRACING_ENABLED: boolean;

  export { UserWorker as userWorkers };
}

declare namespace Supabase {
  export namespace ai {
    interface ModelOptions {
      /**
       * Pool embeddings by taking their mean. Applies only for `gte-small` model
       */
      mean_pool?: boolean;

      /**
       * Normalize the embeddings result. Applies only for `gte-small` model
       */
      normalize?: boolean;

      /**
       * Stream response from model. Applies only for LLMs like `mistral` (default: false)
       */
      stream?: boolean;

      /**
       * Automatically abort the request to the model after specified time (in seconds). Applies only for LLMs like `mistral` (default: 60)
       */
      timeout?: number;

      /**
       * Mode for the inference API host. (default: 'ollama')
       */
      mode?: "ollama" | "openaicompatible";
      signal?: AbortSignal;
    }

    export class Session {
      init: Promise<void>;
      /**
       * Create a new model session using given model
       */
      constructor(model: string);

      /**
       * Execute the given prompt in model session
       */
      run(
        prompt:
          | string
          | Omit<
            import("npm:openai").OpenAI.Chat.ChatCompletionCreateParams,
            "model" | "stream"
          >,
        modelOptions?: ModelOptions,
      ): unknown;
    }
  }
}

declare namespace Deno {
  export namespace errors {
    class WorkerRequestCancelled extends Error {}
    class WorkerAlreadyRetired extends Error {}
    class WorkerRequestIdleTimeout extends Error {}

    /** Thrown when an outbound HTTP request is blocked by the rate limiter. */
    class RateLimitError extends Error {
      /**
       * Number of milliseconds until the rate-limit window resets.
       * `null` if the reset time could not be determined.
       */
      retryAfterMs: number | null;
      constructor(message: string, retryAfterMs?: number);
    }
  }
}
