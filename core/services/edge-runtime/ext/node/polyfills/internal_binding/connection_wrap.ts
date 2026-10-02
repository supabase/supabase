// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// This module ports:
// - https://github.com/nodejs/node/blob/master/src/connection_wrap.cc
// - https://github.com/nodejs/node/blob/master/src/connection_wrap.h

import { LibuvStreamWrap } from "ext:deno_node/internal_binding/stream_wrap.ts";
import {
  AsyncWrap,
  providerType,
} from "ext:deno_node/internal_binding/async_wrap.ts";

interface Reader {
  read(p: Uint8Array): Promise<number | null>;
}

interface Writer {
  write(p: Uint8Array): Promise<number>;
}

export interface Closer {
  close(): void;
}

type Ref = { ref(): void; unref(): void };

export class ConnectionWrap extends LibuvStreamWrap {
  /** Optional connection callback. */
  onconnection: ((status: number, handle?: ConnectionWrap) => void) | null =
    null;

  /**
   * Creates a new ConnectionWrap class instance.
   * @param provider Provider type.
   * @param object Optional stream object.
   */
  constructor(
    provider: providerType,
    object?: Reader & Writer & Closer & Ref,
  ) {
    super(provider, object);
  }

  /**
   * @param req A connect request.
   * @param status An error status code.
   */
  afterConnect<
    T extends AsyncWrap & {
      oncomplete(
        status: number,
        handle: ConnectionWrap,
        req: T,
        readable: boolean,
        writeable: boolean,
      ): void;
    },
  >(
    req: T,
    status: number,
  ) {
    const isSuccessStatus = !status;
    const readable = isSuccessStatus;
    const writable = isSuccessStatus;

    try {
      req.oncomplete(status, this, req, readable, writable);
    } catch {
      // swallow callback errors.
    }

    return;
  }
}
