// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
/*
MIT License

Copyright (c) 2018 cryptocoinjs

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { Buffer } from "node:buffer";
import { HASH_DATA } from "ext:deno_node/internal/crypto/types.ts";
import { op_node_scrypt_async, op_node_scrypt_sync } from "ext:core/ops";

type Opts = Partial<{
  N: number;
  cost: number;
  p: number;
  parallelization: number;
  r: number;
  blockSize: number;
  maxmem: number;
}>;

const fixOpts = (opts?: Opts) => {
  const out = { N: 16384, p: 1, r: 8, maxmem: 32 << 20 };
  if (!opts) return out;

  if (opts.N) out.N = opts.N;
  else if (opts.cost) out.N = opts.cost;

  if (opts.p) out.p = opts.p;
  else if (opts.parallelization) out.p = opts.parallelization;

  if (opts.r) out.r = opts.r;
  else if (opts.blockSize) out.r = opts.blockSize;

  if (opts.maxmem) out.maxmem = opts.maxmem;

  return out;
};

export function scryptSync(
  password: HASH_DATA,
  salt: HASH_DATA,
  keylen: number,
  _opts?: Opts,
): Buffer {
  const { N, r, p, maxmem } = fixOpts(_opts);

  const blen = p * 128 * r;

  if (32 * r * (N + 2) * 4 + blen > maxmem) {
    throw new Error("exceeds max memory");
  }

  const buf = Buffer.alloc(keylen);
  op_node_scrypt_sync(
    password,
    salt,
    keylen,
    Math.log2(N),
    r,
    p,
    maxmem,
    buf.buffer,
  );

  return buf;
}

type Callback = (err: unknown, result?: Buffer) => void;

export function scrypt(
  password: HASH_DATA,
  salt: HASH_DATA,
  keylen: number,
  _opts: Opts | null | Callback,
  cb?: Callback,
) {
  if (!cb) {
    cb = _opts as Callback;
    _opts = null;
  }
  const { N, r, p, maxmem } = fixOpts(_opts as Opts);

  const blen = p * 128 * r;
  if (32 * r * (N + 2) * 4 + blen > maxmem) {
    throw new Error("exceeds max memory");
  }

  try {
    op_node_scrypt_async(
      password,
      salt,
      keylen,
      Math.log2(N),
      r,
      p,
      maxmem,
    ).then(
      (buf: Uint8Array) => {
        cb(null, Buffer.from(buf.buffer));
      },
    );
  } catch (err: unknown) {
    return cb(err);
  }
}

export default {
  scrypt,
  scryptSync,
};
