// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This file contains C++ node globals accessed in internal binding calls

/**
 * Adapted from
 * https://github.com/nodejs/node/blob/3b72788afb7365e10ae1e97c71d1f60ee29f09f2/src/node.h#L728-L738
 */
export enum Encodings {
  ASCII, // 0
  UTF8, // 1
  BASE64, // 2
  UCS2, // 3
  BINARY, // 4
  HEX, // 5
  BUFFER, // 6
  BASE64URL, // 7
  LATIN1 = 4, // 4 = BINARY
}
