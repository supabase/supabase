// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { ERR_INTERNAL_ASSERTION } from "ext:deno_node/internal/errors.ts";

function assert(value, message) {
  if (!value) {
    throw new ERR_INTERNAL_ASSERTION(message);
  }
}

function fail(message) {
  throw new ERR_INTERNAL_ASSERTION(message);
}

assert.fail = fail;

export default assert;
