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

import { primordials } from "ext:core/mod.js";
import { AsyncWrap } from "ext:deno_node/internal_binding/async_wrap.ts";

const {
  ObjectDefineProperty,
  ObjectEntries,
  ObjectSetPrototypeOf,
  SafeArrayIterator,
} = primordials;

export const methods = [
  "DELETE",
  "GET",
  "HEAD",
  "POST",
  "PUT",
  "CONNECT",
  "OPTIONS",
  "TRACE",
  "COPY",
  "LOCK",
  "MKCOL",
  "MOVE",
  "PROPFIND",
  "PROPPATCH",
  "SEARCH",
  "UNLOCK",
  "BIND",
  "REBIND",
  "UNBIND",
  "ACL",
  "REPORT",
  "MKACTIVITY",
  "CHECKOUT",
  "MERGE",
  "M-SEARCH",
  "NOTIFY",
  "SUBSCRIBE",
  "UNSUBSCRIBE",
  "PATCH",
  "PURGE",
  "MKCALENDAR",
  "LINK",
  "UNLINK",
  "SOURCE",
  "QUERY",
];

export const allMethods = [
  "DELETE",
  "GET",
  "HEAD",
  "POST",
  "PUT",
  "CONNECT",
  "OPTIONS",
  "TRACE",
  "COPY",
  "LOCK",
  "MKCOL",
  "MOVE",
  "PROPFIND",
  "PROPPATCH",
  "SEARCH",
  "UNLOCK",
  "BIND",
  "REBIND",
  "UNBIND",
  "ACL",
  "REPORT",
  "MKACTIVITY",
  "CHECKOUT",
  "MERGE",
  "M-SEARCH",
  "NOTIFY",
  "SUBSCRIBE",
  "UNSUBSCRIBE",
  "PATCH",
  "PURGE",
  "MKCALENDAR",
  "LINK",
  "UNLINK",
  "SOURCE",
  "PRI",
  "DESCRIBE",
  "ANNOUNCE",
  "SETUP",
  "PLAY",
  "PAUSE",
  "TEARDOWN",
  "GET_PARAMETER",
  "SET_PARAMETER",
  "REDIRECT",
  "RECORD",
  "FLUSH",
  "QUERY",
];

export function HTTPParser() {
}

ObjectSetPrototypeOf(HTTPParser.prototype, AsyncWrap.prototype);

function defineProps(obj: object, props: Record<string, unknown>) {
  for (const entry of new SafeArrayIterator(ObjectEntries(props))) {
    ObjectDefineProperty(obj, entry[0], {
      __proto__: null,
      value: entry[1],
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }
}

defineProps(HTTPParser, {
  REQUEST: 1,
  RESPONSE: 2,
  kOnMessageBegin: 0,
  kOnHeaders: 1,
  kOnHeadersComplete: 2,
  kOnBody: 3,
  kOnMessageComplete: 4,
  kOnExecute: 5,
  kOnTimeout: 6,
  kLenientNone: 0,
  kLenientHeaders: 1,
  kLenientChunkedLength: 2,
  kLenientKeepAlive: 4,
  kLenientTransferEncoding: 8,
  kLenientVersion: 16,
  kLenientDataAfterClose: 32,
  kLenientOptionalLFAfterCR: 64,
  kLenientOptionalCRLFAfterChunk: 128,
  kLenientOptionalCRBeforeLF: 256,
  kLenientSpacesAfterChunkSize: 512,
  kLenientAll: 1023,
});
