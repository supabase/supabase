// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { Console } from "ext:deno_node/internal/console/constructor.mjs";
import * as DenoConsole from "ext:deno_console/01_console.js";
import { nonEnumerable } from "ext:runtime/fieldUtils.js";

import { core } from "ext:core/mod.js";

// Don't rely on global `console` because during bootstrapping, it is pointing
// to native `console` object provided by V8.
const _intConsole = nonEnumerable(
  new DenoConsole.Console((msg, level) => core.print(msg, level > 1)),
);
const console = _intConsole.value;

export default Object.assign({}, console, { Console });

export { Console };
export const {
  assert,
  clear,
  count,
  countReset,
  debug,
  dir,
  dirxml,
  error,
  group,
  groupCollapsed,
  groupEnd,
  info,
  log,
  profile,
  profileEnd,
  table,
  time,
  timeEnd,
  timeLog,
  timeStamp,
  trace,
  warn,
} = console;
// deno-lint-ignore no-explicit-any
export const indentLevel = (console as any)?.indentLevel;
