// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// deno-lint-ignore-file

import {
  AbortError,
  ERR_INVALID_ARG_TYPE,
} from "ext:deno_node/internal/errors.ts";
import eos from "ext:deno_node/internal/streams/end-of-stream.mjs";

// This method is inlined here for readable-stream
// It also does not allow for signal to not exist on the stream
// https://github.com/nodejs/node/pull/36061#discussion_r533718029
const validateAbortSignal = (signal, name) => {
  if (
    typeof signal !== "object" ||
    !("aborted" in signal)
  ) {
    throw new ERR_INVALID_ARG_TYPE(name, "AbortSignal", signal);
  }
};

function isStream(obj) {
  return !!(obj && typeof obj.pipe === "function");
}

function addAbortSignal(signal, stream) {
  validateAbortSignal(signal, "signal");
  if (!isStream(stream)) {
    throw new ERR_INVALID_ARG_TYPE("stream", "stream.Stream", stream);
  }
  return addAbortSignalNoValidate(signal, stream);
}
function addAbortSignalNoValidate(signal, stream) {
  if (typeof signal !== "object" || !("aborted" in signal)) {
    return stream;
  }
  const onAbort = () => {
    stream.destroy(new AbortError());
  };
  if (signal.aborted) {
    onAbort();
  } else {
    signal.addEventListener("abort", onAbort);
    eos(stream, () => signal.removeEventListener("abort", onAbort));
  }
  return stream;
}

export default { addAbortSignal, addAbortSignalNoValidate };
export { addAbortSignal, addAbortSignalNoValidate };
