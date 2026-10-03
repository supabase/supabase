// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// deno-lint-ignore-file

import { core, internals, primordials } from "ext:core/mod.js";
import {
  op_import_sync,
  op_napi_open,
  op_require_as_file_path,
  op_require_break_on_next_statement,
  op_require_can_parse_as_esm,
  op_require_init_paths,
  op_require_is_deno_dir_package,
  op_require_is_maybe_cjs,
  op_require_is_request_relative,
  op_require_node_module_paths,
  op_require_package_imports_resolve,
  op_require_path_basename,
  op_require_path_dirname,
  op_require_path_is_absolute,
  op_require_path_resolve,
  op_require_proxy_path,
  op_require_read_file,
  op_require_read_package_scope,
  op_require_real_path,
  op_require_resolve_deno_dir,
  op_require_resolve_exports,
  op_require_resolve_lookup_paths,
  op_require_stat,
  op_require_try_self,
  op_require_try_self_parent_path,
} from "ext:core/ops";
const {
  ArrayIsArray,
  ArrayPrototypeIncludes,
  ArrayPrototypeIndexOf,
  ArrayPrototypeJoin,
  ArrayPrototypePush,
  ArrayPrototypeSlice,
  ArrayPrototypeSplice,
  Error,
  JSONParse,
  ObjectCreate,
  ObjectEntries,
  ObjectGetOwnPropertyDescriptor,
  ObjectGetPrototypeOf,
  ObjectHasOwn,
  ObjectKeys,
  ObjectPrototype,
  ObjectSetPrototypeOf,
  Proxy,
  RegExpPrototypeTest,
  SafeArrayIterator,
  SafeMap,
  SafeWeakMap,
  String,
  StringPrototypeCharCodeAt,
  StringPrototypeEndsWith,
  StringPrototypeIncludes,
  StringPrototypeIndexOf,
  StringPrototypeMatch,
  StringPrototypeSlice,
  StringPrototypeSplit,
  StringPrototypeStartsWith,
  TypeError,
} = primordials;

import { nodeGlobals } from "ext:deno_node/00_globals.js";

import _httpAgent from "node:_http_agent";
import _httpCommon from "node:_http_common";
import _httpOutgoing from "node:_http_outgoing";
import _httpServer from "node:_http_server";
import _streamDuplex from "node:_stream_duplex";
import _streamPassthrough from "node:_stream_passthrough";
import _streamReadable from "node:_stream_readable";
import _streamTransform from "node:_stream_transform";
import _streamWritable from "node:_stream_writable";
import _tlsCommon from "node:_tls_common";
import _tlsWrap from "node:_tls_wrap";
import assert from "node:assert";
import assertStrict from "node:assert/strict";
import asyncHooks from "node:async_hooks";
import buffer from "node:buffer";
import childProcess from "node:child_process";
import cluster from "node:cluster";
import console from "node:console";
import constants from "node:constants";
import crypto from "node:crypto";
import dgram from "node:dgram";
import diagnosticsChannel from "node:diagnostics_channel";
import dns from "node:dns";
import dnsPromises from "node:dns/promises";
import domain from "node:domain";
import events from "node:events";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import http from "node:http";
import http2 from "node:http2";
import https from "node:https";
import inspector from "node:inspector";
import inspectorPromises from "node:inspector/promises";
import internalCp from "ext:deno_node/internal/child_process.ts";
import internalCryptoCertificate from "ext:deno_node/internal/crypto/certificate.ts";
import internalCryptoCipher from "ext:deno_node/internal/crypto/cipher.ts";
import internalCryptoDiffiehellman from "ext:deno_node/internal/crypto/diffiehellman.ts";
import internalCryptoHash from "ext:deno_node/internal/crypto/hash.ts";
import internalCryptoHkdf from "ext:deno_node/internal/crypto/hkdf.ts";
import internalCryptoKeygen from "ext:deno_node/internal/crypto/keygen.ts";
import internalCryptoKeys from "ext:deno_node/internal/crypto/keys.ts";
import internalCryptoPbkdf2 from "ext:deno_node/internal/crypto/pbkdf2.ts";
import internalCryptoRandom from "ext:deno_node/internal/crypto/random.ts";
import internalCryptoScrypt from "ext:deno_node/internal/crypto/scrypt.ts";
import internalCryptoSig from "ext:deno_node/internal/crypto/sig.ts";
import internalCryptoUtil from "ext:deno_node/internal/crypto/util.ts";
import internalCryptoX509 from "ext:deno_node/internal/crypto/x509.ts";
import internalDgram from "ext:deno_node/internal/dgram.ts";
import internalDnsPromises from "ext:deno_node/internal/dns/promises.ts";
import internalErrors from "ext:deno_node/internal/errors.ts";
import internalEventTarget from "ext:deno_node/internal/event_target.mjs";
import internalFsUtils from "ext:deno_node/internal/fs/utils.mjs";
import internalHttp from "ext:deno_node/internal/http.ts";
import internalReadlineUtils from "ext:deno_node/internal/readline/utils.mjs";
import internalStreamsAddAbortSignal from "ext:deno_node/internal/streams/add-abort-signal.mjs";
import internalStreamsBufferList from "ext:deno_node/internal/streams/buffer_list.mjs";
import internalStreamsLazyTransform from "ext:deno_node/internal/streams/lazy_transform.mjs";
import internalStreamsState from "ext:deno_node/internal/streams/state.mjs";
import internalTestBinding from "ext:deno_node/internal/test/binding.ts";
import internalTimers from "ext:deno_node/internal/timers.mjs";
import internalUtil from "ext:deno_node/internal/util.mjs";
import internalUtilInspect from "ext:deno_node/internal/util/inspect.mjs";
import internalConsole from "ext:deno_node/internal/console/constructor.mjs";
import net from "node:net";
import os from "node:os";
import pathPosix from "node:path/posix";
import pathWin32 from "node:path/win32";
import path from "node:path";
import perfHooks from "node:perf_hooks";
import punycode from "node:punycode";
import process from "node:process";
import querystring from "node:querystring";
import readline from "node:readline";
import readlinePromises from "node:readline/promises";
import repl from "node:repl";
import stream from "node:stream";
import streamConsumers from "node:stream/consumers";
import streamPromises from "node:stream/promises";
import streamWeb from "node:stream/web";
import stringDecoder from "node:string_decoder";
import sys from "node:sys";
import test from "node:test";
import timers from "node:timers";
import timersPromises from "node:timers/promises";
import tls from "node:tls";
import traceEvents from "node:trace_events";
import tty from "node:tty";
import url from "node:url";
import utilTypes from "node:util/types";
import util from "node:util";
import v8 from "node:v8";
import vm from "node:vm";
import workerThreads from "node:worker_threads";
import wasi from "node:wasi";
import zlib from "node:zlib";

const nativeModuleExports = ObjectCreate(null);
const builtinModules = [];

// NOTE(bartlomieju): keep this list in sync with `ext/node/polyfill.rs`
function setupBuiltinModules() {
  const nodeModules = {
    "_http_agent": _httpAgent,
    "_http_common": _httpCommon,
    "_http_outgoing": _httpOutgoing,
    "_http_server": _httpServer,
    "_stream_duplex": _streamDuplex,
    "_stream_passthrough": _streamPassthrough,
    "_stream_readable": _streamReadable,
    "_stream_transform": _streamTransform,
    "_stream_writable": _streamWritable,
    "_tls_common": _tlsCommon,
    "_tls_wrap": _tlsWrap,
    assert,
    "assert/strict": assertStrict,
    "async_hooks": asyncHooks,
    buffer,
    crypto,
    console,
    constants,
    child_process: childProcess,
    cluster,
    dgram,
    diagnostics_channel: diagnosticsChannel,
    dns,
    "dns/promises": dnsPromises,
    domain,
    events,
    fs,
    "fs/promises": fsPromises,
    http,
    http2,
    https,
    inspector,
    "inspector/promises": inspectorPromises,
    "internal/console/constructor": internalConsole,
    "internal/child_process": internalCp,
    "internal/crypto/certificate": internalCryptoCertificate,
    "internal/crypto/cipher": internalCryptoCipher,
    "internal/crypto/diffiehellman": internalCryptoDiffiehellman,
    "internal/crypto/hash": internalCryptoHash,
    "internal/crypto/hkdf": internalCryptoHkdf,
    "internal/crypto/keygen": internalCryptoKeygen,
    "internal/crypto/keys": internalCryptoKeys,
    "internal/crypto/pbkdf2": internalCryptoPbkdf2,
    "internal/crypto/random": internalCryptoRandom,
    "internal/crypto/scrypt": internalCryptoScrypt,
    "internal/crypto/sig": internalCryptoSig,
    "internal/crypto/util": internalCryptoUtil,
    "internal/crypto/x509": internalCryptoX509,
    "internal/dgram": internalDgram,
    "internal/dns/promises": internalDnsPromises,
    "internal/errors": internalErrors,
    "internal/event_target": internalEventTarget,
    "internal/fs/utils": internalFsUtils,
    "internal/http": internalHttp,
    "internal/readline/utils": internalReadlineUtils,
    "internal/streams/add-abort-signal": internalStreamsAddAbortSignal,
    "internal/streams/buffer_list": internalStreamsBufferList,
    "internal/streams/lazy_transform": internalStreamsLazyTransform,
    "internal/streams/state": internalStreamsState,
    "internal/test/binding": internalTestBinding,
    "internal/timers": internalTimers,
    "internal/util/inspect": internalUtilInspect,
    "internal/util": internalUtil,
    net,
    module: Module,
    os,
    "path/posix": pathPosix,
    "path/win32": pathWin32,
    path,
    perf_hooks: perfHooks,
    process,
    get punycode() {
      process.emitWarning(
        "The `punycode` module is deprecated. Please use a userland " +
          "alternative instead.",
        "DeprecationWarning",
        "DEP0040",
      );
      return punycode;
    },
    querystring,
    readline,
    "readline/promises": readlinePromises,
    repl,
    stream,
    "stream/consumers": streamConsumers,
    "stream/promises": streamPromises,
    "stream/web": streamWeb,
    string_decoder: stringDecoder,
    sys,
    test,
    timers,
    "timers/promises": timersPromises,
    tls,
    traceEvents,
    tty,
    url,
    util,
    "util/types": utilTypes,
    v8,
    vm,
    wasi,
    worker_threads: workerThreads,
    zlib,
  };
  for (const [name, moduleExports] of ObjectEntries(nodeModules)) {
    nativeModuleExports[name] = moduleExports;
    ArrayPrototypePush(builtinModules, name);
  }
}
setupBuiltinModules();

function pathDirname(filepath) {
  if (filepath == null) {
    throw new Error("Empty filepath.");
  } else if (filepath === "") {
    return ".";
  }
  return op_require_path_dirname(filepath);
}

function pathResolve(...args) {
  return op_require_path_resolve(args);
}

const nativeModulePolyfill = new SafeMap();

const relativeResolveCache = ObjectCreate(null);
let requireDepth = 0;
let statCache = null;
let mainModule = null;
let hasBrokenOnInspectBrk = false;
let hasInspectBrk = false;
// Are we running with --node-modules-dir flag or byonm?
let usesLocalNodeModulesDir = false;

function stat(filename) {
  // TODO: required only on windows
  // filename = path.toNamespacedPath(filename);
  if (statCache !== null) {
    const result = statCache.get(filename);
    if (result !== undefined) {
      return result;
    }
  }
  const result = op_require_stat(filename);
  if (statCache !== null && result >= 0) {
    statCache.set(filename, result);
  }

  return result;
}

function updateChildren(parent, child, scan) {
  if (!parent) {
    return;
  }

  const children = parent.children;
  if (children && !(scan && ArrayPrototypeIncludes(children, child))) {
    ArrayPrototypePush(children, child);
  }
}

function tryFile(requestPath, _isMain) {
  const rc = stat(requestPath);
  if (rc !== 0) return;
  return toRealPath(requestPath);
}

function tryPackage(requestPath, exts, isMain, originalPath) {
  const packageJsonPath = pathResolve(
    requestPath,
    "package.json",
  );
  const pkg = op_require_read_package_scope(packageJsonPath)?.main;
  if (!pkg) {
    return tryExtensions(
      pathResolve(requestPath, "index"),
      exts,
      isMain,
    );
  }

  const filename = pathResolve(requestPath, pkg);
  let actual = tryFile(filename, isMain) ||
    tryExtensions(filename, exts, isMain) ||
    tryExtensions(
      pathResolve(filename, "index"),
      exts,
      isMain,
    );
  if (actual === false) {
    actual = tryExtensions(
      pathResolve(requestPath, "index"),
      exts,
      isMain,
    );
    if (!actual) {
      // eslint-disable-next-line no-restricted-syntax
      const err = new Error(
        `Cannot find module '${filename}'. ` +
          'Please verify that the package.json has a valid "main" entry',
      );
      err.code = "MODULE_NOT_FOUND";
      err.path = pathResolve(
        requestPath,
        "package.json",
      );
      err.requestPath = originalPath;
      throw err;
    } else {
      process.emitWarning(
        `Invalid 'main' field in '${packageJsonPath}' of '${pkg}'. ` +
          "Please either fix that or report it to the module author",
        "DeprecationWarning",
        "DEP0128",
      );
    }
  }
  return actual;
}

const realpathCache = new SafeMap();
function toRealPath(requestPath) {
  const maybeCached = realpathCache.get(requestPath);
  if (maybeCached) {
    return maybeCached;
  }
  const rp = op_require_real_path(requestPath);
  realpathCache.set(requestPath, rp);
  return rp;
}

function tryExtensions(p, exts, isMain) {
  for (let i = 0; i < exts.length; i++) {
    const filename = tryFile(p + exts[i], isMain);

    if (filename) {
      return filename;
    }
  }
  return false;
}

// Find the longest (possibly multi-dot) extension registered in
// Module._extensions
function findLongestRegisteredExtension(filename) {
  const name = op_require_path_basename(filename);
  let currentExtension;
  let index;
  let startIndex = 0;
  while ((index = StringPrototypeIndexOf(name, ".", startIndex)) !== -1) {
    startIndex = index + 1;
    if (index === 0) continue; // Skip dotfiles like .gitignore
    currentExtension = StringPrototypeSlice(name, index);
    if (Module._extensions[currentExtension]) {
      return currentExtension;
    }
  }
  return ".js";
}

function getExportsForCircularRequire(module) {
  if (
    module.exports &&
    ObjectGetPrototypeOf(module.exports) === ObjectPrototype &&
    // Exclude transpiled ES6 modules / TypeScript code because those may
    // employ unusual patterns for accessing 'module.exports'. That should
    // be okay because ES6 modules have a different approach to circular
    // dependencies anyway.
    !module.exports.__esModule
  ) {
    // This is later unset once the module is done loading.
    ObjectSetPrototypeOf(
      module.exports,
      CircularRequirePrototypeWarningProxy,
    );
  }

  return module.exports;
}

function emitCircularRequireWarning(prop) {
  process.emitWarning(
    `Accessing non-existent property '${String(prop)}' of module exports ` +
      "inside circular dependency",
  );
}

// A Proxy that can be used as the prototype of a module.exports object and
// warns when non-existent properties are accessed.
const CircularRequirePrototypeWarningProxy = new Proxy({}, {
  get(target, prop) {
    // Allow __esModule access in any case because it is used in the output
    // of transpiled code to determine whether something comes from an
    // ES module, and is not used as a regular key of `module.exports`.
    if (prop in target || prop === "__esModule") return target[prop];
    emitCircularRequireWarning(prop);
    return undefined;
  },

  getOwnPropertyDescriptor(target, prop) {
    if (
      ObjectHasOwn(target, prop) || prop === "__esModule"
    ) {
      return ObjectGetOwnPropertyDescriptor(target, prop);
    }
    emitCircularRequireWarning(prop);
    return undefined;
  },
});

const moduleParentCache = new SafeWeakMap();
function Module(id = "", parent) {
  this.id = id;
  this.path = pathDirname(id);
  this.exports = {};
  moduleParentCache.set(this, parent);
  updateChildren(parent, this, false);
  this.filename = null;
  this.loaded = false;
  this.parent = parent;
  this.children = [];
}

Module.builtinModules = builtinModules;

Module._extensions = ObjectCreate(null);
Module._cache = ObjectCreate(null);
Module._pathCache = ObjectCreate(null);
let modulePaths = [];
Module.globalPaths = modulePaths;

const CHAR_FORWARD_SLASH = 47;
const TRAILING_SLASH_REGEX = /(?:^|\/)\.?\.$/;

// This only applies to requests of a specific form:
// 1. name/.*
// 2. @scope/name/.*
const EXPORTS_PATTERN = /^((?:@[^/\\%]+\/)?[^./\\%][^/\\%]*)(\/.*)?$/;
function resolveExports(
  modulesPath,
  request,
  parentPath,
  usesLocalNodeModulesDir,
) {
  // The implementation's behavior is meant to mirror resolution in ESM.
  const [, name, expansion = ""] =
    StringPrototypeMatch(request, EXPORTS_PATTERN) || [];
  if (!name) {
    return;
  }

  return op_require_resolve_exports(
    usesLocalNodeModulesDir,
    modulesPath,
    request,
    name,
    expansion,
    parentPath ?? "",
  ) ?? false;
}

Module._findPath = function (request, paths, isMain, parentPath) {
  const absoluteRequest = op_require_path_is_absolute(request);
  if (absoluteRequest) {
    paths = [""];
  } else if (!paths || paths.length === 0) {
    return false;
  }

  const cacheKey = request + "\x00" + ArrayPrototypeJoin(paths, "\x00");
  const entry = Module._pathCache[cacheKey];
  if (entry) {
    return entry;
  }

  let exts;
  let trailingSlash = request.length > 0 &&
    StringPrototypeCharCodeAt(request, request.length - 1) ===
      CHAR_FORWARD_SLASH;
  if (!trailingSlash) {
    trailingSlash = RegExpPrototypeTest(TRAILING_SLASH_REGEX, request);
  }

  // For each path
  for (let i = 0; i < paths.length; i++) {
    // Don't search further if path doesn't exist
    const curPath = paths[i];
    if (curPath && stat(curPath) < 1) continue;

    if (!absoluteRequest) {
      const exportsResolved = resolveExports(
        curPath,
        request,
        parentPath,
        usesLocalNodeModulesDir,
      );
      if (exportsResolved) {
        return exportsResolved;
      }
    }

    let basePath;

    if (usesLocalNodeModulesDir) {
      basePath = pathResolve(curPath, request);
    } else {
      const isDenoDirPackage = op_require_is_deno_dir_package(
        curPath,
      );
      const isRelative = op_require_is_request_relative(
        request,
      );
      basePath = (isDenoDirPackage && !isRelative)
        ? pathResolve(curPath, packageSpecifierSubPath(request))
        : pathResolve(curPath, request);
    }
    let filename;

    const rc = stat(basePath);
    if (!trailingSlash) {
      if (rc === 0) { // File.
        filename = toRealPath(basePath);
      }

      if (!filename) {
        // Try it with each of the extensions
        if (exts === undefined) {
          exts = ObjectKeys(Module._extensions);
        }
        filename = tryExtensions(basePath, exts, isMain);
      }
    }

    if (!filename && rc === 1) { // Directory.
      // try it with each of the extensions at "index"
      if (exts === undefined) {
        exts = ObjectKeys(Module._extensions);
      }
      filename = tryPackage(basePath, exts, isMain, request);
    }

    if (filename) {
      Module._pathCache[cacheKey] = filename;
      return filename;
    }
  }

  return false;
};

/**
 * Get a list of potential module directories
 * @param {string} fromPath The directory name of the module
 * @returns {string[]} List of module directories
 */
Module._nodeModulePaths = function (fromPath) {
  return op_require_node_module_paths(fromPath);
};

Module._resolveLookupPaths = function (request, parent) {
  const paths = [];

  if (op_require_is_request_relative(request)) {
    ArrayPrototypePush(
      paths,
      parent?.filename ? op_require_path_dirname(parent.filename) : ".",
    );
    return paths;
  }

  if (
    !usesLocalNodeModulesDir && parent?.filename && parent.filename.length > 0
  ) {
    const denoDirPath = op_require_resolve_deno_dir(
      request,
      parent.filename,
    );
    if (denoDirPath) {
      ArrayPrototypePush(paths, denoDirPath);
    }
  }
  const lookupPathsResult = op_require_resolve_lookup_paths(
    request,
    parent?.paths,
    parent?.filename ?? "",
  );
  if (lookupPathsResult) {
    ArrayPrototypePush(paths, ...new SafeArrayIterator(lookupPathsResult));
  }
  return paths;
};

Module._load = function (request, parent, isMain) {
  let relResolveCacheIdentifier;
  if (parent) {
    // Fast path for (lazy loaded) modules in the same directory. The indirect
    // caching is required to allow cache invalidation without changing the old
    // cache key names.
    relResolveCacheIdentifier = `${parent.path}\x00${request}`;
    const filename = relativeResolveCache[relResolveCacheIdentifier];
    if (filename !== undefined) {
      const cachedModule = Module._cache[filename];
      if (cachedModule !== undefined) {
        updateChildren(parent, cachedModule, true);
        if (!cachedModule.loaded) {
          return getExportsForCircularRequire(cachedModule);
        }
        return cachedModule.exports;
      }
      delete relativeResolveCache[relResolveCacheIdentifier];
    }
  }

  const filename = Module._resolveFilename(request, parent, isMain);
  if (StringPrototypeStartsWith(filename, "node:")) {
    // Slice 'node:' prefix
    const id = StringPrototypeSlice(filename, 5);

    const module = loadNativeModule(id, id);
    if (!module) {
      // TODO:
      // throw new ERR_UNKNOWN_BUILTIN_MODULE(filename);
      throw new Error("Unknown built-in module");
    }

    return module.exports;
  }

  const cachedModule = Module._cache[filename];
  if (cachedModule !== undefined) {
    updateChildren(parent, cachedModule, true);
    if (!cachedModule.loaded) {
      return getExportsForCircularRequire(cachedModule);
    }
    return cachedModule.exports;
  }

  const mod = loadNativeModule(filename, request);
  if (
    mod
  ) {
    return mod.exports;
  }
  // Don't call updateChildren(), Module constructor already does.
  const module = cachedModule || new Module(filename, parent);

  if (isMain) {
    process.mainModule = module;
    mainModule = module;
    module.id = ".";
  }

  Module._cache[filename] = module;
  if (parent !== undefined) {
    relativeResolveCache[relResolveCacheIdentifier] = filename;
  }

  let threw = true;
  try {
    module.load(filename);
    threw = false;
  } finally {
    if (threw) {
      delete Module._cache[filename];
      if (parent !== undefined) {
        delete relativeResolveCache[relResolveCacheIdentifier];
        const children = parent?.children;
        if (ArrayIsArray(children)) {
          const index = ArrayPrototypeIndexOf(children, module);
          if (index !== -1) {
            ArrayPrototypeSplice(children, index, 1);
          }
        }
      }
    } else if (
      module.exports &&
      ObjectGetPrototypeOf(module.exports) ===
        CircularRequirePrototypeWarningProxy
    ) {
      ObjectSetPrototypeOf(module.exports, ObjectPrototype);
    }
  }

  return module.exports;
};

Module._resolveFilename = function (
  request,
  parent,
  isMain,
  options,
) {
  if (
    StringPrototypeStartsWith(request, "node:") ||
    nativeModuleCanBeRequiredByUsers(request)
  ) {
    return request;
  }

  let paths;

  if (typeof options === "object" && options !== null) {
    if (ArrayIsArray(options.paths)) {
      const isRelative = op_require_is_request_relative(request);

      if (isRelative) {
        paths = options.paths;
      } else {
        const fakeParent = new Module("", null);
        paths = [];

        for (let i = 0; i < options.paths.length; i++) {
          const path = options.paths[i];
          fakeParent.paths = Module._nodeModulePaths(path);
          const lookupPaths = Module._resolveLookupPaths(request, fakeParent);

          for (let j = 0; j < lookupPaths.length; j++) {
            if (!ArrayPrototypeIncludes(paths, lookupPaths[j])) {
              ArrayPrototypePush(paths, lookupPaths[j]);
            }
          }
        }
      }
    } else if (options.paths === undefined) {
      paths = Module._resolveLookupPaths(request, parent);
    } else {
      // TODO:
      // throw new ERR_INVALID_ARG_VALUE("options.paths", options.paths);
      throw new Error("Invalid arg value options.paths", options.path);
    }
  } else {
    paths = Module._resolveLookupPaths(request, parent);
  }

  if (parent?.filename) {
    if (request[0] === "#") {
      const maybeResolved = op_require_package_imports_resolve(
        parent.filename,
        request,
      );
      if (maybeResolved) {
        return maybeResolved;
      }
    }
  }

  // Try module self resolution first
  const parentPath = op_require_try_self_parent_path(
    !!parent,
    parent?.filename,
    parent?.id,
  );
  const selfResolved = op_require_try_self(parentPath, request);
  if (selfResolved) {
    const cacheKey = request + "\x00" +
      (paths.length === 1 ? paths[0] : ArrayPrototypeJoin(paths, "\x00"));
    Module._pathCache[cacheKey] = selfResolved;
    return selfResolved;
  }

  // Look up the filename first, since that's the cache key.
  const filename = Module._findPath(
    request,
    paths,
    isMain,
    parentPath,
  );
  if (filename) {
    return op_require_real_path(filename);
  }
  const requireStack = [];
  for (let cursor = parent; cursor; cursor = moduleParentCache.get(cursor)) {
    ArrayPrototypePush(requireStack, cursor.filename || cursor.id);
  }
  let message = `Cannot find module '${request}'`;
  if (requireStack.length > 0) {
    message = message + "\nRequire stack:\n- " +
      ArrayPrototypeJoin(requireStack, "\n- ");
  }
  // eslint-disable-next-line no-restricted-syntax
  const err = new Error(message);
  err.code = "MODULE_NOT_FOUND";
  err.requireStack = requireStack;

  // fallback and attempt to resolve bare specifiers using
  // the global cache when not using --node-modules-dir
  if (
    !usesLocalNodeModulesDir &&
    ArrayIsArray(options?.paths) &&
    request[0] !== "." &&
    request[0] !== "#" &&
    !request.startsWith("file:///") &&
    !op_require_is_request_relative(request) &&
    !op_require_path_is_absolute(request)
  ) {
    try {
      return Module._resolveFilename(request, parent, isMain, {
        ...options,
        paths: undefined,
      });
    } catch {
      // ignore
    }
  }

  // throw the original error
  throw err;
};

/**
 * Internal CommonJS API to always require modules before requiring the actual
 * one when calling `require("my-module")`. This is used by require hooks such
 * as `ts-node/register`.
 * @param {string[]} requests List of modules to preload
 */
Module._preloadModules = function (requests) {
  if (!ArrayIsArray(requests) || requests.length === 0) {
    return;
  }

  const parent = new Module("internal/preload", null);
  // All requested files must be resolved against cwd
  parent.paths = Module._nodeModulePaths(process.cwd());
  for (let i = 0; i < requests.length; i++) {
    parent.require(requests[i]);
  }
};

Module.prototype.load = function (filename) {
  if (this.loaded) {
    throw new Error("Module already loaded");
  }

  // Canonicalize the path so it's not pointing to the symlinked directory
  // in `node_modules` directory of the referrer.
  this.filename = op_require_real_path(filename);
  this.paths = Module._nodeModulePaths(
    pathDirname(this.filename),
  );
  const extension = findLongestRegisteredExtension(filename);
  Module._extensions[extension](this, this.filename);
  this.loaded = true;

  // TODO: do caching
};

// Loads a module at the given file path. Returns that module's
// `exports` property.
Module.prototype.require = function (id) {
  if (typeof id !== "string") {
    // TODO(bartlomieju): it should use different error type
    // ("ERR_INVALID_ARG_VALUE")
    throw new TypeError("Invalid argument type");
  }

  if (id === "") {
    // TODO(bartlomieju): it should use different error type
    // ("ERR_INVALID_ARG_VALUE")
    throw new TypeError("id must be non empty");
  }
  requireDepth++;
  try {
    return Module._load(id, this, /* isMain */ false);
  } finally {
    requireDepth--;
  }
};

// The module wrapper looks slightly different to Node. Instead of using one
// wrapper function, we use two. The first one exists to performance optimize
// access to magic node globals, like `Buffer`. The second one is the actual
// wrapper function we run the users code in. The only observable difference is
// that in Deno `arguments.callee` is not null.
Module.wrapper = [
  "(function (exports, require, module, __filename, __dirname, Buffer, clearImmediate, clearInterval, clearTimeout, global, setImmediate, setInterval, setTimeout, performance) { (function (exports, require, module, __filename, __dirname) {",
  "\n}).call(this, exports, require, module, __filename, __dirname); })",
];
Module.wrap = function (script) {
  script = script.replace(/^#!.*?\n/, "");
  return `${Module.wrapper[0]}${script}${Module.wrapper[1]}`;
};

function isEsmSyntaxError(error) {
  return error instanceof SyntaxError && (
    StringPrototypeIncludes(
      error.message,
      "Cannot use import statement outside a module",
    ) ||
    StringPrototypeIncludes(error.message, "Unexpected token 'export'")
  );
}

function enrichCJSError(error) {
  if (isEsmSyntaxError(error)) {
    console.error(
      'To load an ES module, set "type": "module" in the package.json or use ' +
        "the .mjs extension.",
    );
  }
}

function wrapSafe(
  filename,
  content,
  cjsModuleInstance,
  format,
) {
  const wrapper = Module.wrap(content);
  const [f, err] = core.evalContext(
    wrapper,
    url.pathToFileURL(filename).toString(),
    [format !== "module"],
  );
  if (err) {
    if (process.mainModule === cjsModuleInstance) {
      enrichCJSError(err.thrown);
    }
    throw err.thrown;
  }
  return f;
}

Module.prototype._compile = function (content, filename, format) {
  if (format === "module") {
    return loadESMFromCJS(this, filename, content);
  }

  let compiledWrapper;
  try {
    compiledWrapper = wrapSafe(filename, content, this, format);
  } catch (err) {
    if (
      format !== "commonjs" && err instanceof SyntaxError &&
      op_require_can_parse_as_esm(content)
    ) {
      return loadESMFromCJS(this, filename, content);
    }
    throw err;
  }

  const dirname = pathDirname(filename);
  const require = makeRequireFunction(this);
  const exports = this.exports;
  const thisValue = exports;
  if (requireDepth === 0) {
    statCache = new SafeMap();
  }

  if (hasInspectBrk && !hasBrokenOnInspectBrk) {
    hasBrokenOnInspectBrk = true;
    op_require_break_on_next_statement();
  }

  const {
    Buffer,
    clearImmediate,
    clearInterval,
    clearTimeout,
    global,
    setImmediate,
    setInterval,
    setTimeout,
    performance,
  } = nodeGlobals;

  const result = compiledWrapper.call(
    thisValue,
    exports,
    require,
    this,
    filename,
    dirname,
    Buffer,
    clearImmediate,
    clearInterval,
    clearTimeout,
    global,
    setImmediate,
    setInterval,
    setTimeout,
    performance,
  );
  if (requireDepth === 0) {
    statCache = null;
  }
  return result;
};

Module._extensions[".js"] = function (module, filename) {
  // We don't define everything on Module.extensions in
  // order to prevent probing for these files
  if (
    StringPrototypeEndsWith(filename, ".js") ||
    StringPrototypeEndsWith(filename, ".ts") ||
    StringPrototypeEndsWith(filename, ".jsx") ||
    StringPrototypeEndsWith(filename, ".tsx")
  ) {
    return loadMaybeCjs(module, filename);
  } else if (StringPrototypeEndsWith(filename, ".mts")) {
    return loadESMFromCJS(module, filename);
  } else if (StringPrototypeEndsWith(filename, ".cts")) {
    return loadCjs(module, filename);
  } else {
    return loadMaybeCjs(module, filename);
  }
};

Module._extensions[".cjs"] = loadCjs;
Module._extensions[".mjs"] = loadESMFromCJS;
Module._extensions[".wasm"] = loadESMFromCJS;

function loadMaybeCjs(module, filename) {
  const content = op_require_read_file(filename);
  const format = op_require_is_maybe_cjs(filename) ? undefined : "module";
  module._compile(content, filename, format);
}

function loadCjs(module, filename) {
  const content = op_require_read_file(filename);
  module._compile(content, filename, "commonjs");
}

function loadESMFromCJS(module, filename, code) {
  const namespace = op_import_sync(
    url.pathToFileURL(filename).toString(),
    code,
  );

  module.exports = namespace;
}

function stripBOM(content) {
  if (StringPrototypeCharCodeAt(content, 0) === 0xfeff) {
    content = StringPrototypeSlice(content, 1);
  }
  return content;
}

// Native extension for .json
Module._extensions[".json"] = function (module, filename) {
  const content = op_require_read_file(filename);

  try {
    module.exports = JSONParse(stripBOM(content));
  } catch (err) {
    err.message = filename + ": " + err.message;
    throw err;
  }
};

// Native extension for .node
Module._extensions[".node"] = function (module, filename) {
  if (filename.endsWith("cpufeatures.node")) {
    throw new Error("Using cpu-features module is currently not supported");
  }
  throw new Error("Not supported");
  // module.exports = op_napi_open(
  //   filename,
  //   globalThis,
  //   nodeGlobals.Buffer,
  //   reportError,
  // );
};

function createRequireFromPath(filename) {
  const proxyPath = op_require_proxy_path(filename);
  const mod = new Module(proxyPath);
  mod.filename = proxyPath;
  mod.paths = Module._nodeModulePaths(mod.path);
  return makeRequireFunction(mod);
}

function makeRequireFunction(mod) {
  const require = function require(path) {
    return mod.require(path);
  };

  function resolve(request, options) {
    return Module._resolveFilename(request, mod, false, options);
  }

  require.resolve = resolve;

  function paths(request) {
    return Module._resolveLookupPaths(request, mod);
  }

  resolve.paths = paths;
  require.main = mainModule;
  // Enable support to add extra extension types.
  require.extensions = Module._extensions;
  require.cache = Module._cache;

  return require;
}

// Matches to:
// - /foo/...
// - \foo\...
// - C:/foo/...
// - C:\foo\...
const RE_START_OF_ABS_PATH = /^([/\\]|[a-zA-Z]:[/\\])/;

function isAbsolute(filenameOrUrl) {
  return RE_START_OF_ABS_PATH.test(filenameOrUrl);
}

function createRequire(filenameOrUrl) {
  let fileUrlStr;
  if (filenameOrUrl instanceof URL) {
    if (filenameOrUrl.protocol !== "file:") {
      throw new Error(
        `The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received ${filenameOrUrl}`,
      );
    }
    fileUrlStr = filenameOrUrl.toString();
  } else if (typeof filenameOrUrl === "string") {
    if (!filenameOrUrl.startsWith("file:") && !isAbsolute(filenameOrUrl)) {
      throw new Error(
        `The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received ${filenameOrUrl}`,
      );
    }
    fileUrlStr = filenameOrUrl;
  } else {
    throw new Error(
      `The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received ${filenameOrUrl}`,
    );
  }
  const filename = op_require_as_file_path(fileUrlStr);
  return createRequireFromPath(filename);
}

function isBuiltin(moduleName) {
  if (typeof moduleName !== "string") {
    return false;
  }

  if (StringPrototypeStartsWith(moduleName, "node:")) {
    moduleName = StringPrototypeSlice(moduleName, 5);
  } else if (moduleName === "test") {
    // test is only a builtin if it has the "node:" scheme
    // see https://github.com/nodejs/node/blob/73025c4dec042e344eeea7912ed39f7b7c4a3991/test/parallel/test-module-isBuiltin.js#L14
    return false;
  }

  return moduleName in nativeModuleExports &&
    !StringPrototypeStartsWith(moduleName, "internal/");
}

function getBuiltinModule(id) {
  if (!isBuiltin(id)) {
    return undefined;
  }

  if (StringPrototypeStartsWith(id, "node:")) {
    // Slice 'node:' prefix
    id = StringPrototypeSlice(id, 5);
  }

  const mod = loadNativeModule(id, id);
  if (mod) {
    return mod.exports;
  }

  return undefined;
}

Module.isBuiltin = isBuiltin;

Module.createRequire = createRequire;

Module._initPaths = function () {
  const paths = op_require_init_paths();
  modulePaths = paths;
  Module.globalPaths = ArrayPrototypeSlice(modulePaths);
};

Module.syncBuiltinESMExports = function syncBuiltinESMExports() {
  throw new Error("not implemented");
};

// Mostly used by tools like ts-node.
Module.runMain = function () {
  Module._load(process.argv[1], null, true);
};

Module.Module = Module;

nativeModuleExports.module = Module;

function loadNativeModule(_id, request) {
  if (nativeModulePolyfill.has(request)) {
    return nativeModulePolyfill.get(request);
  }
  const modExports = nativeModuleExports[request];
  if (modExports) {
    const nodeMod = new Module(request);
    nodeMod.exports = modExports;
    nodeMod.loaded = true;
    nativeModulePolyfill.set(request, nodeMod);
    return nodeMod;
  }
  return undefined;
}

function nativeModuleCanBeRequiredByUsers(request) {
  return !!nativeModuleExports[request];
}

function readPackageScope() {
  throw new Error("not implemented");
}

/** @param specifier {string} */
function packageSpecifierSubPath(specifier) {
  let parts = StringPrototypeSplit(specifier, "/");
  if (StringPrototypeStartsWith(parts[0], "@")) {
    parts = ArrayPrototypeSlice(parts, 2);
  } else {
    parts = ArrayPrototypeSlice(parts, 1);
  }
  return ArrayPrototypeJoin(parts, "/");
}

// This is a temporary namespace, that will be removed when initializing
// in `02_init.js`.
internals.requireImpl = {
  setUsesLocalNodeModulesDir() {
    usesLocalNodeModulesDir = true;
  },
  setInspectBrk() {
    hasInspectBrk = true;
  },
  Module,
  nativeModuleExports,
};

/**
 * @param {string} path
 * @returns {SourceMap | undefined}
 */
export function findSourceMap(_path) {
  // TODO(@marvinhagemeister): Stub implementation for now to unblock ava
  return undefined;
}

Module.findSourceMap = findSourceMap;

/**
 * @param {string | URL} _specifier
 * @param {string | URL} _parentUrl
 * @param {{ parentURL: string | URL, data: any, transferList: any[] }} [_options]
 */
export function register(_specifier, _parentUrl, _options) {
  // TODO(@marvinhagemeister): Stub implementation for programs registering
  // TypeScript loaders. We don't support registering loaders for file
  // types that Deno itself doesn't support at the moment.

  return undefined;
}

export { builtinModules, createRequire, getBuiltinModule, isBuiltin, Module };
export const _cache = Module._cache;
export const _extensions = Module._extensions;
export const _findPath = Module._findPath;
export const _initPaths = Module._initPaths;
export const _load = Module._load;
export const _nodeModulePaths = Module._nodeModulePaths;
export const _pathCache = Module._pathCache;
export const _preloadModules = Module._preloadModules;
export const _resolveFilename = Module._resolveFilename;
export const _resolveLookupPaths = Module._resolveLookupPaths;
export const globalPaths = Module.globalPaths;
export const wrap = Module.wrap;

export default Module;
