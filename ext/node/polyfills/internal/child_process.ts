// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// This module implements 'child_process' module of Node.JS API.
// ref: https://nodejs.org/api/child_process.html

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { core, internals } from "ext:core/mod.js";
import {
  op_node_ipc_read,
  op_node_ipc_ref,
  op_node_ipc_unref,
  op_node_ipc_write,
} from "ext:core/ops";
import {
  ArrayIsArray,
  ArrayPrototypeFilter,
  ArrayPrototypeJoin,
  ArrayPrototypePush,
  ArrayPrototypeSlice,
  ArrayPrototypeSort,
  ArrayPrototypeUnshift,
  ObjectHasOwn,
  StringPrototypeStartsWith,
  StringPrototypeToUpperCase,
} from "ext:deno_node/internal/primordials.mjs";
import { assert } from "ext:deno_node/_util/asserts.ts";
import { EventEmitter } from "node:events";
import { os } from "ext:deno_node/internal_binding/constants.ts";
import { notImplemented } from "ext:deno_node/_utils.ts";
import { Readable, Stream, Writable } from "node:stream";
import { isWindows } from "ext:deno_node/_util/os.ts";
import { nextTick } from "ext:deno_node/_next_tick.ts";
import {
  AbortError,
  ERR_INVALID_ARG_TYPE,
  ERR_INVALID_ARG_VALUE,
  ERR_IPC_CHANNEL_CLOSED,
  ERR_UNKNOWN_SIGNAL,
} from "ext:deno_node/internal/errors.ts";
import { Buffer } from "node:buffer";
import { errnoException } from "ext:deno_node/internal/errors.ts";
import { ErrnoException } from "ext:deno_node/_global.d.ts";
import { codeMap } from "ext:deno_node/internal_binding/uv.ts";
import {
  isInt32,
  validateBoolean,
  validateObject,
  validateString,
} from "ext:deno_node/internal/validators.mjs";
import { kEmptyObject } from "ext:deno_node/internal/util.mjs";
import { getValidatedPath } from "ext:deno_node/internal/fs/utils.mjs";
import process from "node:process";
import { StringPrototypeSlice } from "ext:deno_node/internal/primordials.mjs";
import { StreamBase } from "ext:deno_node/internal_binding/stream_wrap.ts";
import { Pipe, socketType } from "ext:deno_node/internal_binding/pipe_wrap.ts";
import { Socket } from "node:net";
import {
  kDetached,
  kExtraStdio,
  kIpc,
  kNeedsNpmProcessState,
} from "ext:runtime/40_process.js";

export function mapValues<T, O>(
  record: Readonly<Record<string, T>>,
  transformer: (value: T) => O,
): Record<string, O> {
  const ret: Record<string, O> = {};
  const entries = Object.entries(record);

  for (const [key, value] of entries) {
    if (typeof value === "undefined") {
      continue;
    }
    if (value === null) {
      continue;
    }

    const mappedValue = transformer(value);

    ret[key] = mappedValue;
  }

  return ret;
}

type NodeStdio = "pipe" | "overlapped" | "ignore" | "inherit" | "ipc";
type DenoStdio = "inherit" | "piped" | "null";

export function stdioStringToArray(
  stdio: NodeStdio,
  channel: NodeStdio | number,
) {
  const options: (NodeStdio | number)[] = [];

  switch (stdio) {
    case "ignore":
    case "overlapped":
    case "pipe":
      options.push(stdio, stdio, stdio);
      break;
    case "inherit":
      options.push(stdio, stdio, stdio);
      break;
    default:
      throw new ERR_INVALID_ARG_VALUE("stdio", stdio);
  }

  if (channel) options.push(channel);

  return options;
}

const kClosesNeeded = Symbol("_closesNeeded");
const kClosesReceived = Symbol("_closesReceived");
const kCanDisconnect = Symbol("_canDisconnect");

// We only want to emit a close event for the child process when all of
// the writable streams have closed. The value of `child[kClosesNeeded]` should be 1 +
// the number of opened writable streams (note this excludes `stdin`).
function maybeClose(child: ChildProcess) {
  child[kClosesReceived]++;
  if (child[kClosesNeeded] === child[kClosesReceived]) {
    child.emit("close", child.exitCode, child.signalCode);
  }
}

function flushStdio(subprocess: ChildProcess) {
  const stdio = subprocess.stdio;

  if (stdio == null) return;

  for (let i = 0; i < stdio.length; i++) {
    const stream = stdio[i];
    if (!stream || !stream.readable) {
      continue;
    }
    stream.resume();
  }
}

// Wraps a resource in a class that implements
// StreamBase, so it can be used with node streams
class StreamResource implements StreamBase {
  #rid: number;
  constructor(rid: number) {
    this.#rid = rid;
  }
  close(): void {
    core.close(this.#rid);
  }
  async read(p: Uint8Array): Promise<number | null> {
    const readPromise = core.read(this.#rid, p);
    core.unrefOpPromise(readPromise);
    const nread = await readPromise;
    return nread > 0 ? nread : null;
  }
  ref(): void {
    return;
  }
  unref(): void {
    return;
  }
  write(p: Uint8Array): Promise<number> {
    return core.write(this.#rid, p);
  }
}

export class ChildProcess extends EventEmitter {
  /**
   * The exit code of the child process. This property will be `null` until the child process exits.
   */
  exitCode: number | null = null;

  /**
   * This property is set to `true` after `kill()` is called.
   */
  killed = false;

  /**
   * The PID of this child process.
   */
  pid!: number;

  /**
   * The signal received by this child process.
   */
  signalCode: string | null = null;

  /**
   * Command line arguments given to this child process.
   */
  spawnargs: string[];

  /**
   * The executable file name of this child process.
   */
  spawnfile: string;

  /**
   * This property represents the child process's stdin.
   */
  stdin: Writable | null = null;

  /**
   * This property represents the child process's stdout.
   */
  stdout: Readable | null = null;

  /**
   * This property represents the child process's stderr.
   */
  stderr: Readable | null = null;

  /**
   * Pipes to this child process.
   */
  stdio: [Writable | null, Readable | null, Readable | null] = [
    null,
    null,
    null,
  ];

  disconnect?: () => void;

  #process!: Deno.ChildProcess;
  #spawned = Promise.withResolvers<void>();
  [kClosesNeeded] = 1;
  [kClosesReceived] = 0;
  [kCanDisconnect] = false;

  constructor(
    command: string,
    args?: string[],
    options?: ChildProcessOptions,
  ) {
    super();

    const {
      env = {},
      stdio = ["pipe", "pipe", "pipe"],
      cwd,
      shell = false,
      signal,
      windowsVerbatimArguments = false,
      detached,
    } = options || {};
    const normalizedStdio = normalizeStdioOption(stdio);
    const [
      stdin = "pipe",
      stdout = "pipe",
      stderr = "pipe",
      ...extraStdio
    ] = normalizedStdio;
    const [cmd, cmdArgs] = buildCommand(
      command,
      args || [],
      shell,
    );
    this.spawnfile = cmd;
    this.spawnargs = [cmd, ...cmdArgs];

    const ipc = normalizedStdio.indexOf("ipc");

    const extraStdioOffset = 3; // stdin, stdout, stderr

    const extraStdioNormalized: DenoStdio[] = [];
    for (let i = 0; i < extraStdio.length; i++) {
      const fd = i + extraStdioOffset;
      if (fd === ipc) extraStdioNormalized.push("null");
      extraStdioNormalized.push(toDenoStdio(extraStdio[i]));
    }

    const stringEnv = mapValues(env, (value) => value.toString());
    try {
      this.#process = new Deno.Command(cmd, {
        args: cmdArgs,
        cwd,
        env: stringEnv,
        stdin: toDenoStdio(stdin),
        stdout: toDenoStdio(stdout),
        stderr: toDenoStdio(stderr),
        windowsRawArguments: windowsVerbatimArguments,
        [kIpc]: ipc, // internal
        [kExtraStdio]: extraStdioNormalized,
        [kDetached]: detached,
        // deno-lint-ignore no-explicit-any
        [kNeedsNpmProcessState]: (options ?? {} as any)[kNeedsNpmProcessState],
      }).spawn();
      this.pid = this.#process.pid;

      if (stdin === "pipe") {
        assert(this.#process.stdin);
        this.stdin = Writable.fromWeb(this.#process.stdin);
      }

      if (stdin instanceof Stream) {
        this.stdin = stdin;
      }
      if (stdout instanceof Stream) {
        this.stdout = stdout;
      }
      if (stderr instanceof Stream) {
        this.stderr = stderr;
      }

      if (stdout === "pipe") {
        assert(this.#process.stdout);
        this[kClosesNeeded]++;
        this.stdout = Readable.fromWeb(this.#process.stdout);
        this.stdout.on("close", () => {
          maybeClose(this);
        });
      }

      if (stderr === "pipe") {
        assert(this.#process.stderr);
        this[kClosesNeeded]++;
        this.stderr = Readable.fromWeb(this.#process.stderr);
        this.stderr.on("close", () => {
          maybeClose(this);
        });
      }

      this.stdio[0] = this.stdin;
      this.stdio[1] = this.stdout;
      this.stdio[2] = this.stderr;

      if (ipc >= 0) {
        this.stdio[ipc] = null;
      }

      const pipeRids = internals.getExtraPipeRids(this.#process);
      for (let i = 0; i < pipeRids.length; i++) {
        const rid: number | null = pipeRids[i];
        const fd = i + extraStdioOffset;
        if (rid) {
          this[kClosesNeeded]++;
          this.stdio[fd] = new Socket(
            {
              handle: new Pipe(
                socketType.IPC,
                new StreamResource(rid),
              ),
              // deno-lint-ignore no-explicit-any
            } as any,
          );
          this.stdio[fd]?.on("close", () => {
            maybeClose(this);
          });
        }
      }

      nextTick(() => {
        this.emit("spawn");
        this.#spawned.resolve();
      });

      if (signal) {
        const onAbortListener = () => {
          try {
            if (this.kill("SIGKILL")) {
              this.emit("error", new AbortError());
            }
          } catch (err) {
            this.emit("error", err);
          }
        };
        if (signal.aborted) {
          nextTick(onAbortListener);
        } else {
          signal.addEventListener("abort", onAbortListener, { once: true });
          this.addListener(
            "exit",
            () => signal.removeEventListener("abort", onAbortListener),
          );
        }
      }

      const pipeRid = internals.getIpcPipeRid(this.#process);
      if (typeof pipeRid == "number") {
        setupChannel(this, pipeRid);
        this[kClosesNeeded]++;
        this.on("disconnect", () => {
          maybeClose(this);
        });
      }

      (async () => {
        const status = await this.#process.status;
        this.exitCode = status.code;
        this.#spawned.promise.then(async () => {
          const exitCode = this.signalCode == null ? this.exitCode : null;
          const signalCode = this.signalCode == null ? null : this.signalCode;
          // The 'exit' and 'close' events must be emitted after the 'spawn' event.
          this.emit("exit", exitCode, signalCode);
          await this.#_waitForChildStreamsToClose();
          this.#closePipes();
          maybeClose(this);
          nextTick(flushStdio, this);
        });
      })();
    } catch (err) {
      let e = err;
      if (e instanceof Deno.errors.NotFound) {
        e = _createSpawnSyncError("ENOENT", command, args);
      }
      this.#_handleError(e);
    }
  }

  /**
   * @param signal NOTE: this parameter is not yet implemented.
   */
  kill(signal?: number | string): boolean {
    if (this.killed) {
      return this.killed;
    }

    const denoSignal = signal == null ? "SIGTERM" : toDenoSignal(signal);
    this.#closePipes();
    try {
      this.#process.kill(denoSignal);
    } catch (err) {
      const alreadyClosed = err instanceof TypeError ||
        err instanceof Deno.errors.PermissionDenied;
      if (!alreadyClosed) {
        throw err;
      }
    }

    /* Cancel any pending IPC I/O */
    if (this[kCanDisconnect]) {
      this.disconnect?.();
    }

    this.killed = true;
    this.signalCode = denoSignal;
    return this.killed;
  }

  ref() {
    this.#process.ref();
  }

  unref() {
    this.#process.unref();
  }

  async #_waitForChildStreamsToClose() {
    const promises = [] as Array<Promise<void>>;
    // Don't close parent process stdin if that's passed through
    if (this.stdin && !this.stdin.destroyed && this.stdin !== process.stdin) {
      assert(this.stdin);
      this.stdin.destroy();
      promises.push(waitForStreamToClose(this.stdin));
    }
    // Only readable streams need to be closed
    if (
      this.stdout && !this.stdout.destroyed && this.stdout instanceof Readable
    ) {
      promises.push(waitForReadableToClose(this.stdout));
    }
    // Only readable streams need to be closed
    if (
      this.stderr && !this.stderr.destroyed && this.stderr instanceof Readable
    ) {
      promises.push(waitForReadableToClose(this.stderr));
    }
    await Promise.all(promises);
  }

  #_handleError(err: unknown) {
    nextTick(() => {
      this.emit("error", err); // TODO(uki00a) Convert `err` into nodejs's `SystemError` class.
    });
  }

  #closePipes() {
    if (this.stdin) {
      assert(this.stdin);
      this.stdin.destroy();
    }
  }
}

const supportedNodeStdioTypes: NodeStdio[] = [
  "pipe",
  "ignore",
  "inherit",
  "ipc",
];
function toDenoStdio(
  pipe: NodeStdio | number | Stream | null | undefined,
): DenoStdio {
  if (pipe instanceof Stream) {
    return "inherit";
  }
  if (typeof pipe === "number") {
    /* Assume it's a rid returned by fs APIs */
    return pipe;
  }

  if (
    !supportedNodeStdioTypes.includes(pipe as NodeStdio)
  ) {
    notImplemented(`toDenoStdio pipe=${typeof pipe} (${pipe})`);
  }
  switch (pipe) {
    case "pipe":
    case undefined:
    case null:
      return "piped";
    case "ignore":
      return "null";
    case "inherit":
      return "inherit";
    case "ipc":
      return "ipc_for_internal_use";
    default:
      notImplemented(`toDenoStdio pipe=${typeof pipe} (${pipe})`);
  }
}

function toDenoSignal(signal: number | string): Deno.Signal {
  if (typeof signal === "number") {
    for (const name of keys(os.signals)) {
      if (os.signals[name] === signal) {
        return name as Deno.Signal;
      }
    }
    throw new ERR_UNKNOWN_SIGNAL(String(signal));
  }

  const denoSignal = signal as Deno.Signal;
  if (denoSignal in os.signals) {
    return denoSignal;
  }
  throw new ERR_UNKNOWN_SIGNAL(signal);
}

function keys<T extends Record<string, unknown>>(object: T): Array<keyof T> {
  return Object.keys(object);
}

export interface ChildProcessOptions {
  /**
   * Current working directory of the child process.
   */
  cwd?: string | URL;

  /**
   * Environment variables passed to the child process.
   */
  env?: Record<string, string | number | boolean>;

  /**
   * This option defines child process's stdio configuration.
   * @see https://nodejs.org/api/child_process.html#child_process_options_stdio
   */
  stdio?: Array<NodeStdio | number | Stream | null | undefined> | NodeStdio;

  /**
   * Whether to spawn the process in a detached state.
   */
  detached?: boolean;

  /**
   * NOTE: This option is not yet implemented.
   */
  uid?: number;

  /**
   * NOTE: This option is not yet implemented.
   */
  gid?: number;

  /**
   * NOTE: This option is not yet implemented.
   */
  argv0?: string;

  /**
   * * If this option is `true`, run the command in the shell.
   * * If this option is a string, run the command in the specified shell.
   */
  shell?: string | boolean;

  /**
   * Allows aborting the child process using an AbortSignal.
   */
  signal?: AbortSignal;

  /**
   * NOTE: This option is not yet implemented.
   */
  serialization?: "json" | "advanced";

  /** No quoting or escaping of arguments is done on Windows. Ignored on Unix.
   * Default: false. */
  windowsVerbatimArguments?: boolean;

  /**
   * NOTE: This option is not yet implemented.
   */
  windowsHide?: boolean;
}

function copyProcessEnvToEnv(
  env: Record<string, string | number | boolean | undefined>,
  name: string,
  optionEnv?: Record<string, string | number | boolean>,
) {
  if (
    Deno.env.get(name) &&
    (!optionEnv ||
      !ObjectHasOwn(optionEnv, name))
  ) {
    env[name] = Deno.env.get(name);
  }
}

function normalizeStdioOption(
  stdio: Array<NodeStdio | number | null | undefined | Stream> | NodeStdio = [
    "pipe",
    "pipe",
    "pipe",
  ],
): [
  Stream | NodeStdio | number,
  Stream | NodeStdio | number,
  Stream | NodeStdio | number,
  ...Array<Stream | NodeStdio | number>,
] {
  if (Array.isArray(stdio)) {
    // `[0, 1, 2]` is equivalent to `"inherit"`
    if (
      stdio.length === 3 &&
      (stdio[0] === 0 && stdio[1] === 1 && stdio[2] === 2)
    ) {
      return ["inherit", "inherit", "inherit"];
    }

    // `[null, null, null]` is equivalent to `"pipe"
    if (
      stdio.length === 3 &&
        stdio[0] === null || stdio[1] === null || stdio[2] === null
    ) {
      return ["pipe", "pipe", "pipe"];
    }

    // At least 3 stdio must be created to match node
    while (stdio.length < 3) {
      ArrayPrototypePush(stdio, undefined);
    }
    return stdio;
  } else {
    switch (stdio) {
      case "overlapped":
        if (isWindows) {
          notImplemented("normalizeStdioOption overlapped (on windows)");
        }
        // 'overlapped' is same as 'piped' on non Windows system.
        return ["pipe", "pipe", "pipe"];
      case "pipe":
        return ["pipe", "pipe", "pipe"];
      case "inherit":
        return ["inherit", "inherit", "inherit"];
      case "ignore":
        return ["ignore", "ignore", "ignore"];
      default:
        notImplemented(`normalizeStdioOption stdio=${typeof stdio} (${stdio})`);
    }
  }
}

export function normalizeSpawnArguments(
  file: string,
  args: string[],
  options: SpawnOptions & SpawnSyncOptions,
) {
  validateString(file, "file");

  if (file.length === 0) {
    throw new ERR_INVALID_ARG_VALUE("file", file, "cannot be empty");
  }

  if (ArrayIsArray(args)) {
    args = ArrayPrototypeSlice(args);
  } else if (args == null) {
    args = [];
  } else if (typeof args !== "object") {
    throw new ERR_INVALID_ARG_TYPE("args", "object", args);
  } else {
    options = args;
    args = [];
  }

  if (options === undefined) {
    options = kEmptyObject;
  } else {
    validateObject(options, "options");
  }

  let cwd = options.cwd;

  // Validate the cwd, if present.
  if (cwd != null) {
    cwd = getValidatedPath(cwd, "options.cwd") as string;
  }

  // Validate detached, if present.
  if (options.detached != null) {
    validateBoolean(options.detached, "options.detached");
  }

  // Validate the uid, if present.
  if (options.uid != null && !isInt32(options.uid)) {
    throw new ERR_INVALID_ARG_TYPE("options.uid", "int32", options.uid);
  }

  // Validate the gid, if present.
  if (options.gid != null && !isInt32(options.gid)) {
    throw new ERR_INVALID_ARG_TYPE("options.gid", "int32", options.gid);
  }

  // Validate the shell, if present.
  if (
    options.shell != null &&
    typeof options.shell !== "boolean" &&
    typeof options.shell !== "string"
  ) {
    throw new ERR_INVALID_ARG_TYPE(
      "options.shell",
      ["boolean", "string"],
      options.shell,
    );
  }

  // Validate argv0, if present.
  if (options.argv0 != null) {
    validateString(options.argv0, "options.argv0");
  }

  // Validate windowsHide, if present.
  if (options.windowsHide != null) {
    validateBoolean(options.windowsHide, "options.windowsHide");
  }

  // Validate windowsVerbatimArguments, if present.
  let { windowsVerbatimArguments } = options;
  if (windowsVerbatimArguments != null) {
    validateBoolean(
      windowsVerbatimArguments,
      "options.windowsVerbatimArguments",
    );
  }

  if (options.shell) {
    const command = ArrayPrototypeJoin([file, ...args], " ");
    // Set the shell, switches, and commands.
    if (process.platform === "win32") {
      if (typeof options.shell === "string") {
        file = options.shell;
      } else {
        file = Deno.env.get("comspec") || "cmd.exe";
      }
      // '/d /s /c' is used only for cmd.exe.
      if (/^(?:.*\\)?cmd(?:\.exe)?$/i.exec(file) !== null) {
        args = ["/d", "/s", "/c", `"${command}"`];
        windowsVerbatimArguments = true;
      } else {
        args = ["-c", command];
      }
    } else {
      /** TODO: add Android condition */
      if (typeof options.shell === "string") {
        file = options.shell;
      } else {
        file = "/bin/sh";
      }
      args = ["-c", command];
    }
  }

  if (typeof options.argv0 === "string") {
    ArrayPrototypeUnshift(args, options.argv0);
  } else {
    ArrayPrototypeUnshift(args, file);
  }

  const env = options.env || Deno.env.toObject();
  const envPairs: string[][] = [];

  // process.env.NODE_V8_COVERAGE always propagates, making it possible to
  // collect coverage for programs that spawn with white-listed environment.
  copyProcessEnvToEnv(env, "NODE_V8_COVERAGE", options.env);

  /** TODO: add `isZOS` condition */

  let envKeys: string[] = [];
  // Prototype values are intentionally included.
  for (const key in env) {
    if (Object.hasOwn(env, key)) {
      ArrayPrototypePush(envKeys, key);
    }
  }

  if (process.platform === "win32") {
    // On Windows env keys are case insensitive. Filter out duplicates,
    // keeping only the first one (in lexicographic order)
    /** TODO: implement SafeSet and makeSafe */
    const sawKey = new Set();
    envKeys = ArrayPrototypeFilter(
      ArrayPrototypeSort(envKeys),
      (key: string) => {
        const uppercaseKey = StringPrototypeToUpperCase(key);
        if (sawKey.has(uppercaseKey)) {
          return false;
        }
        sawKey.add(uppercaseKey);
        return true;
      },
    );
  }

  for (const key of envKeys) {
    const value = env[key];
    if (value !== undefined) {
      ArrayPrototypePush(envPairs, `${key}=${value}`);
    }
  }

  return {
    // Make a shallow copy so we don't clobber the user's options object.
    ...options,
    args,
    cwd,
    detached: !!options.detached,
    envPairs,
    file,
    windowsHide: !!options.windowsHide,
    windowsVerbatimArguments: !!windowsVerbatimArguments,
  };
}

function waitForReadableToClose(readable: Readable) {
  readable.resume(); // Ensure buffered data will be consumed.
  return waitForStreamToClose(readable as unknown as Stream);
}

function waitForStreamToClose(stream: Stream) {
  const deferred = Promise.withResolvers<void>();
  const cleanup = () => {
    stream.removeListener("close", onClose);
    stream.removeListener("error", onError);
  };
  const onClose = () => {
    cleanup();
    deferred.resolve();
  };
  const onError = (err: Error) => {
    cleanup();
    deferred.reject(err);
  };
  stream.once("close", onClose);
  stream.once("error", onError);
  return deferred.promise;
}

/**
 * This function is based on https://github.com/nodejs/node/blob/fc6426ccc4b4cb73076356fb6dbf46a28953af01/lib/child_process.js#L504-L528.
 * Copyright Joyent, Inc. and other Node contributors. All rights reserved. MIT license.
 */
function buildCommand(
  file: string,
  args: string[],
  shell: string | boolean,
): [string, string[]] {
  if (file === Deno.execPath()) {
    // The user is trying to spawn another Deno process as Node.js.
    args = toDenoArgs(args);
  }

  if (shell) {
    const command = [file, ...args].join(" ");

    // Set the shell, switches, and commands.
    if (isWindows) {
      if (typeof shell === "string") {
        file = shell;
      } else {
        file = Deno.env.get("comspec") || "cmd.exe";
      }
      // '/d /s /c' is used only for cmd.exe.
      if (/^(?:.*\\)?cmd(?:\.exe)?$/i.test(file)) {
        args = ["/d", "/s", "/c", `"${command}"`];
      } else {
        args = ["-c", command];
      }
    } else {
      if (typeof shell === "string") {
        file = shell;
      } else {
        file = "/bin/sh";
      }
      args = ["-c", command];
    }
  }
  return [file, args];
}

function _createSpawnSyncError(
  status: string,
  command: string,
  args: string[] = [],
): ErrnoException {
  const error = errnoException(
    codeMap.get(status),
    "spawnSync " + command,
  );
  error.path = command;
  error.spawnargs = args;
  return error;
}

export interface SpawnOptions extends ChildProcessOptions {
  /**
   * NOTE: This option is not yet implemented.
   */
  timeout?: number;
  /**
   * NOTE: This option is not yet implemented.
   */
  killSignal?: string;
}

export interface SpawnSyncOptions extends
  Pick<
    ChildProcessOptions,
    | "cwd"
    | "env"
    | "argv0"
    | "stdio"
    | "uid"
    | "gid"
    | "shell"
    | "windowsVerbatimArguments"
    | "windowsHide"
  > {
  input?: string | Buffer | DataView;
  timeout?: number;
  maxBuffer?: number;
  encoding?: string;
  /**
   * NOTE: This option is not yet implemented.
   */
  killSignal?: string;
}

export interface SpawnSyncResult {
  pid?: number;
  output?: [string | null, string | Buffer | null, string | Buffer | null];
  stdout?: Buffer | string | null;
  stderr?: Buffer | string | null;
  status?: number | null;
  signal?: string | null;
  error?: Error;
}

function parseSpawnSyncOutputStreams(
  output: Deno.CommandOutput,
  name: "stdout" | "stderr",
): string | Buffer | null {
  // new Deno.Command().outputSync() returns getters for stdout and stderr that throw when set
  // to 'inherit'.
  try {
    return Buffer.from(output[name]) as string | Buffer;
  } catch {
    return null;
  }
}

export function spawnSync(
  command: string,
  args: string[],
  options: SpawnSyncOptions,
): SpawnSyncResult {
  const {
    env = Deno.env.toObject(),
    stdio = ["pipe", "pipe", "pipe"],
    shell = false,
    cwd,
    encoding,
    uid,
    gid,
    maxBuffer,
    windowsVerbatimArguments = false,
  } = options;
  const [
    stdin_ = "pipe",
    stdout_ = "pipe",
    stderr_ = "pipe",
    _channel, // TODO(kt3k): handle this correctly
  ] = normalizeStdioOption(stdio);
  [command, args] = buildCommand(command, args ?? [], shell);

  const result: SpawnSyncResult = {};
  try {
    const output = new Deno.Command(command, {
      args,
      cwd,
      env: mapValues(env, (value) => value.toString()),
      stdout: toDenoStdio(stdout_),
      stderr: toDenoStdio(stderr_),
      stdin: stdin_ == "inherit" ? "inherit" : "null",
      uid,
      gid,
      windowsRawArguments: windowsVerbatimArguments,
    }).outputSync();

    const status = output.signal ? null : output.code;
    let stdout = parseSpawnSyncOutputStreams(output, "stdout");
    let stderr = parseSpawnSyncOutputStreams(output, "stderr");

    if (
      (stdout && stdout.length > maxBuffer!) ||
      (stderr && stderr.length > maxBuffer!)
    ) {
      result.error = _createSpawnSyncError("ENOBUFS", command, args);
    }

    if (encoding && encoding !== "buffer") {
      stdout = stdout && stdout.toString(encoding);
      stderr = stderr && stderr.toString(encoding);
    }

    result.status = status;
    result.signal = output.signal;
    result.stdout = stdout;
    result.stderr = stderr;
    result.output = [output.signal, stdout, stderr];
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      result.error = _createSpawnSyncError("ENOENT", command, args);
    }
  }
  return result;
}

// These are Node.js CLI flags that expect a value. It's necessary to
// understand these flags in order to properly replace flags passed to the
// child process. For example, -e is a Node flag for eval mode if it is part
// of process.execArgv. However, -e could also be an application flag if it is
// part of process.execv instead. We only want to process execArgv flags.
const kLongArgType = 1;
const kShortArgType = 2;
const kLongArg = { type: kLongArgType };
const kShortArg = { type: kShortArgType };
const kNodeFlagsMap = new Map([
  ["--build-snapshot", kLongArg],
  ["-c", kShortArg],
  ["--check", kLongArg],
  ["-C", kShortArg],
  ["--conditions", kLongArg],
  ["--cpu-prof-dir", kLongArg],
  ["--cpu-prof-interval", kLongArg],
  ["--cpu-prof-name", kLongArg],
  ["--diagnostic-dir", kLongArg],
  ["--disable-proto", kLongArg],
  ["--dns-result-order", kLongArg],
  ["-e", kShortArg],
  ["--eval", kLongArg],
  ["--experimental-loader", kLongArg],
  ["--experimental-policy", kLongArg],
  ["--experimental-specifier-resolution", kLongArg],
  ["--heapsnapshot-near-heap-limit", kLongArg],
  ["--heapsnapshot-signal", kLongArg],
  ["--heap-prof-dir", kLongArg],
  ["--heap-prof-interval", kLongArg],
  ["--heap-prof-name", kLongArg],
  ["--icu-data-dir", kLongArg],
  ["--input-type", kLongArg],
  ["--inspect-publish-uid", kLongArg],
  ["--max-http-header-size", kLongArg],
  ["--openssl-config", kLongArg],
  ["-p", kShortArg],
  ["--print", kLongArg],
  ["--policy-integrity", kLongArg],
  ["--prof-process", kLongArg],
  ["-r", kShortArg],
  ["--require", kLongArg],
  ["--redirect-warnings", kLongArg],
  ["--report-dir", kLongArg],
  ["--report-directory", kLongArg],
  ["--report-filename", kLongArg],
  ["--report-signal", kLongArg],
  ["--secure-heap", kLongArg],
  ["--secure-heap-min", kLongArg],
  ["--snapshot-blob", kLongArg],
  ["--title", kLongArg],
  ["--tls-cipher-list", kLongArg],
  ["--tls-keylog", kLongArg],
  ["--unhandled-rejections", kLongArg],
  ["--use-largepages", kLongArg],
  ["--v8-pool-size", kLongArg],
]);
const kDenoSubcommands = new Set([
  "add",
  "bench",
  "cache",
  "check",
  "compile",
  "completions",
  "coverage",
  "doc",
  "eval",
  "fmt",
  "help",
  "info",
  "init",
  "install",
  "lint",
  "lsp",
  "publish",
  "repl",
  "run",
  "tasks",
  "test",
  "types",
  "uninstall",
  "upgrade",
  "vendor",
]);

function toDenoArgs(args: string[]): string[] {
  if (args.length === 0) {
    return args;
  }

  // Update this logic as more CLI arguments are mapped from Node to Deno.
  const denoArgs: string[] = [];
  let useRunArgs = true;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.charAt(0) !== "-" || arg === "--") {
      // Not a flag or no more arguments.

      // If the arg is a Deno subcommand, then the child process is being
      // spawned as Deno, not Deno in Node compat mode. In this case, bail out
      // and return the original args.
      if (kDenoSubcommands.has(arg)) {
        return args;
      }

      // Copy of the rest of the arguments to the output.
      for (let j = i; j < args.length; j++) {
        denoArgs.push(args[j]);
      }

      break;
    }

    // Something that looks like a flag was passed.
    let flag = arg;
    let flagInfo = kNodeFlagsMap.get(arg);
    let isLongWithValue = false;
    let flagValue;

    if (flag === "--v8-options") {
      // If --v8-options is passed, it should be replaced with --v8-flags="--help".
      denoArgs.push("--v8-flags=--help");
      continue;
    }

    if (flagInfo === undefined) {
      // If the flag was not found, it's either not a known flag or it's a long
      // flag containing an '='.
      const splitAt = arg.indexOf("=");

      if (splitAt !== -1) {
        flag = arg.slice(0, splitAt);
        flagInfo = kNodeFlagsMap.get(flag);
        flagValue = arg.slice(splitAt + 1);
        isLongWithValue = true;
      }
    }

    if (flagInfo === undefined) {
      if (arg === "--no-warnings") {
        denoArgs.push("--quiet");
      } else {
        // Not a known flag that expects a value. Just copy it to the output.
        denoArgs.push(arg);
      }
      continue;
    }

    // This is a flag with a value. Get the value if we don't already have it.
    if (flagValue === undefined) {
      i++;

      if (i >= args.length) {
        // There was user error. There should be another arg for the value, but
        // there isn't one. Just copy the arg to the output. It's not going
        // to work anyway.
        denoArgs.push(arg);
        continue;
      }

      flagValue = args[i];
    }

    // Remap Node's eval flags to Deno.
    if (flag === "-e" || flag === "--eval") {
      denoArgs.push("eval", flagValue);
      useRunArgs = false;
    } else if (isLongWithValue) {
      denoArgs.push(arg);
    } else {
      denoArgs.push(flag, flagValue);
    }
  }

  if (useRunArgs) {
    // -A is not ideal, but needed to propagate permissions.
    denoArgs.unshift("run", "-A");
  }

  return denoArgs;
}

const kControlDisconnect = Symbol("kControlDisconnect");
const kPendingMessages = Symbol("kPendingMessages");

// controls refcounting for the IPC channel
class Control extends EventEmitter {
  #channel: number;
  #refs: number = 0;
  #refExplicitlySet = false;
  #connected = true;
  [kPendingMessages] = [];
  constructor(channel: number) {
    super();
    this.#channel = channel;
  }

  #ref() {
    if (this.#connected) {
      op_node_ipc_ref(this.#channel);
    }
  }

  #unref() {
    if (this.#connected) {
      op_node_ipc_unref(this.#channel);
    }
  }

  [kControlDisconnect]() {
    this.#unref();
    this.#connected = false;
  }

  refCounted() {
    if (++this.#refs === 1 && !this.#refExplicitlySet) {
      this.#ref();
    }
  }

  unrefCounted() {
    if (--this.#refs === 0 && !this.#refExplicitlySet) {
      this.#unref();
      this.emit("unref");
    }
  }

  ref() {
    this.#refExplicitlySet = true;
    this.#ref();
  }

  unref() {
    this.#refExplicitlySet = false;
    this.#unref();
  }
}

type InternalMessage = {
  cmd: `NODE_${string}`;
};

// deno-lint-ignore no-explicit-any
function isInternal(msg: any): msg is InternalMessage {
  if (msg && typeof msg === "object") {
    const cmd = msg["cmd"];
    if (typeof cmd === "string") {
      return StringPrototypeStartsWith(cmd, "NODE_");
    }
  }
  return false;
}

function internalCmdName(msg: InternalMessage): string {
  return StringPrototypeSlice(msg.cmd, 5);
}

// deno-lint-ignore no-explicit-any
export function setupChannel(target: any, ipc: number) {
  const control = new Control(ipc);
  target.channel = control;

  async function readLoop() {
    try {
      while (true) {
        if (!target.connected || target.killed) {
          return;
        }
        const prom = op_node_ipc_read(ipc);
        // there will always be a pending read promise,
        // but it shouldn't keep the event loop from exiting
        core.unrefOpPromise(prom);
        const msg = await prom;
        if (isInternal(msg)) {
          const cmd = internalCmdName(msg);
          if (cmd === "CLOSE") {
            // Channel closed.
            target.disconnect();
            return;
          } else {
            // TODO(nathanwhit): once we add support for sending
            // handles, if we want to support deno-node IPC interop,
            // we'll need to handle the NODE_HANDLE_* messages here.
            continue;
          }
        }

        nextTick(handleMessage, msg);
      }
    } catch (err) {
      if (
        err instanceof Deno.errors.Interrupted ||
        err instanceof Deno.errors.BadResource
      ) {
        return;
      }
    }
  }

  function handleMessage(msg) {
    if (!target.channel) {
      return;
    }
    if (target.listenerCount("message") !== 0) {
      target.emit("message", msg);
      return;
    }

    ArrayPrototypePush(target.channel[kPendingMessages], msg);
  }

  target.on("newListener", () => {
    nextTick(() => {
      if (!target.channel || !target.listenerCount("message")) {
        return;
      }
      for (const msg of target.channel[kPendingMessages]) {
        target.emit("message", msg);
      }
      target.channel[kPendingMessages] = [];
    });
  });

  target.send = function (message, handle, options, callback) {
    if (typeof handle === "function") {
      callback = handle;
      handle = undefined;
      options = undefined;
    } else if (typeof options === "function") {
      callback = options;
      options = undefined;
    } else if (options !== undefined) {
      validateObject(options, "options");
    }

    options = { swallowErrors: false, ...options };

    if (message === undefined) {
      throw new TypeError("ERR_MISSING_ARGS", "message");
    }

    if (handle !== undefined) {
      notImplemented("ChildProcess.send with handle");
    }

    if (!target.connected) {
      const err = new ERR_IPC_CHANNEL_CLOSED();
      if (typeof callback === "function") {
        nextTick(callback, err);
      } else {
        nextTick(() => target.emit("error", err));
      }
      return false;
    }

    // signals whether the queue is within the limit.
    // if false, the sender should slow down.
    // this acts as a backpressure mechanism.
    const queueOk = [true];
    control.refCounted();
    op_node_ipc_write(ipc, message, queueOk)
      .then(() => {
        control.unrefCounted();
        if (callback) {
          nextTick(callback, null);
        }
      }, (err: Error) => {
        control.unrefCounted();
        if (err instanceof Deno.errors.Interrupted) {
          // Channel closed on us mid-write.
        } else {
          if (typeof callback === "function") {
            nextTick(callback, err);
          } else {
            nextTick(() => target.emit("error", err));
          }
        }
      });
    return queueOk[0];
  };

  target.connected = true;

  target.disconnect = function () {
    if (!target.connected) {
      target.emit("error", new Error("IPC channel is already disconnected"));
      return;
    }

    target.connected = false;
    target[kCanDisconnect] = false;
    control[kControlDisconnect]();
    nextTick(() => {
      target.channel = null;
      core.close(ipc);
      target.emit("disconnect");
    });
  };
  target[kCanDisconnect] = true;

  // Start reading messages from the channel.
  readLoop();

  return control;
}

export default {
  ChildProcess,
  normalizeSpawnArguments,
  stdioStringToArray,
  spawnSync,
  setupChannel,
};
