// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
/* Copyright 1998 by the Massachusetts Institute of Technology.
 *
 * Permission to use, copy, modify, and distribute this
 * software and its documentation for any purpose and without
 * fee is hereby granted, provided that the above copyright
 * notice appear in all copies and that both that copyright
 * notice and this permission notice appear in supporting
 * documentation, and that the name of M.I.T. not be used in
 * advertising or publicity pertaining to distribution of the
 * software without specific, written prior permission.
 * M.I.T. makes no representations about the suitability of
 * this software for any purpose.  It is provided "as is"
 * without express or implied warranty.
 */

// REF: https://github.com/nodejs/node/blob/master/deps/cares/include/ares.h#L190

export const ARES_AI_CANONNAME = 1 << 0;
export const ARES_AI_NUMERICHOST = 1 << 1;
export const ARES_AI_PASSIVE = 1 << 2;
export const ARES_AI_NUMERICSERV = 1 << 3;
export const AI_V4MAPPED = 1 << 4;
export const AI_ALL = 1 << 5;
export const AI_ADDRCONFIG = 1 << 6;
export const ARES_AI_NOSORT = 1 << 7;
export const ARES_AI_ENVHOSTS = 1 << 8;

// REF: https://github.com/nodejs/node/blob/master/deps/cares/src/lib/ares_strerror.c

// deno-lint-ignore camelcase
export function ares_strerror(code: number) {
  /* Return a string literal from a table. */
  const errorText = [
    "Successful completion",
    "DNS server returned answer with no data",
    "DNS server claims query was misformatted",
    "DNS server returned general failure",
    "Domain name not found",
    "DNS server does not implement requested operation",
    "DNS server refused query",
    "Misformatted DNS query",
    "Misformatted domain name",
    "Unsupported address family",
    "Misformatted DNS reply",
    "Could not contact DNS servers",
    "Timeout while contacting DNS servers",
    "End of file",
    "Error reading file",
    "Out of memory",
    "Channel is being destroyed",
    "Misformatted string",
    "Illegal flags specified",
    "Given hostname is not numeric",
    "Illegal hints flags specified",
    "c-ares library initialization not yet performed",
    "Error loading iphlpapi.dll",
    "Could not find GetNetworkParams function",
    "DNS query cancelled",
  ];

  if (code >= 0 && code < errorText.length) {
    return errorText[code];
  } else {
    return "unknown";
  }
}
