// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

const kInternal = Symbol("internal properties");

const replaceUnderscoresRegex = /_/g;
const leadingDashesRegex = /^--?/;
const trailingValuesRegex = /=.*$/;

// This builds the initial process.allowedNodeEnvironmentFlags
// from data in the config binding.
export function buildAllowedFlags() {
  const allowedNodeEnvironmentFlags = [
    "--track-heap-objects",
    "--no-track-heap-objects",
    "--node-snapshot",
    "--no-node-snapshot",
    "--require",
    "--max-old-space-size",
    "--trace-exit",
    "--no-trace-exit",
    "--disallow-code-generation-from-strings",
    "--experimental-json-modules",
    "--no-experimental-json-modules",
    "--interpreted-frames-native-stack",
    "--inspect-brk",
    "--no-inspect-brk",
    "--trace-tls",
    "--no-trace-tls",
    "--stack-trace-limit",
    "--experimental-repl-await",
    "--no-experimental-repl-await",
    "--preserve-symlinks",
    "--no-preserve-symlinks",
    "--report-uncaught-exception",
    "--no-report-uncaught-exception",
    "--experimental-modules",
    "--no-experimental-modules",
    "--report-signal",
    "--jitless",
    "--inspect-port",
    "--heapsnapshot-near-heap-limit",
    "--tls-keylog",
    "--force-context-aware",
    "--no-force-context-aware",
    "--napi-modules",
    "--abort-on-uncaught-exception",
    "--diagnostic-dir",
    "--verify-base-objects",
    "--no-verify-base-objects",
    "--unhandled-rejections",
    "--perf-basic-prof",
    "--trace-atomics-wait",
    "--no-trace-atomics-wait",
    "--deprecation",
    "--no-deprecation",
    "--perf-basic-prof-only-functions",
    "--perf-prof",
    "--max-http-header-size",
    "--report-on-signal",
    "--no-report-on-signal",
    "--throw-deprecation",
    "--no-throw-deprecation",
    "--warnings",
    "--no-warnings",
    "--force-fips",
    "--no-force-fips",
    "--pending-deprecation",
    "--no-pending-deprecation",
    "--input-type",
    "--tls-max-v1.3",
    "--no-tls-max-v1.3",
    "--tls-min-v1.2",
    "--no-tls-min-v1.2",
    "--inspect",
    "--no-inspect",
    "--heapsnapshot-signal",
    "--trace-warnings",
    "--no-trace-warnings",
    "--trace-event-categories",
    "--experimental-worker",
    "--tls-max-v1.2",
    "--no-tls-max-v1.2",
    "--perf-prof-unwinding-info",
    "--preserve-symlinks-main",
    "--no-preserve-symlinks-main",
    "--policy-integrity",
    "--experimental-wasm-modules",
    "--no-experimental-wasm-modules",
    "--node-memory-debug",
    "--inspect-publish-uid",
    "--tls-min-v1.3",
    "--no-tls-min-v1.3",
    "--experimental-specifier-resolution",
    "--secure-heap",
    "--tls-min-v1.0",
    "--no-tls-min-v1.0",
    "--redirect-warnings",
    "--experimental-report",
    "--trace-event-file-pattern",
    "--trace-uncaught",
    "--no-trace-uncaught",
    "--experimental-loader",
    "--http-parser",
    "--dns-result-order",
    "--trace-sigint",
    "--no-trace-sigint",
    "--secure-heap-min",
    "--enable-fips",
    "--no-enable-fips",
    "--enable-source-maps",
    "--no-enable-source-maps",
    "--insecure-http-parser",
    "--no-insecure-http-parser",
    "--use-openssl-ca",
    "--no-use-openssl-ca",
    "--tls-cipher-list",
    "--experimental-top-level-await",
    "--no-experimental-top-level-await",
    "--openssl-config",
    "--icu-data-dir",
    "--v8-pool-size",
    "--report-on-fatalerror",
    "--no-report-on-fatalerror",
    "--title",
    "--tls-min-v1.1",
    "--no-tls-min-v1.1",
    "--report-filename",
    "--trace-deprecation",
    "--no-trace-deprecation",
    "--report-compact",
    "--no-report-compact",
    "--experimental-policy",
    "--experimental-import-meta-resolve",
    "--no-experimental-import-meta-resolve",
    "--zero-fill-buffers",
    "--no-zero-fill-buffers",
    "--report-dir",
    "--use-bundled-ca",
    "--no-use-bundled-ca",
    "--experimental-vm-modules",
    "--no-experimental-vm-modules",
    "--force-async-hooks-checks",
    "--no-force-async-hooks-checks",
    "--frozen-intrinsics",
    "--no-frozen-intrinsics",
    "--huge-max-old-generation-size",
    "--disable-proto",
    "--debug-arraybuffer-allocations",
    "--no-debug-arraybuffer-allocations",
    "--conditions",
    "--experimental-wasi-unstable-preview1",
    "--no-experimental-wasi-unstable-preview1",
    "--trace-sync-io",
    "--no-trace-sync-io",
    "--use-largepages",
    "--experimental-abortcontroller",
    "--debug-port",
    "--es-module-specifier-resolution",
    "--prof-process",
    "-C",
    "--loader",
    "--report-directory",
    "-r",
    "--trace-events-enabled",
  ];

  /*
  function isAccepted(to) {
    if (!to.startsWith("-") || to === "--") return true;
    const recursiveExpansion = aliases.get(to);
    if (recursiveExpansion) {
      if (recursiveExpansion[0] === to) {
        recursiveExpansion.splice(0, 1);
      }
      return recursiveExpansion.every(isAccepted);
    }
    return options.get(to).envVarSettings === kAllowedInEnvironment;
  }
  for (const { 0: from, 1: expansion } of aliases) {
    if (expansion.every(isAccepted)) {
      let canonical = from;
      if (canonical.endsWith("=")) {
        canonical = canonical.slice(0, canonical.length - 1);
      }
      if (canonical.endsWith(" <arg>")) {
        canonical = canonical.slice(0, canonical.length - 4);
      }
      allowedNodeEnvironmentFlags.push(canonical);
    }
  }
  */

  const trimLeadingDashes = (flag) => flag.replace(leadingDashesRegex, "");

  // Save these for comparison against flags provided to
  // process.allowedNodeEnvironmentFlags.has() which lack leading dashes.
  const nodeFlags = allowedNodeEnvironmentFlags.map(trimLeadingDashes);

  class NodeEnvironmentFlagsSet extends Set {
    constructor(array) {
      super();
      this[kInternal] = { array };
    }

    add() {
      // No-op, `Set` API compatible
      return this;
    }

    delete() {
      // No-op, `Set` API compatible
      return false;
    }

    clear() {
      // No-op, `Set` API compatible
    }

    has(key) {
      // This will return `true` based on various possible
      // permutations of a flag, including present/missing leading
      // dash(es) and/or underscores-for-dashes.
      // Strips any values after `=`, inclusive.
      // TODO(addaleax): It might be more flexible to run the option parser
      // on a dummy option set and see whether it rejects the argument or
      // not.
      if (typeof key === "string") {
        key = key.replace(replaceUnderscoresRegex, "-");
        if (leadingDashesRegex.test(key)) {
          key = key.replace(trailingValuesRegex, "");
          return this[kInternal].array.includes(key);
        }
        return nodeFlags.includes(key);
      }
      return false;
    }

    entries() {
      this[kInternal].set ??= new Set(this[kInternal].array);
      return this[kInternal].set.entries();
    }

    forEach(callback, thisArg = undefined) {
      this[kInternal].array.forEach((v) =>
        Reflect.apply(callback, thisArg, [v, v, this])
      );
    }

    get size() {
      return this[kInternal].array.length;
    }

    values() {
      this[kInternal].set ??= new Set(this[kInternal].array);
      return this[kInternal].set.values();
    }
  }
  NodeEnvironmentFlagsSet.prototype.keys =
    NodeEnvironmentFlagsSet
      .prototype[Symbol.iterator] =
      NodeEnvironmentFlagsSet.prototype.values;

  Object.freeze(NodeEnvironmentFlagsSet.prototype.constructor);
  Object.freeze(NodeEnvironmentFlagsSet.prototype);

  return Object.freeze(
    new NodeEnvironmentFlagsSet(
      allowedNodeEnvironmentFlags,
    ),
  );
}
