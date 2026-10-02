// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { core, internals } from "ext:core/mod.js";
import { initializeDebugEnv } from "ext:deno_node/internal/util/debuglog.ts";
import {
  op_getegid,
  op_geteuid,
  op_node_process_kill,
  op_process_abort,
} from "ext:core/ops";

import { warnNotImplemented } from "ext:deno_node/_utils.ts";
import { EventEmitter } from "node:events";
import Module, { getBuiltinModule } from "node:module";
import { report } from "ext:deno_node/internal/process/report.ts";
import { validateString } from "ext:deno_node/internal/validators.mjs";
import {
  ERR_INVALID_ARG_TYPE,
  ERR_OUT_OF_RANGE,
  ERR_UNKNOWN_SIGNAL,
  errnoException,
} from "ext:deno_node/internal/errors.ts";
import { getOptionValue } from "ext:deno_node/internal/options.ts";
import { assert } from "ext:deno_node/_util/asserts.ts";
import { join } from "node:path";
import { pathFromURL } from "ext:deno_web/00_infra.js";
import {
  arch as arch_,
  chdir,
  cwd,
  env,
  nextTick as _nextTick,
  version,
  versions,
} from "ext:deno_node/_process/process.ts";
import { _exiting } from "ext:deno_node/_process/exiting.ts";
export {
  _nextTick as nextTick,
  chdir,
  cwd,
  env,
  getBuiltinModule,
  version,
  versions,
};
import {
  createWritableStdioStream,
  initStdin,
} from "ext:deno_node/_process/streams.mjs";
import {
  enableNextTick,
  processTicksAndRejections,
  runNextTicks,
} from "ext:deno_node/_next_tick.ts";
import { isWindows } from "ext:deno_node/_util/os.ts";
import * as io from "ext:deno_io/12_io.js";

export let argv0 = "";

export let arch = "";

export let platform = "";

export let pid = 0;

let stdin, stdout, stderr;

export { stderr, stdin, stdout };

import { getBinding } from "ext:deno_node/internal_binding/mod.ts";
import * as constants from "ext:deno_node/internal_binding/constants.ts";
import * as uv from "ext:deno_node/internal_binding/uv.ts";
import type { BindingName } from "ext:deno_node/internal_binding/mod.ts";
import { buildAllowedFlags } from "ext:deno_node/internal/process/per_thread.mjs";
import { setProcess } from "ext:deno_node/_events.mjs";

const notImplementedEvents = [
  "multipleResolves",
  "worker",
];

export const argv: string[] = ["", ""];

// In Node, `process.exitCode` is initially `undefined` until set.
// And retains any value as long as it's nullish or number-ish.
let ProcessExitCode: undefined | null | string | number;

export const execArgv: string[] = [];

/** https://nodejs.org/api/process.html#process_process_exit_code */
export const exit = (code?: number | string) => {
  // if (code || code === 0) {
  //   process.exitCode = code;
  // } else if (Number.isNaN(code)) {
  //   process.exitCode = 1;
  // }

  // ProcessExitCode = denoOs.getExitCode();
  if (!process._exiting) {
    process._exiting = true;
    // FIXME(bartlomieju): this is wrong, we won't be using syscall to exit
    // and thus the `unload` event will not be emitted to properly trigger "emit"
    // event on `process`.
    process.emit("exit", ProcessExitCode);
  }

  // Any valid thing `process.exitCode` set is already held in Deno.exitCode.
  // At this point, we don't have to pass around Node's raw/string exit value.
  process.reallyExit(ProcessExitCode);
};

/** https://nodejs.org/api/process.html#processumaskmask */
export const umask = () => {
  // Always return the system default umask value.
  // We don't use Deno.umask here because it has a race
  // condition bug.
  // See https://github.com/denoland/deno_std/issues/1893#issuecomment-1032897779
  return 0o22;
};

export const abort = () => {
  op_process_abort();
};

function addReadOnlyProcessAlias(
  name: string,
  option: string,
  enumerable = true,
) {
  const value = getOptionValue(option);

  if (value) {
    Object.defineProperty(process, name, {
      writable: false,
      configurable: true,
      enumerable,
      value,
    });
  }
}

function createWarningObject(
  warning: string,
  type: string,
  code?: string,
  // deno-lint-ignore ban-types
  ctor?: Function,
  detail?: string,
): Error {
  assert(typeof warning === "string");

  // deno-lint-ignore no-explicit-any
  const warningErr: any = new Error(warning);
  warningErr.name = String(type || "Warning");

  if (code !== undefined) {
    warningErr.code = code;
  }
  if (detail !== undefined) {
    warningErr.detail = detail;
  }

  // @ts-ignore this function is not available in lib.dom.d.ts
  Error.captureStackTrace(warningErr, ctor || process.emitWarning);

  return warningErr;
}

function doEmitWarning(warning: Error) {
  process.emit("warning", warning);
}

/** https://nodejs.org/api/process.html#process_process_emitwarning_warning_options */
export function emitWarning(
  warning: string | Error,
  type:
    // deno-lint-ignore ban-types
    | { type: string; detail: string; code: string; ctor: Function }
    | string
    | null,
  code?: string,
  // deno-lint-ignore ban-types
  ctor?: Function,
) {
  let detail;

  if (type !== null && typeof type === "object" && !Array.isArray(type)) {
    ctor = type.ctor;
    code = type.code;

    if (typeof type.detail === "string") {
      detail = type.detail;
    }

    type = type.type || "Warning";
  } else if (typeof type === "function") {
    ctor = type;
    code = undefined;
    type = "Warning";
  }

  if (type !== undefined) {
    validateString(type, "type");
  }

  if (typeof code === "function") {
    ctor = code;
    code = undefined;
  } else if (code !== undefined) {
    validateString(code, "code");
  }

  if (typeof warning === "string") {
    warning = createWarningObject(warning, type as string, code, ctor, detail);
  } else if (!(warning instanceof Error)) {
    throw new ERR_INVALID_ARG_TYPE("warning", ["Error", "string"], warning);
  }

  if (warning.name === "DeprecationWarning") {
    // deno-lint-ignore no-explicit-any
    if ((process as any).noDeprecation) {
      return;
    }

    // deno-lint-ignore no-explicit-any
    if ((process as any).throwDeprecation) {
      // Delay throwing the error to guarantee that all former warnings were
      // properly logged.
      return process.nextTick(() => {
        throw warning;
      });
    }
  }

  process.nextTick(doEmitWarning, warning);
}

export function hrtime(time?: [number, number]): [number, number] {
  const milli = performance.now();
  const sec = Math.floor(milli / 1000);
  const nano = Math.floor(milli * 1_000_000 - sec * 1_000_000_000);
  if (!time) {
    return [sec, nano];
  }
  const [prevSec, prevNano] = time;
  return [sec - prevSec, nano - prevNano];
}

hrtime.bigint = function (): bigint {
  const [sec, nano] = hrtime();
  return BigInt(sec) * 1_000_000_000n + BigInt(nano);
};

export function memoryUsage(): {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
  arrayBuffers: number;
} {
  return {
    ...Deno.memoryUsage(),
    arrayBuffers: 0,
  };
}

memoryUsage.rss = function (): number {
  return memoryUsage().rss;
};

// Returns a negative error code than can be recognized by errnoException
function _kill(pid: number, sig: number): number {
  const maybeMapErrno = (res: number) =>
    res === 0 ? res : uv.mapSysErrnoToUvErrno(res);
  // signal 0 does not exist in constants.os.signals, thats why it have to be handled explicitly
  if (sig === 0) {
    return maybeMapErrno(op_node_process_kill(pid, 0));
  }
  const maybeSignal = Object.entries(constants.os.signals).find((
    [_, numericCode],
  ) => numericCode === sig);

  if (!maybeSignal) {
    return uv.codeMap.get("EINVAL");
  }
  return maybeMapErrno(op_node_process_kill(pid, sig));
}

export function dlopen(module, filename, _flags) {
  // NOTE(bartlomieju): _flags is currently ignored, but we don't warn for it
  // as it makes DX bad, even though it might not be needed:
  // https://github.com/denoland/deno/issues/20075
  Module._extensions[".node"](module, filename);
  return module;
}

export function kill(pid: number, sig: string | number = "SIGTERM") {
  if (pid != (pid | 0)) {
    throw new ERR_INVALID_ARG_TYPE("pid", "number", pid);
  }

  let err;
  if (typeof sig === "number") {
    err = process._kill(pid, sig);
  } else {
    if (sig in constants.os.signals) {
      // @ts-ignore Index previously checked
      err = process._kill(pid, constants.os.signals[sig]);
    } else {
      throw new ERR_UNKNOWN_SIGNAL(sig);
    }
  }

  if (err) {
    throw errnoException(err, "kill");
  }

  return true;
}

let getgid, getuid, getegid, geteuid;

if (!isWindows) {
  getgid = () => Deno.gid();
  getuid = () => Deno.uid();
  getegid = () => op_getegid();
  geteuid = () => op_geteuid();
}

export { getegid, geteuid, getgid, getuid };

const ALLOWED_FLAGS = buildAllowedFlags();

// deno-lint-ignore no-explicit-any
function uncaughtExceptionHandler(err: any, origin: string) {
  // The origin parameter can be 'unhandledRejection' or 'uncaughtException'
  // depending on how the uncaught exception was created. In Node.js,
  // exceptions thrown from the top level of a CommonJS module are reported as
  // 'uncaughtException', while exceptions thrown from the top level of an ESM
  // module are reported as 'unhandledRejection'. Deno does not have a true
  // CommonJS implementation, so all exceptions thrown from the top level are
  // reported as 'uncaughtException'.
  process.emit("uncaughtExceptionMonitor", err, origin);
  process.emit("uncaughtException", err, origin);
}

export let execPath: string = Object.freeze({
  __proto__: String.prototype,
  toString() {
    execPath = Deno.execPath();
    return execPath;
  },
  get length() {
    return this.toString().length;
  },
  [Symbol.for("Deno.customInspect")](inspect, options) {
    return inspect(this.toString(), options);
  },
  // deno-lint-ignore no-explicit-any
}) as any as string;

// The process class needs to be an ES5 class because it can be instantiated
// in Node without the `new` keyword. It's not a true class in Node. Popular
// test runners like Jest rely on this.
// deno-lint-ignore no-explicit-any
function Process(this: any) {
  // deno-lint-ignore no-explicit-any
  if (!(this instanceof Process)) return new (Process as any)();

  EventEmitter.call(this);
}
Process.prototype = Object.create(EventEmitter.prototype);

/** https://nodejs.org/api/process.html#processrelease */
Object.defineProperty(Process.prototype, "release", {
  get() {
    return {
      name: "node",
      sourceUrl:
        `https://nodejs.org/download/release/${version}/node-${version}.tar.gz`,
      headersUrl:
        `https://nodejs.org/download/release/${version}/node-${version}-headers.tar.gz`,
    };
  },
});

/** https://nodejs.org/api/process.html#process_process_arch */
Object.defineProperty(Process.prototype, "arch", {
  get() {
    return arch;
  },
});

Object.defineProperty(Process.prototype, "report", {
  get() {
    return report;
  },
});

Object.defineProperty(Process.prototype, "title", {
  get() {
    return "deno";
  },
  set(_value) {
    // NOTE(bartlomieju): this is a noop. Node.js doesn't guarantee that the
    // process name will be properly set and visible from other tools anyway.
    // Might revisit in the future.
  },
});

/**
 * https://nodejs.org/api/process.html#process_process_argv
 * Read permissions are required in order to get the executable route
 */
Process.prototype.argv = argv;

Object.defineProperty(Process.prototype, "argv0", {
  get() {
    return argv0;
  },
  set(_val) {},
});

/** https://nodejs.org/api/process.html#process_process_chdir_directory */
Process.prototype.chdir = chdir;

/** https://nodejs.org/api/process.html#processconfig */
Process.prototype.config = {
  target_defaults: {
    default_configuration: "Release",
  },
  variables: {
    llvm_version: "0.0",
    enable_lto: "false",
  },
};

Process.prototype.cpuUsage = function () {
  warnNotImplemented("process.cpuUsage()");
  return {
    user: 0,
    system: 0,
  };
};

/** https://nodejs.org/api/process.html#process_process_cwd */
Process.prototype.cwd = cwd;

/**
 * https://nodejs.org/api/process.html#process_process_env
 * Requires env permissions
 */
Process.prototype.env = env;

/** https://nodejs.org/api/process.html#process_process_execargv */
Process.prototype.execArgv = execArgv;

/** https://nodejs.org/api/process.html#process_process_exit_code */
Process.prototype.exit = exit;

/** https://nodejs.org/api/process.html#processabort */
Process.prototype.abort = abort;

// Undocumented Node API that is used by `signal-exit` which in turn
// is used by `node-tap`. It was marked for removal a couple of years
// ago. See https://github.com/nodejs/node/blob/6a6b3c54022104cc110ab09044a2a0cecb8988e7/lib/internal/bootstrap/node.js#L172
Process.prototype.reallyExit = (code: number) => {
  return Deno.exit(code || 0);
};

Process.prototype._exiting = _exiting;

/** https://nodejs.org/api/process.html#processexitcode_1 */
Object.defineProperty(Process.prototype, "exitCode", {
  get() {
    return ProcessExitCode;
  },
  set(code: number | string | null | undefined) {
    let parsedCode: number;
    if (code == null) {
      parsedCode = 0;
    } else if (typeof code === "number") {
      parsedCode = code;
    } else if (typeof code === "string") {
      parsedCode = Number(code);
    } else {
      throw new ERR_INVALID_ARG_TYPE("code", "number", code);
    }

    if (!Number.isInteger(parsedCode)) {
      throw new ERR_OUT_OF_RANGE("code", "an integer", parsedCode);
    }

    // denoOs.setExitCode(parsedCode);
    ProcessExitCode = code;
  },
});

// Typed as any to avoid importing "module" module for types
Process.prototype.mainModule = undefined;

/** https://nodejs.org/api/process.html#process_process_nexttick_callback_args */
Process.prototype.nextTick = _nextTick;

Process.prototype.dlopen = dlopen;

/** https://nodejs.org/api/process.html#process_process_events */
Process.prototype.on = function (
  // deno-lint-ignore no-explicit-any
  this: any,
  event: string,
  // deno-lint-ignore no-explicit-any
  listener: (...args: any[]) => void,
) {
  if (notImplementedEvents.includes(event)) {
    warnNotImplemented(`process.on("${event}")`);
    EventEmitter.prototype.on.call(this, event, listener);
  } else if (event.startsWith("SIG")) {
    if (event === "SIGBREAK" && Deno.build.os !== "windows") {
      // Ignores SIGBREAK if the platform is not windows.
    } else if (event === "SIGTERM" && Deno.build.os === "windows") {
      // Ignores SIGTERM on windows.
    } else if (
      event !== "SIGBREAK" && event !== "SIGINT" && Deno.build.os === "windows"
    ) {
      // TODO(#26331): Ignores all signals except SIGBREAK and SIGINT on windows.
    } else {
      EventEmitter.prototype.on.call(this, event, listener);
      Deno.addSignalListener(event as Deno.Signal, listener);
    }
  } else {
    EventEmitter.prototype.on.call(this, event, listener);
  }

  return this;
};

Process.prototype.off = function (
  // deno-lint-ignore no-explicit-any
  this: any,
  event: string,
  // deno-lint-ignore no-explicit-any
  listener: (...args: any[]) => void,
) {
  if (notImplementedEvents.includes(event)) {
    warnNotImplemented(`process.off("${event}")`);
    EventEmitter.prototype.off.call(this, event, listener);
  } else if (event.startsWith("SIG")) {
    if (event === "SIGBREAK" && Deno.build.os !== "windows") {
      // Ignores SIGBREAK if the platform is not windows.
    } else if (
      event !== "SIGBREAK" && event !== "SIGINT" && Deno.build.os === "windows"
    ) {
      // Ignores all signals except SIGBREAK and SIGINT on windows.
    } else {
      EventEmitter.prototype.off.call(this, event, listener);
      Deno.removeSignalListener(event as Deno.Signal, listener);
    }
  } else {
    EventEmitter.prototype.off.call(this, event, listener);
  }

  return this;
};

Process.prototype.emit = function (
  // deno-lint-ignore no-explicit-any
  this: any,
  event: string,
  // deno-lint-ignore no-explicit-any
  ...args: any[]
): boolean {
  if (event.startsWith("SIG")) {
    if (event === "SIGBREAK" && Deno.build.os !== "windows") {
      // Ignores SIGBREAK if the platform is not windows.
    } else {
      Deno.kill(Deno.pid, event as Deno.Signal);
    }
  } else {
    return EventEmitter.prototype.emit.call(this, event, ...args);
  }

  return true;
};

Process.prototype.prependListener = function (
  // deno-lint-ignore no-explicit-any
  this: any,
  event: string,
  // deno-lint-ignore no-explicit-any
  listener: (...args: any[]) => void,
) {
  if (notImplementedEvents.includes(event)) {
    warnNotImplemented(`process.prependListener("${event}")`);
    EventEmitter.prototype.prependListener.call(this, event, listener);
  } else if (event.startsWith("SIG")) {
    if (event === "SIGBREAK" && Deno.build.os !== "windows") {
      // Ignores SIGBREAK if the platform is not windows.
    } else {
      EventEmitter.prototype.prependListener.call(this, event, listener);
      Deno.addSignalListener(event as Deno.Signal, listener);
    }
  } else {
    EventEmitter.prototype.prependListener.call(this, event, listener);
  }

  return this;
};

/** https://nodejs.org/api/process.html#process_process_pid */
Object.defineProperty(Process.prototype, "pid", {
  get() {
    return pid;
  },
});

/** https://nodejs.org/api/process.html#processppid */
Object.defineProperty(Process.prototype, "ppid", {
  get() {
    return Deno.ppid;
  },
});

/** https://nodejs.org/api/process.html#process_process_platform */
Object.defineProperty(Process.prototype, "platform", {
  get() {
    return platform;
  },
});

// https://nodejs.org/api/process.html#processsetsourcemapsenabledval
Process.prototype.setSourceMapsEnabled = (_val: boolean) => {
  // This is a no-op in Deno. Source maps are always enabled.
  // TODO(@satyarohith): support disabling source maps if needed.
};

Process.prototype.addListener = function (
  // deno-lint-ignore no-explicit-any
  this: any,
  event: string,
  // deno-lint-ignore no-explicit-any
  listener: (...args: any[]) => void,
) {
  if (notImplementedEvents.includes(event)) {
    warnNotImplemented(`process.addListener("${event}")`);
  }

  return this.on(event, listener);
};

Process.prototype.removeListener = function (
  // deno-lint-ignore no-explicit-any
  this: any,
  event: string, // deno-lint-ignore no-explicit-any
  listener: (...args: any[]) => void,
) {
  if (notImplementedEvents.includes(event)) {
    warnNotImplemented(`process.removeListener("${event}")`);
  }

  return this.off(event, listener);
};

/**
 * Returns the current high-resolution real time in a [seconds, nanoseconds]
 * tuple.
 *
 * Note: You need to give --allow-hrtime permission to Deno to actually get
 * nanoseconds precision values. If you don't give 'hrtime' permission, the returned
 * values only have milliseconds precision.
 *
 * `time` is an optional parameter that must be the result of a previous process.hrtime() call to diff with the current time.
 *
 * These times are relative to an arbitrary time in the past, and not related to the time of day and therefore not subject to clock drift. The primary use is for measuring performance between intervals.
 * https://nodejs.org/api/process.html#process_process_hrtime_time
 */
Process.prototype.hrtime = hrtime;

/**
 * @private
 *
 * NodeJS internal, use process.kill instead
 */
Process.prototype._kill = _kill;

/** https://nodejs.org/api/process.html#processkillpid-signal */
Process.prototype.kill = kill;

Process.prototype.memoryUsage = memoryUsage;

/** https://nodejs.org/api/process.html#process_process_stderr */
Process.prototype.stderr = stderr;

/** https://nodejs.org/api/process.html#process_process_stdin */
Process.prototype.stdin = stdin;

/** https://nodejs.org/api/process.html#process_process_stdout */
Process.prototype.stdout = stdout;

/** https://nodejs.org/api/process.html#process_process_version */
Process.prototype.version = version;

/** https://nodejs.org/api/process.html#process_process_versions */
Process.prototype.versions = versions;

/** https://nodejs.org/api/process.html#process_process_emitwarning_warning_options */
Process.prototype.emitWarning = emitWarning;

Process.prototype.binding = (name: BindingName) => {
  return getBinding(name);
};

/** https://nodejs.org/api/process.html#processumaskmask */
Process.prototype.umask = () => {
  // Always return the system default umask value.
  // We don't use Deno.umask here because it has a race
  // condition bug.
  // See https://github.com/denoland/deno_std/issues/1893#issuecomment-1032897779
  return 0o22;
};

/** This method is removed on Windows */
Process.prototype.getgid = getgid;

/** This method is removed on Windows */
Process.prototype.getuid = getuid;

/** This method is removed on Windows */
Process.prototype.getegid = getegid;

/** This method is removed on Windows */
Process.prototype.geteuid = geteuid;

Process.prototype.getBuiltinModule = getBuiltinModule;

// TODO(kt3k): Implement this when we added -e option to node compat mode
Process.prototype._eval = undefined;

/** https://nodejs.org/api/process.html#processexecpath */

Object.defineProperty(Process.prototype, "execPath", {
  get() {
    return String(execPath);
  },
  set(path: string) {
    execPath = path;
  },
});

/** https://nodejs.org/api/process.html#processuptime */
Process.prototype.uptime = () => {
  return Number((performance.now() / 1000).toFixed(9));
};

/** https://nodejs.org/api/process.html#processallowednodeenvironmentflags */
Object.defineProperty(Process.prototype, "allowedNodeEnvironmentFlags", {
  get() {
    return ALLOWED_FLAGS;
  },
});

export const allowedNodeEnvironmentFlags = ALLOWED_FLAGS;

Process.prototype.features = { inspector: false };

// TODO(kt3k): Get the value from --no-deprecation flag.
Process.prototype.noDeprecation = false;

if (isWindows) {
  delete Process.prototype.getgid;
  delete Process.prototype.getuid;
  delete Process.prototype.getegid;
  delete Process.prototype.geteuid;
}

/** https://nodejs.org/api/process.html#process_process */
// @ts-ignore TS doesn't work well with ES5 classes
const process = new Process();

/* Set owned property */
process.versions = versions;
process.env = env;

Object.defineProperty(process, Symbol.toStringTag, {
  enumerable: false,
  writable: true,
  configurable: false,
  value: "process",
});

addReadOnlyProcessAlias("noDeprecation", "--no-deprecation");
addReadOnlyProcessAlias("throwDeprecation", "--throw-deprecation");

export const removeListener = process.removeListener;
export const removeAllListeners = process.removeAllListeners;

let unhandledRejectionListenerCount = 0;
let rejectionHandledListenerCount = 0;
let uncaughtExceptionListenerCount = 0;
let beforeExitListenerCount = 0;
let exitListenerCount = 0;

process.on("newListener", (event: string) => {
  switch (event) {
    case "unhandledRejection":
      unhandledRejectionListenerCount++;
      break;
    case "rejectionHandled":
      rejectionHandledListenerCount++;
      break;
    case "uncaughtException":
      uncaughtExceptionListenerCount++;
      break;
    case "beforeExit":
      beforeExitListenerCount++;
      break;
    case "exit":
      exitListenerCount++;
      break;
    default:
      return;
  }
  synchronizeListeners();
});

process.on("removeListener", (event: string) => {
  switch (event) {
    case "unhandledRejection":
      unhandledRejectionListenerCount--;
      break;
    case "rejectionHandled":
      rejectionHandledListenerCount--;
      break;
    case "uncaughtException":
      uncaughtExceptionListenerCount--;
      break;
    case "beforeExit":
      beforeExitListenerCount--;
      break;
    case "exit":
      exitListenerCount--;
      break;
    default:
      return;
  }
  synchronizeListeners();
});

function processOnError(event: ErrorEvent) {
  if (process.listenerCount("uncaughtException") > 0) {
    event.preventDefault();
  }

  uncaughtExceptionHandler(event.error, "uncaughtException");
}

function dispatchProcessBeforeExitEvent() {
  process.emit("beforeExit", process.exitCode || 0);
  processTicksAndRejections();
  return core.eventLoopHasMoreWork();
}

function dispatchProcessExitEvent() {
  if (!process._exiting) {
    process._exiting = true;
    process.emit("exit", process.exitCode || 0);
  }
}

function synchronizeListeners() {
  // Install special "unhandledrejection" handler, that will be called
  // last.
  if (
    unhandledRejectionListenerCount > 0 || uncaughtExceptionListenerCount > 0
  ) {
    internals.nodeProcessUnhandledRejectionCallback = (event) => {
      if (process.listenerCount("unhandledRejection") === 0) {
        // The Node.js default behavior is to raise an uncaught exception if
        // an unhandled rejection occurs and there are no unhandledRejection
        // listeners.

        event.preventDefault();
        uncaughtExceptionHandler(event.reason, "unhandledRejection");
        return;
      }

      event.preventDefault();
      process.emit("unhandledRejection", event.reason, event.promise);
    };
  } else {
    internals.nodeProcessUnhandledRejectionCallback = undefined;
  }

  // Install special "handledrejection" handler, that will be called
  // last.
  if (rejectionHandledListenerCount > 0) {
    internals.nodeProcessRejectionHandledCallback = (event) => {
      process.emit("rejectionHandled", event.reason, event.promise);
    };
  } else {
    internals.nodeProcessRejectionHandledCallback = undefined;
  }

  if (uncaughtExceptionListenerCount > 0) {
    globalThis.addEventListener("error", processOnError);
  } else {
    globalThis.removeEventListener("error", processOnError);
  }
}

// Overwrites the 1st and 2nd items with getters.
Object.defineProperty(argv, "0", { get: () => argv0 });
Object.defineProperty(argv, "1", {
  get: () => {
    if (Deno.mainModule?.startsWith("file:")) {
      return pathFromURL(new URL(Deno.mainModule));
    } else {
      return join(Deno.cwd(), "$deno$node.mjs");
    }
  },
});

internals.dispatchProcessBeforeExitEvent = dispatchProcessBeforeExitEvent;
internals.dispatchProcessExitEvent = dispatchProcessExitEvent;
// Should be called only once, in `runtime/js/99_main.js` when the runtime is
// bootstrapped.
internals.__bootstrapNodeProcess = function (
  argv0Val: string | undefined,
  args: string[],
  denoVersions: Record<string, string>,
  nodeDebug: string,
  warmup = false,
) {
  if (!warmup) {
    argv0 = argv0Val || "";
    // Manually concatenate these arrays to avoid triggering the getter
    for (let i = 0; i < args.length; i++) {
      argv[i + 2] = args[i];
    }

    for (const [key, value] of Object.entries(denoVersions)) {
      versions[key] = value;
    }

    core.setNextTickCallback(processTicksAndRejections);
    core.setMacrotaskCallback(runNextTicks);
    enableNextTick();

    // Replace stdin if it is not a terminal
    const newStdin = initStdin();
    if (newStdin) {
      stdin = process.stdin = newStdin;
    }

    // Replace stdout/stderr if they are not terminals
    if (!io.stdout.isTerminal()) {
      /** https://nodejs.org/api/process.html#process_process_stdout */
      stdout = process.stdout = createWritableStdioStream(
        io.stdout,
        "stdout",
      );
    }

    if (!io.stderr.isTerminal()) {
      /** https://nodejs.org/api/process.html#process_process_stderr */
      stderr = process.stderr = createWritableStdioStream(
        io.stderr,
        "stderr",
      );
    }

    arch = arch_();
    platform = isWindows ? "win32" : Deno.build.os;
    pid = Deno.pid;

    initializeDebugEnv(nodeDebug);

    delete internals.__bootstrapNodeProcess;
  } else {
    // Warmup, assuming stdin/stdout/stderr are all terminals
    stdin = process.stdin = initStdin(true);

    /** https://nodejs.org/api/process.html#process_process_stdout */
    stdout = process.stdout = createWritableStdioStream(
      io.stdout,
      "stdout",
      true,
    );

    /** https://nodejs.org/api/process.html#process_process_stderr */
    stderr = process.stderr = createWritableStdioStream(
      io.stderr,
      "stderr",
      true,
    );
  }
};

setProcess(process);

export default process;
