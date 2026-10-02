// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// This module implements 'child_process' module of Node.JS API.
// ref: https://nodejs.org/api/child_process.html

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { internals } from "ext:core/mod.js";
import {
  op_bootstrap_unstable_args,
  op_node_child_ipc_pipe,
} from "ext:core/ops";

import {
  ChildProcess,
  ChildProcessOptions,
  normalizeSpawnArguments,
  setupChannel,
  type SpawnOptions,
  spawnSync as _spawnSync,
  type SpawnSyncOptions,
  type SpawnSyncResult,
  stdioStringToArray,
} from "ext:deno_node/internal/child_process.ts";
import {
  validateAbortSignal,
  validateFunction,
  validateObject,
  validateString,
} from "ext:deno_node/internal/validators.mjs";
import {
  ERR_CHILD_PROCESS_IPC_REQUIRED,
  ERR_CHILD_PROCESS_STDIO_MAXBUFFER,
  ERR_INVALID_ARG_TYPE,
  ERR_INVALID_ARG_VALUE,
  ERR_OUT_OF_RANGE,
  genericNodeError,
} from "ext:deno_node/internal/errors.ts";
import {
  ArrayIsArray,
  ArrayPrototypeJoin,
  ArrayPrototypePush,
  ArrayPrototypeSlice,
  ObjectAssign,
  StringPrototypeSlice,
} from "ext:deno_node/internal/primordials.mjs";
import { getSystemErrorName, promisify } from "node:util";
import { createDeferredPromise } from "ext:deno_node/internal/util.mjs";
import process from "node:process";
import { Buffer } from "node:buffer";
import {
  convertToValidSignal,
  kEmptyObject,
} from "ext:deno_node/internal/util.mjs";

const MAX_BUFFER = 1024 * 1024;

type ForkOptions = ChildProcessOptions;

/**
 * Spawns a new Node.js process + fork.
 * @param modulePath
 * @param args
 * @param option
 * @returns
 */
export function fork(
  modulePath: string,
  _args?: string[],
  _options?: ForkOptions,
) {
  validateString(modulePath, "modulePath");

  // Get options and args arguments.
  let execArgv;
  let options: SpawnOptions & {
    execArgv?: string;
    execPath?: string;
    silent?: boolean;
  } = {};
  let args: string[] = [];
  let pos = 1;
  if (pos < arguments.length && Array.isArray(arguments[pos])) {
    args = arguments[pos++];
  }

  if (pos < arguments.length && arguments[pos] == null) {
    pos++;
  }

  if (pos < arguments.length && arguments[pos] != null) {
    if (typeof arguments[pos] !== "object") {
      throw new ERR_INVALID_ARG_VALUE(`arguments[${pos}]`, arguments[pos]);
    }

    options = { ...arguments[pos++] };
  }

  // Prepare arguments for fork:
  execArgv = options.execArgv || process.execArgv;

  if (execArgv === process.execArgv && process._eval != null) {
    const index = execArgv.lastIndexOf(process._eval);
    if (index > 0) {
      // Remove the -e switch to avoid fork bombing ourselves.
      execArgv = execArgv.slice(0);
      execArgv.splice(index - 1, 2);
    }
  }

  // TODO(bartlomieju): this is incomplete, currently only handling a single
  // V8 flag to get Prisma integration running, we should fill this out with
  // more
  const v8Flags: string[] = [];
  if (Array.isArray(execArgv)) {
    let index = 0;
    while (index < execArgv.length) {
      const flag = execArgv[index];
      if (flag.startsWith("--max-old-space-size")) {
        execArgv.splice(index, 1);
        v8Flags.push(flag);
      } else if (flag.startsWith("--enable-source-maps")) {
        // https://github.com/denoland/deno/issues/21750
        execArgv.splice(index, 1);
      } else if (flag.startsWith("-C") || flag.startsWith("--conditions")) {
        let rm = 1;
        if (flag.indexOf("=") === -1) {
          // --conditions foo
          // so remove the next argument as well.
          rm = 2;
        }
        execArgv.splice(index, rm);
      } else if (flag.startsWith("--no-warnings")) {
        execArgv[index] = "--quiet";
      } else {
        index++;
      }
    }
  }

  const stringifiedV8Flags: string[] = [];
  if (v8Flags.length > 0) {
    stringifiedV8Flags.push("--v8-flags=" + v8Flags.join(","));
  }
  args = [
    "run",
    ...op_bootstrap_unstable_args(),
    "-A",
    ...stringifiedV8Flags,
    ...execArgv,
    modulePath,
    ...args,
  ];

  if (typeof options.stdio === "string") {
    options.stdio = stdioStringToArray(options.stdio, "ipc");
  } else if (!Array.isArray(options.stdio)) {
    // Use a separate fd=3 for the IPC channel. Inherit stdin, stdout,
    // and stderr from the parent if silent isn't set.
    options.stdio = stdioStringToArray(
      options.silent ? "pipe" : "inherit",
      "ipc",
    );
  } else if (!options.stdio.includes("ipc")) {
    throw new ERR_CHILD_PROCESS_IPC_REQUIRED("options.stdio");
  }

  options.execPath = options.execPath || Deno.execPath();
  options.shell = false;

  // // deno-lint-ignore no-explicit-any
  // (options as any)[kNeedsNpmProcessState] = true;

  return spawn(options.execPath, args, options);
}

export function spawn(command: string): ChildProcess;
export function spawn(command: string, options: SpawnOptions): ChildProcess;
export function spawn(command: string, args: string[]): ChildProcess;
export function spawn(
  command: string,
  args: string[],
  options: SpawnOptions,
): ChildProcess;
/**
 * Spawns a child process using `command`.
 */
export function spawn(
  command: string,
  argsOrOptions?: string[] | SpawnOptions,
  maybeOptions?: SpawnOptions,
): ChildProcess {
  const args = Array.isArray(argsOrOptions) ? argsOrOptions : [];
  let options = !Array.isArray(argsOrOptions) && argsOrOptions != null
    ? argsOrOptions
    : maybeOptions as SpawnOptions;

  options = normalizeSpawnArguments(command, args, options);

  validateAbortSignal(options?.signal, "options.signal");
  return new ChildProcess(command, args, options);
}

function validateTimeout(timeout?: number) {
  if (timeout != null && !(Number.isInteger(timeout) && timeout >= 0)) {
    throw new ERR_OUT_OF_RANGE("timeout", "an unsigned integer", timeout);
  }
}

function validateMaxBuffer(maxBuffer?: number) {
  if (
    maxBuffer != null &&
    !(typeof maxBuffer === "number" && maxBuffer >= 0)
  ) {
    throw new ERR_OUT_OF_RANGE(
      "options.maxBuffer",
      "a positive number",
      maxBuffer,
    );
  }
}

function sanitizeKillSignal(killSignal?: string | number) {
  if (typeof killSignal === "string" || typeof killSignal === "number") {
    return convertToValidSignal(killSignal);
  } else if (killSignal != null) {
    throw new ERR_INVALID_ARG_TYPE(
      "options.killSignal",
      ["string", "number"],
      killSignal,
    );
  }
}

export function spawnSync(
  command: string,
  argsOrOptions?: string[] | SpawnSyncOptions,
  maybeOptions?: SpawnSyncOptions,
): SpawnSyncResult {
  const args = Array.isArray(argsOrOptions) ? argsOrOptions : [];
  let options = !Array.isArray(argsOrOptions) && argsOrOptions
    ? argsOrOptions
    : maybeOptions as SpawnSyncOptions;

  options = {
    maxBuffer: MAX_BUFFER,
    ...normalizeSpawnArguments(command, args, options),
  };

  // Validate the timeout, if present.
  validateTimeout(options.timeout);

  // Validate maxBuffer, if present.
  validateMaxBuffer(options.maxBuffer);

  // Validate and translate the kill signal, if present.
  sanitizeKillSignal(options.killSignal);

  return _spawnSync(command, args, options);
}

interface ExecOptions extends
  Pick<
    ChildProcessOptions,
    | "env"
    | "signal"
    | "uid"
    | "gid"
    | "windowsHide"
  > {
  cwd?: string | URL;
  encoding?: string;
  /**
   * Shell to execute the command with.
   */
  shell?: string;
  timeout?: number;
  /**
   * Largest amount of data in bytes allowed on stdout or stderr. If exceeded, the child process is terminated and any output is truncated.
   */
  maxBuffer?: number;
  killSignal?: string | number;
}
type ExecException = ChildProcessError;
type ExecCallback = (
  error: ExecException | null,
  stdout?: string | Buffer,
  stderr?: string | Buffer,
) => void;
type ExecSyncOptions = SpawnSyncOptions;
type ExecFileSyncOptions = SpawnSyncOptions;
function normalizeExecArgs(
  command: string,
  optionsOrCallback?: ExecOptions | ExecSyncOptions | ExecCallback,
  maybeCallback?: ExecCallback,
) {
  let callback: ExecFileCallback | undefined = maybeCallback;

  if (typeof optionsOrCallback === "function") {
    callback = optionsOrCallback;
    optionsOrCallback = undefined;
  }

  // Make a shallow copy so we don't clobber the user's options object.
  const options: ExecOptions | ExecSyncOptions = { ...optionsOrCallback };
  options.shell = typeof options.shell === "string" ? options.shell : true;

  return {
    file: command,
    options: options!,
    callback: callback!,
  };
}

/**
 * Spawns a shell executing the given command.
 */
export function exec(command: string): ChildProcess;
export function exec(command: string, options: ExecOptions): ChildProcess;
export function exec(command: string, callback: ExecCallback): ChildProcess;
export function exec(
  command: string,
  options: ExecOptions,
  callback: ExecCallback,
): ChildProcess;
export function exec(
  command: string,
  optionsOrCallback?: ExecOptions | ExecCallback,
  maybeCallback?: ExecCallback,
): ChildProcess {
  const opts = normalizeExecArgs(command, optionsOrCallback, maybeCallback);
  return execFile(opts.file, opts.options as ExecFileOptions, opts.callback);
}

interface PromiseWithChild<T> extends Promise<T> {
  child: ChildProcess;
}
type ExecOutputForPromisify = {
  stdout?: string | Buffer;
  stderr?: string | Buffer;
};
type ExecExceptionForPromisify = ExecException & ExecOutputForPromisify;

const customPromiseExecFunction = (orig: typeof exec) => {
  return (...args: [command: string, options: ExecOptions]) => {
    const { promise, resolve, reject } = createDeferredPromise() as unknown as {
      promise: PromiseWithChild<ExecOutputForPromisify>;
      resolve?: (value: ExecOutputForPromisify) => void;
      reject?: (reason?: ExecExceptionForPromisify) => void;
    };

    promise.child = orig(...args, (err, stdout, stderr) => {
      if (err !== null) {
        const _err: ExecExceptionForPromisify = err;
        _err.stdout = stdout;
        _err.stderr = stderr;
        reject && reject(_err);
      } else {
        resolve && resolve({ stdout, stderr });
      }
    });

    return promise;
  };
};

Object.defineProperty(exec, promisify.custom, {
  enumerable: false,
  value: customPromiseExecFunction(exec),
});

interface ExecFileOptions extends ChildProcessOptions {
  encoding?: string;
  timeout?: number;
  maxBuffer?: number;
  killSignal?: string | number;
}
interface ChildProcessError extends Error {
  code?: string | number;
  killed?: boolean;
  signal?: AbortSignal;
  cmd?: string;
}
class ExecFileError extends Error implements ChildProcessError {
  code?: string | number;

  constructor(message: string) {
    super(message);
    this.code = "UNKNOWN";
  }
}
type ExecFileCallback = (
  error: ChildProcessError | null,
  stdout?: string | Buffer,
  stderr?: string | Buffer,
) => void;
export function execFile(file: string): ChildProcess;
export function execFile(
  file: string,
  callback: ExecFileCallback,
): ChildProcess;
export function execFile(file: string, args: string[]): ChildProcess;
export function execFile(
  file: string,
  args: string[],
  callback: ExecFileCallback,
): ChildProcess;
export function execFile(file: string, options: ExecFileOptions): ChildProcess;
export function execFile(
  file: string,
  options: ExecFileOptions,
  callback: ExecFileCallback,
): ChildProcess;
export function execFile(
  file: string,
  args: string[],
  options: ExecFileOptions,
  callback: ExecFileCallback,
): ChildProcess;
export function execFile(
  file: string,
  argsOrOptionsOrCallback?: string[] | ExecFileOptions | ExecFileCallback,
  optionsOrCallback?: ExecFileOptions | ExecFileCallback,
  maybeCallback?: ExecFileCallback,
): ChildProcess {
  let args: string[] = [];
  let options: ExecFileOptions = {};
  let callback: ExecFileCallback | undefined;

  if (Array.isArray(argsOrOptionsOrCallback)) {
    args = argsOrOptionsOrCallback;
  } else if (argsOrOptionsOrCallback instanceof Function) {
    callback = argsOrOptionsOrCallback;
  } else if (argsOrOptionsOrCallback) {
    options = argsOrOptionsOrCallback;
  }
  if (optionsOrCallback instanceof Function) {
    callback = optionsOrCallback;
  } else if (optionsOrCallback) {
    options = optionsOrCallback;
    callback = maybeCallback;
  }

  const execOptions = {
    encoding: "utf8",
    timeout: 0,
    maxBuffer: MAX_BUFFER,
    killSignal: "SIGTERM",
    shell: false,
    ...options,
  };
  validateTimeout(execOptions.timeout);
  if (execOptions.maxBuffer < 0) {
    throw new ERR_OUT_OF_RANGE(
      "options.maxBuffer",
      "a positive number",
      execOptions.maxBuffer,
    );
  }
  const spawnOptions: SpawnOptions = {
    cwd: execOptions.cwd,
    env: execOptions.env,
    gid: execOptions.gid,
    shell: execOptions.shell,
    signal: execOptions.signal,
    uid: execOptions.uid,
    windowsHide: !!execOptions.windowsHide,
    windowsVerbatimArguments: !!execOptions.windowsVerbatimArguments,
  };

  const child = spawn(file, args, spawnOptions);

  let encoding: string | null;
  const _stdout: (string | Uint8Array)[] = [];
  const _stderr: (string | Uint8Array)[] = [];
  if (
    execOptions.encoding !== "buffer" && Buffer.isEncoding(execOptions.encoding)
  ) {
    encoding = execOptions.encoding;
  } else {
    encoding = null;
  }
  let stdoutLen = 0;
  let stderrLen = 0;
  let killed = false;
  let exited = false;
  let timeoutId: number | null;

  let ex: ChildProcessError | null = null;

  let cmd = file;

  function exithandler(code = 0, signal?: AbortSignal) {
    if (exited) return;
    exited = true;

    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    if (!callback) return;

    // merge chunks
    let stdout;
    let stderr;
    if (
      encoding ||
      (
        child.stdout &&
        child.stdout.readableEncoding
      )
    ) {
      stdout = _stdout.join("");
    } else {
      stdout = Buffer.concat(_stdout as Buffer[]);
    }
    if (
      encoding ||
      (
        child.stderr &&
        child.stderr.readableEncoding
      )
    ) {
      stderr = _stderr.join("");
    } else {
      stderr = Buffer.concat(_stderr as Buffer[]);
    }

    if (!ex && code === 0 && signal === null) {
      callback(null, stdout, stderr);
      return;
    }

    if (args?.length) {
      cmd += ` ${args.join(" ")}`;
    }

    if (!ex) {
      ex = new ExecFileError(
        "Command failed: " + cmd + "\n" + stderr,
      );
      ex.code = code < 0 ? getSystemErrorName(code) : code;
      ex.killed = child.killed || killed;
      ex.signal = signal;
    }

    ex.cmd = cmd;
    callback(ex, stdout, stderr);
  }

  function errorhandler(e: ExecFileError) {
    ex = e;

    if (child.stdout) {
      child.stdout.destroy();
    }

    if (child.stderr) {
      child.stderr.destroy();
    }

    exithandler();
  }

  function kill() {
    if (child.stdout) {
      child.stdout.destroy();
    }

    if (child.stderr) {
      child.stderr.destroy();
    }

    killed = true;
    try {
      child.kill(execOptions.killSignal);
    } catch (e) {
      if (e) {
        ex = e as ChildProcessError;
      }
      exithandler();
    }
  }

  if (execOptions.timeout > 0) {
    timeoutId = setTimeout(function delayedKill() {
      kill();
      timeoutId = null;
    }, execOptions.timeout);
  }

  if (child.stdout) {
    if (encoding) {
      child.stdout.setEncoding(encoding);
    }

    child.stdout.on("data", function onChildStdout(chunk: string | Buffer) {
      // Do not need to count the length
      if (execOptions.maxBuffer === Infinity) {
        ArrayPrototypePush(_stdout, chunk);
        return;
      }

      const encoding = child.stdout?.readableEncoding;
      const length = encoding
        ? Buffer.byteLength(chunk, encoding)
        : chunk.length;
      const slice = encoding
        ? StringPrototypeSlice
        : (buf: string | Buffer, ...args: number[]) => buf.slice(...args);
      stdoutLen += length;

      if (stdoutLen > execOptions.maxBuffer) {
        const truncatedLen = execOptions.maxBuffer - (stdoutLen - length);
        ArrayPrototypePush(_stdout, slice(chunk, 0, truncatedLen));

        ex = new ERR_CHILD_PROCESS_STDIO_MAXBUFFER("stdout");
        kill();
      } else {
        ArrayPrototypePush(_stdout, chunk);
      }
    });
  }

  if (child.stderr) {
    if (encoding) {
      child.stderr.setEncoding(encoding);
    }

    child.stderr.on("data", function onChildStderr(chunk: string | Buffer) {
      // Do not need to count the length
      if (execOptions.maxBuffer === Infinity) {
        ArrayPrototypePush(_stderr, chunk);
        return;
      }

      const encoding = child.stderr?.readableEncoding;
      const length = encoding
        ? Buffer.byteLength(chunk, encoding)
        : chunk.length;
      const slice = encoding
        ? StringPrototypeSlice
        : (buf: string | Buffer, ...args: number[]) => buf.slice(...args);
      stderrLen += length;

      if (stderrLen > execOptions.maxBuffer) {
        const truncatedLen = execOptions.maxBuffer - (stderrLen - length);
        ArrayPrototypePush(_stderr, slice(chunk, 0, truncatedLen));

        ex = new ERR_CHILD_PROCESS_STDIO_MAXBUFFER("stderr");
        kill();
      } else {
        ArrayPrototypePush(_stderr, chunk);
      }
    });
  }

  child.addListener("close", exithandler);
  child.addListener("error", errorhandler);

  return child;
}

type ExecFileExceptionForPromisify = ExecFileError & ExecOutputForPromisify;

const customPromiseExecFileFunction = (
  orig: (
    file: string,
    argsOrOptionsOrCallback?: string[] | ExecFileOptions | ExecFileCallback,
    optionsOrCallback?: ExecFileOptions | ExecFileCallback,
    maybeCallback?: ExecFileCallback,
  ) => ChildProcess,
) => {
  return (
    ...args: [
      file: string,
      argsOrOptions?: string[] | ExecFileOptions,
      options?: ExecFileOptions,
    ]
  ) => {
    const { promise, resolve, reject } = createDeferredPromise() as unknown as {
      promise: PromiseWithChild<ExecOutputForPromisify>;
      resolve?: (value: ExecOutputForPromisify) => void;
      reject?: (reason?: ExecFileExceptionForPromisify) => void;
    };

    promise.child = orig(...args, (err, stdout, stderr) => {
      if (err !== null) {
        const _err: ExecFileExceptionForPromisify = err;
        _err.stdout = stdout;
        _err.stderr = stderr;
        reject && reject(_err);
      } else {
        resolve && resolve({ stdout, stderr });
      }
    });

    return promise;
  };
};

Object.defineProperty(execFile, promisify.custom, {
  enumerable: false,
  value: customPromiseExecFileFunction(execFile),
});

function checkExecSyncError(
  ret: SpawnSyncResult,
  args: string[],
  cmd?: string,
) {
  let err;
  if (ret.error) {
    err = ret.error;
    ObjectAssign(err, ret);
  } else if (ret.status !== 0) {
    let msg = "Command failed: ";
    msg += cmd || ArrayPrototypeJoin(args, " ");
    if (ret.stderr && ret.stderr.length > 0) {
      msg += `\n${ret.stderr.toString()}`;
    }
    err = genericNodeError(msg, ret);
  }
  return err;
}

export function execSync(command: string, options: ExecSyncOptions) {
  const opts = normalizeExecArgs(command, options);
  const inheritStderr = !(opts.options as ExecSyncOptions).stdio;

  const ret = spawnSync(opts.file, opts.options as SpawnSyncOptions);

  if (inheritStderr && ret.stderr) {
    process.stderr.write(ret.stderr);
  }

  const err = checkExecSyncError(ret, [], command);

  if (err) {
    throw err;
  }

  return ret.stdout;
}

function normalizeExecFileArgs(
  file: string,
  args?: string[] | null | ExecFileSyncOptions | ExecFileCallback,
  options?: ExecFileSyncOptions | null | ExecFileCallback,
  callback?: ExecFileCallback,
): {
  file: string;
  args: string[];
  options: ExecFileSyncOptions;
  callback?: ExecFileCallback;
} {
  if (ArrayIsArray(args)) {
    args = ArrayPrototypeSlice(args);
  } else if (args != null && typeof args === "object") {
    callback = options as ExecFileCallback;
    options = args as ExecFileSyncOptions;
    args = null;
  } else if (typeof args === "function") {
    callback = args;
    options = null;
    args = null;
  }

  if (args == null) {
    args = [];
  }

  if (typeof options === "function") {
    callback = options as ExecFileCallback;
  } else if (options != null) {
    validateObject(options, "options");
  }

  if (options == null) {
    options = kEmptyObject;
  }

  args = args as string[];
  options = options as ExecFileSyncOptions;

  if (callback != null) {
    validateFunction(callback, "callback");
  }

  // Validate argv0, if present.
  if (options.argv0 != null) {
    validateString(options.argv0, "options.argv0");
  }

  return { file, args, options, callback };
}

export function execFileSync(file: string): string | Buffer;
export function execFileSync(file: string, args: string[]): string | Buffer;
export function execFileSync(
  file: string,
  options: ExecFileSyncOptions,
): string | Buffer;
export function execFileSync(
  file: string,
  args: string[],
  options: ExecFileSyncOptions,
): string | Buffer;
export function execFileSync(
  file: string,
  args?: string[] | ExecFileSyncOptions,
  options?: ExecFileSyncOptions,
): string | Buffer {
  ({ file, args, options } = normalizeExecFileArgs(file, args, options));

  const inheritStderr = !options.stdio;
  const ret = spawnSync(file, args, options);

  if (inheritStderr && ret.stderr) {
    process.stderr.write(ret.stderr);
  }

  const errArgs: string[] = [options.argv0 || file, ...(args as string[])];
  const err = checkExecSyncError(ret, errArgs);

  if (err) {
    throw err;
  }

  return ret.stdout as string | Buffer;
}

function setupChildProcessIpcChannel() {
  const fd = op_node_child_ipc_pipe();
  if (typeof fd != "number" || fd < 0) return;
  const control = setupChannel(process, fd);
  process.on("newListener", (name: string) => {
    if (name === "message" || name === "disconnect") {
      control.refCounted();
    }
  });
  process.on("removeListener", (name: string) => {
    if (name === "message" || name === "disconnect") {
      control.unrefCounted();
    }
  });
}

internals.__setupChildProcessIpcChannel = setupChildProcessIpcChannel;

export default {
  fork,
  spawn,
  exec,
  execFile,
  execFileSync,
  execSync,
  ChildProcess,
  spawnSync,
};
export { ChildProcess };
