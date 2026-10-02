// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use ring::digest::Context;
use ring::digest::SHA256;

/// Generate a SHA256 checksum of a slice of byte-slice-like things.
pub fn gen(v: &[impl AsRef<[u8]>]) -> String {
  let mut ctx = Context::new(&SHA256);
  for src in v {
    ctx.update(src.as_ref());
  }
  faster_hex::hex_string(ctx.finish().as_ref())
}
