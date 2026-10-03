// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { fileURLToPath } from "node:url";
import { Buffer } from "node:buffer";

const searchParams = Symbol("query");

export function toPathIfFileURL(
  fileURLOrPath: string | Buffer | URL,
): string | Buffer {
  if (!(fileURLOrPath instanceof URL)) {
    return fileURLOrPath;
  }
  return fileURLToPath(fileURLOrPath);
}

// Utility function that converts a URL object into an ordinary
// options object as expected by the http.request and https.request
// APIs.
// deno-lint-ignore no-explicit-any
export function urlToHttpOptions(url: any): any {
  // deno-lint-ignore no-explicit-any
  const options: any = {
    protocol: url.protocol,
    hostname: typeof url.hostname === "string" &&
        url.hostname.startsWith("[")
      ? url.hostname.slice(1, -1)
      : url.hostname,
    hash: url.hash,
    search: url.search,
    pathname: url.pathname,
    path: `${url.pathname || ""}${url.search || ""}`,
    href: url.href,
  };
  if (url.port !== "") {
    options.port = Number(url.port);
  }
  if (url.username || url.password) {
    options.auth = `${decodeURIComponent(url.username)}:${
      decodeURIComponent(url.password)
    }`;
  }
  return options;
}

export { searchParams as searchParamsSymbol };

export default {
  toPathIfFileURL,
};
