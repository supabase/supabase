// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.

// The following are all the process APIs that don't depend on the stream module
// They have to be split this way to prevent a circular dependency

import { core, primordials } from "ext:core/mod.js";
const {
  Error,
  ObjectGetOwnPropertyNames,
  String,
  ReflectOwnKeys,
  ArrayPrototypeIncludes,
  Object,
  Proxy,
  ObjectPrototype,
  ObjectPrototypeIsPrototypeOf,
  TypeErrorPrototype,
} = primordials;
const { build } = core;

import { nextTick as _nextTick } from "ext:deno_node/_next_tick.ts";
import { _exiting } from "ext:deno_node/_process/exiting.ts";
import * as fs from "ext:deno_fs/30_fs.js";

/** Returns the operating system CPU architecture for which the Deno binary was compiled */
export function arch(): string {
  if (build.arch == "x86_64") {
    return "x64";
  } else if (build.arch == "aarch64") {
    return "arm64";
  } else if (build.arch == "riscv64gc") {
    return "riscv64";
  } else {
    throw new Error("unreachable");
  }
}

/** https://nodejs.org/api/process.html#process_process_chdir_directory */
export const chdir = fs.chdir;

/** https://nodejs.org/api/process.html#process_process_cwd */
export const cwd = fs.cwd;

/** https://nodejs.org/api/process.html#process_process_nexttick_callback_args */
export const nextTick = _nextTick;

/** Wrapper of Deno.env.get, which doesn't throw type error when
 * the env name has "=" or "\0" in it. */
function denoEnvGet(name: string) {
  try {
    return Deno.env.get(name);
  } catch (e) {
    if (
      ObjectPrototypeIsPrototypeOf(TypeErrorPrototype, e) ||
      // TODO(iuioiua): Use `NotCapablePrototype` when it's available
      ObjectPrototypeIsPrototypeOf(Deno.errors.NotCapable.prototype, e)
    ) {
      return undefined;
    }
    throw e;
  }
}

const OBJECT_PROTO_PROP_NAMES = ObjectGetOwnPropertyNames(ObjectPrototype);
/**
 * https://nodejs.org/api/process.html#process_process_env
 * Requires env permissions
 */
export const env: InstanceType<ObjectConstructor> & Record<string, string> =
  new Proxy(Object(), {
    get: (target, prop) => {
      if (typeof prop === "symbol") {
        return target[prop];
      }

      const envValue = denoEnvGet(prop);

      if (envValue) {
        return envValue;
      }

      if (ArrayPrototypeIncludes(OBJECT_PROTO_PROP_NAMES, prop)) {
        return target[prop];
      }

      return envValue;
    },
    ownKeys: () => ReflectOwnKeys(Deno.env.toObject()),
    getOwnPropertyDescriptor: (_target, name) => {
      const value = denoEnvGet(String(name));
      if (value) {
        return {
          enumerable: true,
          configurable: true,
          value,
        };
      }
    },
    set(_target, prop, value) {
      Deno.env.set(String(prop), String(value));
      return true; // success
    },
    has: (_target, prop) => typeof denoEnvGet(String(prop)) === "string",
    deleteProperty(_target, key) {
      Deno.env.delete(String(key));
      return true;
    },
  });

/**
 * https://nodejs.org/api/process.html#process_process_version
 *
 * This value is hard coded to latest stable release of Node, as
 * some packages are checking it for compatibility. Previously
 * it pointed to Deno version, but that led to incompability
 * with some packages.
 */
export const version = "v20.11.1";

/**
 * https://nodejs.org/api/process.html#process_process_versions
 *
 * This value is hard coded to latest stable release of Node, as
 * some packages are checking it for compatibility. Previously
 * it contained only output of `Deno.version`, but that led to incompability
 * with some packages. Value of `v8` field is still taken from `Deno.version`.
 */
export const versions = {
  node: "20.11.1",
  uv: "1.43.0",
  zlib: "1.2.11",
  brotli: "1.0.9",
  ares: "1.18.1",
  modules: "108",
  nghttp2: "1.47.0",
  napi: "8",
  llhttp: "6.0.10",
  openssl: "3.0.7+quic",
  cldr: "41.0",
  icu: "71.1",
  tz: "2022b",
  unicode: "14.0",
  ngtcp2: "0.8.1",
  nghttp3: "0.7.0",
  // Will be filled when calling "__bootstrapNodeProcess()",
  deno: "",
  v8: "",
  typescript: "",
};
