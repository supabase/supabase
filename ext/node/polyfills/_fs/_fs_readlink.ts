// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { TextEncoder } from "ext:deno_web/08_text_encoding.js";
import { MaybeEmpty, notImplemented } from "ext:deno_node/_utils.ts";
import { pathFromURL } from "ext:deno_web/00_infra.js";
import { promisify } from "ext:deno_node/internal/util.mjs";
import { denoErrorToNodeError } from "ext:deno_node/internal/errors.ts";

type ReadlinkCallback = (
  err: MaybeEmpty<Error>,
  linkString: MaybeEmpty<string | Uint8Array>,
) => void;

interface ReadlinkOptions {
  encoding?: string | null;
}

function maybeEncode(
  data: string,
  encoding: string | null,
): string | Uint8Array {
  if (encoding === "buffer") {
    return new TextEncoder().encode(data);
  }
  return data;
}

function getEncoding(
  optOrCallback?: ReadlinkOptions | ReadlinkCallback,
): string | null {
  if (!optOrCallback || typeof optOrCallback === "function") {
    return null;
  } else {
    if (optOrCallback.encoding) {
      if (
        optOrCallback.encoding === "utf8" ||
        optOrCallback.encoding === "utf-8"
      ) {
        return "utf8";
      } else if (optOrCallback.encoding === "buffer") {
        return "buffer";
      } else {
        notImplemented(`fs.readlink encoding=${optOrCallback.encoding}`);
      }
    }
    return null;
  }
}

export function readlink(
  path: string | URL,
  optOrCallback: ReadlinkCallback | ReadlinkOptions,
  callback?: ReadlinkCallback,
) {
  path = path instanceof URL ? pathFromURL(path) : path;

  let cb: ReadlinkCallback | undefined;
  if (typeof optOrCallback === "function") {
    cb = optOrCallback;
  } else {
    cb = callback;
  }

  const encoding = getEncoding(optOrCallback);

  Deno.readLink(path).then((data: string) => {
    const res = maybeEncode(data, encoding);
    if (cb) cb(null, res);
  }, (err: Error) => {
    if (cb) {
      (cb as (e: Error) => void)(denoErrorToNodeError(err, {
        syscall: "readlink",
        path,
      }));
    }
  });
}

export const readlinkPromise = promisify(readlink) as (
  path: string | URL,
  opt?: ReadlinkOptions,
) => Promise<string | Uint8Array>;

export function readlinkSync(
  path: string | URL,
  opt?: ReadlinkOptions,
): string | Uint8Array {
  path = path instanceof URL ? pathFromURL(path) : path;

  try {
    return maybeEncode(Deno.readLinkSync(path), getEncoding(opt));
  } catch (error) {
    throw denoErrorToNodeError(error, {
      syscall: "readlink",
      path,
    });
  }
}
