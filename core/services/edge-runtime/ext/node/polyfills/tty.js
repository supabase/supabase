// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { op_bootstrap_color_depth } from "ext:core/ops";
import { core, primordials } from "ext:core/mod.js";
const {
  Error,
} = primordials;
const {
  isTerminal,
} = core;

import { ERR_INVALID_FD } from "ext:deno_node/internal/errors.ts";
import {
  kStreamBaseField,
  LibuvStreamWrap,
} from "ext:deno_node/internal_binding/stream_wrap.ts";
import { providerType } from "ext:deno_node/internal_binding/async_wrap.ts";
import { Socket } from "node:net";
import { setReadStream } from "ext:deno_node/_process/streams.mjs";
import * as io from "ext:deno_io/12_io.js";

// Returns true when the given numeric fd is associated with a TTY and false otherwise.
function isatty(fd) {
  if (typeof fd !== "number") {
    return false;
  }
  try {
    /**
     * TODO: Treat `fd` as real file descriptors. Currently, `rid` 0, 1, 2
     * correspond to `fd` 0, 1, 2 (stdin, stdout, stderr). This may change in
     * the future.
     */
    return isTerminal(fd);
  } catch (_) {
    return false;
  }
}

class TTY extends LibuvStreamWrap {
  constructor(handle) {
    super(providerType.TTYWRAP, handle);
  }

  ref() {
    this[kStreamBaseField][io.REF]();
  }

  unref() {
    this[kStreamBaseField][io.UNREF]();
  }
}

export class ReadStream extends Socket {
  constructor(fd, options) {
    if (fd >> 0 !== fd || fd < 0) {
      throw new ERR_INVALID_FD(fd);
    }

    // We only support `stdin`.
    if (fd != 0) throw new Error("Only fd 0 is supported.");

    const tty = new TTY(io.stdin);
    super({
      readableHighWaterMark: 0,
      handle: tty,
      manualStart: true,
      ...options,
    });

    this.isRaw = false;
    this.isTTY = true;
  }

  setRawMode(flag) {
    flag = !!flag;
    this._handle.setRaw(flag);

    this.isRaw = flag;
    return this;
  }
}

setReadStream(ReadStream);

export class WriteStream extends Socket {
  constructor(fd) {
    if (fd >> 0 !== fd || fd < 0) {
      throw new ERR_INVALID_FD(fd);
    }

    // We only support `stdin`, `stdout` and `stderr`.
    if (fd > 2) throw new Error("Only fd 0, 1 and 2 are supported.");

    const tty = new TTY(
      fd === 0 ? io.stdin : fd === 1 ? io.stdout : io.stderr,
    );

    super({
      readableHighWaterMark: 0,
      handle: tty,
      manualStart: true,
    });

    const { columns, rows } = Deno.consoleSize();
    this.columns = columns;
    this.rows = rows;
    this.isTTY = true;
  }

  /**
   * @param {number | Record<string, string>} [count]
   * @param {Record<string, string>} [env]
   * @returns {boolean}
   */
  hasColors(count, env) {
    if (
      env === undefined &&
      (count === undefined || typeof count === "object" && count !== null)
    ) {
      env = count;
      count = 16;
    }

    const depth = this.getColorDepth(env);
    return count <= 2 ** depth;
  }

  /**
   * @param {Record<string, string} [env]
   * @returns {1 | 4 | 8 | 24}
   */
  getColorDepth(_env) {
    // TODO(@marvinhagemeister): Ignore env parameter.
    // Haven't seen it used anywhere, seems more done
    // to make testing easier in Node
    return op_bootstrap_color_depth();
  }
}

export { isatty };
export default { isatty, WriteStream, ReadStream };
