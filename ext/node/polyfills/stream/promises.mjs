// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

import { Stream } from "ext:deno_node/_stream.mjs";

const { finished, pipeline } = Stream.promises;

export default {
  finished,
  pipeline,
};
export { finished, pipeline };
