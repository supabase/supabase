import { core, internals, primordials } from "ext:core/mod.js";
import "ext:runtime/request_context.js";

import * as abortSignal from "ext:deno_web/03_abort_signal.js";
import * as base64 from "ext:deno_web/05_base64.js";
import * as console from "ext:deno_console/01_console.js";
import * as crypto from "ext:deno_crypto/00_crypto.js";
import { DOMException } from "ext:deno_web/01_dom_exception.js";
import * as encoding from "ext:deno_web/08_text_encoding.js";
import * as event from "ext:deno_web/02_event.js";
import * as fetch from "ext:deno_fetch/26_fetch.js";
import * as caches from "ext:deno_cache/01_cache.js";
import * as file from "ext:deno_web/09_file.js";
import * as fileReader from "ext:deno_web/10_filereader.js";
import * as formData from "ext:deno_fetch/21_formdata.js";
import * as headers from "ext:deno_fetch/20_headers.js";
import * as streams from "ext:deno_web/06_streams.js";
import * as streams2 from "ext:deno_web/14_compression.js";
import * as timers from "ext:deno_web/02_timers.js";
import * as url from "ext:deno_url/00_url.js";
import * as urlPattern from "ext:deno_url/01_urlpattern.js";
import * as webidl from "ext:deno_webidl/00_webidl.js";
import * as webSocket from "ext:deno_websocket/01_websocket.js";
import * as response from "ext:deno_fetch/23_response.js";
import * as request from "ext:deno_fetch/23_request.js";
import * as globalInterfaces from "ext:deno_web/04_global_interfaces.js";
import * as imageData from "ext:deno_web/16_image_data.js";
import * as broadcastChannel from "ext:deno_broadcast_channel/01_broadcast_channel.js";
import * as performance from "ext:deno_web/15_performance.js";
import * as messagePort from "ext:deno_web/13_message_port.js";
import * as DenoWSStream from "ext:deno_websocket/02_websocketstream.js";
import * as eventSource from "ext:deno_fetch/27_eventsource.js";
import * as WebGPU from "ext:deno_webgpu/00_init.js";
import * as WebGPUSurface from "ext:deno_webgpu/02_surface.js";

import "ext:ai/onnxruntime/cache_adapter.js";

import { SUPABASE_ENV } from "ext:env/env.js";

import { SupabaseEventListener } from "ext:user_event_worker/event_worker.js";
import {
  installEdgeRuntimeNamespace,
  installSupabaseNamespace,
} from "ext:runtime/namespaces.js";

import { promiseRejectMacrotaskCallback } from "ext:runtime/promises.js";
import { installPromiseHook } from "ext:runtime/async_hook.js";
import { registerErrors } from "ext:runtime/errors.js";
import { denoOverrides, fsVars } from "ext:runtime/denoOverrides.js";
import { registerDeclarativeServer } from "ext:runtime/00_serve.js";
import { bootstrap as bootstrapOtel } from "ext:deno_telemetry/telemetry.ts";

import {
  formatException,
  getterOnly,
  nonEnumerable,
  readOnly,
  writable,
} from "ext:runtime/fieldUtils.js";

import {
  Navigator,
  navigator,
  setLanguage,
  setNumCpus,
  setUserAgent,
} from "ext:runtime/navigator.js";

import process from "node:process";

let globalThis_;

const ops = core.ops;
const v8Console = globalThis.console;

const {
  Error,
  ArrayPrototypePop,
  ArrayPrototypeShift,
  ObjectAssign,
  ObjectKeys,
  ObjectDefineProperty,
  ObjectDefineProperties,
  ObjectSetPrototypeOf,
  ObjectHasOwn,
  SafeSet,
  StringPrototypeIncludes,
  StringPrototypeSplit,
  StringPrototypeTrim,
} = primordials;

let image;
function ImageNonEnumerable(getter) {
  let valueIsSet = false;
  let value;

  return {
    get() {
      loadImage();

      if (valueIsSet) {
        return value;
      } else {
        return getter();
      }
    },
    set(v) {
      loadImage();

      valueIsSet = true;
      value = v;
    },
    enumerable: false,
    configurable: true,
  };
}
function ImageWritable(getter) {
  let valueIsSet = false;
  let value;

  return {
    get() {
      loadImage();

      if (valueIsSet) {
        return value;
      } else {
        return getter();
      }
    },
    set(v) {
      loadImage();

      valueIsSet = true;
      value = v;
    },
    enumerable: true,
    configurable: true,
  };
}
function loadImage() {
  if (!image) {
    image = ops.op_lazy_load_esm("ext:deno_canvas/01_image.js");
  }
}

const globalScope = {
  console: nonEnumerable(
    new console.Console((msg, level) => core.print(msg, level > 1)),
  ),

  // cache api
  caches: nonEnumerable(caches.cacheStorage()),
  // timers
  clearInterval: writable(timers.clearInterval),
  clearTimeout: writable(timers.clearTimeout),
  setInterval: writable(timers.setInterval),
  setTimeout: writable(timers.setTimeout),

  // fetch
  Request: nonEnumerable(request.Request),
  Response: nonEnumerable(response.Response),
  Headers: nonEnumerable(headers.Headers),
  fetch: writable(fetch.fetch),

  // base64
  atob: writable(base64.atob),
  btoa: writable(base64.btoa),

  // encoding
  TextDecoder: nonEnumerable(encoding.TextDecoder),
  TextEncoder: nonEnumerable(encoding.TextEncoder),
  TextDecoderStream: nonEnumerable(encoding.TextDecoderStream),
  TextEncoderStream: nonEnumerable(encoding.TextEncoderStream),

  // url
  URL: nonEnumerable(url.URL),
  URLPattern: nonEnumerable(urlPattern.URLPattern),
  URLSearchParams: nonEnumerable(url.URLSearchParams),

  // crypto
  CryptoKey: nonEnumerable(crypto.CryptoKey),
  crypto: readOnly(crypto.crypto),
  Crypto: nonEnumerable(crypto.Crypto),
  SubtleCrypto: nonEnumerable(crypto.SubtleCrypto),

  // streams
  ByteLengthQueuingStrategy: nonEnumerable(
    streams.ByteLengthQueuingStrategy,
  ),
  CountQueuingStrategy: nonEnumerable(
    streams.CountQueuingStrategy,
  ),
  ReadableStream: nonEnumerable(streams.ReadableStream),
  ReadableStreamDefaultReader: nonEnumerable(
    streams.ReadableStreamDefaultReader,
  ),
  ReadableByteStreamController: nonEnumerable(
    streams.ReadableByteStreamController,
  ),
  ReadableStreamBYOBReader: nonEnumerable(
    streams.ReadableStreamBYOBReader,
  ),
  ReadableStreamBYOBRequest: nonEnumerable(
    streams.ReadableStreamBYOBRequest,
  ),
  ReadableStreamDefaultController: nonEnumerable(
    streams.ReadableStreamDefaultController,
  ),
  TransformStream: nonEnumerable(streams.TransformStream),
  TransformStreamDefaultController: nonEnumerable(
    streams.TransformStreamDefaultController,
  ),
  WritableStream: nonEnumerable(streams.WritableStream),
  WritableStreamDefaultWriter: nonEnumerable(
    streams.WritableStreamDefaultWriter,
  ),
  WritableStreamDefaultController: nonEnumerable(
    streams.WritableStreamDefaultController,
  ),
  CompressionStream: nonEnumerable(
    streams2.CompressionStream,
  ),
  DecompressionStream: nonEnumerable(
    streams2.DecompressionStream,
  ),
  // event
  CloseEvent: nonEnumerable(event.CloseEvent),
  CustomEvent: nonEnumerable(event.CustomEvent),
  ErrorEvent: nonEnumerable(event.ErrorEvent),
  Event: nonEnumerable(event.Event),
  EventTarget: nonEnumerable(event.EventTarget),
  MessageEvent: nonEnumerable(event.MessageEvent),
  PromiseRejectionEvent: nonEnumerable(event.PromiseRejectionEvent),
  ProgressEvent: nonEnumerable(event.ProgressEvent),
  reportError: writable(event.reportError),
  DOMException: nonEnumerable(DOMException),

  // file
  Blob: nonEnumerable(file.Blob),
  File: nonEnumerable(file.File),
  FileReader: nonEnumerable(fileReader.FileReader),

  // form data
  FormData: nonEnumerable(formData.FormData),

  // abort signal
  AbortController: nonEnumerable(abortSignal.AbortController),
  AbortSignal: nonEnumerable(abortSignal.AbortSignal),

  // Image
  ImageData: ImageNonEnumerable(() => image.ImageData),
  ImageBitmap: ImageNonEnumerable(() => image.ImageBitmap),
  createImageBitmap: ImageWritable(() => image.createImageBitmap),

  // web sockets
  WebSocket: nonEnumerable(webSocket.WebSocket),

  // performance
  Performance: nonEnumerable(performance.Performance),
  PerformanceEntry: nonEnumerable(performance.PerformanceEntry),
  PerformanceMark: nonEnumerable(performance.PerformanceMark),
  PerformanceMeasure: nonEnumerable(performance.PerformanceMeasure),
  performance: writable(performance.performance),

  // messagePort
  MessagePort: nonEnumerable(messagePort.MessagePort),
  MessageChannel: nonEnumerable(messagePort.MessageChannel),
  structuredClone: writable(messagePort.structuredClone),

  // process
  process: writable(process),

  // Branding as a WebIDL object
  [webidl.brand]: nonEnumerable(webidl.brand),
};

let verboseDeprecatedApiWarning = false;
let deprecatedApiWarningDisabled = false;
const ALREADY_WARNED_DEPRECATED = new SafeSet();

function warnOnDeprecatedApi(apiName, stack, ...suggestions) {
  if (deprecatedApiWarningDisabled) {
    return;
  }

  if (!verboseDeprecatedApiWarning) {
    if (ALREADY_WARNED_DEPRECATED.has(apiName)) {
      return;
    }
    ALREADY_WARNED_DEPRECATED.add(apiName);
    globalThis.console.error(
      `%cwarning: %cUse of deprecated "${apiName}" API. This API will be removed in Deno 2. Run again with DENO_VERBOSE_WARNINGS=1 to get more details.`,
      "color: yellow;",
      "font-weight: bold;",
    );
    return;
  }

  if (ALREADY_WARNED_DEPRECATED.has(apiName + stack)) {
    return;
  }

  // If we haven't warned yet, let's do some processing of the stack trace
  // to make it more useful.
  const stackLines = StringPrototypeSplit(stack, "\n");
  ArrayPrototypeShift(stackLines);
  while (stackLines.length > 0) {
    // Filter out internal frames at the top of the stack - they are not useful
    // to the user.
    if (
      StringPrototypeIncludes(stackLines[0], "(ext:") ||
      StringPrototypeIncludes(stackLines[0], "(node:") ||
      StringPrototypeIncludes(stackLines[0], "<anonymous>")
    ) {
      ArrayPrototypeShift(stackLines);
    } else {
      break;
    }
  }
  // Now remove the last frame if it's coming from "ext:core" - this is most likely
  // event loop tick or promise handler calling a user function - again not
  // useful to the user.
  if (
    stackLines.length > 0 &&
    StringPrototypeIncludes(stackLines[stackLines.length - 1], "(ext:core/")
  ) {
    ArrayPrototypePop(stackLines);
  }

  let isFromRemoteDependency = false;
  const firstStackLine = stackLines[0];
  if (firstStackLine && !StringPrototypeIncludes(firstStackLine, "file:")) {
    isFromRemoteDependency = true;
  }

  ALREADY_WARNED_DEPRECATED.add(apiName + stack);
  globalThis.console.error(
    `%cwarning: %cUse of deprecated "${apiName}" API. This API will be removed in Deno 2.`,
    "color: yellow;",
    "font-weight: bold;",
  );

  globalThis.console.error();
  globalThis.console.error(
    "See the Deno 1 to 2 Migration Guide for more information at https://docs.deno.com/runtime/manual/advanced/migrate_deprecations",
  );
  globalThis.console.error();
  if (stackLines.length > 0) {
    globalThis.console.error("Stack trace:");
    for (let i = 0; i < stackLines.length; i++) {
      globalThis.console.error(`  ${StringPrototypeTrim(stackLines[i])}`);
    }
    globalThis.console.error();
  }

  for (let i = 0; i < suggestions.length; i++) {
    const suggestion = suggestions[i];
    globalThis.console.error(
      `%chint: ${suggestion}`,
      "font-weight: bold;",
    );
  }

  if (isFromRemoteDependency) {
    globalThis.console.error(
      `%chint: It appears this API is used by a remote dependency. Try upgrading to the latest version of that dependency.`,
      "font-weight: bold;",
    );
  }
  globalThis.console.error();
}
ObjectAssign(internals, { warnOnDeprecatedApi });

function runtimeStart(target) {
  // core.setMacrotaskCallback(timers.handleTimerMacrotask);
  // core.setMacrotaskCallback(promiseRejectMacrotaskCallback);

  core.setWasmStreamingCallback(fetch.handleWasmStreaming);
  ops.op_set_format_exception_callback(formatException);
  core.setBuildInfo(target);

  // deno-lint-ignore prefer-primordials
  Error.prepareStackTrace = core.prepareStackTrace;

  registerErrors();
}

// We need to delete globalThis.console
// Before setting up a new one
// This is because v8 sets a console that can't be easily overriden
// and collides with globalScope.console
delete globalThis.console;
ObjectDefineProperties(globalThis, globalScope);

const globalProperties = {
  Window: globalInterfaces.windowConstructorDescriptor,
  window: getterOnly(() => globalThis),
  Navigator: nonEnumerable(Navigator),
  navigator: getterOnly(() => navigator),
  self: getterOnly(() => globalThis),
};
ObjectDefineProperties(globalThis, globalProperties);

const MAKE_HARD_ERR_FN = (msg) => {
  return () => {
    throw new globalThis_.Deno.errors.PermissionDenied(msg);
  };
};

const DENIED_DENO_FS_API_LIST = ObjectKeys(fsVars)
  .reduce(
    (acc, it) => {
      if (fsVars[it] !== void 0) {
        acc[it] = MAKE_HARD_ERR_FN(`Deno.${it} is blocklisted`);
      }
      return acc;
    },
    {},
  );

function dispatchLoadEvent() {
  globalThis_.dispatchEvent(new Event("load"));
}

function dispatchBeforeUnloadEvent(reason) {
  globalThis_.dispatchEvent(
    new CustomEvent("beforeunload", {
      cancelable: true,
      detail: { reason: reason ?? null },
    }),
  );
}

function dispatchUnloadEvent() {
  globalThis_.dispatchEvent(new Event("unload"));
}

function dispatchDrainEvent() {
  internals.drain = true;
  globalThis_.dispatchEvent(new Event("drain"));
}

// Notification that the core received an unhandled promise rejection that is about to
// terminate the runtime. If we can handle it, attempt to do so.
function processUnhandledPromiseRejection(promise, reason) {
  const rejectionEvent = new event.PromiseRejectionEvent(
    "unhandledrejection",
    {
      cancelable: true,
      promise,
      reason,
    },
  );

  // Note that the handler may throw, causing a recursive "error" event
  globalThis_.dispatchEvent(rejectionEvent);

  // If event was not yet prevented, try handing it off to Node compat layer
  // (if it was initialized)
  if (
    !rejectionEvent.defaultPrevented &&
    typeof internals.nodeProcessUnhandledRejectionCallback !== "undefined"
  ) {
    internals.nodeProcessUnhandledRejectionCallback(rejectionEvent);
  }

  // If event was not prevented (or "unhandledrejection" listeners didn't
  // throw) we will let Rust side handle it.
  if (rejectionEvent.defaultPrevented) {
    return true;
  }

  return false;
}

function processRejectionHandled(promise, reason) {
  const rejectionHandledEvent = new event.PromiseRejectionEvent(
    "rejectionhandled",
    { promise, reason },
  );

  // Note that the handler may throw, causing a recursive "error" event
  globalThis_.dispatchEvent(rejectionHandledEvent);

  if (typeof internals.nodeProcessRejectionHandledCallback !== "undefined") {
    internals.nodeProcessRejectionHandledCallback(rejectionHandledEvent);
  }
}

globalThis.bootstrapSBEdge = (opts, ctx) => {
  let bootstrapMockFnThrowError = false;

  globalThis_ = globalThis;

  // We should delete this after initialization,
  // Deleting it during bootstrapping can backfire
  delete globalThis.__bootstrap;
  delete globalThis.bootstrap;

  ObjectSetPrototypeOf(globalThis, Window.prototype);
  event.setEventTargetData(globalThis);
  event.saveGlobalThisReference(globalThis);

  const eventHandlers = [
    "error",
    "load",
    "beforeunload",
    "unload",
    "unhandledrejection",
    "drain",
  ];

  eventHandlers.forEach((handlerName) =>
    event.defineEventHandler(globalThis, handlerName)
  );

  // Nothing listens to this, but it warms up the code paths for event dispatch
  (new event.EventTarget()).dispatchEvent(new Event("warmup"));

  /**
   * @type {{
   * target: string,
   * kind: 'user' | 'main' | 'event',
   * inspector: boolean,
   * migrated: boolean,
   * debug: boolean,
   * version: {
   * 	runtime: string,
   * 	deno: string,
   * },
   * flags: {
   * 	SHOULD_DISABLE_DEPRECATED_API_WARNING: boolean,
   * 	SHOULD_USE_VERBOSE_DEPRECATED_API_WARNING: boolean
   * },
   * otel: [] | [number, number]
   * }}
   */
  const {
    migrated,
    target,
    kind,
    version,
    inspector,
    flags,
    otel,
  } = opts;

  deprecatedApiWarningDisabled = flags["SHOULD_DISABLE_DEPRECATED_API_WARNING"];
  verboseDeprecatedApiWarning =
    flags["SHOULD_USE_VERBOSE_DEPRECATED_API_WARNING"];
  bootstrapMockFnThrowError = ctx?.shouldBootstrapMockFnThrowError ?? false;

  runtimeStart(target);

  ObjectAssign(internals, {
    bootstrapArgs: { opts },
    worker: { kind },
    __ctx: ctx,
  });

  installPromiseHook(kind);
  installEdgeRuntimeNamespace(kind, ctx.terminationRequestToken);
  installSupabaseNamespace(kind);

  ObjectDefineProperty(
    globalThis,
    "SUPABASE_VERSION",
    readOnly(String(version.runtime)),
  );
  ObjectDefineProperty(globalThis, "DENO_VERSION", readOnly(version.deno));

  // set these overrides after runtimeStart
  ObjectDefineProperties(denoOverrides, {
    build: readOnly(core.build),
    env: readOnly(SUPABASE_ENV),
    pid: readOnly(globalThis.__pid),
    args: readOnly([]), // args are set to be empty
    mainModule: getterOnly(() => ops.op_main_module()),
    version: getterOnly(() => ({
      deno:
        // TODO: It should be changed to a well-known name for the ecosystem.
        `supabase-edge-runtime-${globalThis.SUPABASE_VERSION} (compatible with Deno v${globalThis.DENO_VERSION})`,
      v8: "11.6.189.12",
      typescript: "5.1.6",
    })),
  });

  if (inspector) {
    ObjectDefineProperties(globalThis, {
      console: nonEnumerable(v8Console),
    });
  }

  if (kind === "user" && !inspector) {
    // override console
    ObjectDefineProperties(globalThis, {
      console: nonEnumerable(
        new console.Console((msg, level) => {
          return ops.op_user_worker_log(msg, level);
        }),
      ),
    });
  }

  if (ctx?.exposeRequestTraceId) {
    ObjectDefineProperty(globalThis, "getRequestTraceId", {
      get() {
        return internals.getRequestTraceId;
      },
      configurable: true,
      enumerable: false,
    });
  }

  ObjectDefineProperty(globalThis, "Deno", readOnly(denoOverrides));

  setNumCpus(1); // explicitly setting no of CPUs to 1 (since we don't allow workers)
  setUserAgent(
    // TODO: It should be changed to a well-known name for the ecosystem.
    `Deno/${globalThis.DENO_VERSION} (variant; SupabaseEdgeRuntime/${globalThis.SUPABASE_VERSION})`,
  );
  setLanguage("en");

  core.addMainModuleHandler((main) => {
    if (migrated && !ctx?.suppressEszipMigrationWarning) {
      globalThis.console.warn(
        "It appears this function was deployed using an older version of Supabase CLI.\n",
        "For best performance and compatibility we recommend re-deploying the function using the latest version of the CLI.",
      );
    }

    // Find declarative fetch handler
    if (ObjectHasOwn(main, "default")) {
      registerDeclarativeServer(main.default);
    }

    bootstrapOtel(otel);
  });

  /// DISABLE SHARED MEMORY AND INSTALL MEM CHECK TIMING

  // NOTE: We should not allow user workers to use shared memory. This is because they are not
  // counted in the external memory statistics of the individual isolates.

  // NOTE(Nyannyacha): Put below inside `kind === 'user'` block if we have the plan to support a
  // shared array buffer across the isolates. But for now, we explicitly disabled the shared
  // buffer option between isolate globally in `deno_runtime.rs`, so this patch also applies
  // regardless of worker type.
  const wasmMemoryCtor = globalThis.WebAssembly.Memory;
  const wasmMemoryPrototypeGrow = wasmMemoryCtor.prototype.grow;

  function patchedWasmMemoryPrototypeGrow(delta) {
    const mem = wasmMemoryPrototypeGrow.call(this, delta);

    ops.op_schedule_mem_check();

    return mem;
  }

  wasmMemoryCtor.prototype.grow = patchedWasmMemoryPrototypeGrow;

  function patchedWasmMemoryCtor(maybeOpts) {
    if (typeof maybeOpts === "object" && maybeOpts["shared"] === true) {
      throw new TypeError("Creating a shared memory is not supported");
    }

    return new wasmMemoryCtor(maybeOpts);
  }

  globalThis.SharedArrayBuffer = globalThis.ArrayBuffer;
  globalThis.WebAssembly.Memory = patchedWasmMemoryCtor;

  /// DISABLE SHARED MEMORY INSTALL MEM CHECK TIMING

  if (kind === "user") {
    const apisToBeOverridden = {
      ...DENIED_DENO_FS_API_LIST,

      "cwd": true,

      "open": true,
      "lstat": true,
      "stat": true,
      "realPath": true,
      "realPathSync": true,
      "create": true,
      "remove": true,
      "writeFile": true,
      "writeTextFile": true,
      "readFile": true,
      "readTextFile": true,
      "mkdir": true,
      "makeTempDir": true,
      "makeTempFile": true,
      "readDir": true,
      "copyFile": true,

      "kill": "mock",
      "exit": "mock",
      "addSignalListener": "mock",
      "removeSignalListener": "mock",

      "lstatSync": "allowIfRuntimeIsInInit",
      "statSync": "allowIfRuntimeIsInInit",
      "removeSync": "allowIfRuntimeIsInInit",
      "writeFileSync": "allowIfRuntimeIsInInit",
      "writeTextFileSync": "allowIfRuntimeIsInInit",
      "readFileSync": "allowIfRuntimeIsInInit",
      "readTextFileSync": "allowIfRuntimeIsInInit",
      "mkdirSync": "allowIfRuntimeIsInInit",
      "makeTempDirSync": "allowIfRuntimeIsInInit",
      "makeTempFileSync": "allowIfRuntimeIsInInit",
      "readDirSync": "allowIfRuntimeIsInInit",
      "copyFileSync": "allowIfRuntimeIsInInit",

      // TODO: use a non-hardcoded path
      "execPath": () => "/bin/edge-runtime",
      "memoryUsage": () => ops.op_runtime_memory_usage(),
    };

    if (ctx?.useReadSyncFileAPI) {
      apisToBeOverridden["readFileSync"] = "warnIfRuntimeIsAlreadyInit";
      apisToBeOverridden["readTextFileSync"] = "warnIfRuntimeIsAlreadyInit";
    }

    const apiNames = ObjectKeys(apisToBeOverridden);

    for (const name of apiNames) {
      const value = apisToBeOverridden[name];

      if (value === false) {
        delete Deno[name];
      } else if (typeof value === "function") {
        Deno[name] = value;
      } else if (typeof value === "string") {
        switch (value) {
          case "mock": {
            Deno[name] = () => {
              if (bootstrapMockFnThrowError) {
                throw new TypeError("called MOCK_FN");
              }
            };
            break;
          }
          case "allowIfRuntimeIsInInit": {
            const originalFn = Deno[name];
            const blocklistedFn = MAKE_HARD_ERR_FN(
              `Deno.${name} is blocklisted on the current context`,
            );
            Deno[name] = (...args) => {
              if (ops.op_is_runtime_init()) {
                return originalFn(...args);
              } else {
                return blocklistedFn();
              }
            };
            break;
          }
          case "warnIfRuntimeIsAlreadyInit": {
            const originalFn = Deno[name];
            Deno[name] = (...args) => {
              if (ops.op_is_runtime_init()) {
                return originalFn(...args);
              } else {
                globalThis.console.error(
                  `WARNING: Do not use Deno.${name} inside the async callback. This has performance impacts and will be disallowed in the future.\nUse the async version instead.`,
                );
                return originalFn(...args);
              }
            };
            break;
          }
        }
      }
    }
  }

  if (kind === "event") {
    ObjectDefineProperties(globalThis, {
      EventManager: getterOnly(() => SupabaseEventListener),
    });
  }

  if (nodeBootstrap) {
    nodeBootstrap({
      runningOnMainThread: true,
      usesLocalNodeModulesDir: false,
      argv: void 0,
      nodeDebug: Deno.env.get("NODE_DEBUG") ?? "",
    });

    delete globalThis.nodeBootstrap;
  }

  delete globalThis.bootstrapSBEdge;
};

const nodeBootstrap = globalThis.nodeBootstrap;

globalThis.bootstrap = {
  dispatchLoadEvent,
  dispatchUnloadEvent,
  dispatchBeforeUnloadEvent,
  // dispatchProcessExitEvent,
  // dispatchProcessBeforeExitEvent,
  dispatchDrainEvent,
};

core.setUnhandledPromiseRejectionHandler(processUnhandledPromiseRejection);
core.setHandledPromiseRejectionHandler(processRejectionHandled);
nodeBootstrap({ warmup: true });
