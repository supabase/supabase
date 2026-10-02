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

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { getOptionValue } from "ext:deno_node/internal/options.ts";
import { emitWarning } from "node:process";
import {
  AI_ADDRCONFIG,
  AI_ALL,
  AI_V4MAPPED,
} from "ext:deno_node/internal_binding/ares.ts";
import {
  ChannelWrap,
  strerror,
} from "ext:deno_node/internal_binding/cares_wrap.ts";
import {
  ERR_DNS_SET_SERVERS_FAILED,
  ERR_INVALID_ARG_VALUE,
  ERR_INVALID_IP_ADDRESS,
} from "ext:deno_node/internal/errors.ts";
import type { ErrnoException } from "ext:deno_node/internal/errors.ts";
import {
  validateArray,
  validateInt32,
  validateOneOf,
  validateString,
} from "ext:deno_node/internal/validators.mjs";
import { isIP } from "ext:deno_node/internal/net.ts";

export interface LookupOptions {
  family?: number | undefined;
  hints?: number | undefined;
  all?: boolean | undefined;
  verbatim?: boolean | undefined;
}

export interface LookupOneOptions extends LookupOptions {
  all?: false | undefined;
}

export interface LookupAllOptions extends LookupOptions {
  all: true;
}

export interface LookupAddress {
  address: string | null;
  family: number;
}

export function isLookupOptions(
  options: unknown,
): options is LookupOptions | undefined {
  return typeof options === "object" || typeof options === "undefined";
}

export function isLookupCallback(
  options: unknown,
): options is (...args: unknown[]) => void {
  return typeof options === "function";
}

export function isFamily(options: unknown): options is number {
  return typeof options === "number";
}

export interface ResolveOptions {
  ttl?: boolean;
}

export interface ResolveWithTtlOptions extends ResolveOptions {
  ttl: true;
}

export interface RecordWithTtl {
  address: string;
  ttl: number;
}

export interface AnyARecord extends RecordWithTtl {
  type: "A";
}

export interface AnyAaaaRecord extends RecordWithTtl {
  type: "AAAA";
}

export interface CaaRecord {
  critial: number;
  issue?: string | undefined;
  issuewild?: string | undefined;
  iodef?: string | undefined;
  contactemail?: string | undefined;
  contactphone?: string | undefined;
}

export interface MxRecord {
  priority: number;
  exchange: string;
}

export interface AnyMxRecord extends MxRecord {
  type: "MX";
}

export interface NaptrRecord {
  flags: string;
  service: string;
  regexp: string;
  replacement: string;
  order: number;
  preference: number;
}

export interface AnyNaptrRecord extends NaptrRecord {
  type: "NAPTR";
}

export interface SoaRecord {
  nsname: string;
  hostmaster: string;
  serial: number;
  refresh: number;
  retry: number;
  expire: number;
  minttl: number;
}

export interface AnySoaRecord extends SoaRecord {
  type: "SOA";
}

export interface SrvRecord {
  priority: number;
  weight: number;
  port: number;
  name: string;
}

export interface AnySrvRecord extends SrvRecord {
  type: "SRV";
}

export interface AnyTxtRecord {
  type: "TXT";
  entries: string[];
}

export interface AnyNsRecord {
  type: "NS";
  value: string;
}

export interface AnyPtrRecord {
  type: "PTR";
  value: string;
}

export interface AnyCnameRecord {
  type: "CNAME";
  value: string;
}

export type AnyRecord =
  | AnyARecord
  | AnyAaaaRecord
  | AnyCnameRecord
  | AnyMxRecord
  | AnyNaptrRecord
  | AnyNsRecord
  | AnyPtrRecord
  | AnySoaRecord
  | AnySrvRecord
  | AnyTxtRecord;

export type Records =
  | string[]
  | AnyRecord[]
  | MxRecord[]
  | NaptrRecord[]
  | SoaRecord
  | SrvRecord[]
  | string[];

export type ResolveCallback = (
  err: ErrnoException | null,
  addresses: Records,
) => void;

export function isResolveCallback(
  callback: unknown,
): callback is ResolveCallback {
  return typeof callback === "function";
}

const IANA_DNS_PORT = 53;
const IPv6RE = /^\[([^[\]]*)\]/;
const addrSplitRE = /(^.+?)(?::(\d+))?$/;

export function validateTimeout(options?: { timeout?: number }) {
  const { timeout = -1 } = { ...options };
  validateInt32(timeout, "options.timeout", -1, 2 ** 31 - 1);
  return timeout;
}

export function validateTries(options?: { tries?: number }) {
  const { tries = 4 } = { ...options };
  validateInt32(tries, "options.tries", 1, 2 ** 31 - 1);
  return tries;
}

export interface ResolverOptions {
  timeout?: number | undefined;
  /**
   * @default 4
   */
  tries?: number;
}

/**
 * An independent resolver for DNS requests.
 *
 * Creating a new resolver uses the default server settings. Setting
 * the servers used for a resolver using `resolver.setServers()` does not affect
 * other resolvers:
 *
 * ```js
 * const { Resolver } = require('dns');
 * const resolver = new Resolver();
 * resolver.setServers(['4.4.4.4']);
 *
 * // This request will use the server at 4.4.4.4, independent of global settings.
 * resolver.resolve4('example.org', (err, addresses) => {
 *   // ...
 * });
 * ```
 *
 * The following methods from the `dns` module are available:
 *
 * - `resolver.getServers()`
 * - `resolver.resolve()`
 * - `resolver.resolve4()`
 * - `resolver.resolve6()`
 * - `resolver.resolveAny()`
 * - `resolver.resolveCaa()`
 * - `resolver.resolveCname()`
 * - `resolver.resolveMx()`
 * - `resolver.resolveNaptr()`
 * - `resolver.resolveNs()`
 * - `resolver.resolvePtr()`
 * - `resolver.resolveSoa()`
 * - `resolver.resolveSrv()`
 * - `resolver.resolveTxt()`
 * - `resolver.reverse()`
 * - `resolver.setServers()`
 */
export class Resolver {
  _handle!: ChannelWrap;

  constructor(options?: ResolverOptions) {
    const timeout = validateTimeout(options);
    const tries = validateTries(options);
    this._handle = new ChannelWrap(timeout, tries);
  }

  cancel() {
    this._handle.cancel();
  }

  getServers(): string[] {
    return this._handle.getServers().map((val: [string, number]) => {
      if (!val[1] || val[1] === IANA_DNS_PORT) {
        return val[0];
      }

      const host = isIP(val[0]) === 6 ? `[${val[0]}]` : val[0];
      return `${host}:${val[1]}`;
    });
  }

  setServers(servers: ReadonlyArray<string>) {
    validateArray(servers, "servers");

    // Cache the original servers because in the event of an error while
    // setting the servers, c-ares won't have any servers available for
    // resolution.
    const orig = this._handle.getServers();
    const newSet: [number, string, number][] = [];

    servers.forEach((serv, index) => {
      validateString(serv, `servers[${index}]`);
      let ipVersion = isIP(serv);

      if (ipVersion !== 0) {
        return newSet.push([ipVersion, serv, IANA_DNS_PORT]);
      }

      const match = serv.match(IPv6RE);

      // Check for an IPv6 in brackets.
      if (match) {
        ipVersion = isIP(match[1]);

        if (ipVersion !== 0) {
          const port = Number.parseInt(serv.replace(addrSplitRE, "$2")) ||
            IANA_DNS_PORT;

          return newSet.push([ipVersion, match[1], port]);
        }
      }

      // addr::port
      const addrSplitMatch = serv.match(addrSplitRE);

      if (addrSplitMatch) {
        const hostIP = addrSplitMatch[1];
        const port = addrSplitMatch[2] || `${IANA_DNS_PORT}`;

        ipVersion = isIP(hostIP);

        if (ipVersion !== 0) {
          return newSet.push([ipVersion, hostIP, Number.parseInt(port)]);
        }
      }

      throw new ERR_INVALID_IP_ADDRESS(serv);
    });

    const errorNumber = this._handle.setServers(newSet);

    if (errorNumber !== 0) {
      // Reset the servers to the old servers, because ares probably unset them.
      this._handle.setServers(orig.join(","));
      const err = strerror(errorNumber);

      throw new ERR_DNS_SET_SERVERS_FAILED(err, servers.toString());
    }
  }

  /**
   * The resolver instance will send its requests from the specified IP address.
   * This allows programs to specify outbound interfaces when used on multi-homed
   * systems.
   *
   * If a v4 or v6 address is not specified, it is set to the default, and the
   * operating system will choose a local address automatically.
   *
   * The resolver will use the v4 local address when making requests to IPv4 DNS
   * servers, and the v6 local address when making requests to IPv6 DNS servers.
   * The `rrtype` of resolution requests has no impact on the local address used.
   *
   * @param [ipv4='0.0.0.0'] A string representation of an IPv4 address.
   * @param [ipv6='::0'] A string representation of an IPv6 address.
   */
  setLocalAddress(ipv4: string, ipv6?: string) {
    validateString(ipv4, "ipv4");

    if (ipv6 !== undefined) {
      validateString(ipv6, "ipv6");
    }

    this._handle.setLocalAddress(ipv4, ipv6);
  }
}

let defaultResolver = new Resolver();

export function getDefaultResolver(): Resolver {
  return defaultResolver;
}

export function setDefaultResolver<T extends Resolver>(resolver: T) {
  defaultResolver = resolver;
}

export function validateHints(hints: number) {
  if ((hints & ~(AI_ADDRCONFIG | AI_ALL | AI_V4MAPPED)) !== 0) {
    throw new ERR_INVALID_ARG_VALUE("hints", hints, "is invalid");
  }
}

let invalidHostnameWarningEmitted = false;

export function emitInvalidHostnameWarning(hostname: string) {
  if (invalidHostnameWarningEmitted) {
    return;
  }

  invalidHostnameWarningEmitted = true;

  emitWarning(
    `The provided hostname "${hostname}" is not a valid ` +
      "hostname, and is supported in the dns module solely for compatibility.",
    "DeprecationWarning",
    "DEP0118",
  );
}

let dnsOrder = getOptionValue("--dns-result-order") || "ipv4first";

export function getDefaultVerbatim() {
  switch (dnsOrder) {
    case "verbatim": {
      return true;
    }
    case "ipv4first": {
      return false;
    }
    default: {
      return false;
    }
  }
}

/**
 * Set the default value of `verbatim` in `lookup` and `dnsPromises.lookup()`.
 * The value could be:
 *
 * - `ipv4first`: sets default `verbatim` `false`.
 * - `verbatim`: sets default `verbatim` `true`.
 *
 * The default is `ipv4first` and `setDefaultResultOrder` have higher
 * priority than `--dns-result-order`. When using `worker threads`,
 * `setDefaultResultOrder` from the main thread won't affect the default
 * dns orders in workers.
 *
 * @param order must be `'ipv4first'` or `'verbatim'`.
 */
export function setDefaultResultOrder(order: "ipv4first" | "verbatim") {
  validateOneOf(order, "dnsOrder", ["verbatim", "ipv4first"]);
  dnsOrder = order;
}

export function defaultResolverSetServers(servers: string[]) {
  const resolver = new Resolver();

  resolver.setServers(servers);
  setDefaultResolver(resolver);
}
