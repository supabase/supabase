// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

import { primordials } from "ext:core/mod.js";
const {
  RegExpPrototypeTest,
  SafeRegExp,
  Symbol,
} = primordials;
import { HTTPParser } from "ext:deno_node/internal_binding/http_parser.ts";

export const CRLF = "\r\n";
export const kIncomingMessage = Symbol("IncomingMessage");
const tokenRegExp = new SafeRegExp(/^[\^_`a-zA-Z\-0-9!#$%&'*+.|~]+$/);

export const methods = [
  "ACL",
  "BIND",
  "CHECKOUT",
  "CONNECT",
  "COPY",
  "DELETE",
  "GET",
  "HEAD",
  "LINK",
  "LOCK",
  "M-SEARCH",
  "MERGE",
  "MKACTIVITY",
  "MKCALENDAR",
  "MKCOL",
  "MOVE",
  "NOTIFY",
  "OPTIONS",
  "PATCH",
  "POST",
  "PROPFIND",
  "PROPPATCH",
  "PURGE",
  "PUT",
  "REBIND",
  "REPORT",
  "SEARCH",
  "SOURCE",
  "SUBSCRIBE",
  "TRACE",
  "UNBIND",
  "UNLINK",
  "UNLOCK",
  "UNSUBSCRIBE",
];

/**
 * Verifies that the given val is a valid HTTP token
 * per the rules defined in RFC 7230
 * See https://tools.ietf.org/html/rfc7230#section-3.2.6
 */
function checkIsHttpToken(val: string) {
  return RegExpPrototypeTest(tokenRegExp, val);
}

const headerCharRegex = new SafeRegExp(/[^\t\x20-\x7e\x80-\xff]/);
/**
 * True if val contains an invalid field-vchar
 *  field-value    = *( field-content / obs-fold )
 *  field-content  = field-vchar [ 1*( SP / HTAB ) field-vchar ]
 *  field-vchar    = VCHAR / obs-text
 */
function checkInvalidHeaderChar(val: string) {
  return RegExpPrototypeTest(headerCharRegex, val);
}

export const chunkExpression = new SafeRegExp(/(?:^|\W)chunked(?:$|\W)/i);
export const continueExpression = new SafeRegExp(
  /(?:^|\W)100-continue(?:$|\W)/i,
);

export {
  checkInvalidHeaderChar as _checkInvalidHeaderChar,
  checkIsHttpToken as _checkIsHttpToken,
};

export { HTTPParser };

export default {
  _checkInvalidHeaderChar: checkInvalidHeaderChar,
  _checkIsHttpToken: checkIsHttpToken,
  chunkExpression,
  CRLF,
  continueExpression,
  kIncomingMessage,
  methods,
  HTTPParser,
};
