// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// deno-lint-ignore-file

import { Writable } from "ext:deno_node/_stream.mjs";
const { WritableState, fromWeb, toWeb } = Writable;

export default Writable;
export { fromWeb, toWeb, WritableState };
