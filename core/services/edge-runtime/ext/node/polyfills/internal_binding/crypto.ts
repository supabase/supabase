// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.

import { notImplemented } from "ext:deno_node/_utils.ts";

export { timingSafeEqual } from "ext:deno_node/internal_binding/_timingSafeEqual.ts";

export function getFipsCrypto(): boolean {
  notImplemented("crypto.getFipsCrypto");
}

export function setFipsCrypto(_fips: boolean) {
  notImplemented("crypto.setFipsCrypto");
}
