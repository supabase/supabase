// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Node.js contributors. All rights reserved. MIT License.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { TextDecoder, TextEncoder } from "ext:deno_web/08_text_encoding.js";
import { existsSync } from "ext:deno_node/_fs/_fs_exists.ts";
import { mkdir, mkdirSync } from "ext:deno_node/_fs/_fs_mkdir.ts";
import {
  ERR_INVALID_ARG_TYPE,
  ERR_INVALID_OPT_VALUE_ENCODING,
} from "ext:deno_node/internal/errors.ts";
import { promisify } from "ext:deno_node/internal/util.mjs";

export type mkdtempCallback = (
  err: Error | null,
  directory?: string,
) => void;

// https://nodejs.org/dist/latest-v15.x/docs/api/fs.html#fs_fs_mkdtemp_prefix_options_callback
export function mkdtemp(prefix: string, callback: mkdtempCallback): void;
export function mkdtemp(
  prefix: string,
  options: { encoding: string } | string,
  callback: mkdtempCallback,
): void;
export function mkdtemp(
  prefix: string,
  optionsOrCallback: { encoding: string } | string | mkdtempCallback,
  maybeCallback?: mkdtempCallback,
) {
  const callback: mkdtempCallback | undefined =
    typeof optionsOrCallback == "function" ? optionsOrCallback : maybeCallback;
  if (!callback) {
    throw new ERR_INVALID_ARG_TYPE("callback", "function", callback);
  }

  const encoding: string | undefined = parseEncoding(optionsOrCallback);
  const path = tempDirPath(prefix);

  mkdir(
    path,
    { recursive: false, mode: 0o700 },
    (err: Error | null | undefined) => {
      if (err) callback(err);
      else callback(null, decode(path, encoding));
    },
  );
}

export const mkdtempPromise = promisify(mkdtemp) as (
  prefix: string,
  options?: { encoding: string } | string,
) => Promise<string>;

// https://nodejs.org/dist/latest-v15.x/docs/api/fs.html#fs_fs_mkdtempsync_prefix_options
export function mkdtempSync(
  prefix: string,
  options?: { encoding: string } | string,
): string {
  const encoding: string | undefined = parseEncoding(options);
  const path = tempDirPath(prefix);

  mkdirSync(path, { recursive: false, mode: 0o700 });
  return decode(path, encoding);
}

function parseEncoding(
  optionsOrCallback?: { encoding: string } | string | mkdtempCallback,
): string | undefined {
  let encoding: string | undefined;
  if (typeof optionsOrCallback == "function") encoding = undefined;
  else if (optionsOrCallback instanceof Object) {
    encoding = optionsOrCallback?.encoding;
  } else encoding = optionsOrCallback;

  if (encoding) {
    try {
      new TextDecoder(encoding);
    } catch {
      throw new ERR_INVALID_OPT_VALUE_ENCODING(encoding);
    }
  }

  return encoding;
}

function decode(str: string, encoding?: string): string {
  if (!encoding) return str;
  else {
    const decoder = new TextDecoder(encoding);
    const encoder = new TextEncoder();
    return decoder.decode(encoder.encode(str));
  }
}

const CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function randomName(): string {
  return [...Array(6)].map(() =>
    CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join("");
}

function tempDirPath(prefix: string): string {
  let path: string;
  do {
    path = prefix + randomName();
  } while (existsSync(path));

  return path;
}
