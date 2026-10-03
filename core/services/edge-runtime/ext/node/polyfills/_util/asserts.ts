// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { primordials } from "ext:core/mod.js";
const {
  Error,
} = primordials;

/** Assertion error class for node compat layer's internal code. */
export class NodeCompatAssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NodeCompatAssertionError";
  }
}

/** Make an assertion, if not `true`, then throw. */
export function assert(expr: unknown, msg = ""): asserts expr {
  if (!expr) {
    throw new NodeCompatAssertionError(msg);
  }
}

/** Use this to assert unreachable code. */
export function unreachable(): never {
  throw new NodeCompatAssertionError("unreachable");
}
