// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// deno-lint-ignore-file prefer-primordials

import type { CallbackWithError } from "ext:deno_node/_fs/_fs_common.ts";
import { type Buffer } from "node:buffer";
import { primordials } from "ext:core/mod.js";
import { op_node_lutimes, op_node_lutimes_sync } from "ext:core/ops";
import { promisify } from "ext:deno_node/internal/util.mjs";
import {
  getValidatedPath,
  toUnixTimestamp,
} from "ext:deno_node/internal/fs/utils.mjs";

const { MathTrunc } = primordials;

type TimeLike = number | string | Date;
type PathLike = string | Buffer | URL;

function getValidUnixTime(
  value: TimeLike,
  name: string,
): [number, number] {
  if (typeof value === "string") {
    value = Number(value);
  }

  if (
    typeof value === "number" &&
    (Number.isNaN(value) || !Number.isFinite(value))
  ) {
    throw new Deno.errors.InvalidData(
      `invalid ${name}, must not be infinity or NaN`,
    );
  }

  const unixSeconds = toUnixTimestamp(value);

  const seconds = MathTrunc(unixSeconds);
  const nanoseconds = MathTrunc((unixSeconds * 1e3) - (seconds * 1e3)) * 1e6;

  return [
    seconds,
    nanoseconds,
  ];
}

export function lutimes(
  path: PathLike,
  atime: TimeLike,
  mtime: TimeLike,
  callback: CallbackWithError,
): void {
  if (!callback) {
    throw new Error("No callback function supplied");
  }
  const [atimeSecs, atimeNanos] = getValidUnixTime(atime, "atime");
  const [mtimeSecs, mtimeNanos] = getValidUnixTime(mtime, "mtime");

  path = getValidatedPath(path).toString();

  op_node_lutimes(path, atimeSecs, atimeNanos, mtimeSecs, mtimeNanos).then(
    () => callback(null),
    callback,
  );
}

export function lutimesSync(
  path: PathLike,
  atime: TimeLike,
  mtime: TimeLike,
): void {
  const { 0: atimeSecs, 1: atimeNanos } = getValidUnixTime(atime, "atime");
  const { 0: mtimeSecs, 1: mtimeNanos } = getValidUnixTime(mtime, "mtime");

  path = getValidatedPath(path).toString();

  op_node_lutimes_sync(path, atimeSecs, atimeNanos, mtimeSecs, mtimeNanos);
}

export const lutimesPromise = promisify(lutimes) as (
  path: PathLike,
  atime: TimeLike,
  mtime: TimeLike,
) => Promise<void>;
