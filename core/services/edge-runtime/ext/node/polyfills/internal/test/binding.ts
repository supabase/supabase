// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.
import { getBinding } from "ext:deno_node/internal_binding/mod.ts";
import type { BindingName } from "ext:deno_node/internal_binding/mod.ts";

export function internalBinding(name: BindingName) {
  return getBinding(name);
}

// TODO(kt3k): export actual primordials
export const primordials = {};

export default {
  internalBinding,
  primordials,
};
