// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// deno-lint-ignore-file

import { internals } from "ext:core/mod.js";
const requireImpl = internals.requireImpl;

import { nodeGlobals } from "ext:deno_node/00_globals.js";
import "node:module";

let initialized = false;

function initialize(args) {
  const {
    usesLocalNodeModulesDir,
    argv0,
    runningOnMainThread,
    workerId,
    maybeWorkerMetadata,
    nodeDebug,
    warmup = false,
  } = args;
  if (!warmup) {
    if (initialized) {
      throw new Error("Node runtime already initialized");
    }
    initialized = true;
    if (usesLocalNodeModulesDir) {
      requireImpl.setUsesLocalNodeModulesDir();
    }

    // FIXME(bartlomieju): not nice to depend on `Deno` namespace here
    // but it's the only way to get `args` and `version` and this point.
    internals.__bootstrapNodeProcess(
      argv0,
      Deno.args,
      Deno.version,
      nodeDebug ?? "",
    );
    internals.__initWorkerThreads(
      runningOnMainThread,
      workerId,
      maybeWorkerMetadata,
    );
    internals.__setupChildProcessIpcChannel();
    // `Deno[Deno.internal].requireImpl` will be unreachable after this line.
    delete internals.requireImpl;
  } else {
    // Warm up the process module
    internals.__bootstrapNodeProcess(
      undefined,
      undefined,
      undefined,
      undefined,
      true,
    );
  }
}

function loadCjsModule(moduleName, isMain, inspectBrk) {
  if (inspectBrk) {
    requireImpl.setInspectBrk();
  }
  requireImpl.Module._load(moduleName, null, { main: isMain });
}

globalThis.nodeBootstrap = initialize;

internals.node = {
  initialize,
  loadCjsModule,
};

const nativeModuleExports = requireImpl.nativeModuleExports;
nodeGlobals.Buffer = nativeModuleExports["buffer"].Buffer;
nodeGlobals.clearImmediate = nativeModuleExports["timers"].clearImmediate;
nodeGlobals.clearInterval = nativeModuleExports["timers"].clearInterval;
nodeGlobals.clearTimeout = nativeModuleExports["timers"].clearTimeout;
nodeGlobals.global = globalThis;
nodeGlobals.process = nativeModuleExports["process"];
nodeGlobals.setImmediate = nativeModuleExports["timers"].setImmediate;
nodeGlobals.setInterval = nativeModuleExports["timers"].setInterval;
nodeGlobals.setTimeout = nativeModuleExports["timers"].setTimeout;
nodeGlobals.performance = nativeModuleExports["perf_hooks"].performance;

nativeModuleExports["internal/console/constructor"].bindStreamsLazy(
  nativeModuleExports["console"],
  nativeModuleExports["process"],
);
