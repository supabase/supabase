// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

import { primordials } from "ext:core/mod.js";
import { notImplemented } from "ext:deno_node/_utils.ts";
const { Symbol } = primordials;

export const REPL_MODE_SLOPPY = Symbol("repl-sloppy");
export const REPL_MODE_STRICT = Symbol("repl-strict");

export class REPLServer {
  constructor() {
    notImplemented("REPLServer.prototype.constructor");
  }
}
export const builtinModules = [
  "assert",
  "async_hooks",
  "buffer",
  "child_process",
  "cluster",
  "console",
  "constants",
  "crypto",
  "dgram",
  "diagnostics_channel",
  "dns",
  "domain",
  "events",
  "fs",
  "http",
  "http2",
  "https",
  "inspector",
  "module",
  "net",
  "os",
  "path",
  "perf_hooks",
  "process",
  "punycode",
  "querystring",
  "readline",
  "repl",
  "stream",
  "string_decoder",
  "sys",
  "timers",
  "tls",
  "trace_events",
  "tty",
  "url",
  "util",
  "v8",
  "vm",
  "wasi",
  "worker_threads",
  "zlib",
];
export const _builtinLibs = builtinModules;
export function start() {
  notImplemented("repl.start");
}
export default {
  REPLServer,
  builtinModules,
  _builtinLibs,
  start,
  REPL_MODE_SLOPPY,
  REPL_MODE_STRICT,
};
