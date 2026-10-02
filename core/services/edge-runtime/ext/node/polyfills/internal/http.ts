// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { setUnrefTimeout } from "node:timers";
import { notImplemented } from "ext:deno_node/_utils.ts";

let utcCache: string | undefined;

export function utcDate() {
  if (!utcCache) cache();
  return utcCache;
}

function cache() {
  const d = new Date();
  utcCache = d.toUTCString();
  setUnrefTimeout(resetCache, 1000 - d.getMilliseconds());
}

function resetCache() {
  utcCache = undefined;
}

export function emitStatistics(
  _statistics: { startTime: [number, number] } | null,
) {
  notImplemented("internal/http.emitStatistics");
}

export const kOutHeaders = Symbol("kOutHeaders");
export const kNeedDrain = Symbol("kNeedDrain");

export default {
  utcDate,
  emitStatistics,
  kOutHeaders,
  kNeedDrain,
};
