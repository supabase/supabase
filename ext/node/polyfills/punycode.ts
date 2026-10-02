// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import {
  op_node_idna_punycode_decode,
  op_node_idna_punycode_encode,
  op_node_idna_punycode_to_ascii,
  op_node_idna_punycode_to_unicode,
} from "ext:core/ops";

import { deprecate } from "node:util";

import { ucs2 } from "ext:deno_node/internal/idna.ts";

const version = "2.1.0";

// deno-lint-ignore no-explicit-any
function punyDeprecated(fn: any) {
  return deprecate(
    fn,
    "The `punycode` module is deprecated. Please use a userland " +
      "alternative instead.",
    "DEP0040",
  );
}

function toASCII(domain) {
  return punyDeprecated(op_node_idna_punycode_to_ascii)(domain);
}

function toUnicode(domain) {
  return punyDeprecated(op_node_idna_punycode_to_unicode)(domain);
}

function decode(domain) {
  return punyDeprecated(op_node_idna_punycode_decode)(domain);
}

function encode(domain) {
  return punyDeprecated(op_node_idna_punycode_encode)(domain);
}

export { decode, encode, toASCII, toUnicode, ucs2, version };

export default {
  decode,
  encode,
  toASCII,
  toUnicode,
  ucs2,
  version,
};
