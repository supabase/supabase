// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="deno.net" />

/** Deno provides extra properties on `import.meta`. These are included here
 * to ensure that these are still available when using the Deno namespace in
 * conjunction with other type libs, like `dom`.
 *
 * @category Platform
 */
declare interface ImportMeta {
  /** A string representation of the fully qualified module URL. When the
   * module is loaded locally, the value will be a file URL (e.g.
   * `file:///path/module.ts`).
   *
   * You can also parse the string as a URL to determine more information about
   * how the current module was loaded. For example to determine if a module was
   * local or not:
   *
   * ```ts
   * const url = new URL(import.meta.url);
   * if (url.protocol === "file:") {
   *   console.log("this module was loaded locally");
   * }
   * ```
   */
  url: string

  /** The absolute path of the current module.
   *
   * This property is only provided for local modules (ie. using `file://` URLs).
   *
   * Example:
   * ```
   * // Unix
   * console.log(import.meta.filename); // /home/alice/my_module.ts
   *
   * // Windows
   * console.log(import.meta.filename); // C:\alice\my_module.ts
   * ```
   */
  filename?: string

  /** The absolute path of the directory containing the current module.
   *
   * This property is only provided for local modules (ie. using `file://` URLs).
   *
   * * Example:
   * ```
   * // Unix
   * console.log(import.meta.dirname); // /home/alice
   *
   * // Windows
   * console.log(import.meta.dirname); // C:\alice
   * ```
   */
  dirname?: string

  /** A flag that indicates if the current module is the main module that was
   * called when starting the program under Deno.
   *
   * ```ts
   * if (import.meta.main) {
   *   // this was loaded as the main module, maybe do some bootstrapping
   * }
   * ```
   */
  main: boolean

  /** A function that returns resolved specifier as if it would be imported
   * using `import(specifier)`.
   *
   * ```ts
   * console.log(import.meta.resolve("./foo.js"));
   * // file:///dev/foo.js
   * ```
   */
  resolve(specifier: string): string
}

/** Deno supports [User Timing Level 3](https://w3c.github.io/user-timing)
 * which is not widely supported yet in other runtimes.
 *
 * Check out the
 * [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
 * documentation on MDN for further information about how to use the API.
 *
 * @category Performance
 */
declare interface Performance {
  /** Stores a timestamp with the associated name (a "mark"). */
  mark(markName: string, options?: PerformanceMarkOptions): PerformanceMark

  /** Stores the `DOMHighResTimeStamp` duration between two marks along with the
   * associated name (a "measure"). */
  measure(measureName: string, options?: PerformanceMeasureOptions): PerformanceMeasure
}

/**
 * Options which are used in conjunction with `performance.mark`. Check out the
 * MDN
 * [`performance.mark()`](https://developer.mozilla.org/en-US/docs/Web/API/Performance/mark#markoptions)
 * documentation for more details.
 *
 * @category Performance
 */
declare interface PerformanceMarkOptions {
  /** Metadata to be included in the mark. */
  // deno-lint-ignore no-explicit-any
  detail?: any

  /** Timestamp to be used as the mark time. */
  startTime?: number
}

/**
 * Options which are used in conjunction with `performance.measure`. Check out the
 * MDN
 * [`performance.mark()`](https://developer.mozilla.org/en-US/docs/Web/API/Performance/measure#measureoptions)
 * documentation for more details.
 *
 * @category Performance
 */
declare interface PerformanceMeasureOptions {
  /** Metadata to be included in the measure. */
  // deno-lint-ignore no-explicit-any
  detail?: any

  /** Timestamp to be used as the start time or string to be used as start
   * mark. */
  start?: string | number

  /** Duration between the start and end times. */
  duration?: number

  /** Timestamp to be used as the end time or string to be used as end mark. */
  end?: string | number
}

/** The global namespace where Deno specific, non-standard APIs are located. */
declare namespace Deno {
  /** A set of error constructors that are raised by Deno APIs.
   *
   * Can be used to provide more specific handling of failures within code
   * which is using Deno APIs. For example, handling attempting to open a file
   * which does not exist:
   *
   * ```ts
   * try {
   *   const file = await Deno.open("./some/file.txt");
   * } catch (error) {
   *   if (error instanceof Deno.errors.NotFound) {
   *     console.error("the file was not found");
   *   } else {
   *     // otherwise re-throw
   *     throw error;
   *   }
   * }
   * ```
   *
   * @category Errors
   */
  export namespace errors {
    /**
     * Raised when the underlying operating system indicates that the file
     * was not found.
     *
     * @category Errors */
    export class NotFound extends Error {}
    /**
     * Raised when the underlying operating system indicates the current user
     * which the Deno process is running under does not have the appropriate
     * permissions to a file or resource, or the user _did not_ provide required
     * `--allow-*` flag.
     *
     * @category Errors */
    export class PermissionDenied extends Error {}
    /**
     * Raised when the underlying operating system reports that a connection to
     * a resource is refused.
     *
     * @category Errors */
    export class ConnectionRefused extends Error {}
    /**
     * Raised when the underlying operating system reports that a connection has
     * been reset. With network servers, it can be a _normal_ occurrence where a
     * client will abort a connection instead of properly shutting it down.
     *
     * @category Errors */
    export class ConnectionReset extends Error {}
    /**
     * Raised when the underlying operating system reports an `ECONNABORTED`
     * error.
     *
     * @category Errors */
    export class ConnectionAborted extends Error {}
    /**
     * Raised when the underlying operating system reports an `ENOTCONN` error.
     *
     * @category Errors */
    export class NotConnected extends Error {}
    /**
     * Raised when attempting to open a server listener on an address and port
     * that already has a listener.
     *
     * @category Errors */
    export class AddrInUse extends Error {}
    /**
     * Raised when the underlying operating system reports an `EADDRNOTAVAIL`
     * error.
     *
     * @category Errors */
    export class AddrNotAvailable extends Error {}
    /**
     * Raised when trying to write to a resource and a broken pipe error occurs.
     * This can happen when trying to write directly to `stdout` or `stderr`
     * and the operating system is unable to pipe the output for a reason
     * external to the Deno runtime.
     *
     * @category Errors */
    export class BrokenPipe extends Error {}
    /**
     * Raised when trying to create a resource, like a file, that already
     * exits.
     *
     * @category Errors */
    export class AlreadyExists extends Error {}
    /**
     * Raised when an operation to returns data that is invalid for the
     * operation being performed.
     *
     * @category Errors */
    export class InvalidData extends Error {}
    /**
     * Raised when the underlying operating system reports that an I/O operation
     * has timed out (`ETIMEDOUT`).
     *
     * @category Errors */
    export class TimedOut extends Error {}
    /**
     * Raised when the underlying operating system reports an `EINTR` error. In
     * many cases, this underlying IO error will be handled internally within
     * Deno, or result in an @{link BadResource} error instead.
     *
     * @category Errors */
    export class Interrupted extends Error {}
    /**
     * Raised when the underlying operating system would need to block to
     * complete but an asynchronous (non-blocking) API is used.
     *
     * @category Errors */
    export class WouldBlock extends Error {}
    /**
     * Raised when expecting to write to a IO buffer resulted in zero bytes
     * being written.
     *
     * @category Errors */
    export class WriteZero extends Error {}
    /**
     * Raised when attempting to read bytes from a resource, but the EOF was
     * unexpectedly encountered.
     *
     * @category Errors */
    export class UnexpectedEof extends Error {}
    /**
     * The underlying IO resource is invalid or closed, and so the operation
     * could not be performed.
     *
     * @category Errors */
    export class BadResource extends Error {}
    /**
     * Raised in situations where when attempting to load a dynamic import,
     * too many redirects were encountered.
     *
     * @category Errors */
    export class Http extends Error {}
    /**
     * Raised when the underlying IO resource is not available because it is
     * being awaited on in another block of code.
     *
     * @category Errors */
    export class Busy extends Error {}
    /**
     * Raised when the underlying Deno API is asked to perform a function that
     * is not currently supported.
     *
     * @category Errors */
    export class NotSupported extends Error {}
    /**
     * Raised when too many symbolic links were encountered when resolving the
     * filename.
     *
     * @category Errors */
    export class FilesystemLoop extends Error {}
    /**
     * Raised when trying to open, create or write to a directory.
     *
     * @category Errors */
    export class IsADirectory extends Error {}
    /**
     * Raised when performing a socket operation but the remote host is
     * not reachable.
     *
     * @category Errors */
    export class NetworkUnreachable extends Error {}
    /**
     * Raised when trying to perform an operation on a path that is not a
     * directory, when directory is required.
     *
     * @category Errors */
    export class NotADirectory extends Error {}
  }

  /** The current process ID of this instance of the Deno CLI.
   *
   * ```ts
   * console.log(Deno.pid);
   * ```
   *
   * @category Runtime
   */
  export const pid: number

  /**
   * The process ID of parent process of this instance of the Deno CLI.
   *
   * ```ts
   * console.log(Deno.ppid);
   * ```
   *
   * @category Runtime
   */
  export const ppid: number

  /** @category Runtime */
  export interface MemoryUsage {
    /** The number of bytes of the current Deno's process resident set size,
     * which is the amount of memory occupied in main memory (RAM). */
    rss: number
    /** The total size of the heap for V8, in bytes. */
    heapTotal: number
    /** The amount of the heap used for V8, in bytes. */
    heapUsed: number
    /** Memory, in bytes, associated with JavaScript objects outside of the
     * JavaScript isolate. */
    external: number
  }

  /**
   * Returns an object describing the memory usage of the Deno process and the
   * V8 subsystem measured in bytes.
   *
   * @category Runtime
   */
  export function memoryUsage(): MemoryUsage

  /**
   * Get the `hostname` of the machine the Deno process is running on.
   *
   * ```ts
   * console.log(Deno.hostname());
   * ```
   *
   * Requires `allow-sys` permission.
   *
   * @tags allow-sys
   * @category Runtime
   */
  export function hostname(): string

  /**
   * Returns an array containing the 1, 5, and 15 minute load averages. The
   * load average is a measure of CPU and IO utilization of the last one, five,
   * and 15 minute periods expressed as a fractional number.  Zero means there
   * is no load. On Windows, the three values are always the same and represent
   * the current load, not the 1, 5 and 15 minute load averages.
   *
   * ```ts
   * console.log(Deno.loadavg());  // e.g. [ 0.71, 0.44, 0.44 ]
   * ```
   *
   * Requires `allow-sys` permission.
   *
   * On Windows there is no API available to retrieve this information and this method returns `[ 0, 0, 0 ]`.
   *
   * @tags allow-sys
   * @category Runtime
   */
  export function loadavg(): number[]

  /**
   * The information for a network interface returned from a call to
   * {@linkcode Deno.networkInterfaces}.
   *
   * @category Network
   */
  export interface NetworkInterfaceInfo {
    /** The network interface name. */
    name: string
    /** The IP protocol version. */
    family: 'IPv4' | 'IPv6'
    /** The IP address bound to the interface. */
    address: string
    /** The netmask applied to the interface. */
    netmask: string
    /** The IPv6 scope id or `null`. */
    scopeid: number | null
    /** The CIDR range. */
    cidr: string
    /** The MAC address. */
    mac: string
  }

  /**
   * Returns an array of the network interface information.
   *
   * ```ts
   * console.log(Deno.networkInterfaces());
   * ```
   *
   * Requires `allow-sys` permission.
   *
   * @tags allow-sys
   * @category Network
   */
  export function networkInterfaces(): NetworkInterfaceInfo[]

  /**
   * Displays the total amount of free and used physical and swap memory in the
   * system, as well as the buffers and caches used by the kernel.
   *
   * This is similar to the `free` command in Linux
   *
   * ```ts
   * console.log(Deno.systemMemoryInfo());
   * ```
   *
   * Requires `allow-sys` permission.
   *
   * @tags allow-sys
   * @category Runtime
   */
  export function systemMemoryInfo(): SystemMemoryInfo

  /**
   * Information returned from a call to {@linkcode Deno.systemMemoryInfo}.
   *
   * @category Runtime
   */
  export interface SystemMemoryInfo {
    /** Total installed memory in bytes. */
    total: number
    /** Unused memory in bytes. */
    free: number
    /** Estimation of how much memory, in bytes, is available for starting new
     * applications, without swapping. Unlike the data provided by the cache or
     * free fields, this field takes into account page cache and also that not
     * all reclaimable memory will be reclaimed due to items being in use.
     */
    available: number
    /** Memory used by kernel buffers. */
    buffers: number
    /** Memory used by the page cache and slabs. */
    cached: number
    /** Total swap memory. */
    swapTotal: number
    /** Unused swap memory. */
    swapFree: number
  }

  /** Reflects the `NO_COLOR` environment variable at program start.
   *
   * When the value is `true`, the Deno CLI will attempt to not send color codes
   * to `stderr` or `stdout` and other command line programs should also attempt
   * to respect this value.
   *
   * See: https://no-color.org/
   *
   * @category Runtime
   */
  export const noColor: boolean

  /**
   * Returns the release version of the Operating System.
   *
   * ```ts
   * console.log(Deno.osRelease());
   * ```
   *
   * Requires `allow-sys` permission.
   * Under consideration to possibly move to Deno.build or Deno.versions and if
   * it should depend sys-info, which may not be desirable.
   *
   * @tags allow-sys
   * @category Runtime
   */
  export function osRelease(): string

  /**
   * Returns the Operating System uptime in number of seconds.
   *
   * ```ts
   * console.log(Deno.osUptime());
   * ```
   *
   * Requires `allow-sys` permission.
   *
   * @tags allow-sys
   * @category Runtime
   */
  export function osUptime(): number

  /**
   * Options which define the permissions within a test or worker context.
   *
   * `"inherit"` ensures that all permissions of the parent process will be
   * applied to the test context. `"none"` ensures the test context has no
   * permissions. A `PermissionOptionsObject` provides a more specific
   * set of permissions to the test context.
   *
   * @category Permissions */
  export type PermissionOptions = 'inherit' | 'none' | PermissionOptionsObject

  /**
   * A set of options which can define the permissions within a test or worker
   * context at a highly specific level.
   *
   * @category Permissions */
  export interface PermissionOptionsObject {
    /** Specifies if the `env` permission should be requested or revoked.
     * If set to `"inherit"`, the current `env` permission will be inherited.
     * If set to `true`, the global `env` permission will be requested.
     * If set to `false`, the global `env` permission will be revoked.
     *
     * @default {false}
     */
    env?: 'inherit' | boolean | string[]

    /** Specifies if the `sys` permission should be requested or revoked.
     * If set to `"inherit"`, the current `sys` permission will be inherited.
     * If set to `true`, the global `sys` permission will be requested.
     * If set to `false`, the global `sys` permission will be revoked.
     *
     * @default {false}
     */
    sys?: 'inherit' | boolean | string[]

    /** Specifies if the `hrtime` permission should be requested or revoked.
     * If set to `"inherit"`, the current `hrtime` permission will be inherited.
     * If set to `true`, the global `hrtime` permission will be requested.
     * If set to `false`, the global `hrtime` permission will be revoked.
     *
     * @default {false}
     */
    hrtime?: 'inherit' | boolean

    /** Specifies if the `net` permission should be requested or revoked.
     * if set to `"inherit"`, the current `net` permission will be inherited.
     * if set to `true`, the global `net` permission will be requested.
     * if set to `false`, the global `net` permission will be revoked.
     * if set to `string[]`, the `net` permission will be requested with the
     * specified host strings with the format `"<host>[:<port>]`.
     *
     * @default {false}
     *
     * Examples:
     *
     * ```ts
     * import { assertEquals } from "jsr:@std/assert";
     *
     * Deno.test({
     *   name: "inherit",
     *   permissions: {
     *     net: "inherit",
     *   },
     *   async fn() {
     *     const status = await Deno.permissions.query({ name: "net" })
     *     assertEquals(status.state, "granted");
     *   },
     * });
     * ```
     *
     * ```ts
     * import { assertEquals } from "jsr:@std/assert";
     *
     * Deno.test({
     *   name: "true",
     *   permissions: {
     *     net: true,
     *   },
     *   async fn() {
     *     const status = await Deno.permissions.query({ name: "net" });
     *     assertEquals(status.state, "granted");
     *   },
     * });
     * ```
     *
     * ```ts
     * import { assertEquals } from "jsr:@std/assert";
     *
     * Deno.test({
     *   name: "false",
     *   permissions: {
     *     net: false,
     *   },
     *   async fn() {
     *     const status = await Deno.permissions.query({ name: "net" });
     *     assertEquals(status.state, "denied");
     *   },
     * });
     * ```
     *
     * ```ts
     * import { assertEquals } from "jsr:@std/assert";
     *
     * Deno.test({
     *   name: "localhost:8080",
     *   permissions: {
     *     net: ["localhost:8080"],
     *   },
     *   async fn() {
     *     const status = await Deno.permissions.query({ name: "net", host: "localhost:8080" });
     *     assertEquals(status.state, "granted");
     *   },
     * });
     * ```
     */
    net?: 'inherit' | boolean | string[]

    /** Specifies if the `ffi` permission should be requested or revoked.
     * If set to `"inherit"`, the current `ffi` permission will be inherited.
     * If set to `true`, the global `ffi` permission will be requested.
     * If set to `false`, the global `ffi` permission will be revoked.
     *
     * @default {false}
     */
    ffi?: 'inherit' | boolean | Array<string | URL>

    /** Specifies if the `read` permission should be requested or revoked.
     * If set to `"inherit"`, the current `read` permission will be inherited.
     * If set to `true`, the global `read` permission will be requested.
     * If set to `false`, the global `read` permission will be revoked.
     * If set to `Array<string | URL>`, the `read` permission will be requested with the
     * specified file paths.
     *
     * @default {false}
     */
    read?: 'inherit' | boolean | Array<string | URL>

    /** Specifies if the `run` permission should be requested or revoked.
     * If set to `"inherit"`, the current `run` permission will be inherited.
     * If set to `true`, the global `run` permission will be requested.
     * If set to `false`, the global `run` permission will be revoked.
     *
     * @default {false}
     */
    run?: 'inherit' | boolean | Array<string | URL>

    /** Specifies if the `write` permission should be requested or revoked.
     * If set to `"inherit"`, the current `write` permission will be inherited.
     * If set to `true`, the global `write` permission will be requested.
     * If set to `false`, the global `write` permission will be revoked.
     * If set to `Array<string | URL>`, the `write` permission will be requested with the
     * specified file paths.
     *
     * @default {false}
     */
    write?: 'inherit' | boolean | Array<string | URL>
  }

  /**
   * Context that is passed to a testing function, which can be used to either
   * gain information about the current test, or register additional test
   * steps within the current test.
   *
   * @category Testing */
  export interface TestContext {
    /** The current test name. */
    name: string
    /** The string URL of the current test. */
    origin: string
    /** If the current test is a step of another test, the parent test context
     * will be set here. */
    parent?: TestContext

    /** Run a sub step of the parent test or step. Returns a promise
     * that resolves to a boolean signifying if the step completed successfully.
     *
     * The returned promise never rejects unless the arguments are invalid.
     *
     * If the test was ignored the promise returns `false`.
     *
     * ```ts
     * Deno.test({
     *   name: "a parent test",
     *   async fn(t) {
     *     console.log("before the step");
     *     await t.step({
     *       name: "step 1",
     *       fn(t) {
     *         console.log("current step:", t.name);
     *       }
     *     });
     *     console.log("after the step");
     *   }
     * });
     * ```
     */
    step(definition: TestStepDefinition): Promise<boolean>

    /** Run a sub step of the parent test or step. Returns a promise
     * that resolves to a boolean signifying if the step completed successfully.
     *
     * The returned promise never rejects unless the arguments are invalid.
     *
     * If the test was ignored the promise returns `false`.
     *
     * ```ts
     * Deno.test(
     *   "a parent test",
     *   async (t) => {
     *     console.log("before the step");
     *     await t.step(
     *       "step 1",
     *       (t) => {
     *         console.log("current step:", t.name);
     *       }
     *     );
     *     console.log("after the step");
     *   }
     * );
     * ```
     */
    step(name: string, fn: (t: TestContext) => void | Promise<void>): Promise<boolean>

    /** Run a sub step of the parent test or step. Returns a promise
     * that resolves to a boolean signifying if the step completed successfully.
     *
     * The returned promise never rejects unless the arguments are invalid.
     *
     * If the test was ignored the promise returns `false`.
     *
     * ```ts
     * Deno.test(async function aParentTest(t) {
     *   console.log("before the step");
     *   await t.step(function step1(t) {
     *     console.log("current step:", t.name);
     *   });
     *   console.log("after the step");
     * });
     * ```
     */
    step(fn: (t: TestContext) => void | Promise<void>): Promise<boolean>
  }

  /** @category Testing */
  export interface TestStepDefinition {
    /** The test function that will be tested when this step is executed. The
     * function can take an argument which will provide information about the
     * current step's context. */
    fn: (t: TestContext) => void | Promise<void>
    /** The name of the step. */
    name: string
    /** If truthy the current test step will be ignored.
     *
     * This is a quick way to skip over a step, but also can be used for
     * conditional logic, like determining if an environment feature is present.
     */
    ignore?: boolean
    /** Check that the number of async completed operations after the test step
     * is the same as number of dispatched operations. This ensures that the
     * code tested does not start async operations which it then does
     * not await. This helps in preventing logic errors and memory leaks
     * in the application code.
     *
     * Defaults to the parent test or step's value. */
    sanitizeOps?: boolean
    /** Ensure the test step does not "leak" resources - like open files or
     * network connections - by ensuring the open resources at the start of the
     * step match the open resources at the end of the step.
     *
     * Defaults to the parent test or step's value. */
    sanitizeResources?: boolean
    /** Ensure the test step does not prematurely cause the process to exit,
     * for example via a call to {@linkcode Deno.exit}.
     *
     * Defaults to the parent test or step's value. */
    sanitizeExit?: boolean
  }

  /** @category Testing */
  export interface TestDefinition {
    fn: (t: TestContext) => void | Promise<void>
    /** The name of the test. */
    name: string
    /** If truthy the current test step will be ignored.
     *
     * It is a quick way to skip over a step, but also can be used for
     * conditional logic, like determining if an environment feature is present.
     */
    ignore?: boolean
    /** If at least one test has `only` set to `true`, only run tests that have
     * `only` set to `true` and fail the test suite. */
    only?: boolean
    /** Check that the number of async completed operations after the test step
     * is the same as number of dispatched operations. This ensures that the
     * code tested does not start async operations which it then does
     * not await. This helps in preventing logic errors and memory leaks
     * in the application code.
     *
     * @default {true} */
    sanitizeOps?: boolean
    /** Ensure the test step does not "leak" resources - like open files or
     * network connections - by ensuring the open resources at the start of the
     * test match the open resources at the end of the test.
     *
     * @default {true} */
    sanitizeResources?: boolean
    /** Ensure the test case does not prematurely cause the process to exit,
     * for example via a call to {@linkcode Deno.exit}.
     *
     * @default {true} */
    sanitizeExit?: boolean
    /** Specifies the permissions that should be used to run the test.
     *
     * Set this to "inherit" to keep the calling runtime permissions, set this
     * to "none" to revoke all permissions, or set a more specific set of
     * permissions using a {@linkcode PermissionOptionsObject}.
     *
     * @default {"inherit"} */
    permissions?: PermissionOptions
  }

  /** Register a test which will be run when `deno test` is used on the command
   * line and the containing module looks like a test module.
   *
   * `fn` can be async if required.
   *
   * ```ts
   * import { assertEquals } from "jsr:@std/assert";
   *
   * Deno.test({
   *   name: "example test",
   *   fn() {
   *     assertEquals("world", "world");
   *   },
   * });
   *
   * Deno.test({
   *   name: "example ignored test",
   *   ignore: Deno.build.os === "windows",
   *   fn() {
   *     // This test is ignored only on Windows machines
   *   },
   * });
   *
   * Deno.test({
   *   name: "example async test",
   *   async fn() {
   *     const decoder = new TextDecoder("utf-8");
   *     const data = await Deno.readFile("hello_world.txt");
   *     assertEquals(decoder.decode(data), "Hello world");
   *   }
   * });
   * ```
   *
   * @category Testing
   */
  export const test: DenoTest

  /**
   * @category Testing
   */
  export interface DenoTest {
    /** Register a test which will be run when `deno test` is used on the command
     * line and the containing module looks like a test module.
     *
     * `fn` can be async if required.
     *
     * ```ts
     * import { assertEquals } from "jsr:@std/assert";
     *
     * Deno.test({
     *   name: "example test",
     *   fn() {
     *     assertEquals("world", "world");
     *   },
     * });
     *
     * Deno.test({
     *   name: "example ignored test",
     *   ignore: Deno.build.os === "windows",
     *   fn() {
     *     // This test is ignored only on Windows machines
     *   },
     * });
     *
     * Deno.test({
     *   name: "example async test",
     *   async fn() {
     *     const decoder = new TextDecoder("utf-8");
     *     const data = await Deno.readFile("hello_world.txt");
     *     assertEquals(decoder.decode(data), "Hello world");
     *   }
     * });
     * ```
     *
     * @category Testing
     */
    (t: TestDefinition): void

    /** Register a test which will be run when `deno test` is used on the command
     * line and the containing module looks like a test module.
     *
     * `fn` can be async if required.
     *
     * ```ts
     * import { assertEquals } from "jsr:@std/assert";
     *
     * Deno.test("My test description", () => {
     *   assertEquals("hello", "hello");
     * });
     *
     * Deno.test("My async test description", async () => {
     *   const decoder = new TextDecoder("utf-8");
     *   const data = await Deno.readFile("hello_world.txt");
     *   assertEquals(decoder.decode(data), "Hello world");
     * });
     * ```
     *
     * @category Testing
     */
    (name: string, fn: (t: TestContext) => void | Promise<void>): void

    /** Register a test which will be run when `deno test` is used on the command
     * line and the containing module looks like a test module.
     *
     * `fn` can be async if required. Declared function must have a name.
     *
     * ```ts
     * import { assertEquals } from "jsr:@std/assert";
     *
     * Deno.test(function myTestName() {
     *   assertEquals("hello", "hello");
     * });
     *
     * Deno.test(async function myOtherTestName() {
     *   const decoder = new TextDecoder("utf-8");
     *   const data = await Deno.readFile("hello_world.txt");
     *   assertEquals(decoder.decode(data), "Hello world");
     * });
     * ```
     *
     * @category Testing
     */
    (fn: (t: TestContext) => void | Promise<void>): void

    /** Register a test which will be run when `deno test` is used on the command
     * line and the containing module looks like a test module.
     *
     * `fn` can be async if required.
     *
     * ```ts
     * import { assert, fail, assertEquals } from "jsr:@std/assert";
     *
     * Deno.test("My test description", { permissions: { read: true } }, (): void => {
     *   assertEquals("hello", "hello");
     * });
     *
     * Deno.test("My async test description", { permissions: { read: false } }, async (): Promise<void> => {
     *   const decoder = new TextDecoder("utf-8");
     *   const data = await Deno.readFile("hello_world.txt");
     *   assertEquals(decoder.decode(data), "Hello world");
     * });
     * ```
     *
     * @category Testing
     */
    (
      name: string,
      options: Omit<TestDefinition, 'fn' | 'name'>,
      fn: (t: TestContext) => void | Promise<void>
    ): void

    /** Register a test which will be run when `deno test` is used on the command
     * line and the containing module looks like a test module.
     *
     * `fn` can be async if required.
     *
     * ```ts
     * import { assertEquals } from "jsr:@std/assert";
     *
     * Deno.test(
     *   {
     *     name: "My test description",
     *     permissions: { read: true },
     *   },
     *   () => {
     *     assertEquals("hello", "hello");
     *   },
     * );
     *
     * Deno.test(
     *   {
     *     name: "My async test description",
     *     permissions: { read: false },
     *   },
     *   async () => {
     *     const decoder = new TextDecoder("utf-8");
     *     const data = await Deno.readFile("hello_world.txt");
     *     assertEquals(decoder.decode(data), "Hello world");
     *   },
     * );
     * ```
     *
     * @category Testing
     */
    (
      options: Omit<TestDefinition, 'fn' | 'name'>,
      fn: (t: TestContext) => void | Promise<void>
    ): void

    /** Register a test which will be run when `deno test` is used on the command
     * line and the containing module looks like a test module.
     *
     * `fn` can be async if required. Declared function must have a name.
     *
     * ```ts
     * import { assertEquals } from "jsr:@std/assert";
     *
     * Deno.test(
     *   { permissions: { read: true } },
     *   function myTestName() {
     *     assertEquals("hello", "hello");
     *   },
     * );
     *
     * Deno.test(
     *   { permissions: { read: false } },
     *   async function myOtherTestName() {
     *     const decoder = new TextDecoder("utf-8");
     *     const data = await Deno.readFile("hello_world.txt");
     *     assertEquals(decoder.decode(data), "Hello world");
     *   },
     * );
     * ```
     *
     * @category Testing
     */
    (options: Omit<TestDefinition, 'fn'>, fn: (t: TestContext) => void | Promise<void>): void

    /** Shorthand property for ignoring a particular test case.
     *
     * @category Testing
     */
    ignore(t: Omit<TestDefinition, 'ignore'>): void

    /** Shorthand property for ignoring a particular test case.
     *
     * @category Testing
     */
    ignore(name: string, fn: (t: TestContext) => void | Promise<void>): void

    /** Shorthand property for ignoring a particular test case.
     *
     * @category Testing
     */
    ignore(fn: (t: TestContext) => void | Promise<void>): void

    /** Shorthand property for ignoring a particular test case.
     *
     * @category Testing
     */
    ignore(
      name: string,
      options: Omit<TestDefinition, 'fn' | 'name' | 'ignore'>,
      fn: (t: TestContext) => void | Promise<void>
    ): void

    /** Shorthand property for ignoring a particular test case.
     *
     * @category Testing
     */
    ignore(
      options: Omit<TestDefinition, 'fn' | 'name' | 'ignore'>,
      fn: (t: TestContext) => void | Promise<void>
    ): void

    /** Shorthand property for ignoring a particular test case.
     *
     * @category Testing
     */
    ignore(
      options: Omit<TestDefinition, 'fn' | 'ignore'>,
      fn: (t: TestContext) => void | Promise<void>
    ): void

    /** Shorthand property for focusing a particular test case.
     *
     * @category Testing
     */
    only(t: Omit<TestDefinition, 'only'>): void

    /** Shorthand property for focusing a particular test case.
     *
     * @category Testing
     */
    only(name: string, fn: (t: TestContext) => void | Promise<void>): void

    /** Shorthand property for focusing a particular test case.
     *
     * @category Testing
     */
    only(fn: (t: TestContext) => void | Promise<void>): void

    /** Shorthand property for focusing a particular test case.
     *
     * @category Testing
     */
    only(
      name: string,
      options: Omit<TestDefinition, 'fn' | 'name' | 'only'>,
      fn: (t: TestContext) => void | Promise<void>
    ): void

    /** Shorthand property for focusing a particular test case.
     *
     * @category Testing
     */
    only(
      options: Omit<TestDefinition, 'fn' | 'name' | 'only'>,
      fn: (t: TestContext) => void | Promise<void>
    ): void

    /** Shorthand property for focusing a particular test case.
     *
     * @category Testing
     */
    only(
      options: Omit<TestDefinition, 'fn' | 'only'>,
      fn: (t: TestContext) => void | Promise<void>
    ): void
  }

  /**
   * Context that is passed to a benchmarked function. The instance is shared
   * between iterations of the benchmark. Its methods can be used for example
   * to override of the measured portion of the function.
   *
   * @category Testing
   */
  export interface BenchContext {
    /** The current benchmark name. */
    name: string
    /** The string URL of the current benchmark. */
    origin: string

    /** Restarts the timer for the bench measurement. This should be called
     * after doing setup work which should not be measured.
     *
     * Warning: This method should not be used for benchmarks averaging less
     * than 10μs per iteration. In such cases it will be disabled but the call
     * will still have noticeable overhead, resulting in a warning.
     *
     * ```ts
     * Deno.bench("foo", async (t) => {
     *   const data = await Deno.readFile("data.txt");
     *   t.start();
     *   // some operation on `data`...
     * });
     * ```
     */
    start(): void

    /** End the timer early for the bench measurement. This should be called
     * before doing teardown work which should not be measured.
     *
     * Warning: This method should not be used for benchmarks averaging less
     * than 10μs per iteration. In such cases it will be disabled but the call
     * will still have noticeable overhead, resulting in a warning.
     *
     * ```ts
     * Deno.bench("foo", async (t) => {
     *   using file = await Deno.open("data.txt");
     *   t.start();
     *   // some operation on `file`...
     *   t.end();
     * });
     * ```
     */
    end(): void
  }

  /**
   * The interface for defining a benchmark test using {@linkcode Deno.bench}.
   *
   * @category Testing
   */
  export interface BenchDefinition {
    /** The test function which will be benchmarked. */
    fn: (b: BenchContext) => void | Promise<void>
    /** The name of the test, which will be used in displaying the results. */
    name: string
    /** If truthy, the benchmark test will be ignored/skipped. */
    ignore?: boolean
    /** Group name for the benchmark.
     *
     * Grouped benchmarks produce a group time summary, where the difference
     * in performance between each test of the group is compared. */
    group?: string
    /** Benchmark should be used as the baseline for other benchmarks.
     *
     * If there are multiple baselines in a group, the first one is used as the
     * baseline. */
    baseline?: boolean
    /** If at least one bench has `only` set to true, only run benches that have
     * `only` set to `true` and fail the bench suite. */
    only?: boolean
    /** Ensure the bench case does not prematurely cause the process to exit,
     * for example via a call to {@linkcode Deno.exit}.
     *
     * @default {true} */
    sanitizeExit?: boolean
    /** Specifies the permissions that should be used to run the bench.
     *
     * Set this to `"inherit"` to keep the calling thread's permissions.
     *
     * Set this to `"none"` to revoke all permissions.
     *
     * @default {"inherit"}
     */
    permissions?: PermissionOptions
  }

  /**
   * Register a benchmark test which will be run when `deno bench` is used on
   * the command line and the containing module looks like a bench module.
   *
   * If the test function (`fn`) returns a promise or is async, the test runner
   * will await resolution to consider the test complete.
   *
   * ```ts
   * import { assertEquals } from "jsr:@std/assert";
   *
   * Deno.bench({
   *   name: "example test",
   *   fn() {
   *     assertEquals("world", "world");
   *   },
   * });
   *
   * Deno.bench({
   *   name: "example ignored test",
   *   ignore: Deno.build.os === "windows",
   *   fn() {
   *     // This test is ignored only on Windows machines
   *   },
   * });
   *
   * Deno.bench({
   *   name: "example async test",
   *   async fn() {
   *     const decoder = new TextDecoder("utf-8");
   *     const data = await Deno.readFile("hello_world.txt");
   *     assertEquals(decoder.decode(data), "Hello world");
   *   }
   * });
   * ```
   *
   * @category Testing
   */
  export function bench(b: BenchDefinition): void

  /**
   * Register a benchmark test which will be run when `deno bench` is used on
   * the command line and the containing module looks like a bench module.
   *
   * If the test function (`fn`) returns a promise or is async, the test runner
   * will await resolution to consider the test complete.
   *
   * ```ts
   * import { assertEquals } from "jsr:@std/assert";
   *
   * Deno.bench("My test description", () => {
   *   assertEquals("hello", "hello");
   * });
   *
   * Deno.bench("My async test description", async () => {
   *   const decoder = new TextDecoder("utf-8");
   *   const data = await Deno.readFile("hello_world.txt");
   *   assertEquals(decoder.decode(data), "Hello world");
   * });
   * ```
   *
   * @category Testing
   */
  export function bench(name: string, fn: (b: BenchContext) => void | Promise<void>): void

  /**
   * Register a benchmark test which will be run when `deno bench` is used on
   * the command line and the containing module looks like a bench module.
   *
   * If the test function (`fn`) returns a promise or is async, the test runner
   * will await resolution to consider the test complete.
   *
   * ```ts
   * import { assertEquals } from "jsr:@std/assert";
   *
   * Deno.bench(function myTestName() {
   *   assertEquals("hello", "hello");
   * });
   *
   * Deno.bench(async function myOtherTestName() {
   *   const decoder = new TextDecoder("utf-8");
   *   const data = await Deno.readFile("hello_world.txt");
   *   assertEquals(decoder.decode(data), "Hello world");
   * });
   * ```
   *
   * @category Testing
   */
  export function bench(fn: (b: BenchContext) => void | Promise<void>): void

  /**
   * Register a benchmark test which will be run when `deno bench` is used on
   * the command line and the containing module looks like a bench module.
   *
   * If the test function (`fn`) returns a promise or is async, the test runner
   * will await resolution to consider the test complete.
   *
   * ```ts
   * import { assertEquals } from "jsr:@std/assert";
   *
   * Deno.bench(
   *   "My test description",
   *   { permissions: { read: true } },
   *   () => {
   *    assertEquals("hello", "hello");
   *   }
   * );
   *
   * Deno.bench(
   *   "My async test description",
   *   { permissions: { read: false } },
   *   async () => {
   *     const decoder = new TextDecoder("utf-8");
   *     const data = await Deno.readFile("hello_world.txt");
   *     assertEquals(decoder.decode(data), "Hello world");
   *   }
   * );
   * ```
   *
   * @category Testing
   */
  export function bench(
    name: string,
    options: Omit<BenchDefinition, 'fn' | 'name'>,
    fn: (b: BenchContext) => void | Promise<void>
  ): void

  /**
   * Register a benchmark test which will be run when `deno bench` is used on
   * the command line and the containing module looks like a bench module.
   *
   * If the test function (`fn`) returns a promise or is async, the test runner
   * will await resolution to consider the test complete.
   *
   * ```ts
   * import { assertEquals } from "jsr:@std/assert";
   *
   * Deno.bench(
   *   { name: "My test description", permissions: { read: true } },
   *   () => {
   *     assertEquals("hello", "hello");
   *   }
   * );
   *
   * Deno.bench(
   *   { name: "My async test description", permissions: { read: false } },
   *   async () => {
   *     const decoder = new TextDecoder("utf-8");
   *     const data = await Deno.readFile("hello_world.txt");
   *     assertEquals(decoder.decode(data), "Hello world");
   *   }
   * );
   * ```
   *
   * @category Testing
   */
  export function bench(
    options: Omit<BenchDefinition, 'fn'>,
    fn: (b: BenchContext) => void | Promise<void>
  ): void

  /**
   * Register a benchmark test which will be run when `deno bench` is used on
   * the command line and the containing module looks like a bench module.
   *
   * If the test function (`fn`) returns a promise or is async, the test runner
   * will await resolution to consider the test complete.
   *
   * ```ts
   * import { assertEquals } from "jsr:@std/assert";
   *
   * Deno.bench(
   *   { permissions: { read: true } },
   *   function myTestName() {
   *     assertEquals("hello", "hello");
   *   }
   * );
   *
   * Deno.bench(
   *   { permissions: { read: false } },
   *   async function myOtherTestName() {
   *     const decoder = new TextDecoder("utf-8");
   *     const data = await Deno.readFile("hello_world.txt");
   *     assertEquals(decoder.decode(data), "Hello world");
   *   }
   * );
   * ```
   *
   * @category Testing
   */
  export function bench(
    options: Omit<BenchDefinition, 'fn' | 'name'>,
    fn: (b: BenchContext) => void | Promise<void>
  ): void

  /** Exit the Deno process with optional exit code.
   *
   * If no exit code is supplied then Deno will exit with return code of `0`.
   *
   * In worker contexts this is an alias to `self.close();`.
   *
   * ```ts
   * Deno.exit(5);
   * ```
   *
   * @category Runtime
   */
  export function exit(code?: number): never

  /** The exit code for the Deno process.
   *
   * If no exit code has been supplied, then Deno will assume a return code of `0`.
   *
   * When setting an exit code value, a number or non-NaN string must be provided,
   * otherwise a TypeError will be thrown.
   *
   * ```ts
   * console.log(Deno.exitCode); //-> 0
   * Deno.exitCode = 1;
   * console.log(Deno.exitCode); //-> 1
   * ```
   *
   * @category Runtime
   */
  export var exitCode: number

  /** An interface containing methods to interact with the process environment
   * variables.
   *
   * @tags allow-env
   * @category Runtime
   */
  export interface Env {
    /** Retrieve the value of an environment variable.
     *
     * Returns `undefined` if the supplied environment variable is not defined.
     *
     * ```ts
     * console.log(Deno.env.get("HOME"));  // e.g. outputs "/home/alice"
     * console.log(Deno.env.get("MADE_UP_VAR"));  // outputs "undefined"
     * ```
     *
     * Requires `allow-env` permission.
     *
     * @tags allow-env
     */
    get(key: string): string | undefined

    /** Set the value of an environment variable.
     *
     * ```ts
     * Deno.env.set("SOME_VAR", "Value");
     * Deno.env.get("SOME_VAR");  // outputs "Value"
     * ```
     *
     * Requires `allow-env` permission.
     *
     * @tags allow-env
     */
    set(key: string, value: string): void

    /** Delete the value of an environment variable.
     *
     * ```ts
     * Deno.env.set("SOME_VAR", "Value");
     * Deno.env.delete("SOME_VAR");  // outputs "undefined"
     * ```
     *
     * Requires `allow-env` permission.
     *
     * @tags allow-env
     */
    delete(key: string): void

    /** Check whether an environment variable is present or not.
     *
     * ```ts
     * Deno.env.set("SOME_VAR", "Value");
     * Deno.env.has("SOME_VAR");  // outputs true
     * ```
     *
     * Requires `allow-env` permission.
     *
     * @tags allow-env
     */
    has(key: string): boolean

    /** Returns a snapshot of the environment variables at invocation as a
     * simple object of keys and values.
     *
     * ```ts
     * Deno.env.set("TEST_VAR", "A");
     * const myEnv = Deno.env.toObject();
     * console.log(myEnv.SHELL);
     * Deno.env.set("TEST_VAR", "B");
     * console.log(myEnv.TEST_VAR);  // outputs "A"
     * ```
     *
     * Requires `allow-env` permission.
     *
     * @tags allow-env
     */
    toObject(): { [index: string]: string }
  }

  /** An interface containing methods to interact with the process environment
   * variables.
   *
   * @tags allow-env
   * @category Runtime
   */
  export const env: Env

  /**
   * Returns the path to the current deno executable.
   *
   * ```ts
   * console.log(Deno.execPath());  // e.g. "/home/alice/.local/bin/deno"
   * ```
   *
   * Requires `allow-read` permission.
   *
   * @tags allow-read
   * @category Runtime
   */
  export function execPath(): string

  /**
   * Change the current working directory to the specified path.
   *
   * ```ts
   * Deno.chdir("/home/userA");
   * Deno.chdir("../userB");
   * Deno.chdir("C:\\Program Files (x86)\\Java");
   * ```
   *
   * Throws {@linkcode Deno.errors.NotFound} if directory not found.
   *
   * Throws {@linkcode Deno.errors.PermissionDenied} if the user does not have
   * operating system file access rights.
   *
   * Requires `allow-read` permission.
   *
   * @tags allow-read
   * @category Runtime
   */
  export function chdir(directory: string | URL): void

  /**
   * Return a string representing the current working directory.
   *
   * If the current directory can be reached via multiple paths (due to symbolic
   * links), `cwd()` may return any one of them.
   *
   * ```ts
   * const currentWorkingDirectory = Deno.cwd();
   * ```
   *
   * Throws {@linkcode Deno.errors.NotFound} if directory not available.
   *
   * Requires `allow-read` permission.
   *
   * @tags allow-read
   * @category Runtime
   */
  export function cwd(): string

  /**
   * Creates `newpath` as a hard link to `oldpath`.
   *
   * ```ts
   * await Deno.link("old/name", "new/name");
   * ```
   *
   * Requires `allow-read` and `allow-write` permissions.
   *
   * @tags allow-read, allow-write
   * @category File System
   */
  export function link(oldpath: string, newpath: string): Promise<void>

  /**
   * Synchronously creates `newpath` as a hard link to `oldpath`.
   *
   * ```ts
   * Deno.linkSync("old/name", "new/name");
   * ```
   *
   * Requires `allow-read` and `allow-write` permissions.
   *
   * @tags allow-read, allow-write
   * @category File System
   */
  export function linkSync(oldpath: string, newpath: string): void

  /**
   * A enum which defines the seek mode for IO related APIs that support
   * seeking.
   *
   * @category I/O */
  export enum SeekMode {
    /* Seek from the start of the file/resource. */
    Start = 0,
    /* Seek from the current position within the file/resource. */
    Current = 1,
    /* Seek from the end of the current file/resource. */
    End = 2,
  }

  /**
   * An abstract interface which when implemented provides an interface to read
   * bytes into an array buffer asynchronously.
   *
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   *
   * @category I/O */
  export interface Reader {
    /** Reads up to `p.byteLength` bytes into `p`. It resolves to the number of
     * bytes read (`0` < `n` <= `p.byteLength`) and rejects if any error
     * encountered. Even if `read()` resolves to `n` < `p.byteLength`, it may
     * use all of `p` as scratch space during the call. If some data is
     * available but not `p.byteLength` bytes, `read()` conventionally resolves
     * to what is available instead of waiting for more.
     *
     * When `read()` encounters end-of-file condition, it resolves to EOF
     * (`null`).
     *
     * When `read()` encounters an error, it rejects with an error.
     *
     * Callers should always process the `n` > `0` bytes returned before
     * considering the EOF (`null`). Doing so correctly handles I/O errors that
     * happen after reading some bytes and also both of the allowed EOF
     * behaviors.
     *
     * Implementations should not retain a reference to `p`.
     *
     * Use
     * {@linkcode https://jsr.io/@std/io/doc/iterate-reader/~/iterateReader | iterateReader}
     * to turn {@linkcode Reader} into an {@linkcode AsyncIterator}.
     */
    read(p: Uint8Array): Promise<number | null>
  }

  /**
   * An abstract interface which when implemented provides an interface to read
   * bytes into an array buffer synchronously.
   *
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   *
   * @category I/O */
  export interface ReaderSync {
    /** Reads up to `p.byteLength` bytes into `p`. It resolves to the number
     * of bytes read (`0` < `n` <= `p.byteLength`) and rejects if any error
     * encountered. Even if `readSync()` returns `n` < `p.byteLength`, it may use
     * all of `p` as scratch space during the call. If some data is available
     * but not `p.byteLength` bytes, `readSync()` conventionally returns what is
     * available instead of waiting for more.
     *
     * When `readSync()` encounters end-of-file condition, it returns EOF
     * (`null`).
     *
     * When `readSync()` encounters an error, it throws with an error.
     *
     * Callers should always process the `n` > `0` bytes returned before
     * considering the EOF (`null`). Doing so correctly handles I/O errors that
     * happen after reading some bytes and also both of the allowed EOF
     * behaviors.
     *
     * Implementations should not retain a reference to `p`.
     *
     * Use
     * {@linkcode https://jsr.io/@std/io/doc/iterate-reader/~/iterateReaderSync | iterateReaderSync}
     * to turn {@linkcode ReaderSync} into an {@linkcode Iterator}.
     */
    readSync(p: Uint8Array): number | null
  }

  /**
   * An abstract interface which when implemented provides an interface to write
   * bytes from an array buffer to a file/resource asynchronously.
   *
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   *
   * @category I/O */
  export interface Writer {
    /** Writes `p.byteLength` bytes from `p` to the underlying data stream. It
     * resolves to the number of bytes written from `p` (`0` <= `n` <=
     * `p.byteLength`) or reject with the error encountered that caused the
     * write to stop early. `write()` must reject with a non-null error if
     * would resolve to `n` < `p.byteLength`. `write()` must not modify the
     * slice data, even temporarily.
     *
     * This function is one of the lowest
     * level APIs and most users should not work with this directly, but rather
     * use {@linkcode https://jsr.io/@std/io/doc/write-all/~/writeAll | writeAll}
     * instead.
     *
     * Implementations should not retain a reference to `p`.
     */
    write(p: Uint8Array): Promise<number>
  }

  /**
   * An abstract interface which when implemented provides an interface to write
   * bytes from an array buffer to a file/resource synchronously.
   *
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   *
   * @category I/O */
  export interface WriterSync {
    /** Writes `p.byteLength` bytes from `p` to the underlying data
     * stream. It returns the number of bytes written from `p` (`0` <= `n`
     * <= `p.byteLength`) and any error encountered that caused the write to
     * stop early. `writeSync()` must throw a non-null error if it returns `n` <
     * `p.byteLength`. `writeSync()` must not modify the slice data, even
     * temporarily.
     *
     * Implementations should not retain a reference to `p`.
     */
    writeSync(p: Uint8Array): number
  }

  /**
   * An abstract interface which when implemented provides an interface to close
   * files/resources that were previously opened.
   *
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   *
   * @category I/O */
  export interface Closer {
    /** Closes the resource, "freeing" the backing file/resource. */
    close(): void
  }

  /**
   * An abstract interface which when implemented provides an interface to seek
   * within an open file/resource asynchronously.
   *
   * @category I/O */
  export interface Seeker {
    /** Seek sets the offset for the next `read()` or `write()` to offset,
     * interpreted according to `whence`: `Start` means relative to the
     * start of the file, `Current` means relative to the current offset,
     * and `End` means relative to the end. Seek resolves to the new offset
     * relative to the start of the file.
     *
     * Seeking to an offset before the start of the file is an error. Seeking to
     * any positive offset is legal, but the behavior of subsequent I/O
     * operations on the underlying object is implementation-dependent.
     *
     * It resolves with the updated offset.
     */
    seek(offset: number | bigint, whence: SeekMode): Promise<number>
  }

  /**
   * An abstract interface which when implemented provides an interface to seek
   * within an open file/resource synchronously.
   *
   * @category I/O */
  export interface SeekerSync {
    /** Seek sets the offset for the next `readSync()` or `writeSync()` to
     * offset, interpreted according to `whence`: `Start` means relative
     * to the start of the file, `Current` means relative to the current
     * offset, and `End` means relative to the end.
     *
     * Seeking to an offset before the start of the file is an error. Seeking to
     * any positive offset is legal, but the behavior of subsequent I/O
     * operations on the underlying object is implementation-dependent.
     *
     * It returns the updated offset.
     */
    seekSync(offset: number | bigint, whence: SeekMode): number
  }

  /**
   * Copies from `src` to `dst` until either EOF (`null`) is read from `src` or
   * an error occurs. It resolves to the number of bytes copied or rejects with
   * the first error encountered while copying.
   *
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   *
   * @category I/O
   *
   * @param src The source to copy from
   * @param dst The destination to copy to
   * @param options Can be used to tune size of the buffer. Default size is 32kB
   */
  export function copy(src: Reader, dst: Writer, options?: { bufSize?: number }): Promise<number>

  /**
   * Turns a Reader, `r`, into an async iterator.
   *
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   *
   * @category I/O
   */
  export function iter(r: Reader, options?: { bufSize?: number }): AsyncIterableIterator<Uint8Array>

  /**
   * Turns a ReaderSync, `r`, into an iterator.
   *
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   *
   * @category I/O
   */
  export function iterSync(
    r: ReaderSync,
    options?: {
      bufSize?: number
    }
  ): IterableIterator<Uint8Array>

  /** Open a file and resolve to an instance of {@linkcode Deno.FsFile}. The
   * file does not need to previously exist if using the `create` or `createNew`
   * open options. The caller may have the resulting file automatically closed
   * by the runtime once it's out of scope by declaring the file variable with
   * the `using` keyword.
   *
   * ```ts
   * using file = await Deno.open("/foo/bar.txt", { read: true, write: true });
   * // Do work with file
   * ```
   *
   * Alternatively, the caller may manually close the resource when finished with
   * it.
   *
   * ```ts
   * const file = await Deno.open("/foo/bar.txt", { read: true, write: true });
   * // Do work with file
   * file.close();
   * ```
   *
   * Requires `allow-read` and/or `allow-write` permissions depending on
   * options.
   *
   * @tags allow-read, allow-write
   * @category File System
   */
  export function open(path: string | URL, options?: OpenOptions): Promise<FsFile>

  /** Synchronously open a file and return an instance of
   * {@linkcode Deno.FsFile}. The file does not need to previously exist if
   * using the `create` or `createNew` open options. The caller may have the
   * resulting file automatically closed by the runtime once it's out of scope
   * by declaring the file variable with the `using` keyword.
   *
   * ```ts
   * using file = Deno.openSync("/foo/bar.txt", { read: true, write: true });
   * // Do work with file
   * ```
   *
   * Alternatively, the caller may manually close the resource when finished with
   * it.
   *
   * ```ts
   * const file = Deno.openSync("/foo/bar.txt", { read: true, write: true });
   * // Do work with file
   * file.close();
   * ```
   *
   * Requires `allow-read` and/or `allow-write` permissions depending on
   * options.
   *
   * @tags allow-read, allow-write
   * @category File System
   */
  export function openSync(path: string | URL, options?: OpenOptions): FsFile

  /** Creates a file if none exists or truncates an existing file and resolves to
   *  an instance of {@linkcode Deno.FsFile}.
   *
   * ```ts
   * const file = await Deno.create("/foo/bar.txt");
   * ```
   *
   * Requires `allow-read` and `allow-write` permissions.
   *
   * @tags allow-read, allow-write
   * @category File System
   */
  export function create(path: string | URL): Promise<FsFile>

  /** Creates a file if none exists or truncates an existing file and returns
   *  an instance of {@linkcode Deno.FsFile}.
   *
   * ```ts
   * const file = Deno.createSync("/foo/bar.txt");
   * ```
   *
   * Requires `allow-read` and `allow-write` permissions.
   *
   * @tags allow-read, allow-write
   * @category File System
   */
  export function createSync(path: string | URL): FsFile

  /** Read from a resource ID (`rid`) into an array buffer (`buffer`).
   *
   * Resolves to either the number of bytes read during the operation or EOF
   * (`null`) if there was nothing more to read.
   *
   * It is possible for a read to successfully return with `0` bytes. This does
   * not indicate EOF.
   *
   * This function is one of the lowest level APIs and most users should not
   * work with this directly, but rather use {@linkcode ReadableStream} and
   * {@linkcode https://jsr.io/@std/streams/doc/to-array-buffer/~/toArrayBuffer | toArrayBuffer}
   * instead.
   *
   * **It is not guaranteed that the full buffer will be read in a single call.**
   *
   * ```ts
   * // if "/foo/bar.txt" contains the text "hello world":
   * using file = await Deno.open("/foo/bar.txt");
   * const buf = new Uint8Array(100);
   * const numberOfBytesRead = await Deno.read(file.rid, buf); // 11 bytes
   * const text = new TextDecoder().decode(buf);  // "hello world"
   * ```
   *
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   *
   * @category I/O
   */
  export function read(rid: number, buffer: Uint8Array): Promise<number | null>

  /** Synchronously read from a resource ID (`rid`) into an array buffer
   * (`buffer`).
   *
   * Returns either the number of bytes read during the operation or EOF
   * (`null`) if there was nothing more to read.
   *
   * It is possible for a read to successfully return with `0` bytes. This does
   * not indicate EOF.
   *
   * This function is one of the lowest level APIs and most users should not
   * work with this directly, but rather use {@linkcode ReadableStream} and
   * {@linkcode https://jsr.io/@std/streams/doc/to-array-buffer/~/toArrayBuffer | toArrayBuffer}
   * instead.
   *
   * **It is not guaranteed that the full buffer will be read in a single
   * call.**
   *
   * ```ts
   * // if "/foo/bar.txt" contains the text "hello world":
   * using file = Deno.openSync("/foo/bar.txt");
   * const buf = new Uint8Array(100);
   * const numberOfBytesRead = Deno.readSync(file.rid, buf); // 11 bytes
   * const text = new TextDecoder().decode(buf);  // "hello world"
   * ```
   *
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   *
   * @category I/O
   */
  export function readSync(rid: number, buffer: Uint8Array): number | null

  /** Write to the resource ID (`rid`) the contents of the array buffer (`data`).
   *
   * Resolves to the number of bytes written. This function is one of the lowest
   * level APIs and most users should not work with this directly, but rather
   * use {@linkcode WritableStream}, {@linkcode ReadableStream.from} and
   * {@linkcode ReadableStream.pipeTo}.
   *
   * **It is not guaranteed that the full buffer will be written in a single
   * call.**
   *
   * ```ts
   * const encoder = new TextEncoder();
   * const data = encoder.encode("Hello world");
   * using file = await Deno.open("/foo/bar.txt", { write: true });
   * const bytesWritten = await Deno.write(file.rid, data); // 11
   * ```
   *
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   *
   * @category I/O
   */
  export function write(rid: number, data: Uint8Array): Promise<number>

  /** Synchronously write to the resource ID (`rid`) the contents of the array
   * buffer (`data`).
   *
   * Returns the number of bytes written. This function is one of the lowest
   * level APIs and most users should not work with this directly, but rather
   * use {@linkcode WritableStream}, {@linkcode ReadableStream.from} and
   * {@linkcode ReadableStream.pipeTo}.
   *
   * **It is not guaranteed that the full buffer will be written in a single
   * call.**
   *
   * ```ts
   * const encoder = new TextEncoder();
   * const data = encoder.encode("Hello world");
   * using file = Deno.openSync("/foo/bar.txt", { write: true });
   * const bytesWritten = Deno.writeSync(file.rid, data); // 11
   * ```
   *
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   *
   * @category I/O
   */
  export function writeSync(rid: number, data: Uint8Array): number

  /** Seek a resource ID (`rid`) to the given `offset` under mode given by `whence`.
   * The call resolves to the new position within the resource (bytes from the start).
   *
   * ```ts
   * // Given file.rid pointing to file with "Hello world", which is 11 bytes long:
   * using file = await Deno.open(
   *   "hello.txt",
   *   { read: true, write: true, truncate: true, create: true },
   * );
   * await file.write(new TextEncoder().encode("Hello world"));
   *
   * // advance cursor 6 bytes
   * const cursorPosition = await Deno.seek(file.rid, 6, Deno.SeekMode.Start);
   * console.log(cursorPosition);  // 6
   * const buf = new Uint8Array(100);
   * await file.read(buf);
   * console.log(new TextDecoder().decode(buf)); // "world"
   * ```
   *
   * The seek modes work as follows:
   *
   * ```ts
   * // Given file.rid pointing to file with "Hello world", which is 11 bytes long:
   * using file = await Deno.open(
   *   "hello.txt",
   *   { read: true, write: true, truncate: true, create: true },
   * );
   * await file.write(new TextEncoder().encode("Hello world"));
   *
   * // Seek 6 bytes from the start of the file
   * console.log(await Deno.seek(file.rid, 6, Deno.SeekMode.Start)); // "6"
   * // Seek 2 more bytes from the current position
   * console.log(await Deno.seek(file.rid, 2, Deno.SeekMode.Current)); // "8"
   * // Seek backwards 2 bytes from the end of the file
   * console.log(await Deno.seek(file.rid, -2, Deno.SeekMode.End)); // "9" (i.e. 11-2)
   * ```
   *
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   *
   * @category I/O
   */
  export function seek(rid: number, offset: number | bigint, whence: SeekMode): Promise<number>

  /** Synchronously seek a resource ID (`rid`) to the given `offset` under mode
   * given by `whence`. The new position within the resource (bytes from the
   * start) is returned.
   *
   * ```ts
   * using file = Deno.openSync(
   *   "hello.txt",
   *   { read: true, write: true, truncate: true, create: true },
   * );
   * file.writeSync(new TextEncoder().encode("Hello world"));
   *
   * // advance cursor 6 bytes
   * const cursorPosition = Deno.seekSync(file.rid, 6, Deno.SeekMode.Start);
   * console.log(cursorPosition);  // 6
   * const buf = new Uint8Array(100);
   * file.readSync(buf);
   * console.log(new TextDecoder().decode(buf)); // "world"
   * ```
   *
   * The seek modes work as follows:
   *
   * ```ts
   * // Given file.rid pointing to file with "Hello world", which is 11 bytes long:
   * using file = Deno.openSync(
   *   "hello.txt",
   *   { read: true, write: true, truncate: true, create: true },
   * );
   * file.writeSync(new TextEncoder().encode("Hello world"));
   *
   * // Seek 6 bytes from the start of the file
   * console.log(Deno.seekSync(file.rid, 6, Deno.SeekMode.Start)); // "6"
   * // Seek 2 more bytes from the current position
   * console.log(Deno.seekSync(file.rid, 2, Deno.SeekMode.Current)); // "8"
   * // Seek backwards 2 bytes from the end of the file
   * console.log(Deno.seekSync(file.rid, -2, Deno.SeekMode.End)); // "9" (i.e. 11-2)
   * ```
   *
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   *
   * @category I/O
   */
  export function seekSync(rid: number, offset: number | bigint, whence: SeekMode): number

  /**
   * Flushes any pending data and metadata operations of the given file stream
   * to disk.
   *
   * ```ts
   * const file = await Deno.open(
   *   "my_file.txt",
   *   { read: true, write: true, create: true },
   * );
   * await file.write(new TextEncoder().encode("Hello World"));
   * await file.truncate(1);
   * await Deno.fsync(file.rid);
   * console.log(await Deno.readTextFile("my_file.txt")); // H
   * ```
   *
   * @category File System
   */
  export function fsync(rid: number): Promise<void>

  /**
   * Synchronously flushes any pending data and metadata operations of the given
   * file stream to disk.
   *
   * ```ts
   * const file = Deno.openSync(
   *   "my_file.txt",
   *   { read: true, write: true, create: true },
   * );
   * file.writeSync(new TextEncoder().encode("Hello World"));
   * file.truncateSync(1);
   * Deno.fsyncSync(file.rid);
   * console.log(Deno.readTextFileSync("my_file.txt")); // H
   * ```
   *
   * @category File System
   */
  export function fsyncSync(rid: number): void

  /**
   * Flushes any pending data operations of the given file stream to disk.
   *  ```ts
   * const file = await Deno.open(
   *   "my_file.txt",
   *   { read: true, write: true, create: true },
   * );
   * await file.write(new TextEncoder().encode("Hello World"));
   * await Deno.fdatasync(file.rid);
   * console.log(await Deno.readTextFile("my_file.txt")); // Hello World
   * ```
   *
   * @category File System
   */
  export function fdatasync(rid: number): Promise<void>

  /**
   * Synchronously flushes any pending data operations of the given file stream
   * to disk.
   *
   *  ```ts
   * const file = Deno.openSync(
   *   "my_file.txt",
   *   { read: true, write: true, create: true },
   * );
   * file.writeSync(new TextEncoder().encode("Hello World"));
   * Deno.fdatasyncSync(file.rid);
   * console.log(Deno.readTextFileSync("my_file.txt")); // Hello World
   * ```
   *
   * @category File System
   */
  export function fdatasyncSync(rid: number): void

  /** Close the given resource ID (`rid`) which has been previously opened, such
   * as via opening or creating a file. Closing a file when you are finished
   * with it is important to avoid leaking resources.
   *
   * ```ts
   * const file = await Deno.open("my_file.txt");
   * // do work with "file" object
   * Deno.close(file.rid);
   * ```
   *
   * It is recommended to define the variable with the `using` keyword so the
   * runtime will automatically close the resource when it goes out of scope.
   * Doing so negates the need to manually close the resource.
   *
   * ```ts
   * using file = await Deno.open("my_file.txt");
   * // do work with "file" object
   * ```
   *
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   *
   * @category I/O
   */
  export function close(rid: number): void

  /** The Deno abstraction for reading and writing files.
   *
   * This is the most straight forward way of handling files within Deno and is
   * recommended over using the discrete functions within the `Deno` namespace.
   *
   * ```ts
   * using file = await Deno.open("/foo/bar.txt", { read: true });
   * const fileInfo = await file.stat();
   * if (fileInfo.isFile) {
   *   const buf = new Uint8Array(100);
   *   const numberOfBytesRead = await file.read(buf); // 11 bytes
   *   const text = new TextDecoder().decode(buf);  // "hello world"
   * }
   * ```
   *
   * @category File System
   */
  export class FsFile
    implements Reader, ReaderSync, Writer, WriterSync, Seeker, SeekerSync, Closer, Disposable
  {
    /**
     * The resource ID associated with the file instance. The resource ID
     * should be considered an opaque reference to resource.
     *
     * @deprecated This will be removed in Deno 2.0. See the
     * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
     * for migration instructions.
     */
    readonly rid: number
    /** A {@linkcode ReadableStream} instance representing to the byte contents
     * of the file. This makes it easy to interoperate with other web streams
     * based APIs.
     *
     * ```ts
     * using file = await Deno.open("my_file.txt", { read: true });
     * const decoder = new TextDecoder();
     * for await (const chunk of file.readable) {
     *   console.log(decoder.decode(chunk));
     * }
     * ```
     */
    readonly readable: ReadableStream<Uint8Array>
    /** A {@linkcode WritableStream} instance to write the contents of the
     * file. This makes it easy to interoperate with other web streams based
     * APIs.
     *
     * ```ts
     * const items = ["hello", "world"];
     * using file = await Deno.open("my_file.txt", { write: true });
     * const encoder = new TextEncoder();
     * const writer = file.writable.getWriter();
     * for (const item of items) {
     *   await writer.write(encoder.encode(item));
     * }
     * ```
     */
    readonly writable: WritableStream<Uint8Array>
    /**
     * The constructor which takes a resource ID. Generally `FsFile` should
     * not be constructed directly. Instead use {@linkcode Deno.open} or
     * {@linkcode Deno.openSync} to create a new instance of `FsFile`.
     *
     * @deprecated This will be removed in Deno 2.0. See the
     * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
     * for migration instructions.
     */
    constructor(rid: number)
    /** Write the contents of the array buffer (`p`) to the file.
     *
     * Resolves to the number of bytes written.
     *
     * **It is not guaranteed that the full buffer will be written in a single
     * call.**
     *
     * ```ts
     * const encoder = new TextEncoder();
     * const data = encoder.encode("Hello world");
     * using file = await Deno.open("/foo/bar.txt", { write: true });
     * const bytesWritten = await file.write(data); // 11
     * ```
     *
     * @category I/O
     */
    write(p: Uint8Array): Promise<number>
    /** Synchronously write the contents of the array buffer (`p`) to the file.
     *
     * Returns the number of bytes written.
     *
     * **It is not guaranteed that the full buffer will be written in a single
     * call.**
     *
     * ```ts
     * const encoder = new TextEncoder();
     * const data = encoder.encode("Hello world");
     * using file = Deno.openSync("/foo/bar.txt", { write: true });
     * const bytesWritten = file.writeSync(data); // 11
     * ```
     */
    writeSync(p: Uint8Array): number
    /** Truncates (or extends) the file to reach the specified `len`. If `len`
     * is not specified, then the entire file contents are truncated.
     *
     * ### Truncate the entire file
     *
     * ```ts
     * using file = await Deno.open("my_file.txt", { write: true });
     * await file.truncate();
     * ```
     *
     * ### Truncate part of the file
     *
     * ```ts
     * // if "my_file.txt" contains the text "hello world":
     * using file = await Deno.open("my_file.txt", { write: true });
     * await file.truncate(7);
     * const buf = new Uint8Array(100);
     * await file.read(buf);
     * const text = new TextDecoder().decode(buf); // "hello w"
     * ```
     */
    truncate(len?: number): Promise<void>
    /** Synchronously truncates (or extends) the file to reach the specified
     * `len`. If `len` is not specified, then the entire file contents are
     * truncated.
     *
     * ### Truncate the entire file
     *
     * ```ts
     * using file = Deno.openSync("my_file.txt", { write: true });
     * file.truncateSync();
     * ```
     *
     * ### Truncate part of the file
     *
     * ```ts
     * // if "my_file.txt" contains the text "hello world":
     * using file = Deno.openSync("my_file.txt", { write: true });
     * file.truncateSync(7);
     * const buf = new Uint8Array(100);
     * file.readSync(buf);
     * const text = new TextDecoder().decode(buf); // "hello w"
     * ```
     */
    truncateSync(len?: number): void
    /** Read the file into an array buffer (`p`).
     *
     * Resolves to either the number of bytes read during the operation or EOF
     * (`null`) if there was nothing more to read.
     *
     * It is possible for a read to successfully return with `0` bytes. This
     * does not indicate EOF.
     *
     * **It is not guaranteed that the full buffer will be read in a single
     * call.**
     *
     * ```ts
     * // if "/foo/bar.txt" contains the text "hello world":
     * using file = await Deno.open("/foo/bar.txt");
     * const buf = new Uint8Array(100);
     * const numberOfBytesRead = await file.read(buf); // 11 bytes
     * const text = new TextDecoder().decode(buf);  // "hello world"
     * ```
     */
    read(p: Uint8Array): Promise<number | null>
    /** Synchronously read from the file into an array buffer (`p`).
     *
     * Returns either the number of bytes read during the operation or EOF
     * (`null`) if there was nothing more to read.
     *
     * It is possible for a read to successfully return with `0` bytes. This
     * does not indicate EOF.
     *
     * **It is not guaranteed that the full buffer will be read in a single
     * call.**
     *
     * ```ts
     * // if "/foo/bar.txt" contains the text "hello world":
     * using file = Deno.openSync("/foo/bar.txt");
     * const buf = new Uint8Array(100);
     * const numberOfBytesRead = file.readSync(buf); // 11 bytes
     * const text = new TextDecoder().decode(buf);  // "hello world"
     * ```
     */
    readSync(p: Uint8Array): number | null
    /** Seek to the given `offset` under mode given by `whence`. The call
     * resolves to the new position within the resource (bytes from the start).
     *
     * ```ts
     * // Given file pointing to file with "Hello world", which is 11 bytes long:
     * using file = await Deno.open(
     *   "hello.txt",
     *   { read: true, write: true, truncate: true, create: true },
     * );
     * await file.write(new TextEncoder().encode("Hello world"));
     *
     * // advance cursor 6 bytes
     * const cursorPosition = await file.seek(6, Deno.SeekMode.Start);
     * console.log(cursorPosition);  // 6
     * const buf = new Uint8Array(100);
     * await file.read(buf);
     * console.log(new TextDecoder().decode(buf)); // "world"
     * ```
     *
     * The seek modes work as follows:
     *
     * ```ts
     * // Given file.rid pointing to file with "Hello world", which is 11 bytes long:
     * const file = await Deno.open(
     *   "hello.txt",
     *   { read: true, write: true, truncate: true, create: true },
     * );
     * await file.write(new TextEncoder().encode("Hello world"));
     *
     * // Seek 6 bytes from the start of the file
     * console.log(await file.seek(6, Deno.SeekMode.Start)); // "6"
     * // Seek 2 more bytes from the current position
     * console.log(await file.seek(2, Deno.SeekMode.Current)); // "8"
     * // Seek backwards 2 bytes from the end of the file
     * console.log(await file.seek(-2, Deno.SeekMode.End)); // "9" (i.e. 11-2)
     * ```
     */
    seek(offset: number | bigint, whence: SeekMode): Promise<number>
    /** Synchronously seek to the given `offset` under mode given by `whence`.
     * The new position within the resource (bytes from the start) is returned.
     *
     * ```ts
     * using file = Deno.openSync(
     *   "hello.txt",
     *   { read: true, write: true, truncate: true, create: true },
     * );
     * file.writeSync(new TextEncoder().encode("Hello world"));
     *
     * // advance cursor 6 bytes
     * const cursorPosition = file.seekSync(6, Deno.SeekMode.Start);
     * console.log(cursorPosition);  // 6
     * const buf = new Uint8Array(100);
     * file.readSync(buf);
     * console.log(new TextDecoder().decode(buf)); // "world"
     * ```
     *
     * The seek modes work as follows:
     *
     * ```ts
     * // Given file.rid pointing to file with "Hello world", which is 11 bytes long:
     * using file = Deno.openSync(
     *   "hello.txt",
     *   { read: true, write: true, truncate: true, create: true },
     * );
     * file.writeSync(new TextEncoder().encode("Hello world"));
     *
     * // Seek 6 bytes from the start of the file
     * console.log(file.seekSync(6, Deno.SeekMode.Start)); // "6"
     * // Seek 2 more bytes from the current position
     * console.log(file.seekSync(2, Deno.SeekMode.Current)); // "8"
     * // Seek backwards 2 bytes from the end of the file
     * console.log(file.seekSync(-2, Deno.SeekMode.End)); // "9" (i.e. 11-2)
     * ```
     */
    seekSync(offset: number | bigint, whence: SeekMode): number
    /** Resolves to a {@linkcode Deno.FileInfo} for the file.
     *
     * ```ts
     * import { assert } from "jsr:@std/assert";
     *
     * using file = await Deno.open("hello.txt");
     * const fileInfo = await file.stat();
     * assert(fileInfo.isFile);
     * ```
     */
    stat(): Promise<FileInfo>
    /** Synchronously returns a {@linkcode Deno.FileInfo} for the file.
     *
     * ```ts
     * import { assert } from "jsr:@std/assert";
     *
     * using file = Deno.openSync("hello.txt")
     * const fileInfo = file.statSync();
     * assert(fileInfo.isFile);
     * ```
     */
    statSync(): FileInfo
    /**
     * Flushes any pending data and metadata operations of the given file
     * stream to disk.
     *
     * ```ts
     * const file = await Deno.open(
     *   "my_file.txt",
     *   { read: true, write: true, create: true },
     * );
     * await file.write(new TextEncoder().encode("Hello World"));
     * await file.truncate(1);
     * await file.sync();
     * console.log(await Deno.readTextFile("my_file.txt")); // H
     * ```
     *
     * @category I/O
     */
    sync(): Promise<void>
    /**
     * Synchronously flushes any pending data and metadata operations of the given
     * file stream to disk.
     *
     * ```ts
     * const file = Deno.openSync(
     *   "my_file.txt",
     *   { read: true, write: true, create: true },
     * );
     * file.writeSync(new TextEncoder().encode("Hello World"));
     * file.truncateSync(1);
     * file.syncSync();
     * console.log(Deno.readTextFileSync("my_file.txt")); // H
     * ```
     *
     * @category I/O
     */
    syncSync(): void
    /**
     * Flushes any pending data operations of the given file stream to disk.
     *  ```ts
     * using file = await Deno.open(
     *   "my_file.txt",
     *   { read: true, write: true, create: true },
     * );
     * await file.write(new TextEncoder().encode("Hello World"));
     * await file.syncData();
     * console.log(await Deno.readTextFile("my_file.txt")); // Hello World
     * ```
     *
     * @category I/O
     */
    syncData(): Promise<void>
    /**
     * Synchronously flushes any pending data operations of the given file stream
     * to disk.
     *
     *  ```ts
     * using file = Deno.openSync(
     *   "my_file.txt",
     *   { read: true, write: true, create: true },
     * );
     * file.writeSync(new TextEncoder().encode("Hello World"));
     * file.syncDataSync();
     * console.log(Deno.readTextFileSync("my_file.txt")); // Hello World
     * ```
     *
     * @category I/O
     */
    syncDataSync(): void
    /**
     * Changes the access (`atime`) and modification (`mtime`) times of the
     * file stream resource. Given times are either in seconds (UNIX epoch
     * time) or as `Date` objects.
     *
     * ```ts
     * using file = await Deno.open("file.txt", { create: true, write: true });
     * await file.utime(1556495550, new Date());
     * ```
     *
     * @category File System
     */
    utime(atime: number | Date, mtime: number | Date): Promise<void>
    /**
     * Synchronously changes the access (`atime`) and modification (`mtime`)
     * times of the file stream resource. Given times are either in seconds
     * (UNIX epoch time) or as `Date` objects.
     *
     * ```ts
     * using file = Deno.openSync("file.txt", { create: true, write: true });
     * file.utime(1556495550, new Date());
     * ```
     *
     * @category File System
     */
    utimeSync(atime: number | Date, mtime: number | Date): void
    /** **UNSTABLE**: New API, yet to be vetted.
     *
     * Checks if the file resource is a TTY (terminal).
     *
     * ```ts
     * // This example is system and context specific
     * using file = await Deno.open("/dev/tty6");
     * file.isTerminal(); // true
     * ```
     */
    isTerminal(): boolean
    /** **UNSTABLE**: New API, yet to be vetted.
     *
     * Set TTY to be under raw mode or not. In raw mode, characters are read and
     * returned as is, without being processed. All special processing of
     * characters by the terminal is disabled, including echoing input
     * characters. Reading from a TTY device in raw mode is faster than reading
     * from a TTY device in canonical mode.
     *
     * ```ts
     * using file = await Deno.open("/dev/tty6");
     * file.setRaw(true, { cbreak: true });
     * ```
     */
    setRaw(mode: boolean, options?: SetRawOptions): void
    /**
     * Acquire an advisory file-system lock for the file.
     *
     * @param [exclusive=false]
     */
    lock(exclusive?: boolean): Promise<void>
    /**
     * Synchronously acquire an advisory file-system lock synchronously for the file.
     *
     * @param [exclusive=false]
     */
    lockSync(exclusive?: boolean): void
    /**
     * Release an advisory file-system lock for the file.
     */
    unlock(): Promise<void>
    /**
     * Synchronously release an advisory file-system lock for the file.
     */
    unlockSync(): void
    /** Close the file. Closing a file when you are finished with it is
     * important to avoid leaking resources.
     *
     * ```ts
     * using file = await Deno.open("my_file.txt");
     * // do work with "file" object
     * ```
     */
    close(): void

    [Symbol.dispose](): void
  }

  /**
   * The Deno abstraction for reading and writing files.
   *
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   *
   * @category File System
   */
  export const File: typeof FsFile

  /** Gets the size of the console as columns/rows.
   *
   * ```ts
   * const { columns, rows } = Deno.consoleSize();
   * ```
   *
   * This returns the size of the console window as reported by the operating
   * system. It's not a reflection of how many characters will fit within the
   * console window, but can be used as part of that calculation.
   *
   * @category I/O
   */
  export function consoleSize(): {
    columns: number
    rows: number
  }

  /** @category I/O */
  export interface SetRawOptions {
    /**
     * The `cbreak` option can be used to indicate that characters that
     * correspond to a signal should still be generated. When disabling raw
     * mode, this option is ignored. This functionality currently only works on
     * Linux and Mac OS.
     */
    cbreak: boolean
  }

  /** A reference to `stdin` which can be used to read directly from `stdin`.
   * It implements the Deno specific {@linkcode Reader}, {@linkcode ReaderSync},
   * and {@linkcode Closer} interfaces as well as provides a
   * {@linkcode ReadableStream} interface.
   *
   * ### Reading chunks from the readable stream
   *
   * ```ts
   * const decoder = new TextDecoder();
   * for await (const chunk of Deno.stdin.readable) {
   *   const text = decoder.decode(chunk);
   *   // do something with the text
   * }
   * ```
   *
   * @category I/O
   */
  export const stdin: Reader &
    ReaderSync &
    Closer & {
      /**
       * The resource ID assigned to `stdin`. This can be used with the discrete
       * I/O functions in the `Deno` namespace.
       *
       * @deprecated This will be soft-removed in Deno 2.0. See the
       * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
       * for migration instructions.
       */
      readonly rid: number
      /** A readable stream interface to `stdin`. */
      readonly readable: ReadableStream<Uint8Array>
      /**
       * Set TTY to be under raw mode or not. In raw mode, characters are read and
       * returned as is, without being processed. All special processing of
       * characters by the terminal is disabled, including echoing input
       * characters. Reading from a TTY device in raw mode is faster than reading
       * from a TTY device in canonical mode.
       *
       * ```ts
       * Deno.stdin.setRaw(true, { cbreak: true });
       * ```
       *
       * @category I/O
       */
      setRaw(mode: boolean, options?: SetRawOptions): void
      /**
       * Checks if `stdin` is a TTY (terminal).
       *
       * ```ts
       * // This example is system and context specific
       * Deno.stdin.isTerminal(); // true
       * ```
       *
       * @category I/O
       */
      isTerminal(): boolean
    }
  /** A reference to `stdout` which can be used to write directly to `stdout`.
   * It implements the Deno specific {@linkcode Writer}, {@linkcode WriterSync},
   * and {@linkcode Closer} interfaces as well as provides a
   * {@linkcode WritableStream} interface.
   *
   * These are low level constructs, and the {@linkcode console} interface is a
   * more straight forward way to interact with `stdout` and `stderr`.
   *
   * @category I/O
   */
  export const stdout: Writer &
    WriterSync &
    Closer & {
      /**
       * The resource ID assigned to `stdout`. This can be used with the discrete
       * I/O functions in the `Deno` namespace.
       *
       * @deprecated This will be soft-removed in Deno 2.0. See the
       * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
       * for migration instructions.
       */
      readonly rid: number
      /** A writable stream interface to `stdout`. */
      readonly writable: WritableStream<Uint8Array>
      /**
       * Checks if `stdout` is a TTY (terminal).
       *
       * ```ts
       * // This example is system and context specific
       * Deno.stdout.isTerminal(); // true
       * ```
       *
       * @category I/O
       */
      isTerminal(): boolean
    }
  /** A reference to `stderr` which can be used to write directly to `stderr`.
   * It implements the Deno specific {@linkcode Writer}, {@linkcode WriterSync},
   * and {@linkcode Closer} interfaces as well as provides a
   * {@linkcode WritableStream} interface.
   *
   * These are low level constructs, and the {@linkcode console} interface is a
   * more straight forward way to interact with `stdout` and `stderr`.
   *
   * @category I/O
   */
  export const stderr: Writer &
    WriterSync &
    Closer & {
      /**
       * The resource ID assigned to `stderr`. This can be used with the discrete
       * I/O functions in the `Deno` namespace.
       *
       * @deprecated This will be soft-removed in Deno 2.0. See the
       * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
       * for migration instructions.
       */
      readonly rid: number
      /** A writable stream interface to `stderr`. */
      readonly writable: WritableStream<Uint8Array>
      /**
       * Checks if `stderr` is a TTY (terminal).
       *
       * ```ts
       * // This example is system and context specific
       * Deno.stderr.isTerminal(); // true
       * ```
       *
       * @category I/O
       */
      isTerminal(): boolean
    }

  /**
   * Options which can be set when doing {@linkcode Deno.open} and
   * {@linkcode Deno.openSync}.
   *
   * @category File System */
  export interface OpenOptions {
    /** Sets the option for read access. This option, when `true`, means that
     * the file should be read-able if opened.
     *
     * @default {true} */
    read?: boolean
    /** Sets the option for write access. This option, when `true`, means that
     * the file should be write-able if opened. If the file already exists,
     * any write calls on it will overwrite its contents, by default without
     * truncating it.
     *
     * @default {false} */
    write?: boolean
    /** Sets the option for the append mode. This option, when `true`, means
     * that writes will append to a file instead of overwriting previous
     * contents.
     *
     * Note that setting `{ write: true, append: true }` has the same effect as
     * setting only `{ append: true }`.
     *
     * @default {false} */
    append?: boolean
    /** Sets the option for truncating a previous file. If a file is
     * successfully opened with this option set it will truncate the file to `0`
     * size if it already exists. The file must be opened with write access
     * for truncate to work.
     *
     * @default {false} */
    truncate?: boolean
    /** Sets the option to allow creating a new file, if one doesn't already
     * exist at the specified path. Requires write or append access to be
     * used.
     *
     * @default {false} */
    create?: boolean
    /** If set to `true`, no file, directory, or symlink is allowed to exist at
     * the target location. Requires write or append access to be used. When
     * createNew is set to `true`, create and truncate are ignored.
     *
     * @default {false} */
    createNew?: boolean
    /** Permissions to use if creating the file (defaults to `0o666`, before
     * the process's umask).
     *
     * Ignored on Windows. */
    mode?: number
  }

  /**
   * Options which can be set when using {@linkcode Deno.readFile} or
   * {@linkcode Deno.readFileSync}.
   *
   * @category File System */
  export interface ReadFileOptions {
    /**
     * An abort signal to allow cancellation of the file read operation.
     * If the signal becomes aborted the readFile operation will be stopped
     * and the promise returned will be rejected with an AbortError.
     */
    signal?: AbortSignal
  }

  /**
   *  Check if a given resource id (`rid`) is a TTY (a terminal).
   *
   * ```ts
   * // This example is system and context specific
   * const nonTTYRid = Deno.openSync("my_file.txt").rid;
   * const ttyRid = Deno.openSync("/dev/tty6").rid;
   * console.log(Deno.isatty(nonTTYRid)); // false
   * console.log(Deno.isatty(ttyRid)); // true
   * ```
   *
   * @deprecated This will be soft-removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   *
   * @category I/O
   */
  export function isatty(rid: number): boolean

  /**
   * A variable-sized buffer of bytes with `read()` and `write()` methods.
   *
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   *
   * @category I/O
   */
  export class Buffer implements Reader, ReaderSync, Writer, WriterSync {
    constructor(ab?: ArrayBuffer)
    /** Returns a slice holding the unread portion of the buffer.
     *
     * The slice is valid for use only until the next buffer modification (that
     * is, only until the next call to a method like `read()`, `write()`,
     * `reset()`, or `truncate()`). If `options.copy` is false the slice aliases the buffer content at
     * least until the next buffer modification, so immediate changes to the
     * slice will affect the result of future reads.
     * @param options Defaults to `{ copy: true }`
     */
    bytes(options?: { copy?: boolean }): Uint8Array
    /** Returns whether the unread portion of the buffer is empty. */
    empty(): boolean
    /** A read only number of bytes of the unread portion of the buffer. */
    readonly length: number
    /** The read only capacity of the buffer's underlying byte slice, that is,
     * the total space allocated for the buffer's data. */
    readonly capacity: number
    /** Discards all but the first `n` unread bytes from the buffer but
     * continues to use the same allocated storage. It throws if `n` is
     * negative or greater than the length of the buffer. */
    truncate(n: number): void
    /** Resets the buffer to be empty, but it retains the underlying storage for
     * use by future writes. `.reset()` is the same as `.truncate(0)`. */
    reset(): void
    /** Reads the next `p.length` bytes from the buffer or until the buffer is
     * drained. Returns the number of bytes read. If the buffer has no data to
     * return, the return is EOF (`null`). */
    readSync(p: Uint8Array): number | null
    /** Reads the next `p.length` bytes from the buffer or until the buffer is
     * drained. Resolves to the number of bytes read. If the buffer has no
     * data to return, resolves to EOF (`null`).
     *
     * NOTE: This methods reads bytes synchronously; it's provided for
     * compatibility with `Reader` interfaces.
     */
    read(p: Uint8Array): Promise<number | null>
    writeSync(p: Uint8Array): number
    /** NOTE: This methods writes bytes synchronously; it's provided for
     * compatibility with `Writer` interface. */
    write(p: Uint8Array): Promise<number>
    /** Grows the buffer's capacity, if necessary, to guarantee space for
     * another `n` bytes. After `.grow(n)`, at least `n` bytes can be written to
     * the buffer without another allocation. If `n` is negative, `.grow()` will
     * throw. If the buffer can't grow it will throw an error.
     *
     * Based on Go Lang's
     * [Buffer.Grow](https://golang.org/pkg/bytes/#Buffer.Grow). */
    grow(n: number): void
    /** Reads data from `r` until EOF (`null`) and appends it to the buffer,
     * growing the buffer as needed. It resolves to the number of bytes read.
     * If the buffer becomes too large, `.readFrom()` will reject with an error.
     *
     * Based on Go Lang's
     * [Buffer.ReadFrom](https://golang.org/pkg/bytes/#Buffer.ReadFrom). */
    readFrom(r: Reader): Promise<number>
    /** Reads data from `r` until EOF (`null`) and appends it to the buffer,
     * growing the buffer as needed. It returns the number of bytes read. If the
     * buffer becomes too large, `.readFromSync()` will throw an error.
     *
     * Based on Go Lang's
     * [Buffer.ReadFrom](https://golang.org/pkg/bytes/#Buffer.ReadFrom). */
    readFromSync(r: ReaderSync): number
  }

  /**
   * Read Reader `r` until EOF (`null`) and resolve to the content as
   * Uint8Array`.
   *
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   *
   * @category I/O
   */
  export function readAll(r: Reader): Promise<Uint8Array>

  /**
   * Synchronously reads Reader `r` until EOF (`null`) and returns the content
   * as `Uint8Array`.
   *
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   *
   * @category I/O
   */
  export function readAllSync(r: ReaderSync): Uint8Array

  /**
   * Write all the content of the array buffer (`arr`) to the writer (`w`).
   *
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   *
   * @category I/O
   */
  export function writeAll(w: Writer, arr: Uint8Array): Promise<void>

  /**
   * Synchronously write all the content of the array buffer (`arr`) to the
   * writer (`w`).
   *
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   *
   * @category I/O
   */
  export function writeAllSync(w: WriterSync, arr: Uint8Array): void

  /**
   * Options which can be set when using {@linkcode Deno.mkdir} and
   * {@linkcode Deno.mkdirSync}.
   *
   * @category File System */
  export interface MkdirOptions {
    /** If set to `true`, means that any intermediate directories will also be
     * created (as with the shell command `mkdir -p`).
     *
     * Intermediate directories are created with the same permissions.
     *
     * When recursive is set to `true`, succeeds silently (without changing any
     * permissions) if a directory already exists at the path, or if the path
     * is a symlink to an existing directory.
     *
     * @default {false} */
    recursive?: boolean
    /** Permissions to use when creating the directory (defaults to `0o777`,
     * before the process's umask).
     *
     * Ignored on Windows. */
    mode?: number
  }

  /** Creates a new directory with the specified path.
   *
   * ```ts
   * await Deno.mkdir("new_dir");
   * await Deno.mkdir("nested/directories", { recursive: true });
   * await Deno.mkdir("restricted_access_dir", { mode: 0o700 });
   * ```
   *
   * Defaults to throwing error if the directory already exists.
   *
   * Requires `allow-write` permission.
   *
   * @tags allow-write
   * @category File System
   */
  export function mkdir(path: string | URL, options?: MkdirOptions): Promise<void>

  /** Synchronously creates a new directory with the specified path.
   *
   * ```ts
   * Deno.mkdirSync("new_dir");
   * Deno.mkdirSync("nested/directories", { recursive: true });
   * Deno.mkdirSync("restricted_access_dir", { mode: 0o700 });
   * ```
   *
   * Defaults to throwing error if the directory already exists.
   *
   * Requires `allow-write` permission.
   *
   * @tags allow-write
   * @category File System
   */
  export function mkdirSync(path: string | URL, options?: MkdirOptions): void

  /**
   * Options which can be set when using {@linkcode Deno.makeTempDir},
   * {@linkcode Deno.makeTempDirSync}, {@linkcode Deno.makeTempFile}, and
   * {@linkcode Deno.makeTempFileSync}.
   *
   * @category File System */
  export interface MakeTempOptions {
    /** Directory where the temporary directory should be created (defaults to
     * the env variable `TMPDIR`, or the system's default, usually `/tmp`).
     *
     * Note that if the passed `dir` is relative, the path returned by
     * `makeTempFile()` and `makeTempDir()` will also be relative. Be mindful of
     * this when changing working directory. */
    dir?: string
    /** String that should precede the random portion of the temporary
     * directory's name. */
    prefix?: string
    /** String that should follow the random portion of the temporary
     * directory's name. */
    suffix?: string
  }

  /** Creates a new temporary directory in the default directory for temporary
   * files, unless `dir` is specified. Other optional options include
   * prefixing and suffixing the directory name with `prefix` and `suffix`
   * respectively.
   *
   * This call resolves to the full path to the newly created directory.
   *
   * Multiple programs calling this function simultaneously will create different
   * directories. It is the caller's responsibility to remove the directory when
   * no longer needed.
   *
   * ```ts
   * const tempDirName0 = await Deno.makeTempDir();  // e.g. /tmp/2894ea76
   * const tempDirName1 = await Deno.makeTempDir({ prefix: 'my_temp' }); // e.g. /tmp/my_temp339c944d
   * ```
   *
   * Requires `allow-write` permission.
   *
   * @tags allow-write
   * @category File System
   */
  // TODO(ry) Doesn't check permissions.
  export function makeTempDir(options?: MakeTempOptions): Promise<string>

  /** Synchronously creates a new temporary directory in the default directory
   * for temporary files, unless `dir` is specified. Other optional options
   * include prefixing and suffixing the directory name with `prefix` and
   * `suffix` respectively.
   *
   * The full path to the newly created directory is returned.
   *
   * Multiple programs calling this function simultaneously will create different
   * directories. It is the caller's responsibility to remove the directory when
   * no longer needed.
   *
   * ```ts
   * const tempDirName0 = Deno.makeTempDirSync();  // e.g. /tmp/2894ea76
   * const tempDirName1 = Deno.makeTempDirSync({ prefix: 'my_temp' });  // e.g. /tmp/my_temp339c944d
   * ```
   *
   * Requires `allow-write` permission.
   *
   * @tags allow-write
   * @category File System
   */
  // TODO(ry) Doesn't check permissions.
  export function makeTempDirSync(options?: MakeTempOptions): string

  /** Creates a new temporary file in the default directory for temporary
   * files, unless `dir` is specified.
   *
   * Other options include prefixing and suffixing the directory name with
   * `prefix` and `suffix` respectively.
   *
   * This call resolves to the full path to the newly created file.
   *
   * Multiple programs calling this function simultaneously will create
   * different files. It is the caller's responsibility to remove the file when
   * no longer needed.
   *
   * ```ts
   * const tmpFileName0 = await Deno.makeTempFile();  // e.g. /tmp/419e0bf2
   * const tmpFileName1 = await Deno.makeTempFile({ prefix: 'my_temp' });  // e.g. /tmp/my_temp754d3098
   * ```
   *
   * Requires `allow-write` permission.
   *
   * @tags allow-write
   * @category File System
   */
  export function makeTempFile(options?: MakeTempOptions): Promise<string>

  /** Synchronously creates a new temporary file in the default directory for
   * temporary files, unless `dir` is specified.
   *
   * Other options include prefixing and suffixing the directory name with
   * `prefix` and `suffix` respectively.
   *
   * The full path to the newly created file is returned.
   *
   * Multiple programs calling this function simultaneously will create
   * different files. It is the caller's responsibility to remove the file when
   * no longer needed.
   *
   * ```ts
   * const tempFileName0 = Deno.makeTempFileSync(); // e.g. /tmp/419e0bf2
   * const tempFileName1 = Deno.makeTempFileSync({ prefix: 'my_temp' });  // e.g. /tmp/my_temp754d3098
   * ```
   *
   * Requires `allow-write` permission.
   *
   * @tags allow-write
   * @category File System
   */
  export function makeTempFileSync(options?: MakeTempOptions): string

  /** Changes the permission of a specific file/directory of specified path.
   * Ignores the process's umask.
   *
   * ```ts
   * await Deno.chmod("/path/to/file", 0o666);
   * ```
   *
   * The mode is a sequence of 3 octal numbers. The first/left-most number
   * specifies the permissions for the owner. The second number specifies the
   * permissions for the group. The last/right-most number specifies the
   * permissions for others. For example, with a mode of 0o764, the owner (7)
   * can read/write/execute, the group (6) can read/write and everyone else (4)
   * can read only.
   *
   * | Number | Description |
   * | ------ | ----------- |
   * | 7      | read, write, and execute |
   * | 6      | read and write |
   * | 5      | read and execute |
   * | 4      | read only |
   * | 3      | write and execute |
   * | 2      | write only |
   * | 1      | execute only |
   * | 0      | no permission |
   *
   * NOTE: This API currently throws on Windows
   *
   * Requires `allow-write` permission.
   *
   * @tags allow-write
   * @category File System
   */
  export function chmod(path: string | URL, mode: number): Promise<void>

  /** Synchronously changes the permission of a specific file/directory of
   * specified path. Ignores the process's umask.
   *
   * ```ts
   * Deno.chmodSync("/path/to/file", 0o666);
   * ```
   *
   * For a full description, see {@linkcode Deno.chmod}.
   *
   * NOTE: This API currently throws on Windows
   *
   * Requires `allow-write` permission.
   *
   * @tags allow-write
   * @category File System
   */
  export function chmodSync(path: string | URL, mode: number): void

  /** Change owner of a regular file or directory.
   *
   * This functionality is not available on Windows.
   *
   * ```ts
   * await Deno.chown("myFile.txt", 1000, 1002);
   * ```
   *
   * Requires `allow-write` permission.
   *
   * Throws Error (not implemented) if executed on Windows.
   *
   * @tags allow-write
   * @category File System
   *
   * @param path path to the file
   * @param uid user id (UID) of the new owner, or `null` for no change
   * @param gid group id (GID) of the new owner, or `null` for no change
   */
  export function chown(path: string | URL, uid: number | null, gid: number | null): Promise<void>

  /** Synchronously change owner of a regular file or directory.
   *
   * This functionality is not available on Windows.
   *
   * ```ts
   * Deno.chownSync("myFile.txt", 1000, 1002);
   * ```
   *
   * Requires `allow-write` permission.
   *
   * Throws Error (not implemented) if executed on Windows.
   *
   * @tags allow-write
   * @category File System
   *
   * @param path path to the file
   * @param uid user id (UID) of the new owner, or `null` for no change
   * @param gid group id (GID) of the new owner, or `null` for no change
   */
  export function chownSync(path: string | URL, uid: number | null, gid: number | null): void

  /**
   * Options which can be set when using {@linkcode Deno.remove} and
   * {@linkcode Deno.removeSync}.
   *
   * @category File System */
  export interface RemoveOptions {
    /** If set to `true`, path will be removed even if it's a non-empty directory.
     *
     * @default {false} */
    recursive?: boolean
  }

  /** Removes the named file or directory.
   *
   * ```ts
   * await Deno.remove("/path/to/empty_dir/or/file");
   * await Deno.remove("/path/to/populated_dir/or/file", { recursive: true });
   * ```
   *
   * Throws error if permission denied, path not found, or path is a non-empty
   * directory and the `recursive` option isn't set to `true`.
   *
   * Requires `allow-write` permission.
   *
   * @tags allow-write
   * @category File System
   */
  export function remove(path: string | URL, options?: RemoveOptions): Promise<void>

  /** Synchronously removes the named file or directory.
   *
   * ```ts
   * Deno.removeSync("/path/to/empty_dir/or/file");
   * Deno.removeSync("/path/to/populated_dir/or/file", { recursive: true });
   * ```
   *
   * Throws error if permission denied, path not found, or path is a non-empty
   * directory and the `recursive` option isn't set to `true`.
   *
   * Requires `allow-write` permission.
   *
   * @tags allow-write
   * @category File System
   */
  export function removeSync(path: string | URL, options?: RemoveOptions): void

  /** Synchronously renames (moves) `oldpath` to `newpath`. Paths may be files or
   * directories. If `newpath` already exists and is not a directory,
   * `renameSync()` replaces it. OS-specific restrictions may apply when
   * `oldpath` and `newpath` are in different directories.
   *
   * ```ts
   * Deno.renameSync("old/path", "new/path");
   * ```
   *
   * On Unix-like OSes, this operation does not follow symlinks at either path.
   *
   * It varies between platforms when the operation throws errors, and if so what
   * they are. It's always an error to rename anything to a non-empty directory.
   *
   * Requires `allow-read` and `allow-write` permissions.
   *
   * @tags allow-read, allow-write
   * @category File System
   */
  export function renameSync(oldpath: string | URL, newpath: string | URL): void

  /** Renames (moves) `oldpath` to `newpath`. Paths may be files or directories.
   * If `newpath` already exists and is not a directory, `rename()` replaces it.
   * OS-specific restrictions may apply when `oldpath` and `newpath` are in
   * different directories.
   *
   * ```ts
   * await Deno.rename("old/path", "new/path");
   * ```
   *
   * On Unix-like OSes, this operation does not follow symlinks at either path.
   *
   * It varies between platforms when the operation throws errors, and if so
   * what they are. It's always an error to rename anything to a non-empty
   * directory.
   *
   * Requires `allow-read` and `allow-write` permissions.
   *
   * @tags allow-read, allow-write
   * @category File System
   */
  export function rename(oldpath: string | URL, newpath: string | URL): Promise<void>

  /** Asynchronously reads and returns the entire contents of a file as an UTF-8
   *  decoded string. Reading a directory throws an error.
   *
   * ```ts
   * const data = await Deno.readTextFile("hello.txt");
   * console.log(data);
   * ```
   *
   * Requires `allow-read` permission.
   *
   * @tags allow-read
   * @category File System
   */
  export function readTextFile(path: string | URL, options?: ReadFileOptions): Promise<string>

  /** Synchronously reads and returns the entire contents of a file as an UTF-8
   *  decoded string. Reading a directory throws an error.
   *
   * ```ts
   * const data = Deno.readTextFileSync("hello.txt");
   * console.log(data);
   * ```
   *
   * Requires `allow-read` permission.
   *
   * @tags allow-read
   * @category File System
   */
  export function readTextFileSync(path: string | URL): string

  /** Reads and resolves to the entire contents of a file as an array of bytes.
   * `TextDecoder` can be used to transform the bytes to string if required.
   * Reading a directory returns an empty data array.
   *
   * ```ts
   * const decoder = new TextDecoder("utf-8");
   * const data = await Deno.readFile("hello.txt");
   * console.log(decoder.decode(data));
   * ```
   *
   * Requires `allow-read` permission.
   *
   * @tags allow-read
   * @category File System
   */
  export function readFile(path: string | URL, options?: ReadFileOptions): Promise<Uint8Array>

  /** Synchronously reads and returns the entire contents of a file as an array
   * of bytes. `TextDecoder` can be used to transform the bytes to string if
   * required. Reading a directory returns an empty data array.
   *
   * ```ts
   * const decoder = new TextDecoder("utf-8");
   * const data = Deno.readFileSync("hello.txt");
   * console.log(decoder.decode(data));
   * ```
   *
   * Requires `allow-read` permission.
   *
   * @tags allow-read
   * @category File System
   */
  export function readFileSync(path: string | URL): Uint8Array

  /** Provides information about a file and is returned by
   * {@linkcode Deno.stat}, {@linkcode Deno.lstat}, {@linkcode Deno.statSync},
   * and {@linkcode Deno.lstatSync} or from calling `stat()` and `statSync()`
   * on an {@linkcode Deno.FsFile} instance.
   *
   * @category File System
   */
  export interface FileInfo {
    /** True if this is info for a regular file. Mutually exclusive to
     * `FileInfo.isDirectory` and `FileInfo.isSymlink`. */
    isFile: boolean
    /** True if this is info for a regular directory. Mutually exclusive to
     * `FileInfo.isFile` and `FileInfo.isSymlink`. */
    isDirectory: boolean
    /** True if this is info for a symlink. Mutually exclusive to
     * `FileInfo.isFile` and `FileInfo.isDirectory`. */
    isSymlink: boolean
    /** The size of the file, in bytes. */
    size: number
    /** The last modification time of the file. This corresponds to the `mtime`
     * field from `stat` on Linux/Mac OS and `ftLastWriteTime` on Windows. This
     * may not be available on all platforms. */
    mtime: Date | null
    /** The last access time of the file. This corresponds to the `atime`
     * field from `stat` on Unix and `ftLastAccessTime` on Windows. This may not
     * be available on all platforms. */
    atime: Date | null
    /** The creation time of the file. This corresponds to the `birthtime`
     * field from `stat` on Mac/BSD and `ftCreationTime` on Windows. This may
     * not be available on all platforms. */
    birthtime: Date | null
    /** ID of the device containing the file. */
    dev: number
    /** Inode number.
     *
     * _Linux/Mac OS only._ */
    ino: number | null
    /** The underlying raw `st_mode` bits that contain the standard Unix
     * permissions for this file/directory.
     *
     * _Linux/Mac OS only._ */
    mode: number | null
    /** Number of hard links pointing to this file.
     *
     * _Linux/Mac OS only._ */
    nlink: number | null
    /** User ID of the owner of this file.
     *
     * _Linux/Mac OS only._ */
    uid: number | null
    /** Group ID of the owner of this file.
     *
     * _Linux/Mac OS only._ */
    gid: number | null
    /** Device ID of this file.
     *
     * _Linux/Mac OS only._ */
    rdev: number | null
    /** Blocksize for filesystem I/O.
     *
     * _Linux/Mac OS only._ */
    blksize: number | null
    /** Number of blocks allocated to the file, in 512-byte units.
     *
     * _Linux/Mac OS only._ */
    blocks: number | null
    /**  True if this is info for a block device.
     *
     * _Linux/Mac OS only._ */
    isBlockDevice: boolean | null
    /**  True if this is info for a char device.
     *
     * _Linux/Mac OS only._ */
    isCharDevice: boolean | null
    /**  True if this is info for a fifo.
     *
     * _Linux/Mac OS only._ */
    isFifo: boolean | null
    /**  True if this is info for a socket.
     *
     * _Linux/Mac OS only._ */
    isSocket: boolean | null
  }

  /** Resolves to the absolute normalized path, with symbolic links resolved.
   *
   * ```ts
   * // e.g. given /home/alice/file.txt and current directory /home/alice
   * await Deno.symlink("file.txt", "symlink_file.txt");
   * const realPath = await Deno.realPath("./file.txt");
   * const realSymLinkPath = await Deno.realPath("./symlink_file.txt");
   * console.log(realPath);  // outputs "/home/alice/file.txt"
   * console.log(realSymLinkPath);  // outputs "/home/alice/file.txt"
   * ```
   *
   * Requires `allow-read` permission for the target path.
   *
   * Also requires `allow-read` permission for the `CWD` if the target path is
   * relative.
   *
   * @tags allow-read
   * @category File System
   */
  export function realPath(path: string | URL): Promise<string>

  /** Synchronously returns absolute normalized path, with symbolic links
   * resolved.
   *
   * ```ts
   * // e.g. given /home/alice/file.txt and current directory /home/alice
   * Deno.symlinkSync("file.txt", "symlink_file.txt");
   * const realPath = Deno.realPathSync("./file.txt");
   * const realSymLinkPath = Deno.realPathSync("./symlink_file.txt");
   * console.log(realPath);  // outputs "/home/alice/file.txt"
   * console.log(realSymLinkPath);  // outputs "/home/alice/file.txt"
   * ```
   *
   * Requires `allow-read` permission for the target path.
   *
   * Also requires `allow-read` permission for the `CWD` if the target path is
   * relative.
   *
   * @tags allow-read
   * @category File System
   */
  export function realPathSync(path: string | URL): string

  /**
   * Information about a directory entry returned from {@linkcode Deno.readDir}
   * and {@linkcode Deno.readDirSync}.
   *
   * @category File System */
  export interface DirEntry {
    /** The file name of the entry. It is just the entity name and does not
     * include the full path. */
    name: string
    /** True if this is info for a regular file. Mutually exclusive to
     * `DirEntry.isDirectory` and `DirEntry.isSymlink`. */
    isFile: boolean
    /** True if this is info for a regular directory. Mutually exclusive to
     * `DirEntry.isFile` and `DirEntry.isSymlink`. */
    isDirectory: boolean
    /** True if this is info for a symlink. Mutually exclusive to
     * `DirEntry.isFile` and `DirEntry.isDirectory`. */
    isSymlink: boolean
  }

  /** Reads the directory given by `path` and returns an async iterable of
   * {@linkcode Deno.DirEntry}. The order of entries is not guaranteed.
   *
   * ```ts
   * for await (const dirEntry of Deno.readDir("/")) {
   *   console.log(dirEntry.name);
   * }
   * ```
   *
   * Throws error if `path` is not a directory.
   *
   * Requires `allow-read` permission.
   *
   * @tags allow-read
   * @category File System
   */
  export function readDir(path: string | URL): AsyncIterable<DirEntry>

  /** Synchronously reads the directory given by `path` and returns an iterable
   * of {@linkcode Deno.DirEntry}. The order of entries is not guaranteed.
   *
   * ```ts
   * for (const dirEntry of Deno.readDirSync("/")) {
   *   console.log(dirEntry.name);
   * }
   * ```
   *
   * Throws error if `path` is not a directory.
   *
   * Requires `allow-read` permission.
   *
   * @tags allow-read
   * @category File System
   */
  export function readDirSync(path: string | URL): Iterable<DirEntry>

  /** Copies the contents and permissions of one file to another specified path,
   * by default creating a new file if needed, else overwriting. Fails if target
   * path is a directory or is unwritable.
   *
   * ```ts
   * await Deno.copyFile("from.txt", "to.txt");
   * ```
   *
   * Requires `allow-read` permission on `fromPath`.
   *
   * Requires `allow-write` permission on `toPath`.
   *
   * @tags allow-read, allow-write
   * @category File System
   */
  export function copyFile(fromPath: string | URL, toPath: string | URL): Promise<void>

  /** Synchronously copies the contents and permissions of one file to another
   * specified path, by default creating a new file if needed, else overwriting.
   * Fails if target path is a directory or is unwritable.
   *
   * ```ts
   * Deno.copyFileSync("from.txt", "to.txt");
   * ```
   *
   * Requires `allow-read` permission on `fromPath`.
   *
   * Requires `allow-write` permission on `toPath`.
   *
   * @tags allow-read, allow-write
   * @category File System
   */
  export function copyFileSync(fromPath: string | URL, toPath: string | URL): void

  /** Resolves to the full path destination of the named symbolic link.
   *
   * ```ts
   * await Deno.symlink("./test.txt", "./test_link.txt");
   * const target = await Deno.readLink("./test_link.txt"); // full path of ./test.txt
   * ```
   *
   * Throws TypeError if called with a hard link.
   *
   * Requires `allow-read` permission.
   *
   * @tags allow-read
   * @category File System
   */
  export function readLink(path: string | URL): Promise<string>

  /** Synchronously returns the full path destination of the named symbolic
   * link.
   *
   * ```ts
   * Deno.symlinkSync("./test.txt", "./test_link.txt");
   * const target = Deno.readLinkSync("./test_link.txt"); // full path of ./test.txt
   * ```
   *
   * Throws TypeError if called with a hard link.
   *
   * Requires `allow-read` permission.
   *
   * @tags allow-read
   * @category File System
   */
  export function readLinkSync(path: string | URL): string

  /** Resolves to a {@linkcode Deno.FileInfo} for the specified `path`. If
   * `path` is a symlink, information for the symlink will be returned instead
   * of what it points to.
   *
   * ```ts
   * import { assert } from "jsr:@std/assert";
   * const fileInfo = await Deno.lstat("hello.txt");
   * assert(fileInfo.isFile);
   * ```
   *
   * Requires `allow-read` permission.
   *
   * @tags allow-read
   * @category File System
   */
  export function lstat(path: string | URL): Promise<FileInfo>

  /** Synchronously returns a {@linkcode Deno.FileInfo} for the specified
   * `path`. If `path` is a symlink, information for the symlink will be
   * returned instead of what it points to.
   *
   * ```ts
   * import { assert } from "jsr:@std/assert";
   * const fileInfo = Deno.lstatSync("hello.txt");
   * assert(fileInfo.isFile);
   * ```
   *
   * Requires `allow-read` permission.
   *
   * @tags allow-read
   * @category File System
   */
  export function lstatSync(path: string | URL): FileInfo

  /** Resolves to a {@linkcode Deno.FileInfo} for the specified `path`. Will
   * always follow symlinks.
   *
   * ```ts
   * import { assert } from "jsr:@std/assert";
   * const fileInfo = await Deno.stat("hello.txt");
   * assert(fileInfo.isFile);
   * ```
   *
   * Requires `allow-read` permission.
   *
   * @tags allow-read
   * @category File System
   */
  export function stat(path: string | URL): Promise<FileInfo>

  /** Synchronously returns a {@linkcode Deno.FileInfo} for the specified
   * `path`. Will always follow symlinks.
   *
   * ```ts
   * import { assert } from "jsr:@std/assert";
   * const fileInfo = Deno.statSync("hello.txt");
   * assert(fileInfo.isFile);
   * ```
   *
   * Requires `allow-read` permission.
   *
   * @tags allow-read
   * @category File System
   */
  export function statSync(path: string | URL): FileInfo

  /** Options for writing to a file.
   *
   * @category File System
   */
  export interface WriteFileOptions {
    /** If set to `true`, will append to a file instead of overwriting previous
     * contents.
     *
     * @default {false} */
    append?: boolean
    /** Sets the option to allow creating a new file, if one doesn't already
     * exist at the specified path.
     *
     * @default {true} */
    create?: boolean
    /** If set to `true`, no file, directory, or symlink is allowed to exist at
     * the target location. When createNew is set to `true`, `create` is ignored.
     *
     * @default {false} */
    createNew?: boolean
    /** Permissions always applied to file. */
    mode?: number
    /** An abort signal to allow cancellation of the file write operation.
     *
     * If the signal becomes aborted the write file operation will be stopped
     * and the promise returned will be rejected with an {@linkcode AbortError}.
     */
    signal?: AbortSignal
  }

  /** Write `data` to the given `path`, by default creating a new file if
   * needed, else overwriting.
   *
   * ```ts
   * const encoder = new TextEncoder();
   * const data = encoder.encode("Hello world\n");
   * await Deno.writeFile("hello1.txt", data);  // overwrite "hello1.txt" or create it
   * await Deno.writeFile("hello2.txt", data, { create: false });  // only works if "hello2.txt" exists
   * await Deno.writeFile("hello3.txt", data, { mode: 0o777 });  // set permissions on new file
   * await Deno.writeFile("hello4.txt", data, { append: true });  // add data to the end of the file
   * ```
   *
   * Requires `allow-write` permission, and `allow-read` if `options.create` is
   * `false`.
   *
   * @tags allow-read, allow-write
   * @category File System
   */
  export function writeFile(
    path: string | URL,
    data: Uint8Array | ReadableStream<Uint8Array>,
    options?: WriteFileOptions
  ): Promise<void>

  /** Synchronously write `data` to the given `path`, by default creating a new
   * file if needed, else overwriting.
   *
   * ```ts
   * const encoder = new TextEncoder();
   * const data = encoder.encode("Hello world\n");
   * Deno.writeFileSync("hello1.txt", data);  // overwrite "hello1.txt" or create it
   * Deno.writeFileSync("hello2.txt", data, { create: false });  // only works if "hello2.txt" exists
   * Deno.writeFileSync("hello3.txt", data, { mode: 0o777 });  // set permissions on new file
   * Deno.writeFileSync("hello4.txt", data, { append: true });  // add data to the end of the file
   * ```
   *
   * Requires `allow-write` permission, and `allow-read` if `options.create` is
   * `false`.
   *
   * @tags allow-read, allow-write
   * @category File System
   */
  export function writeFileSync(
    path: string | URL,
    data: Uint8Array,
    options?: WriteFileOptions
  ): void

  /** Write string `data` to the given `path`, by default creating a new file if
   * needed, else overwriting.
   *
   * ```ts
   * await Deno.writeTextFile("hello1.txt", "Hello world\n");  // overwrite "hello1.txt" or create it
   * ```
   *
   * Requires `allow-write` permission, and `allow-read` if `options.create` is
   * `false`.
   *
   * @tags allow-read, allow-write
   * @category File System
   */
  export function writeTextFile(
    path: string | URL,
    data: string | ReadableStream<string>,
    options?: WriteFileOptions
  ): Promise<void>

  /** Synchronously write string `data` to the given `path`, by default creating
   * a new file if needed, else overwriting.
   *
   * ```ts
   * Deno.writeTextFileSync("hello1.txt", "Hello world\n");  // overwrite "hello1.txt" or create it
   * ```
   *
   * Requires `allow-write` permission, and `allow-read` if `options.create` is
   * `false`.
   *
   * @tags allow-read, allow-write
   * @category File System
   */
  export function writeTextFileSync(
    path: string | URL,
    data: string,
    options?: WriteFileOptions
  ): void

  /** Truncates (or extends) the specified file, to reach the specified `len`.
   * If `len` is not specified then the entire file contents are truncated.
   *
   * ### Truncate the entire file
   * ```ts
   * await Deno.truncate("my_file.txt");
   * ```
   *
   * ### Truncate part of the file
   *
   * ```ts
   * const file = await Deno.makeTempFile();
   * await Deno.writeTextFile(file, "Hello World");
   * await Deno.truncate(file, 7);
   * const data = await Deno.readFile(file);
   * console.log(new TextDecoder().decode(data));  // "Hello W"
   * ```
   *
   * Requires `allow-write` permission.
   *
   * @tags allow-write
   * @category File System
   */
  export function truncate(name: string, len?: number): Promise<void>

  /** Synchronously truncates (or extends) the specified file, to reach the
   * specified `len`. If `len` is not specified then the entire file contents
   * are truncated.
   *
   * ### Truncate the entire file
   *
   * ```ts
   * Deno.truncateSync("my_file.txt");
   * ```
   *
   * ### Truncate part of the file
   *
   * ```ts
   * const file = Deno.makeTempFileSync();
   * Deno.writeFileSync(file, new TextEncoder().encode("Hello World"));
   * Deno.truncateSync(file, 7);
   * const data = Deno.readFileSync(file);
   * console.log(new TextDecoder().decode(data));
   * ```
   *
   * Requires `allow-write` permission.
   *
   * @tags allow-write
   * @category File System
   */
  export function truncateSync(name: string, len?: number): void

  /** @category Runtime
   *
   * @deprecated This will be removed in Deno 2.0.
   */
  export interface OpMetrics {
    opsDispatched: number
    opsDispatchedSync: number
    opsDispatchedAsync: number
    opsDispatchedAsyncUnref: number
    opsCompleted: number
    opsCompletedSync: number
    opsCompletedAsync: number
    opsCompletedAsyncUnref: number
    bytesSentControl: number
    bytesSentData: number
    bytesReceived: number
  }

  /** @category Runtime
   *
   * @deprecated This will be removed in Deno 2.0.
   */
  export interface Metrics extends OpMetrics {
    ops: Record<string, OpMetrics>
  }

  /** Receive metrics from the privileged side of Deno. This is primarily used
   * in the development of Deno. _Ops_, also called _bindings_, are the
   * go-between between Deno JavaScript sandbox and the rest of Deno.
   *
   * ```shell
   * > console.table(Deno.metrics())
   * ┌─────────────────────────┬────────┐
   * │         (index)         │ Values │
   * ├─────────────────────────┼────────┤
   * │      opsDispatched      │   3    │
   * │    opsDispatchedSync    │   2    │
   * │   opsDispatchedAsync    │   1    │
   * │ opsDispatchedAsyncUnref │   0    │
   * │      opsCompleted       │   3    │
   * │    opsCompletedSync     │   2    │
   * │    opsCompletedAsync    │   1    │
   * │ opsCompletedAsyncUnref  │   0    │
   * │    bytesSentControl     │   73   │
   * │      bytesSentData      │   0    │
   * │      bytesReceived      │  375   │
   * └─────────────────────────┴────────┘
   * ```
   *
   * @category Runtime
   *
   * @deprecated This will be removed in Deno 2.0.
   */
  export function metrics(): Metrics

  /**
   * A map of open resources that Deno is tracking. The key is the resource ID
   * (_rid_) and the value is its representation.
   *
   * @deprecated This will be removed in Deno 2.0.
   *
   * @category Runtime */
  export interface ResourceMap {
    [rid: number]: unknown
  }

  /** Returns a map of open resource IDs (_rid_) along with their string
   * representations. This is an internal API and as such resource
   * representation has `unknown` type; that means it can change any time and
   * should not be depended upon.
   *
   * ```ts
   * console.log(Deno.resources());
   * // { 0: "stdin", 1: "stdout", 2: "stderr" }
   * Deno.openSync('../test.file');
   * console.log(Deno.resources());
   * // { 0: "stdin", 1: "stdout", 2: "stderr", 3: "fsFile" }
   * ```
   *
   * @deprecated This will be removed in Deno 2.0.
   *
   * @category Runtime
   */
  export function resources(): ResourceMap

  /**
   * Additional information for FsEvent objects with the "other" kind.
   *
   * - `"rescan"`: rescan notices indicate either a lapse in the events or a
   *    change in the filesystem such that events received so far can no longer
   *    be relied on to represent the state of the filesystem now. An
   *    application that simply reacts to file changes may not care about this.
   *    An application that keeps an in-memory representation of the filesystem
   *    will need to care, and will need to refresh that representation directly
   *    from the filesystem.
   *
   * @category File System
   */
  export type FsEventFlag = 'rescan'

  /**
   * Represents a unique file system event yielded by a
   * {@linkcode Deno.FsWatcher}.
   *
   * @category File System */
  export interface FsEvent {
    /** The kind/type of the file system event. */
    kind: 'any' | 'access' | 'create' | 'modify' | 'remove' | 'other'
    /** An array of paths that are associated with the file system event. */
    paths: string[]
    /** Any additional flags associated with the event. */
    flag?: FsEventFlag
  }

  /**
   * Returned by {@linkcode Deno.watchFs}. It is an async iterator yielding up
   * system events. To stop watching the file system by calling `.close()`
   * method.
   *
   * @category File System
   */
  export interface FsWatcher extends AsyncIterable<FsEvent>, Disposable {
    /**
     * The resource id.
     *
     * @deprecated This will be removed in Deno 2.0. See the
     * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
     * for migration instructions.
     */
    readonly rid: number
    /** Stops watching the file system and closes the watcher resource. */
    close(): void
    /**
     * Stops watching the file system and closes the watcher resource.
     *
     * @deprecated This will be removed in Deno 2.0. See the
     * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
     * for migration instructions.
     */
    return?(value?: any): Promise<IteratorResult<FsEvent>>
    [Symbol.asyncIterator](): AsyncIterableIterator<FsEvent>
  }

  /** Watch for file system events against one or more `paths`, which can be
   * files or directories. These paths must exist already. One user action (e.g.
   * `touch test.file`) can generate multiple file system events. Likewise,
   * one user action can result in multiple file paths in one event (e.g. `mv
   * old_name.txt new_name.txt`).
   *
   * The recursive option is `true` by default and, for directories, will watch
   * the specified directory and all sub directories.
   *
   * Note that the exact ordering of the events can vary between operating
   * systems.
   *
   * ```ts
   * const watcher = Deno.watchFs("/");
   * for await (const event of watcher) {
   *    console.log(">>>> event", event);
   *    // { kind: "create", paths: [ "/foo.txt" ] }
   * }
   * ```
   *
   * Call `watcher.close()` to stop watching.
   *
   * ```ts
   * const watcher = Deno.watchFs("/");
   *
   * setTimeout(() => {
   *   watcher.close();
   * }, 5000);
   *
   * for await (const event of watcher) {
   *    console.log(">>>> event", event);
   * }
   * ```
   *
   * Requires `allow-read` permission.
   *
   * @tags allow-read
   * @category File System
   */
  export function watchFs(paths: string | string[], options?: { recursive: boolean }): FsWatcher

  /**
   * Options which can be used with {@linkcode Deno.run}.
   *
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   *
   * @category Sub Process */
  export interface RunOptions {
    /** Arguments to pass.
     *
     * _Note_: the first element needs to be a path to the executable that is
     * being run. */
    cmd: readonly string[] | [string | URL, ...string[]]
    /** The current working directory that should be used when running the
     * sub-process. */
    cwd?: string
    /** Any environment variables to be set when running the sub-process. */
    env?: Record<string, string>
    /** By default subprocess inherits `stdout` of parent process. To change
     * this this option can be set to a resource ID (_rid_) of an open file,
     * `"inherit"`, `"piped"`, or `"null"`:
     *
     * - _number_: the resource ID of an open file/resource. This allows you to
     *   write to a file.
     * - `"inherit"`: The default if unspecified. The subprocess inherits from the
     *   parent.
     * - `"piped"`: A new pipe should be arranged to connect the parent and child
     *   sub-process.
     * - `"null"`: This stream will be ignored. This is the equivalent of attaching
     *   the stream to `/dev/null`.
     */
    stdout?: 'inherit' | 'piped' | 'null' | number
    /** By default subprocess inherits `stderr` of parent process. To change
     * this this option can be set to a resource ID (_rid_) of an open file,
     * `"inherit"`, `"piped"`, or `"null"`:
     *
     * - _number_: the resource ID of an open file/resource. This allows you to
     *   write to a file.
     * - `"inherit"`: The default if unspecified. The subprocess inherits from the
     *   parent.
     * - `"piped"`: A new pipe should be arranged to connect the parent and child
     *   sub-process.
     * - `"null"`: This stream will be ignored. This is the equivalent of attaching
     *   the stream to `/dev/null`.
     */
    stderr?: 'inherit' | 'piped' | 'null' | number
    /** By default subprocess inherits `stdin` of parent process. To change
     * this this option can be set to a resource ID (_rid_) of an open file,
     * `"inherit"`, `"piped"`, or `"null"`:
     *
     * - _number_: the resource ID of an open file/resource. This allows you to
     *   read from a file.
     * - `"inherit"`: The default if unspecified. The subprocess inherits from the
     *   parent.
     * - `"piped"`: A new pipe should be arranged to connect the parent and child
     *   sub-process.
     * - `"null"`: This stream will be ignored. This is the equivalent of attaching
     *   the stream to `/dev/null`.
     */
    stdin?: 'inherit' | 'piped' | 'null' | number
  }

  /**
   * The status resolved from the `.status()` method of a
   * {@linkcode Deno.Process} instance.
   *
   * If `success` is `true`, then `code` will be `0`, but if `success` is
   * `false`, the sub-process exit code will be set in `code`.
   *
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   *
   * @category Sub Process */
  export type ProcessStatus =
    | {
        success: true
        code: 0
        signal?: undefined
      }
    | {
        success: false
        code: number
        signal?: number
      }

  /**
   * Represents an instance of a sub process that is returned from
   * {@linkcode Deno.run} which can be used to manage the sub-process.
   *
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   *
   * @category Sub Process */
  export class Process<T extends RunOptions = RunOptions> {
    /** The resource ID of the sub-process. */
    readonly rid: number
    /** The operating system's process ID for the sub-process. */
    readonly pid: number
    /** A reference to the sub-processes `stdin`, which allows interacting with
     * the sub-process at a low level. */
    readonly stdin: T['stdin'] extends 'piped'
      ? Writer &
          Closer & {
            writable: WritableStream<Uint8Array>
          }
      : (Writer & Closer & { writable: WritableStream<Uint8Array> }) | null
    /** A reference to the sub-processes `stdout`, which allows interacting with
     * the sub-process at a low level. */
    readonly stdout: T['stdout'] extends 'piped'
      ? Reader &
          Closer & {
            readable: ReadableStream<Uint8Array>
          }
      : (Reader & Closer & { readable: ReadableStream<Uint8Array> }) | null
    /** A reference to the sub-processes `stderr`, which allows interacting with
     * the sub-process at a low level. */
    readonly stderr: T['stderr'] extends 'piped'
      ? Reader &
          Closer & {
            readable: ReadableStream<Uint8Array>
          }
      : (Reader & Closer & { readable: ReadableStream<Uint8Array> }) | null
    /** Wait for the process to exit and return its exit status.
     *
     * Calling this function multiple times will return the same status.
     *
     * The `stdin` reference to the process will be closed before waiting to
     * avoid a deadlock.
     *
     * If `stdout` and/or `stderr` were set to `"piped"`, they must be closed
     * manually before the process can exit.
     *
     * To run process to completion and collect output from both `stdout` and
     * `stderr` use:
     *
     * ```ts
     * const p = Deno.run({ cmd: [ "echo", "hello world" ], stderr: 'piped', stdout: 'piped' });
     * const [status, stdout, stderr] = await Promise.all([
     *   p.status(),
     *   p.output(),
     *   p.stderrOutput()
     * ]);
     * p.close();
     * ```
     */
    status(): Promise<ProcessStatus>
    /** Buffer the stdout until EOF and return it as `Uint8Array`.
     *
     * You must set `stdout` to `"piped"` when creating the process.
     *
     * This calls `close()` on stdout after its done. */
    output(): Promise<Uint8Array>
    /** Buffer the stderr until EOF and return it as `Uint8Array`.
     *
     * You must set `stderr` to `"piped"` when creating the process.
     *
     * This calls `close()` on stderr after its done. */
    stderrOutput(): Promise<Uint8Array>
    /** Clean up resources associated with the sub-process instance. */
    close(): void
    /** Send a signal to process.
     * Default signal is `"SIGTERM"`.
     *
     * ```ts
     * const p = Deno.run({ cmd: [ "sleep", "20" ]});
     * p.kill("SIGTERM");
     * p.close();
     * ```
     */
    kill(signo?: Signal): void
  }

  /** Operating signals which can be listened for or sent to sub-processes. What
   * signals and what their standard behaviors are OS dependent.
   *
   * @category Runtime */
  export type Signal =
    | 'SIGABRT'
    | 'SIGALRM'
    | 'SIGBREAK'
    | 'SIGBUS'
    | 'SIGCHLD'
    | 'SIGCONT'
    | 'SIGEMT'
    | 'SIGFPE'
    | 'SIGHUP'
    | 'SIGILL'
    | 'SIGINFO'
    | 'SIGINT'
    | 'SIGIO'
    | 'SIGPOLL'
    | 'SIGUNUSED'
    | 'SIGKILL'
    | 'SIGPIPE'
    | 'SIGPROF'
    | 'SIGPWR'
    | 'SIGQUIT'
    | 'SIGSEGV'
    | 'SIGSTKFLT'
    | 'SIGSTOP'
    | 'SIGSYS'
    | 'SIGTERM'
    | 'SIGTRAP'
    | 'SIGTSTP'
    | 'SIGTTIN'
    | 'SIGTTOU'
    | 'SIGURG'
    | 'SIGUSR1'
    | 'SIGUSR2'
    | 'SIGVTALRM'
    | 'SIGWINCH'
    | 'SIGXCPU'
    | 'SIGXFSZ'

  /** Registers the given function as a listener of the given signal event.
   *
   * ```ts
   * Deno.addSignalListener(
   *   "SIGTERM",
   *   () => {
   *     console.log("SIGTERM!")
   *   }
   * );
   * ```
   *
   * _Note_: On Windows only `"SIGINT"` (CTRL+C) and `"SIGBREAK"` (CTRL+Break)
   * are supported.
   *
   * @category Runtime
   */
  export function addSignalListener(signal: Signal, handler: () => void): void

  /** Removes the given signal listener that has been registered with
   * {@linkcode Deno.addSignalListener}.
   *
   * ```ts
   * const listener = () => {
   *   console.log("SIGTERM!")
   * };
   * Deno.addSignalListener("SIGTERM", listener);
   * Deno.removeSignalListener("SIGTERM", listener);
   * ```
   *
   * _Note_: On Windows only `"SIGINT"` (CTRL+C) and `"SIGBREAK"` (CTRL+Break)
   * are supported.
   *
   * @category Runtime
   */
  export function removeSignalListener(signal: Signal, handler: () => void): void

  /**
   * Spawns new subprocess. RunOptions must contain at a minimum the `opt.cmd`,
   * an array of program arguments, the first of which is the binary.
   *
   * ```ts
   * const p = Deno.run({
   *   cmd: ["curl", "https://example.com"],
   * });
   * const status = await p.status();
   * ```
   *
   * Subprocess uses same working directory as parent process unless `opt.cwd`
   * is specified.
   *
   * Environmental variables from parent process can be cleared using `opt.clearEnv`.
   * Doesn't guarantee that only `opt.env` variables are present,
   * as the OS may set environmental variables for processes.
   *
   * Environmental variables for subprocess can be specified using `opt.env`
   * mapping.
   *
   * `opt.uid` sets the child process’s user ID. This translates to a setuid call
   * in the child process. Failure in the setuid call will cause the spawn to fail.
   *
   * `opt.gid` is similar to `opt.uid`, but sets the group ID of the child process.
   * This has the same semantics as the uid field.
   *
   * By default subprocess inherits stdio of parent process. To change
   * this this, `opt.stdin`, `opt.stdout`, and `opt.stderr` can be set
   * independently to a resource ID (_rid_) of an open file, `"inherit"`,
   * `"piped"`, or `"null"`:
   *
   * - _number_: the resource ID of an open file/resource. This allows you to
   *   read or write to a file.
   * - `"inherit"`: The default if unspecified. The subprocess inherits from the
   *   parent.
   * - `"piped"`: A new pipe should be arranged to connect the parent and child
   *   sub-process.
   * - `"null"`: This stream will be ignored. This is the equivalent of attaching
   *   the stream to `/dev/null`.
   *
   * Details of the spawned process are returned as an instance of
   * {@linkcode Deno.Process}.
   *
   * Requires `allow-run` permission.
   *
   * @deprecated This will be soft-removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   *
   * @tags allow-run
   * @category Sub Process
   */
  export function run<T extends RunOptions = RunOptions>(opt: T): Process<T>

  /** Create a child process.
   *
   * If any stdio options are not set to `"piped"`, accessing the corresponding
   * field on the `Command` or its `CommandOutput` will throw a `TypeError`.
   *
   * If `stdin` is set to `"piped"`, the `stdin` {@linkcode WritableStream}
   * needs to be closed manually.
   *
   * `Command` acts as a builder. Each call to {@linkcode Command.spawn} or
   * {@linkcode Command.output} will spawn a new subprocess.
   *
   * @example Spawn a subprocess and pipe the output to a file
   *
   * ```ts
   * const command = new Deno.Command(Deno.execPath(), {
   *   args: [
   *     "eval",
   *     "console.log('Hello World')",
   *   ],
   *   stdin: "piped",
   *   stdout: "piped",
   * });
   * const child = command.spawn();
   *
   * // open a file and pipe the subprocess output to it.
   * child.stdout.pipeTo(
   *   Deno.openSync("output", { write: true, create: true }).writable,
   * );
   *
   * // manually close stdin
   * child.stdin.close();
   * const status = await child.status;
   * ```
   *
   * @example Spawn a subprocess and collect its output
   *
   * ```ts
   * const command = new Deno.Command(Deno.execPath(), {
   *   args: [
   *     "eval",
   *     "console.log('hello'); console.error('world')",
   *   ],
   * });
   * const { code, stdout, stderr } = await command.output();
   * console.assert(code === 0);
   * console.assert("hello\n" === new TextDecoder().decode(stdout));
   * console.assert("world\n" === new TextDecoder().decode(stderr));
   * ```
   *
   * @example Spawn a subprocess and collect its output synchronously
   *
   * ```ts
   * const command = new Deno.Command(Deno.execPath(), {
   *   args: [
   *     "eval",
   *     "console.log('hello'); console.error('world')",
   *   ],
   * });
   * const { code, stdout, stderr } = command.outputSync();
   * console.assert(code === 0);
   * console.assert("hello\n" === new TextDecoder().decode(stdout));
   * console.assert("world\n" === new TextDecoder().decode(stderr));
   * ```
   *
   * @tags allow-run
   * @category Sub Process
   */
  export class Command {
    constructor(command: string | URL, options?: CommandOptions)
    /**
     * Executes the {@linkcode Deno.Command}, waiting for it to finish and
     * collecting all of its output.
     *
     * Will throw an error if `stdin: "piped"` is set.
     *
     * If options `stdout` or `stderr` are not set to `"piped"`, accessing the
     * corresponding field on {@linkcode Deno.CommandOutput} will throw a `TypeError`.
     */
    output(): Promise<CommandOutput>
    /**
     * Synchronously executes the {@linkcode Deno.Command}, waiting for it to
     * finish and collecting all of its output.
     *
     * Will throw an error if `stdin: "piped"` is set.
     *
     * If options `stdout` or `stderr` are not set to `"piped"`, accessing the
     * corresponding field on {@linkcode Deno.CommandOutput} will throw a `TypeError`.
     */
    outputSync(): CommandOutput
    /**
     * Spawns a streamable subprocess, allowing to use the other methods.
     */
    spawn(): ChildProcess
  }

  /**
   * The interface for handling a child process returned from
   * {@linkcode Deno.Command.spawn}.
   *
   * @category Sub Process
   */
  export class ChildProcess implements AsyncDisposable {
    get stdin(): WritableStream<Uint8Array>
    get stdout(): ReadableStream<Uint8Array>
    get stderr(): ReadableStream<Uint8Array>
    readonly pid: number
    /** Get the status of the child. */
    readonly status: Promise<CommandStatus>

    /** Waits for the child to exit completely, returning all its output and
     * status. */
    output(): Promise<CommandOutput>
    /** Kills the process with given {@linkcode Deno.Signal}.
     *
     * Defaults to `SIGTERM` if no signal is provided.
     *
     * @param [signo="SIGTERM"]
     */
    kill(signo?: Signal): void

    /** Ensure that the status of the child process prevents the Deno process
     * from exiting. */
    ref(): void
    /** Ensure that the status of the child process does not block the Deno
     * process from exiting. */
    unref(): void

    [Symbol.asyncDispose](): Promise<void>
  }

  /**
   * Options which can be set when calling {@linkcode Deno.Command}.
   *
   * @category Sub Process
   */
  export interface CommandOptions {
    /** Arguments to pass to the process. */
    args?: string[]
    /**
     * The working directory of the process.
     *
     * If not specified, the `cwd` of the parent process is used.
     */
    cwd?: string | URL
    /**
     * Clear environmental variables from parent process.
     *
     * Doesn't guarantee that only `env` variables are present, as the OS may
     * set environmental variables for processes.
     *
     * @default {false}
     */
    clearEnv?: boolean
    /** Environmental variables to pass to the subprocess. */
    env?: Record<string, string>
    /**
     * Sets the child process’s user ID. This translates to a setuid call in the
     * child process. Failure in the set uid call will cause the spawn to fail.
     */
    uid?: number
    /** Similar to `uid`, but sets the group ID of the child process. */
    gid?: number
    /**
     * An {@linkcode AbortSignal} that allows closing the process using the
     * corresponding {@linkcode AbortController} by sending the process a
     * SIGTERM signal.
     *
     * Not supported in {@linkcode Deno.Command.outputSync}.
     */
    signal?: AbortSignal

    /** How `stdin` of the spawned process should be handled.
     *
     * Defaults to `"inherit"` for `output` & `outputSync`,
     * and `"inherit"` for `spawn`. */
    stdin?: 'piped' | 'inherit' | 'null'
    /** How `stdout` of the spawned process should be handled.
     *
     * Defaults to `"piped"` for `output` & `outputSync`,
     * and `"inherit"` for `spawn`. */
    stdout?: 'piped' | 'inherit' | 'null'
    /** How `stderr` of the spawned process should be handled.
     *
     * Defaults to `"piped"` for `output` & `outputSync`,
     * and `"inherit"` for `spawn`. */
    stderr?: 'piped' | 'inherit' | 'null'

    /** Skips quoting and escaping of the arguments on windows. This option
     * is ignored on non-windows platforms.
     *
     * @default {false} */
    windowsRawArguments?: boolean
  }

  /**
   * @category Sub Process
   */
  export interface CommandStatus {
    /** If the child process exits with a 0 status code, `success` will be set
     * to `true`, otherwise `false`. */
    success: boolean
    /** The exit code of the child process. */
    code: number
    /** The signal associated with the child process. */
    signal: Signal | null
  }

  /**
   * The interface returned from calling {@linkcode Deno.Command.output} or
   * {@linkcode Deno.Command.outputSync} which represents the result of spawning the
   * child process.
   *
   * @category Sub Process
   */
  export interface CommandOutput extends CommandStatus {
    /** The buffered output from the child process' `stdout`. */
    readonly stdout: Uint8Array
    /** The buffered output from the child process' `stderr`. */
    readonly stderr: Uint8Array
  }

  /** Option which can be specified when performing {@linkcode Deno.inspect}.
   *
   * @category I/O */
  export interface InspectOptions {
    /** Stylize output with ANSI colors.
     *
     * @default {false} */
    colors?: boolean
    /** Try to fit more than one entry of a collection on the same line.
     *
     * @default {true} */
    compact?: boolean
    /** Traversal depth for nested objects.
     *
     * @default {4} */
    depth?: number
    /** The maximum length for an inspection to take up a single line.
     *
     * @default {80} */
    breakLength?: number
    /** Whether or not to escape sequences.
     *
     * @default {true} */
    escapeSequences?: boolean
    /** The maximum number of iterable entries to print.
     *
     * @default {100} */
    iterableLimit?: number
    /** Show a Proxy's target and handler.
     *
     * @default {false} */
    showProxy?: boolean
    /** Sort Object, Set and Map entries by key.
     *
     * @default {false} */
    sorted?: boolean
    /** Add a trailing comma for multiline collections.
     *
     * @default {false} */
    trailingComma?: boolean
    /** Evaluate the result of calling getters.
     *
     * @default {false} */
    getters?: boolean
    /** Show an object's non-enumerable properties.
     *
     * @default {false} */
    showHidden?: boolean
    /** The maximum length of a string before it is truncated with an
     * ellipsis. */
    strAbbreviateSize?: number
  }

  /** Converts the input into a string that has the same format as printed by
   * `console.log()`.
   *
   * ```ts
   * const obj = {
   *   a: 10,
   *   b: "hello",
   * };
   * const objAsString = Deno.inspect(obj); // { a: 10, b: "hello" }
   * console.log(obj);  // prints same value as objAsString, e.g. { a: 10, b: "hello" }
   * ```
   *
   * A custom inspect functions can be registered on objects, via the symbol
   * `Symbol.for("Deno.customInspect")`, to control and customize the output
   * of `inspect()` or when using `console` logging:
   *
   * ```ts
   * class A {
   *   x = 10;
   *   y = "hello";
   *   [Symbol.for("Deno.customInspect")]() {
   *     return `x=${this.x}, y=${this.y}`;
   *   }
   * }
   *
   * const inStringFormat = Deno.inspect(new A()); // "x=10, y=hello"
   * console.log(inStringFormat);  // prints "x=10, y=hello"
   * ```
   *
   * A depth can be specified by using the `depth` option:
   *
   * ```ts
   * Deno.inspect({a: {b: {c: {d: 'hello'}}}}, {depth: 2}); // { a: { b: [Object] } }
   * ```
   *
   * @category I/O
   */
  export function inspect(value: unknown, options?: InspectOptions): string

  /** The name of a privileged feature which needs permission.
   *
   * @category Permissions
   */
  export type PermissionName = 'run' | 'read' | 'write' | 'net' | 'env' | 'sys' | 'ffi' | 'hrtime'

  /** The current status of the permission:
   *
   * - `"granted"` - the permission has been granted.
   * - `"denied"` - the permission has been explicitly denied.
   * - `"prompt"` - the permission has not explicitly granted nor denied.
   *
   * @category Permissions
   */
  export type PermissionState = 'granted' | 'denied' | 'prompt'

  /** The permission descriptor for the `allow-run` and `deny-run` permissions, which controls
   * access to what sub-processes can be executed by Deno. The option `command`
   * allows scoping the permission to a specific executable.
   *
   * **Warning, in practice, `allow-run` is effectively the same as `allow-all`
   * in the sense that malicious code could execute any arbitrary code on the
   * host.**
   *
   * @category Permissions */
  export interface RunPermissionDescriptor {
    name: 'run'
    /** An `allow-run` or `deny-run` permission can be scoped to a specific executable,
     * which would be relative to the start-up CWD of the Deno CLI. */
    command?: string | URL
  }

  /** The permission descriptor for the `allow-read` and `deny-read` permissions, which controls
   * access to reading resources from the local host. The option `path` allows
   * scoping the permission to a specific path (and if the path is a directory
   * any sub paths).
   *
   * Permission granted under `allow-read` only allows runtime code to attempt
   * to read, the underlying operating system may apply additional permissions.
   *
   * @category Permissions */
  export interface ReadPermissionDescriptor {
    name: 'read'
    /** An `allow-read` or `deny-read` permission can be scoped to a specific path (and if
     * the path is a directory, any sub paths). */
    path?: string | URL
  }

  /** The permission descriptor for the `allow-write` and `deny-write` permissions, which
   * controls access to writing to resources from the local host. The option
   * `path` allow scoping the permission to a specific path (and if the path is
   * a directory any sub paths).
   *
   * Permission granted under `allow-write` only allows runtime code to attempt
   * to write, the underlying operating system may apply additional permissions.
   *
   * @category Permissions */
  export interface WritePermissionDescriptor {
    name: 'write'
    /** An `allow-write` or `deny-write` permission can be scoped to a specific path (and if
     * the path is a directory, any sub paths). */
    path?: string | URL
  }

  /** The permission descriptor for the `allow-net` and `deny-net` permissions, which controls
   * access to opening network ports and connecting to remote hosts via the
   * network. The option `host` allows scoping the permission for outbound
   * connection to a specific host and port.
   *
   * @category Permissions */
  export interface NetPermissionDescriptor {
    name: 'net'
    /** Optional host string of the form `"<hostname>[:<port>]"`. Examples:
     *
     *      "github.com"
     *      "deno.land:8080"
     */
    host?: string
  }

  /** The permission descriptor for the `allow-env` and `deny-env` permissions, which controls
   * access to being able to read and write to the process environment variables
   * as well as access other information about the environment. The option
   * `variable` allows scoping the permission to a specific environment
   * variable.
   *
   * @category Permissions */
  export interface EnvPermissionDescriptor {
    name: 'env'
    /** Optional environment variable name (e.g. `PATH`). */
    variable?: string
  }

  /** The permission descriptor for the `allow-sys` and `deny-sys` permissions, which controls
   * access to sensitive host system information, which malicious code might
   * attempt to exploit. The option `kind` allows scoping the permission to a
   * specific piece of information.
   *
   * @category Permissions */
  export interface SysPermissionDescriptor {
    name: 'sys'
    /** The specific information to scope the permission to. */
    kind?:
      | 'loadavg'
      | 'hostname'
      | 'systemMemoryInfo'
      | 'networkInterfaces'
      | 'osRelease'
      | 'osUptime'
      | 'uid'
      | 'gid'
      | 'username'
      | 'cpus'
      | 'homedir'
      | 'statfs'
      | 'getPriority'
      | 'setPriority'
  }

  /** The permission descriptor for the `allow-ffi` and `deny-ffi` permissions, which controls
   * access to loading _foreign_ code and interfacing with it via the
   * [Foreign Function Interface API](https://deno.land/manual/runtime/ffi_api)
   * available in Deno.  The option `path` allows scoping the permission to a
   * specific path on the host.
   *
   * @category Permissions */
  export interface FfiPermissionDescriptor {
    name: 'ffi'
    /** Optional path on the local host to scope the permission to. */
    path?: string | URL
  }

  /** The permission descriptor for the `allow-hrtime` and `deny-hrtime` permissions, which
   * controls if the runtime code has access to high resolution time. High
   * resolution time is considered sensitive information, because it can be used
   * by malicious code to gain information about the host that it might not
   * otherwise have access to.
   *
   * @category Permissions */
  export interface HrtimePermissionDescriptor {
    name: 'hrtime'
  }

  /** Permission descriptors which define a permission and can be queried,
   * requested, or revoked.
   *
   * View the specifics of the individual descriptors for more information about
   * each permission kind.
   *
   * @category Permissions
   */
  export type PermissionDescriptor =
    | RunPermissionDescriptor
    | ReadPermissionDescriptor
    | WritePermissionDescriptor
    | NetPermissionDescriptor
    | EnvPermissionDescriptor
    | SysPermissionDescriptor
    | FfiPermissionDescriptor
    | HrtimePermissionDescriptor

  /** The interface which defines what event types are supported by
   * {@linkcode PermissionStatus} instances.
   *
   * @category Permissions */
  export interface PermissionStatusEventMap {
    change: Event
  }

  /** An {@linkcode EventTarget} returned from the {@linkcode Deno.permissions}
   * API which can provide updates to any state changes of the permission.
   *
   * @category Permissions */
  export class PermissionStatus extends EventTarget {
    // deno-lint-ignore no-explicit-any
    onchange: ((this: PermissionStatus, ev: Event) => any) | null
    readonly state: PermissionState
    /**
     * Describes if permission is only granted partially, eg. an access
     * might be granted to "/foo" directory, but denied for "/foo/bar".
     * In such case this field will be set to `true` when querying for
     * read permissions of "/foo" directory.
     */
    readonly partial: boolean
    addEventListener<K extends keyof PermissionStatusEventMap>(
      type: K,
      listener: (this: PermissionStatus, ev: PermissionStatusEventMap[K]) => any,
      options?: boolean | AddEventListenerOptions
    ): void
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ): void
    removeEventListener<K extends keyof PermissionStatusEventMap>(
      type: K,
      listener: (this: PermissionStatus, ev: PermissionStatusEventMap[K]) => any,
      options?: boolean | EventListenerOptions
    ): void
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | EventListenerOptions
    ): void
  }

  /**
   * Deno's permission management API.
   *
   * The class which provides the interface for the {@linkcode Deno.permissions}
   * global instance and is based on the web platform
   * [Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API),
   * though some proposed parts of the API which are useful in a server side
   * runtime context were removed or abandoned in the web platform specification
   * which is why it was chosen to locate it in the {@linkcode Deno} namespace
   * instead.
   *
   * By default, if the `stdin`/`stdout` is TTY for the Deno CLI (meaning it can
   * send and receive text), then the CLI will prompt the user to grant
   * permission when an un-granted permission is requested. This behavior can
   * be changed by using the `--no-prompt` command at startup. When prompting
   * the CLI will request the narrowest permission possible, potentially making
   * it annoying to the user. The permissions APIs allow the code author to
   * request a wider set of permissions at one time in order to provide a better
   * user experience.
   *
   * @category Permissions */
  export class Permissions {
    /** Resolves to the current status of a permission.
     *
     * Note, if the permission is already granted, `request()` will not prompt
     * the user again, therefore `query()` is only necessary if you are going
     * to react differently existing permissions without wanting to modify them
     * or prompt the user to modify them.
     *
     * ```ts
     * const status = await Deno.permissions.query({ name: "read", path: "/etc" });
     * console.log(status.state);
     * ```
     */
    query(desc: PermissionDescriptor): Promise<PermissionStatus>

    /** Returns the current status of a permission.
     *
     * Note, if the permission is already granted, `request()` will not prompt
     * the user again, therefore `querySync()` is only necessary if you are going
     * to react differently existing permissions without wanting to modify them
     * or prompt the user to modify them.
     *
     * ```ts
     * const status = Deno.permissions.querySync({ name: "read", path: "/etc" });
     * console.log(status.state);
     * ```
     */
    querySync(desc: PermissionDescriptor): PermissionStatus

    /** Revokes a permission, and resolves to the state of the permission.
     *
     * ```ts
     * import { assert } from "jsr:@std/assert";
     *
     * const status = await Deno.permissions.revoke({ name: "run" });
     * assert(status.state !== "granted")
     * ```
     */
    revoke(desc: PermissionDescriptor): Promise<PermissionStatus>

    /** Revokes a permission, and returns the state of the permission.
     *
     * ```ts
     * import { assert } from "jsr:@std/assert";
     *
     * const status = Deno.permissions.revokeSync({ name: "run" });
     * assert(status.state !== "granted")
     * ```
     */
    revokeSync(desc: PermissionDescriptor): PermissionStatus

    /** Requests the permission, and resolves to the state of the permission.
     *
     * If the permission is already granted, the user will not be prompted to
     * grant the permission again.
     *
     * ```ts
     * const status = await Deno.permissions.request({ name: "env" });
     * if (status.state === "granted") {
     *   console.log("'env' permission is granted.");
     * } else {
     *   console.log("'env' permission is denied.");
     * }
     * ```
     */
    request(desc: PermissionDescriptor): Promise<PermissionStatus>

    /** Requests the permission, and returns the state of the permission.
     *
     * If the permission is already granted, the user will not be prompted to
     * grant the permission again.
     *
     * ```ts
     * const status = Deno.permissions.requestSync({ name: "env" });
     * if (status.state === "granted") {
     *   console.log("'env' permission is granted.");
     * } else {
     *   console.log("'env' permission is denied.");
     * }
     * ```
     */
    requestSync(desc: PermissionDescriptor): PermissionStatus
  }

  /** Deno's permission management API.
   *
   * It is a singleton instance of the {@linkcode Permissions} object and is
   * based on the web platform
   * [Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API),
   * though some proposed parts of the API which are useful in a server side
   * runtime context were removed or abandoned in the web platform specification
   * which is why it was chosen to locate it in the {@linkcode Deno} namespace
   * instead.
   *
   * By default, if the `stdin`/`stdout` is TTY for the Deno CLI (meaning it can
   * send and receive text), then the CLI will prompt the user to grant
   * permission when an un-granted permission is requested. This behavior can
   * be changed by using the `--no-prompt` command at startup. When prompting
   * the CLI will request the narrowest permission possible, potentially making
   * it annoying to the user. The permissions APIs allow the code author to
   * request a wider set of permissions at one time in order to provide a better
   * user experience.
   *
   * Requesting already granted permissions will not prompt the user and will
   * return that the permission was granted.
   *
   * ### Querying
   *
   * ```ts
   * const status = await Deno.permissions.query({ name: "read", path: "/etc" });
   * console.log(status.state);
   * ```
   *
   * ```ts
   * const status = Deno.permissions.querySync({ name: "read", path: "/etc" });
   * console.log(status.state);
   * ```
   *
   * ### Revoking
   *
   * ```ts
   * import { assert } from "jsr:@std/assert";
   *
   * const status = await Deno.permissions.revoke({ name: "run" });
   * assert(status.state !== "granted")
   * ```
   *
   * ```ts
   * import { assert } from "jsr:@std/assert";
   *
   * const status = Deno.permissions.revokeSync({ name: "run" });
   * assert(status.state !== "granted")
   * ```
   *
   * ### Requesting
   *
   * ```ts
   * const status = await Deno.permissions.request({ name: "env" });
   * if (status.state === "granted") {
   *   console.log("'env' permission is granted.");
   * } else {
   *   console.log("'env' permission is denied.");
   * }
   * ```
   *
   * ```ts
   * const status = Deno.permissions.requestSync({ name: "env" });
   * if (status.state === "granted") {
   *   console.log("'env' permission is granted.");
   * } else {
   *   console.log("'env' permission is denied.");
   * }
   * ```
   *
   * @category Permissions
   */
  export const permissions: Permissions

  /** Information related to the build of the current Deno runtime.
   *
   * Users are discouraged from code branching based on this information, as
   * assumptions about what is available in what build environment might change
   * over time. Developers should specifically sniff out the features they
   * intend to use.
   *
   * The intended use for the information is for logging and debugging purposes.
   *
   * @category Runtime
   */
  export const build: {
    /** The [LLVM](https://llvm.org/) target triple, which is the combination
     * of `${arch}-${vendor}-${os}` and represent the specific build target that
     * the current runtime was built for. */
    target: string
    /** Instruction set architecture that the Deno CLI was built for. */
    arch: 'x86_64' | 'aarch64'
    /** The operating system that the Deno CLI was built for. `"darwin"` is
     * also known as OSX or MacOS. */
    os:
      | 'darwin'
      | 'linux'
      | 'android'
      | 'windows'
      | 'freebsd'
      | 'netbsd'
      | 'aix'
      | 'solaris'
      | 'illumos'
    /** The computer vendor that the Deno CLI was built for. */
    vendor: string
    /** Optional environment flags that were set for this build of Deno CLI. */
    env?: string
  }

  /** Version information related to the current Deno CLI runtime environment.
   *
   * Users are discouraged from code branching based on this information, as
   * assumptions about what is available in what build environment might change
   * over time. Developers should specifically sniff out the features they
   * intend to use.
   *
   * The intended use for the information is for logging and debugging purposes.
   *
   * @category Runtime
   */
  export const version: {
    /** Deno CLI's version. For example: `"1.26.0"`. */
    deno: string
    /** The V8 version used by Deno. For example: `"10.7.100.0"`.
     *
     * V8 is the underlying JavaScript runtime platform that Deno is built on
     * top of. */
    v8: string
    /** The TypeScript version used by Deno. For example: `"4.8.3"`.
     *
     * A version of the TypeScript type checker and language server is built-in
     * to the Deno CLI. */
    typescript: string
  }

  /** Returns the script arguments to the program.
   *
   * Give the following command line invocation of Deno:
   *
   * ```sh
   * deno run --allow-read https://examples.deno.land/command-line-arguments.ts Sushi
   * ```
   *
   * Then `Deno.args` will contain:
   *
   * ```ts
   * [ "Sushi" ]
   * ```
   *
   * If you are looking for a structured way to parse arguments, there is
   * [`parseArgs()`](https://jsr.io/@std/cli/doc/parse-args/~/parseArgs) from
   * the Deno Standard Library.
   *
   * @category Runtime
   */
  export const args: string[]

  /**
   * A symbol which can be used as a key for a custom method which will be
   * called when `Deno.inspect()` is called, or when the object is logged to
   * the console.
   *
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   *
   * @category I/O
   */
  export const customInspect: unique symbol

  /** The URL of the entrypoint module entered from the command-line. It
   * requires read permission to the CWD.
   *
   * Also see {@linkcode ImportMeta} for other related information.
   *
   * @tags allow-read
   * @category Runtime
   */
  export const mainModule: string

  /** Options that can be used with {@linkcode symlink} and
   * {@linkcode symlinkSync}.
   *
   * @category File System */
  export interface SymlinkOptions {
    /** Specify the symbolic link type as file, directory or NTFS junction. This
     * option only applies to Windows and is ignored on other operating systems. */
    type: 'file' | 'dir' | 'junction'
  }

  /**
   * Creates `newpath` as a symbolic link to `oldpath`.
   *
   * The `options.type` parameter can be set to `"file"`, `"dir"` or `"junction"`.
   * This argument is only available on Windows and ignored on other platforms.
   *
   * ```ts
   * await Deno.symlink("old/name", "new/name");
   * ```
   *
   * Requires full `allow-read` and `allow-write` permissions.
   *
   * @tags allow-read, allow-write
   * @category File System
   */
  export function symlink(
    oldpath: string | URL,
    newpath: string | URL,
    options?: SymlinkOptions
  ): Promise<void>

  /**
   * Creates `newpath` as a symbolic link to `oldpath`.
   *
   * The `options.type` parameter can be set to `"file"`, `"dir"` or `"junction"`.
   * This argument is only available on Windows and ignored on other platforms.
   *
   * ```ts
   * Deno.symlinkSync("old/name", "new/name");
   * ```
   *
   * Requires full `allow-read` and `allow-write` permissions.
   *
   * @tags allow-read, allow-write
   * @category File System
   */
  export function symlinkSync(
    oldpath: string | URL,
    newpath: string | URL,
    options?: SymlinkOptions
  ): void

  /**
   * Truncates or extends the specified file stream, to reach the specified
   * `len`.
   *
   * If `len` is not specified then the entire file contents are truncated as if
   * `len` was set to `0`.
   *
   * If the file previously was larger than this new length, the extra data is
   * lost.
   *
   * If the file previously was shorter, it is extended, and the extended part
   * reads as null bytes ('\0').
   *
   * ### Truncate the entire file
   *
   * ```ts
   * const file = await Deno.open(
   *   "my_file.txt",
   *   { read: true, write: true, create: true }
   * );
   * await Deno.ftruncate(file.rid);
   * ```
   *
   * ### Truncate part of the file
   *
   * ```ts
   * const file = await Deno.open(
   *   "my_file.txt",
   *   { read: true, write: true, create: true }
   * );
   * await file.write(new TextEncoder().encode("Hello World"));
   * await Deno.ftruncate(file.rid, 7);
   * const data = new Uint8Array(32);
   * await Deno.read(file.rid, data);
   * console.log(new TextDecoder().decode(data)); // Hello W
   * ```
   *
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   *
   * @category File System
   */
  export function ftruncate(rid: number, len?: number): Promise<void>

  /**
   * Synchronously truncates or extends the specified file stream, to reach the
   * specified `len`.
   *
   * If `len` is not specified then the entire file contents are truncated as if
   * `len` was set to `0`.
   *
   * If the file previously was larger than this new length, the extra data is
   * lost.
   *
   * If the file previously was shorter, it is extended, and the extended part
   * reads as null bytes ('\0').
   *
   * ### Truncate the entire file
   *
   * ```ts
   * const file = Deno.openSync(
   *   "my_file.txt",
   *   { read: true, write: true, truncate: true, create: true }
   * );
   * Deno.ftruncateSync(file.rid);
   * ```
   *
   * ### Truncate part of the file
   *
   * ```ts
   * const file = Deno.openSync(
   *  "my_file.txt",
   *  { read: true, write: true, create: true }
   * );
   * file.writeSync(new TextEncoder().encode("Hello World"));
   * Deno.ftruncateSync(file.rid, 7);
   * Deno.seekSync(file.rid, 0, Deno.SeekMode.Start);
   * const data = new Uint8Array(32);
   * Deno.readSync(file.rid, data);
   * console.log(new TextDecoder().decode(data)); // Hello W
   * ```
   *
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   *
   * @category File System
   */
  export function ftruncateSync(rid: number, len?: number): void

  /**
   * Synchronously changes the access (`atime`) and modification (`mtime`) times
   * of a file stream resource referenced by `rid`. Given times are either in
   * seconds (UNIX epoch time) or as `Date` objects.
   *
   * ```ts
   * const file = Deno.openSync("file.txt", { create: true, write: true });
   * Deno.futimeSync(file.rid, 1556495550, new Date());
   * ```
   *
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   *
   * @category File System
   */
  export function futimeSync(rid: number, atime: number | Date, mtime: number | Date): void

  /**
   * Changes the access (`atime`) and modification (`mtime`) times of a file
   * stream resource referenced by `rid`. Given times are either in seconds
   * (UNIX epoch time) or as `Date` objects.
   *
   * ```ts
   * const file = await Deno.open("file.txt", { create: true, write: true });
   * await Deno.futime(file.rid, 1556495550, new Date());
   * ```
   *
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   *
   * @category File System
   */
  export function futime(rid: number, atime: number | Date, mtime: number | Date): Promise<void>

  /**
   * Returns a `Deno.FileInfo` for the given file stream.
   *
   * ```ts
   * import { assert } from "jsr:@std/assert";
   *
   * const file = await Deno.open("file.txt", { read: true });
   * const fileInfo = await Deno.fstat(file.rid);
   * assert(fileInfo.isFile);
   * ```
   *
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   *
   * @category File System
   */
  export function fstat(rid: number): Promise<FileInfo>

  /**
   * Synchronously returns a {@linkcode Deno.FileInfo} for the given file
   * stream.
   *
   * ```ts
   * import { assert } from "jsr:@std/assert";
   *
   * const file = Deno.openSync("file.txt", { read: true });
   * const fileInfo = Deno.fstatSync(file.rid);
   * assert(fileInfo.isFile);
   * ```
   *
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   *
   * @category File System
   */
  export function fstatSync(rid: number): FileInfo

  /**
   * Synchronously changes the access (`atime`) and modification (`mtime`) times
   * of a file system object referenced by `path`. Given times are either in
   * seconds (UNIX epoch time) or as `Date` objects.
   *
   * ```ts
   * Deno.utimeSync("myfile.txt", 1556495550, new Date());
   * ```
   *
   * Requires `allow-write` permission.
   *
   * @tags allow-write
   * @category File System
   */
  export function utimeSync(path: string | URL, atime: number | Date, mtime: number | Date): void

  /**
   * Changes the access (`atime`) and modification (`mtime`) times of a file
   * system object referenced by `path`. Given times are either in seconds
   * (UNIX epoch time) or as `Date` objects.
   *
   * ```ts
   * await Deno.utime("myfile.txt", 1556495550, new Date());
   * ```
   *
   * Requires `allow-write` permission.
   *
   * @tags allow-write
   * @category File System
   */
  export function utime(
    path: string | URL,
    atime: number | Date,
    mtime: number | Date
  ): Promise<void>

  /** The event yielded from an {@linkcode HttpConn} which represents an HTTP
   * request from a remote client.
   *
   * @category HTTP Server
   *
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   */
  export interface RequestEvent {
    /** The request from the client in the form of the web platform
     * {@linkcode Request}. */
    readonly request: Request
    /** The method to be used to respond to the event. The response needs to
     * either be an instance of {@linkcode Response} or a promise that resolves
     * with an instance of `Response`.
     *
     * When the response is successfully processed then the promise returned
     * will be resolved. If there are any issues with sending the response,
     * the promise will be rejected. */
    respondWith(r: Response | PromiseLike<Response>): Promise<void>
  }

  /**
   * The async iterable that is returned from {@linkcode serveHttp} which
   * yields up {@linkcode RequestEvent} events, representing individual
   * requests on the HTTP server connection.
   *
   * @category HTTP Server
   *
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   */
  export interface HttpConn extends AsyncIterable<RequestEvent>, Disposable {
    /** The resource ID associated with this connection. Generally users do not
     * need to be aware of this identifier. */
    readonly rid: number

    /** An alternative to the async iterable interface which provides promises
     * which resolve with either a {@linkcode RequestEvent} when there is
     * another request or `null` when the client has closed the connection. */
    nextRequest(): Promise<RequestEvent | null>
    /** Initiate a server side closure of the connection, indicating to the
     * client that you refuse to accept any more requests on this connection.
     *
     * Typically the client closes the connection, which will result in the
     * async iterable terminating or the `nextRequest()` method returning
     * `null`. */
    close(): void
  }

  /**
   * Provides an interface to handle HTTP request and responses over TCP or TLS
   * connections. The method returns an {@linkcode HttpConn} which yields up
   * {@linkcode RequestEvent} events, which utilize the web platform standard
   * {@linkcode Request} and {@linkcode Response} objects to handle the request.
   *
   * ```ts
   * const conn = Deno.listen({ port: 80 });
   * const httpConn = Deno.serveHttp(await conn.accept());
   * const e = await httpConn.nextRequest();
   * if (e) {
   *   e.respondWith(new Response("Hello World"));
   * }
   * ```
   *
   * Alternatively, you can also use the async iterator approach:
   *
   * ```ts
   * async function handleHttp(conn: Deno.Conn) {
   *   for await (const e of Deno.serveHttp(conn)) {
   *     e.respondWith(new Response("Hello World"));
   *   }
   * }
   *
   * for await (const conn of Deno.listen({ port: 80 })) {
   *   handleHttp(conn);
   * }
   * ```
   *
   * If `httpConn.nextRequest()` encounters an error or returns `null` then the
   * underlying {@linkcode HttpConn} resource is closed automatically.
   *
   * Also see the experimental Flash HTTP server {@linkcode Deno.serve} which
   * provides a ground up rewrite of handling of HTTP requests and responses
   * within the Deno CLI.
   *
   * Note that this function *consumes* the given connection passed to it, thus
   * the original connection will be unusable after calling this. Additionally,
   * you need to ensure that the connection is not being used elsewhere when
   * calling this function in order for the connection to be consumed properly.
   *
   * For instance, if there is a `Promise` that is waiting for read operation on
   * the connection to complete, it is considered that the connection is being
   * used elsewhere. In such a case, this function will fail.
   *
   * @category HTTP Server
   * @deprecated This will be soft-removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   */
  export function serveHttp(conn: Conn): HttpConn

  /** The object that is returned from a {@linkcode Deno.upgradeWebSocket}
   * request.
   *
   * @category Web Sockets */
  export interface WebSocketUpgrade {
    /** The response object that represents the HTTP response to the client,
     * which should be used to the {@linkcode RequestEvent} `.respondWith()` for
     * the upgrade to be successful. */
    response: Response
    /** The {@linkcode WebSocket} interface to communicate to the client via a
     * web socket. */
    socket: WebSocket
  }

  /** Options which can be set when performing a
   * {@linkcode Deno.upgradeWebSocket} upgrade of a {@linkcode Request}
   *
   * @category Web Sockets */
  export interface UpgradeWebSocketOptions {
    /** Sets the `.protocol` property on the client side web socket to the
     * value provided here, which should be one of the strings specified in the
     * `protocols` parameter when requesting the web socket. This is intended
     * for clients and servers to specify sub-protocols to use to communicate to
     * each other. */
    protocol?: string
    /** If the client does not respond to this frame with a
     * `pong` within the timeout specified, the connection is deemed
     * unhealthy and is closed. The `close` and `error` event will be emitted.
     *
     * The unit is seconds, with a default of 30.
     * Set to `0` to disable timeouts. */
    idleTimeout?: number
  }

  /**
   * Upgrade an incoming HTTP request to a WebSocket.
   *
   * Given a {@linkcode Request}, returns a pair of {@linkcode WebSocket} and
   * {@linkcode Response} instances. The original request must be responded to
   * with the returned response for the websocket upgrade to be successful.
   *
   * ```ts
   * const conn = Deno.listen({ port: 80 });
   * const httpConn = Deno.serveHttp(await conn.accept());
   * const e = await httpConn.nextRequest();
   * if (e) {
   *   const { socket, response } = Deno.upgradeWebSocket(e.request);
   *   socket.onopen = () => {
   *     socket.send("Hello World!");
   *   };
   *   socket.onmessage = (e) => {
   *     console.log(e.data);
   *     socket.close();
   *   };
   *   socket.onclose = () => console.log("WebSocket has been closed.");
   *   socket.onerror = (e) => console.error("WebSocket error:", e);
   *   e.respondWith(response);
   * }
   * ```
   *
   * If the request body is disturbed (read from) before the upgrade is
   * completed, upgrading fails.
   *
   * This operation does not yet consume the request or open the websocket. This
   * only happens once the returned response has been passed to `respondWith()`.
   *
   * @category Web Sockets
   */
  export function upgradeWebSocket(
    request: Request,
    options?: UpgradeWebSocketOptions
  ): WebSocketUpgrade

  /** Send a signal to process under given `pid`. The value and meaning of the
   * `signal` to the process is operating system and process dependant.
   * {@linkcode Signal} provides the most common signals. Default signal
   * is `"SIGTERM"`.
   *
   * The term `kill` is adopted from the UNIX-like command line command `kill`
   * which also signals processes.
   *
   * If `pid` is negative, the signal will be sent to the process group
   * identified by `pid`. An error will be thrown if a negative `pid` is used on
   * Windows.
   *
   * ```ts
   * const p = Deno.run({
   *   cmd: ["sleep", "10000"]
   * });
   *
   * Deno.kill(p.pid, "SIGINT");
   * ```
   *
   * Requires `allow-run` permission.
   *
   * @tags allow-run
   * @category Sub Process
   */
  export function kill(pid: number, signo?: Signal): void

  /** The type of the resource record to resolve via DNS using
   * {@linkcode Deno.resolveDns}.
   *
   * Only the listed types are supported currently.
   *
   * @category Network
   */
  export type RecordType =
    | 'A'
    | 'AAAA'
    | 'ANAME'
    | 'CAA'
    | 'CNAME'
    | 'MX'
    | 'NAPTR'
    | 'NS'
    | 'PTR'
    | 'SOA'
    | 'SRV'
    | 'TXT'

  /**
   * Options which can be set when using {@linkcode Deno.resolveDns}.
   *
   * @category Network */
  export interface ResolveDnsOptions {
    /** The name server to be used for lookups.
     *
     * If not specified, defaults to the system configuration. For example
     * `/etc/resolv.conf` on Unix-like systems. */
    nameServer?: {
      /** The IP address of the name server. */
      ipAddr: string
      /** The port number the query will be sent to.
       *
       * @default {53} */
      port?: number
    }
    /**
     * An abort signal to allow cancellation of the DNS resolution operation.
     * If the signal becomes aborted the resolveDns operation will be stopped
     * and the promise returned will be rejected with an AbortError.
     */
    signal?: AbortSignal
  }

  /** If {@linkcode Deno.resolveDns} is called with `"CAA"` record type
   * specified, it will resolve with an array of objects with this interface.
   *
   * @category Network
   */
  export interface CAARecord {
    /** If `true`, indicates that the corresponding property tag **must** be
     * understood if the semantics of the CAA record are to be correctly
     * interpreted by an issuer.
     *
     * Issuers **must not** issue certificates for a domain if the relevant CAA
     * Resource Record set contains unknown property tags that have `critical`
     * set. */
    critical: boolean
    /** An string that represents the identifier of the property represented by
     * the record. */
    tag: string
    /** The value associated with the tag. */
    value: string
  }

  /** If {@linkcode Deno.resolveDns} is called with `"MX"` record type
   * specified, it will return an array of objects with this interface.
   *
   * @category Network */
  export interface MXRecord {
    /** A priority value, which is a relative value compared to the other
     * preferences of MX records for the domain. */
    preference: number
    /** The server that mail should be delivered to. */
    exchange: string
  }

  /** If {@linkcode Deno.resolveDns} is called with `"NAPTR"` record type
   * specified, it will return an array of objects with this interface.
   *
   * @category Network */
  export interface NAPTRRecord {
    order: number
    preference: number
    flags: string
    services: string
    regexp: string
    replacement: string
  }

  /** If {@linkcode Deno.resolveDns} is called with `"SOA"` record type
   * specified, it will return an array of objects with this interface.
   *
   * @category Network */
  export interface SOARecord {
    mname: string
    rname: string
    serial: number
    refresh: number
    retry: number
    expire: number
    minimum: number
  }

  /** If {@linkcode Deno.resolveDns} is called with `"SRV"` record type
   * specified, it will return an array of objects with this interface.
   *
   * @category Network
   */
  export interface SRVRecord {
    priority: number
    weight: number
    port: number
    target: string
  }

  /**
   * Performs DNS resolution against the given query, returning resolved
   * records.
   *
   * Fails in the cases such as:
   *
   * - the query is in invalid format.
   * - the options have an invalid parameter. For example `nameServer.port` is
   *   beyond the range of 16-bit unsigned integer.
   * - the request timed out.
   *
   * ```ts
   * const a = await Deno.resolveDns("example.com", "A");
   *
   * const aaaa = await Deno.resolveDns("example.com", "AAAA", {
   *   nameServer: { ipAddr: "8.8.8.8", port: 53 },
   * });
   * ```
   *
   * Requires `allow-net` permission.
   *
   * @tags allow-net
   * @category Network
   */
  export function resolveDns(
    query: string,
    recordType: 'A' | 'AAAA' | 'ANAME' | 'CNAME' | 'NS' | 'PTR',
    options?: ResolveDnsOptions
  ): Promise<string[]>

  /**
   * Performs DNS resolution against the given query, returning resolved
   * records.
   *
   * Fails in the cases such as:
   *
   * - the query is in invalid format.
   * - the options have an invalid parameter. For example `nameServer.port` is
   *   beyond the range of 16-bit unsigned integer.
   * - the request timed out.
   *
   * ```ts
   * const a = await Deno.resolveDns("example.com", "A");
   *
   * const aaaa = await Deno.resolveDns("example.com", "AAAA", {
   *   nameServer: { ipAddr: "8.8.8.8", port: 53 },
   * });
   * ```
   *
   * Requires `allow-net` permission.
   *
   * @tags allow-net
   * @category Network
   */
  export function resolveDns(
    query: string,
    recordType: 'CAA',
    options?: ResolveDnsOptions
  ): Promise<CAARecord[]>

  /**
   * Performs DNS resolution against the given query, returning resolved
   * records.
   *
   * Fails in the cases such as:
   *
   * - the query is in invalid format.
   * - the options have an invalid parameter. For example `nameServer.port` is
   *   beyond the range of 16-bit unsigned integer.
   * - the request timed out.
   *
   * ```ts
   * const a = await Deno.resolveDns("example.com", "A");
   *
   * const aaaa = await Deno.resolveDns("example.com", "AAAA", {
   *   nameServer: { ipAddr: "8.8.8.8", port: 53 },
   * });
   * ```
   *
   * Requires `allow-net` permission.
   *
   * @tags allow-net
   * @category Network
   */
  export function resolveDns(
    query: string,
    recordType: 'MX',
    options?: ResolveDnsOptions
  ): Promise<MXRecord[]>

  /**
   * Performs DNS resolution against the given query, returning resolved
   * records.
   *
   * Fails in the cases such as:
   *
   * - the query is in invalid format.
   * - the options have an invalid parameter. For example `nameServer.port` is
   *   beyond the range of 16-bit unsigned integer.
   * - the request timed out.
   *
   * ```ts
   * const a = await Deno.resolveDns("example.com", "A");
   *
   * const aaaa = await Deno.resolveDns("example.com", "AAAA", {
   *   nameServer: { ipAddr: "8.8.8.8", port: 53 },
   * });
   * ```
   *
   * Requires `allow-net` permission.
   *
   * @tags allow-net
   * @category Network
   */
  export function resolveDns(
    query: string,
    recordType: 'NAPTR',
    options?: ResolveDnsOptions
  ): Promise<NAPTRRecord[]>

  /**
   * Performs DNS resolution against the given query, returning resolved
   * records.
   *
   * Fails in the cases such as:
   *
   * - the query is in invalid format.
   * - the options have an invalid parameter. For example `nameServer.port` is
   *   beyond the range of 16-bit unsigned integer.
   * - the request timed out.
   *
   * ```ts
   * const a = await Deno.resolveDns("example.com", "A");
   *
   * const aaaa = await Deno.resolveDns("example.com", "AAAA", {
   *   nameServer: { ipAddr: "8.8.8.8", port: 53 },
   * });
   * ```
   *
   * Requires `allow-net` permission.
   *
   * @tags allow-net
   * @category Network
   */
  export function resolveDns(
    query: string,
    recordType: 'SOA',
    options?: ResolveDnsOptions
  ): Promise<SOARecord[]>

  /**
   * Performs DNS resolution against the given query, returning resolved
   * records.
   *
   * Fails in the cases such as:
   *
   * - the query is in invalid format.
   * - the options have an invalid parameter. For example `nameServer.port` is
   *   beyond the range of 16-bit unsigned integer.
   * - the request timed out.
   *
   * ```ts
   * const a = await Deno.resolveDns("example.com", "A");
   *
   * const aaaa = await Deno.resolveDns("example.com", "AAAA", {
   *   nameServer: { ipAddr: "8.8.8.8", port: 53 },
   * });
   * ```
   *
   * Requires `allow-net` permission.
   *
   * @tags allow-net
   * @category Network
   */
  export function resolveDns(
    query: string,
    recordType: 'SRV',
    options?: ResolveDnsOptions
  ): Promise<SRVRecord[]>

  /**
   * Performs DNS resolution against the given query, returning resolved
   * records.
   *
   * Fails in the cases such as:
   *
   * - the query is in invalid format.
   * - the options have an invalid parameter. For example `nameServer.port` is
   *   beyond the range of 16-bit unsigned integer.
   * - the request timed out.
   *
   * ```ts
   * const a = await Deno.resolveDns("example.com", "A");
   *
   * const aaaa = await Deno.resolveDns("example.com", "AAAA", {
   *   nameServer: { ipAddr: "8.8.8.8", port: 53 },
   * });
   * ```
   *
   * Requires `allow-net` permission.
   *
   * @tags allow-net
   * @category Network
   */
  export function resolveDns(
    query: string,
    recordType: 'TXT',
    options?: ResolveDnsOptions
  ): Promise<string[][]>

  /**
   * Performs DNS resolution against the given query, returning resolved
   * records.
   *
   * Fails in the cases such as:
   *
   * - the query is in invalid format.
   * - the options have an invalid parameter. For example `nameServer.port` is
   *   beyond the range of 16-bit unsigned integer.
   * - the request timed out.
   *
   * ```ts
   * const a = await Deno.resolveDns("example.com", "A");
   *
   * const aaaa = await Deno.resolveDns("example.com", "AAAA", {
   *   nameServer: { ipAddr: "8.8.8.8", port: 53 },
   * });
   * ```
   *
   * Requires `allow-net` permission.
   *
   * @tags allow-net
   * @category Network
   */
  export function resolveDns(
    query: string,
    recordType: RecordType,
    options?: ResolveDnsOptions
  ): Promise<
    string[] | CAARecord[] | MXRecord[] | NAPTRRecord[] | SOARecord[] | SRVRecord[] | string[][]
  >

  /**
   * Make the timer of the given `id` block the event loop from finishing.
   *
   * @category Runtime
   */
  export function refTimer(id: number): void

  /**
   * Make the timer of the given `id` not block the event loop from finishing.
   *
   * @category Runtime
   */
  export function unrefTimer(id: number): void

  /**
   * Returns the user id of the process on POSIX platforms. Returns null on Windows.
   *
   * ```ts
   * console.log(Deno.uid());
   * ```
   *
   * Requires `allow-sys` permission.
   *
   * @tags allow-sys
   * @category Runtime
   */
  export function uid(): number | null

  /**
   * Returns the group id of the process on POSIX platforms. Returns null on windows.
   *
   * ```ts
   * console.log(Deno.gid());
   * ```
   *
   * Requires `allow-sys` permission.
   *
   * @tags allow-sys
   * @category Runtime
   */
  export function gid(): number | null

  /** Additional information for an HTTP request and its connection.
   *
   * @category HTTP Server
   */
  export interface ServeHandlerInfo {
    /** The remote address of the connection. */
    remoteAddr: Deno.NetAddr
  }

  /** A handler for HTTP requests. Consumes a request and returns a response.
   *
   * If a handler throws, the server calling the handler will assume the impact
   * of the error is isolated to the individual request. It will catch the error
   * and if necessary will close the underlying connection.
   *
   * @category HTTP Server
   */
  export type ServeHandler = (
    request: Request,
    info: ServeHandlerInfo
  ) => Response | Promise<Response>

  /** Options which can be set when calling {@linkcode Deno.serve}.
   *
   * @category HTTP Server
   */
  export interface ServeOptions {
    /** The port to listen on.
     *
     * Set to `0` to listen on any available port.
     *
     * @default {8000} */
    port?: number

    /** A literal IP address or host name that can be resolved to an IP address.
     *
     * __Note about `0.0.0.0`__ While listening `0.0.0.0` works on all platforms,
     * the browsers on Windows don't work with the address `0.0.0.0`.
     * You should show the message like `server running on localhost:8080` instead of
     * `server running on 0.0.0.0:8080` if your program supports Windows.
     *
     * @default {"0.0.0.0"} */
    hostname?: string

    /** An {@linkcode AbortSignal} to close the server and all connections. */
    signal?: AbortSignal

    /** Sets `SO_REUSEPORT` on POSIX systems. */
    reusePort?: boolean

    /** The handler to invoke when route handlers throw an error. */
    onError?: (error: unknown) => Response | Promise<Response>

    /** The callback which is called when the server starts listening. */
    onListen?: (localAddr: Deno.NetAddr) => void
  }

  /** Additional options which are used when opening a TLS (HTTPS) server.
   *
   * @category HTTP Server
   */
  export interface ServeTlsOptions extends ServeOptions {
    /**
     * Server private key in PEM format. Use {@linkcode TlsCertifiedKeyOptions} instead.
     *
     * @deprecated This will be removed in Deno 2.0. See the
     * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
     * for migration instructions.
     */
    cert?: string

    /**
     * Cert chain in PEM format.  Use {@linkcode TlsCertifiedKeyOptions} instead.
     *
     * @deprecated This will be removed in Deno 2.0. See the
     * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
     * for migration instructions.
     */
    key?: string
  }

  /**
   * @category HTTP Server
   */
  export interface ServeInit {
    /** The handler to invoke to process each incoming request. */
    handler: ServeHandler
  }

  /**
   * @category HTTP Server
   */
  export interface ServeTlsInit {
    /** The handler to invoke to process each incoming request. */
    handler: ServeHandler
  }

  /** @category HTTP Server */
  export interface ServeUnixOptions {
    /** The unix domain socket path to listen on. */
    path: string

    /** An {@linkcode AbortSignal} to close the server and all connections. */
    signal?: AbortSignal

    /** The handler to invoke when route handlers throw an error. */
    onError?: (error: unknown) => Response | Promise<Response>

    /** The callback which is called when the server starts listening. */
    onListen?: (localAddr: Deno.UnixAddr) => void
  }

  /** Information for a unix domain socket HTTP request.
   *
   * @category HTTP Server
   */
  export interface ServeUnixHandlerInfo {
    /** The remote address of the connection. */
    remoteAddr: Deno.UnixAddr
  }

  /** A handler for unix domain socket HTTP requests. Consumes a request and returns a response.
   *
   * If a handler throws, the server calling the handler will assume the impact
   * of the error is isolated to the individual request. It will catch the error
   * and if necessary will close the underlying connection.
   *
   * @category HTTP Server
   */
  export type ServeUnixHandler = (
    request: Request,
    info: ServeUnixHandlerInfo
  ) => Response | Promise<Response>

  /**
   * @category HTTP Server
   */
  export interface ServeUnixInit {
    /** The handler to invoke to process each incoming request. */
    handler: ServeUnixHandler
  }

  /** An instance of the server created using `Deno.serve()` API.
   *
   * @category HTTP Server
   */
  export interface HttpServer<A extends Deno.Addr = Deno.Addr> extends AsyncDisposable {
    /** A promise that resolves once server finishes - eg. when aborted using
     * the signal passed to {@linkcode ServeOptions.signal}.
     */
    finished: Promise<void>

    /** The local address this server is listening on. */
    addr: A

    /**
     * Make the server block the event loop from finishing.
     *
     * Note: the server blocks the event loop from finishing by default.
     * This method is only meaningful after `.unref()` is called.
     */
    ref(): void

    /** Make the server not block the event loop from finishing. */
    unref(): void

    /** Gracefully close the server. No more new connections will be accepted,
     * while pending requests will be allowed to finish.
     */
    shutdown(): Promise<void>
  }

  /**
   * @category HTTP Server
   *
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   */
  export type Server = HttpServer

  /** Serves HTTP requests with the given handler.
   *
   * The below example serves with the port `8000` on hostname `"127.0.0.1"`.
   *
   * ```ts
   * Deno.serve((_req) => new Response("Hello, world"));
   * ```
   *
   * @category HTTP Server
   */
  export function serve(handler: ServeHandler): HttpServer<Deno.NetAddr>
  /** Serves HTTP requests with the given option bag and handler.
   *
   * You can specify the socket path with `path` option.
   *
   * ```ts
   * Deno.serve(
   *   { path: "path/to/socket" },
   *   (_req) => new Response("Hello, world")
   * );
   * ```
   *
   * You can stop the server with an {@linkcode AbortSignal}. The abort signal
   * needs to be passed as the `signal` option in the options bag. The server
   * aborts when the abort signal is aborted. To wait for the server to close,
   * await the promise returned from the `Deno.serve` API.
   *
   * ```ts
   * const ac = new AbortController();
   *
   * const server = Deno.serve(
   *    { signal: ac.signal, path: "path/to/socket" },
   *    (_req) => new Response("Hello, world")
   * );
   * server.finished.then(() => console.log("Server closed"));
   *
   * console.log("Closing server...");
   * ac.abort();
   * ```
   *
   * By default `Deno.serve` prints the message
   * `Listening on path/to/socket` on listening. If you like to
   * change this behavior, you can specify a custom `onListen` callback.
   *
   * ```ts
   * Deno.serve({
   *   onListen({ path }) {
   *     console.log(`Server started at ${path}`);
   *     // ... more info specific to your server ..
   *   },
   *   path: "path/to/socket",
   * }, (_req) => new Response("Hello, world"));
   * ```
   *
   * @category HTTP Server
   */
  export function serve(
    options: ServeUnixOptions,
    handler: ServeUnixHandler
  ): HttpServer<Deno.UnixAddr>
  /** Serves HTTP requests with the given option bag and handler.
   *
   * You can specify an object with a port and hostname option, which is the
   * address to listen on. The default is port `8000` on hostname `"127.0.0.1"`.
   *
   * You can change the address to listen on using the `hostname` and `port`
   * options. The below example serves on port `3000` and hostname `"0.0.0.0"`.
   *
   * ```ts
   * Deno.serve(
   *   { port: 3000, hostname: "0.0.0.0" },
   *   (_req) => new Response("Hello, world")
   * );
   * ```
   *
   * You can stop the server with an {@linkcode AbortSignal}. The abort signal
   * needs to be passed as the `signal` option in the options bag. The server
   * aborts when the abort signal is aborted. To wait for the server to close,
   * await the promise returned from the `Deno.serve` API.
   *
   * ```ts
   * const ac = new AbortController();
   *
   * const server = Deno.serve(
   *    { signal: ac.signal },
   *    (_req) => new Response("Hello, world")
   * );
   * server.finished.then(() => console.log("Server closed"));
   *
   * console.log("Closing server...");
   * ac.abort();
   * ```
   *
   * By default `Deno.serve` prints the message
   * `Listening on http://<hostname>:<port>/` on listening. If you like to
   * change this behavior, you can specify a custom `onListen` callback.
   *
   * ```ts
   * Deno.serve({
   *   onListen({ port, hostname }) {
   *     console.log(`Server started at http://${hostname}:${port}`);
   *     // ... more info specific to your server ..
   *   },
   * }, (_req) => new Response("Hello, world"));
   * ```
   *
   * To enable TLS you must specify the `key` and `cert` options.
   *
   * ```ts
   * const cert = "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----\n";
   * const key = "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n";
   * Deno.serve({ cert, key }, (_req) => new Response("Hello, world"));
   * ```
   *
   * @category HTTP Server
   */
  export function serve(options: ServeOptions, handler: ServeHandler): HttpServer<Deno.NetAddr>
  /** Serves HTTP requests with the given option bag and handler.
   *
   * You can specify an object with a port and hostname option, which is the
   * address to listen on. The default is port `8000` on hostname `"127.0.0.1"`.
   *
   * You can change the address to listen on using the `hostname` and `port`
   * options. The below example serves on port `3000` and hostname `"0.0.0.0"`.
   *
   * ```ts
   * Deno.serve(
   *   { port: 3000, hostname: "0.0.0.0" },
   *   (_req) => new Response("Hello, world")
   * );
   * ```
   *
   * You can stop the server with an {@linkcode AbortSignal}. The abort signal
   * needs to be passed as the `signal` option in the options bag. The server
   * aborts when the abort signal is aborted. To wait for the server to close,
   * await the promise returned from the `Deno.serve` API.
   *
   * ```ts
   * const ac = new AbortController();
   *
   * const server = Deno.serve(
   *    { signal: ac.signal },
   *    (_req) => new Response("Hello, world")
   * );
   * server.finished.then(() => console.log("Server closed"));
   *
   * console.log("Closing server...");
   * ac.abort();
   * ```
   *
   * By default `Deno.serve` prints the message
   * `Listening on http://<hostname>:<port>/` on listening. If you like to
   * change this behavior, you can specify a custom `onListen` callback.
   *
   * ```ts
   * Deno.serve({
   *   onListen({ port, hostname }) {
   *     console.log(`Server started at http://${hostname}:${port}`);
   *     // ... more info specific to your server ..
   *   },
   * }, (_req) => new Response("Hello, world"));
   * ```
   *
   * To enable TLS you must specify the `key` and `cert` options.
   *
   * ```ts
   * const cert = "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----\n";
   * const key = "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n";
   * Deno.serve({ cert, key }, (_req) => new Response("Hello, world"));
   * ```
   *
   * @category HTTP Server
   */
  export function serve(
    options: ServeTlsOptions | (ServeTlsOptions & TlsCertifiedKeyOptions),
    handler: ServeHandler
  ): HttpServer<Deno.NetAddr>
  /** Serves HTTP requests with the given option bag.
   *
   * You can specify an object with the path option, which is the
   * unix domain socket to listen on.
   *
   * ```ts
   * const ac = new AbortController();
   *
   * const server = Deno.serve({
   *   path: "path/to/socket",
   *   handler: (_req) => new Response("Hello, world"),
   *   signal: ac.signal,
   *   onListen({ path }) {
   *     console.log(`Server started at ${path}`);
   *   },
   * });
   * server.finished.then(() => console.log("Server closed"));
   *
   * console.log("Closing server...");
   * ac.abort();
   * ```
   *
   * @category HTTP Server
   */
  export function serve(options: ServeUnixInit & ServeUnixOptions): HttpServer<Deno.UnixAddr>
  /** Serves HTTP requests with the given option bag.
   *
   * You can specify an object with a port and hostname option, which is the
   * address to listen on. The default is port `8000` on hostname `"127.0.0.1"`.
   *
   * ```ts
   * const ac = new AbortController();
   *
   * const server = Deno.serve({
   *   port: 3000,
   *   hostname: "0.0.0.0",
   *   handler: (_req) => new Response("Hello, world"),
   *   signal: ac.signal,
   *   onListen({ port, hostname }) {
   *     console.log(`Server started at http://${hostname}:${port}`);
   *   },
   * });
   * server.finished.then(() => console.log("Server closed"));
   *
   * console.log("Closing server...");
   * ac.abort();
   * ```
   *
   * @category HTTP Server
   */
  export function serve(options: ServeInit & ServeOptions): HttpServer<Deno.NetAddr>
  /** Serves HTTP requests with the given option bag.
   *
   * You can specify an object with a port and hostname option, which is the
   * address to listen on. The default is port `8000` on hostname `"127.0.0.1"`.
   *
   * ```ts
   * const ac = new AbortController();
   *
   * const server = Deno.serve({
   *   port: 3000,
   *   hostname: "0.0.0.0",
   *   handler: (_req) => new Response("Hello, world"),
   *   signal: ac.signal,
   *   onListen({ port, hostname }) {
   *     console.log(`Server started at http://${hostname}:${port}`);
   *   },
   * });
   * server.finished.then(() => console.log("Server closed"));
   *
   * console.log("Closing server...");
   * ac.abort();
   * ```
   *
   * @category HTTP Server
   */
  export function serve(
    options: ServeTlsInit & (ServeTlsOptions | (ServeTlsOptions & TlsCertifiedKeyOptions))
  ): HttpServer<Deno.NetAddr>
}

// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// deno-lint-ignore-file no-explicit-any

/// <reference no-default-lib="true" />
/// <reference lib="esnext" />

/** @category I/O */
declare interface Console {
  assert(condition?: boolean, ...data: any[]): void
  clear(): void
  count(label?: string): void
  countReset(label?: string): void
  debug(...data: any[]): void
  dir(item?: any, options?: any): void
  dirxml(...data: any[]): void
  error(...data: any[]): void
  group(...data: any[]): void
  groupCollapsed(...data: any[]): void
  groupEnd(): void
  info(...data: any[]): void
  log(...data: any[]): void
  table(tabularData?: any, properties?: string[]): void
  time(label?: string): void
  timeEnd(label?: string): void
  timeLog(label?: string, ...data: any[]): void
  trace(...data: any[]): void
  warn(...data: any[]): void

  /** This method is a noop, unless used in inspector */
  timeStamp(label?: string): void

  /** This method is a noop, unless used in inspector */
  profile(label?: string): void

  /** This method is a noop, unless used in inspector */
  profileEnd(label?: string): void
}

// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// deno-lint-ignore-file no-explicit-any no-var

/// <reference no-default-lib="true" />
/// <reference lib="esnext" />

/** @category URL */
declare interface URLSearchParams {
  /** Appends a specified key/value pair as a new search parameter.
   *
   * ```ts
   * let searchParams = new URLSearchParams();
   * searchParams.append('name', 'first');
   * searchParams.append('name', 'second');
   * ```
   */
  append(name: string, value: string): void

  /** Deletes search parameters that match a name, and optional value,
   * from the list of all search parameters.
   *
   * ```ts
   * let searchParams = new URLSearchParams([['name', 'value']]);
   * searchParams.delete('name');
   * searchParams.delete('name', 'value');
   * ```
   */
  delete(name: string, value?: string): void

  /** Returns all the values associated with a given search parameter
   * as an array.
   *
   * ```ts
   * searchParams.getAll('name');
   * ```
   */
  getAll(name: string): string[]

  /** Returns the first value associated to the given search parameter.
   *
   * ```ts
   * searchParams.get('name');
   * ```
   */
  get(name: string): string | null

  /** Returns a boolean value indicating if a given parameter,
   * or parameter and value pair, exists.
   *
   * ```ts
   * searchParams.has('name');
   * searchParams.has('name', 'value');
   * ```
   */
  has(name: string, value?: string): boolean

  /** Sets the value associated with a given search parameter to the
   * given value. If there were several matching values, this method
   * deletes the others. If the search parameter doesn't exist, this
   * method creates it.
   *
   * ```ts
   * searchParams.set('name', 'value');
   * ```
   */
  set(name: string, value: string): void

  /** Sort all key/value pairs contained in this object in place and
   * return undefined. The sort order is according to Unicode code
   * points of the keys.
   *
   * ```ts
   * searchParams.sort();
   * ```
   */
  sort(): void

  /** Calls a function for each element contained in this object in
   * place and return undefined. Optionally accepts an object to use
   * as this when executing callback as second argument.
   *
   * ```ts
   * const params = new URLSearchParams([["a", "b"], ["c", "d"]]);
   * params.forEach((value, key, parent) => {
   *   console.log(value, key, parent);
   * });
   * ```
   */
  forEach(callbackfn: (value: string, key: string, parent: this) => void, thisArg?: any): void

  /** Returns an iterator allowing to go through all keys contained
   * in this object.
   *
   * ```ts
   * const params = new URLSearchParams([["a", "b"], ["c", "d"]]);
   * for (const key of params.keys()) {
   *   console.log(key);
   * }
   * ```
   */
  keys(): IterableIterator<string>

  /** Returns an iterator allowing to go through all values contained
   * in this object.
   *
   * ```ts
   * const params = new URLSearchParams([["a", "b"], ["c", "d"]]);
   * for (const value of params.values()) {
   *   console.log(value);
   * }
   * ```
   */
  values(): IterableIterator<string>

  /** Returns an iterator allowing to go through all key/value
   * pairs contained in this object.
   *
   * ```ts
   * const params = new URLSearchParams([["a", "b"], ["c", "d"]]);
   * for (const [key, value] of params.entries()) {
   *   console.log(key, value);
   * }
   * ```
   */
  entries(): IterableIterator<[string, string]>

  /** Returns an iterator allowing to go through all key/value
   * pairs contained in this object.
   *
   * ```ts
   * const params = new URLSearchParams([["a", "b"], ["c", "d"]]);
   * for (const [key, value] of params) {
   *   console.log(key, value);
   * }
   * ```
   */
  [Symbol.iterator](): IterableIterator<[string, string]>

  /** Returns a query string suitable for use in a URL.
   *
   * ```ts
   * searchParams.toString();
   * ```
   */
  toString(): string

  /** Contains the number of search parameters
   *
   * ```ts
   * searchParams.size
   * ```
   */
  size: number
}

/** @category URL */
declare var URLSearchParams: {
  readonly prototype: URLSearchParams
  new (init?: Iterable<string[]> | Record<string, string> | string): URLSearchParams
}

/** The URL interface represents an object providing static methods used for
 * creating object URLs.
 *
 * @category URL
 */
declare interface URL {
  hash: string
  host: string
  hostname: string
  href: string
  toString(): string
  readonly origin: string
  password: string
  pathname: string
  port: string
  protocol: string
  search: string
  readonly searchParams: URLSearchParams
  username: string
  toJSON(): string
}

/** The URL interface represents an object providing static methods used for
 * creating object URLs.
 *
 * @category URL
 */
declare var URL: {
  readonly prototype: URL
  new (url: string | URL, base?: string | URL): URL
  parse(url: string | URL, base?: string | URL): URL | null
  canParse(url: string | URL, base?: string | URL): boolean
  createObjectURL(blob: Blob): string
  revokeObjectURL(url: string): void
}

/** @category URL */
declare interface URLPatternInit {
  protocol?: string
  username?: string
  password?: string
  hostname?: string
  port?: string
  pathname?: string
  search?: string
  hash?: string
  baseURL?: string
}

/** @category URL */
declare type URLPatternInput = string | URLPatternInit

/** @category URL */
declare interface URLPatternComponentResult {
  input: string
  groups: Record<string, string | undefined>
}

/** `URLPatternResult` is the object returned from `URLPattern.exec`.
 *
 * @category URL
 */
declare interface URLPatternResult {
  /** The inputs provided when matching. */
  inputs: [URLPatternInit] | [URLPatternInit, string]

  /** The matched result for the `protocol` matcher. */
  protocol: URLPatternComponentResult
  /** The matched result for the `username` matcher. */
  username: URLPatternComponentResult
  /** The matched result for the `password` matcher. */
  password: URLPatternComponentResult
  /** The matched result for the `hostname` matcher. */
  hostname: URLPatternComponentResult
  /** The matched result for the `port` matcher. */
  port: URLPatternComponentResult
  /** The matched result for the `pathname` matcher. */
  pathname: URLPatternComponentResult
  /** The matched result for the `search` matcher. */
  search: URLPatternComponentResult
  /** The matched result for the `hash` matcher. */
  hash: URLPatternComponentResult
}

/**
 * The URLPattern API provides a web platform primitive for matching URLs based
 * on a convenient pattern syntax.
 *
 * The syntax is based on path-to-regexp. Wildcards, named capture groups,
 * regular groups, and group modifiers are all supported.
 *
 * ```ts
 * // Specify the pattern as structured data.
 * const pattern = new URLPattern({ pathname: "/users/:user" });
 * const match = pattern.exec("https://blog.example.com/users/joe");
 * console.log(match.pathname.groups.user); // joe
 * ```
 *
 * ```ts
 * // Specify a fully qualified string pattern.
 * const pattern = new URLPattern("https://example.com/books/:id");
 * console.log(pattern.test("https://example.com/books/123")); // true
 * console.log(pattern.test("https://deno.land/books/123")); // false
 * ```
 *
 * ```ts
 * // Specify a relative string pattern with a base URL.
 * const pattern = new URLPattern("/article/:id", "https://blog.example.com");
 * console.log(pattern.test("https://blog.example.com/article")); // false
 * console.log(pattern.test("https://blog.example.com/article/123")); // true
 * ```
 *
 * @category URL
 */
declare interface URLPattern {
  /**
   * Test if the given input matches the stored pattern.
   *
   * The input can either be provided as an absolute URL string with an optional base,
   * relative URL string with a required base, or as individual components
   * in the form of an `URLPatternInit` object.
   *
   * ```ts
   * const pattern = new URLPattern("https://example.com/books/:id");
   *
   * // Test an absolute url string.
   * console.log(pattern.test("https://example.com/books/123")); // true
   *
   * // Test a relative url with a base.
   * console.log(pattern.test("/books/123", "https://example.com")); // true
   *
   * // Test an object of url components.
   * console.log(pattern.test({ pathname: "/books/123" })); // true
   * ```
   */
  test(input: URLPatternInput, baseURL?: string): boolean

  /**
   * Match the given input against the stored pattern.
   *
   * The input can either be provided as an absolute URL string with an optional base,
   * relative URL string with a required base, or as individual components
   * in the form of an `URLPatternInit` object.
   *
   * ```ts
   * const pattern = new URLPattern("https://example.com/books/:id");
   *
   * // Match an absolute url string.
   * let match = pattern.exec("https://example.com/books/123");
   * console.log(match.pathname.groups.id); // 123
   *
   * // Match a relative url with a base.
   * match = pattern.exec("/books/123", "https://example.com");
   * console.log(match.pathname.groups.id); // 123
   *
   * // Match an object of url components.
   * match = pattern.exec({ pathname: "/books/123" });
   * console.log(match.pathname.groups.id); // 123
   * ```
   */
  exec(input: URLPatternInput, baseURL?: string): URLPatternResult | null

  /** The pattern string for the `protocol`. */
  readonly protocol: string
  /** The pattern string for the `username`. */
  readonly username: string
  /** The pattern string for the `password`. */
  readonly password: string
  /** The pattern string for the `hostname`. */
  readonly hostname: string
  /** The pattern string for the `port`. */
  readonly port: string
  /** The pattern string for the `pathname`. */
  readonly pathname: string
  /** The pattern string for the `search`. */
  readonly search: string
  /** The pattern string for the `hash`. */
  readonly hash: string
}

/**
 * The URLPattern API provides a web platform primitive for matching URLs based
 * on a convenient pattern syntax.
 *
 * The syntax is based on path-to-regexp. Wildcards, named capture groups,
 * regular groups, and group modifiers are all supported.
 *
 * ```ts
 * // Specify the pattern as structured data.
 * const pattern = new URLPattern({ pathname: "/users/:user" });
 * const match = pattern.exec("https://blog.example.com/users/joe");
 * console.log(match.pathname.groups.user); // joe
 * ```
 *
 * ```ts
 * // Specify a fully qualified string pattern.
 * const pattern = new URLPattern("https://example.com/books/:id");
 * console.log(pattern.test("https://example.com/books/123")); // true
 * console.log(pattern.test("https://deno.land/books/123")); // false
 * ```
 *
 * ```ts
 * // Specify a relative string pattern with a base URL.
 * const pattern = new URLPattern("/article/:id", "https://blog.example.com");
 * console.log(pattern.test("https://blog.example.com/article")); // false
 * console.log(pattern.test("https://blog.example.com/article/123")); // true
 * ```
 *
 * @category URL
 */
declare var URLPattern: {
  readonly prototype: URLPattern
  new (input: URLPatternInput, baseURL?: string): URLPattern
}

// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// deno-lint-ignore-file no-explicit-any no-var

/// <reference no-default-lib="true" />
/// <reference lib="esnext" />

/** @category Platform */
declare interface DOMException extends Error {
  readonly name: string
  readonly message: string
  readonly code: number
  readonly INDEX_SIZE_ERR: 1
  readonly DOMSTRING_SIZE_ERR: 2
  readonly HIERARCHY_REQUEST_ERR: 3
  readonly WRONG_DOCUMENT_ERR: 4
  readonly INVALID_CHARACTER_ERR: 5
  readonly NO_DATA_ALLOWED_ERR: 6
  readonly NO_MODIFICATION_ALLOWED_ERR: 7
  readonly NOT_FOUND_ERR: 8
  readonly NOT_SUPPORTED_ERR: 9
  readonly INUSE_ATTRIBUTE_ERR: 10
  readonly INVALID_STATE_ERR: 11
  readonly SYNTAX_ERR: 12
  readonly INVALID_MODIFICATION_ERR: 13
  readonly NAMESPACE_ERR: 14
  readonly INVALID_ACCESS_ERR: 15
  readonly VALIDATION_ERR: 16
  readonly TYPE_MISMATCH_ERR: 17
  readonly SECURITY_ERR: 18
  readonly NETWORK_ERR: 19
  readonly ABORT_ERR: 20
  readonly URL_MISMATCH_ERR: 21
  readonly QUOTA_EXCEEDED_ERR: 22
  readonly TIMEOUT_ERR: 23
  readonly INVALID_NODE_TYPE_ERR: 24
  readonly DATA_CLONE_ERR: 25
}

/** @category Platform */
declare var DOMException: {
  readonly prototype: DOMException
  new (message?: string, name?: string): DOMException
  readonly INDEX_SIZE_ERR: 1
  readonly DOMSTRING_SIZE_ERR: 2
  readonly HIERARCHY_REQUEST_ERR: 3
  readonly WRONG_DOCUMENT_ERR: 4
  readonly INVALID_CHARACTER_ERR: 5
  readonly NO_DATA_ALLOWED_ERR: 6
  readonly NO_MODIFICATION_ALLOWED_ERR: 7
  readonly NOT_FOUND_ERR: 8
  readonly NOT_SUPPORTED_ERR: 9
  readonly INUSE_ATTRIBUTE_ERR: 10
  readonly INVALID_STATE_ERR: 11
  readonly SYNTAX_ERR: 12
  readonly INVALID_MODIFICATION_ERR: 13
  readonly NAMESPACE_ERR: 14
  readonly INVALID_ACCESS_ERR: 15
  readonly VALIDATION_ERR: 16
  readonly TYPE_MISMATCH_ERR: 17
  readonly SECURITY_ERR: 18
  readonly NETWORK_ERR: 19
  readonly ABORT_ERR: 20
  readonly URL_MISMATCH_ERR: 21
  readonly QUOTA_EXCEEDED_ERR: 22
  readonly TIMEOUT_ERR: 23
  readonly INVALID_NODE_TYPE_ERR: 24
  readonly DATA_CLONE_ERR: 25
}

/** @category Events */
declare interface EventInit {
  bubbles?: boolean
  cancelable?: boolean
  composed?: boolean
}

/** An event which takes place in the DOM.
 *
 * @category Events
 */
declare interface Event {
  /** Returns true or false depending on how event was initialized. True if
   * event goes through its target's ancestors in reverse tree order, and
   * false otherwise. */
  readonly bubbles: boolean
  cancelBubble: boolean
  /** Returns true or false depending on how event was initialized. Its return
   * value does not always carry meaning, but true can indicate that part of the
   * operation during which event was dispatched, can be canceled by invoking
   * the preventDefault() method. */
  readonly cancelable: boolean
  /** Returns true or false depending on how event was initialized. True if
   * event invokes listeners past a ShadowRoot node that is the root of its
   * target, and false otherwise. */
  readonly composed: boolean
  /** Returns the object whose event listener's callback is currently being
   * invoked. */
  readonly currentTarget: EventTarget | null
  /** Returns true if preventDefault() was invoked successfully to indicate
   * cancellation, and false otherwise. */
  readonly defaultPrevented: boolean
  /** Returns the event's phase, which is one of NONE, CAPTURING_PHASE,
   * AT_TARGET, and BUBBLING_PHASE. */
  readonly eventPhase: number
  /** Returns true if event was dispatched by the user agent, and false
   * otherwise. */
  readonly isTrusted: boolean
  /** Returns the object to which event is dispatched (its target). */
  readonly target: EventTarget | null
  /** Returns the event's timestamp as the number of milliseconds measured
   * relative to the time origin. */
  readonly timeStamp: number
  /** Returns the type of event, e.g. "click", "hashchange", or "submit". */
  readonly type: string
  /** Returns the invocation target objects of event's path (objects on which
   * listeners will be invoked), except for any nodes in shadow trees of which
   * the shadow root's mode is "closed" that are not reachable from event's
   * currentTarget. */
  composedPath(): EventTarget[]
  /** If invoked when the cancelable attribute value is true, and while
   * executing a listener for the event with passive set to false, signals to
   * the operation that caused event to be dispatched that it needs to be
   * canceled. */
  preventDefault(): void
  /** Invoking this method prevents event from reaching any registered event
   * listeners after the current one finishes running and, when dispatched in a
   * tree, also prevents event from reaching any other objects. */
  stopImmediatePropagation(): void
  /** When dispatched in a tree, invoking this method prevents event from
   * reaching any objects other than the current object. */
  stopPropagation(): void
  readonly AT_TARGET: number
  readonly BUBBLING_PHASE: number
  readonly CAPTURING_PHASE: number
  readonly NONE: number
}

/** An event which takes place in the DOM.
 *
 * @category Events
 */
declare var Event: {
  readonly prototype: Event
  new (type: string, eventInitDict?: EventInit): Event
  readonly AT_TARGET: number
  readonly BUBBLING_PHASE: number
  readonly CAPTURING_PHASE: number
  readonly NONE: number
}

/**
 * EventTarget is a DOM interface implemented by objects that can receive events
 * and may have listeners for them.
 *
 * @category Events
 */
declare interface EventTarget {
  /** Appends an event listener for events whose type attribute value is type.
   * The callback argument sets the callback that will be invoked when the event
   * is dispatched.
   *
   * The options argument sets listener-specific options. For compatibility this
   * can be a boolean, in which case the method behaves exactly as if the value
   * was specified as options's capture.
   *
   * When set to true, options's capture prevents callback from being invoked
   * when the event's eventPhase attribute value is BUBBLING_PHASE. When false
   * (or not present), callback will not be invoked when event's eventPhase
   * attribute value is CAPTURING_PHASE. Either way, callback will be invoked if
   * event's eventPhase attribute value is AT_TARGET.
   *
   * When set to true, options's passive indicates that the callback will not
   * cancel the event by invoking preventDefault(). This is used to enable
   * performance optimizations described in § 2.8 Observing event listeners.
   *
   * When set to true, options's once indicates that the callback will only be
   * invoked once after which the event listener will be removed.
   *
   * The event listener is appended to target's event listener list and is not
   * appended if it has the same type, callback, and capture. */
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions
  ): void
  /** Dispatches a synthetic event to event target and returns true if either
   * event's cancelable attribute value is false or its preventDefault() method
   * was not invoked, and false otherwise. */
  dispatchEvent(event: Event): boolean
  /** Removes the event listener in target's event listener list with the same
   * type, callback, and options. */
  removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean
  ): void
}

/**
 * EventTarget is a DOM interface implemented by objects that can receive events
 * and may have listeners for them.
 *
 * @category Events
 */
declare var EventTarget: {
  readonly prototype: EventTarget
  new (): EventTarget
}

/** @category Events */
declare interface EventListener {
  (evt: Event): void | Promise<void>
}

/** @category Events */
declare interface EventListenerObject {
  handleEvent(evt: Event): void | Promise<void>
}

/** @category Events */
declare type EventListenerOrEventListenerObject = EventListener | EventListenerObject

/** @category Events */
declare interface AddEventListenerOptions extends EventListenerOptions {
  once?: boolean
  passive?: boolean
  signal?: AbortSignal
}

/** @category Events */
declare interface EventListenerOptions {
  capture?: boolean
}

/** @category Events */
declare interface ProgressEventInit extends EventInit {
  lengthComputable?: boolean
  loaded?: number
  total?: number
}

/** Events measuring progress of an underlying process, like an HTTP request
 * (for an XMLHttpRequest, or the loading of the underlying resource of an
 * <img>, <audio>, <video>, <style> or <link>).
 *
 * @category Events
 */
declare interface ProgressEvent<T extends EventTarget = EventTarget> extends Event {
  readonly lengthComputable: boolean
  readonly loaded: number
  readonly target: T | null
  readonly total: number
}

/** Events measuring progress of an underlying process, like an HTTP request
 * (for an XMLHttpRequest, or the loading of the underlying resource of an
 * <img>, <audio>, <video>, <style> or <link>).
 *
 * @category Events
 */
declare var ProgressEvent: {
  readonly prototype: ProgressEvent
  new (type: string, eventInitDict?: ProgressEventInit): ProgressEvent
}

/** Decodes a string of data which has been encoded using base-64 encoding.
 *
 * ```
 * console.log(atob("aGVsbG8gd29ybGQ=")); // outputs 'hello world'
 * ```
 *
 * @category Encoding
 */
declare function atob(s: string): string

/** Creates a base-64 ASCII encoded string from the input string.
 *
 * ```
 * console.log(btoa("hello world"));  // outputs "aGVsbG8gd29ybGQ="
 * ```
 *
 * @category Encoding
 */
declare function btoa(s: string): string

/** @category Encoding */
declare interface TextDecoderOptions {
  fatal?: boolean
  ignoreBOM?: boolean
}

/** @category Encoding */
declare interface TextDecodeOptions {
  stream?: boolean
}

/** @category Encoding */
declare interface TextDecoder {
  /** Returns encoding's name, lowercased. */
  readonly encoding: string
  /** Returns `true` if error mode is "fatal", and `false` otherwise. */
  readonly fatal: boolean
  /** Returns `true` if ignore BOM flag is set, and `false` otherwise. */
  readonly ignoreBOM: boolean

  /** Returns the result of running encoding's decoder. */
  decode(input?: BufferSource, options?: TextDecodeOptions): string
}

/** @category Encoding */
declare var TextDecoder: {
  readonly prototype: TextDecoder
  new (label?: string, options?: TextDecoderOptions): TextDecoder
}

/** @category Encoding */
declare interface TextEncoderEncodeIntoResult {
  read: number
  written: number
}

/** @category Encoding */
declare interface TextEncoder {
  /** Returns "utf-8". */
  readonly encoding: 'utf-8'
  /** Returns the result of running UTF-8's encoder. */
  encode(input?: string): Uint8Array
  encodeInto(input: string, dest: Uint8Array): TextEncoderEncodeIntoResult
}

/** @category Encoding */
declare var TextEncoder: {
  readonly prototype: TextEncoder
  new (): TextEncoder
}

/** @category Encoding */
declare interface TextDecoderStream {
  /** Returns encoding's name, lowercased. */
  readonly encoding: string
  /** Returns `true` if error mode is "fatal", and `false` otherwise. */
  readonly fatal: boolean
  /** Returns `true` if ignore BOM flag is set, and `false` otherwise. */
  readonly ignoreBOM: boolean
  readonly readable: ReadableStream<string>
  readonly writable: WritableStream<BufferSource>
  readonly [Symbol.toStringTag]: string
}

/** @category Encoding */
declare var TextDecoderStream: {
  readonly prototype: TextDecoderStream
  new (label?: string, options?: TextDecoderOptions): TextDecoderStream
}

/** @category Encoding */
declare interface TextEncoderStream {
  /** Returns "utf-8". */
  readonly encoding: 'utf-8'
  readonly readable: ReadableStream<Uint8Array>
  readonly writable: WritableStream<string>
  readonly [Symbol.toStringTag]: string
}

/** @category Encoding */
declare var TextEncoderStream: {
  readonly prototype: TextEncoderStream
  new (): TextEncoderStream
}

/** A controller object that allows you to abort one or more DOM requests as and
 * when desired.
 *
 * @category Platform
 */
declare interface AbortController {
  /** Returns the AbortSignal object associated with this object. */
  readonly signal: AbortSignal
  /** Invoking this method will set this object's AbortSignal's aborted flag and
   * signal to any observers that the associated activity is to be aborted. */
  abort(reason?: any): void
}

/** A controller object that allows you to abort one or more DOM requests as and
 * when desired.
 *
 * @category Platform
 */
declare var AbortController: {
  readonly prototype: AbortController
  new (): AbortController
}

/** @category Platform */
declare interface AbortSignalEventMap {
  abort: Event
}

/** A signal object that allows you to communicate with a DOM request (such as a
 * Fetch) and abort it if required via an AbortController object.
 *
 * @category Platform
 */
declare interface AbortSignal extends EventTarget {
  /** Returns true if this AbortSignal's AbortController has signaled to abort,
   * and false otherwise. */
  readonly aborted: boolean
  readonly reason: any
  onabort: ((this: AbortSignal, ev: Event) => any) | null
  addEventListener<K extends keyof AbortSignalEventMap>(
    type: K,
    listener: (this: AbortSignal, ev: AbortSignalEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void
  removeEventListener<K extends keyof AbortSignalEventMap>(
    type: K,
    listener: (this: AbortSignal, ev: AbortSignalEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void

  /** Throws this AbortSignal's abort reason, if its AbortController has
   * signaled to abort; otherwise, does nothing. */
  throwIfAborted(): void
}

/** @category Platform */
declare var AbortSignal: {
  readonly prototype: AbortSignal
  new (): never
  abort(reason?: any): AbortSignal
  any(signals: AbortSignal[]): AbortSignal
  timeout(milliseconds: number): AbortSignal
}

/** @category File */
declare interface FileReaderEventMap {
  abort: ProgressEvent<FileReader>
  error: ProgressEvent<FileReader>
  load: ProgressEvent<FileReader>
  loadend: ProgressEvent<FileReader>
  loadstart: ProgressEvent<FileReader>
  progress: ProgressEvent<FileReader>
}

/** Lets web applications asynchronously read the contents of files (or raw data
 * buffers) stored on the user's computer, using File or Blob objects to specify
 * the file or data to read.
 *
 * @category File
 */
declare interface FileReader extends EventTarget {
  readonly error: DOMException | null
  onabort: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null
  onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null
  onloadstart: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null
  onprogress: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null
  readonly readyState: number
  readonly result: string | ArrayBuffer | null
  abort(): void
  readAsArrayBuffer(blob: Blob): void
  readAsBinaryString(blob: Blob): void
  readAsDataURL(blob: Blob): void
  readAsText(blob: Blob, encoding?: string): void
  readonly DONE: number
  readonly EMPTY: number
  readonly LOADING: number
  addEventListener<K extends keyof FileReaderEventMap>(
    type: K,
    listener: (this: FileReader, ev: FileReaderEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void
  removeEventListener<K extends keyof FileReaderEventMap>(
    type: K,
    listener: (this: FileReader, ev: FileReaderEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void
}

/** @category File */
declare var FileReader: {
  readonly prototype: FileReader
  new (): FileReader
  readonly DONE: number
  readonly EMPTY: number
  readonly LOADING: number
}

/** @category File */
declare type BlobPart = BufferSource | Blob | string

/** @category File */
declare interface BlobPropertyBag {
  type?: string
  endings?: 'transparent' | 'native'
}

/** A file-like object of immutable, raw data. Blobs represent data that isn't
 * necessarily in a JavaScript-native format. The File interface is based on
 * Blob, inheriting blob functionality and expanding it to support files on the
 * user's system.
 *
 * @category File
 */
declare interface Blob {
  readonly size: number
  readonly type: string
  arrayBuffer(): Promise<ArrayBuffer>
  bytes(): Promise<Uint8Array>
  slice(start?: number, end?: number, contentType?: string): Blob
  stream(): ReadableStream<Uint8Array>
  text(): Promise<string>
}

/** A file-like object of immutable, raw data. Blobs represent data that isn't
 * necessarily in a JavaScript-native format. The File interface is based on
 * Blob, inheriting blob functionality and expanding it to support files on the
 * user's system.
 *
 * @category File
 */
declare var Blob: {
  readonly prototype: Blob
  new (blobParts?: BlobPart[], options?: BlobPropertyBag): Blob
}

/** @category File */
declare interface FilePropertyBag extends BlobPropertyBag {
  lastModified?: number
}

/** Provides information about files and allows JavaScript in a web page to
 * access their content.
 *
 * @category File
 */
declare interface File extends Blob {
  readonly lastModified: number
  readonly name: string
}

/** Provides information about files and allows JavaScript in a web page to
 * access their content.
 *
 * @category File
 */
declare var File: {
  readonly prototype: File
  new (fileBits: BlobPart[], fileName: string, options?: FilePropertyBag): File
}

/** @category Streams */
declare interface ReadableStreamDefaultReadDoneResult {
  done: true
  value?: undefined
}

/** @category Streams */
declare interface ReadableStreamDefaultReadValueResult<T> {
  done: false
  value: T
}

/** @category Streams */
declare type ReadableStreamDefaultReadResult<T> =
  | ReadableStreamDefaultReadValueResult<T>
  | ReadableStreamDefaultReadDoneResult

/** @category Streams */
declare interface ReadableStreamDefaultReader<R = any> {
  readonly closed: Promise<void>
  cancel(reason?: any): Promise<void>
  read(): Promise<ReadableStreamDefaultReadResult<R>>
  releaseLock(): void
}

/** @category Streams */
declare var ReadableStreamDefaultReader: {
  readonly prototype: ReadableStreamDefaultReader
  new <R>(stream: ReadableStream<R>): ReadableStreamDefaultReader<R>
}

/** @category Streams */
declare interface ReadableStreamBYOBReadDoneResult<V extends ArrayBufferView> {
  done: true
  value?: V
}

/** @category Streams */
declare interface ReadableStreamBYOBReadValueResult<V extends ArrayBufferView> {
  done: false
  value: V
}

/** @category Streams */
declare type ReadableStreamBYOBReadResult<V extends ArrayBufferView> =
  | ReadableStreamBYOBReadDoneResult<V>
  | ReadableStreamBYOBReadValueResult<V>

/** @category Streams */
declare interface ReadableStreamBYOBReaderReadOptions {
  min?: number
}

/** @category Streams */
declare interface ReadableStreamBYOBReader {
  readonly closed: Promise<void>
  cancel(reason?: any): Promise<void>
  read<V extends ArrayBufferView>(
    view: V,
    options?: ReadableStreamBYOBReaderReadOptions
  ): Promise<ReadableStreamBYOBReadResult<V>>
  releaseLock(): void
}

/** @category Streams */
declare var ReadableStreamBYOBReader: {
  readonly prototype: ReadableStreamBYOBReader
  new (stream: ReadableStream<Uint8Array>): ReadableStreamBYOBReader
}

/** @category Streams */
declare interface ReadableStreamBYOBRequest {
  readonly view: ArrayBufferView | null
  respond(bytesWritten: number): void
  respondWithNewView(view: ArrayBufferView): void
}

/** @category Streams */
declare var ReadableStreamBYOBRequest: {
  readonly prototype: ReadableStreamBYOBRequest
  new (): never
}

/** @category Streams */
declare interface ReadableByteStreamControllerCallback {
  (controller: ReadableByteStreamController): void | PromiseLike<void>
}

/** @category Streams */
declare interface UnderlyingByteSource {
  autoAllocateChunkSize?: number
  cancel?: ReadableStreamErrorCallback
  pull?: ReadableByteStreamControllerCallback
  start?: ReadableByteStreamControllerCallback
  type: 'bytes'
}

/** @category Streams */
declare interface UnderlyingSink<W = any> {
  abort?: WritableStreamErrorCallback
  close?: WritableStreamDefaultControllerCloseCallback
  start?: WritableStreamDefaultControllerStartCallback
  type?: undefined
  write?: WritableStreamDefaultControllerWriteCallback<W>
}

/** @category Streams */
declare interface UnderlyingSource<R = any> {
  cancel?: ReadableStreamErrorCallback
  pull?: ReadableStreamDefaultControllerCallback<R>
  start?: ReadableStreamDefaultControllerCallback<R>
  type?: undefined
}

/** @category Streams */
declare interface ReadableStreamErrorCallback {
  (reason: any): void | PromiseLike<void>
}

/** @category Streams */
declare interface ReadableStreamDefaultControllerCallback<R> {
  (controller: ReadableStreamDefaultController<R>): void | PromiseLike<void>
}

/** @category Streams */
declare interface ReadableStreamDefaultController<R = any> {
  readonly desiredSize: number | null
  close(): void
  enqueue(chunk: R): void
  error(error?: any): void
}

/** @category Streams */
declare var ReadableStreamDefaultController: {
  readonly prototype: ReadableStreamDefaultController
  new (): never
}

/** @category Streams */
declare interface ReadableByteStreamController {
  readonly byobRequest: ReadableStreamBYOBRequest | null
  readonly desiredSize: number | null
  close(): void
  enqueue(chunk: ArrayBufferView): void
  error(error?: any): void
}

/** @category Streams */
declare var ReadableByteStreamController: {
  readonly prototype: ReadableByteStreamController
  new (): never
}

/** @category Streams */
declare interface PipeOptions {
  preventAbort?: boolean
  preventCancel?: boolean
  preventClose?: boolean
  signal?: AbortSignal
}

/** @category Streams */
declare interface QueuingStrategySizeCallback<T = any> {
  (chunk: T): number
}

/** @category Streams */
declare interface QueuingStrategy<T = any> {
  highWaterMark?: number
  size?: QueuingStrategySizeCallback<T>
}

/** This Streams API interface provides a built-in byte length queuing strategy
 * that can be used when constructing streams.
 *
 * @category Streams
 */
declare interface CountQueuingStrategy extends QueuingStrategy {
  highWaterMark: number
  size(chunk: any): 1
}

/** @category Streams */
declare var CountQueuingStrategy: {
  readonly prototype: CountQueuingStrategy
  new (options: { highWaterMark: number }): CountQueuingStrategy
}

/** @category Streams */
declare interface ByteLengthQueuingStrategy extends QueuingStrategy<ArrayBufferView> {
  highWaterMark: number
  size(chunk: ArrayBufferView): number
}

/** @category Streams */
declare var ByteLengthQueuingStrategy: {
  readonly prototype: ByteLengthQueuingStrategy
  new (options: { highWaterMark: number }): ByteLengthQueuingStrategy
}

/** This Streams API interface represents a readable stream of byte data. The
 * Fetch API offers a concrete instance of a ReadableStream through the body
 * property of a Response object.
 *
 * @category Streams
 */
declare interface ReadableStream<R = any> {
  readonly locked: boolean
  cancel(reason?: any): Promise<void>
  getReader(options: { mode: 'byob' }): ReadableStreamBYOBReader
  getReader(options?: { mode?: undefined }): ReadableStreamDefaultReader<R>
  pipeThrough<T>(
    transform: {
      writable: WritableStream<R>
      readable: ReadableStream<T>
    },
    options?: PipeOptions
  ): ReadableStream<T>
  pipeTo(dest: WritableStream<R>, options?: PipeOptions): Promise<void>
  tee(): [ReadableStream<R>, ReadableStream<R>]
  values(options?: { preventCancel?: boolean }): AsyncIterableIterator<R>
  [Symbol.asyncIterator](options?: { preventCancel?: boolean }): AsyncIterableIterator<R>
}

/** @category Streams */
declare var ReadableStream: {
  readonly prototype: ReadableStream
  new (
    underlyingSource: UnderlyingByteSource,
    strategy?: { highWaterMark?: number; size?: undefined }
  ): ReadableStream<Uint8Array>
  new <R = any>(
    underlyingSource?: UnderlyingSource<R>,
    strategy?: QueuingStrategy<R>
  ): ReadableStream<R>
  from<R>(asyncIterable: AsyncIterable<R> | Iterable<R | PromiseLike<R>>): ReadableStream<R>
}

/** @category Streams */
declare interface WritableStreamDefaultControllerCloseCallback {
  (): void | PromiseLike<void>
}

/** @category Streams */
declare interface WritableStreamDefaultControllerStartCallback {
  (controller: WritableStreamDefaultController): void | PromiseLike<void>
}

/** @category Streams */
declare interface WritableStreamDefaultControllerWriteCallback<W> {
  (chunk: W, controller: WritableStreamDefaultController): void | PromiseLike<void>
}

/** @category Streams */
declare interface WritableStreamErrorCallback {
  (reason: any): void | PromiseLike<void>
}

/** This Streams API interface provides a standard abstraction for writing
 * streaming data to a destination, known as a sink. This object comes with
 * built-in backpressure and queuing.
 *
 * @category Streams
 */
declare interface WritableStream<W = any> {
  readonly locked: boolean
  abort(reason?: any): Promise<void>
  close(): Promise<void>
  getWriter(): WritableStreamDefaultWriter<W>
}

/** @category Streams */
declare var WritableStream: {
  readonly prototype: WritableStream
  new <W = any>(
    underlyingSink?: UnderlyingSink<W>,
    strategy?: QueuingStrategy<W>
  ): WritableStream<W>
}

/** This Streams API interface represents a controller allowing control of a
 * WritableStream's state. When constructing a WritableStream, the underlying
 * sink is given a corresponding WritableStreamDefaultController instance to
 * manipulate.
 *
 * @category Streams
 */
declare interface WritableStreamDefaultController {
  signal: AbortSignal
  error(error?: any): void
}

/** @category Streams */
declare var WritableStreamDefaultController: {
  readonly prototype: WritableStreamDefaultController
  new (): never
}

/** This Streams API interface is the object returned by
 * WritableStream.getWriter() and once created locks the < writer to the
 * WritableStream ensuring that no other streams can write to the underlying
 * sink.
 *
 * @category Streams
 */
declare interface WritableStreamDefaultWriter<W = any> {
  readonly closed: Promise<void>
  readonly desiredSize: number | null
  readonly ready: Promise<void>
  abort(reason?: any): Promise<void>
  close(): Promise<void>
  releaseLock(): void
  write(chunk: W): Promise<void>
}

/** @category Streams */
declare var WritableStreamDefaultWriter: {
  readonly prototype: WritableStreamDefaultWriter
  new <W>(stream: WritableStream<W>): WritableStreamDefaultWriter<W>
}

/** @category Streams */
declare interface TransformStream<I = any, O = any> {
  readonly readable: ReadableStream<O>
  readonly writable: WritableStream<I>
}

/** @category Streams */
declare var TransformStream: {
  readonly prototype: TransformStream
  new <I = any, O = any>(
    transformer?: Transformer<I, O>,
    writableStrategy?: QueuingStrategy<I>,
    readableStrategy?: QueuingStrategy<O>
  ): TransformStream<I, O>
}

/** @category Streams */
declare interface TransformStreamDefaultController<O = any> {
  readonly desiredSize: number | null
  enqueue(chunk: O): void
  error(reason?: any): void
  terminate(): void
}

/** @category Streams */
declare var TransformStreamDefaultController: {
  readonly prototype: TransformStreamDefaultController
  new (): never
}

/** @category Streams */
declare interface Transformer<I = any, O = any> {
  flush?: TransformStreamDefaultControllerCallback<O>
  readableType?: undefined
  start?: TransformStreamDefaultControllerCallback<O>
  transform?: TransformStreamDefaultControllerTransformCallback<I, O>
  cancel?: (reason: any) => Promise<void>
  writableType?: undefined
}

/** @category Streams */
declare interface TransformStreamDefaultControllerCallback<O> {
  (controller: TransformStreamDefaultController<O>): void | PromiseLike<void>
}

/** @category Streams */
declare interface TransformStreamDefaultControllerTransformCallback<I, O> {
  (chunk: I, controller: TransformStreamDefaultController<O>): void | PromiseLike<void>
}

/** @category Events */
declare interface MessageEventInit<T = any> extends EventInit {
  data?: T
  origin?: string
  lastEventId?: string
}

/** @category Events */
declare interface MessageEvent<T = any> extends Event {
  /**
   * Returns the data of the message.
   */
  readonly data: T
  /**
   * Returns the origin of the message, for server-sent events.
   */
  readonly origin: string
  /**
   * Returns the last event ID string, for server-sent events.
   */
  readonly lastEventId: string
  readonly source: null
  /**
   * Returns transferred ports.
   */
  readonly ports: ReadonlyArray<MessagePort>
}

/** @category Events */
declare var MessageEvent: {
  readonly prototype: MessageEvent
  new <T>(type: string, eventInitDict?: MessageEventInit<T>): MessageEvent<T>
}

/** @category Events */
declare type Transferable = ArrayBuffer | MessagePort

/**
 * This type has been renamed to StructuredSerializeOptions. Use that type for
 * new code.
 *
 * @deprecated use `StructuredSerializeOptions` instead.
 * @category Events
 */
declare type PostMessageOptions = StructuredSerializeOptions

/** @category Platform */
declare interface StructuredSerializeOptions {
  transfer?: Transferable[]
}

/** The MessageChannel interface of the Channel Messaging API allows us to
 * create a new message channel and send data through it via its two MessagePort
 * properties.
 *
 * @category Messaging
 */
declare interface MessageChannel {
  readonly port1: MessagePort
  readonly port2: MessagePort
}

/** The MessageChannel interface of the Channel Messaging API allows us to
 * create a new message channel and send data through it via its two MessagePort
 * properties.
 *
 * @category Messaging
 */
declare var MessageChannel: {
  readonly prototype: MessageChannel
  new (): MessageChannel
}

/** @category Messaging */
declare interface MessagePortEventMap {
  message: MessageEvent
  messageerror: MessageEvent
}

/** The MessagePort interface of the Channel Messaging API represents one of the
 * two ports of a MessageChannel, allowing messages to be sent from one port and
 * listening out for them arriving at the other.
 *
 * @category Messaging
 */
declare interface MessagePort extends EventTarget {
  onmessage: ((this: MessagePort, ev: MessageEvent) => any) | null
  onmessageerror: ((this: MessagePort, ev: MessageEvent) => any) | null
  /**
   * Disconnects the port, so that it is no longer active.
   */
  close(): void
  /**
   * Posts a message through the channel. Objects listed in transfer are
   * transferred, not just cloned, meaning that they are no longer usable on the
   * sending side.
   *
   * Throws a "DataCloneError" DOMException if transfer contains duplicate
   * objects or port, or if message could not be cloned.
   */
  postMessage(message: any, transfer: Transferable[]): void
  postMessage(message: any, options?: StructuredSerializeOptions): void
  /**
   * Begins dispatching messages received on the port. This is implicitly called
   * when assigning a value to `this.onmessage`.
   */
  start(): void
  addEventListener<K extends keyof MessagePortEventMap>(
    type: K,
    listener: (this: MessagePort, ev: MessagePortEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void
  removeEventListener<K extends keyof MessagePortEventMap>(
    type: K,
    listener: (this: MessagePort, ev: MessagePortEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void
}

/** The MessagePort interface of the Channel Messaging API represents one of the
 * two ports of a MessageChannel, allowing messages to be sent from one port and
 * listening out for them arriving at the other.
 *
 * @category Messaging
 */
declare var MessagePort: {
  readonly prototype: MessagePort
  new (): never
}

/**
 * Creates a deep copy of a given value using the structured clone algorithm.
 *
 * Unlike a shallow copy, a deep copy does not hold the same references as the
 * source object, meaning its properties can be changed without affecting the
 * source. For more details, see
 * [MDN](https://developer.mozilla.org/en-US/docs/Glossary/Deep_copy).
 *
 * Throws a `DataCloneError` if any part of the input value is not
 * serializable.
 *
 * @example
 * ```ts
 * const object = { x: 0, y: 1 };
 *
 * const deepCopy = structuredClone(object);
 * deepCopy.x = 1;
 * console.log(deepCopy.x, object.x); // 1 0
 *
 * const shallowCopy = object;
 * shallowCopy.x = 1;
 * // shallowCopy.x is pointing to the same location in memory as object.x
 * console.log(shallowCopy.x, object.x); // 1 1
 * ```
 *
 * @category Platform
 */
declare function structuredClone<T = any>(value: T, options?: StructuredSerializeOptions): T

/**
 * An API for compressing a stream of data.
 *
 * @example
 * ```ts
 * await Deno.stdin.readable
 *   .pipeThrough(new CompressionStream("gzip"))
 *   .pipeTo(Deno.stdout.writable);
 * ```
 *
 * @category Streams
 */
declare interface CompressionStream {
  readonly readable: ReadableStream<Uint8Array>
  readonly writable: WritableStream<Uint8Array>
}

/**
 * An API for compressing a stream of data.
 *
 * @example
 * ```ts
 * await Deno.stdin.readable
 *   .pipeThrough(new CompressionStream("gzip"))
 *   .pipeTo(Deno.stdout.writable);
 * ```
 *
 * @category Streams
 */
declare var CompressionStream: {
  readonly prototype: CompressionStream
  /**
   * Creates a new `CompressionStream` object which compresses a stream of
   * data.
   *
   * Throws a `TypeError` if the format passed to the constructor is not
   * supported.
   */
  new (format: string): CompressionStream
}

/**
 * An API for decompressing a stream of data.
 *
 * @example
 * ```ts
 * const input = await Deno.open("./file.txt.gz");
 * const output = await Deno.create("./file.txt");
 *
 * await input.readable
 *   .pipeThrough(new DecompressionStream("gzip"))
 *   .pipeTo(output.writable);
 * ```
 *
 * @category Streams
 */
declare interface DecompressionStream {
  readonly readable: ReadableStream<Uint8Array>
  readonly writable: WritableStream<Uint8Array>
}

/**
 * An API for decompressing a stream of data.
 *
 * @example
 * ```ts
 * const input = await Deno.open("./file.txt.gz");
 * const output = await Deno.create("./file.txt");
 *
 * await input.readable
 *   .pipeThrough(new DecompressionStream("gzip"))
 *   .pipeTo(output.writable);
 * ```
 *
 * @category Streams
 */
declare var DecompressionStream: {
  readonly prototype: DecompressionStream
  /**
   * Creates a new `DecompressionStream` object which decompresses a stream of
   * data.
   *
   * Throws a `TypeError` if the format passed to the constructor is not
   * supported.
   */
  new (format: string): DecompressionStream
}

/** Dispatch an uncaught exception. Similar to a synchronous version of:
 * ```ts
 * setTimeout(() => { throw error; }, 0);
 * ```
 * The error can not be caught with a `try/catch` block. An error event will
 * be dispatched to the global scope. You can prevent the error from being
 * reported to the console with `Event.prototype.preventDefault()`:
 * ```ts
 * addEventListener("error", (event) => {
 *   event.preventDefault();
 * });
 * reportError(new Error("foo")); // Will not be reported.
 * ```
 * In Deno, this error will terminate the process if not intercepted like above.
 *
 * @category Platform
 */
declare function reportError(error: any): void

/** @category Platform */
declare type PredefinedColorSpace = 'srgb' | 'display-p3'

/** @category Platform */
declare interface ImageDataSettings {
  readonly colorSpace?: PredefinedColorSpace
}

/** @category Platform */
declare interface ImageData {
  readonly colorSpace: PredefinedColorSpace
  readonly data: Uint8ClampedArray
  readonly height: number
  readonly width: number
}

/** @category Platform */
declare var ImageData: {
  prototype: ImageData
  new (sw: number, sh: number, settings?: ImageDataSettings): ImageData
  new (data: Uint8ClampedArray, sw: number, sh?: number, settings?: ImageDataSettings): ImageData
}

// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// deno-lint-ignore-file no-explicit-any no-var

/// <reference no-default-lib="true" />
/// <reference lib="esnext" />

/** @category Platform */
declare interface DomIterable<K, V> {
  keys(): IterableIterator<K>
  values(): IterableIterator<V>
  entries(): IterableIterator<[K, V]>
  [Symbol.iterator](): IterableIterator<[K, V]>
  forEach(callback: (value: V, key: K, parent: this) => void, thisArg?: any): void
}

/** @category Fetch */
declare type FormDataEntryValue = File | string

/** Provides a way to easily construct a set of key/value pairs representing
 * form fields and their values, which can then be easily sent using the
 * XMLHttpRequest.send() method. It uses the same format a form would use if the
 * encoding type were set to "multipart/form-data".
 *
 * @category Fetch
 */
declare interface FormData extends DomIterable<string, FormDataEntryValue> {
  append(name: string, value: string | Blob, fileName?: string): void
  delete(name: string): void
  get(name: string): FormDataEntryValue | null
  getAll(name: string): FormDataEntryValue[]
  has(name: string): boolean
  set(name: string, value: string | Blob, fileName?: string): void
}

/** @category Fetch */
declare var FormData: {
  readonly prototype: FormData
  new (): FormData
}

/** @category Fetch */
declare interface Body {
  /** A simple getter used to expose a `ReadableStream` of the body contents. */
  readonly body: ReadableStream<Uint8Array> | null
  /** Stores a `Boolean` that declares whether the body has been used in a
   * response yet.
   */
  readonly bodyUsed: boolean
  /** Takes a `Response` stream and reads it to completion. It returns a promise
   * that resolves with an `ArrayBuffer`.
   */
  arrayBuffer(): Promise<ArrayBuffer>
  /** Takes a `Response` stream and reads it to completion. It returns a promise
   * that resolves with a `Blob`.
   */
  blob(): Promise<Blob>
  /** Takes a `Response` stream and reads it to completion. It returns a promise
   * that resolves with a `Uint8Array`.
   */
  bytes(): Promise<Uint8Array>
  /** Takes a `Response` stream and reads it to completion. It returns a promise
   * that resolves with a `FormData` object.
   */
  formData(): Promise<FormData>
  /** Takes a `Response` stream and reads it to completion. It returns a promise
   * that resolves with the result of parsing the body text as JSON.
   */
  json(): Promise<any>
  /** Takes a `Response` stream and reads it to completion. It returns a promise
   * that resolves with a `USVString` (text).
   */
  text(): Promise<string>
}

/** @category Fetch */
declare type HeadersInit = Iterable<string[]> | Record<string, string>

/** This Fetch API interface allows you to perform various actions on HTTP
 * request and response headers. These actions include retrieving, setting,
 * adding to, and removing. A Headers object has an associated header list,
 * which is initially empty and consists of zero or more name and value pairs.
 * You can add to this using methods like append() (see Examples). In all
 * methods of this interface, header names are matched by case-insensitive byte
 * sequence.
 *
 * @category Fetch
 */
declare interface Headers extends DomIterable<string, string> {
  /** Appends a new value onto an existing header inside a `Headers` object, or
   * adds the header if it does not already exist.
   */
  append(name: string, value: string): void
  /** Deletes a header from a `Headers` object. */
  delete(name: string): void
  /** Returns a `ByteString` sequence of all the values of a header within a
   * `Headers` object with a given name.
   */
  get(name: string): string | null
  /** Returns a boolean stating whether a `Headers` object contains a certain
   * header.
   */
  has(name: string): boolean
  /** Sets a new value for an existing header inside a Headers object, or adds
   * the header if it does not already exist.
   */
  set(name: string, value: string): void
  /** Returns an array containing the values of all `Set-Cookie` headers
   * associated with a response.
   */
  getSetCookie(): string[]
}

/** This Fetch API interface allows you to perform various actions on HTTP
 * request and response headers. These actions include retrieving, setting,
 * adding to, and removing. A Headers object has an associated header list,
 * which is initially empty and consists of zero or more name and value pairs.
 * You can add to this using methods like append() (see Examples). In all
 * methods of this interface, header names are matched by case-insensitive byte
 * sequence.
 *
 * @category Fetch
 */
declare var Headers: {
  readonly prototype: Headers
  new (init?: HeadersInit): Headers
}

/** @category Fetch */
declare type RequestInfo = Request | string
/** @category Fetch */
declare type RequestCache =
  | 'default'
  | 'force-cache'
  | 'no-cache'
  | 'no-store'
  | 'only-if-cached'
  | 'reload'
/** @category Fetch */
declare type RequestCredentials = 'include' | 'omit' | 'same-origin'
/** @category Fetch */
declare type RequestMode = 'cors' | 'navigate' | 'no-cors' | 'same-origin'
/** @category Fetch */
declare type RequestRedirect = 'error' | 'follow' | 'manual'
/** @category Fetch */
declare type ReferrerPolicy =
  | ''
  | 'no-referrer'
  | 'no-referrer-when-downgrade'
  | 'origin'
  | 'origin-when-cross-origin'
  | 'same-origin'
  | 'strict-origin'
  | 'strict-origin-when-cross-origin'
  | 'unsafe-url'
/** @category Fetch */
declare type BodyInit =
  | Blob
  | BufferSource
  | FormData
  | URLSearchParams
  | ReadableStream<Uint8Array>
  | string
/** @category Fetch */
declare type RequestDestination =
  | ''
  | 'audio'
  | 'audioworklet'
  | 'document'
  | 'embed'
  | 'font'
  | 'image'
  | 'manifest'
  | 'object'
  | 'paintworklet'
  | 'report'
  | 'script'
  | 'sharedworker'
  | 'style'
  | 'track'
  | 'video'
  | 'worker'
  | 'xslt'

/** @category Fetch */
declare interface RequestInit {
  /**
   * A BodyInit object or null to set request's body.
   */
  body?: BodyInit | null
  /**
   * A string indicating how the request will interact with the browser's cache
   * to set request's cache.
   */
  cache?: RequestCache
  /**
   * A string indicating whether credentials will be sent with the request
   * always, never, or only when sent to a same-origin URL. Sets request's
   * credentials.
   */
  credentials?: RequestCredentials
  /**
   * A Headers object, an object literal, or an array of two-item arrays to set
   * request's headers.
   */
  headers?: HeadersInit
  /**
   * A cryptographic hash of the resource to be fetched by request. Sets
   * request's integrity.
   */
  integrity?: string
  /**
   * A boolean to set request's keepalive.
   */
  keepalive?: boolean
  /**
   * A string to set request's method.
   */
  method?: string
  /**
   * A string to indicate whether the request will use CORS, or will be
   * restricted to same-origin URLs. Sets request's mode.
   */
  mode?: RequestMode
  /**
   * A string indicating whether request follows redirects, results in an error
   * upon encountering a redirect, or returns the redirect (in an opaque
   * fashion). Sets request's redirect.
   */
  redirect?: RequestRedirect
  /**
   * A string whose value is a same-origin URL, "about:client", or the empty
   * string, to set request's referrer.
   */
  referrer?: string
  /**
   * A referrer policy to set request's referrerPolicy.
   */
  referrerPolicy?: ReferrerPolicy
  /**
   * An AbortSignal to set request's signal.
   */
  signal?: AbortSignal | null
  /**
   * Can only be null. Used to disassociate request from any Window.
   */
  window?: any
}

/** This Fetch API interface represents a resource request.
 *
 * @category Fetch
 */
declare interface Request extends Body {
  /**
   * Returns the cache mode associated with request, which is a string
   * indicating how the request will interact with the browser's cache when
   * fetching.
   */
  readonly cache: RequestCache
  /**
   * Returns the credentials mode associated with request, which is a string
   * indicating whether credentials will be sent with the request always, never,
   * or only when sent to a same-origin URL.
   */
  readonly credentials: RequestCredentials
  /**
   * Returns the kind of resource requested by request, e.g., "document" or "script".
   */
  readonly destination: RequestDestination
  /**
   * Returns a Headers object consisting of the headers associated with request.
   * Note that headers added in the network layer by the user agent will not be
   * accounted for in this object, e.g., the "Host" header.
   */
  readonly headers: Headers
  /**
   * Returns request's subresource integrity metadata, which is a cryptographic
   * hash of the resource being fetched. Its value consists of multiple hashes
   * separated by whitespace. [SRI]
   */
  readonly integrity: string
  /**
   * Returns a boolean indicating whether or not request is for a history
   * navigation (a.k.a. back-forward navigation).
   */
  readonly isHistoryNavigation: boolean
  /**
   * Returns a boolean indicating whether or not request is for a reload
   * navigation.
   */
  readonly isReloadNavigation: boolean
  /**
   * Returns a boolean indicating whether or not request can outlive the global
   * in which it was created.
   */
  readonly keepalive: boolean
  /**
   * Returns request's HTTP method, which is "GET" by default.
   */
  readonly method: string
  /**
   * Returns the mode associated with request, which is a string indicating
   * whether the request will use CORS, or will be restricted to same-origin
   * URLs.
   */
  readonly mode: RequestMode
  /**
   * Returns the redirect mode associated with request, which is a string
   * indicating how redirects for the request will be handled during fetching. A
   * request will follow redirects by default.
   */
  readonly redirect: RequestRedirect
  /**
   * Returns the referrer of request. Its value can be a same-origin URL if
   * explicitly set in init, the empty string to indicate no referrer, and
   * "about:client" when defaulting to the global's default. This is used during
   * fetching to determine the value of the `Referer` header of the request
   * being made.
   */
  readonly referrer: string
  /**
   * Returns the referrer policy associated with request. This is used during
   * fetching to compute the value of the request's referrer.
   */
  readonly referrerPolicy: ReferrerPolicy
  /**
   * Returns the signal associated with request, which is an AbortSignal object
   * indicating whether or not request has been aborted, and its abort event
   * handler.
   */
  readonly signal: AbortSignal
  /**
   * Returns the URL of request as a string.
   */
  readonly url: string
  clone(): Request
}

/** This Fetch API interface represents a resource request.
 *
 * @category Fetch
 */
declare var Request: {
  readonly prototype: Request
  new (input: RequestInfo | URL, init?: RequestInit): Request
}

/** @category Fetch */
declare interface ResponseInit {
  headers?: HeadersInit
  status?: number
  statusText?: string
}

/** @category Fetch */
declare type ResponseType = 'basic' | 'cors' | 'default' | 'error' | 'opaque' | 'opaqueredirect'

/** This Fetch API interface represents the response to a request.
 *
 * @category Fetch
 */
declare interface Response extends Body {
  readonly headers: Headers
  readonly ok: boolean
  readonly redirected: boolean
  readonly status: number
  readonly statusText: string
  readonly type: ResponseType
  readonly url: string
  clone(): Response
}

/** This Fetch API interface represents the response to a request.
 *
 * @category Fetch
 */
declare var Response: {
  readonly prototype: Response
  new (body?: BodyInit | null, init?: ResponseInit): Response
  json(data: unknown, init?: ResponseInit): Response
  error(): Response
  redirect(url: string | URL, status?: number): Response
}

/** Fetch a resource from the network. It returns a `Promise` that resolves to the
 * `Response` to that `Request`, whether it is successful or not.
 *
 * ```ts
 * const response = await fetch("http://my.json.host/data.json");
 * console.log(response.status);  // e.g. 200
 * console.log(response.statusText); // e.g. "OK"
 * const jsonData = await response.json();
 * ```
 *
 * @tags allow-net, allow-read
 * @category Fetch
 */
declare function fetch(input: URL | Request | string, init?: RequestInit): Promise<Response>

/**
 * @category Fetch
 */
declare interface EventSourceInit {
  withCredentials?: boolean
}

/**
 * @category Fetch
 */
declare interface EventSourceEventMap {
  error: Event
  message: MessageEvent
  open: Event
}

/**
 * @category Fetch
 */
declare interface EventSource extends EventTarget {
  onerror: ((this: EventSource, ev: Event) => any) | null
  onmessage: ((this: EventSource, ev: MessageEvent) => any) | null
  onopen: ((this: EventSource, ev: Event) => any) | null
  /**
   * Returns the state of this EventSource object's connection. It can have the values described below.
   */
  readonly readyState: number
  /**
   * Returns the URL providing the event stream.
   */
  readonly url: string
  /**
   * Returns true if the credentials mode for connection requests to the URL providing the event stream is set to "include", and false otherwise.
   */
  readonly withCredentials: boolean
  /**
   * Aborts any instances of the fetch algorithm started for this EventSource object, and sets the readyState attribute to CLOSED.
   */
  close(): void
  readonly CONNECTING: 0
  readonly OPEN: 1
  readonly CLOSED: 2
  addEventListener<K extends keyof EventSourceEventMap>(
    type: K,
    listener: (this: EventSource, ev: EventSourceEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void
  addEventListener(
    type: string,
    listener: (this: EventSource, event: MessageEvent) => any,
    options?: boolean | AddEventListenerOptions
  ): void
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void
  removeEventListener<K extends keyof EventSourceEventMap>(
    type: K,
    listener: (this: EventSource, ev: EventSourceEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void
  removeEventListener(
    type: string,
    listener: (this: EventSource, event: MessageEvent) => any,
    options?: boolean | EventListenerOptions
  ): void
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void
}

/**
 * @category Fetch
 */
declare var EventSource: {
  prototype: EventSource
  new (url: string | URL, eventSourceInitDict?: EventSourceInit): EventSource
  readonly CONNECTING: 0
  readonly OPEN: 1
  readonly CLOSED: 2
}

// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// deno-lint-ignore-file no-explicit-any no-empty-interface

/// <reference no-default-lib="true" />
/// <reference lib="esnext" />

/**
 * @category GPU
 * @experimental
 */
declare interface GPUObjectBase {
  label: string
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPUObjectDescriptorBase {
  label?: string
}

/**
 * @category GPU
 * @experimental
 */
declare class GPUSupportedLimits {
  maxTextureDimension1D?: number
  maxTextureDimension2D?: number
  maxTextureDimension3D?: number
  maxTextureArrayLayers?: number
  maxBindGroups?: number
  maxBindingsPerBindGroup?: number
  maxDynamicUniformBuffersPerPipelineLayout?: number
  maxDynamicStorageBuffersPerPipelineLayout?: number
  maxSampledTexturesPerShaderStage?: number
  maxSamplersPerShaderStage?: number
  maxStorageBuffersPerShaderStage?: number
  maxStorageTexturesPerShaderStage?: number
  maxUniformBuffersPerShaderStage?: number
  maxUniformBufferBindingSize?: number
  maxStorageBufferBindingSize?: number
  minUniformBufferOffsetAlignment?: number
  minStorageBufferOffsetAlignment?: number
  maxVertexBuffers?: number
  maxBufferSize?: number
  maxVertexAttributes?: number
  maxVertexBufferArrayStride?: number
  maxInterStageShaderComponents?: number
  maxColorAttachments?: number
  maxColorAttachmentBytesPerSample?: number
  maxComputeWorkgroupStorageSize?: number
  maxComputeInvocationsPerWorkgroup?: number
  maxComputeWorkgroupSizeX?: number
  maxComputeWorkgroupSizeY?: number
  maxComputeWorkgroupSizeZ?: number
  maxComputeWorkgroupsPerDimension?: number
}

/**
 * @category GPU
 * @experimental
 */
declare class GPUSupportedFeatures {
  forEach(
    callbackfn: (value: GPUFeatureName, value2: GPUFeatureName, set: Set<GPUFeatureName>) => void,
    thisArg?: any
  ): void
  has(value: GPUFeatureName): boolean
  size: number;
  [Symbol.iterator](): IterableIterator<GPUFeatureName>
  entries(): IterableIterator<[GPUFeatureName, GPUFeatureName]>
  keys(): IterableIterator<GPUFeatureName>
  values(): IterableIterator<GPUFeatureName>
}

/**
 * @category GPU
 * @experimental
 */
declare class GPUAdapterInfo {
  readonly vendor: string
  readonly architecture: string
  readonly device: string
  readonly description: string
}

/**
 * @category GPU
 * @experimental
 */
declare class GPU {
  requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter | null>
  getPreferredCanvasFormat(): GPUTextureFormat
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPURequestAdapterOptions {
  powerPreference?: GPUPowerPreference
  forceFallbackAdapter?: boolean
}

/**
 * @category GPU
 * @experimental
 */
declare type GPUPowerPreference = 'low-power' | 'high-performance'

/**
 * @category GPU
 * @experimental
 */
declare class GPUAdapter {
  readonly features: GPUSupportedFeatures
  readonly limits: GPUSupportedLimits
  readonly isFallbackAdapter: boolean

  requestDevice(descriptor?: GPUDeviceDescriptor): Promise<GPUDevice>
  requestAdapterInfo(): Promise<GPUAdapterInfo>
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPUDeviceDescriptor extends GPUObjectDescriptorBase {
  requiredFeatures?: GPUFeatureName[]
  requiredLimits?: Record<string, number>
}

/**
 * @category GPU
 * @experimental
 */
declare type GPUFeatureName =
  | 'depth-clip-control'
  | 'depth32float-stencil8'
  | 'pipeline-statistics-query'
  | 'texture-compression-bc'
  | 'texture-compression-etc2'
  | 'texture-compression-astc'
  | 'timestamp-query'
  | 'indirect-first-instance'
  | 'shader-f16'
  | 'rg11b10ufloat-renderable'
  | 'bgra8unorm-storage'
  | 'float32-filterable'
  // extended from spec
  | 'mappable-primary-buffers'
  | 'sampled-texture-binding-array'
  | 'sampled-texture-array-dynamic-indexing'
  | 'sampled-texture-array-non-uniform-indexing'
  | 'unsized-binding-array'
  | 'multi-draw-indirect'
  | 'multi-draw-indirect-count'
  | 'push-constants'
  | 'address-mode-clamp-to-border'
  | 'texture-adapter-specific-format-features'
  | 'shader-float64'
  | 'vertex-attribute-64bit'

/**
 * @category GPU
 * @experimental
 */
declare class GPUDevice extends EventTarget implements GPUObjectBase {
  label: string

  readonly lost: Promise<GPUDeviceLostInfo>
  pushErrorScope(filter: GPUErrorFilter): undefined
  popErrorScope(): Promise<GPUError | null>

  readonly features: GPUSupportedFeatures
  readonly limits: GPUSupportedLimits
  readonly queue: GPUQueue

  destroy(): undefined

  createBuffer(descriptor: GPUBufferDescriptor): GPUBuffer
  createTexture(descriptor: GPUTextureDescriptor): GPUTexture
  createSampler(descriptor?: GPUSamplerDescriptor): GPUSampler

  createBindGroupLayout(descriptor: GPUBindGroupLayoutDescriptor): GPUBindGroupLayout
  createPipelineLayout(descriptor: GPUPipelineLayoutDescriptor): GPUPipelineLayout
  createBindGroup(descriptor: GPUBindGroupDescriptor): GPUBindGroup

  createShaderModule(descriptor: GPUShaderModuleDescriptor): GPUShaderModule
  createComputePipeline(descriptor: GPUComputePipelineDescriptor): GPUComputePipeline
  createRenderPipeline(descriptor: GPURenderPipelineDescriptor): GPURenderPipeline
  createComputePipelineAsync(descriptor: GPUComputePipelineDescriptor): Promise<GPUComputePipeline>
  createRenderPipelineAsync(descriptor: GPURenderPipelineDescriptor): Promise<GPURenderPipeline>

  createCommandEncoder(descriptor?: GPUCommandEncoderDescriptor): GPUCommandEncoder
  createRenderBundleEncoder(descriptor: GPURenderBundleEncoderDescriptor): GPURenderBundleEncoder

  createQuerySet(descriptor: GPUQuerySetDescriptor): GPUQuerySet
}

/**
 * @category GPU
 * @experimental
 */
declare class GPUBuffer implements GPUObjectBase {
  label: string

  readonly size: number
  readonly usage: GPUFlagsConstant
  readonly mapState: GPUBufferMapState

  mapAsync(mode: GPUMapModeFlags, offset?: number, size?: number): Promise<undefined>
  getMappedRange(offset?: number, size?: number): ArrayBuffer
  unmap(): undefined

  destroy(): undefined
}

/**
 * @category GPU
 * @experimental
 */
declare type GPUBufferMapState = 'unmapped' | 'pending' | 'mapped'

/**
 * @category GPU
 * @experimental
 */
declare interface GPUBufferDescriptor extends GPUObjectDescriptorBase {
  size: number
  usage: GPUBufferUsageFlags
  mappedAtCreation?: boolean
}

/**
 * @category GPU
 * @experimental
 */
declare type GPUBufferUsageFlags = number

/**
 * @category GPU
 * @experimental
 */
declare type GPUFlagsConstant = number

/**
 * @category GPU
 * @experimental
 */
declare class GPUBufferUsage {
  static MAP_READ: 0x0001
  static MAP_WRITE: 0x0002
  static COPY_SRC: 0x0004
  static COPY_DST: 0x0008
  static INDEX: 0x0010
  static VERTEX: 0x0020
  static UNIFORM: 0x0040
  static STORAGE: 0x0080
  static INDIRECT: 0x0100
  static QUERY_RESOLVE: 0x0200
}

/**
 * @category GPU
 * @experimental
 */
declare type GPUMapModeFlags = number

/**
 * @category GPU
 * @experimental
 */
declare class GPUMapMode {
  static READ: 0x0001
  static WRITE: 0x0002
}

/**
 * @category GPU
 * @experimental
 */
declare class GPUTexture implements GPUObjectBase {
  label: string

  createView(descriptor?: GPUTextureViewDescriptor): GPUTextureView
  destroy(): undefined

  readonly width: number
  readonly height: number
  readonly depthOrArrayLayers: number
  readonly mipLevelCount: number
  readonly sampleCount: number
  readonly dimension: GPUTextureDimension
  readonly format: GPUTextureFormat
  readonly usage: GPUFlagsConstant
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPUTextureDescriptor extends GPUObjectDescriptorBase {
  size: GPUExtent3D
  mipLevelCount?: number
  sampleCount?: number
  dimension?: GPUTextureDimension
  format: GPUTextureFormat
  usage: GPUTextureUsageFlags
  viewFormats?: GPUTextureFormat[]
}

/**
 * @category GPU
 * @experimental
 */
declare type GPUTextureDimension = '1d' | '2d' | '3d'

/**
 * @category GPU
 * @experimental
 */
declare type GPUTextureUsageFlags = number

/**
 * @category GPU
 * @experimental
 */
declare class GPUTextureUsage {
  static COPY_SRC: 0x01
  static COPY_DST: 0x02
  static TEXTURE_BINDING: 0x04
  static STORAGE_BINDING: 0x08
  static RENDER_ATTACHMENT: 0x10
}

/**
 * @category GPU
 * @experimental
 */
declare class GPUTextureView implements GPUObjectBase {
  label: string
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPUTextureViewDescriptor extends GPUObjectDescriptorBase {
  format?: GPUTextureFormat
  dimension?: GPUTextureViewDimension
  aspect?: GPUTextureAspect
  baseMipLevel?: number
  mipLevelCount?: number
  baseArrayLayer?: number
  arrayLayerCount?: number
}

/**
 * @category GPU
 * @experimental
 */
declare type GPUTextureViewDimension = '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d'

/**
 * @category GPU
 * @experimental
 */
declare type GPUTextureAspect = 'all' | 'stencil-only' | 'depth-only'

/**
 * @category GPU
 * @experimental
 */
declare type GPUTextureFormat =
  | 'r8unorm'
  | 'r8snorm'
  | 'r8uint'
  | 'r8sint'
  | 'r16uint'
  | 'r16sint'
  | 'r16float'
  | 'rg8unorm'
  | 'rg8snorm'
  | 'rg8uint'
  | 'rg8sint'
  | 'r32uint'
  | 'r32sint'
  | 'r32float'
  | 'rg16uint'
  | 'rg16sint'
  | 'rg16float'
  | 'rgba8unorm'
  | 'rgba8unorm-srgb'
  | 'rgba8snorm'
  | 'rgba8uint'
  | 'rgba8sint'
  | 'bgra8unorm'
  | 'bgra8unorm-srgb'
  | 'rgb9e5ufloat'
  | 'rgb10a2uint'
  | 'rgb10a2unorm'
  | 'rg11b10ufloat'
  | 'rg32uint'
  | 'rg32sint'
  | 'rg32float'
  | 'rgba16uint'
  | 'rgba16sint'
  | 'rgba16float'
  | 'rgba32uint'
  | 'rgba32sint'
  | 'rgba32float'
  | 'stencil8'
  | 'depth16unorm'
  | 'depth24plus'
  | 'depth24plus-stencil8'
  | 'depth32float'
  | 'depth32float-stencil8'
  | 'bc1-rgba-unorm'
  | 'bc1-rgba-unorm-srgb'
  | 'bc2-rgba-unorm'
  | 'bc2-rgba-unorm-srgb'
  | 'bc3-rgba-unorm'
  | 'bc3-rgba-unorm-srgb'
  | 'bc4-r-unorm'
  | 'bc4-r-snorm'
  | 'bc5-rg-unorm'
  | 'bc5-rg-snorm'
  | 'bc6h-rgb-ufloat'
  | 'bc6h-rgb-float'
  | 'bc7-rgba-unorm'
  | 'bc7-rgba-unorm-srgb'
  | 'etc2-rgb8unorm'
  | 'etc2-rgb8unorm-srgb'
  | 'etc2-rgb8a1unorm'
  | 'etc2-rgb8a1unorm-srgb'
  | 'etc2-rgba8unorm'
  | 'etc2-rgba8unorm-srgb'
  | 'eac-r11unorm'
  | 'eac-r11snorm'
  | 'eac-rg11unorm'
  | 'eac-rg11snorm'
  | 'astc-4x4-unorm'
  | 'astc-4x4-unorm-srgb'
  | 'astc-5x4-unorm'
  | 'astc-5x4-unorm-srgb'
  | 'astc-5x5-unorm'
  | 'astc-5x5-unorm-srgb'
  | 'astc-6x5-unorm'
  | 'astc-6x5-unorm-srgb'
  | 'astc-6x6-unorm'
  | 'astc-6x6-unorm-srgb'
  | 'astc-8x5-unorm'
  | 'astc-8x5-unorm-srgb'
  | 'astc-8x6-unorm'
  | 'astc-8x6-unorm-srgb'
  | 'astc-8x8-unorm'
  | 'astc-8x8-unorm-srgb'
  | 'astc-10x5-unorm'
  | 'astc-10x5-unorm-srgb'
  | 'astc-10x6-unorm'
  | 'astc-10x6-unorm-srgb'
  | 'astc-10x8-unorm'
  | 'astc-10x8-unorm-srgb'
  | 'astc-10x10-unorm'
  | 'astc-10x10-unorm-srgb'
  | 'astc-12x10-unorm'
  | 'astc-12x10-unorm-srgb'
  | 'astc-12x12-unorm'
  | 'astc-12x12-unorm-srgb'

/**
 * @category GPU
 * @experimental
 */
declare class GPUSampler implements GPUObjectBase {
  label: string
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPUSamplerDescriptor extends GPUObjectDescriptorBase {
  addressModeU?: GPUAddressMode
  addressModeV?: GPUAddressMode
  addressModeW?: GPUAddressMode
  magFilter?: GPUFilterMode
  minFilter?: GPUFilterMode
  mipmapFilter?: GPUMipmapFilterMode
  lodMinClamp?: number
  lodMaxClamp?: number
  compare?: GPUCompareFunction
  maxAnisotropy?: number
}

/**
 * @category GPU
 * @experimental
 */
declare type GPUAddressMode = 'clamp-to-edge' | 'repeat' | 'mirror-repeat'

/**
 * @category GPU
 * @experimental
 */
declare type GPUFilterMode = 'nearest' | 'linear'

/**
 * @category GPU
 * @experimental
 */
declare type GPUMipmapFilterMode = 'nearest' | 'linear'

/**
 * @category GPU
 * @experimental
 */
declare type GPUCompareFunction =
  | 'never'
  | 'less'
  | 'equal'
  | 'less-equal'
  | 'greater'
  | 'not-equal'
  | 'greater-equal'
  | 'always'

/**
 * @category GPU
 * @experimental
 */
declare class GPUBindGroupLayout implements GPUObjectBase {
  label: string
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPUBindGroupLayoutDescriptor extends GPUObjectDescriptorBase {
  entries: GPUBindGroupLayoutEntry[]
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPUBindGroupLayoutEntry {
  binding: number
  visibility: GPUShaderStageFlags

  buffer?: GPUBufferBindingLayout
  sampler?: GPUSamplerBindingLayout
  texture?: GPUTextureBindingLayout
  storageTexture?: GPUStorageTextureBindingLayout
}

/**
 * @category GPU
 * @experimental
 */
declare type GPUShaderStageFlags = number

/**
 * @category GPU
 * @experimental
 */
declare class GPUShaderStage {
  static VERTEX: 0x1
  static FRAGMENT: 0x2
  static COMPUTE: 0x4
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPUBufferBindingLayout {
  type?: GPUBufferBindingType
  hasDynamicOffset?: boolean
  minBindingSize?: number
}

/**
 * @category GPU
 * @experimental
 */
declare type GPUBufferBindingType = 'uniform' | 'storage' | 'read-only-storage'

/**
 * @category GPU
 * @experimental
 */
declare interface GPUSamplerBindingLayout {
  type?: GPUSamplerBindingType
}

/**
 * @category GPU
 * @experimental
 */
declare type GPUSamplerBindingType = 'filtering' | 'non-filtering' | 'comparison'

/**
 * @category GPU
 * @experimental
 */
declare interface GPUTextureBindingLayout {
  sampleType?: GPUTextureSampleType
  viewDimension?: GPUTextureViewDimension
  multisampled?: boolean
}

/**
 * @category GPU
 * @experimental
 */
declare type GPUTextureSampleType = 'float' | 'unfilterable-float' | 'depth' | 'sint' | 'uint'

/**
 * @category GPU
 * @experimental
 */
declare type GPUStorageTextureAccess = 'write-only' | 'read-only' | 'read-write'

/**
 * @category GPU
 * @experimental
 */
declare interface GPUStorageTextureBindingLayout {
  access: GPUStorageTextureAccess
  format: GPUTextureFormat
  viewDimension?: GPUTextureViewDimension
}

/**
 * @category GPU
 * @experimental
 */
declare class GPUBindGroup implements GPUObjectBase {
  label: string
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPUBindGroupDescriptor extends GPUObjectDescriptorBase {
  layout: GPUBindGroupLayout
  entries: GPUBindGroupEntry[]
}

/**
 * @category GPU
 * @experimental
 */
declare type GPUBindingResource = GPUSampler | GPUTextureView | GPUBufferBinding

/**
 * @category GPU
 * @experimental
 */
declare interface GPUBindGroupEntry {
  binding: number
  resource: GPUBindingResource
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPUBufferBinding {
  buffer: GPUBuffer
  offset?: number
  size?: number
}

/**
 * @category GPU
 * @experimental
 */
declare class GPUPipelineLayout implements GPUObjectBase {
  label: string
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPUPipelineLayoutDescriptor extends GPUObjectDescriptorBase {
  bindGroupLayouts: GPUBindGroupLayout[]
}

/**
 * @category GPU
 * @experimental
 */
declare type GPUCompilationMessageType = 'error' | 'warning' | 'info'

/**
 * @category GPU
 * @experimental
 */
declare interface GPUCompilationMessage {
  readonly message: string
  readonly type: GPUCompilationMessageType
  readonly lineNum: number
  readonly linePos: number
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPUCompilationInfo {
  readonly messages: ReadonlyArray<GPUCompilationMessage>
}

/**
 * @category GPU
 * @experimental
 */
declare class GPUPipelineError extends DOMException {
  constructor(message?: string, options?: GPUPipelineErrorInit)

  readonly reason: GPUPipelineErrorReason
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPUPipelineErrorInit {
  reason: GPUPipelineErrorReason
}

/**
 * @category GPU
 * @experimental
 */
declare type GPUPipelineErrorReason = 'validation' | 'internal'

/**
 * @category GPU
 * @experimental
 */
declare class GPUShaderModule implements GPUObjectBase {
  label: string
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPUShaderModuleDescriptor extends GPUObjectDescriptorBase {
  code: string
  sourceMap?: any
}

/**
 * @category GPU
 * @experimental
 */
declare type GPUAutoLayoutMode = 'auto'

/**
 * @category GPU
 * @experimental
 */
declare interface GPUPipelineDescriptorBase extends GPUObjectDescriptorBase {
  layout: GPUPipelineLayout | GPUAutoLayoutMode
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPUPipelineBase {
  getBindGroupLayout(index: number): GPUBindGroupLayout
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPUProgrammableStage {
  module: GPUShaderModule
  entryPoint?: string
  constants?: Record<string, number>
}

/**
 * @category GPU
 * @experimental
 */
declare class GPUComputePipeline implements GPUObjectBase, GPUPipelineBase {
  label: string

  getBindGroupLayout(index: number): GPUBindGroupLayout
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPUComputePipelineDescriptor extends GPUPipelineDescriptorBase {
  compute: GPUProgrammableStage
}

/**
 * @category GPU
 * @experimental
 */
declare class GPURenderPipeline implements GPUObjectBase, GPUPipelineBase {
  label: string

  getBindGroupLayout(index: number): GPUBindGroupLayout
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPURenderPipelineDescriptor extends GPUPipelineDescriptorBase {
  vertex: GPUVertexState
  primitive?: GPUPrimitiveState
  depthStencil?: GPUDepthStencilState
  multisample?: GPUMultisampleState
  fragment?: GPUFragmentState
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPUPrimitiveState {
  topology?: GPUPrimitiveTopology
  stripIndexFormat?: GPUIndexFormat
  frontFace?: GPUFrontFace
  cullMode?: GPUCullMode
  unclippedDepth?: boolean
}

/**
 * @category GPU
 * @experimental
 */
declare type GPUPrimitiveTopology =
  | 'point-list'
  | 'line-list'
  | 'line-strip'
  | 'triangle-list'
  | 'triangle-strip'

/**
 * @category GPU
 * @experimental
 */
declare type GPUFrontFace = 'ccw' | 'cw'

/**
 * @category GPU
 * @experimental
 */
declare type GPUCullMode = 'none' | 'front' | 'back'

/**
 * @category GPU
 * @experimental
 */
declare interface GPUMultisampleState {
  count?: number
  mask?: number
  alphaToCoverageEnabled?: boolean
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPUFragmentState extends GPUProgrammableStage {
  targets: (GPUColorTargetState | null)[]
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPUColorTargetState {
  format: GPUTextureFormat

  blend?: GPUBlendState
  writeMask?: GPUColorWriteFlags
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPUBlendState {
  color: GPUBlendComponent
  alpha: GPUBlendComponent
}

/**
 * @category GPU
 * @experimental
 */
declare type GPUColorWriteFlags = number

/**
 * @category GPU
 * @experimental
 */
declare class GPUColorWrite {
  static RED: 0x1
  static GREEN: 0x2
  static BLUE: 0x4
  static ALPHA: 0x8
  static ALL: 0xf
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPUBlendComponent {
  operation?: GPUBlendOperation
  srcFactor?: GPUBlendFactor
  dstFactor?: GPUBlendFactor
}

/**
 * @category GPU
 * @experimental
 */
declare type GPUBlendFactor =
  | 'zero'
  | 'one'
  | 'src'
  | 'one-minus-src'
  | 'src-alpha'
  | 'one-minus-src-alpha'
  | 'dst'
  | 'one-minus-dst'
  | 'dst-alpha'
  | 'one-minus-dst-alpha'
  | 'src-alpha-saturated'
  | 'constant'
  | 'one-minus-constant'

/**
 * @category GPU
 * @experimental
 */
declare type GPUBlendOperation = 'add' | 'subtract' | 'reverse-subtract' | 'min' | 'max'

/**
 * @category GPU
 * @experimental
 */
declare interface GPUDepthStencilState {
  format: GPUTextureFormat

  depthWriteEnabled: boolean
  depthCompare: GPUCompareFunction

  stencilFront?: GPUStencilFaceState
  stencilBack?: GPUStencilFaceState

  stencilReadMask?: number
  stencilWriteMask?: number

  depthBias?: number
  depthBiasSlopeScale?: number
  depthBiasClamp?: number
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPUStencilFaceState {
  compare?: GPUCompareFunction
  failOp?: GPUStencilOperation
  depthFailOp?: GPUStencilOperation
  passOp?: GPUStencilOperation
}

/**
 * @category GPU
 * @experimental
 */
declare type GPUStencilOperation =
  | 'keep'
  | 'zero'
  | 'replace'
  | 'invert'
  | 'increment-clamp'
  | 'decrement-clamp'
  | 'increment-wrap'
  | 'decrement-wrap'

/**
 * @category GPU
 * @experimental
 */
declare type GPUIndexFormat = 'uint16' | 'uint32'

/**
 * @category GPU
 * @experimental
 */
declare type GPUVertexFormat =
  | 'uint8x2'
  | 'uint8x4'
  | 'sint8x2'
  | 'sint8x4'
  | 'unorm8x2'
  | 'unorm8x4'
  | 'snorm8x2'
  | 'snorm8x4'
  | 'uint16x2'
  | 'uint16x4'
  | 'sint16x2'
  | 'sint16x4'
  | 'unorm16x2'
  | 'unorm16x4'
  | 'snorm16x2'
  | 'snorm16x4'
  | 'float16x2'
  | 'float16x4'
  | 'float32'
  | 'float32x2'
  | 'float32x3'
  | 'float32x4'
  | 'uint32'
  | 'uint32x2'
  | 'uint32x3'
  | 'uint32x4'
  | 'sint32'
  | 'sint32x2'
  | 'sint32x3'
  | 'sint32x4'
  | 'unorm10-10-10-2'

/**
 * @category GPU
 * @experimental
 */
declare type GPUVertexStepMode = 'vertex' | 'instance'

/**
 * @category GPU
 * @experimental
 */
declare interface GPUVertexState extends GPUProgrammableStage {
  buffers?: (GPUVertexBufferLayout | null)[]
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPUVertexBufferLayout {
  arrayStride: number
  stepMode?: GPUVertexStepMode
  attributes: GPUVertexAttribute[]
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPUVertexAttribute {
  format: GPUVertexFormat
  offset: number

  shaderLocation: number
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPUImageDataLayout {
  offset?: number
  bytesPerRow?: number
  rowsPerImage?: number
}

/**
 * @category GPU
 * @experimental
 */
declare class GPUCommandBuffer implements GPUObjectBase {
  label: string
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPUCommandBufferDescriptor extends GPUObjectDescriptorBase {}

/**
 * @category GPU
 * @experimental
 */
declare class GPUCommandEncoder implements GPUObjectBase {
  label: string

  beginRenderPass(descriptor: GPURenderPassDescriptor): GPURenderPassEncoder
  beginComputePass(descriptor?: GPUComputePassDescriptor): GPUComputePassEncoder

  copyBufferToBuffer(
    source: GPUBuffer,
    sourceOffset: number,
    destination: GPUBuffer,
    destinationOffset: number,
    size: number
  ): undefined

  copyBufferToTexture(
    source: GPUImageCopyBuffer,
    destination: GPUImageCopyTexture,
    copySize: GPUExtent3D
  ): undefined

  copyTextureToBuffer(
    source: GPUImageCopyTexture,
    destination: GPUImageCopyBuffer,
    copySize: GPUExtent3D
  ): undefined

  copyTextureToTexture(
    source: GPUImageCopyTexture,
    destination: GPUImageCopyTexture,
    copySize: GPUExtent3D
  ): undefined

  clearBuffer(destination: GPUBuffer, destinationOffset?: number, size?: number): undefined

  pushDebugGroup(groupLabel: string): undefined
  popDebugGroup(): undefined
  insertDebugMarker(markerLabel: string): undefined

  writeTimestamp(querySet: GPUQuerySet, queryIndex: number): undefined

  resolveQuerySet(
    querySet: GPUQuerySet,
    firstQuery: number,
    queryCount: number,
    destination: GPUBuffer,
    destinationOffset: number
  ): undefined

  finish(descriptor?: GPUCommandBufferDescriptor): GPUCommandBuffer
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPUCommandEncoderDescriptor extends GPUObjectDescriptorBase {}

/**
 * @category GPU
 * @experimental
 */
declare interface GPUImageCopyBuffer extends GPUImageDataLayout {
  buffer: GPUBuffer
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPUImageCopyTexture {
  texture: GPUTexture
  mipLevel?: number
  origin?: GPUOrigin3D
  aspect?: GPUTextureAspect
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPUProgrammablePassEncoder {
  setBindGroup(index: number, bindGroup: GPUBindGroup, dynamicOffsets?: number[]): undefined

  setBindGroup(
    index: number,
    bindGroup: GPUBindGroup,
    dynamicOffsetsData: Uint32Array,
    dynamicOffsetsDataStart: number,
    dynamicOffsetsDataLength: number
  ): undefined

  pushDebugGroup(groupLabel: string): undefined
  popDebugGroup(): undefined
  insertDebugMarker(markerLabel: string): undefined
}

/**
 * @category GPU
 * @experimental
 */
declare class GPUComputePassEncoder implements GPUObjectBase, GPUProgrammablePassEncoder {
  label: string
  setBindGroup(index: number, bindGroup: GPUBindGroup, dynamicOffsets?: number[]): undefined
  setBindGroup(
    index: number,
    bindGroup: GPUBindGroup,
    dynamicOffsetsData: Uint32Array,
    dynamicOffsetsDataStart: number,
    dynamicOffsetsDataLength: number
  ): undefined
  pushDebugGroup(groupLabel: string): undefined
  popDebugGroup(): undefined
  insertDebugMarker(markerLabel: string): undefined
  setPipeline(pipeline: GPUComputePipeline): undefined
  dispatchWorkgroups(x: number, y?: number, z?: number): undefined
  dispatchWorkgroupsIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): undefined

  end(): undefined
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPUComputePassTimestampWrites {
  querySet: GPUQuerySet
  beginningOfPassWriteIndex?: number
  endOfPassWriteIndex?: number
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPUComputePassDescriptor extends GPUObjectDescriptorBase {
  timestampWrites?: GPUComputePassTimestampWrites
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPURenderEncoderBase {
  setPipeline(pipeline: GPURenderPipeline): undefined

  setIndexBuffer(
    buffer: GPUBuffer,
    indexFormat: GPUIndexFormat,
    offset?: number,
    size?: number
  ): undefined
  setVertexBuffer(slot: number, buffer: GPUBuffer, offset?: number, size?: number): undefined

  draw(
    vertexCount: number,
    instanceCount?: number,
    firstVertex?: number,
    firstInstance?: number
  ): undefined
  drawIndexed(
    indexCount: number,
    instanceCount?: number,
    firstIndex?: number,
    baseVertex?: number,
    firstInstance?: number
  ): undefined

  drawIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): undefined
  drawIndexedIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): undefined
}

/**
 * @category GPU
 * @experimental
 */
declare class GPURenderPassEncoder
  implements GPUObjectBase, GPUProgrammablePassEncoder, GPURenderEncoderBase
{
  label: string
  setBindGroup(index: number, bindGroup: GPUBindGroup, dynamicOffsets?: number[]): undefined
  setBindGroup(
    index: number,
    bindGroup: GPUBindGroup,
    dynamicOffsetsData: Uint32Array,
    dynamicOffsetsDataStart: number,
    dynamicOffsetsDataLength: number
  ): undefined
  pushDebugGroup(groupLabel: string): undefined
  popDebugGroup(): undefined
  insertDebugMarker(markerLabel: string): undefined
  setPipeline(pipeline: GPURenderPipeline): undefined
  setIndexBuffer(
    buffer: GPUBuffer,
    indexFormat: GPUIndexFormat,
    offset?: number,
    size?: number
  ): undefined
  setVertexBuffer(slot: number, buffer: GPUBuffer, offset?: number, size?: number): undefined
  draw(
    vertexCount: number,
    instanceCount?: number,
    firstVertex?: number,
    firstInstance?: number
  ): undefined
  drawIndexed(
    indexCount: number,
    instanceCount?: number,
    firstIndex?: number,
    baseVertex?: number,
    firstInstance?: number
  ): undefined
  drawIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): undefined
  drawIndexedIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): undefined

  setViewport(
    x: number,
    y: number,
    width: number,
    height: number,
    minDepth: number,
    maxDepth: number
  ): undefined

  setScissorRect(x: number, y: number, width: number, height: number): undefined

  setBlendConstant(color: GPUColor): undefined
  setStencilReference(reference: number): undefined

  beginOcclusionQuery(queryIndex: number): undefined
  endOcclusionQuery(): undefined

  executeBundles(bundles: GPURenderBundle[]): undefined
  end(): undefined
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPURenderPassTimestampWrites {
  querySet: GPUQuerySet
  beginningOfPassWriteIndex?: number
  endOfPassWriteIndex?: number
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPURenderPassDescriptor extends GPUObjectDescriptorBase {
  colorAttachments: (GPURenderPassColorAttachment | null)[]
  depthStencilAttachment?: GPURenderPassDepthStencilAttachment
  occlusionQuerySet?: GPUQuerySet
  timestampWrites?: GPURenderPassTimestampWrites
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPURenderPassColorAttachment {
  view: GPUTextureView
  resolveTarget?: GPUTextureView

  clearValue?: GPUColor
  loadOp: GPULoadOp
  storeOp: GPUStoreOp
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPURenderPassDepthStencilAttachment {
  view: GPUTextureView

  depthClearValue?: number
  depthLoadOp?: GPULoadOp
  depthStoreOp?: GPUStoreOp
  depthReadOnly?: boolean

  stencilClearValue?: number
  stencilLoadOp?: GPULoadOp
  stencilStoreOp?: GPUStoreOp
  stencilReadOnly?: boolean
}

/**
 * @category GPU
 * @experimental
 */
declare type GPULoadOp = 'load' | 'clear'

/**
 * @category GPU
 * @experimental
 */
declare type GPUStoreOp = 'store' | 'discard'

/**
 * @category GPU
 * @experimental
 */
declare class GPURenderBundle implements GPUObjectBase {
  label: string
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPURenderBundleDescriptor extends GPUObjectDescriptorBase {}

/**
 * @category GPU
 * @experimental
 */
declare class GPURenderBundleEncoder
  implements GPUObjectBase, GPUProgrammablePassEncoder, GPURenderEncoderBase
{
  label: string
  draw(
    vertexCount: number,
    instanceCount?: number,
    firstVertex?: number,
    firstInstance?: number
  ): undefined
  drawIndexed(
    indexCount: number,
    instanceCount?: number,
    firstIndex?: number,
    baseVertex?: number,
    firstInstance?: number
  ): undefined
  drawIndexedIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): undefined
  drawIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): undefined
  insertDebugMarker(markerLabel: string): undefined
  popDebugGroup(): undefined
  pushDebugGroup(groupLabel: string): undefined
  setBindGroup(index: number, bindGroup: GPUBindGroup, dynamicOffsets?: number[]): undefined
  setBindGroup(
    index: number,
    bindGroup: GPUBindGroup,
    dynamicOffsetsData: Uint32Array,
    dynamicOffsetsDataStart: number,
    dynamicOffsetsDataLength: number
  ): undefined
  setIndexBuffer(
    buffer: GPUBuffer,
    indexFormat: GPUIndexFormat,
    offset?: number,
    size?: number
  ): undefined
  setPipeline(pipeline: GPURenderPipeline): undefined
  setVertexBuffer(slot: number, buffer: GPUBuffer, offset?: number, size?: number): undefined

  finish(descriptor?: GPURenderBundleDescriptor): GPURenderBundle
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPURenderPassLayout extends GPUObjectDescriptorBase {
  colorFormats: (GPUTextureFormat | null)[]
  depthStencilFormat?: GPUTextureFormat
  sampleCount?: number
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPURenderBundleEncoderDescriptor extends GPURenderPassLayout {
  depthReadOnly?: boolean
  stencilReadOnly?: boolean
}

/**
 * @category GPU
 * @experimental
 */
declare class GPUQueue implements GPUObjectBase {
  label: string

  submit(commandBuffers: GPUCommandBuffer[]): undefined

  onSubmittedWorkDone(): Promise<undefined>

  writeBuffer(
    buffer: GPUBuffer,
    bufferOffset: number,
    data: BufferSource,
    dataOffset?: number,
    size?: number
  ): undefined

  writeTexture(
    destination: GPUImageCopyTexture,
    data: BufferSource,
    dataLayout: GPUImageDataLayout,
    size: GPUExtent3D
  ): undefined
}

/**
 * @category GPU
 * @experimental
 */
declare class GPUQuerySet implements GPUObjectBase {
  label: string

  destroy(): undefined

  readonly type: GPUQueryType
  readonly count: number
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPUQuerySetDescriptor extends GPUObjectDescriptorBase {
  type: GPUQueryType
  count: number
}

/**
 * @category GPU
 * @experimental
 */
declare type GPUQueryType = 'occlusion' | 'timestamp'

/**
 * @category GPU
 * @experimental
 */
declare type GPUDeviceLostReason = 'destroyed'

/**
 * @category GPU
 * @experimental
 */
declare interface GPUDeviceLostInfo {
  readonly reason: GPUDeviceLostReason
  readonly message: string
}

/**
 * @category GPU
 * @experimental
 */
declare class GPUError {
  readonly message: string
}

/**
 * @category GPU
 * @experimental
 */
declare class GPUOutOfMemoryError extends GPUError {
  constructor(message: string)
}

/**
 * @category GPU
 * @experimental
 */
declare class GPUValidationError extends GPUError {
  constructor(message: string)
}

/**
 * @category GPU
 * @experimental
 */
declare class GPUInternalError extends GPUError {
  constructor(message: string)
}

/**
 * @category GPU
 * @experimental
 */
declare type GPUErrorFilter = 'out-of-memory' | 'validation' | 'internal'

/**
 * @category GPU
 * @experimental
 */
declare class GPUUncapturedErrorEvent extends Event {
  constructor(type: string, gpuUncapturedErrorEventInitDict: GPUUncapturedErrorEventInit)

  readonly error: GPUError
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPUUncapturedErrorEventInit extends EventInit {
  error: GPUError
}

/**
 * @category GPU
 * @experimental
 */
declare interface GPUColorDict {
  r: number
  g: number
  b: number
  a: number
}

/**
 * @category GPU
 * @experimental
 */
declare type GPUColor = number[] | GPUColorDict

/**
 * @category GPU
 * @experimental
 */
declare interface GPUOrigin3DDict {
  x?: number
  y?: number
  z?: number
}

/**
 * @category GPU
 * @experimental
 */
declare type GPUOrigin3D = number[] | GPUOrigin3DDict

/**
 * @category GPU
 * @experimental
 */
declare interface GPUExtent3DDict {
  width: number
  height?: number
  depthOrArrayLayers?: number
}

/**
 * @category GPU
 * @experimental
 */
declare type GPUExtent3D = number[] | GPUExtent3DDict

/**
 * @category GPU
 * @experimental
 */
declare type GPUCanvasAlphaMode = 'opaque' | 'premultiplied'

/**
 * @category GPU
 * @experimental
 */
declare interface GPUCanvasConfiguration {
  device: GPUDevice
  format: GPUTextureFormat
  usage?: GPUTextureUsageFlags
  viewFormats?: GPUTextureFormat[]
  colorSpace?: 'srgb' | 'display-p3'
  alphaMode?: GPUCanvasAlphaMode
  width: number
  height: number
}
/**
 * @category GPU
 * @experimental
 */
declare interface GPUCanvasContext {
  configure(configuration: GPUCanvasConfiguration): undefined
  unconfigure(): undefined
  getCurrentTexture(): GPUTexture
}

// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// deno-lint-ignore-file no-explicit-any no-var

/// <reference no-default-lib="true" />
/// <reference lib="esnext" />

/** @category WebSockets */
declare interface CloseEventInit extends EventInit {
  code?: number
  reason?: string
  wasClean?: boolean
}

/** @category WebSockets */
declare interface CloseEvent extends Event {
  /**
   * Returns the WebSocket connection close code provided by the server.
   */
  readonly code: number
  /**
   * Returns the WebSocket connection close reason provided by the server.
   */
  readonly reason: string
  /**
   * Returns true if the connection closed cleanly; false otherwise.
   */
  readonly wasClean: boolean
}

/** @category WebSockets */
declare var CloseEvent: {
  readonly prototype: CloseEvent
  new (type: string, eventInitDict?: CloseEventInit): CloseEvent
}

/** @category WebSockets */
declare interface WebSocketEventMap {
  close: CloseEvent
  error: Event
  message: MessageEvent
  open: Event
}

/**
 * Provides the API for creating and managing a WebSocket connection to a
 * server, as well as for sending and receiving data on the connection.
 *
 * If you are looking to create a WebSocket server, please take a look at
 * `Deno.upgradeWebSocket()`.
 *
 * @tags allow-net
 * @category WebSockets
 */
declare interface WebSocket extends EventTarget {
  /**
   * Returns a string that indicates how binary data from the WebSocket object is exposed to scripts:
   *
   * Can be set, to change how binary data is returned. The default is "blob".
   */
  binaryType: BinaryType
  /**
   * Returns the number of bytes of application data (UTF-8 text and binary data) that have been queued using send() but not yet been transmitted to the network.
   *
   * If the WebSocket connection is closed, this attribute's value will only increase with each call to the send() method. (The number does not reset to zero once the connection closes.)
   */
  readonly bufferedAmount: number
  /**
   * Returns the extensions selected by the server, if any.
   */
  readonly extensions: string
  onclose: ((this: WebSocket, ev: CloseEvent) => any) | null
  onerror: ((this: WebSocket, ev: Event | ErrorEvent) => any) | null
  onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null
  onopen: ((this: WebSocket, ev: Event) => any) | null
  /**
   * Returns the subprotocol selected by the server, if any. It can be used in conjunction with the array form of the constructor's second argument to perform subprotocol negotiation.
   */
  readonly protocol: string
  /**
   * Returns the state of the WebSocket object's connection. It can have the values described below.
   */
  readonly readyState: number
  /**
   * Returns the URL that was used to establish the WebSocket connection.
   */
  readonly url: string
  /**
   * Closes the WebSocket connection, optionally using code as the WebSocket connection close code and reason as the WebSocket connection close reason.
   */
  close(code?: number, reason?: string): void
  /**
   * Transmits data using the WebSocket connection. data can be a string, a Blob, an ArrayBuffer, or an ArrayBufferView.
   */
  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void
  readonly CLOSED: number
  readonly CLOSING: number
  readonly CONNECTING: number
  readonly OPEN: number
  addEventListener<K extends keyof WebSocketEventMap>(
    type: K,
    listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void
  removeEventListener<K extends keyof WebSocketEventMap>(
    type: K,
    listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void
}

/** @category WebSockets */
declare var WebSocket: {
  readonly prototype: WebSocket
  new (url: string | URL, protocols?: string | string[]): WebSocket
  readonly CLOSED: number
  readonly CLOSING: number
  readonly CONNECTING: number
  readonly OPEN: number
}

/** @category WebSockets */
declare type BinaryType = 'arraybuffer' | 'blob'

// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// deno-lint-ignore-file no-explicit-any no-var

/// <reference no-default-lib="true" />
/// <reference lib="esnext" />

/** This Web Storage API interface provides access to a particular domain's
 * session or local storage. It allows, for example, the addition, modification,
 * or deletion of stored data items.
 *
 * @category Storage
 */
declare interface Storage {
  /**
   * Returns the number of key/value pairs currently present in the list associated with the object.
   */
  readonly length: number
  /**
   * Empties the list associated with the object of all key/value pairs, if there are any.
   */
  clear(): void
  /**
   * Returns the current value associated with the given key, or null if the given key does not exist in the list associated with the object.
   */
  getItem(key: string): string | null
  /**
   * Returns the name of the nth key in the list, or null if n is greater than or equal to the number of key/value pairs in the object.
   */
  key(index: number): string | null
  /**
   * Removes the key/value pair with the given key from the list associated with the object, if a key/value pair with the given key exists.
   */
  removeItem(key: string): void
  /**
   * Sets the value of the pair identified by key to value, creating a new key/value pair if none existed for key previously.
   *
   * Throws a "QuotaExceededError" DOMException exception if the new value couldn't be set. (Setting could fail if, e.g., the user has disabled storage for the site, or if the quota has been exceeded.)
   */
  setItem(key: string, value: string): void
  [name: string]: any
}

/** @category Storage */
declare var Storage: {
  readonly prototype: Storage
  new (): never
}

// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// deno-lint-ignore-file no-var

/// <reference no-default-lib="true" />
/// <reference lib="esnext" />

/** @category Canvas */
declare type ColorSpaceConversion = 'default' | 'none'

/** @category Canvas */
declare type ImageOrientation = 'flipY' | 'from-image' | 'none'

/** @category Canvas */
declare type PremultiplyAlpha = 'default' | 'none' | 'premultiply'

/** @category Canvas */
declare type ResizeQuality = 'high' | 'low' | 'medium' | 'pixelated'

/** @category Canvas */
declare type ImageBitmapSource = Blob | ImageData

/** @category Canvas */
declare interface ImageBitmapOptions {
  colorSpaceConversion?: ColorSpaceConversion
  imageOrientation?: ImageOrientation
  premultiplyAlpha?: PremultiplyAlpha
  resizeHeight?: number
  resizeQuality?: ResizeQuality
  resizeWidth?: number
}

/** @category Canvas */
declare function createImageBitmap(
  image: ImageBitmapSource,
  options?: ImageBitmapOptions
): Promise<ImageBitmap>
/** @category Canvas */
declare function createImageBitmap(
  image: ImageBitmapSource,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  options?: ImageBitmapOptions
): Promise<ImageBitmap>

/** @category Canvas */
declare interface ImageBitmap {
  readonly height: number
  readonly width: number
  close(): void
}

/** @category Canvas */
declare var ImageBitmap: {
  prototype: ImageBitmap
  new (): ImageBitmap
}

// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// deno-lint-ignore-file no-var

/// <reference no-default-lib="true" />
/// <reference lib="esnext" />

/** @category Crypto */
declare var crypto: Crypto

/** @category Crypto */
declare interface Algorithm {
  name: string
}

/** @category Crypto */
declare interface KeyAlgorithm {
  name: string
}

/** @category Crypto */
declare type AlgorithmIdentifier = string | Algorithm
/** @category Crypto */
declare type HashAlgorithmIdentifier = AlgorithmIdentifier
/** @category Crypto */
declare type KeyType = 'private' | 'public' | 'secret'
/** @category Crypto */
declare type KeyUsage =
  | 'decrypt'
  | 'deriveBits'
  | 'deriveKey'
  | 'encrypt'
  | 'sign'
  | 'unwrapKey'
  | 'verify'
  | 'wrapKey'
/** @category Crypto */
declare type KeyFormat = 'jwk' | 'pkcs8' | 'raw' | 'spki'
/** @category Crypto */
declare type NamedCurve = string

/** @category Crypto */
declare interface RsaOtherPrimesInfo {
  d?: string
  r?: string
  t?: string
}

/** @category Crypto */
declare interface JsonWebKey {
  alg?: string
  crv?: string
  d?: string
  dp?: string
  dq?: string
  e?: string
  ext?: boolean
  k?: string
  key_ops?: string[]
  kty?: string
  n?: string
  oth?: RsaOtherPrimesInfo[]
  p?: string
  q?: string
  qi?: string
  use?: string
  x?: string
  y?: string
}

/** @category Crypto */
declare interface AesCbcParams extends Algorithm {
  iv: BufferSource
}

/** @category Crypto */
declare interface AesGcmParams extends Algorithm {
  iv: BufferSource
  additionalData?: BufferSource
  tagLength?: number
}

/** @category Crypto */
declare interface AesCtrParams extends Algorithm {
  counter: BufferSource
  length: number
}

/** @category Crypto */
declare interface HmacKeyGenParams extends Algorithm {
  hash: HashAlgorithmIdentifier
  length?: number
}

/** @category Crypto */
declare interface EcKeyGenParams extends Algorithm {
  namedCurve: NamedCurve
}

/** @category Crypto */
declare interface EcKeyImportParams extends Algorithm {
  namedCurve: NamedCurve
}

/** @category Crypto */
declare interface EcdsaParams extends Algorithm {
  hash: HashAlgorithmIdentifier
}

/** @category Crypto */
declare interface RsaHashedImportParams extends Algorithm {
  hash: HashAlgorithmIdentifier
}

/** @category Crypto */
declare interface RsaHashedKeyGenParams extends RsaKeyGenParams {
  hash: HashAlgorithmIdentifier
}

/** @category Crypto */
declare interface RsaKeyGenParams extends Algorithm {
  modulusLength: number
  publicExponent: Uint8Array
}

/** @category Crypto */
declare interface RsaPssParams extends Algorithm {
  saltLength: number
}

/** @category Crypto */
declare interface RsaOaepParams extends Algorithm {
  label?: Uint8Array
}

/** @category Crypto */
declare interface HmacImportParams extends Algorithm {
  hash: HashAlgorithmIdentifier
  length?: number
}

/** @category Crypto */
declare interface EcKeyAlgorithm extends KeyAlgorithm {
  namedCurve: NamedCurve
}

/** @category Crypto */
declare interface HmacKeyAlgorithm extends KeyAlgorithm {
  hash: KeyAlgorithm
  length: number
}

/** @category Crypto */
declare interface RsaHashedKeyAlgorithm extends RsaKeyAlgorithm {
  hash: KeyAlgorithm
}

/** @category Crypto */
declare interface RsaKeyAlgorithm extends KeyAlgorithm {
  modulusLength: number
  publicExponent: Uint8Array
}

/** @category Crypto */
declare interface HkdfParams extends Algorithm {
  hash: HashAlgorithmIdentifier
  info: BufferSource
  salt: BufferSource
}

/** @category Crypto */
declare interface Pbkdf2Params extends Algorithm {
  hash: HashAlgorithmIdentifier
  iterations: number
  salt: BufferSource
}

/** @category Crypto */
declare interface AesDerivedKeyParams extends Algorithm {
  length: number
}

/** @category Crypto */
declare interface EcdhKeyDeriveParams extends Algorithm {
  public: CryptoKey
}

/** @category Crypto */
declare interface AesKeyGenParams extends Algorithm {
  length: number
}

/** @category Crypto */
declare interface AesKeyAlgorithm extends KeyAlgorithm {
  length: number
}

/** The CryptoKey dictionary of the Web Crypto API represents a cryptographic
 * key.
 *
 * @category Crypto
 */
declare interface CryptoKey {
  readonly algorithm: KeyAlgorithm
  readonly extractable: boolean
  readonly type: KeyType
  readonly usages: KeyUsage[]
}

/** @category Crypto */
declare var CryptoKey: {
  readonly prototype: CryptoKey
  new (): never
}

/** The CryptoKeyPair dictionary of the Web Crypto API represents a key pair for
 * an asymmetric cryptography algorithm, also known as a public-key algorithm.
 *
 * @category Crypto
 */
declare interface CryptoKeyPair {
  privateKey: CryptoKey
  publicKey: CryptoKey
}

/** @category Crypto */
declare var CryptoKeyPair: {
  readonly prototype: CryptoKeyPair
  new (): never
}

/** This Web Crypto API interface provides a number of low-level cryptographic
 * functions. It is accessed via the Crypto.subtle properties available in a
 * window context (via Window.crypto).
 *
 * @category Crypto
 */
declare interface SubtleCrypto {
  generateKey(
    algorithm: RsaHashedKeyGenParams | EcKeyGenParams,
    extractable: boolean,
    keyUsages: KeyUsage[]
  ): Promise<CryptoKeyPair>
  generateKey(
    algorithm: AesKeyGenParams | HmacKeyGenParams,
    extractable: boolean,
    keyUsages: KeyUsage[]
  ): Promise<CryptoKey>
  generateKey(
    algorithm: AlgorithmIdentifier,
    extractable: boolean,
    keyUsages: KeyUsage[]
  ): Promise<CryptoKeyPair | CryptoKey>
  importKey(
    format: 'jwk',
    keyData: JsonWebKey,
    algorithm: AlgorithmIdentifier | HmacImportParams | RsaHashedImportParams | EcKeyImportParams,
    extractable: boolean,
    keyUsages: KeyUsage[]
  ): Promise<CryptoKey>
  importKey(
    format: Exclude<KeyFormat, 'jwk'>,
    keyData: BufferSource,
    algorithm: AlgorithmIdentifier | HmacImportParams | RsaHashedImportParams | EcKeyImportParams,
    extractable: boolean,
    keyUsages: KeyUsage[]
  ): Promise<CryptoKey>
  exportKey(format: 'jwk', key: CryptoKey): Promise<JsonWebKey>
  exportKey(format: Exclude<KeyFormat, 'jwk'>, key: CryptoKey): Promise<ArrayBuffer>
  sign(
    algorithm: AlgorithmIdentifier | RsaPssParams | EcdsaParams,
    key: CryptoKey,
    data: BufferSource
  ): Promise<ArrayBuffer>
  verify(
    algorithm: AlgorithmIdentifier | RsaPssParams | EcdsaParams,
    key: CryptoKey,
    signature: BufferSource,
    data: BufferSource
  ): Promise<boolean>
  digest(algorithm: AlgorithmIdentifier, data: BufferSource): Promise<ArrayBuffer>
  encrypt(
    algorithm: AlgorithmIdentifier | RsaOaepParams | AesCbcParams | AesGcmParams | AesCtrParams,
    key: CryptoKey,
    data: BufferSource
  ): Promise<ArrayBuffer>
  decrypt(
    algorithm: AlgorithmIdentifier | RsaOaepParams | AesCbcParams | AesGcmParams | AesCtrParams,
    key: CryptoKey,
    data: BufferSource
  ): Promise<ArrayBuffer>
  deriveBits(
    algorithm: AlgorithmIdentifier | HkdfParams | Pbkdf2Params | EcdhKeyDeriveParams,
    baseKey: CryptoKey,
    length: number
  ): Promise<ArrayBuffer>
  deriveKey(
    algorithm: AlgorithmIdentifier | HkdfParams | Pbkdf2Params | EcdhKeyDeriveParams,
    baseKey: CryptoKey,
    derivedKeyType:
      | AlgorithmIdentifier
      | AesDerivedKeyParams
      | HmacImportParams
      | HkdfParams
      | Pbkdf2Params,
    extractable: boolean,
    keyUsages: KeyUsage[]
  ): Promise<CryptoKey>
  wrapKey(
    format: KeyFormat,
    key: CryptoKey,
    wrappingKey: CryptoKey,
    wrapAlgorithm: AlgorithmIdentifier | RsaOaepParams | AesCbcParams | AesCtrParams
  ): Promise<ArrayBuffer>
  unwrapKey(
    format: KeyFormat,
    wrappedKey: BufferSource,
    unwrappingKey: CryptoKey,
    unwrapAlgorithm: AlgorithmIdentifier | RsaOaepParams | AesCbcParams | AesCtrParams,
    unwrappedKeyAlgorithm:
      | AlgorithmIdentifier
      | HmacImportParams
      | RsaHashedImportParams
      | EcKeyImportParams,
    extractable: boolean,
    keyUsages: KeyUsage[]
  ): Promise<CryptoKey>
}

/** @category Crypto */
declare var SubtleCrypto: {
  readonly prototype: SubtleCrypto
  new (): never
}

/** @category Crypto */
declare interface Crypto {
  readonly subtle: SubtleCrypto
  getRandomValues<
    T extends
      | Int8Array
      | Int16Array
      | Int32Array
      | Uint8Array
      | Uint16Array
      | Uint32Array
      | Uint8ClampedArray
      | BigInt64Array
      | BigUint64Array,
  >(
    array: T
  ): T
  randomUUID(): `${string}-${string}-${string}-${string}-${string}`
}

/** @category Crypto */
declare var Crypto: {
  readonly prototype: Crypto
  new (): never
}

// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// deno-lint-ignore-file no-explicit-any no-var

/// <reference no-default-lib="true" />
/// <reference lib="esnext" />

/**
 * @category Messaging
 * @experimental
 */
declare interface BroadcastChannelEventMap {
  message: MessageEvent
  messageerror: MessageEvent
}

/**
 * @category Messaging
 * @experimental
 */
declare interface BroadcastChannel extends EventTarget {
  /**
   * Returns the channel name (as passed to the constructor).
   */
  readonly name: string
  onmessage: ((this: BroadcastChannel, ev: MessageEvent) => any) | null
  onmessageerror: ((this: BroadcastChannel, ev: MessageEvent) => any) | null
  /**
   * Closes the BroadcastChannel object, opening it up to garbage collection.
   */
  close(): void
  /**
   * Sends the given message to other BroadcastChannel objects set up for
   * this channel. Messages can be structured objects, e.g. nested objects
   * and arrays.
   */
  postMessage(message: any): void
  addEventListener<K extends keyof BroadcastChannelEventMap>(
    type: K,
    listener: (this: BroadcastChannel, ev: BroadcastChannelEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void
  removeEventListener<K extends keyof BroadcastChannelEventMap>(
    type: K,
    listener: (this: BroadcastChannel, ev: BroadcastChannelEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void
}

/**
 * @category Messaging
 * @experimental
 */
declare var BroadcastChannel: {
  readonly prototype: BroadcastChannel
  new (name: string): BroadcastChannel
}

// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="esnext.disposable" />

declare namespace Deno {
  /** @category Network */
  export interface NetAddr {
    transport: 'tcp' | 'udp'
    hostname: string
    port: number
  }

  /** @category Network */
  export interface UnixAddr {
    transport: 'unix' | 'unixpacket'
    path: string
  }

  /** @category Network */
  export type Addr = NetAddr | UnixAddr

  /** A generic network listener for stream-oriented protocols.
   *
   * @category Network
   */
  export interface Listener<T extends Conn = Conn, A extends Addr = Addr>
    extends AsyncIterable<T>,
      Disposable {
    /** Waits for and resolves to the next connection to the `Listener`. */
    accept(): Promise<T>
    /** Close closes the listener. Any pending accept promises will be rejected
     * with errors. */
    close(): void
    /** Return the address of the `Listener`. */
    readonly addr: A

    /**
     * Return the rid of the `Listener`.
     *
     * @deprecated This will be removed in Deno 2.0. See the
     * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
     * for migration instructions.
     */
    readonly rid: number

    [Symbol.asyncIterator](): AsyncIterableIterator<T>

    /**
     * Make the listener block the event loop from finishing.
     *
     * Note: the listener blocks the event loop from finishing by default.
     * This method is only meaningful after `.unref()` is called.
     */
    ref(): void

    /** Make the listener not block the event loop from finishing. */
    unref(): void
  }

  /** Specialized listener that accepts TLS connections.
   *
   * @category Network
   */
  export type TlsListener = Listener<TlsConn, NetAddr>

  /** Specialized listener that accepts TCP connections.
   *
   * @category Network
   */
  export type TcpListener = Listener<TcpConn, NetAddr>

  /** Specialized listener that accepts Unix connections.
   *
   * @category Network
   */
  export type UnixListener = Listener<UnixConn, UnixAddr>

  /** @category Network */
  export interface Conn<A extends Addr = Addr> extends Reader, Writer, Closer, Disposable {
    /** The local address of the connection. */
    readonly localAddr: A
    /** The remote address of the connection. */
    readonly remoteAddr: A
    /**
     * The resource ID of the connection.
     *
     * @deprecated This will be removed in Deno 2.0. See the
     * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
     * for migration instructions.
     */
    readonly rid: number
    /** Shuts down (`shutdown(2)`) the write side of the connection. Most
     * callers should just use `close()`. */
    closeWrite(): Promise<void>

    /** Make the connection block the event loop from finishing.
     *
     * Note: the connection blocks the event loop from finishing by default.
     * This method is only meaningful after `.unref()` is called.
     */
    ref(): void
    /** Make the connection not block the event loop from finishing. */
    unref(): void

    readonly readable: ReadableStream<Uint8Array>
    readonly writable: WritableStream<Uint8Array>
  }

  /** @category Network */
  export interface TlsHandshakeInfo {
    /**
     * Contains the ALPN protocol selected during negotiation with the server.
     * If no ALPN protocol selected, returns `null`.
     */
    alpnProtocol: string | null
  }

  /** @category Network */
  export interface TlsConn extends Conn<NetAddr> {
    /** Runs the client or server handshake protocol to completion if that has
     * not happened yet. Calling this method is optional; the TLS handshake
     * will be completed automatically as soon as data is sent or received. */
    handshake(): Promise<TlsHandshakeInfo>
    /**
     * The resource ID of the connection.
     *
     * @deprecated This will be removed in Deno 2.0. See the
     * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
     * for migration instructions.
     */
    readonly rid: number
  }

  /** @category Network */
  export interface ListenOptions {
    /** The port to listen on.
     *
     * Set to `0` to listen on any available port.
     */
    port: number
    /** A literal IP address or host name that can be resolved to an IP address.
     *
     * __Note about `0.0.0.0`__ While listening `0.0.0.0` works on all platforms,
     * the browsers on Windows don't work with the address `0.0.0.0`.
     * You should show the message like `server running on localhost:8080` instead of
     * `server running on 0.0.0.0:8080` if your program supports Windows.
     *
     * @default {"0.0.0.0"} */
    hostname?: string
  }

  /** @category Network */
  export interface TcpListenOptions extends ListenOptions {}

  /** Listen announces on the local transport address.
   *
   * ```ts
   * const listener1 = Deno.listen({ port: 80 })
   * const listener2 = Deno.listen({ hostname: "192.0.2.1", port: 80 })
   * const listener3 = Deno.listen({ hostname: "[2001:db8::1]", port: 80 });
   * const listener4 = Deno.listen({ hostname: "golang.org", port: 80, transport: "tcp" });
   * ```
   *
   * Requires `allow-net` permission.
   *
   * @tags allow-net
   * @category Network
   */
  export function listen(options: TcpListenOptions & { transport?: 'tcp' }): TcpListener

  /** Options which can be set when opening a Unix listener via
   * {@linkcode Deno.listen} or {@linkcode Deno.listenDatagram}.
   *
   * @category Network
   */
  export interface UnixListenOptions {
    /** A path to the Unix Socket. */
    path: string
  }

  /** Listen announces on the local transport address.
   *
   * ```ts
   * const listener = Deno.listen({ path: "/foo/bar.sock", transport: "unix" })
   * ```
   *
   * Requires `allow-read` and `allow-write` permission.
   *
   * @tags allow-read, allow-write
   * @category Network
   */
  // deno-lint-ignore adjacent-overload-signatures
  export function listen(options: UnixListenOptions & { transport: 'unix' }): UnixListener

  /** Provides TLS certified keys, ie: a key that has been certified by a trusted certificate authority.
   * A certified key generally consists of a private key and certificate part.
   *
   * @category Network
   */
  export type TlsCertifiedKeyOptions =
    | TlsCertifiedKeyPem
    | TlsCertifiedKeyFromFile
    | TlsCertifiedKeyConnectTls

  /**
   * Provides certified key material from strings. The key material is provided in
   * `PEM`-format (Privacy Enhanced Mail, https://www.rfc-editor.org/rfc/rfc1422) which can be identified by having
   * `-----BEGIN-----` and `-----END-----` markers at the beginning and end of the strings. This type of key is not compatible
   * with `DER`-format keys which are binary.
   *
   * Deno supports RSA, EC, and PKCS8-format keys.
   *
   * ```ts
   * const key = {
   *  key: "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
   *  cert: "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----\n" }
   * };
   * ```
   *
   * @category Network
   */
  export interface TlsCertifiedKeyPem {
    /** The format of this key material, which must be PEM. */
    keyFormat?: 'pem'
    /** Private key in `PEM` format. RSA, EC, and PKCS8-format keys are supported. */
    key: string
    /** Certificate chain in `PEM` format. */
    cert: string
  }

  /**
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   *
   * @category Network
   */
  export interface TlsCertifiedKeyFromFile {
    /** Path to a file containing a PEM formatted CA certificate. Requires
     * `--allow-read`.
     *
     * @tags allow-read
     * @deprecated This will be removed in Deno 2.0. See the
     * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
     * for migration instructions.
     */
    certFile: string
    /** Path to a file containing a private key file. Requires `--allow-read`.
     *
     * @tags allow-read
     * @deprecated This will be removed in Deno 2.0. See the
     * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
     * for migration instructions.
     */
    keyFile: string
  }

  /**
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   *
   * @category Network
   */
  export interface TlsCertifiedKeyConnectTls {
    /**
     * Certificate chain in `PEM` format.
     *
     * @deprecated This will be removed in Deno 2.0. See the
     * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
     * for migration instructions.
     */
    certChain: string
    /**
     * Private key in `PEM` format. RSA, EC, and PKCS8-format keys are supported.
     *
     * @deprecated This will be removed in Deno 2.0. See the
     * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
     * for migration instructions.
     */
    privateKey: string
  }

  /** @category Network */
  export interface ListenTlsOptions extends TcpListenOptions {
    transport?: 'tcp'

    /** Application-Layer Protocol Negotiation (ALPN) protocols to announce to
     * the client. If not specified, no ALPN extension will be included in the
     * TLS handshake.
     */
    alpnProtocols?: string[]
  }

  /** Listen announces on the local transport address over TLS (transport layer
   * security).
   *
   * ```ts
   * using listener = Deno.listenTls({
   *   port: 443,
   *   cert: Deno.readTextFileSync("./server.crt"),
   *   key: Deno.readTextFileSync("./server.key"),
   * });
   * ```
   *
   * Requires `allow-net` permission.
   *
   * @tags allow-net
   * @category Network
   */
  export function listenTls(options: ListenTlsOptions & TlsCertifiedKeyOptions): TlsListener

  /** @category Network */
  export interface ConnectOptions {
    /** The port to connect to. */
    port: number
    /** A literal IP address or host name that can be resolved to an IP address.
     * If not specified,
     *
     * @default {"127.0.0.1"} */
    hostname?: string
    transport?: 'tcp'
  }

  /**
   * Connects to the hostname (default is "127.0.0.1") and port on the named
   * transport (default is "tcp"), and resolves to the connection (`Conn`).
   *
   * ```ts
   * const conn1 = await Deno.connect({ port: 80 });
   * const conn2 = await Deno.connect({ hostname: "192.0.2.1", port: 80 });
   * const conn3 = await Deno.connect({ hostname: "[2001:db8::1]", port: 80 });
   * const conn4 = await Deno.connect({ hostname: "golang.org", port: 80, transport: "tcp" });
   * ```
   *
   * Requires `allow-net` permission for "tcp".
   *
   * @tags allow-net
   * @category Network
   */
  export function connect(options: ConnectOptions): Promise<TcpConn>

  /** @category Network */
  export interface TcpConn extends Conn<NetAddr> {
    /**
     * Enable/disable the use of Nagle's algorithm.
     *
     * @param [noDelay=true]
     */
    setNoDelay(noDelay?: boolean): void
    /** Enable/disable keep-alive functionality. */
    setKeepAlive(keepAlive?: boolean): void
    /**
     * The resource ID of the connection.
     *
     * @deprecated This will be removed in Deno 2.0. See the
     * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
     * for migration instructions.
     */
    readonly rid: number
  }

  /** @category Network */
  export interface UnixConnectOptions {
    transport: 'unix'
    path: string
  }

  /** @category Network */
  export interface UnixConn extends Conn<UnixAddr> {
    /**
     * The resource ID of the connection.
     *
     * @deprecated This will be removed in Deno 2.0. See the
     * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
     * for migration instructions.
     */
    readonly rid: number
  }

  /** Connects to the hostname (default is "127.0.0.1") and port on the named
   * transport (default is "tcp"), and resolves to the connection (`Conn`).
   *
   * ```ts
   * const conn1 = await Deno.connect({ port: 80 });
   * const conn2 = await Deno.connect({ hostname: "192.0.2.1", port: 80 });
   * const conn3 = await Deno.connect({ hostname: "[2001:db8::1]", port: 80 });
   * const conn4 = await Deno.connect({ hostname: "golang.org", port: 80, transport: "tcp" });
   * const conn5 = await Deno.connect({ path: "/foo/bar.sock", transport: "unix" });
   * ```
   *
   * Requires `allow-net` permission for "tcp" and `allow-read` for "unix".
   *
   * @tags allow-net, allow-read
   * @category Network
   */
  // deno-lint-ignore adjacent-overload-signatures
  export function connect(options: UnixConnectOptions): Promise<UnixConn>

  /** @category Network */
  export interface ConnectTlsOptions {
    /** The port to connect to. */
    port: number
    /** A literal IP address or host name that can be resolved to an IP address.
     *
     * @default {"127.0.0.1"} */
    hostname?: string
    /** Path to a file containing a PEM formatted list of root certificates that will
     * be used in addition to the default root certificates to verify the peer's certificate. Requires
     * `--allow-read`.
     *
     * @tags allow-read
     * @deprecated This will be removed in Deno 2.0. See the
     * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
     * for migration instructions.
     */
    certFile?: string
    /** A list of root certificates that will be used in addition to the
     * default root certificates to verify the peer's certificate.
     *
     * Must be in PEM format. */
    caCerts?: string[]
    /** Application-Layer Protocol Negotiation (ALPN) protocols supported by
     * the client. If not specified, no ALPN extension will be included in the
     * TLS handshake.
     */
    alpnProtocols?: string[]
  }

  /** Establishes a secure connection over TLS (transport layer security) using
   * an optional cert file, hostname (default is "127.0.0.1") and port.  The
   * cert file is optional and if not included Mozilla's root certificates will
   * be used (see also https://github.com/ctz/webpki-roots for specifics)
   *
   * ```ts
   * const caCert = await Deno.readTextFile("./certs/my_custom_root_CA.pem");
   * const conn1 = await Deno.connectTls({ port: 80 });
   * const conn2 = await Deno.connectTls({ caCerts: [caCert], hostname: "192.0.2.1", port: 80 });
   * const conn3 = await Deno.connectTls({ hostname: "[2001:db8::1]", port: 80 });
   * const conn4 = await Deno.connectTls({ caCerts: [caCert], hostname: "golang.org", port: 80});
   * ```
   *
   * Requires `allow-net` permission.
   *
   * @tags allow-net
   * @category Network
   */
  export function connectTls(options: ConnectTlsOptions): Promise<TlsConn>

  /** Establishes a secure connection over TLS (transport layer security) using
   * an optional cert file, client certificate, hostname (default is "127.0.0.1") and
   * port.  The cert file is optional and if not included Mozilla's root certificates will
   * be used (see also https://github.com/ctz/webpki-roots for specifics)
   *
   * ```ts
   * const caCert = await Deno.readTextFile("./certs/my_custom_root_CA.pem");
   * const key = "----BEGIN PRIVATE KEY----...";
   * const cert = "----BEGIN CERTIFICATE----...";
   * const conn1 = await Deno.connectTls({ port: 80, key, cert });
   * const conn2 = await Deno.connectTls({ caCerts: [caCert], hostname: "192.0.2.1", port: 80, key, cert });
   * const conn3 = await Deno.connectTls({ hostname: "[2001:db8::1]", port: 80, key, cert });
   * const conn4 = await Deno.connectTls({ caCerts: [caCert], hostname: "golang.org", port: 80, key, cert });
   * ```
   *
   * Requires `allow-net` permission.
   *
   * @tags allow-net
   * @category Network
   */
  export function connectTls(options: ConnectTlsOptions & TlsCertifiedKeyOptions): Promise<TlsConn>

  /** @category Network */
  export interface StartTlsOptions {
    /** A literal IP address or host name that can be resolved to an IP address.
     *
     * @default {"127.0.0.1"} */
    hostname?: string
    /** A list of root certificates that will be used in addition to the
     * default root certificates to verify the peer's certificate.
     *
     * Must be in PEM format. */
    caCerts?: string[]
    /** Application-Layer Protocol Negotiation (ALPN) protocols to announce to
     * the client. If not specified, no ALPN extension will be included in the
     * TLS handshake.
     */
    alpnProtocols?: string[]
  }

  /** Start TLS handshake from an existing connection using an optional list of
   * CA certificates, and hostname (default is "127.0.0.1"). Specifying CA certs
   * is optional. By default the configured root certificates are used. Using
   * this function requires that the other end of the connection is prepared for
   * a TLS handshake.
   *
   * Note that this function *consumes* the TCP connection passed to it, thus the
   * original TCP connection will be unusable after calling this. Additionally,
   * you need to ensure that the TCP connection is not being used elsewhere when
   * calling this function in order for the TCP connection to be consumed properly.
   * For instance, if there is a `Promise` that is waiting for read operation on
   * the TCP connection to complete, it is considered that the TCP connection is
   * being used elsewhere. In such a case, this function will fail.
   *
   * ```ts
   * const conn = await Deno.connect({ port: 80, hostname: "127.0.0.1" });
   * const caCert = await Deno.readTextFile("./certs/my_custom_root_CA.pem");
   * // `conn` becomes unusable after calling `Deno.startTls`
   * const tlsConn = await Deno.startTls(conn, { caCerts: [caCert], hostname: "localhost" });
   * ```
   *
   * Requires `allow-net` permission.
   *
   * @tags allow-net
   * @category Network
   */
  export function startTls(conn: TcpConn, options?: StartTlsOptions): Promise<TlsConn>

  /** Shutdown socket send operations.
   *
   * Matches behavior of POSIX shutdown(3).
   *
   * ```ts
   * const listener = Deno.listen({ port: 80 });
   * const conn = await listener.accept();
   * Deno.shutdown(conn.rid);
   * ```
   *
   * @deprecated This will be removed in Deno 2.0. See the
   * {@link https://docs.deno.com/runtime/manual/advanced/migrate_deprecations | Deno 1.x to 2.x Migration Guide}
   * for migration instructions.
   *
   * @category Network
   */
  export function shutdown(rid: number): Promise<void>
}

// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// Documentation partially adapted from [MDN](https://developer.mozilla.org/),
// by Mozilla Contributors, which is licensed under CC-BY-SA 2.5.

/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="deno.console" />
/// <reference lib="deno.url" />
/// <reference lib="deno.web" />
/// <reference lib="deno.webgpu" />
/// <reference lib="deno.canvas" />
/// <reference lib="deno.fetch" />
/// <reference lib="deno.websocket" />
/// <reference lib="deno.crypto" />

/** @category WASM */
declare namespace WebAssembly {
  /**
   * The `WebAssembly.CompileError` object indicates an error during WebAssembly decoding or validation.
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/CompileError)
   *
   * @category WASM
   */
  export class CompileError extends Error {
    /** Creates a new `WebAssembly.CompileError` object. */
    constructor(message?: string, options?: ErrorOptions)
  }

  /**
   * A `WebAssembly.Global` object represents a global variable instance, accessible from
   * both JavaScript and importable/exportable across one or more `WebAssembly.Module`
   * instances. This allows dynamic linking of multiple modules.
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Global)
   *
   * @category WASM
   */
  export class Global {
    /** Creates a new `Global` object. */
    constructor(descriptor: GlobalDescriptor, v?: any)

    /**
     * The value contained inside the global variable — this can be used to directly set
     * and get the global's value.
     */
    value: any

    /** Old-style method that returns the value contained inside the global variable. */
    valueOf(): any
  }

  /**
   * A `WebAssembly.Instance` object is a stateful, executable instance of a `WebAssembly.Module`.
   * Instance objects contain all the Exported WebAssembly functions that allow calling into
   * WebAssembly code from JavaScript.
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Instance)
   *
   * @category WASM
   */
  export class Instance {
    /** Creates a new Instance object. */
    constructor(module: Module, importObject?: Imports)

    /**
     * Returns an object containing as its members all the functions exported from the
     * WebAssembly module instance, to allow them to be accessed and used by JavaScript.
     * Read-only.
     */
    readonly exports: Exports
  }

  /**
   * The `WebAssembly.LinkError` object indicates an error during module instantiation
   * (besides traps from the start function).
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/LinkError)
   *
   * @category WASM
   */
  export class LinkError extends Error {
    /** Creates a new WebAssembly.LinkError object. */
    constructor(message?: string, options?: ErrorOptions)
  }

  /**
   * The `WebAssembly.Memory` object is a resizable `ArrayBuffer` or `SharedArrayBuffer` that
   * holds the raw bytes of memory accessed by a WebAssembly Instance.
   *
   * A memory created by JavaScript or in WebAssembly code will be accessible and mutable
   * from both JavaScript and WebAssembly.
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Memory)
   *
   * @category WASM
   */
  export class Memory {
    /** Creates a new `Memory` object. */
    constructor(descriptor: MemoryDescriptor)

    /** An accessor property that returns the buffer contained in the memory. */
    readonly buffer: ArrayBuffer | SharedArrayBuffer

    /**
     * Increases the size of the memory instance by a specified number of WebAssembly
     * pages (each one is 64KB in size).
     */
    grow(delta: number): number
  }

  /**
   * A `WebAssembly.Module` object contains stateless WebAssembly code that has already been compiled
   * by the browser — this can be efficiently shared with Workers, and instantiated multiple times.
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Module)
   *
   * @category WASM
   */
  export class Module {
    /** Creates a new `Module` object. */
    constructor(bytes: BufferSource)

    /**
     * Given a `Module` and string, returns a copy of the contents of all custom sections in the
     * module with the given string name.
     */
    static customSections(moduleObject: Module, sectionName: string): ArrayBuffer[]

    /** Given a `Module`, returns an array containing descriptions of all the declared exports. */
    static exports(moduleObject: Module): ModuleExportDescriptor[]

    /** Given a `Module`, returns an array containing descriptions of all the declared imports. */
    static imports(moduleObject: Module): ModuleImportDescriptor[]
  }

  /**
   * The `WebAssembly.RuntimeError` object is the error type that is thrown whenever WebAssembly
   * specifies a trap.
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/RuntimeError)
   *
   * @category WASM
   */
  export class RuntimeError extends Error {
    /** Creates a new `WebAssembly.RuntimeError` object. */
    constructor(message?: string, options?: ErrorOptions)
  }

  /**
   * The `WebAssembly.Table()` object is a JavaScript wrapper object — an array-like structure
   * representing a WebAssembly Table, which stores function references. A table created by
   * JavaScript or in WebAssembly code will be accessible and mutable from both JavaScript
   * and WebAssembly.
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Table)
   *
   * @category WASM
   */
  export class Table {
    /** Creates a new `Table` object. */
    constructor(descriptor: TableDescriptor)

    /** Returns the length of the table, i.e. the number of elements. */
    readonly length: number

    /** Accessor function — gets the element stored at a given index. */
    get(index: number): Function | null

    /** Increases the size of the `Table` instance by a specified number of elements. */
    grow(delta: number): number

    /** Sets an element stored at a given index to a given value. */
    set(index: number, value: Function | null): void
  }

  /** The `GlobalDescriptor` describes the options you can pass to
   * `new WebAssembly.Global()`.
   *
   * @category WASM
   */
  export interface GlobalDescriptor {
    mutable?: boolean
    value: ValueType
  }

  /** The `MemoryDescriptor` describes the options you can pass to
   * `new WebAssembly.Memory()`.
   *
   * @category WASM
   */
  export interface MemoryDescriptor {
    initial: number
    maximum?: number
    shared?: boolean
  }

  /** A `ModuleExportDescriptor` is the description of a declared export in a
   * `WebAssembly.Module`.
   *
   * @category WASM
   */
  export interface ModuleExportDescriptor {
    kind: ImportExportKind
    name: string
  }

  /** A `ModuleImportDescriptor` is the description of a declared import in a
   * `WebAssembly.Module`.
   *
   * @category WASM
   */
  export interface ModuleImportDescriptor {
    kind: ImportExportKind
    module: string
    name: string
  }

  /** The `TableDescriptor` describes the options you can pass to
   * `new WebAssembly.Table()`.
   *
   * @category WASM
   */
  export interface TableDescriptor {
    element: TableKind
    initial: number
    maximum?: number
  }

  /** The value returned from `WebAssembly.instantiate`.
   *
   * @category WASM
   */
  export interface WebAssemblyInstantiatedSource {
    /* A `WebAssembly.Instance` object that contains all the exported WebAssembly functions. */
    instance: Instance

    /**
     * A `WebAssembly.Module` object representing the compiled WebAssembly module.
     * This `Module` can be instantiated again, or shared via postMessage().
     */
    module: Module
  }

  /** @category WASM */
  export type ImportExportKind = 'function' | 'global' | 'memory' | 'table'
  /** @category WASM */
  export type TableKind = 'anyfunc'
  /** @category WASM */
  export type ValueType = 'f32' | 'f64' | 'i32' | 'i64'
  /** @category WASM */
  export type ExportValue = Function | Global | Memory | Table
  /** @category WASM */
  export type Exports = Record<string, ExportValue>
  /** @category WASM */
  export type ImportValue = ExportValue | number
  /** @category WASM */
  export type ModuleImports = Record<string, ImportValue>
  /** @category WASM */
  export type Imports = Record<string, ModuleImports>

  /**
   * The `WebAssembly.compile()` function compiles WebAssembly binary code into a
   * `WebAssembly.Module` object. This function is useful if it is necessary to compile
   * a module before it can be instantiated (otherwise, the `WebAssembly.instantiate()`
   * function should be used).
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/compile)
   *
   * @category WASM
   */
  export function compile(bytes: BufferSource): Promise<Module>

  /**
   * The `WebAssembly.compileStreaming()` function compiles a `WebAssembly.Module`
   * directly from a streamed underlying source. This function is useful if it is
   * necessary to a compile a module before it can be instantiated (otherwise, the
   * `WebAssembly.instantiateStreaming()` function should be used).
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/compileStreaming)
   *
   * @category WASM
   */
  export function compileStreaming(source: Response | Promise<Response>): Promise<Module>

  /**
   * The WebAssembly.instantiate() function allows you to compile and instantiate
   * WebAssembly code.
   *
   * This overload takes the WebAssembly binary code, in the form of a typed
   * array or ArrayBuffer, and performs both compilation and instantiation in one step.
   * The returned Promise resolves to both a compiled WebAssembly.Module and its first
   * WebAssembly.Instance.
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/instantiate)
   *
   * @category WASM
   */
  export function instantiate(
    bytes: BufferSource,
    importObject?: Imports
  ): Promise<WebAssemblyInstantiatedSource>

  /**
   * The WebAssembly.instantiate() function allows you to compile and instantiate
   * WebAssembly code.
   *
   * This overload takes an already-compiled WebAssembly.Module and returns
   * a Promise that resolves to an Instance of that Module. This overload is useful
   * if the Module has already been compiled.
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/instantiate)
   *
   * @category WASM
   */
  export function instantiate(moduleObject: Module, importObject?: Imports): Promise<Instance>

  /**
   * The `WebAssembly.instantiateStreaming()` function compiles and instantiates a
   * WebAssembly module directly from a streamed underlying source. This is the most
   * efficient, optimized way to load wasm code.
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/instantiateStreaming)
   *
   * @category WASM
   */
  export function instantiateStreaming(
    response: Response | PromiseLike<Response>,
    importObject?: Imports
  ): Promise<WebAssemblyInstantiatedSource>

  /**
   * The `WebAssembly.validate()` function validates a given typed array of
   * WebAssembly binary code, returning whether the bytes form a valid wasm
   * module (`true`) or not (`false`).
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/validate)
   *
   * @category WASM
   */
  export function validate(bytes: BufferSource): boolean
}

/** Sets a timer which executes a function once after the delay (in milliseconds) elapses. Returns
 * an id which may be used to cancel the timeout.
 *
 * ```ts
 * setTimeout(() => { console.log('hello'); }, 500);
 * ```
 *
 * @category Platform
 */
declare function setTimeout(
  /** callback function to execute when timer expires */
  cb: (...args: any[]) => void,
  /** delay in ms */
  delay?: number,
  /** arguments passed to callback function */
  ...args: any[]
): number

/** Repeatedly calls a function , with a fixed time delay between each call.
 *
 * ```ts
 * // Outputs 'hello' to the console every 500ms
 * setInterval(() => { console.log('hello'); }, 500);
 * ```
 *
 * @category Platform
 */
declare function setInterval(
  /** callback function to execute when timer expires */
  cb: (...args: any[]) => void,
  /** delay in ms */
  delay?: number,
  /** arguments passed to callback function */
  ...args: any[]
): number

/** Cancels a timed, repeating action which was previously started by a call
 * to `setInterval()`
 *
 * ```ts
 * const id = setInterval(() => {console.log('hello');}, 500);
 * // ...
 * clearInterval(id);
 * ```
 *
 * @category Platform
 */
declare function clearInterval(id?: number): void

/** Cancels a scheduled action initiated by `setTimeout()`
 *
 * ```ts
 * const id = setTimeout(() => {console.log('hello');}, 500);
 * // ...
 * clearTimeout(id);
 * ```
 *
 * @category Platform
 */
declare function clearTimeout(id?: number): void

/** @category Platform */
declare interface VoidFunction {
  (): void
}

/** A microtask is a short function which is executed after the function or
 * module which created it exits and only if the JavaScript execution stack is
 * empty, but before returning control to the event loop being used to drive the
 * script's execution environment. This event loop may be either the main event
 * loop or the event loop driving a web worker.
 *
 * ```ts
 * queueMicrotask(() => { console.log('This event loop stack is complete'); });
 * ```
 *
 * @category Platform
 */
declare function queueMicrotask(func: VoidFunction): void

/** Dispatches an event in the global scope, synchronously invoking any
 * registered event listeners for this event in the appropriate order. Returns
 * false if event is cancelable and at least one of the event handlers which
 * handled this event called Event.preventDefault(). Otherwise it returns true.
 *
 * ```ts
 * dispatchEvent(new Event('unload'));
 * ```
 *
 * @category Events
 */
declare function dispatchEvent(event: Event): boolean

/** @category Platform */
declare interface DOMStringList {
  /** Returns the number of strings in strings. */
  readonly length: number
  /** Returns true if strings contains string, and false otherwise. */
  contains(string: string): boolean
  /** Returns the string with index index from strings. */
  item(index: number): string | null
  [index: number]: string
}

/** @category Platform */
declare type BufferSource = ArrayBufferView | ArrayBuffer

/** @category I/O */
declare var console: Console

/** @category Events */
declare interface ErrorEventInit extends EventInit {
  message?: string
  filename?: string
  lineno?: number
  colno?: number
  error?: any
}

/** @category Events */
declare interface ErrorEvent extends Event {
  readonly message: string
  readonly filename: string
  readonly lineno: number
  readonly colno: number
  readonly error: any
}

/** @category Events */
declare var ErrorEvent: {
  readonly prototype: ErrorEvent
  new (type: string, eventInitDict?: ErrorEventInit): ErrorEvent
}

/** @category Events */
declare interface PromiseRejectionEventInit extends EventInit {
  promise: Promise<any>
  reason?: any
}

/** @category Events */
declare interface PromiseRejectionEvent extends Event {
  readonly promise: Promise<any>
  readonly reason: any
}

/** @category Events */
declare var PromiseRejectionEvent: {
  readonly prototype: PromiseRejectionEvent
  new (type: string, eventInitDict?: PromiseRejectionEventInit): PromiseRejectionEvent
}

/** @category Workers */
declare interface AbstractWorkerEventMap {
  error: ErrorEvent
}

/** @category Workers */
declare interface WorkerEventMap extends AbstractWorkerEventMap {
  message: MessageEvent
  messageerror: MessageEvent
}

/** @category Workers */
declare interface WorkerOptions {
  type?: 'classic' | 'module'
  name?: string
}

/** @category Workers */
declare interface Worker extends EventTarget {
  onerror: (this: Worker, e: ErrorEvent) => any | null
  onmessage: (this: Worker, e: MessageEvent) => any | null
  onmessageerror: (this: Worker, e: MessageEvent) => any | null
  postMessage(message: any, transfer: Transferable[]): void
  postMessage(message: any, options?: StructuredSerializeOptions): void
  addEventListener<K extends keyof WorkerEventMap>(
    type: K,
    listener: (this: Worker, ev: WorkerEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void
  removeEventListener<K extends keyof WorkerEventMap>(
    type: K,
    listener: (this: Worker, ev: WorkerEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void
  terminate(): void
}

/** @category Workers */
declare var Worker: {
  readonly prototype: Worker
  new (specifier: string | URL, options?: WorkerOptions): Worker
}

/** @category Performance */
declare type PerformanceEntryList = PerformanceEntry[]

/** @category Performance */
declare interface Performance extends EventTarget {
  /** Returns a timestamp representing the start of the performance measurement. */
  readonly timeOrigin: number

  /** Removes the stored timestamp with the associated name. */
  clearMarks(markName?: string): void

  /** Removes stored timestamp with the associated name. */
  clearMeasures(measureName?: string): void

  getEntries(): PerformanceEntryList
  getEntriesByName(name: string, type?: string): PerformanceEntryList
  getEntriesByType(type: string): PerformanceEntryList

  /** Stores a timestamp with the associated name (a "mark"). */
  mark(markName: string, options?: PerformanceMarkOptions): PerformanceMark

  /** Stores the `DOMHighResTimeStamp` duration between two marks along with the
   * associated name (a "measure"). */
  measure(measureName: string, options?: PerformanceMeasureOptions): PerformanceMeasure
  /** Stores the `DOMHighResTimeStamp` duration between two marks along with the
   * associated name (a "measure"). */
  measure(measureName: string, startMark?: string, endMark?: string): PerformanceMeasure

  /** Returns a current time from Deno's start in milliseconds.
   *
   * Use the permission flag `--allow-hrtime` to return a precise value.
   *
   * ```ts
   * const t = performance.now();
   * console.log(`${t} ms since start!`);
   * ```
   *
   * @tags allow-hrtime
   */
  now(): number

  /** Returns a JSON representation of the performance object. */
  toJSON(): any
}

/** @category Performance */
declare var Performance: {
  readonly prototype: Performance
  new (): never
}

/** @category Performance */
declare var performance: Performance

/** @category Performance */
declare interface PerformanceMarkOptions {
  /** Metadata to be included in the mark. */
  detail?: any

  /** Timestamp to be used as the mark time. */
  startTime?: number
}

/** @category Performance */
declare interface PerformanceMeasureOptions {
  /** Metadata to be included in the measure. */
  detail?: any

  /** Timestamp to be used as the start time or string to be used as start
   * mark. */
  start?: string | number

  /** Duration between the start and end times. */
  duration?: number

  /** Timestamp to be used as the end time or string to be used as end mark. */
  end?: string | number
}

/** Encapsulates a single performance metric that is part of the performance
 * timeline. A performance entry can be directly created by making a performance
 * mark or measure (for example by calling the `.mark()` method) at an explicit
 * point in an application.
 *
 * @category Performance
 */
declare interface PerformanceEntry {
  readonly duration: number
  readonly entryType: string
  readonly name: string
  readonly startTime: number
  toJSON(): any
}

/** Encapsulates a single performance metric that is part of the performance
 * timeline. A performance entry can be directly created by making a performance
 * mark or measure (for example by calling the `.mark()` method) at an explicit
 * point in an application.
 *
 * @category Performance
 */
declare var PerformanceEntry: {
  readonly prototype: PerformanceEntry
  new (): never
}

/** `PerformanceMark` is an abstract interface for `PerformanceEntry` objects
 * with an entryType of `"mark"`. Entries of this type are created by calling
 * `performance.mark()` to add a named `DOMHighResTimeStamp` (the mark) to the
 * performance timeline.
 *
 * @category Performance
 */
declare interface PerformanceMark extends PerformanceEntry {
  readonly detail: any
  readonly entryType: 'mark'
}

/** `PerformanceMark` is an abstract interface for `PerformanceEntry` objects
 * with an entryType of `"mark"`. Entries of this type are created by calling
 * `performance.mark()` to add a named `DOMHighResTimeStamp` (the mark) to the
 * performance timeline.
 *
 * @category Performance
 */
declare var PerformanceMark: {
  readonly prototype: PerformanceMark
  new (name: string, options?: PerformanceMarkOptions): PerformanceMark
}

/** `PerformanceMeasure` is an abstract interface for `PerformanceEntry` objects
 * with an entryType of `"measure"`. Entries of this type are created by calling
 * `performance.measure()` to add a named `DOMHighResTimeStamp` (the measure)
 * between two marks to the performance timeline.
 *
 * @category Performance
 */
declare interface PerformanceMeasure extends PerformanceEntry {
  readonly detail: any
  readonly entryType: 'measure'
}

/** `PerformanceMeasure` is an abstract interface for `PerformanceEntry` objects
 * with an entryType of `"measure"`. Entries of this type are created by calling
 * `performance.measure()` to add a named `DOMHighResTimeStamp` (the measure)
 * between two marks to the performance timeline.
 *
 * @category Performance
 */
declare var PerformanceMeasure: {
  readonly prototype: PerformanceMeasure
  new (): never
}

/** @category Events */
declare interface CustomEventInit<T = any> extends EventInit {
  detail?: T
}

/** @category Events */
declare interface CustomEvent<T = any> extends Event {
  /** Returns any custom data event was created with. Typically used for
   * synthetic events. */
  readonly detail: T
}

/** @category Events */
declare var CustomEvent: {
  readonly prototype: CustomEvent
  new <T>(typeArg: string, eventInitDict?: CustomEventInit<T>): CustomEvent<T>
}

/** @category Platform */
declare interface ErrorConstructor {
  /** See https://v8.dev/docs/stack-trace-api#stack-trace-collection-for-custom-exceptions. */
  captureStackTrace(error: Object, constructor?: Function): void
  // TODO(nayeemrmn): Support `Error.prepareStackTrace()`. We currently use this
  // internally in a way that makes it unavailable for users.
}

// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// deno-lint-ignore-file no-var

/// <reference no-default-lib="true" />
/// <reference lib="esnext" />

/** @category Cache */
declare var caches: CacheStorage

/** @category Cache */
declare interface CacheStorage {
  /** Open a cache storage for the provided name. */
  open(cacheName: string): Promise<Cache>
  /** Check if cache already exists for the provided name. */
  has(cacheName: string): Promise<boolean>
  /** Delete cache storage for the provided name. */
  delete(cacheName: string): Promise<boolean>
}

/** @category Cache */
declare interface Cache {
  /**
   * Put the provided request/response into the cache.
   *
   * How is the API different from browsers?
   * 1. You cannot match cache objects using by relative paths.
   * 2. You cannot pass options like `ignoreVary`, `ignoreMethod`, `ignoreSearch`.
   */
  put(request: RequestInfo | URL, response: Response): Promise<void>
  /**
   * Return cache object matching the provided request.
   *
   * How is the API different from browsers?
   * 1. You cannot match cache objects using by relative paths.
   * 2. You cannot pass options like `ignoreVary`, `ignoreMethod`, `ignoreSearch`.
   */
  match(request: RequestInfo | URL, options?: CacheQueryOptions): Promise<Response | undefined>
  /**
   * Delete cache object matching the provided request.
   *
   * How is the API different from browsers?
   * 1. You cannot delete cache objects using by relative paths.
   * 2. You cannot pass options like `ignoreVary`, `ignoreMethod`, `ignoreSearch`.
   */
  delete(request: RequestInfo | URL, options?: CacheQueryOptions): Promise<boolean>
}

/** @category Cache */
declare var Cache: {
  readonly prototype: Cache
  new (): never
}

/** @category Cache */
declare var CacheStorage: {
  readonly prototype: CacheStorage
  new (): never
}

/** @category Cache */
declare interface CacheQueryOptions {
  ignoreMethod?: boolean
  ignoreSearch?: boolean
  ignoreVary?: boolean
}

// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/// <reference no-default-lib="true" />
/// <reference lib="deno.ns" />
/// <reference lib="deno.shared_globals" />
/// <reference lib="deno.webstorage" />
/// <reference lib="esnext" />
/// <reference lib="deno.cache" />

/** @category Platform */
declare interface WindowEventMap {
  error: ErrorEvent
  unhandledrejection: PromiseRejectionEvent
  rejectionhandled: PromiseRejectionEvent
}

/** @category Platform */
declare interface Window extends EventTarget {
  readonly window: Window & typeof globalThis
  readonly self: Window & typeof globalThis
  onerror: ((this: Window, ev: ErrorEvent) => any) | null
  onload: ((this: Window, ev: Event) => any) | null
  onbeforeunload: ((this: Window, ev: Event) => any) | null
  onunload: ((this: Window, ev: Event) => any) | null
  onunhandledrejection: ((this: Window, ev: PromiseRejectionEvent) => any) | null
  onrejectionhandled: ((this: Window, ev: PromiseRejectionEvent) => any) | null
  close: () => void
  readonly closed: boolean
  alert: (message?: string) => void
  confirm: (message?: string) => boolean
  prompt: (message?: string, defaultValue?: string) => string | null
  Deno: typeof Deno
  Navigator: typeof Navigator
  navigator: Navigator
  Location: typeof Location
  location: Location
  localStorage: Storage
  sessionStorage: Storage
  caches: CacheStorage
  name: string

  addEventListener<K extends keyof WindowEventMap>(
    type: K,
    listener: (this: Window, ev: WindowEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void
  removeEventListener<K extends keyof WindowEventMap>(
    type: K,
    listener: (this: Window, ev: WindowEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void
}

/** @category Platform */
declare var Window: {
  readonly prototype: Window
  new (): never
}

/** @category Platform */
declare var window: Window & typeof globalThis
/** @category Platform */
declare var self: Window & typeof globalThis
/** @category Platform */
declare var closed: boolean
/** @category Platform */
declare function close(): void
/** @category Events */
declare var onerror: ((this: Window, ev: ErrorEvent) => any) | null
/** @category Events */
declare var onload: ((this: Window, ev: Event) => any) | null
/** @category Events */
declare var onbeforeunload: ((this: Window, ev: Event) => any) | null
/** @category Events */
declare var onunload: ((this: Window, ev: Event) => any) | null
/** @category Events */
declare var onunhandledrejection: ((this: Window, ev: PromiseRejectionEvent) => any) | null
/** @category Storage */
declare var localStorage: Storage
/** @category Storage */
declare var sessionStorage: Storage
/** @category Cache */
declare var caches: CacheStorage

/** @category Platform */
declare interface Navigator {
  readonly gpu: GPU
  readonly hardwareConcurrency: number
  readonly userAgent: string
  readonly language: string
  readonly languages: string[]
}

/** @category Platform */
declare var Navigator: {
  readonly prototype: Navigator
  new (): never
}

/** @category Platform */
declare var navigator: Navigator

/**
 * Shows the given message and waits for the enter key pressed.
 *
 * If the stdin is not interactive, it does nothing.
 *
 * @category Platform
 *
 * @param message
 */
declare function alert(message?: string): void

/**
 * Shows the given message and waits for the answer. Returns the user's answer as boolean.
 *
 * Only `y` and `Y` are considered as true.
 *
 * If the stdin is not interactive, it returns false.
 *
 * @category Platform
 *
 * @param message
 */
declare function confirm(message?: string): boolean

/**
 * Shows the given message and waits for the user's input. Returns the user's input as string.
 *
 * If the default value is given and the user inputs the empty string, then it returns the given
 * default value.
 *
 * If the default value is not given and the user inputs the empty string, it returns the empty
 * string.
 *
 * If the stdin is not interactive, it returns null.
 *
 * @category Platform
 *
 * @param message
 * @param defaultValue
 */
declare function prompt(message?: string, defaultValue?: string): string | null

/** Registers an event listener in the global scope, which will be called
 * synchronously whenever the event `type` is dispatched.
 *
 * ```ts
 * addEventListener('unload', () => { console.log('All finished!'); });
 * ...
 * dispatchEvent(new Event('unload'));
 * ```
 *
 * @category Events
 */
declare function addEventListener<K extends keyof WindowEventMap>(
  type: K,
  listener: (this: Window, ev: WindowEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions
): void
/** @category Events */
declare function addEventListener(
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions
): void

/** Remove a previously registered event listener from the global scope
 *
 * ```ts
 * const listener = () => { console.log('hello'); };
 * addEventListener('load', listener);
 * removeEventListener('load', listener);
 * ```
 *
 * @category Events
 */
declare function removeEventListener<K extends keyof WindowEventMap>(
  type: K,
  listener: (this: Window, ev: WindowEventMap[K]) => any,
  options?: boolean | EventListenerOptions
): void
/** @category Events */
declare function removeEventListener(
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | EventListenerOptions
): void

// TODO(nayeemrmn): Move this to `extensions/web` where its implementation is.
// The types there must first be split into window, worker and global types.
/** The location (URL) of the object it is linked to. Changes done on it are
 * reflected on the object it relates to. Accessible via
 * `globalThis.location`.
 *
 * @category Platform
 */
declare interface Location {
  /** Returns a DOMStringList object listing the origins of the ancestor
   * browsing contexts, from the parent browsing context to the top-level
   * browsing context.
   *
   * Always empty in Deno. */
  readonly ancestorOrigins: DOMStringList
  /** Returns the Location object's URL's fragment (includes leading "#" if
   * non-empty).
   *
   * Cannot be set in Deno. */
  hash: string
  /** Returns the Location object's URL's host and port (if different from the
   * default port for the scheme).
   *
   * Cannot be set in Deno. */
  host: string
  /** Returns the Location object's URL's host.
   *
   * Cannot be set in Deno. */
  hostname: string
  /** Returns the Location object's URL.
   *
   * Cannot be set in Deno. */
  href: string
  toString(): string
  /** Returns the Location object's URL's origin. */
  readonly origin: string
  /** Returns the Location object's URL's path.
   *
   * Cannot be set in Deno. */
  pathname: string
  /** Returns the Location object's URL's port.
   *
   * Cannot be set in Deno. */
  port: string
  /** Returns the Location object's URL's scheme.
   *
   * Cannot be set in Deno. */
  protocol: string
  /** Returns the Location object's URL's query (includes leading "?" if
   * non-empty).
   *
   * Cannot be set in Deno. */
  search: string
  /** Navigates to the given URL.
   *
   * Cannot be set in Deno. */
  assign(url: string): void
  /** Reloads the current page.
   *
   * Disabled in Deno. */
  reload(): void
  /** @deprecated */
  reload(forcedReload: boolean): void
  /** Removes the current page from the session history and navigates to the
   * given URL.
   *
   * Disabled in Deno. */
  replace(url: string): void
}

// TODO(nayeemrmn): Move this to `extensions/web` where its implementation is.
// The types there must first be split into window, worker and global types.
/** The location (URL) of the object it is linked to. Changes done on it are
 * reflected on the object it relates to. Accessible via
 * `globalThis.location`.
 *
 * @category Platform
 */
declare var Location: {
  readonly prototype: Location
  new (): never
}

// TODO(nayeemrmn): Move this to `extensions/web` where its implementation is.
// The types there must first be split into window, worker and global types.
/** @category Platform */
declare var location: Location

/** @category Platform */
declare var name: string

// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/// <reference no-default-lib="true" />
/// <reference lib="deno.ns" />
/// <reference lib="deno.broadcast_channel" />
/// <reference lib="deno.webgpu" />
/// <reference lib="esnext" />
/// <reference lib="es2022.intl" />

declare namespace Deno {
  export {} // stop default export type behavior

  /** Information for a HTTP request.
   *
   * @category HTTP Server
   * @experimental
   */
  export interface ServeHandlerInfo {
    /** The remote address of the connection. */
    remoteAddr: Deno.NetAddr
    /** The completion promise */
    completed: Promise<void>
  }

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * Retrieve the process umask.  If `mask` is provided, sets the process umask.
   * This call always returns what the umask was before the call.
   *
   * ```ts
   * console.log(Deno.umask());  // e.g. 18 (0o022)
   * const prevUmaskValue = Deno.umask(0o077);  // e.g. 18 (0o022)
   * console.log(Deno.umask());  // e.g. 63 (0o077)
   * ```
   *
   * This API is under consideration to determine if permissions are required to
   * call it.
   *
   * *Note*: This API is not implemented on Windows
   *
   * @category File System
   * @experimental
   */
  export function umask(mask?: number): number

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * All plain number types for interfacing with foreign functions.
   *
   * @category FFI
   * @experimental
   */
  export type NativeNumberType = 'u8' | 'i8' | 'u16' | 'i16' | 'u32' | 'i32' | 'f32' | 'f64'

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * All BigInt number types for interfacing with foreign functions.
   *
   * @category FFI
   * @experimental
   */
  export type NativeBigIntType = 'u64' | 'i64' | 'usize' | 'isize'

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * The native boolean type for interfacing to foreign functions.
   *
   * @category FFI
   * @experimental
   */
  export type NativeBooleanType = 'bool'

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * The native pointer type for interfacing to foreign functions.
   *
   * @category FFI
   * @experimental
   */
  export type NativePointerType = 'pointer'

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * The native buffer type for interfacing to foreign functions.
   *
   * @category FFI
   * @experimental
   */
  export type NativeBufferType = 'buffer'

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * The native function type for interfacing with foreign functions.
   *
   * @category FFI
   * @experimental
   */
  export type NativeFunctionType = 'function'

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * The native void type for interfacing with foreign functions.
   *
   * @category FFI
   * @experimental
   */
  export type NativeVoidType = 'void'

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * The native struct type for interfacing with foreign functions.
   *
   * @category FFI
   * @experimental
   */
  export type NativeStructType = { readonly struct: readonly NativeType[] }

  /**
   * @category FFI
   * @experimental
   */
  export const brand: unique symbol

  /**
   * @category FFI
   * @experimental
   */
  export type NativeU8Enum<T extends number> = 'u8' & { [brand]: T }
  /**
   * @category FFI
   * @experimental
   */
  export type NativeI8Enum<T extends number> = 'i8' & { [brand]: T }
  /**
   * @category FFI
   * @experimental
   */
  export type NativeU16Enum<T extends number> = 'u16' & { [brand]: T }
  /**
   * @category FFI
   * @experimental
   */
  export type NativeI16Enum<T extends number> = 'i16' & { [brand]: T }
  /**
   * @category FFI
   * @experimental
   */
  export type NativeU32Enum<T extends number> = 'u32' & { [brand]: T }
  /**
   * @category FFI
   * @experimental
   */
  export type NativeI32Enum<T extends number> = 'i32' & { [brand]: T }
  /**
   * @category FFI
   * @experimental
   */
  export type NativeTypedPointer<T extends PointerObject> = 'pointer' & {
    [brand]: T
  }
  /**
   * @category FFI
   * @experimental
   */
  export type NativeTypedFunction<T extends UnsafeCallbackDefinition> = 'function' & {
    [brand]: T
  }

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * All supported types for interfacing with foreign functions.
   *
   * @category FFI
   * @experimental
   */
  export type NativeType =
    | NativeNumberType
    | NativeBigIntType
    | NativeBooleanType
    | NativePointerType
    | NativeBufferType
    | NativeFunctionType
    | NativeStructType

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * @category FFI
   * @experimental
   */
  export type NativeResultType = NativeType | NativeVoidType

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * Type conversion for foreign symbol parameters and unsafe callback return
   * types.
   *
   * @category FFI
   * @experimental
   */
  export type ToNativeType<T extends NativeType = NativeType> = T extends NativeStructType
    ? BufferSource
    : T extends NativeNumberType
      ? T extends NativeU8Enum<infer U>
        ? U
        : T extends NativeI8Enum<infer U>
          ? U
          : T extends NativeU16Enum<infer U>
            ? U
            : T extends NativeI16Enum<infer U>
              ? U
              : T extends NativeU32Enum<infer U>
                ? U
                : T extends NativeI32Enum<infer U>
                  ? U
                  : number
      : T extends NativeBigIntType
        ? bigint
        : T extends NativeBooleanType
          ? boolean
          : T extends NativePointerType
            ? T extends NativeTypedPointer<infer U>
              ? U | null
              : PointerValue
            : T extends NativeFunctionType
              ? T extends NativeTypedFunction<infer U>
                ? PointerValue<U> | null
                : PointerValue
              : T extends NativeBufferType
                ? BufferSource | null
                : never

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * Type conversion for unsafe callback return types.
   *
   * @category FFI
   * @experimental
   */
  export type ToNativeResultType<T extends NativeResultType = NativeResultType> =
    T extends NativeStructType
      ? BufferSource
      : T extends NativeNumberType
        ? T extends NativeU8Enum<infer U>
          ? U
          : T extends NativeI8Enum<infer U>
            ? U
            : T extends NativeU16Enum<infer U>
              ? U
              : T extends NativeI16Enum<infer U>
                ? U
                : T extends NativeU32Enum<infer U>
                  ? U
                  : T extends NativeI32Enum<infer U>
                    ? U
                    : number
        : T extends NativeBigIntType
          ? bigint
          : T extends NativeBooleanType
            ? boolean
            : T extends NativePointerType
              ? T extends NativeTypedPointer<infer U>
                ? U | null
                : PointerValue
              : T extends NativeFunctionType
                ? T extends NativeTypedFunction<infer U>
                  ? PointerObject<U> | null
                  : PointerValue
                : T extends NativeBufferType
                  ? BufferSource | null
                  : T extends NativeVoidType
                    ? void
                    : never

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * A utility type for conversion of parameter types of foreign functions.
   *
   * @category FFI
   * @experimental
   */
  export type ToNativeParameterTypes<T extends readonly NativeType[]> =
    //
    [T[number][]] extends [T]
      ? ToNativeType<T[number]>[]
      : [readonly T[number][]] extends [T]
        ? readonly ToNativeType<T[number]>[]
        : T extends readonly [...NativeType[]]
          ? {
              [K in keyof T]: ToNativeType<T[K]>
            }
          : never

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * Type conversion for foreign symbol return types and unsafe callback
   * parameters.
   *
   * @category FFI
   * @experimental
   */
  export type FromNativeType<T extends NativeType = NativeType> = T extends NativeStructType
    ? Uint8Array
    : T extends NativeNumberType
      ? T extends NativeU8Enum<infer U>
        ? U
        : T extends NativeI8Enum<infer U>
          ? U
          : T extends NativeU16Enum<infer U>
            ? U
            : T extends NativeI16Enum<infer U>
              ? U
              : T extends NativeU32Enum<infer U>
                ? U
                : T extends NativeI32Enum<infer U>
                  ? U
                  : number
      : T extends NativeBigIntType
        ? bigint
        : T extends NativeBooleanType
          ? boolean
          : T extends NativePointerType
            ? T extends NativeTypedPointer<infer U>
              ? U | null
              : PointerValue
            : T extends NativeBufferType
              ? PointerValue
              : T extends NativeFunctionType
                ? T extends NativeTypedFunction<infer U>
                  ? PointerObject<U> | null
                  : PointerValue
                : never

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * Type conversion for foreign symbol return types.
   *
   * @category FFI
   * @experimental
   */
  export type FromNativeResultType<T extends NativeResultType = NativeResultType> =
    T extends NativeStructType
      ? Uint8Array
      : T extends NativeNumberType
        ? T extends NativeU8Enum<infer U>
          ? U
          : T extends NativeI8Enum<infer U>
            ? U
            : T extends NativeU16Enum<infer U>
              ? U
              : T extends NativeI16Enum<infer U>
                ? U
                : T extends NativeU32Enum<infer U>
                  ? U
                  : T extends NativeI32Enum<infer U>
                    ? U
                    : number
        : T extends NativeBigIntType
          ? bigint
          : T extends NativeBooleanType
            ? boolean
            : T extends NativePointerType
              ? T extends NativeTypedPointer<infer U>
                ? U | null
                : PointerValue
              : T extends NativeBufferType
                ? PointerValue
                : T extends NativeFunctionType
                  ? T extends NativeTypedFunction<infer U>
                    ? PointerObject<U> | null
                    : PointerValue
                  : T extends NativeVoidType
                    ? void
                    : never

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * @category FFI
   * @experimental
   */
  export type FromNativeParameterTypes<T extends readonly NativeType[]> =
    //
    [T[number][]] extends [T]
      ? FromNativeType<T[number]>[]
      : [readonly T[number][]] extends [T]
        ? readonly FromNativeType<T[number]>[]
        : T extends readonly [...NativeType[]]
          ? {
              [K in keyof T]: FromNativeType<T[K]>
            }
          : never

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * The interface for a foreign function as defined by its parameter and result
   * types.
   *
   * @category FFI
   * @experimental
   */
  export interface ForeignFunction<
    Parameters extends readonly NativeType[] = readonly NativeType[],
    Result extends NativeResultType = NativeResultType,
    NonBlocking extends boolean = boolean,
  > {
    /** Name of the symbol.
     *
     * Defaults to the key name in symbols object. */
    name?: string
    /** The parameters of the foreign function. */
    parameters: Parameters
    /** The result (return value) of the foreign function. */
    result: Result
    /** When `true`, function calls will run on a dedicated blocking thread and
     * will return a `Promise` resolving to the `result`. */
    nonblocking?: NonBlocking
    /** When `true`, dlopen will not fail if the symbol is not found.
     * Instead, the symbol will be set to `null`.
     *
     * @default {false} */
    optional?: boolean
  }

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * @category FFI
   * @experimental
   */
  export interface ForeignStatic<Type extends NativeType = NativeType> {
    /** Name of the symbol, defaults to the key name in symbols object. */
    name?: string
    /** The type of the foreign static value. */
    type: Type
    /** When `true`, dlopen will not fail if the symbol is not found.
     * Instead, the symbol will be set to `null`.
     *
     * @default {false} */
    optional?: boolean
  }

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * A foreign library interface descriptor.
   *
   * @category FFI
   * @experimental
   */
  export interface ForeignLibraryInterface {
    [name: string]: ForeignFunction | ForeignStatic
  }

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * A utility type that infers a foreign symbol.
   *
   * @category FFI
   * @experimental
   */
  export type StaticForeignSymbol<T extends ForeignFunction | ForeignStatic> =
    T extends ForeignFunction
      ? FromForeignFunction<T>
      : T extends ForeignStatic
        ? FromNativeType<T['type']>
        : never

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   *  @category FFI
   *  @experimental
   */
  export type FromForeignFunction<T extends ForeignFunction> = T['parameters'] extends readonly []
    ? () => StaticForeignSymbolReturnType<T>
    : (...args: ToNativeParameterTypes<T['parameters']>) => StaticForeignSymbolReturnType<T>

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * @category FFI
   * @experimental
   */
  export type StaticForeignSymbolReturnType<T extends ForeignFunction> = ConditionalAsync<
    T['nonblocking'],
    FromNativeResultType<T['result']>
  >

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * @category FFI
   * @experimental
   */
  export type ConditionalAsync<IsAsync extends boolean | undefined, T> = IsAsync extends true
    ? Promise<T>
    : T

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * A utility type that infers a foreign library interface.
   *
   * @category FFI
   * @experimental
   */
  export type StaticForeignLibraryInterface<T extends ForeignLibraryInterface> = {
    [K in keyof T]: T[K]['optional'] extends true
      ? StaticForeignSymbol<T[K]> | null
      : StaticForeignSymbol<T[K]>
  }

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * A non-null pointer, represented as an object
   * at runtime. The object's prototype is `null`
   * and cannot be changed. The object cannot be
   * assigned to either and is thus entirely read-only.
   *
   * To interact with memory through a pointer use the
   * {@linkcode UnsafePointerView} class. To create a
   * pointer from an address or the get the address of
   * a pointer use the static methods of the
   * {@linkcode UnsafePointer} class.
   *
   * @category FFI
   * @experimental
   */
  export type PointerObject<T = unknown> = { [brand]: T }

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * Pointers are represented either with a {@linkcode PointerObject}
   * object or a `null` if the pointer is null.
   *
   * @category FFI
   * @experimental
   */
  export type PointerValue<T = unknown> = null | PointerObject<T>

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * A collection of static functions for interacting with pointer objects.
   *
   * @category FFI
   * @experimental
   */
  export class UnsafePointer {
    /** Create a pointer from a numeric value. This one is <i>really</i> dangerous! */
    static create<T = unknown>(value: bigint): PointerValue<T>
    /** Returns `true` if the two pointers point to the same address. */
    static equals<T = unknown>(a: PointerValue<T>, b: PointerValue<T>): boolean
    /** Return the direct memory pointer to the typed array in memory. */
    static of<T = unknown>(value: Deno.UnsafeCallback | BufferSource): PointerValue<T>
    /** Return a new pointer offset from the original by `offset` bytes. */
    static offset<T = unknown>(value: PointerObject, offset: number): PointerValue<T>
    /** Get the numeric value of a pointer */
    static value(value: PointerValue): bigint
  }

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * An unsafe pointer view to a memory location as specified by the `pointer`
   * value. The `UnsafePointerView` API follows the standard built in interface
   * {@linkcode DataView} for accessing the underlying types at an memory
   * location (numbers, strings and raw bytes).
   *
   * @category FFI
   * @experimental
   */
  export class UnsafePointerView {
    constructor(pointer: PointerObject)

    pointer: PointerObject

    /** Gets a boolean at the specified byte offset from the pointer. */
    getBool(offset?: number): boolean
    /** Gets an unsigned 8-bit integer at the specified byte offset from the
     * pointer. */
    getUint8(offset?: number): number
    /** Gets a signed 8-bit integer at the specified byte offset from the
     * pointer. */
    getInt8(offset?: number): number
    /** Gets an unsigned 16-bit integer at the specified byte offset from the
     * pointer. */
    getUint16(offset?: number): number
    /** Gets a signed 16-bit integer at the specified byte offset from the
     * pointer. */
    getInt16(offset?: number): number
    /** Gets an unsigned 32-bit integer at the specified byte offset from the
     * pointer. */
    getUint32(offset?: number): number
    /** Gets a signed 32-bit integer at the specified byte offset from the
     * pointer. */
    getInt32(offset?: number): number
    /** Gets an unsigned 64-bit integer at the specified byte offset from the
     * pointer. */
    getBigUint64(offset?: number): bigint
    /** Gets a signed 64-bit integer at the specified byte offset from the
     * pointer. */
    getBigInt64(offset?: number): bigint
    /** Gets a signed 32-bit float at the specified byte offset from the
     * pointer. */
    getFloat32(offset?: number): number
    /** Gets a signed 64-bit float at the specified byte offset from the
     * pointer. */
    getFloat64(offset?: number): number
    /** Gets a pointer at the specified byte offset from the pointer */
    getPointer<T = unknown>(offset?: number): PointerValue<T>
    /** Gets a C string (`null` terminated string) at the specified byte offset
     * from the pointer. */
    getCString(offset?: number): string
    /** Gets a C string (`null` terminated string) at the specified byte offset
     * from the specified pointer. */
    static getCString(pointer: PointerObject, offset?: number): string
    /** Gets an `ArrayBuffer` of length `byteLength` at the specified byte
     * offset from the pointer. */
    getArrayBuffer(byteLength: number, offset?: number): ArrayBuffer
    /** Gets an `ArrayBuffer` of length `byteLength` at the specified byte
     * offset from the specified pointer. */
    static getArrayBuffer(pointer: PointerObject, byteLength: number, offset?: number): ArrayBuffer
    /** Copies the memory of the pointer into a typed array.
     *
     * Length is determined from the typed array's `byteLength`.
     *
     * Also takes optional byte offset from the pointer. */
    copyInto(destination: BufferSource, offset?: number): void
    /** Copies the memory of the specified pointer into a typed array.
     *
     * Length is determined from the typed array's `byteLength`.
     *
     * Also takes optional byte offset from the pointer. */
    static copyInto(pointer: PointerObject, destination: BufferSource, offset?: number): void
  }

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * An unsafe pointer to a function, for calling functions that are not present
   * as symbols.
   *
   * @category FFI
   * @experimental
   */
  export class UnsafeFnPointer<const Fn extends ForeignFunction> {
    /** The pointer to the function. */
    pointer: PointerObject<Fn>
    /** The definition of the function. */
    definition: Fn

    constructor(pointer: PointerObject<NoInfer<Fn>>, definition: Fn)
    /** @deprecated Properly type {@linkcode pointer} using {@linkcode NativeTypedFunction} or {@linkcode UnsafeCallbackDefinition} types. */
    constructor(pointer: PointerObject, definition: Fn)

    /** Call the foreign function. */
    call: FromForeignFunction<Fn>
  }

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * Definition of a unsafe callback function.
   *
   * @category FFI
   * @experimental
   */
  export interface UnsafeCallbackDefinition<
    Parameters extends readonly NativeType[] = readonly NativeType[],
    Result extends NativeResultType = NativeResultType,
  > {
    /** The parameters of the callbacks. */
    parameters: Parameters
    /** The current result of the callback. */
    result: Result
  }

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * An unsafe callback function.
   *
   * @category FFI
   * @experimental
   */
  export type UnsafeCallbackFunction<
    Parameters extends readonly NativeType[] = readonly NativeType[],
    Result extends NativeResultType = NativeResultType,
  > = Parameters extends readonly []
    ? () => ToNativeResultType<Result>
    : (...args: FromNativeParameterTypes<Parameters>) => ToNativeResultType<Result>

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * An unsafe function pointer for passing JavaScript functions as C function
   * pointers to foreign function calls.
   *
   * The function pointer remains valid until the `close()` method is called.
   *
   * All `UnsafeCallback` are always thread safe in that they can be called from
   * foreign threads without crashing. However, they do not wake up the Deno event
   * loop by default.
   *
   * If a callback is to be called from foreign threads, use the `threadSafe()`
   * static constructor or explicitly call `ref()` to have the callback wake up
   * the Deno event loop when called from foreign threads. This also stops
   * Deno's process from exiting while the callback still exists and is not
   * unref'ed.
   *
   * Use `deref()` to then allow Deno's process to exit. Calling `deref()` on
   * a ref'ed callback does not stop it from waking up the Deno event loop when
   * called from foreign threads.
   *
   * @category FFI
   * @experimental
   */
  export class UnsafeCallback<
    const Definition extends UnsafeCallbackDefinition = UnsafeCallbackDefinition,
  > {
    constructor(
      definition: Definition,
      callback: UnsafeCallbackFunction<Definition['parameters'], Definition['result']>
    )

    /** The pointer to the unsafe callback. */
    readonly pointer: PointerObject<Definition>
    /** The definition of the unsafe callback. */
    readonly definition: Definition
    /** The callback function. */
    readonly callback: UnsafeCallbackFunction<Definition['parameters'], Definition['result']>

    /**
     * Creates an {@linkcode UnsafeCallback} and calls `ref()` once to allow it to
     * wake up the Deno event loop when called from foreign threads.
     *
     * This also stops Deno's process from exiting while the callback still
     * exists and is not unref'ed.
     */
    static threadSafe<Definition extends UnsafeCallbackDefinition = UnsafeCallbackDefinition>(
      definition: Definition,
      callback: UnsafeCallbackFunction<Definition['parameters'], Definition['result']>
    ): UnsafeCallback<Definition>

    /**
     * Increments the callback's reference counting and returns the new
     * reference count.
     *
     * After `ref()` has been called, the callback always wakes up the
     * Deno event loop when called from foreign threads.
     *
     * If the callback's reference count is non-zero, it keeps Deno's
     * process from exiting.
     */
    ref(): number

    /**
     * Decrements the callback's reference counting and returns the new
     * reference count.
     *
     * Calling `unref()` does not stop a callback from waking up the Deno
     * event loop when called from foreign threads.
     *
     * If the callback's reference counter is zero, it no longer keeps
     * Deno's process from exiting.
     */
    unref(): number

    /**
     * Removes the C function pointer associated with this instance.
     *
     * Continuing to use the instance or the C function pointer after closing
     * the `UnsafeCallback` will lead to errors and crashes.
     *
     * Calling this method sets the callback's reference counting to zero,
     * stops the callback from waking up the Deno event loop when called from
     * foreign threads and no longer keeps Deno's process from exiting.
     */
    close(): void
  }

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * A dynamic library resource.  Use {@linkcode Deno.dlopen} to load a dynamic
   * library and return this interface.
   *
   * @category FFI
   * @experimental
   */
  export interface DynamicLibrary<S extends ForeignLibraryInterface> {
    /** All of the registered library along with functions for calling them. */
    symbols: StaticForeignLibraryInterface<S>
    /** Removes the pointers associated with the library symbols.
     *
     * Continuing to use symbols that are part of the library will lead to
     * errors and crashes.
     *
     * Calling this method will also immediately set any references to zero and
     * will no longer keep Deno's process from exiting.
     */
    close(): void
  }

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * Opens an external dynamic library and registers symbols, making foreign
   * functions available to be called.
   *
   * Requires `allow-ffi` permission. Loading foreign dynamic libraries can in
   * theory bypass all of the sandbox permissions. While it is a separate
   * permission users should acknowledge in practice that is effectively the
   * same as running with the `allow-all` permission.
   *
   * @example Given a C library which exports a foreign function named `add()`
   *
   * ```ts
   * // Determine library extension based on
   * // your OS.
   * let libSuffix = "";
   * switch (Deno.build.os) {
   *   case "windows":
   *     libSuffix = "dll";
   *     break;
   *   case "darwin":
   *     libSuffix = "dylib";
   *     break;
   *   default:
   *     libSuffix = "so";
   *     break;
   * }
   *
   * const libName = `./libadd.${libSuffix}`;
   * // Open library and define exported symbols
   * const dylib = Deno.dlopen(
   *   libName,
   *   {
   *     "add": { parameters: ["isize", "isize"], result: "isize" },
   *   } as const,
   * );
   *
   * // Call the symbol `add`
   * const result = dylib.symbols.add(35n, 34n); // 69n
   *
   * console.log(`Result from external addition of 35 and 34: ${result}`);
   * ```
   *
   * @tags allow-ffi
   * @category FFI
   * @experimental
   */
  export function dlopen<const S extends ForeignLibraryInterface>(
    filename: string | URL,
    symbols: S
  ): DynamicLibrary<S>

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   *  Creates a presentable WebGPU surface from given window and
   *  display handles.
   *
   *  The parameters correspond to the table below:
   *
   *  | system            | winHandle     | displayHandle   |
   *  | ----------------- | ------------- | --------------- |
   *  | "cocoa" (macOS)   | `NSView*`     | -               |
   *  | "win32" (Windows) | `HWND`        | `HINSTANCE`     |
   *  | "x11" (Linux)     | Xlib `Window` | Xlib `Display*` |
   *  | "wayland" (Linux) | `wl_surface*` | `wl_display*`   |
   *
   * @category GPU
   * @experimental
   */
  export class UnsafeWindowSurface {
    constructor(
      system: 'cocoa' | 'win32' | 'x11' | 'wayland',
      windowHandle: Deno.PointerValue<unknown>,
      displayHandle: Deno.PointerValue<unknown>
    )
    getContext(context: 'webgpu'): GPUCanvasContext
    present(): void
  }

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * These are unstable options which can be used with {@linkcode Deno.run}.
   *
   * @category Sub Process
   * @experimental
   */
  export interface UnstableRunOptions extends RunOptions {
    /** If `true`, clears the environment variables before executing the
     * sub-process.
     *
     * @default {false} */
    clearEnv?: boolean
    /** For POSIX systems, sets the group ID for the sub process. */
    gid?: number
    /** For POSIX systems, sets the user ID for the sub process. */
    uid?: number
  }

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * Spawns new subprocess. RunOptions must contain at a minimum the `opt.cmd`,
   * an array of program arguments, the first of which is the binary.
   *
   * ```ts
   * const p = Deno.run({
   *   cmd: ["curl", "https://example.com"],
   * });
   * const status = await p.status();
   * ```
   *
   * Subprocess uses same working directory as parent process unless `opt.cwd`
   * is specified.
   *
   * Environmental variables from parent process can be cleared using `opt.clearEnv`.
   * Doesn't guarantee that only `opt.env` variables are present,
   * as the OS may set environmental variables for processes.
   *
   * Environmental variables for subprocess can be specified using `opt.env`
   * mapping.
   *
   * `opt.uid` sets the child process’s user ID. This translates to a setuid call
   * in the child process. Failure in the setuid call will cause the spawn to fail.
   *
   * `opt.gid` is similar to `opt.uid`, but sets the group ID of the child process.
   * This has the same semantics as the uid field.
   *
   * By default subprocess inherits stdio of parent process. To change
   * this this, `opt.stdin`, `opt.stdout`, and `opt.stderr` can be set
   * independently to a resource ID (_rid_) of an open file, `"inherit"`,
   * `"piped"`, or `"null"`:
   *
   * - _number_: the resource ID of an open file/resource. This allows you to
   *   read or write to a file.
   * - `"inherit"`: The default if unspecified. The subprocess inherits from the
   *   parent.
   * - `"piped"`: A new pipe should be arranged to connect the parent and child
   *   sub-process.
   * - `"null"`: This stream will be ignored. This is the equivalent of attaching
   *   the stream to `/dev/null`.
   *
   * Details of the spawned process are returned as an instance of
   * {@linkcode Deno.Process}.
   *
   * Requires `allow-run` permission.
   *
   * @tags allow-run
   * @category Sub Process
   * @experimental
   */
  export function run<T extends UnstableRunOptions = UnstableRunOptions>(opt: T): Process<T>

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * A custom `HttpClient` for use with {@linkcode fetch} function. This is
   * designed to allow custom certificates or proxies to be used with `fetch()`.
   *
   * @example ```ts
   * const caCert = await Deno.readTextFile("./ca.pem");
   * const client = Deno.createHttpClient({ caCerts: [ caCert ] });
   * const req = await fetch("https://myserver.com", { client });
   * ```
   *
   * @category Fetch
   * @experimental
   */
  export interface HttpClient extends Disposable {
    /** Close the HTTP client. */
    close(): void
  }

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * The options used when creating a {@linkcode Deno.HttpClient}.
   *
   * @category Fetch
   * @experimental
   */
  export interface CreateHttpClientOptions {
    /** A list of root certificates that will be used in addition to the
     * default root certificates to verify the peer's certificate.
     *
     * Must be in PEM format. */
    caCerts?: string[]
    /** A HTTP proxy to use for new connections. */
    proxy?: Proxy
    /** Sets the maximum numer of idle connections per host allowed in the pool. */
    poolMaxIdlePerHost?: number
    /** Set an optional timeout for idle sockets being kept-alive.
     * Set to false to disable the timeout. */
    poolIdleTimeout?: number | false
    /**
     * Whether HTTP/1.1 is allowed or not.
     *
     * @default {true}
     */
    http1?: boolean
    /** Whether HTTP/2 is allowed or not.
     *
     * @default {true}
     */
    http2?: boolean
    /** Whether setting the host header is allowed or not.
     *
     * @default {false}
     */
    allowHost?: boolean
  }

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * The definition of a proxy when specifying
   * {@linkcode Deno.CreateHttpClientOptions}.
   *
   * @category Fetch
   * @experimental
   */
  export interface Proxy {
    /** The string URL of the proxy server to use. */
    url: string
    /** The basic auth credentials to be used against the proxy server. */
    basicAuth?: BasicAuth
  }

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * Basic authentication credentials to be used with a {@linkcode Deno.Proxy}
   * server when specifying {@linkcode Deno.CreateHttpClientOptions}.
   *
   * @category Fetch
   * @experimental
   */
  export interface BasicAuth {
    /** The username to be used against the proxy server. */
    username: string
    /** The password to be used against the proxy server. */
    password: string
  }

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * Create a custom HttpClient to use with {@linkcode fetch}. This is an
   * extension of the web platform Fetch API which allows Deno to use custom
   * TLS certificates and connect via a proxy while using `fetch()`.
   *
   * @example ```ts
   * const caCert = await Deno.readTextFile("./ca.pem");
   * const client = Deno.createHttpClient({ caCerts: [ caCert ] });
   * const response = await fetch("https://myserver.com", { client });
   * ```
   *
   * @example ```ts
   * const client = Deno.createHttpClient({
   *   proxy: { url: "http://myproxy.com:8080" }
   * });
   * const response = await fetch("https://myserver.com", { client });
   * ```
   *
   * @category Fetch
   * @experimental
   */
  export function createHttpClient(options: CreateHttpClientOptions): HttpClient

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * Create a custom HttpClient to use with {@linkcode fetch}. This is an
   * extension of the web platform Fetch API which allows Deno to use custom
   * TLS certificates and connect via a proxy while using `fetch()`.
   *
   * @example ```ts
   * const caCert = await Deno.readTextFile("./ca.pem");
   * // Load a client key and certificate that we'll use to connect
   * const key = await Deno.readTextFile("./key.key");
   * const cert = await Deno.readTextFile("./cert.crt");
   * const client = Deno.createHttpClient({ caCerts: [ caCert ], key, cert });
   * const response = await fetch("https://myserver.com", { client });
   * ```
   *
   * @category Fetch
   * @experimental
   */
  export function createHttpClient(
    options: CreateHttpClientOptions & TlsCertifiedKeyOptions
  ): HttpClient

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * Represents membership of a IPv4 multicast group.
   *
   * @category Network
   * @experimental
   */
  export interface MulticastV4Membership {
    /** Leaves the multicast group. */
    leave: () => Promise<void>
    /** Sets the multicast loopback option. If enabled, multicast packets will be looped back to the local socket. */
    setLoopback: (loopback: boolean) => Promise<void>
    /** Sets the time-to-live of outgoing multicast packets for this socket. */
    setTTL: (ttl: number) => Promise<void>
  }

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * Represents membership of a IPv6 multicast group.
   *
   * @category Network
   * @experimental
   */
  export interface MulticastV6Membership {
    /** Leaves the multicast group. */
    leave: () => Promise<void>
    /** Sets the multicast loopback option. If enabled, multicast packets will be looped back to the local socket. */
    setLoopback: (loopback: boolean) => Promise<void>
  }

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * A generic transport listener for message-oriented protocols.
   *
   * @category Network
   * @experimental
   */
  export interface DatagramConn extends AsyncIterable<[Uint8Array, Addr]> {
    /** Joins an IPv4 multicast group. */
    joinMulticastV4(address: string, networkInterface: string): Promise<MulticastV4Membership>

    /** Joins an IPv6 multicast group. */
    joinMulticastV6(address: string, networkInterface: number): Promise<MulticastV6Membership>

    /** Waits for and resolves to the next message to the instance.
     *
     * Messages are received in the format of a tuple containing the data array
     * and the address information.
     */
    receive(p?: Uint8Array): Promise<[Uint8Array, Addr]>
    /** Sends a message to the target via the connection. The method resolves
     * with the number of bytes sent. */
    send(p: Uint8Array, addr: Addr): Promise<number>
    /** Close closes the socket. Any pending message promises will be rejected
     * with errors. */
    close(): void
    /** Return the address of the instance. */
    readonly addr: Addr
    [Symbol.asyncIterator](): AsyncIterableIterator<[Uint8Array, Addr]>
  }

  /**
   * @category Network
   * @experimental
   */
  export interface TcpListenOptions extends ListenOptions {
    /** When `true` the SO_REUSEPORT flag will be set on the listener. This
     * allows multiple processes to listen on the same address and port.
     *
     * On Linux this will cause the kernel to distribute incoming connections
     * across the different processes that are listening on the same address and
     * port.
     *
     * This flag is only supported on Linux. It is silently ignored on other
     * platforms.
     *
     * @default {false} */
    reusePort?: boolean
  }

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * Unstable options which can be set when opening a datagram listener via
   * {@linkcode Deno.listenDatagram}.
   *
   * @category Network
   * @experimental
   */
  export interface UdpListenOptions extends ListenOptions {
    /** When `true` the specified address will be reused, even if another
     * process has already bound a socket on it. This effectively steals the
     * socket from the listener.
     *
     * @default {false} */
    reuseAddress?: boolean

    /** When `true`, sent multicast packets will be looped back to the local socket.
     *
     * @default {false} */
    loopback?: boolean
  }

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * Listen announces on the local transport address.
   *
   * ```ts
   * const listener1 = Deno.listenDatagram({
   *   port: 80,
   *   transport: "udp"
   * });
   * const listener2 = Deno.listenDatagram({
   *   hostname: "golang.org",
   *   port: 80,
   *   transport: "udp"
   * });
   * ```
   *
   * Requires `allow-net` permission.
   *
   * @tags allow-net
   * @category Network
   * @experimental
   */
  export function listenDatagram(options: UdpListenOptions & { transport: 'udp' }): DatagramConn

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * Listen announces on the local transport address.
   *
   * ```ts
   * const listener = Deno.listenDatagram({
   *   path: "/foo/bar.sock",
   *   transport: "unixpacket"
   * });
   * ```
   *
   * Requires `allow-read` and `allow-write` permission.
   *
   * @tags allow-read, allow-write
   * @category Network
   * @experimental
   */
  export function listenDatagram(
    options: UnixListenOptions & { transport: 'unixpacket' }
  ): DatagramConn

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * Acquire an advisory file-system lock for the provided file.
   *
   * @param [exclusive=false]
   * @category File System
   * @experimental
   */
  export function flock(rid: number, exclusive?: boolean): Promise<void>

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * Acquire an advisory file-system lock synchronously for the provided file.
   *
   * @param [exclusive=false]
   * @category File System
   * @experimental
   */
  export function flockSync(rid: number, exclusive?: boolean): void

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * Release an advisory file-system lock for the provided file.
   *
   * @category File System
   * @experimental
   */
  export function funlock(rid: number): Promise<void>

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * Release an advisory file-system lock for the provided file synchronously.
   *
   * @category File System
   * @experimental
   */
  export function funlockSync(rid: number): void

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * Open a new {@linkcode Deno.Kv} connection to persist data.
   *
   * When a path is provided, the database will be persisted to disk at that
   * path. Read and write access to the file is required.
   *
   * When no path is provided, the database will be opened in a default path for
   * the current script. This location is persistent across script runs and is
   * keyed on the origin storage key (the same key that is used to determine
   * `localStorage` persistence). More information about the origin storage key
   * can be found in the Deno Manual.
   *
   * @tags allow-read, allow-write
   * @category Cloud
   * @experimental
   */
  export function openKv(path?: string): Promise<Deno.Kv>

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * CronScheduleExpression is used as the type of `minute`, `hour`,
   * `dayOfMonth`, `month`, and `dayOfWeek` in {@linkcode CronSchedule}.
   * @category Cloud
   * @experimental
   */
  export type CronScheduleExpression =
    | number
    | { exact: number | number[] }
    | {
        start?: number
        end?: number
        every?: number
      }

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * CronSchedule is the interface used for JSON format
   * cron `schedule`.
   * @category Cloud
   * @experimental
   */
  export interface CronSchedule {
    minute?: CronScheduleExpression
    hour?: CronScheduleExpression
    dayOfMonth?: CronScheduleExpression
    month?: CronScheduleExpression
    dayOfWeek?: CronScheduleExpression
  }

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * Create a cron job that will periodically execute the provided handler
   * callback based on the specified schedule.
   *
   * ```ts
   * Deno.cron("sample cron", "20 * * * *", () => {
   *   console.log("cron job executed");
   * });
   * ```
   *
   * ```ts
   * Deno.cron("sample cron", { hour: { every: 6 } }, () => {
   *   console.log("cron job executed");
   * });
   * ```
   *
   * `schedule` can be a string in the Unix cron format or in JSON format
   * as specified by interface {@linkcode CronSchedule}, where time is specified
   * using UTC time zone.
   *
   * @category Cloud
   * @experimental
   */
  export function cron(
    name: string,
    schedule: string | CronSchedule,
    handler: () => Promise<void> | void
  ): Promise<void>

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * Create a cron job that will periodically execute the provided handler
   * callback based on the specified schedule.
   *
   * ```ts
   * Deno.cron("sample cron", "20 * * * *", {
   *   backoffSchedule: [10, 20]
   * }, () => {
   *   console.log("cron job executed");
   * });
   * ```
   *
   * `schedule` can be a string in the Unix cron format or in JSON format
   * as specified by interface {@linkcode CronSchedule}, where time is specified
   * using UTC time zone.
   *
   * `backoffSchedule` option can be used to specify the retry policy for failed
   * executions. Each element in the array represents the number of milliseconds
   * to wait before retrying the execution. For example, `[1000, 5000, 10000]`
   * means that a failed execution will be retried at most 3 times, with 1
   * second, 5 seconds, and 10 seconds delay between each retry.
   *
   * @category Cloud
   * @experimental
   */
  export function cron(
    name: string,
    schedule: string | CronSchedule,
    options: { backoffSchedule?: number[]; signal?: AbortSignal },
    handler: () => Promise<void> | void
  ): Promise<void>

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * A key to be persisted in a {@linkcode Deno.Kv}. A key is a sequence
   * of {@linkcode Deno.KvKeyPart}s.
   *
   * Keys are ordered lexicographically by their parts. The first part is the
   * most significant, and the last part is the least significant. The order of
   * the parts is determined by both the type and the value of the part. The
   * relative significance of the types can be found in documentation for the
   * {@linkcode Deno.KvKeyPart} type.
   *
   * Keys have a maximum size of 2048 bytes serialized. If the size of the key
   * exceeds this limit, an error will be thrown on the operation that this key
   * was passed to.
   *
   * @category Cloud
   * @experimental
   */
  export type KvKey = readonly KvKeyPart[]

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * A single part of a {@linkcode Deno.KvKey}. Parts are ordered
   * lexicographically, first by their type, and within a given type by their
   * value.
   *
   * The ordering of types is as follows:
   *
   * 1. `Uint8Array`
   * 2. `string`
   * 3. `number`
   * 4. `bigint`
   * 5. `boolean`
   *
   * Within a given type, the ordering is as follows:
   *
   * - `Uint8Array` is ordered by the byte ordering of the array
   * - `string` is ordered by the byte ordering of the UTF-8 encoding of the
   *   string
   * - `number` is ordered following this pattern: `-NaN`
   *   < `-Infinity` < `-100.0` < `-1.0` < -`0.5` < `-0.0` < `0.0` < `0.5`
   *   < `1.0` < `100.0` < `Infinity` < `NaN`
   * - `bigint` is ordered by mathematical ordering, with the largest negative
   *   number being the least first value, and the largest positive number
   *   being the last value
   * - `boolean` is ordered by `false` < `true`
   *
   * This means that the part `1.0` (a number) is ordered before the part `2.0`
   * (also a number), but is greater than the part `0n` (a bigint), because
   * `1.0` is a number and `0n` is a bigint, and type ordering has precedence
   * over the ordering of values within a type.
   *
   * @category Cloud
   * @experimental
   */
  export type KvKeyPart = Uint8Array | string | number | bigint | boolean | symbol

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * Consistency level of a KV operation.
   *
   * - `strong` - This operation must be strongly-consistent.
   * - `eventual` - Eventually-consistent behavior is allowed.
   *
   * @category Cloud
   * @experimental
   */
  export type KvConsistencyLevel = 'strong' | 'eventual'

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * A selector that selects the range of data returned by a list operation on a
   * {@linkcode Deno.Kv}.
   *
   * The selector can either be a prefix selector or a range selector. A prefix
   * selector selects all keys that start with the given prefix (optionally
   * starting at a given key). A range selector selects all keys that are
   * lexicographically between the given start and end keys.
   *
   * @category Cloud
   * @experimental
   */
  export type KvListSelector =
    | { prefix: KvKey }
    | { prefix: KvKey; start: KvKey }
    | { prefix: KvKey; end: KvKey }
    | { start: KvKey; end: KvKey }

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * A mutation to a key in a {@linkcode Deno.Kv}. A mutation is a
   * combination of a key, a value, and a type. The type determines how the
   * mutation is applied to the key.
   *
   * - `set` - Sets the value of the key to the given value, overwriting any
   *   existing value. Optionally an `expireIn` option can be specified to
   *   set a time-to-live (TTL) for the key. The TTL is specified in
   *   milliseconds, and the key will be deleted from the database at earliest
   *   after the specified number of milliseconds have elapsed. Once the
   *   specified duration has passed, the key may still be visible for some
   *   additional time. If the `expireIn` option is not specified, the key will
   *   not expire.
   * - `delete` - Deletes the key from the database. The mutation is a no-op if
   *   the key does not exist.
   * - `sum` - Adds the given value to the existing value of the key. Both the
   *   value specified in the mutation, and any existing value must be of type
   *   `Deno.KvU64`. If the key does not exist, the value is set to the given
   *   value (summed with 0). If the result of the sum overflows an unsigned
   *   64-bit integer, the result is wrapped around.
   * - `max` - Sets the value of the key to the maximum of the existing value
   *   and the given value. Both the value specified in the mutation, and any
   *   existing value must be of type `Deno.KvU64`. If the key does not exist,
   *   the value is set to the given value.
   * - `min` - Sets the value of the key to the minimum of the existing value
   *   and the given value. Both the value specified in the mutation, and any
   *   existing value must be of type `Deno.KvU64`. If the key does not exist,
   *   the value is set to the given value.
   *
   * @category Cloud
   * @experimental
   */
  export type KvMutation = { key: KvKey } & (
    | { type: 'set'; value: unknown; expireIn?: number }
    | { type: 'delete' }
    | { type: 'sum'; value: KvU64 }
    | { type: 'max'; value: KvU64 }
    | { type: 'min'; value: KvU64 }
  )

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * An iterator over a range of data entries in a {@linkcode Deno.Kv}.
   *
   * The cursor getter returns the cursor that can be used to resume the
   * iteration from the current position in the future.
   *
   * @category Cloud
   * @experimental
   */
  export class KvListIterator<T> implements AsyncIterableIterator<KvEntry<T>> {
    /**
     * Returns the cursor of the current position in the iteration. This cursor
     * can be used to resume the iteration from the current position in the
     * future by passing it to the `cursor` option of the `list` method.
     */
    get cursor(): string

    next(): Promise<IteratorResult<KvEntry<T>, undefined>>
    [Symbol.asyncIterator](): AsyncIterableIterator<KvEntry<T>>
  }

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * A versioned pair of key and value in a {@linkcode Deno.Kv}.
   *
   * The `versionstamp` is a string that represents the current version of the
   * key-value pair. It can be used to perform atomic operations on the KV store
   * by passing it to the `check` method of a {@linkcode Deno.AtomicOperation}.
   *
   * @category Cloud
   * @experimental
   */
  export type KvEntry<T> = { key: KvKey; value: T; versionstamp: string }

  /**
   * **UNSTABLE**: New API, yet to be vetted.
   *
   * An optional versioned pair of key and value in a {@linkcode Deno.Kv}.
   *
   * This is the same as a {@linkcode KvEntry}, but the `value` and `versionstamp`
   * fields may be `null` if no value exists for the given key in the KV store.
   *
   * @category Cloud
   * @experimental
   */
  export type KvEntryMaybe<T> =
    | KvEntry<T>
    | {
        key: KvKey
        value: null
        versionstamp: null
      }

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * Options for listing key-value pairs in a {@linkcode Deno.Kv}.
   *
   * @category Cloud
   * @experimental
   */
  export interface KvListOptions {
    /**
     * The maximum number of key-value pairs to return. If not specified, all
     * matching key-value pairs will be returned.
     */
    limit?: number
    /**
     * The cursor to resume the iteration from. If not specified, the iteration
     * will start from the beginning.
     */
    cursor?: string
    /**
     * Whether to reverse the order of the returned key-value pairs. If not
     * specified, the order will be ascending from the start of the range as per
     * the lexicographical ordering of the keys. If `true`, the order will be
     * descending from the end of the range.
     *
     * The default value is `false`.
     */
    reverse?: boolean
    /**
     * The consistency level of the list operation. The default consistency
     * level is "strong". Some use cases can benefit from using a weaker
     * consistency level. For more information on consistency levels, see the
     * documentation for {@linkcode Deno.KvConsistencyLevel}.
     *
     * List operations are performed in batches (in sizes specified by the
     * `batchSize` option). The consistency level of the list operation is
     * applied to each batch individually. This means that while each batch is
     * guaranteed to be consistent within itself, the entire list operation may
     * not be consistent across batches because a mutation may be applied to a
     * key-value pair between batches, in a batch that has already been returned
     * by the list operation.
     */
    consistency?: KvConsistencyLevel
    /**
     * The size of the batches in which the list operation is performed. Larger
     * or smaller batch sizes may positively or negatively affect the
     * performance of a list operation depending on the specific use case and
     * iteration behavior. Slow iterating queries may benefit from using a
     * smaller batch size for increased overall consistency, while fast
     * iterating queries may benefit from using a larger batch size for better
     * performance.
     *
     * The default batch size is equal to the `limit` option, or 100 if this is
     * unset. The maximum value for this option is 500. Larger values will be
     * clamped.
     */
    batchSize?: number
  }

  /**
   * @category Cloud
   * @experimental
   */
  export interface KvCommitResult {
    ok: true
    /** The versionstamp of the value committed to KV. */
    versionstamp: string
  }

  /**
   * @category Cloud
   * @experimental
   */
  export interface KvCommitError {
    ok: false
  }

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * A check to perform as part of a {@linkcode Deno.AtomicOperation}. The check
   * will fail if the versionstamp for the key-value pair in the KV store does
   * not match the given versionstamp. A check with a `null` versionstamp checks
   * that the key-value pair does not currently exist in the KV store.
   *
   * @category Cloud
   * @experimental
   */
  export interface AtomicCheck {
    key: KvKey
    versionstamp: string | null
  }

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * An operation on a {@linkcode Deno.Kv} that can be performed
   * atomically. Atomic operations do not auto-commit, and must be committed
   * explicitly by calling the `commit` method.
   *
   * Atomic operations can be used to perform multiple mutations on the KV store
   * in a single atomic transaction. They can also be used to perform
   * conditional mutations by specifying one or more
   * {@linkcode Deno.AtomicCheck}s that ensure that a mutation is only performed
   * if the key-value pair in the KV has a specific versionstamp. If any of the
   * checks fail, the entire operation will fail and no mutations will be made.
   *
   * The ordering of mutations is guaranteed to be the same as the ordering of
   * the mutations specified in the operation. Checks are performed before any
   * mutations are performed. The ordering of checks is unobservable.
   *
   * Atomic operations can be used to implement optimistic locking, where a
   * mutation is only performed if the key-value pair in the KV store has not
   * been modified since the last read. This can be done by specifying a check
   * that ensures that the versionstamp of the key-value pair matches the
   * versionstamp that was read. If the check fails, the mutation will not be
   * performed and the operation will fail. One can then retry the read-modify-
   * write operation in a loop until it succeeds.
   *
   * The `commit` method of an atomic operation returns a value indicating
   * whether checks passed and mutations were performed. If the operation failed
   * because of a failed check, the return value will be a
   * {@linkcode Deno.KvCommitError} with an `ok: false` property. If the
   * operation failed for any other reason (storage error, invalid value, etc.),
   * an exception will be thrown. If the operation succeeded, the return value
   * will be a {@linkcode Deno.KvCommitResult} object with a `ok: true` property
   * and the versionstamp of the value committed to KV.
   *
   * @category Cloud
   * @experimental
   */
  export class AtomicOperation {
    /**
     * Add to the operation a check that ensures that the versionstamp of the
     * key-value pair in the KV store matches the given versionstamp. If the
     * check fails, the entire operation will fail and no mutations will be
     * performed during the commit.
     */
    check(...checks: AtomicCheck[]): this
    /**
     * Add to the operation a mutation that performs the specified mutation on
     * the specified key if all checks pass during the commit. The types and
     * semantics of all available mutations are described in the documentation
     * for {@linkcode Deno.KvMutation}.
     */
    mutate(...mutations: KvMutation[]): this
    /**
     * Shortcut for creating a `sum` mutation. This method wraps `n` in a
     * {@linkcode Deno.KvU64}, so the value of `n` must be in the range
     * `[0, 2^64-1]`.
     */
    sum(key: KvKey, n: bigint): this
    /**
     * Shortcut for creating a `min` mutation. This method wraps `n` in a
     * {@linkcode Deno.KvU64}, so the value of `n` must be in the range
     * `[0, 2^64-1]`.
     */
    min(key: KvKey, n: bigint): this
    /**
     * Shortcut for creating a `max` mutation. This method wraps `n` in a
     * {@linkcode Deno.KvU64}, so the value of `n` must be in the range
     * `[0, 2^64-1]`.
     */
    max(key: KvKey, n: bigint): this
    /**
     * Add to the operation a mutation that sets the value of the specified key
     * to the specified value if all checks pass during the commit.
     *
     * Optionally an `expireIn` option can be specified to set a time-to-live
     * (TTL) for the key. The TTL is specified in milliseconds, and the key will
     * be deleted from the database at earliest after the specified number of
     * milliseconds have elapsed. Once the specified duration has passed, the
     * key may still be visible for some additional time. If the `expireIn`
     * option is not specified, the key will not expire.
     */
    set(key: KvKey, value: unknown, options?: { expireIn?: number }): this
    /**
     * Add to the operation a mutation that deletes the specified key if all
     * checks pass during the commit.
     */
    delete(key: KvKey): this
    /**
     * Add to the operation a mutation that enqueues a value into the queue
     * if all checks pass during the commit.
     */
    enqueue(
      value: unknown,
      options?: {
        delay?: number
        keysIfUndelivered?: Deno.KvKey[]
        backoffSchedule?: number[]
      }
    ): this
    /**
     * Commit the operation to the KV store. Returns a value indicating whether
     * checks passed and mutations were performed. If the operation failed
     * because of a failed check, the return value will be a {@linkcode
     * Deno.KvCommitError} with an `ok: false` property. If the operation failed
     * for any other reason (storage error, invalid value, etc.), an exception
     * will be thrown. If the operation succeeded, the return value will be a
     * {@linkcode Deno.KvCommitResult} object with a `ok: true` property and the
     * versionstamp of the value committed to KV.
     *
     * If the commit returns `ok: false`, one may create a new atomic operation
     * with updated checks and mutations and attempt to commit it again. See the
     * note on optimistic locking in the documentation for
     * {@linkcode Deno.AtomicOperation}.
     */
    commit(): Promise<KvCommitResult | KvCommitError>
  }

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * A key-value database that can be used to store and retrieve data.
   *
   * Data is stored as key-value pairs, where the key is a {@linkcode Deno.KvKey}
   * and the value is an arbitrary structured-serializable JavaScript value.
   * Keys are ordered lexicographically as described in the documentation for
   * {@linkcode Deno.KvKey}. Keys are unique within a database, and the last
   * value set for a given key is the one that is returned when reading the
   * key. Keys can be deleted from the database, in which case they will no
   * longer be returned when reading keys.
   *
   * Values can be any structured-serializable JavaScript value (objects,
   * arrays, strings, numbers, etc.). The special value {@linkcode Deno.KvU64}
   * can be used to store 64-bit unsigned integers in the database. This special
   * value can not be nested within other objects or arrays. In addition to the
   * regular database mutation operations, the unsigned 64-bit integer value
   * also supports `sum`, `max`, and `min` mutations.
   *
   * Keys are versioned on write by assigning the key an ever-increasing
   * "versionstamp". The versionstamp represents the version of a key-value pair
   * in the database at some point in time, and can be used to perform
   * transactional operations on the database without requiring any locking.
   * This is enabled by atomic operations, which can have conditions that ensure
   * that the operation only succeeds if the versionstamp of the key-value pair
   * matches an expected versionstamp.
   *
   * Keys have a maximum length of 2048 bytes after serialization. Values have a
   * maximum length of 64 KiB after serialization. Serialization of both keys
   * and values is somewhat opaque, but one can usually assume that the
   * serialization of any value is about the same length as the resulting string
   * of a JSON serialization of that same value. If theses limits are exceeded,
   * an exception will be thrown.
   *
   * @category Cloud
   * @experimental
   */
  export class Kv implements Disposable {
    /**
     * Retrieve the value and versionstamp for the given key from the database
     * in the form of a {@linkcode Deno.KvEntryMaybe}. If no value exists for
     * the key, the returned entry will have a `null` value and versionstamp.
     *
     * ```ts
     * const db = await Deno.openKv();
     * const result = await db.get(["foo"]);
     * result.key; // ["foo"]
     * result.value; // "bar"
     * result.versionstamp; // "00000000000000010000"
     * ```
     *
     * The `consistency` option can be used to specify the consistency level
     * for the read operation. The default consistency level is "strong". Some
     * use cases can benefit from using a weaker consistency level. For more
     * information on consistency levels, see the documentation for
     * {@linkcode Deno.KvConsistencyLevel}.
     */
    get<T = unknown>(
      key: KvKey,
      options?: { consistency?: KvConsistencyLevel }
    ): Promise<KvEntryMaybe<T>>

    /**
     * Retrieve multiple values and versionstamps from the database in the form
     * of an array of {@linkcode Deno.KvEntryMaybe} objects. The returned array
     * will have the same length as the `keys` array, and the entries will be in
     * the same order as the keys. If no value exists for a given key, the
     * returned entry will have a `null` value and versionstamp.
     *
     * ```ts
     * const db = await Deno.openKv();
     * const result = await db.getMany([["foo"], ["baz"]]);
     * result[0].key; // ["foo"]
     * result[0].value; // "bar"
     * result[0].versionstamp; // "00000000000000010000"
     * result[1].key; // ["baz"]
     * result[1].value; // null
     * result[1].versionstamp; // null
     * ```
     *
     * The `consistency` option can be used to specify the consistency level
     * for the read operation. The default consistency level is "strong". Some
     * use cases can benefit from using a weaker consistency level. For more
     * information on consistency levels, see the documentation for
     * {@linkcode Deno.KvConsistencyLevel}.
     */
    getMany<T extends readonly unknown[]>(
      keys: readonly [...{ [K in keyof T]: KvKey }],
      options?: { consistency?: KvConsistencyLevel }
    ): Promise<{ [K in keyof T]: KvEntryMaybe<T[K]> }>
    /**
     * Set the value for the given key in the database. If a value already
     * exists for the key, it will be overwritten.
     *
     * ```ts
     * const db = await Deno.openKv();
     * await db.set(["foo"], "bar");
     * ```
     *
     * Optionally an `expireIn` option can be specified to set a time-to-live
     * (TTL) for the key. The TTL is specified in milliseconds, and the key will
     * be deleted from the database at earliest after the specified number of
     * milliseconds have elapsed. Once the specified duration has passed, the
     * key may still be visible for some additional time. If the `expireIn`
     * option is not specified, the key will not expire.
     */
    set(key: KvKey, value: unknown, options?: { expireIn?: number }): Promise<KvCommitResult>

    /**
     * Delete the value for the given key from the database. If no value exists
     * for the key, this operation is a no-op.
     *
     * ```ts
     * const db = await Deno.openKv();
     * await db.delete(["foo"]);
     * ```
     */
    delete(key: KvKey): Promise<void>

    /**
     * Retrieve a list of keys in the database. The returned list is an
     * {@linkcode Deno.KvListIterator} which can be used to iterate over the
     * entries in the database.
     *
     * Each list operation must specify a selector which is used to specify the
     * range of keys to return. The selector can either be a prefix selector, or
     * a range selector:
     *
     * - A prefix selector selects all keys that start with the given prefix of
     *   key parts. For example, the selector `["users"]` will select all keys
     *   that start with the prefix `["users"]`, such as `["users", "alice"]`
     *   and `["users", "bob"]`. Note that you can not partially match a key
     *   part, so the selector `["users", "a"]` will not match the key
     *   `["users", "alice"]`. A prefix selector may specify a `start` key that
     *   is used to skip over keys that are lexicographically less than the
     *   start key.
     * - A range selector selects all keys that are lexicographically between
     *   the given start and end keys (including the start, and excluding the
     *   end). For example, the selector `["users", "a"], ["users", "n"]` will
     *   select all keys that start with the prefix `["users"]` and have a
     *   second key part that is lexicographically between `a` and `n`, such as
     *   `["users", "alice"]`, `["users", "bob"]`, and `["users", "mike"]`, but
     *   not `["users", "noa"]` or `["users", "zoe"]`.
     *
     * ```ts
     * const db = await Deno.openKv();
     * const entries = db.list({ prefix: ["users"] });
     * for await (const entry of entries) {
     *   entry.key; // ["users", "alice"]
     *   entry.value; // { name: "Alice" }
     *   entry.versionstamp; // "00000000000000010000"
     * }
     * ```
     *
     * The `options` argument can be used to specify additional options for the
     * list operation. See the documentation for {@linkcode Deno.KvListOptions}
     * for more information.
     */
    list<T = unknown>(selector: KvListSelector, options?: KvListOptions): KvListIterator<T>

    /**
     * Add a value into the database queue to be delivered to the queue
     * listener via {@linkcode Deno.Kv.listenQueue}.
     *
     * ```ts
     * const db = await Deno.openKv();
     * await db.enqueue("bar");
     * ```
     *
     * The `delay` option can be used to specify the delay (in milliseconds)
     * of the value delivery. The default delay is 0, which means immediate
     * delivery.
     *
     * ```ts
     * const db = await Deno.openKv();
     * await db.enqueue("bar", { delay: 60000 });
     * ```
     *
     * The `keysIfUndelivered` option can be used to specify the keys to
     * be set if the value is not successfully delivered to the queue
     * listener after several attempts. The values are set to the value of
     * the queued message.
     *
     * The `backoffSchedule` option can be used to specify the retry policy for
     * failed message delivery. Each element in the array represents the number of
     * milliseconds to wait before retrying the delivery. For example,
     * `[1000, 5000, 10000]` means that a failed delivery will be retried
     * at most 3 times, with 1 second, 5 seconds, and 10 seconds delay
     * between each retry.
     *
     * ```ts
     * const db = await Deno.openKv();
     * await db.enqueue("bar", {
     *   keysIfUndelivered: [["foo", "bar"]],
     *   backoffSchedule: [1000, 5000, 10000],
     * });
     * ```
     */
    enqueue(
      value: unknown,
      options?: {
        delay?: number
        keysIfUndelivered?: Deno.KvKey[]
        backoffSchedule?: number[]
      }
    ): Promise<KvCommitResult>

    /**
     * Listen for queue values to be delivered from the database queue, which
     * were enqueued with {@linkcode Deno.Kv.enqueue}. The provided handler
     * callback is invoked on every dequeued value. A failed callback
     * invocation is automatically retried multiple times until it succeeds
     * or until the maximum number of retries is reached.
     *
     * ```ts
     * const db = await Deno.openKv();
     * db.listenQueue(async (msg: unknown) => {
     *   await db.set(["foo"], msg);
     * });
     * ```
     */
    // deno-lint-ignore no-explicit-any
    listenQueue(handler: (value: any) => Promise<void> | void): Promise<void>

    /**
     * Create a new {@linkcode Deno.AtomicOperation} object which can be used to
     * perform an atomic transaction on the database. This does not perform any
     * operations on the database - the atomic transaction must be committed
     * explicitly using the {@linkcode Deno.AtomicOperation.commit} method once
     * all checks and mutations have been added to the operation.
     */
    atomic(): AtomicOperation

    /**
     * Watch for changes to the given keys in the database. The returned stream
     * is a {@linkcode ReadableStream} that emits a new value whenever any of
     * the watched keys change their versionstamp. The emitted value is an array
     * of {@linkcode Deno.KvEntryMaybe} objects, with the same length and order
     * as the `keys` array. If no value exists for a given key, the returned
     * entry will have a `null` value and versionstamp.
     *
     * The returned stream does not return every single intermediate state of
     * the watched keys, but rather only keeps you up to date with the latest
     * state of the keys. This means that if a key is modified multiple times
     * quickly, you may not receive a notification for every single change, but
     * rather only the latest state of the key.
     *
     * ```ts
     * const db = await Deno.openKv();
     *
     * const stream = db.watch([["foo"], ["bar"]]);
     * for await (const entries of stream) {
     *   entries[0].key; // ["foo"]
     *   entries[0].value; // "bar"
     *   entries[0].versionstamp; // "00000000000000010000"
     *   entries[1].key; // ["bar"]
     *   entries[1].value; // null
     *   entries[1].versionstamp; // null
     * }
     * ```
     *
     * The `options` argument can be used to specify additional options for the
     * watch operation. The `raw` option can be used to specify whether a new
     * value should be emitted whenever a mutation occurs on any of the watched
     * keys (even if the value of the key does not change, such as deleting a
     * deleted key), or only when entries have observably changed in some way.
     * When `raw: true` is used, it is possible for the stream to occasionally
     * emit values even if no mutations have occurred on any of the watched
     * keys. The default value for this option is `false`.
     */
    watch<T extends readonly unknown[]>(
      keys: readonly [...{ [K in keyof T]: KvKey }],
      options?: { raw?: boolean }
    ): ReadableStream<{ [K in keyof T]: KvEntryMaybe<T[K]> }>

    /**
     * Close the database connection. This will prevent any further operations
     * from being performed on the database, and interrupt any in-flight
     * operations immediately.
     */
    close(): void

    /**
     * Get a symbol that represents the versionstamp of the current atomic
     * operation. This symbol can be used as the last part of a key in
     * `.set()`, both directly on the `Kv` object and on an `AtomicOperation`
     * object created from this `Kv` instance.
     */
    commitVersionstamp(): symbol

    [Symbol.dispose](): void
  }

  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * Wrapper type for 64-bit unsigned integers for use as values in a
   * {@linkcode Deno.Kv}.
   *
   * @category Cloud
   * @experimental
   */
  export class KvU64 {
    /** Create a new `KvU64` instance from the given bigint value. If the value
     * is signed or greater than 64-bits, an error will be thrown. */
    constructor(value: bigint)
    /** The value of this unsigned 64-bit integer, represented as a bigint. */
    readonly value: bigint
  }

  /**
   * A namespace containing runtime APIs available in Jupyter notebooks.
   *
   * When accessed outside of Jupyter notebook context an error will be thrown.
   *
   * @category Jupyter
   * @experimental
   */
  export namespace jupyter {
    /**
     * @category Jupyter
     * @experimental
     */
    export interface DisplayOptions {
      raw?: boolean
      update?: boolean
      display_id?: string
    }

    /**
     * @category Jupyter
     * @experimental
     */
    export type VegaObject = {
      $schema: string
      [key: string]: unknown
    }

    /**
     * A collection of supported media types and data for Jupyter frontends.
     *
     * @category Jupyter
     * @experimental
     */
    export type MediaBundle = {
      'text/plain'?: string
      'text/html'?: string
      'image/svg+xml'?: string
      'text/markdown'?: string
      'application/javascript'?: string

      // Images (per Jupyter spec) must be base64 encoded. We could _allow_
      // accepting Uint8Array or ArrayBuffer within `display` calls, however we still
      // must encode them for jupyter.
      'image/png'?: string // WISH: Uint8Array | ArrayBuffer
      'image/jpeg'?: string // WISH: Uint8Array | ArrayBuffer
      'image/gif'?: string // WISH: Uint8Array | ArrayBuffer
      'application/pdf'?: string // WISH: Uint8Array | ArrayBuffer

      // NOTE: all JSON types must be objects at the top level (no arrays, strings, or other primitives)
      'application/json'?: object
      'application/geo+json'?: object
      'application/vdom.v1+json'?: object
      'application/vnd.plotly.v1+json'?: object
      'application/vnd.vega.v5+json'?: VegaObject
      'application/vnd.vegalite.v4+json'?: VegaObject
      'application/vnd.vegalite.v5+json'?: VegaObject

      // Must support a catch all for custom media types / mimetypes
      [key: string]: string | object | undefined
    }

    /**
     * @category Jupyter
     * @experimental
     */
    export const $display: unique symbol

    /**
     * @category Jupyter
     * @experimental
     */
    export type Displayable = {
      [$display]: () => MediaBundle | Promise<MediaBundle>
    }

    /**
     * Display function for Jupyter Deno Kernel.
     * Mimics the behavior of IPython's `display(obj, raw=True)` function to allow
     * asynchronous displaying of objects in Jupyter.
     *
     * @param obj - The object to be displayed
     * @param options - Display options with a default { raw: true }
     * @category Jupyter
     * @experimental
     */
    export function display(obj: unknown, options?: DisplayOptions): void

    /**
     * Show Markdown in Jupyter frontends with a tagged template function.
     *
     * Takes a template string and returns a displayable object for Jupyter frontends.
     *
     * @example
     * Create a Markdown view.
     *
     * ```typescript
     * const { md } = Deno.jupyter;
     * md`# Notebooks in TypeScript via Deno ![Deno logo](https://github.com/denoland.png?size=32)
     *
     * * TypeScript ${Deno.version.typescript}
     * * V8 ${Deno.version.v8}
     * * Deno ${Deno.version.deno}
     *
     * Interactive compute with Jupyter _built into Deno_!
     * `
     * ```
     *
     * @category Jupyter
     * @experimental
     */
    export function md(strings: TemplateStringsArray, ...values: unknown[]): Displayable

    /**
     * Show HTML in Jupyter frontends with a tagged template function.
     *
     * Takes a template string and returns a displayable object for Jupyter frontends.
     *
     * @example
     * Create an HTML view.
     * ```typescript
     * const { html } = Deno.jupyter;
     * html`<h1>Hello, world!</h1>`
     * ```
     *
     * @category Jupyter
     * @experimental
     */
    export function html(strings: TemplateStringsArray, ...values: unknown[]): Displayable

    /**
     * SVG Tagged Template Function.
     *
     * Takes a template string and returns a displayable object for Jupyter frontends.
     *
     * Example usage:
     *
     * svg`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
     *      <circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" />
     *    </svg>`
     *
     * @category Jupyter
     * @experimental
     */
    export function svg(strings: TemplateStringsArray, ...values: unknown[]): Displayable

    /**
     * Format an object for displaying in Deno
     *
     * @param obj - The object to be displayed
     * @returns MediaBundle
     *
     * @category Jupyter
     * @experimental
     */
    export function format(obj: unknown): MediaBundle

    /**
     * Broadcast a message on IO pub channel.
     *
     * ```
     * await Deno.jupyter.broadcast("display_data", {
     *   data: { "text/html": "<b>Processing.</b>" },
     *   metadata: {},
     *   transient: { display_id: "progress" }
     * });
     *
     * await new Promise((resolve) => setTimeout(resolve, 500));
     *
     * await Deno.jupyter.broadcast("update_display_data", {
     *   data: { "text/html": "<b>Processing..</b>" },
     *   metadata: {},
     *   transient: { display_id: "progress" }
     * });
     * ```
     *
     * @category Jupyter
     * @experimental
     */
    export function broadcast(
      msgType: string,
      content: Record<string, unknown>,
      extra?: {
        metadata?: Record<string, unknown>
        buffers?: Uint8Array[]
      }
    ): Promise<void>
  }
}

/** **UNSTABLE**: New API, yet to be vetted.
 *
 * The [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
 * which also supports setting a {@linkcode Deno.HttpClient} which provides a
 * way to connect via proxies and use custom TLS certificates.
 *
 * @tags allow-net, allow-read
 * @category Fetch
 * @experimental
 */
declare function fetch(
  input: Request | URL | string,
  init?: RequestInit & { client: Deno.HttpClient }
): Promise<Response>

/** **UNSTABLE**: New API, yet to be vetted.
 *
 * @category Workers
 * @experimental
 */
declare interface WorkerOptions {
  /** **UNSTABLE**: New API, yet to be vetted.
   *
   * Configure permissions options to change the level of access the worker will
   * have. By default it will have no permissions. Note that the permissions
   * of a worker can't be extended beyond its parent's permissions reach.
   *
   * - `"inherit"` will take the permissions of the thread the worker is created
   *   in.
   * - `"none"` will use the default behavior and have no permission
   * - A list of routes can be provided that are relative to the file the worker
   *   is created in to limit the access of the worker (read/write permissions
   *   only)
   *
   * Example:
   *
   * ```ts
   * // mod.ts
   * const worker = new Worker(
   *   new URL("deno_worker.ts", import.meta.url).href, {
   *     type: "module",
   *     deno: {
   *       permissions: {
   *         read: true,
   *       },
   *     },
   *   }
   * );
   * ```
   */
  deno?: {
    /** Set to `"none"` to disable all the permissions in the worker. */
    permissions?: Deno.PermissionOptions
  }
}

/** **UNSTABLE**: New API, yet to be vetted.
 *
 * @category WebSockets
 * @experimental
 */
declare interface WebSocketStreamOptions {
  protocols?: string[]
  signal?: AbortSignal
  headers?: HeadersInit
}

/** **UNSTABLE**: New API, yet to be vetted.
 *
 * @category WebSockets
 * @experimental
 */
declare interface WebSocketConnection {
  readable: ReadableStream<string | Uint8Array>
  writable: WritableStream<string | Uint8Array>
  extensions: string
  protocol: string
}

/** **UNSTABLE**: New API, yet to be vetted.
 *
 * @category WebSockets
 * @experimental
 */
declare interface WebSocketCloseInfo {
  code?: number
  reason?: string
}

/** **UNSTABLE**: New API, yet to be vetted.
 *
 * @tags allow-net
 * @category WebSockets
 * @experimental
 */
declare interface WebSocketStream {
  url: string
  opened: Promise<WebSocketConnection>
  closed: Promise<WebSocketCloseInfo>
  close(closeInfo?: WebSocketCloseInfo): void
}

/** **UNSTABLE**: New API, yet to be vetted.
 *
 * @tags allow-net
 * @category WebSockets
 * @experimental
 */
declare var WebSocketStream: {
  readonly prototype: WebSocketStream
  new (url: string, options?: WebSocketStreamOptions): WebSocketStream
}

/** **UNSTABLE**: New API, yet to be vetted.
 *
 * @tags allow-net
 * @category WebSockets
 * @experimental
 */
declare interface WebSocketError extends DOMException {
  readonly closeCode: number
  readonly reason: string
}

/** **UNSTABLE**: New API, yet to be vetted.
 *
 * @tags allow-net
 * @category WebSockets
 * @experimental
 */
declare var WebSocketError: {
  readonly prototype: WebSocketError
  new (message?: string, init?: WebSocketCloseInfo): WebSocketError
}

// Adapted from `tc39/proposal-temporal`: https://github.com/tc39/proposal-temporal/blob/main/polyfill/index.d.ts

/**
 * [Specification](https://tc39.es/proposal-temporal/docs/index.html)
 *
 * @category Temporal
 * @experimental
 */
declare namespace Temporal {
  /**
   * @category Temporal
   * @experimental
   */
  export type ComparisonResult = -1 | 0 | 1
  /**
   * @category Temporal
   * @experimental
   */
  export type RoundingMode =
    | 'ceil'
    | 'floor'
    | 'expand'
    | 'trunc'
    | 'halfCeil'
    | 'halfFloor'
    | 'halfExpand'
    | 'halfTrunc'
    | 'halfEven'

  /**
   * Options for assigning fields using `with()` or entire objects with
   * `from()`.
   *
   * @category Temporal
   * @experimental
   */
  export type AssignmentOptions = {
    /**
     * How to deal with out-of-range values
     *
     * - In `'constrain'` mode, out-of-range values are clamped to the nearest
     *   in-range value.
     * - In `'reject'` mode, out-of-range values will cause the function to
     *   throw a RangeError.
     *
     * The default is `'constrain'`.
     */
    overflow?: 'constrain' | 'reject'
  }

  /**
   * Options for assigning fields using `Duration.prototype.with()` or entire
   * objects with `Duration.from()`, and for arithmetic with
   * `Duration.prototype.add()` and `Duration.prototype.subtract()`.
   *
   * @category Temporal
   * @experimental
   */
  export type DurationOptions = {
    /**
     * How to deal with out-of-range values
     *
     * - In `'constrain'` mode, out-of-range values are clamped to the nearest
     *   in-range value.
     * - In `'balance'` mode, out-of-range values are resolved by balancing them
     *   with the next highest unit.
     *
     * The default is `'constrain'`.
     */
    overflow?: 'constrain' | 'balance'
  }

  /**
   * Options for conversions of `Temporal.PlainDateTime` to `Temporal.Instant`
   *
   * @category Temporal
   * @experimental
   */
  export type ToInstantOptions = {
    /**
     * Controls handling of invalid or ambiguous times caused by time zone
     * offset changes like Daylight Saving time (DST) transitions.
     *
     * This option is only relevant if a `DateTime` value does not exist in the
     * destination time zone (e.g. near "Spring Forward" DST transitions), or
     * exists more than once (e.g. near "Fall Back" DST transitions).
     *
     * In case of ambiguous or nonexistent times, this option controls what
     * exact time to return:
     * - `'compatible'`: Equivalent to `'earlier'` for backward transitions like
     *   the start of DST in the Spring, and `'later'` for forward transitions
     *   like the end of DST in the Fall. This matches the behavior of legacy
     *   `Date`, of libraries like moment.js, Luxon, or date-fns, and of
     *   cross-platform standards like [RFC 5545
     *   (iCalendar)](https://tools.ietf.org/html/rfc5545).
     * - `'earlier'`: The earlier time of two possible times
     * - `'later'`: The later of two possible times
     * - `'reject'`: Throw a RangeError instead
     *
     * The default is `'compatible'`.
     */
    disambiguation?: 'compatible' | 'earlier' | 'later' | 'reject'
  }

  /**
   * @category Temporal
   * @experimental
   */
  export type OffsetDisambiguationOptions = {
    /**
     * Time zone definitions can change. If an application stores data about
     * events in the future, then stored data about future events may become
     * ambiguous, for example if a country permanently abolishes DST. The
     * `offset` option controls this unusual case.
     *
     * - `'use'` always uses the offset (if it's provided) to calculate the
     *   instant. This ensures that the result will match the instant that was
     *   originally stored, even if local clock time is different.
     * - `'prefer'` uses the offset if it's valid for the date/time in this time
     *   zone, but if it's not valid then the time zone will be used as a
     *   fallback to calculate the instant.
     * - `'ignore'` will disregard any provided offset. Instead, the time zone
     *    and date/time value are used to calculate the instant. This will keep
     *    local clock time unchanged but may result in a different real-world
     *    instant.
     * - `'reject'` acts like `'prefer'`, except it will throw a RangeError if
     *   the offset is not valid for the given time zone identifier and
     *   date/time value.
     *
     * If the ISO string ends in 'Z' then this option is ignored because there
     * is no possibility of ambiguity.
     *
     * If a time zone offset is not present in the input, then this option is
     * ignored because the time zone will always be used to calculate the
     * offset.
     *
     * If the offset is not used, and if the date/time and time zone don't
     * uniquely identify a single instant, then the `disambiguation` option will
     * be used to choose the correct instant. However, if the offset is used
     * then the `disambiguation` option will be ignored.
     */
    offset?: 'use' | 'prefer' | 'ignore' | 'reject'
  }

  /**
   * @category Temporal
   * @experimental
   */
  export type ZonedDateTimeAssignmentOptions = Partial<
    AssignmentOptions & ToInstantOptions & OffsetDisambiguationOptions
  >

  /**
   * Options for arithmetic operations like `add()` and `subtract()`
   *
   * @category Temporal
   * @experimental
   */
  export type ArithmeticOptions = {
    /**
     * Controls handling of out-of-range arithmetic results.
     *
     * If a result is out of range, then `'constrain'` will clamp the result to
     * the allowed range, while `'reject'` will throw a RangeError.
     *
     * The default is `'constrain'`.
     */
    overflow?: 'constrain' | 'reject'
  }

  /**
   * @category Temporal
   * @experimental
   */
  export type DateUnit = 'year' | 'month' | 'week' | 'day'
  /**
   * @category Temporal
   * @experimental
   */
  export type TimeUnit = 'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'
  /**
   * @category Temporal
   * @experimental
   */
  export type DateTimeUnit = DateUnit | TimeUnit

  /**
   * When the name of a unit is provided to a Temporal API as a string, it is
   * usually singular, e.g. 'day' or 'hour'. But plural unit names like 'days'
   * or 'hours' are aso accepted too.
   *
   * @category Temporal
   * @experimental
   */
  export type PluralUnit<T extends DateTimeUnit> = {
    year: 'years'
    month: 'months'
    week: 'weeks'
    day: 'days'
    hour: 'hours'
    minute: 'minutes'
    second: 'seconds'
    millisecond: 'milliseconds'
    microsecond: 'microseconds'
    nanosecond: 'nanoseconds'
  }[T]

  /**
   * @category Temporal
   * @experimental
   */
  export type LargestUnit<T extends DateTimeUnit> = 'auto' | T | PluralUnit<T>
  /**
   * @category Temporal
   * @experimental
   */
  export type SmallestUnit<T extends DateTimeUnit> = T | PluralUnit<T>
  /**
   * @category Temporal
   * @experimental
   */
  export type TotalUnit<T extends DateTimeUnit> = T | PluralUnit<T>

  /**
   * Options for outputting precision in toString() on types with seconds
   *
   * @category Temporal
   * @experimental
   */
  export type ToStringPrecisionOptions = {
    fractionalSecondDigits?: 'auto' | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
    smallestUnit?: SmallestUnit<'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>

    /**
     * Controls how rounding is performed:
     * - `halfExpand`: Round to the nearest of the values allowed by
     *   `roundingIncrement` and `smallestUnit`. When there is a tie, round up.
     *   This mode is the default.
     * - `ceil`: Always round up, towards the end of time.
     * - `trunc`: Always round down, towards the beginning of time.
     * - `floor`: Also round down, towards the beginning of time. This mode acts
     *   the same as `trunc`, but it's included for consistency with
     *   `Temporal.Duration.round()` where negative values are allowed and
     *   `trunc` rounds towards zero, unlike `floor` which rounds towards
     *   negative infinity which is usually unexpected. For this reason, `trunc`
     *   is recommended for most use cases.
     */
    roundingMode?: RoundingMode
  }

  /**
   * @category Temporal
   * @experimental
   */
  export type ShowCalendarOption = {
    calendarName?: 'auto' | 'always' | 'never' | 'critical'
  }

  /**
   * @category Temporal
   * @experimental
   */
  export type CalendarTypeToStringOptions = Partial<ToStringPrecisionOptions & ShowCalendarOption>

  /**
   * @category Temporal
   * @experimental
   */
  export type ZonedDateTimeToStringOptions = Partial<
    CalendarTypeToStringOptions & {
      timeZoneName?: 'auto' | 'never' | 'critical'
      offset?: 'auto' | 'never'
    }
  >

  /**
   * @category Temporal
   * @experimental
   */
  export type InstantToStringOptions = Partial<
    ToStringPrecisionOptions & {
      timeZone: TimeZoneLike
    }
  >

  /**
   * Options to control the result of `until()` and `since()` methods in
   * `Temporal` types.
   *
   * @category Temporal
   * @experimental
   */
  export interface DifferenceOptions<T extends DateTimeUnit> {
    /**
     * The unit to round to. For example, to round to the nearest minute, use
     * `smallestUnit: 'minute'`. This property is optional for `until()` and
     * `since()`, because those methods default behavior is not to round.
     * However, the same property is required for `round()`.
     */
    smallestUnit?: SmallestUnit<T>

    /**
     * The largest unit to allow in the resulting `Temporal.Duration` object.
     *
     * Larger units will be "balanced" into smaller units. For example, if
     * `largestUnit` is `'minute'` then a two-hour duration will be output as a
     * 120-minute duration.
     *
     * Valid values may include `'year'`, `'month'`, `'week'`, `'day'`,
     * `'hour'`, `'minute'`, `'second'`, `'millisecond'`, `'microsecond'`,
     * `'nanosecond'` and `'auto'`, although some types may throw an exception
     * if a value is used that would produce an invalid result. For example,
     * `hours` is not accepted by `Temporal.PlainDate.prototype.since()`.
     *
     * The default is always `'auto'`, though the meaning of this depends on the
     * type being used.
     */
    largestUnit?: LargestUnit<T>

    /**
     * Allows rounding to an integer number of units. For example, to round to
     * increments of a half hour, use `{ smallestUnit: 'minute',
     * roundingIncrement: 30 }`.
     */
    roundingIncrement?: number

    /**
     * Controls how rounding is performed:
     * - `halfExpand`: Round to the nearest of the values allowed by
     *   `roundingIncrement` and `smallestUnit`. When there is a tie, round away
     *   from zero like `ceil` for positive durations and like `floor` for
     *   negative durations.
     * - `ceil`: Always round up, towards the end of time.
     * - `trunc`: Always round down, towards the beginning of time. This mode is
     *   the default.
     * - `floor`: Also round down, towards the beginning of time. This mode acts
     *   the same as `trunc`, but it's included for consistency with
     *   `Temporal.Duration.round()` where negative values are allowed and
     *   `trunc` rounds towards zero, unlike `floor` which rounds towards
     *   negative infinity which is usually unexpected. For this reason, `trunc`
     *   is recommended for most use cases.
     */
    roundingMode?: RoundingMode
  }

  /**
   * `round` methods take one required parameter. If a string is provided, the
   * resulting `Temporal.Duration` object will be rounded to that unit. If an
   * object is provided, its `smallestUnit` property is required while other
   * properties are optional. A string is treated the same as an object whose
   * `smallestUnit` property value is that string.
   *
   * @category Temporal
   * @experimental
   */
  export type RoundTo<T extends DateTimeUnit> =
    | SmallestUnit<T>
    | {
        /**
         * The unit to round to. For example, to round to the nearest minute,
         * use `smallestUnit: 'minute'`. This option is required. Note that the
         * same-named property is optional when passed to `until` or `since`
         * methods, because those methods do no rounding by default.
         */
        smallestUnit: SmallestUnit<T>

        /**
         * Allows rounding to an integer number of units. For example, to round to
         * increments of a half hour, use `{ smallestUnit: 'minute',
         * roundingIncrement: 30 }`.
         */
        roundingIncrement?: number

        /**
         * Controls how rounding is performed:
         * - `halfExpand`: Round to the nearest of the values allowed by
         *   `roundingIncrement` and `smallestUnit`. When there is a tie, round up.
         *   This mode is the default.
         * - `ceil`: Always round up, towards the end of time.
         * - `trunc`: Always round down, towards the beginning of time.
         * - `floor`: Also round down, towards the beginning of time. This mode acts
         *   the same as `trunc`, but it's included for consistency with
         *   `Temporal.Duration.round()` where negative values are allowed and
         *   `trunc` rounds towards zero, unlike `floor` which rounds towards
         *   negative infinity which is usually unexpected. For this reason, `trunc`
         *   is recommended for most use cases.
         */
        roundingMode?: RoundingMode
      }

  /**
   * The `round` method of the `Temporal.Duration` accepts one required
   * parameter. If a string is provided, the resulting `Temporal.Duration`
   * object will be rounded to that unit. If an object is provided, the
   * `smallestUnit` and/or `largestUnit` property is required, while other
   * properties are optional. A string parameter is treated the same as an
   * object whose `smallestUnit` property value is that string.
   *
   * @category Temporal
   * @experimental
   */
  export type DurationRoundTo =
    | SmallestUnit<DateTimeUnit>
    | ((
        | {
            /**
             * The unit to round to. For example, to round to the nearest
             * minute, use `smallestUnit: 'minute'`. This property is normally
             * required, but is optional if `largestUnit` is provided and not
             * undefined.
             */
            smallestUnit: SmallestUnit<DateTimeUnit>

            /**
             * The largest unit to allow in the resulting `Temporal.Duration`
             * object.
             *
             * Larger units will be "balanced" into smaller units. For example,
             * if `largestUnit` is `'minute'` then a two-hour duration will be
             * output as a 120-minute duration.
             *
             * Valid values include `'year'`, `'month'`, `'week'`, `'day'`,
             * `'hour'`, `'minute'`, `'second'`, `'millisecond'`,
             * `'microsecond'`, `'nanosecond'` and `'auto'`.
             *
             * The default is `'auto'`, which means "the largest nonzero unit in
             * the input duration". This default prevents expanding durations to
             * larger units unless the caller opts into this behavior.
             *
             * If `smallestUnit` is larger, then `smallestUnit` will be used as
             * `largestUnit`, superseding a caller-supplied or default value.
             */
            largestUnit?: LargestUnit<DateTimeUnit>
          }
        | {
            /**
             * The unit to round to. For example, to round to the nearest
             * minute, use `smallestUnit: 'minute'`. This property is normally
             * required, but is optional if `largestUnit` is provided and not
             * undefined.
             */
            smallestUnit?: SmallestUnit<DateTimeUnit>

            /**
             * The largest unit to allow in the resulting `Temporal.Duration`
             * object.
             *
             * Larger units will be "balanced" into smaller units. For example,
             * if `largestUnit` is `'minute'` then a two-hour duration will be
             * output as a 120-minute duration.
             *
             * Valid values include `'year'`, `'month'`, `'week'`, `'day'`,
             * `'hour'`, `'minute'`, `'second'`, `'millisecond'`,
             * `'microsecond'`, `'nanosecond'` and `'auto'`.
             *
             * The default is `'auto'`, which means "the largest nonzero unit in
             * the input duration". This default prevents expanding durations to
             * larger units unless the caller opts into this behavior.
             *
             * If `smallestUnit` is larger, then `smallestUnit` will be used as
             * `largestUnit`, superseding a caller-supplied or default value.
             */
            largestUnit: LargestUnit<DateTimeUnit>
          }
      ) & {
        /**
         * Allows rounding to an integer number of units. For example, to round
         * to increments of a half hour, use `{ smallestUnit: 'minute',
         * roundingIncrement: 30 }`.
         */
        roundingIncrement?: number

        /**
         * Controls how rounding is performed:
         * - `halfExpand`: Round to the nearest of the values allowed by
         *   `roundingIncrement` and `smallestUnit`. When there is a tie, round
         *   away from zero like `ceil` for positive durations and like `floor`
         *   for negative durations. This mode is the default.
         * - `ceil`: Always round towards positive infinity. For negative
         *   durations this option will decrease the absolute value of the
         *   duration which may be unexpected. To round away from zero, use
         *   `ceil` for positive durations and `floor` for negative durations.
         * - `trunc`: Always round down towards zero.
         * - `floor`: Always round towards negative infinity. This mode acts the
         *   same as `trunc` for positive durations but for negative durations
         *   it will increase the absolute value of the result which may be
         *   unexpected. For this reason, `trunc` is recommended for most "round
         *   down" use cases.
         */
        roundingMode?: RoundingMode

        /**
         * The starting point to use for rounding and conversions when
         * variable-length units (years, months, weeks depending on the
         * calendar) are involved. This option is required if any of the
         * following are true:
         * - `unit` is `'week'` or larger units
         * - `this` has a nonzero value for `weeks` or larger units
         *
         * This value must be either a `Temporal.PlainDateTime`, a
         * `Temporal.ZonedDateTime`, or a string or object value that can be
         * passed to `from()` of those types. Examples:
         * - `'2020-01'01T00:00-08:00[America/Los_Angeles]'`
         * - `'2020-01'01'`
         * - `Temporal.PlainDate.from('2020-01-01')`
         *
         * `Temporal.ZonedDateTime` will be tried first because it's more
         * specific, with `Temporal.PlainDateTime` as a fallback.
         *
         * If the value resolves to a `Temporal.ZonedDateTime`, then operation
         * will adjust for DST and other time zone transitions. Otherwise
         * (including if this option is omitted), then the operation will ignore
         * time zone transitions and all days will be assumed to be 24 hours
         * long.
         */
        relativeTo?:
          | Temporal.PlainDateTime
          | Temporal.ZonedDateTime
          | PlainDateTimeLike
          | ZonedDateTimeLike
          | string
      })

  /**
   * Options to control behavior of `Duration.prototype.total()`
   *
   * @category Temporal
   * @experimental
   */
  export type DurationTotalOf =
    | TotalUnit<DateTimeUnit>
    | {
        /**
         * The unit to convert the duration to. This option is required.
         */
        unit: TotalUnit<DateTimeUnit>

        /**
         * The starting point to use when variable-length units (years, months,
         * weeks depending on the calendar) are involved. This option is required if
         * any of the following are true:
         * - `unit` is `'week'` or larger units
         * - `this` has a nonzero value for `weeks` or larger units
         *
         * This value must be either a `Temporal.PlainDateTime`, a
         * `Temporal.ZonedDateTime`, or a string or object value that can be passed
         * to `from()` of those types. Examples:
         * - `'2020-01'01T00:00-08:00[America/Los_Angeles]'`
         * - `'2020-01'01'`
         * - `Temporal.PlainDate.from('2020-01-01')`
         *
         * `Temporal.ZonedDateTime` will be tried first because it's more
         * specific, with `Temporal.PlainDateTime` as a fallback.
         *
         * If the value resolves to a `Temporal.ZonedDateTime`, then operation will
         * adjust for DST and other time zone transitions. Otherwise (including if
         * this option is omitted), then the operation will ignore time zone
         * transitions and all days will be assumed to be 24 hours long.
         */
        relativeTo?:
          | Temporal.ZonedDateTime
          | Temporal.PlainDateTime
          | ZonedDateTimeLike
          | PlainDateTimeLike
          | string
      }

  /**
   * Options to control behavior of `Duration.compare()`, `Duration.add()`, and
   * `Duration.subtract()`
   *
   * @category Temporal
   * @experimental
   */
  export interface DurationArithmeticOptions {
    /**
     * The starting point to use when variable-length units (years, months,
     * weeks depending on the calendar) are involved. This option is required if
     * either of the durations has a nonzero value for `weeks` or larger units.
     *
     * This value must be either a `Temporal.PlainDateTime`, a
     * `Temporal.ZonedDateTime`, or a string or object value that can be passed
     * to `from()` of those types. Examples:
     * - `'2020-01'01T00:00-08:00[America/Los_Angeles]'`
     * - `'2020-01'01'`
     * - `Temporal.PlainDate.from('2020-01-01')`
     *
     * `Temporal.ZonedDateTime` will be tried first because it's more
     * specific, with `Temporal.PlainDateTime` as a fallback.
     *
     * If the value resolves to a `Temporal.ZonedDateTime`, then operation will
     * adjust for DST and other time zone transitions. Otherwise (including if
     * this option is omitted), then the operation will ignore time zone
     * transitions and all days will be assumed to be 24 hours long.
     */
    relativeTo?:
      | Temporal.ZonedDateTime
      | Temporal.PlainDateTime
      | ZonedDateTimeLike
      | PlainDateTimeLike
      | string
  }

  /**
   * @category Temporal
   * @experimental
   */
  export type DurationLike = {
    years?: number
    months?: number
    weeks?: number
    days?: number
    hours?: number
    minutes?: number
    seconds?: number
    milliseconds?: number
    microseconds?: number
    nanoseconds?: number
  }

  /**
   * A `Temporal.Duration` represents an immutable duration of time which can be
   * used in date/time arithmetic.
   *
   * See https://tc39.es/proposal-temporal/docs/duration.html for more details.
   *
   * @category Temporal
   * @experimental
   */
  export class Duration {
    static from(item: Temporal.Duration | DurationLike | string): Temporal.Duration
    static compare(
      one: Temporal.Duration | DurationLike | string,
      two: Temporal.Duration | DurationLike | string,
      options?: DurationArithmeticOptions
    ): ComparisonResult
    constructor(
      years?: number,
      months?: number,
      weeks?: number,
      days?: number,
      hours?: number,
      minutes?: number,
      seconds?: number,
      milliseconds?: number,
      microseconds?: number,
      nanoseconds?: number
    )
    readonly sign: -1 | 0 | 1
    readonly blank: boolean
    readonly years: number
    readonly months: number
    readonly weeks: number
    readonly days: number
    readonly hours: number
    readonly minutes: number
    readonly seconds: number
    readonly milliseconds: number
    readonly microseconds: number
    readonly nanoseconds: number
    negated(): Temporal.Duration
    abs(): Temporal.Duration
    with(durationLike: DurationLike): Temporal.Duration
    add(
      other: Temporal.Duration | DurationLike | string,
      options?: DurationArithmeticOptions
    ): Temporal.Duration
    subtract(
      other: Temporal.Duration | DurationLike | string,
      options?: DurationArithmeticOptions
    ): Temporal.Duration
    round(roundTo: DurationRoundTo): Temporal.Duration
    total(totalOf: DurationTotalOf): number
    toLocaleString(locales?: string | string[], options?: Intl.DateTimeFormatOptions): string
    toJSON(): string
    toString(options?: ToStringPrecisionOptions): string
    valueOf(): never
    readonly [Symbol.toStringTag]: 'Temporal.Duration'
  }

  /**
   * A `Temporal.Instant` is an exact point in time, with a precision in
   * nanoseconds. No time zone or calendar information is present. Therefore,
   * `Temporal.Instant` has no concept of days, months, or even hours.
   *
   * For convenience of interoperability, it internally uses nanoseconds since
   * the {@link https://en.wikipedia.org/wiki/Unix_time|Unix epoch} (midnight
   * UTC on January 1, 1970). However, a `Temporal.Instant` can be created from
   * any of several expressions that refer to a single point in time, including
   * an {@link https://en.wikipedia.org/wiki/ISO_8601|ISO 8601 string} with a
   * time zone offset such as '2020-01-23T17:04:36.491865121-08:00'.
   *
   * See https://tc39.es/proposal-temporal/docs/instant.html for more details.
   *
   * @category Temporal
   * @experimental
   */
  export class Instant {
    static fromEpochSeconds(epochSeconds: number): Temporal.Instant
    static fromEpochMilliseconds(epochMilliseconds: number): Temporal.Instant
    static fromEpochMicroseconds(epochMicroseconds: bigint): Temporal.Instant
    static fromEpochNanoseconds(epochNanoseconds: bigint): Temporal.Instant
    static from(item: Temporal.Instant | string): Temporal.Instant
    static compare(one: Temporal.Instant | string, two: Temporal.Instant | string): ComparisonResult
    constructor(epochNanoseconds: bigint)
    readonly epochSeconds: number
    readonly epochMilliseconds: number
    readonly epochMicroseconds: bigint
    readonly epochNanoseconds: bigint
    equals(other: Temporal.Instant | string): boolean
    add(
      durationLike:
        | Omit<Temporal.Duration | DurationLike, 'years' | 'months' | 'weeks' | 'days'>
        | string
    ): Temporal.Instant
    subtract(
      durationLike:
        | Omit<Temporal.Duration | DurationLike, 'years' | 'months' | 'weeks' | 'days'>
        | string
    ): Temporal.Instant
    until(
      other: Temporal.Instant | string,
      options?: DifferenceOptions<
        'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'
      >
    ): Temporal.Duration
    since(
      other: Temporal.Instant | string,
      options?: DifferenceOptions<
        'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'
      >
    ): Temporal.Duration
    round(
      roundTo: RoundTo<'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>
    ): Temporal.Instant
    toZonedDateTime(calendarAndTimeZone: {
      timeZone: TimeZoneLike
      calendar: CalendarLike
    }): Temporal.ZonedDateTime
    toZonedDateTimeISO(tzLike: TimeZoneLike): Temporal.ZonedDateTime
    toLocaleString(locales?: string | string[], options?: Intl.DateTimeFormatOptions): string
    toJSON(): string
    toString(options?: InstantToStringOptions): string
    valueOf(): never
    readonly [Symbol.toStringTag]: 'Temporal.Instant'
  }

  /**
   * @category Temporal
   * @experimental
   */
  export type YearOrEraAndEraYear =
    | { era: string; eraYear: number }
    | {
        year: number
      }
  /**
   * @category Temporal
   * @experimental
   */
  export type MonthCodeOrMonthAndYear =
    | (YearOrEraAndEraYear & { month: number })
    | {
        monthCode: string
      }
  /**
   * @category Temporal
   * @experimental
   */
  export type MonthOrMonthCode = { month: number } | { monthCode: string }

  /**
   * @category Temporal
   * @experimental
   */
  export interface CalendarProtocol {
    id: string
    year(
      date:
        | Temporal.PlainDate
        | Temporal.PlainDateTime
        | Temporal.PlainYearMonth
        | PlainDateLike
        | string
    ): number
    month(
      date:
        | Temporal.PlainDate
        | Temporal.PlainDateTime
        | Temporal.PlainYearMonth
        | Temporal.PlainMonthDay
        | PlainDateLike
        | string
    ): number
    monthCode(
      date:
        | Temporal.PlainDate
        | Temporal.PlainDateTime
        | Temporal.PlainYearMonth
        | Temporal.PlainMonthDay
        | PlainDateLike
        | string
    ): string
    day(
      date:
        | Temporal.PlainDate
        | Temporal.PlainDateTime
        | Temporal.PlainMonthDay
        | PlainDateLike
        | string
    ): number
    era(
      date: Temporal.PlainDate | Temporal.PlainDateTime | PlainDateLike | string
    ): string | undefined
    eraYear(
      date: Temporal.PlainDate | Temporal.PlainDateTime | PlainDateLike | string
    ): number | undefined
    dayOfWeek(date: Temporal.PlainDate | Temporal.PlainDateTime | PlainDateLike | string): number
    dayOfYear(date: Temporal.PlainDate | Temporal.PlainDateTime | PlainDateLike | string): number
    weekOfYear(date: Temporal.PlainDate | Temporal.PlainDateTime | PlainDateLike | string): number
    yearOfWeek(date: Temporal.PlainDate | Temporal.PlainDateTime | PlainDateLike | string): number
    daysInWeek(date: Temporal.PlainDate | Temporal.PlainDateTime | PlainDateLike | string): number
    daysInMonth(
      date:
        | Temporal.PlainDate
        | Temporal.PlainDateTime
        | Temporal.PlainYearMonth
        | PlainDateLike
        | string
    ): number
    daysInYear(
      date:
        | Temporal.PlainDate
        | Temporal.PlainDateTime
        | Temporal.PlainYearMonth
        | PlainDateLike
        | string
    ): number
    monthsInYear(
      date:
        | Temporal.PlainDate
        | Temporal.PlainDateTime
        | Temporal.PlainYearMonth
        | PlainDateLike
        | string
    ): number
    inLeapYear(
      date:
        | Temporal.PlainDate
        | Temporal.PlainDateTime
        | Temporal.PlainYearMonth
        | PlainDateLike
        | string
    ): boolean
    dateFromFields(
      fields: YearOrEraAndEraYear & MonthOrMonthCode & { day: number },
      options?: AssignmentOptions
    ): Temporal.PlainDate
    yearMonthFromFields(
      fields: YearOrEraAndEraYear & MonthOrMonthCode,
      options?: AssignmentOptions
    ): Temporal.PlainYearMonth
    monthDayFromFields(
      fields: MonthCodeOrMonthAndYear & { day: number },
      options?: AssignmentOptions
    ): Temporal.PlainMonthDay
    dateAdd(
      date: Temporal.PlainDate | PlainDateLike | string,
      duration: Temporal.Duration | DurationLike | string,
      options?: ArithmeticOptions
    ): Temporal.PlainDate
    dateUntil(
      one: Temporal.PlainDate | PlainDateLike | string,
      two: Temporal.PlainDate | PlainDateLike | string,
      options?: DifferenceOptions<'year' | 'month' | 'week' | 'day'>
    ): Temporal.Duration
    fields(fields: Iterable<string>): Iterable<string>
    mergeFields(
      fields: Record<string, unknown>,
      additionalFields: Record<string, unknown>
    ): Record<string, unknown>
    toString?(): string
    toJSON?(): string
  }

  /**
   * Any of these types can be passed to Temporal methods instead of a Temporal.Calendar.
   *
   * @category Temporal
   * @experimental
   */
  export type CalendarLike =
    | string
    | CalendarProtocol
    | ZonedDateTime
    | PlainDateTime
    | PlainDate
    | PlainYearMonth
    | PlainMonthDay

  /**
   * A `Temporal.Calendar` is a representation of a calendar system. It includes
   * information about how many days are in each year, how many months are in
   * each year, how many days are in each month, and how to do arithmetic in
   * that calendar system.
   *
   * See https://tc39.es/proposal-temporal/docs/calendar.html for more details.
   *
   * @category Temporal
   * @experimental
   */
  export class Calendar implements CalendarProtocol {
    static from(item: CalendarLike): Temporal.Calendar | CalendarProtocol
    constructor(calendarIdentifier: string)
    readonly id: string
    year(
      date:
        | Temporal.PlainDate
        | Temporal.PlainDateTime
        | Temporal.PlainYearMonth
        | PlainDateLike
        | string
    ): number
    month(
      date:
        | Temporal.PlainDate
        | Temporal.PlainDateTime
        | Temporal.PlainYearMonth
        | Temporal.PlainMonthDay
        | PlainDateLike
        | string
    ): number
    monthCode(
      date:
        | Temporal.PlainDate
        | Temporal.PlainDateTime
        | Temporal.PlainYearMonth
        | Temporal.PlainMonthDay
        | PlainDateLike
        | string
    ): string
    day(
      date:
        | Temporal.PlainDate
        | Temporal.PlainDateTime
        | Temporal.PlainMonthDay
        | PlainDateLike
        | string
    ): number
    era(
      date: Temporal.PlainDate | Temporal.PlainDateTime | PlainDateLike | string
    ): string | undefined
    eraYear(
      date: Temporal.PlainDate | Temporal.PlainDateTime | PlainDateLike | string
    ): number | undefined
    dayOfWeek(date: Temporal.PlainDate | Temporal.PlainDateTime | PlainDateLike | string): number
    dayOfYear(date: Temporal.PlainDate | Temporal.PlainDateTime | PlainDateLike | string): number
    weekOfYear(date: Temporal.PlainDate | Temporal.PlainDateTime | PlainDateLike | string): number
    yearOfWeek(date: Temporal.PlainDate | Temporal.PlainDateTime | PlainDateLike | string): number
    daysInWeek(date: Temporal.PlainDate | Temporal.PlainDateTime | PlainDateLike | string): number
    daysInMonth(
      date:
        | Temporal.PlainDate
        | Temporal.PlainDateTime
        | Temporal.PlainYearMonth
        | PlainDateLike
        | string
    ): number
    daysInYear(
      date:
        | Temporal.PlainDate
        | Temporal.PlainDateTime
        | Temporal.PlainYearMonth
        | PlainDateLike
        | string
    ): number
    monthsInYear(
      date:
        | Temporal.PlainDate
        | Temporal.PlainDateTime
        | Temporal.PlainYearMonth
        | PlainDateLike
        | string
    ): number
    inLeapYear(
      date:
        | Temporal.PlainDate
        | Temporal.PlainDateTime
        | Temporal.PlainYearMonth
        | PlainDateLike
        | string
    ): boolean
    dateFromFields(
      fields: YearOrEraAndEraYear & MonthOrMonthCode & { day: number },
      options?: AssignmentOptions
    ): Temporal.PlainDate
    yearMonthFromFields(
      fields: YearOrEraAndEraYear & MonthOrMonthCode,
      options?: AssignmentOptions
    ): Temporal.PlainYearMonth
    monthDayFromFields(
      fields: MonthCodeOrMonthAndYear & { day: number },
      options?: AssignmentOptions
    ): Temporal.PlainMonthDay
    dateAdd(
      date: Temporal.PlainDate | PlainDateLike | string,
      duration: Temporal.Duration | DurationLike | string,
      options?: ArithmeticOptions
    ): Temporal.PlainDate
    dateUntil(
      one: Temporal.PlainDate | PlainDateLike | string,
      two: Temporal.PlainDate | PlainDateLike | string,
      options?: DifferenceOptions<'year' | 'month' | 'week' | 'day'>
    ): Temporal.Duration
    fields(fields: Iterable<string>): string[]
    mergeFields(
      fields: Record<string, unknown>,
      additionalFields: Record<string, unknown>
    ): Record<string, unknown>
    toString(): string
    toJSON(): string
    readonly [Symbol.toStringTag]: 'Temporal.Calendar'
  }

  /**
   * @category Temporal
   * @experimental
   */
  export type PlainDateLike = {
    era?: string | undefined
    eraYear?: number | undefined
    year?: number
    month?: number
    monthCode?: string
    day?: number
    calendar?: CalendarLike
  }

  /**
   * @category Temporal
   * @experimental
   */
  export type PlainDateISOFields = {
    isoYear: number
    isoMonth: number
    isoDay: number
    calendar: string | CalendarProtocol
  }

  /**
   * A `Temporal.PlainDate` represents a calendar date. "Calendar date" refers to the
   * concept of a date as expressed in everyday usage, independent of any time
   * zone. For example, it could be used to represent an event on a calendar
   * which happens during the whole day no matter which time zone it's happening
   * in.
   *
   * See https://tc39.es/proposal-temporal/docs/date.html for more details.
   *
   * @category Temporal
   * @experimental
   */
  export class PlainDate {
    static from(
      item: Temporal.PlainDate | PlainDateLike | string,
      options?: AssignmentOptions
    ): Temporal.PlainDate
    static compare(
      one: Temporal.PlainDate | PlainDateLike | string,
      two: Temporal.PlainDate | PlainDateLike | string
    ): ComparisonResult
    constructor(isoYear: number, isoMonth: number, isoDay: number, calendar?: CalendarLike)
    readonly era: string | undefined
    readonly eraYear: number | undefined
    readonly year: number
    readonly month: number
    readonly monthCode: string
    readonly day: number
    readonly calendarId: string
    getCalendar(): CalendarProtocol
    readonly dayOfWeek: number
    readonly dayOfYear: number
    readonly weekOfYear: number
    readonly yearOfWeek: number
    readonly daysInWeek: number
    readonly daysInYear: number
    readonly daysInMonth: number
    readonly monthsInYear: number
    readonly inLeapYear: boolean
    equals(other: Temporal.PlainDate | PlainDateLike | string): boolean
    with(dateLike: PlainDateLike, options?: AssignmentOptions): Temporal.PlainDate
    withCalendar(calendar: CalendarLike): Temporal.PlainDate
    add(
      durationLike: Temporal.Duration | DurationLike | string,
      options?: ArithmeticOptions
    ): Temporal.PlainDate
    subtract(
      durationLike: Temporal.Duration | DurationLike | string,
      options?: ArithmeticOptions
    ): Temporal.PlainDate
    until(
      other: Temporal.PlainDate | PlainDateLike | string,
      options?: DifferenceOptions<'year' | 'month' | 'week' | 'day'>
    ): Temporal.Duration
    since(
      other: Temporal.PlainDate | PlainDateLike | string,
      options?: DifferenceOptions<'year' | 'month' | 'week' | 'day'>
    ): Temporal.Duration
    toPlainDateTime(
      temporalTime?: Temporal.PlainTime | PlainTimeLike | string
    ): Temporal.PlainDateTime
    toZonedDateTime(
      timeZoneAndTime:
        | TimeZoneProtocol
        | string
        | {
            timeZone: TimeZoneLike
            plainTime?: Temporal.PlainTime | PlainTimeLike | string
          }
    ): Temporal.ZonedDateTime
    toPlainYearMonth(): Temporal.PlainYearMonth
    toPlainMonthDay(): Temporal.PlainMonthDay
    getISOFields(): PlainDateISOFields
    toLocaleString(locales?: string | string[], options?: Intl.DateTimeFormatOptions): string
    toJSON(): string
    toString(options?: ShowCalendarOption): string
    valueOf(): never
    readonly [Symbol.toStringTag]: 'Temporal.PlainDate'
  }

  /**
   * @category Temporal
   * @experimental
   */
  export type PlainDateTimeLike = {
    era?: string | undefined
    eraYear?: number | undefined
    year?: number
    month?: number
    monthCode?: string
    day?: number
    hour?: number
    minute?: number
    second?: number
    millisecond?: number
    microsecond?: number
    nanosecond?: number
    calendar?: CalendarLike
  }

  /**
   * @category Temporal
   * @experimental
   */
  export type PlainDateTimeISOFields = {
    isoYear: number
    isoMonth: number
    isoDay: number
    isoHour: number
    isoMinute: number
    isoSecond: number
    isoMillisecond: number
    isoMicrosecond: number
    isoNanosecond: number
    calendar: string | CalendarProtocol
  }

  /**
   * A `Temporal.PlainDateTime` represents a calendar date and wall-clock time, with
   * a precision in nanoseconds, and without any time zone. Of the Temporal
   * classes carrying human-readable time information, it is the most general
   * and complete one. `Temporal.PlainDate`, `Temporal.PlainTime`, `Temporal.PlainYearMonth`,
   * and `Temporal.PlainMonthDay` all carry less information and should be used when
   * complete information is not required.
   *
   * See https://tc39.es/proposal-temporal/docs/datetime.html for more details.
   *
   * @category Temporal
   * @experimental
   */
  export class PlainDateTime {
    static from(
      item: Temporal.PlainDateTime | PlainDateTimeLike | string,
      options?: AssignmentOptions
    ): Temporal.PlainDateTime
    static compare(
      one: Temporal.PlainDateTime | PlainDateTimeLike | string,
      two: Temporal.PlainDateTime | PlainDateTimeLike | string
    ): ComparisonResult
    constructor(
      isoYear: number,
      isoMonth: number,
      isoDay: number,
      hour?: number,
      minute?: number,
      second?: number,
      millisecond?: number,
      microsecond?: number,
      nanosecond?: number,
      calendar?: CalendarLike
    )
    readonly era: string | undefined
    readonly eraYear: number | undefined
    readonly year: number
    readonly month: number
    readonly monthCode: string
    readonly day: number
    readonly hour: number
    readonly minute: number
    readonly second: number
    readonly millisecond: number
    readonly microsecond: number
    readonly nanosecond: number
    readonly calendarId: string
    getCalendar(): CalendarProtocol
    readonly dayOfWeek: number
    readonly dayOfYear: number
    readonly weekOfYear: number
    readonly yearOfWeek: number
    readonly daysInWeek: number
    readonly daysInYear: number
    readonly daysInMonth: number
    readonly monthsInYear: number
    readonly inLeapYear: boolean
    equals(other: Temporal.PlainDateTime | PlainDateTimeLike | string): boolean
    with(dateTimeLike: PlainDateTimeLike, options?: AssignmentOptions): Temporal.PlainDateTime
    withPlainTime(timeLike?: Temporal.PlainTime | PlainTimeLike | string): Temporal.PlainDateTime
    withPlainDate(dateLike: Temporal.PlainDate | PlainDateLike | string): Temporal.PlainDateTime
    withCalendar(calendar: CalendarLike): Temporal.PlainDateTime
    add(
      durationLike: Temporal.Duration | DurationLike | string,
      options?: ArithmeticOptions
    ): Temporal.PlainDateTime
    subtract(
      durationLike: Temporal.Duration | DurationLike | string,
      options?: ArithmeticOptions
    ): Temporal.PlainDateTime
    until(
      other: Temporal.PlainDateTime | PlainDateTimeLike | string,
      options?: DifferenceOptions<
        | 'year'
        | 'month'
        | 'week'
        | 'day'
        | 'hour'
        | 'minute'
        | 'second'
        | 'millisecond'
        | 'microsecond'
        | 'nanosecond'
      >
    ): Temporal.Duration
    since(
      other: Temporal.PlainDateTime | PlainDateTimeLike | string,
      options?: DifferenceOptions<
        | 'year'
        | 'month'
        | 'week'
        | 'day'
        | 'hour'
        | 'minute'
        | 'second'
        | 'millisecond'
        | 'microsecond'
        | 'nanosecond'
      >
    ): Temporal.Duration
    round(
      roundTo: RoundTo<
        'day' | 'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'
      >
    ): Temporal.PlainDateTime
    toZonedDateTime(tzLike: TimeZoneLike, options?: ToInstantOptions): Temporal.ZonedDateTime
    toPlainDate(): Temporal.PlainDate
    toPlainYearMonth(): Temporal.PlainYearMonth
    toPlainMonthDay(): Temporal.PlainMonthDay
    toPlainTime(): Temporal.PlainTime
    getISOFields(): PlainDateTimeISOFields
    toLocaleString(locales?: string | string[], options?: Intl.DateTimeFormatOptions): string
    toJSON(): string
    toString(options?: CalendarTypeToStringOptions): string
    valueOf(): never
    readonly [Symbol.toStringTag]: 'Temporal.PlainDateTime'
  }

  /**
   * @category Temporal
   * @experimental
   */
  export type PlainMonthDayLike = {
    era?: string | undefined
    eraYear?: number | undefined
    year?: number
    month?: number
    monthCode?: string
    day?: number
    calendar?: CalendarLike
  }

  /**
   * A `Temporal.PlainMonthDay` represents a particular day on the calendar, but
   * without a year. For example, it could be used to represent a yearly
   * recurring event, like "Bastille Day is on the 14th of July."
   *
   * See https://tc39.es/proposal-temporal/docs/monthday.html for more details.
   *
   * @category Temporal
   * @experimental
   */
  export class PlainMonthDay {
    static from(
      item: Temporal.PlainMonthDay | PlainMonthDayLike | string,
      options?: AssignmentOptions
    ): Temporal.PlainMonthDay
    constructor(
      isoMonth: number,
      isoDay: number,
      calendar?: CalendarLike,
      referenceISOYear?: number
    )
    readonly monthCode: string
    readonly day: number
    readonly calendarId: string
    getCalendar(): CalendarProtocol
    equals(other: Temporal.PlainMonthDay | PlainMonthDayLike | string): boolean
    with(monthDayLike: PlainMonthDayLike, options?: AssignmentOptions): Temporal.PlainMonthDay
    toPlainDate(year: { year: number }): Temporal.PlainDate
    getISOFields(): PlainDateISOFields
    toLocaleString(locales?: string | string[], options?: Intl.DateTimeFormatOptions): string
    toJSON(): string
    toString(options?: ShowCalendarOption): string
    valueOf(): never
    readonly [Symbol.toStringTag]: 'Temporal.PlainMonthDay'
  }

  /**
   * @category Temporal
   * @experimental
   */
  export type PlainTimeLike = {
    hour?: number
    minute?: number
    second?: number
    millisecond?: number
    microsecond?: number
    nanosecond?: number
  }

  /**
   * @category Temporal
   * @experimental
   */
  export type PlainTimeISOFields = {
    isoHour: number
    isoMinute: number
    isoSecond: number
    isoMillisecond: number
    isoMicrosecond: number
    isoNanosecond: number
  }

  /**
   * A `Temporal.PlainTime` represents a wall-clock time, with a precision in
   * nanoseconds, and without any time zone. "Wall-clock time" refers to the
   * concept of a time as expressed in everyday usage — the time that you read
   * off the clock on the wall. For example, it could be used to represent an
   * event that happens daily at a certain time, no matter what time zone.
   *
   * `Temporal.PlainTime` refers to a time with no associated calendar date; if you
   * need to refer to a specific time on a specific day, use
   * `Temporal.PlainDateTime`. A `Temporal.PlainTime` can be converted into a
   * `Temporal.PlainDateTime` by combining it with a `Temporal.PlainDate` using the
   * `toPlainDateTime()` method.
   *
   * See https://tc39.es/proposal-temporal/docs/time.html for more details.
   *
   * @category Temporal
   * @experimental
   */
  export class PlainTime {
    static from(
      item: Temporal.PlainTime | PlainTimeLike | string,
      options?: AssignmentOptions
    ): Temporal.PlainTime
    static compare(
      one: Temporal.PlainTime | PlainTimeLike | string,
      two: Temporal.PlainTime | PlainTimeLike | string
    ): ComparisonResult
    constructor(
      hour?: number,
      minute?: number,
      second?: number,
      millisecond?: number,
      microsecond?: number,
      nanosecond?: number
    )
    readonly hour: number
    readonly minute: number
    readonly second: number
    readonly millisecond: number
    readonly microsecond: number
    readonly nanosecond: number
    equals(other: Temporal.PlainTime | PlainTimeLike | string): boolean
    with(
      timeLike: Temporal.PlainTime | PlainTimeLike,
      options?: AssignmentOptions
    ): Temporal.PlainTime
    add(
      durationLike: Temporal.Duration | DurationLike | string,
      options?: ArithmeticOptions
    ): Temporal.PlainTime
    subtract(
      durationLike: Temporal.Duration | DurationLike | string,
      options?: ArithmeticOptions
    ): Temporal.PlainTime
    until(
      other: Temporal.PlainTime | PlainTimeLike | string,
      options?: DifferenceOptions<
        'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'
      >
    ): Temporal.Duration
    since(
      other: Temporal.PlainTime | PlainTimeLike | string,
      options?: DifferenceOptions<
        'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'
      >
    ): Temporal.Duration
    round(
      roundTo: RoundTo<'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>
    ): Temporal.PlainTime
    toPlainDateTime(
      temporalDate: Temporal.PlainDate | PlainDateLike | string
    ): Temporal.PlainDateTime
    toZonedDateTime(timeZoneAndDate: {
      timeZone: TimeZoneLike
      plainDate: Temporal.PlainDate | PlainDateLike | string
    }): Temporal.ZonedDateTime
    getISOFields(): PlainTimeISOFields
    toLocaleString(locales?: string | string[], options?: Intl.DateTimeFormatOptions): string
    toJSON(): string
    toString(options?: ToStringPrecisionOptions): string
    valueOf(): never
    readonly [Symbol.toStringTag]: 'Temporal.PlainTime'
  }

  /**
   * A plain object implementing the protocol for a custom time zone.
   *
   * @category Temporal
   * @experimental
   */
  export interface TimeZoneProtocol {
    id: string
    getOffsetNanosecondsFor(instant: Temporal.Instant | string): number
    getOffsetStringFor?(instant: Temporal.Instant | string): string
    getPlainDateTimeFor?(
      instant: Temporal.Instant | string,
      calendar?: CalendarLike
    ): Temporal.PlainDateTime
    getInstantFor?(
      dateTime: Temporal.PlainDateTime | PlainDateTimeLike | string,
      options?: ToInstantOptions
    ): Temporal.Instant
    getNextTransition?(startingPoint: Temporal.Instant | string): Temporal.Instant | null
    getPreviousTransition?(startingPoint: Temporal.Instant | string): Temporal.Instant | null
    getPossibleInstantsFor(
      dateTime: Temporal.PlainDateTime | PlainDateTimeLike | string
    ): Temporal.Instant[]
    toString?(): string
    toJSON?(): string
  }

  /**
   * Any of these types can be passed to Temporal methods instead of a Temporal.TimeZone.
   *
   * @category Temporal
   * @experimental
   */
  export type TimeZoneLike = string | TimeZoneProtocol | ZonedDateTime

  /**
   * A `Temporal.TimeZone` is a representation of a time zone: either an
   * {@link https://www.iana.org/time-zones|IANA time zone}, including
   * information about the time zone such as the offset between the local time
   * and UTC at a particular time, and daylight saving time (DST) changes; or
   * simply a particular UTC offset with no DST.
   *
   * `Temporal.ZonedDateTime` is the only Temporal type to contain a time zone.
   * Other types, like `Temporal.Instant` and `Temporal.PlainDateTime`, do not
   * contain any time zone information, and a `Temporal.TimeZone` object is
   * required to convert between them.
   *
   * See https://tc39.es/proposal-temporal/docs/timezone.html for more details.
   *
   * @category Temporal
   * @experimental
   */
  export class TimeZone implements TimeZoneProtocol {
    static from(timeZone: TimeZoneLike): Temporal.TimeZone | TimeZoneProtocol
    constructor(timeZoneIdentifier: string)
    readonly id: string
    equals(timeZone: TimeZoneLike): boolean
    getOffsetNanosecondsFor(instant: Temporal.Instant | string): number
    getOffsetStringFor(instant: Temporal.Instant | string): string
    getPlainDateTimeFor(
      instant: Temporal.Instant | string,
      calendar?: CalendarLike
    ): Temporal.PlainDateTime
    getInstantFor(
      dateTime: Temporal.PlainDateTime | PlainDateTimeLike | string,
      options?: ToInstantOptions
    ): Temporal.Instant
    getNextTransition(startingPoint: Temporal.Instant | string): Temporal.Instant | null
    getPreviousTransition(startingPoint: Temporal.Instant | string): Temporal.Instant | null
    getPossibleInstantsFor(
      dateTime: Temporal.PlainDateTime | PlainDateTimeLike | string
    ): Temporal.Instant[]
    toString(): string
    toJSON(): string
    readonly [Symbol.toStringTag]: 'Temporal.TimeZone'
  }

  /**
   * @category Temporal
   * @experimental
   */
  export type PlainYearMonthLike = {
    era?: string | undefined
    eraYear?: number | undefined
    year?: number
    month?: number
    monthCode?: string
    calendar?: CalendarLike
  }

  /**
   * A `Temporal.PlainYearMonth` represents a particular month on the calendar. For
   * example, it could be used to represent a particular instance of a monthly
   * recurring event, like "the June 2019 meeting".
   *
   * See https://tc39.es/proposal-temporal/docs/yearmonth.html for more details.
   *
   * @category Temporal
   * @experimental
   */
  export class PlainYearMonth {
    static from(
      item: Temporal.PlainYearMonth | PlainYearMonthLike | string,
      options?: AssignmentOptions
    ): Temporal.PlainYearMonth
    static compare(
      one: Temporal.PlainYearMonth | PlainYearMonthLike | string,
      two: Temporal.PlainYearMonth | PlainYearMonthLike | string
    ): ComparisonResult
    constructor(
      isoYear: number,
      isoMonth: number,
      calendar?: CalendarLike,
      referenceISODay?: number
    )
    readonly era: string | undefined
    readonly eraYear: number | undefined
    readonly year: number
    readonly month: number
    readonly monthCode: string
    readonly calendarId: string
    getCalendar(): CalendarProtocol
    readonly daysInMonth: number
    readonly daysInYear: number
    readonly monthsInYear: number
    readonly inLeapYear: boolean
    equals(other: Temporal.PlainYearMonth | PlainYearMonthLike | string): boolean
    with(yearMonthLike: PlainYearMonthLike, options?: AssignmentOptions): Temporal.PlainYearMonth
    add(
      durationLike: Temporal.Duration | DurationLike | string,
      options?: ArithmeticOptions
    ): Temporal.PlainYearMonth
    subtract(
      durationLike: Temporal.Duration | DurationLike | string,
      options?: ArithmeticOptions
    ): Temporal.PlainYearMonth
    until(
      other: Temporal.PlainYearMonth | PlainYearMonthLike | string,
      options?: DifferenceOptions<'year' | 'month'>
    ): Temporal.Duration
    since(
      other: Temporal.PlainYearMonth | PlainYearMonthLike | string,
      options?: DifferenceOptions<'year' | 'month'>
    ): Temporal.Duration
    toPlainDate(day: { day: number }): Temporal.PlainDate
    getISOFields(): PlainDateISOFields
    toLocaleString(locales?: string | string[], options?: Intl.DateTimeFormatOptions): string
    toJSON(): string
    toString(options?: ShowCalendarOption): string
    valueOf(): never
    readonly [Symbol.toStringTag]: 'Temporal.PlainYearMonth'
  }

  /**
   * @category Temporal
   * @experimental
   */
  export type ZonedDateTimeLike = {
    era?: string | undefined
    eraYear?: number | undefined
    year?: number
    month?: number
    monthCode?: string
    day?: number
    hour?: number
    minute?: number
    second?: number
    millisecond?: number
    microsecond?: number
    nanosecond?: number
    offset?: string
    timeZone?: TimeZoneLike
    calendar?: CalendarLike
  }

  /**
   * @category Temporal
   * @experimental
   */
  export type ZonedDateTimeISOFields = {
    isoYear: number
    isoMonth: number
    isoDay: number
    isoHour: number
    isoMinute: number
    isoSecond: number
    isoMillisecond: number
    isoMicrosecond: number
    isoNanosecond: number
    offset: string
    timeZone: string | TimeZoneProtocol
    calendar: string | CalendarProtocol
  }

  /**
   * @category Temporal
   * @experimental
   */
  export class ZonedDateTime {
    static from(
      item: Temporal.ZonedDateTime | ZonedDateTimeLike | string,
      options?: ZonedDateTimeAssignmentOptions
    ): ZonedDateTime
    static compare(
      one: Temporal.ZonedDateTime | ZonedDateTimeLike | string,
      two: Temporal.ZonedDateTime | ZonedDateTimeLike | string
    ): ComparisonResult
    constructor(epochNanoseconds: bigint, timeZone: TimeZoneLike, calendar?: CalendarLike)
    readonly era: string | undefined
    readonly eraYear: number | undefined
    readonly year: number
    readonly month: number
    readonly monthCode: string
    readonly day: number
    readonly hour: number
    readonly minute: number
    readonly second: number
    readonly millisecond: number
    readonly microsecond: number
    readonly nanosecond: number
    readonly timeZoneId: string
    getTimeZone(): TimeZoneProtocol
    readonly calendarId: string
    getCalendar(): CalendarProtocol
    readonly dayOfWeek: number
    readonly dayOfYear: number
    readonly weekOfYear: number
    readonly yearOfWeek: number
    readonly hoursInDay: number
    readonly daysInWeek: number
    readonly daysInMonth: number
    readonly daysInYear: number
    readonly monthsInYear: number
    readonly inLeapYear: boolean
    readonly offsetNanoseconds: number
    readonly offset: string
    readonly epochSeconds: number
    readonly epochMilliseconds: number
    readonly epochMicroseconds: bigint
    readonly epochNanoseconds: bigint
    equals(other: Temporal.ZonedDateTime | ZonedDateTimeLike | string): boolean
    with(
      zonedDateTimeLike: ZonedDateTimeLike,
      options?: ZonedDateTimeAssignmentOptions
    ): Temporal.ZonedDateTime
    withPlainTime(timeLike?: Temporal.PlainTime | PlainTimeLike | string): Temporal.ZonedDateTime
    withPlainDate(dateLike: Temporal.PlainDate | PlainDateLike | string): Temporal.ZonedDateTime
    withCalendar(calendar: CalendarLike): Temporal.ZonedDateTime
    withTimeZone(timeZone: TimeZoneLike): Temporal.ZonedDateTime
    add(
      durationLike: Temporal.Duration | DurationLike | string,
      options?: ArithmeticOptions
    ): Temporal.ZonedDateTime
    subtract(
      durationLike: Temporal.Duration | DurationLike | string,
      options?: ArithmeticOptions
    ): Temporal.ZonedDateTime
    until(
      other: Temporal.ZonedDateTime | ZonedDateTimeLike | string,
      options?: Temporal.DifferenceOptions<
        | 'year'
        | 'month'
        | 'week'
        | 'day'
        | 'hour'
        | 'minute'
        | 'second'
        | 'millisecond'
        | 'microsecond'
        | 'nanosecond'
      >
    ): Temporal.Duration
    since(
      other: Temporal.ZonedDateTime | ZonedDateTimeLike | string,
      options?: Temporal.DifferenceOptions<
        | 'year'
        | 'month'
        | 'week'
        | 'day'
        | 'hour'
        | 'minute'
        | 'second'
        | 'millisecond'
        | 'microsecond'
        | 'nanosecond'
      >
    ): Temporal.Duration
    round(
      roundTo: RoundTo<
        'day' | 'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'
      >
    ): Temporal.ZonedDateTime
    startOfDay(): Temporal.ZonedDateTime
    toInstant(): Temporal.Instant
    toPlainDateTime(): Temporal.PlainDateTime
    toPlainDate(): Temporal.PlainDate
    toPlainYearMonth(): Temporal.PlainYearMonth
    toPlainMonthDay(): Temporal.PlainMonthDay
    toPlainTime(): Temporal.PlainTime
    getISOFields(): ZonedDateTimeISOFields
    toLocaleString(locales?: string | string[], options?: Intl.DateTimeFormatOptions): string
    toJSON(): string
    toString(options?: ZonedDateTimeToStringOptions): string
    valueOf(): never
    readonly [Symbol.toStringTag]: 'Temporal.ZonedDateTime'
  }

  /**
   * The `Temporal.Now` object has several methods which give information about
   * the current date, time, and time zone.
   *
   * See https://tc39.es/proposal-temporal/docs/now.html for more details.
   *
   * @category Temporal
   * @experimental
   */
  export const Now: {
    /**
     * Get the exact system date and time as a `Temporal.Instant`.
     *
     * This method gets the current exact system time, without regard to
     * calendar or time zone. This is a good way to get a timestamp for an
     * event, for example. It works like the old-style JavaScript `Date.now()`,
     * but with nanosecond precision instead of milliseconds.
     *
     * Note that a `Temporal.Instant` doesn't know about time zones. For the
     * exact time in a specific time zone, use `Temporal.Now.zonedDateTimeISO`
     * or `Temporal.Now.zonedDateTime`.
     */
    instant: () => Temporal.Instant

    /**
     * Get the current calendar date and clock time in a specific calendar and
     * time zone.
     *
     * The `calendar` parameter is required. When using the ISO 8601 calendar or
     * if you don't understand the need for or implications of a calendar, then
     * a more ergonomic alternative to this method is
     * `Temporal.Now.zonedDateTimeISO()`.
     *
     * @param {CalendarLike} [calendar] - calendar identifier, or
     * a `Temporal.Calendar` instance, or an object implementing the calendar
     * protocol.
     * @param {TimeZoneLike} [tzLike] -
     * {@link https://en.wikipedia.org/wiki/List_of_tz_database_time_zones|IANA time zone identifier}
     * string (e.g. `'Europe/London'`), `Temporal.TimeZone` instance, or an
     * object implementing the time zone protocol. If omitted, the environment's
     * current time zone will be used.
     */
    zonedDateTime: (calendar: CalendarLike, tzLike?: TimeZoneLike) => Temporal.ZonedDateTime

    /**
     * Get the current calendar date and clock time in a specific time zone,
     * using the ISO 8601 calendar.
     *
     * @param {TimeZoneLike} [tzLike] -
     * {@link https://en.wikipedia.org/wiki/List_of_tz_database_time_zones|IANA time zone identifier}
     * string (e.g. `'Europe/London'`), `Temporal.TimeZone` instance, or an
     * object implementing the time zone protocol. If omitted, the environment's
     * current time zone will be used.
     */
    zonedDateTimeISO: (tzLike?: TimeZoneLike) => Temporal.ZonedDateTime

    /**
     * Get the current calendar date and clock time in a specific calendar and
     * time zone.
     *
     * The calendar is required. When using the ISO 8601 calendar or if you
     * don't understand the need for or implications of a calendar, then a more
     * ergonomic alternative to this method is `Temporal.Now.plainDateTimeISO`.
     *
     * Note that the `Temporal.PlainDateTime` type does not persist the time zone,
     * but retaining the time zone is required for most time-zone-related use
     * cases. Therefore, it's usually recommended to use
     * `Temporal.Now.zonedDateTimeISO` or `Temporal.Now.zonedDateTime` instead
     * of this function.
     *
     * @param {CalendarLike} [calendar] - calendar identifier, or
     * a `Temporal.Calendar` instance, or an object implementing the calendar
     * protocol.
     * @param {TimeZoneLike} [tzLike] -
     * {@link https://en.wikipedia.org/wiki/List_of_tz_database_time_zones|IANA time zone identifier}
     * string (e.g. `'Europe/London'`), `Temporal.TimeZone` instance, or an
     * object implementing the time zone protocol. If omitted,
     * the environment's current time zone will be used.
     */
    plainDateTime: (calendar: CalendarLike, tzLike?: TimeZoneLike) => Temporal.PlainDateTime

    /**
     * Get the current date and clock time in a specific time zone, using the
     * ISO 8601 calendar.
     *
     * Note that the `Temporal.PlainDateTime` type does not persist the time zone,
     * but retaining the time zone is required for most time-zone-related use
     * cases. Therefore, it's usually recommended to use
     * `Temporal.Now.zonedDateTimeISO` instead of this function.
     *
     * @param {TimeZoneLike} [tzLike] -
     * {@link https://en.wikipedia.org/wiki/List_of_tz_database_time_zones|IANA time zone identifier}
     * string (e.g. `'Europe/London'`), `Temporal.TimeZone` instance, or an
     * object implementing the time zone protocol. If omitted, the environment's
     * current time zone will be used.
     */
    plainDateTimeISO: (tzLike?: TimeZoneLike) => Temporal.PlainDateTime

    /**
     * Get the current calendar date in a specific calendar and time zone.
     *
     * The calendar is required. When using the ISO 8601 calendar or if you
     * don't understand the need for or implications of a calendar, then a more
     * ergonomic alternative to this method is `Temporal.Now.plainDateISO`.
     *
     * @param {CalendarLike} [calendar] - calendar identifier, or
     * a `Temporal.Calendar` instance, or an object implementing the calendar
     * protocol.
     * @param {TimeZoneLike} [tzLike] -
     * {@link https://en.wikipedia.org/wiki/List_of_tz_database_time_zones|IANA time zone identifier}
     * string (e.g. `'Europe/London'`), `Temporal.TimeZone` instance, or an
     * object implementing the time zone protocol. If omitted,
     * the environment's current time zone will be used.
     */
    plainDate: (calendar: CalendarLike, tzLike?: TimeZoneLike) => Temporal.PlainDate

    /**
     * Get the current date in a specific time zone, using the ISO 8601
     * calendar.
     *
     * @param {TimeZoneLike} [tzLike] -
     * {@link https://en.wikipedia.org/wiki/List_of_tz_database_time_zones|IANA time zone identifier}
     * string (e.g. `'Europe/London'`), `Temporal.TimeZone` instance, or an
     * object implementing the time zone protocol. If omitted, the environment's
     * current time zone will be used.
     */
    plainDateISO: (tzLike?: TimeZoneLike) => Temporal.PlainDate

    /**
     * Get the current clock time in a specific time zone, using the ISO 8601 calendar.
     *
     * @param {TimeZoneLike} [tzLike] -
     * {@link https://en.wikipedia.org/wiki/List_of_tz_database_time_zones|IANA time zone identifier}
     * string (e.g. `'Europe/London'`), `Temporal.TimeZone` instance, or an
     * object implementing the time zone protocol. If omitted, the environment's
     * current time zone will be used.
     */
    plainTimeISO: (tzLike?: TimeZoneLike) => Temporal.PlainTime

    /**
     * Get the identifier of the environment's current time zone.
     *
     * This method gets the identifier of the current system time zone. This
     * will usually be a named
     * {@link https://en.wikipedia.org/wiki/List_of_tz_database_time_zones|IANA time zone}.
     */
    timeZoneId: () => string

    readonly [Symbol.toStringTag]: 'Temporal.Now'
  }
}

/**
 * @category Temporal
 * @experimental
 */
declare interface Date {
  toTemporalInstant(): Temporal.Instant
}

/**
 * @category Intl
 * @experimental
 */
declare namespace Intl {
  /**
   * @category Intl
   * @experimental
   */
  export type Formattable =
    | Date
    | Temporal.Instant
    | Temporal.ZonedDateTime
    | Temporal.PlainDate
    | Temporal.PlainTime
    | Temporal.PlainDateTime
    | Temporal.PlainYearMonth
    | Temporal.PlainMonthDay

  /**
   * @category Intl
   * @experimental
   */
  export interface DateTimeFormatRangePart {
    source: 'shared' | 'startRange' | 'endRange'
  }

  /**
   * @category Intl
   * @experimental
   */
  export interface DateTimeFormat {
    /**
     * Format a date into a string according to the locale and formatting
     * options of this `Intl.DateTimeFormat` object.
     *
     * @param date The date to format.
     */
    format(date?: Formattable | number): string

    /**
     * Allow locale-aware formatting of strings produced by
     * `Intl.DateTimeFormat` formatters.
     *
     * @param date The date to format.
     */
    formatToParts(date?: Formattable | number): globalThis.Intl.DateTimeFormatPart[]

    /**
     * Format a date range in the most concise way based on the locale and
     * options provided when instantiating this `Intl.DateTimeFormat` object.
     *
     * @param startDate The start date of the range to format.
     * @param endDate The start date of the range to format. Must be the same
     * type as `startRange`.
     */
    formatRange<T extends Formattable>(startDate: T, endDate: T): string
    formatRange(startDate: Date | number, endDate: Date | number): string

    /**
     * Allow locale-aware formatting of tokens representing each part of the
     * formatted date range produced by `Intl.DateTimeFormat` formatters.
     *
     * @param startDate The start date of the range to format.
     * @param endDate The start date of the range to format. Must be the same
     * type as `startRange`.
     */
    formatRangeToParts<T extends Formattable>(startDate: T, endDate: T): DateTimeFormatRangePart[]
    formatRangeToParts(startDate: Date | number, endDate: Date | number): DateTimeFormatRangePart[]
  }

  /**
   * @category Intl
   * @experimental
   */
  export interface DateTimeFormatOptions {
    // TODO: remove the props below after TS lib declarations are updated
    dayPeriod?: 'narrow' | 'short' | 'long'
    dateStyle?: 'full' | 'long' | 'medium' | 'short'
    timeStyle?: 'full' | 'long' | 'medium' | 'short'
  }
}

/**
 * A typed array of 16-bit float values. The contents are initialized to 0. If the requested number
 * of bytes could not be allocated an exception is raised.
 *
 * @category Platform
 * @experimental
 */
declare interface Float16Array {
  /**
   * The size in bytes of each element in the array.
   */
  readonly BYTES_PER_ELEMENT: number

  /**
   * The ArrayBuffer instance referenced by the array.
   */
  readonly buffer: ArrayBufferLike

  /**
   * The length in bytes of the array.
   */
  readonly byteLength: number

  /**
   * The offset in bytes of the array.
   */
  readonly byteOffset: number

  /**
   * Returns the this object after copying a section of the array identified by start and end
   * to the same array starting at position target
   * @param target If target is negative, it is treated as length+target where length is the
   * length of the array.
   * @param start If start is negative, it is treated as length+start. If end is negative, it
   * is treated as length+end.
   * @param end If not specified, length of the this object is used as its default value.
   */
  copyWithin(target: number, start: number, end?: number): this

  /**
   * Determines whether all the members of an array satisfy the specified test.
   * @param predicate A function that accepts up to three arguments. The every method calls
   * the predicate function for each element in the array until the predicate returns a value
   * which is coercible to the Boolean value false, or until the end of the array.
   * @param thisArg An object to which the this keyword can refer in the predicate function.
   * If thisArg is omitted, undefined is used as the this value.
   */
  every(
    predicate: (value: number, index: number, array: Float16Array) => unknown,
    thisArg?: any
  ): boolean

  /**
   * Changes all array elements from `start` to `end` index to a static `value` and returns the modified array
   * @param value value to fill array section with
   * @param start index to start filling the array at. If start is negative, it is treated as
   * length+start where length is the length of the array.
   * @param end index to stop filling the array at. If end is negative, it is treated as
   * length+end.
   */
  fill(value: number, start?: number, end?: number): this

  /**
   * Returns the elements of an array that meet the condition specified in a callback function.
   * @param predicate A function that accepts up to three arguments. The filter method calls
   * the predicate function one time for each element in the array.
   * @param thisArg An object to which the this keyword can refer in the predicate function.
   * If thisArg is omitted, undefined is used as the this value.
   */
  filter(
    predicate: (value: number, index: number, array: Float16Array) => any,
    thisArg?: any
  ): Float16Array

  /**
   * Returns the value of the first element in the array where predicate is true, and undefined
   * otherwise.
   * @param predicate find calls predicate once for each element of the array, in ascending
   * order, until it finds one where predicate returns true. If such an element is found, find
   * immediately returns that element value. Otherwise, find returns undefined.
   * @param thisArg If provided, it will be used as the this value for each invocation of
   * predicate. If it is not provided, undefined is used instead.
   */
  find(
    predicate: (value: number, index: number, obj: Float16Array) => boolean,
    thisArg?: any
  ): number | undefined

  /**
   * Returns the index of the first element in the array where predicate is true, and -1
   * otherwise.
   * @param predicate find calls predicate once for each element of the array, in ascending
   * order, until it finds one where predicate returns true. If such an element is found,
   * findIndex immediately returns that element index. Otherwise, findIndex returns -1.
   * @param thisArg If provided, it will be used as the this value for each invocation of
   * predicate. If it is not provided, undefined is used instead.
   */
  findIndex(
    predicate: (value: number, index: number, obj: Float16Array) => boolean,
    thisArg?: any
  ): number

  /**
   * Performs the specified action for each element in an array.
   * @param callbackfn  A function that accepts up to three arguments. forEach calls the
   * callbackfn function one time for each element in the array.
   * @param thisArg  An object to which the this keyword can refer in the callbackfn function.
   * If thisArg is omitted, undefined is used as the this value.
   */
  forEach(
    callbackfn: (value: number, index: number, array: Float16Array) => void,
    thisArg?: any
  ): void

  /**
   * Returns the index of the first occurrence of a value in an array.
   * @param searchElement The value to locate in the array.
   * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the
   *  search starts at index 0.
   */
  indexOf(searchElement: number, fromIndex?: number): number

  /**
   * Adds all the elements of an array separated by the specified separator string.
   * @param separator A string used to separate one element of an array from the next in the
   * resulting String. If omitted, the array elements are separated with a comma.
   */
  join(separator?: string): string

  /**
   * Returns the index of the last occurrence of a value in an array.
   * @param searchElement The value to locate in the array.
   * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the
   * search starts at index 0.
   */
  lastIndexOf(searchElement: number, fromIndex?: number): number

  /**
   * The length of the array.
   */
  readonly length: number

  /**
   * Calls a defined callback function on each element of an array, and returns an array that
   * contains the results.
   * @param callbackfn A function that accepts up to three arguments. The map method calls the
   * callbackfn function one time for each element in the array.
   * @param thisArg An object to which the this keyword can refer in the callbackfn function.
   * If thisArg is omitted, undefined is used as the this value.
   */
  map(
    callbackfn: (value: number, index: number, array: Float16Array) => number,
    thisArg?: any
  ): Float16Array

  /**
   * Calls the specified callback function for all the elements in an array. The return value of
   * the callback function is the accumulated result, and is provided as an argument in the next
   * call to the callback function.
   * @param callbackfn A function that accepts up to four arguments. The reduce method calls the
   * callbackfn function one time for each element in the array.
   * @param initialValue If initialValue is specified, it is used as the initial value to start
   * the accumulation. The first call to the callbackfn function provides this value as an argument
   * instead of an array value.
   */
  reduce(
    callbackfn: (
      previousValue: number,
      currentValue: number,
      currentIndex: number,
      array: Float16Array
    ) => number
  ): number
  reduce(
    callbackfn: (
      previousValue: number,
      currentValue: number,
      currentIndex: number,
      array: Float16Array
    ) => number,
    initialValue: number
  ): number

  /**
   * Calls the specified callback function for all the elements in an array. The return value of
   * the callback function is the accumulated result, and is provided as an argument in the next
   * call to the callback function.
   * @param callbackfn A function that accepts up to four arguments. The reduce method calls the
   * callbackfn function one time for each element in the array.
   * @param initialValue If initialValue is specified, it is used as the initial value to start
   * the accumulation. The first call to the callbackfn function provides this value as an argument
   * instead of an array value.
   */
  reduce<U>(
    callbackfn: (
      previousValue: U,
      currentValue: number,
      currentIndex: number,
      array: Float16Array
    ) => U,
    initialValue: U
  ): U

  /**
   * Calls the specified callback function for all the elements in an array, in descending order.
   * The return value of the callback function is the accumulated result, and is provided as an
   * argument in the next call to the callback function.
   * @param callbackfn A function that accepts up to four arguments. The reduceRight method calls
   * the callbackfn function one time for each element in the array.
   * @param initialValue If initialValue is specified, it is used as the initial value to start
   * the accumulation. The first call to the callbackfn function provides this value as an
   * argument instead of an array value.
   */
  reduceRight(
    callbackfn: (
      previousValue: number,
      currentValue: number,
      currentIndex: number,
      array: Float16Array
    ) => number
  ): number
  reduceRight(
    callbackfn: (
      previousValue: number,
      currentValue: number,
      currentIndex: number,
      array: Float16Array
    ) => number,
    initialValue: number
  ): number

  /**
   * Calls the specified callback function for all the elements in an array, in descending order.
   * The return value of the callback function is the accumulated result, and is provided as an
   * argument in the next call to the callback function.
   * @param callbackfn A function that accepts up to four arguments. The reduceRight method calls
   * the callbackfn function one time for each element in the array.
   * @param initialValue If initialValue is specified, it is used as the initial value to start
   * the accumulation. The first call to the callbackfn function provides this value as an argument
   * instead of an array value.
   */
  reduceRight<U>(
    callbackfn: (
      previousValue: U,
      currentValue: number,
      currentIndex: number,
      array: Float16Array
    ) => U,
    initialValue: U
  ): U

  /**
   * Reverses the elements in an Array.
   */
  reverse(): Float16Array

  /**
   * Sets a value or an array of values.
   * @param array A typed or untyped array of values to set.
   * @param offset The index in the current array at which the values are to be written.
   */
  set(array: ArrayLike<number>, offset?: number): void

  /**
   * Returns a section of an array.
   * @param start The beginning of the specified portion of the array.
   * @param end The end of the specified portion of the array. This is exclusive of the element at the index 'end'.
   */
  slice(start?: number, end?: number): Float16Array

  /**
   * Determines whether the specified callback function returns true for any element of an array.
   * @param predicate A function that accepts up to three arguments. The some method calls
   * the predicate function for each element in the array until the predicate returns a value
   * which is coercible to the Boolean value true, or until the end of the array.
   * @param thisArg An object to which the this keyword can refer in the predicate function.
   * If thisArg is omitted, undefined is used as the this value.
   */
  some(
    predicate: (value: number, index: number, array: Float16Array) => unknown,
    thisArg?: any
  ): boolean

  /**
   * Sorts an array.
   * @param compareFn Function used to determine the order of the elements. It is expected to return
   * a negative value if first argument is less than second argument, zero if they're equal and a positive
   * value otherwise. If omitted, the elements are sorted in ascending order.
   * ```ts
   * [11,2,22,1].sort((a, b) => a - b)
   * ```
   */
  sort(compareFn?: (a: number, b: number) => number): this

  /**
   * Gets a new Float16Array view of the ArrayBuffer store for this array, referencing the elements
   * at begin, inclusive, up to end, exclusive.
   * @param begin The index of the beginning of the array.
   * @param end The index of the end of the array.
   */
  subarray(begin?: number, end?: number): Float16Array

  /**
   * Converts a number to a string by using the current locale.
   */
  toLocaleString(): string

  /**
   * Returns a string representation of an array.
   */
  toString(): string

  /** Returns the primitive value of the specified object. */
  valueOf(): Float16Array

  [index: number]: number
}

/**
 * @category Platform
 * @experimental
 */
declare interface Float16ArrayConstructor {
  readonly prototype: Float16Array
  new (length: number): Float16Array
  new (array: ArrayLike<number> | ArrayBufferLike): Float16Array
  new (buffer: ArrayBufferLike, byteOffset?: number, length?: number): Float16Array

  /**
   * The size in bytes of each element in the array.
   */
  readonly BYTES_PER_ELEMENT: number

  /**
   * Returns a new array from a set of elements.
   * @param items A set of elements to include in the new array object.
   */
  of(...items: number[]): Float16Array

  /**
   * Creates an array from an array-like or iterable object.
   * @param arrayLike An array-like or iterable object to convert to an array.
   */
  from(arrayLike: ArrayLike<number>): Float16Array

  /**
   * Creates an array from an array-like or iterable object.
   * @param arrayLike An array-like or iterable object to convert to an array.
   * @param mapfn A mapping function to call on every element of the array.
   * @param thisArg Value of 'this' used to invoke the mapfn.
   */
  from<T>(arrayLike: ArrayLike<T>, mapfn: (v: T, k: number) => number, thisArg?: any): Float16Array
}
/**
 * @category Platform
 * @experimental
 */
declare var Float16Array: Float16ArrayConstructor

/**
 * @category Platform
 * @experimental
 */
declare interface Float16 {
  [Symbol.iterator](): IterableIterator<number>
  /**
   * Returns an array of key, value pairs for every entry in the array
   */
  entries(): IterableIterator<[number, number]>
  /**
   * Returns an list of keys in the array
   */
  keys(): IterableIterator<number>
  /**
   * Returns an list of values in the array
   */
  values(): IterableIterator<number>
}

/**
 * @category Platform
 * @experimental
 */
declare interface Float16Constructor {
  new (elements: Iterable<number>): Float16

  /**
   * Creates an array from an array-like or iterable object.
   * @param arrayLike An array-like or iterable object to convert to an array.
   * @param mapfn A mapping function to call on every element of the array.
   * @param thisArg Value of 'this' used to invoke the mapfn.
   */
  from(
    arrayLike: Iterable<number>,
    mapfn?: (v: number, k: number) => number,
    thisArg?: any
  ): Float16
}

/**
 * @category Platform
 * @experimental
 */
declare interface Float16Array {
  readonly [Symbol.toStringTag]: 'Float16Array'
}

/**
 * @category Platform
 * @experimental
 */
declare interface Float16Array {
  /**
   * Determines whether an array includes a certain element, returning true or false as appropriate.
   * @param searchElement The element to search for.
   * @param fromIndex The position in this array at which to begin searching for searchElement.
   */
  includes(searchElement: number, fromIndex?: number): boolean
}

/**
 * @category Platform
 * @experimental
 */
declare interface Float16ArrayConstructor {
  new (): Float16Array
}

/**
 * @category Platform
 * @experimental
 */
declare interface Float16Array {
  /**
   * Returns the item located at the specified index.
   * @param index The zero-based index of the desired code unit. A negative index will count back from the last item.
   */
  at(index: number): number | undefined
}

/**
 * @category Platform
 * @experimental
 */
declare interface Float16Array {
  /**
   * Returns the value of the last element in the array where predicate is true, and undefined
   * otherwise.
   * @param predicate findLast calls predicate once for each element of the array, in descending
   * order, until it finds one where predicate returns true. If such an element is found, findLast
   * immediately returns that element value. Otherwise, findLast returns undefined.
   * @param thisArg If provided, it will be used as the this value for each invocation of
   * predicate. If it is not provided, undefined is used instead.
   */
  findLast<S extends number>(
    predicate: (value: number, index: number, array: Float16Array) => value is S,
    thisArg?: any
  ): S | undefined
  findLast(
    predicate: (value: number, index: number, array: Float16Array) => unknown,
    thisArg?: any
  ): number | undefined

  /**
   * Returns the index of the last element in the array where predicate is true, and -1
   * otherwise.
   * @param predicate findLastIndex calls predicate once for each element of the array, in descending
   * order, until it finds one where predicate returns true. If such an element is found,
   * findLastIndex immediately returns that element index. Otherwise, findLastIndex returns -1.
   * @param thisArg If provided, it will be used as the this value for each invocation of
   * predicate. If it is not provided, undefined is used instead.
   */
  findLastIndex(
    predicate: (value: number, index: number, array: Float16Array) => unknown,
    thisArg?: any
  ): number

  /**
   * Copies the array and returns the copy with the elements in reverse order.
   */
  toReversed(): Float16Array

  /**
   * Copies and sorts the array.
   * @param compareFn Function used to determine the order of the elements. It is expected to return
   * a negative value if the first argument is less than the second argument, zero if they're equal, and a positive
   * value otherwise. If omitted, the elements are sorted in ascending order.
   * ```ts
   * const myNums = Float16Array.from([11.25, 2, -22.5, 1]);
   * myNums.toSorted((a, b) => a - b) // Float16Array(4) [-22.5, 1, 2, 11.5]
   * ```
   */
  toSorted(compareFn?: (a: number, b: number) => number): Float16Array

  /**
   * Copies the array and inserts the given number at the provided index.
   * @param index The index of the value to overwrite. If the index is
   * negative, then it replaces from the end of the array.
   * @param value The value to insert into the copied array.
   * @returns A copy of the original array with the inserted value.
   */
  with(index: number, value: number): Float16Array
}

/**
 * @category Platform
 * @experimental
 */
declare interface DataView {
  /**
   * Gets the Float16 value at the specified byte offset from the start of the view. There is
   * no alignment constraint; multi-byte values may be fetched from any offset.
   * @param byteOffset The place in the buffer at which the value should be retrieved.
   * @param littleEndian If false or undefined, a big-endian value should be read.
   */
  getFloat16(byteOffset: number, littleEndian?: boolean): number

  /**
   * Stores an Float16 value at the specified byte offset from the start of the view.
   * @param byteOffset The place in the buffer at which the value should be set.
   * @param value The value to set.
   * @param littleEndian If false or undefined, a big-endian value should be written.
   */
  setFloat16(byteOffset: number, value: number, littleEndian?: boolean): void
}
