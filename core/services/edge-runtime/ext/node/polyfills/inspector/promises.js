// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

import inspector from "node:inspector";
import { promisify } from "ext:deno_node/internal/util.mjs";

class Session extends inspector.Session {
  constructor() {
    super();
  }
}
Session.prototype.post = promisify(inspector.Session.prototype.post);

export * from "node:inspector";
export { Session };

export default {
  ...inspector,
  Session,
};
