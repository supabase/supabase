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

import { nextTick } from "ext:deno_node/_next_tick.ts";
import { customPromisifyArgs } from "ext:deno_node/internal/util.mjs";
import {
  validateBoolean,
  validateFunction,
  validateNumber,
  validateOneOf,
  validateString,
} from "ext:deno_node/internal/validators.mjs";
import { isIP } from "ext:deno_node/internal/net.ts";
import {
  emitInvalidHostnameWarning,
  getDefaultResolver,
  getDefaultVerbatim,
  isFamily,
  isLookupCallback,
  isLookupOptions,
  isResolveCallback,
  Resolver as CallbackResolver,
  setDefaultResolver,
  setDefaultResultOrder,
  validateHints,
} from "ext:deno_node/internal/dns/utils.ts";
import type {
  AnyAaaaRecord,
  AnyARecord,
  AnyCnameRecord,
  AnyMxRecord,
  AnyNaptrRecord,
  AnyNsRecord,
  AnyPtrRecord,
  AnyRecord,
  AnySoaRecord,
  AnySrvRecord,
  AnyTxtRecord,
  CaaRecord,
  LookupAddress,
  LookupAllOptions,
  LookupOneOptions,
  LookupOptions,
  MxRecord,
  NaptrRecord,
  Records,
  RecordWithTtl,
  ResolveCallback,
  ResolveOptions,
  ResolverOptions,
  ResolveWithTtlOptions,
  SoaRecord,
  SrvRecord,
} from "ext:deno_node/internal/dns/utils.ts";
import promisesBase from "ext:deno_node/internal/dns/promises.ts";
import type { ErrnoException } from "ext:deno_node/internal/errors.ts";
import {
  dnsException,
  ERR_INVALID_ARG_TYPE,
  ERR_INVALID_ARG_VALUE,
} from "ext:deno_node/internal/errors.ts";
import {
  AI_ADDRCONFIG as ADDRCONFIG,
  AI_ALL as ALL,
  AI_V4MAPPED as V4MAPPED,
} from "ext:deno_node/internal_binding/ares.ts";
import {
  ChannelWrapQuery,
  getaddrinfo,
  GetAddrInfoReqWrap,
  QueryReqWrap,
} from "ext:deno_node/internal_binding/cares_wrap.ts";
import { domainToASCII } from "ext:deno_node/internal/idna.ts";
import { notImplemented } from "ext:deno_node/_utils.ts";

function onlookup(
  this: GetAddrInfoReqWrap,
  err: number | null,
  addresses: string[],
) {
  if (err) {
    return this.callback(dnsException(err, "getaddrinfo", this.hostname));
  }

  this.callback(null, addresses[0], this.family || isIP(addresses[0]));
}

function onlookupall(
  this: GetAddrInfoReqWrap,
  err: number | null,
  addresses: string[],
) {
  if (err) {
    return this.callback(dnsException(err, "getaddrinfo", this.hostname));
  }

  const family = this.family;
  const parsedAddresses = [];

  for (let i = 0; i < addresses.length; i++) {
    const addr = addresses[i];
    parsedAddresses[i] = {
      address: addr,
      family: family || isIP(addr),
    };
  }

  this.callback(null, parsedAddresses);
}

type LookupCallback = (
  err: ErrnoException | null,
  addressOrAddresses?: string | LookupAddress[] | null,
  family?: number,
) => void;

const validFamilies = [0, 4, 6];

// Easy DNS A/AAAA look up
// lookup(hostname, [options,] callback)
export function lookup(
  hostname: string,
  family: number,
  callback: (
    err: ErrnoException | null,
    address: string,
    family: number,
  ) => void,
): GetAddrInfoReqWrap | Record<string, never>;
export function lookup(
  hostname: string,
  options: LookupOneOptions,
  callback: (
    err: ErrnoException | null,
    address: string,
    family: number,
  ) => void,
): GetAddrInfoReqWrap | Record<string, never>;
export function lookup(
  hostname: string,
  options: LookupAllOptions,
  callback: (err: ErrnoException | null, addresses: LookupAddress[]) => void,
): GetAddrInfoReqWrap | Record<string, never>;
export function lookup(
  hostname: string,
  options: LookupOptions,
  callback: (
    err: ErrnoException | null,
    address: string | LookupAddress[],
    family: number,
  ) => void,
): GetAddrInfoReqWrap | Record<string, never>;
export function lookup(
  hostname: string,
  callback: (
    err: ErrnoException | null,
    address: string,
    family: number,
  ) => void,
): GetAddrInfoReqWrap | Record<string, never>;
export function lookup(
  hostname: string,
  options: unknown,
  callback?: unknown,
): GetAddrInfoReqWrap | Record<string, never> {
  let hints = 0;
  let family = 0;
  let all = false;
  let verbatim = getDefaultVerbatim();

  // Parse arguments
  if (hostname) {
    validateString(hostname, "hostname");
  }

  if (isLookupCallback(options)) {
    callback = options;
    family = 0;
  } else if (isFamily(options)) {
    validateFunction(callback, "callback");

    validateOneOf(options, "family", validFamilies);
    family = options;
  } else if (!isLookupOptions(options)) {
    validateFunction(arguments.length === 2 ? options : callback, "callback");

    throw new ERR_INVALID_ARG_TYPE("options", ["integer", "object"], options);
  } else {
    validateFunction(callback, "callback");

    if (options?.hints != null) {
      validateNumber(options.hints, "options.hints");
      hints = options.hints >>> 0;
      validateHints(hints);
    }

    if (options?.family != null) {
      validateOneOf(options.family, "options.family", validFamilies);
      family = options.family;
    }

    if (options?.all != null) {
      validateBoolean(options.all, "options.all");
      all = options.all;
    }

    if (options?.verbatim != null) {
      validateBoolean(options.verbatim, "options.verbatim");
      verbatim = options.verbatim;
    }
  }

  if (!hostname) {
    emitInvalidHostnameWarning(hostname);

    if (all) {
      nextTick(callback as LookupCallback, null, []);
    } else {
      nextTick(callback as LookupCallback, null, null, family === 6 ? 6 : 4);
    }

    return {};
  }

  const matchedFamily = isIP(hostname);

  if (matchedFamily) {
    if (all) {
      nextTick(callback as LookupCallback, null, [
        { address: hostname, family: matchedFamily },
      ]);
    } else {
      nextTick(callback as LookupCallback, null, hostname, matchedFamily);
    }

    return {};
  }

  const req = new GetAddrInfoReqWrap();
  req.callback = callback as LookupCallback;
  req.family = family;
  req.hostname = hostname;
  req.oncomplete = all ? onlookupall : onlookup;

  const err = getaddrinfo(
    req,
    domainToASCII(hostname),
    family,
    hints,
    verbatim,
  );

  if (err) {
    nextTick(
      callback as LookupCallback,
      dnsException(err, "getaddrinfo", hostname),
    );

    return {};
  }

  return req;
}

Object.defineProperty(lookup, customPromisifyArgs, {
  value: ["address", "family"],
  enumerable: false,
});

function onresolve(
  this: QueryReqWrap,
  err: number,
  records: Records,
  ttls?: number[],
) {
  if (err) {
    this.callback(dnsException(err, this.bindingName, this.hostname));

    return;
  }

  const parsedRecords = ttls && this.ttl
    ? (records as string[]).map((address: string, index: number) => ({
      address,
      ttl: ttls[index],
    }))
    : records;

  this.callback(null, parsedRecords);
}

function resolver(bindingName: keyof ChannelWrapQuery) {
  function query(
    this: Resolver,
    name: string,
    options: unknown,
    callback?: unknown,
  ): QueryReqWrap {
    if (isResolveCallback(options)) {
      callback = options;
      options = {};
    }

    validateString(name, "name");
    validateFunction(callback, "callback");

    const req = new QueryReqWrap();
    req.bindingName = bindingName;
    req.callback = callback as ResolveCallback;
    req.hostname = name;
    req.oncomplete = onresolve;

    if (options && (options as ResolveOptions).ttl) {
      notImplemented("dns.resolve* with ttl option");
    }

    req.ttl = !!(options && (options as ResolveOptions).ttl);

    const err = this._handle[bindingName](req, domainToASCII(name));

    if (err) {
      throw dnsException(err, bindingName, name);
    }

    return req;
  }

  Object.defineProperty(query, "name", { value: bindingName });

  return query;
}

const resolveMap = Object.create(null);

export class Resolver extends CallbackResolver {
  constructor(options?: ResolverOptions) {
    super(options);
  }

  // deno-lint-ignore no-explicit-any
  [resolveMethod: string]: any;
}

Resolver.prototype.resolveAny = resolveMap.ANY = resolver("queryAny");
Resolver.prototype.resolve4 = resolveMap.A = resolver("queryA");
Resolver.prototype.resolve6 = resolveMap.AAAA = resolver("queryAaaa");
Resolver.prototype.resolveCaa = resolveMap.CAA = resolver("queryCaa");
Resolver.prototype.resolveCname = resolveMap.CNAME = resolver("queryCname");
Resolver.prototype.resolveMx = resolveMap.MX = resolver("queryMx");
Resolver.prototype.resolveNs = resolveMap.NS = resolver("queryNs");
Resolver.prototype.resolveTxt = resolveMap.TXT = resolver("queryTxt");
Resolver.prototype.resolveSrv = resolveMap.SRV = resolver("querySrv");
Resolver.prototype.resolvePtr = resolveMap.PTR = resolver("queryPtr");
Resolver.prototype.resolveNaptr = resolveMap.NAPTR = resolver("queryNaptr");
Resolver.prototype.resolveSoa = resolveMap.SOA = resolver("querySoa");
Resolver.prototype.reverse = resolver("getHostByAddr");
Resolver.prototype.resolve = _resolve;

function _resolve(
  this: Resolver,
  hostname: string,
  rrtype: unknown,
  callback?: unknown,
): QueryReqWrap {
  let resolver: Resolver;

  if (typeof hostname !== "string") {
    throw new ERR_INVALID_ARG_TYPE("name", "string", hostname);
  }

  if (typeof rrtype === "string") {
    resolver = resolveMap[rrtype];
  } else if (typeof rrtype === "function") {
    resolver = resolveMap.A;
    callback = rrtype;
  } else {
    throw new ERR_INVALID_ARG_TYPE("rrtype", "string", rrtype);
  }

  if (typeof resolver === "function") {
    return Reflect.apply(resolver, this, [hostname, callback]);
  }

  throw new ERR_INVALID_ARG_VALUE("rrtype", rrtype);
}

/**
 * Sets the IP address and port of servers to be used when performing DNS
 * resolution. The `servers` argument is an array of [RFC 5952](https://tools.ietf.org/html/rfc5952#section-6) formatted
 * addresses. If the port is the IANA default DNS port (53) it can be omitted.
 *
 * ```js
 * dns.setServers([
 *   '4.4.4.4',
 *   '[2001:4860:4860::8888]',
 *   '4.4.4.4:1053',
 *   '[2001:4860:4860::8888]:1053',
 * ]);
 * ```
 *
 * An error will be thrown if an invalid address is provided.
 *
 * The `dns.setServers()` method must not be called while a DNS query is in
 * progress.
 *
 * The `setServers` method affects only `resolve`,`dns.resolve*()` and `reverse` (and specifically _not_ `lookup`).
 *
 * This method works much like [resolve.conf](https://man7.org/linux/man-pages/man5/resolv.conf.5.html).
 * That is, if attempting to resolve with the first server provided results in a
 * `NOTFOUND` error, the `resolve()` method will _not_ attempt to resolve with
 * subsequent servers provided. Fallback DNS servers will only be used if the
 * earlier ones time out or result in some other error.
 *
 * @param servers array of `RFC 5952` formatted addresses
 */
export function setServers(servers: ReadonlyArray<string>) {
  const resolver = new Resolver();

  resolver.setServers(servers);
  setDefaultResolver(resolver);
}

// The Node implementation uses `bindDefaultResolver` to set the follow methods
// on `module.exports` bound to the current `defaultResolver`. We don't have
// the same ability in ESM but can simulate this (at some cost) by explicitly
// exporting these methods which dynamically bind to the default resolver when
// called.

/**
 * Returns an array of IP address strings, formatted according to [RFC 5952](https://tools.ietf.org/html/rfc5952#section-6),
 * that are currently configured for DNS resolution. A string will include a port
 * section if a custom port is used.
 *
 * ```js
 * [
 *   '4.4.4.4',
 *   '2001:4860:4860::8888',
 *   '4.4.4.4:1053',
 *   '[2001:4860:4860::8888]:1053',
 * ]
 * ```
 */
export function getServers(): string[] {
  return Resolver.prototype.getServers.bind(getDefaultResolver())();
}

/**
 * Uses the DNS protocol to resolve all records (also known as `ANY` or `*` query).
 * The `ret` argument passed to the `callback` function will be an array containing
 * various types of records. Each object has a property `type` that indicates the
 * type of the current record. And depending on the `type`, additional properties
 * will be present on the object.
 *
 * Here is an example of the `ret` object passed to the callback:
 *
 * ```js
 * [ { type: 'A', address: '127.0.0.1', ttl: 299 },
 *   { type: 'CNAME', value: 'example.com' },
 *   { type: 'MX', exchange: 'alt4.aspmx.l.example.com', priority: 50 },
 *   { type: 'NS', value: 'ns1.example.com' },
 *   { type: 'TXT', entries: [ 'v=spf1 include:_spf.example.com ~all' ] },
 *   { type: 'SOA',
 *     nsname: 'ns1.example.com',
 *     hostmaster: 'admin.example.com',
 *     serial: 156696742,
 *     refresh: 900,
 *     retry: 900,
 *     expire: 1800,
 *     minttl: 60 } ]
 * ```
 *
 * DNS server operators may choose not to respond to `ANY` queries. It may be
 * better to call individual methods like `resolve4`, `resolveMx`, and so on.
 * For more details, see [RFC 8482](https://tools.ietf.org/html/rfc8482).
 */
export function resolveAny(
  hostname: string,
  callback: (err: ErrnoException | null, addresses: AnyRecord[]) => void,
): QueryReqWrap;
export function resolveAny(...args: unknown[]): QueryReqWrap {
  return Resolver.prototype.resolveAny.bind(getDefaultResolver() as Resolver)(
    ...args,
  );
}

/**
 * Uses the DNS protocol to resolve a IPv4 addresses (`A` records) for the
 * `hostname`. The `addresses` argument passed to the `callback` function will
 * contain an array of IPv4 addresses (e.g. `['74.125.79.104', '74.125.79.105','74.125.79.106']`).
 *
 * @param hostname Host name to resolve.
 */
export function resolve4(
  hostname: string,
  callback: (err: ErrnoException | null, addresses: string[]) => void,
): void;
export function resolve4(
  hostname: string,
  options: ResolveWithTtlOptions,
  callback: (err: ErrnoException | null, addresses: RecordWithTtl[]) => void,
): void;
export function resolve4(
  hostname: string,
  options: ResolveOptions,
  callback: (
    err: ErrnoException | null,
    addresses: string[] | RecordWithTtl[],
  ) => void,
): void;
export function resolve4(
  hostname: string,
  options: unknown,
  callback?: unknown,
) {
  return Resolver.prototype.resolve4.bind(getDefaultResolver() as Resolver)(
    hostname,
    options,
    callback,
  );
}

/**
 * Uses the DNS protocol to resolve a IPv6 addresses (`AAAA` records) for the
 * `hostname`. The `addresses` argument passed to the `callback` function
 * will contain an array of IPv6 addresses.
 *
 * @param hostname Host name to resolve.
 */
export function resolve6(
  hostname: string,
  callback: (err: ErrnoException | null, addresses: string[]) => void,
): void;
export function resolve6(
  hostname: string,
  options: ResolveWithTtlOptions,
  callback: (err: ErrnoException | null, addresses: RecordWithTtl[]) => void,
): void;
export function resolve6(
  hostname: string,
  options: ResolveOptions,
  callback: (
    err: ErrnoException | null,
    addresses: string[] | RecordWithTtl[],
  ) => void,
): void;
export function resolve6(
  hostname: string,
  options: unknown,
  callback?: unknown,
) {
  return Resolver.prototype.resolve6.bind(getDefaultResolver() as Resolver)(
    hostname,
    options,
    callback,
  );
}

/**
 * Uses the DNS protocol to resolve `CAA` records for the `hostname`. The
 * `addresses` argument passed to the `callback` function will contain an array
 * of certification authority authorization records available for the
 * `hostname` (e.g. `[{critical: 0, iodef: 'mailto:pki@example.com'}, {critical: 128, issue: 'pki.example.com'}]`).
 */
export function resolveCaa(
  hostname: string,
  callback: (err: ErrnoException | null, records: CaaRecord[]) => void,
): QueryReqWrap;
export function resolveCaa(...args: unknown[]): QueryReqWrap {
  return Resolver.prototype.resolveCaa.bind(getDefaultResolver() as Resolver)(
    ...args,
  );
}

/**
 * Uses the DNS protocol to resolve `CNAME` records for the `hostname`. The
 * `addresses` argument passed to the `callback` function will contain an array
 * of canonical name records available for the `hostname`(e.g. `['bar.example.com']`).
 */
export function resolveCname(
  hostname: string,
  callback: (err: ErrnoException | null, addresses: string[]) => void,
): QueryReqWrap;
export function resolveCname(...args: unknown[]): QueryReqWrap {
  return Resolver.prototype.resolveCname.bind(getDefaultResolver() as Resolver)(
    ...args,
  );
}

/**
 * Uses the DNS protocol to resolve mail exchange records (`MX` records) for the
 * `hostname`. The `addresses` argument passed to the `callback` function will
 * contain an array of objects containing both a `priority` and `exchange`
 * property (e.g. `[{priority: 10, exchange: 'mx.example.com'}, ...]`).
 */
export function resolveMx(
  hostname: string,
  callback: (err: ErrnoException | null, addresses: MxRecord[]) => void,
): QueryReqWrap;
export function resolveMx(...args: unknown[]): QueryReqWrap {
  return Resolver.prototype.resolveMx.bind(getDefaultResolver() as Resolver)(
    ...args,
  );
}

/**
 * Uses the DNS protocol to resolve name server records (`NS` records) for the
 * `hostname`. The `addresses` argument passed to the `callback` function will
 * contain an array of name server records available for `hostname`
 * (e.g. `['ns1.example.com', 'ns2.example.com']`).
 */
export function resolveNs(
  hostname: string,
  callback: (err: ErrnoException | null, addresses: string[]) => void,
): QueryReqWrap;
export function resolveNs(...args: unknown[]): QueryReqWrap {
  return Resolver.prototype.resolveNs.bind(getDefaultResolver() as Resolver)(
    ...args,
  );
}

/**
 * Uses the DNS protocol to resolve text queries (`TXT` records) for the
 * `hostname`. The `records` argument passed to the `callback` function is a
 * two-dimensional array of the text records available for `hostname`
 * (e.g.`[ ['v=spf1 ip4:0.0.0.0 ', '~all' ] ]`). Each sub-array contains TXT
 * chunks of one record. Depending on the use case, these could be either
 * joined together or treated separately.
 */
export function resolveTxt(
  hostname: string,
  callback: (err: ErrnoException | null, addresses: string[][]) => void,
): QueryReqWrap;
export function resolveTxt(...args: unknown[]): QueryReqWrap {
  return Resolver.prototype.resolveTxt.bind(getDefaultResolver() as Resolver)(
    ...args,
  );
}

/**
 * Uses the DNS protocol to resolve service records (`SRV` records) for the
 * `hostname`. The `addresses` argument passed to the `callback` function will
 * be an array of objects with the following properties:
 *
 * - `priority`
 * - `weight`
 * - `port`
 * - `name`
 *
 * ```js
 * {
 *   priority: 10,
 *   weight: 5,
 *   port: 21223,
 *   name: 'service.example.com'
 * }
 * ```
 */
export function resolveSrv(
  hostname: string,
  callback: (err: ErrnoException | null, addresses: SrvRecord[]) => void,
): QueryReqWrap;
export function resolveSrv(...args: unknown[]): QueryReqWrap {
  return Resolver.prototype.resolveSrv.bind(getDefaultResolver() as Resolver)(
    ...args,
  );
}

/**
 * Uses the DNS protocol to resolve pointer records (`PTR` records) for the
 * `hostname`. The `addresses` argument passed to the `callback` function will
 * be an array of strings containing the reply records.
 */
export function resolvePtr(
  hostname: string,
  callback: (err: ErrnoException | null, addresses: string[]) => void,
): QueryReqWrap;
export function resolvePtr(...args: unknown[]): QueryReqWrap {
  return Resolver.prototype.resolvePtr.bind(getDefaultResolver() as Resolver)(
    ...args,
  );
}

/**
 * Uses the DNS protocol to resolve regular expression based records (`NAPTR`
 * records) for the `hostname`. The `addresses` argument passed to the
 * `callback` function will contain an array of objects with the following
 * properties:
 *
 * - `flags`
 * - `service`
 * - `regexp`
 * - `replacement`
 * - `order`
 * - `preference`
 *
 * ```js
 * {
 *   flags: 's',
 *   service: 'SIP+D2U',
 *   regexp: '',
 *   replacement: '_sip._udp.example.com',
 *   order: 30,
 *   preference: 100
 * }
 * ```
 */
export function resolveNaptr(
  hostname: string,
  callback: (err: ErrnoException | null, addresses: NaptrRecord[]) => void,
): QueryReqWrap;
export function resolveNaptr(...args: unknown[]): QueryReqWrap {
  return Resolver.prototype.resolveNaptr.bind(getDefaultResolver() as Resolver)(
    ...args,
  );
}

/**
 * Uses the DNS protocol to resolve a start of authority record (`SOA` record) for
 * the `hostname`. The `address` argument passed to the `callback` function will
 * be an object with the following properties:
 *
 * - `nsname`
 * - `hostmaster`
 * - `serial`
 * - `refresh`
 * - `retry`
 * - `expire`
 * - `minttl`
 *
 * ```js
 * {
 *   nsname: 'ns.example.com',
 *   hostmaster: 'root.example.com',
 *   serial: 2013101809,
 *   refresh: 10000,
 *   retry: 2400,
 *   expire: 604800,
 *   minttl: 3600
 * }
 * ```
 */
export function resolveSoa(
  hostname: string,
  callback: (err: ErrnoException | null, address: SoaRecord) => void,
): QueryReqWrap;
export function resolveSoa(...args: unknown[]): QueryReqWrap {
  return Resolver.prototype.resolveSoa.bind(getDefaultResolver() as Resolver)(
    ...args,
  );
}

/**
 * Performs a reverse DNS query that resolves an IPv4 or IPv6 address to an
 * array of host names.
 *
 * On error, `err` is an `Error` object, where `err.code` is
 * one of the `DNS error codes`.
 */
export function reverse(
  ip: string,
  callback: (err: ErrnoException | null, hostnames: string[]) => void,
): QueryReqWrap;
export function reverse(...args: unknown[]): QueryReqWrap {
  return Resolver.prototype.reverse.bind(getDefaultResolver() as Resolver)(
    ...args,
  );
}

/**
 * Uses the DNS protocol to resolve a host name (e.g. `'nodejs.org'`) into an array
 * of the resource records. The `callback` function has arguments`(err, records)`.]
 * When successful, `records` will be an array of resource
 * records. The type and structure of individual results varies based on `rrtype`.
 *
 * On error, `err` is an `Error` object, where `err.code` is one of the DNS error codes.
 *
 * @param hostname Host name to resolve.
 * @param [rrtype='A'] Resource record type.
 */
export function resolve(
  hostname: string,
  callback: (err: ErrnoException | null, addresses: string[]) => void,
): QueryReqWrap;
export function resolve(
  hostname: string,
  rrtype: "A",
  callback: (err: ErrnoException | null, addresses: string[]) => void,
): QueryReqWrap;
export function resolve(
  hostname: string,
  rrtype: "AAAA",
  callback: (err: ErrnoException | null, addresses: string[]) => void,
): QueryReqWrap;
export function resolve(
  hostname: string,
  rrtype: "ANY",
  callback: (err: ErrnoException | null, addresses: AnyRecord[]) => void,
): QueryReqWrap;
export function resolve(
  hostname: string,
  rrtype: "CNAME",
  callback: (err: ErrnoException | null, addresses: string[]) => void,
): QueryReqWrap;
export function resolve(
  hostname: string,
  rrtype: "MX",
  callback: (err: ErrnoException | null, addresses: MxRecord[]) => void,
): QueryReqWrap;
export function resolve(
  hostname: string,
  rrtype: "NAPTR",
  callback: (err: ErrnoException | null, addresses: NaptrRecord[]) => void,
): QueryReqWrap;
export function resolve(
  hostname: string,
  rrtype: "NS",
  callback: (err: ErrnoException | null, addresses: string[]) => void,
): QueryReqWrap;
export function resolve(
  hostname: string,
  rrtype: "PTR",
  callback: (err: ErrnoException | null, addresses: string[]) => void,
): QueryReqWrap;
export function resolve(
  hostname: string,
  rrtype: "SOA",
  callback: (err: ErrnoException | null, addresses: SoaRecord) => void,
): QueryReqWrap;
export function resolve(
  hostname: string,
  rrtype: "SRV",
  callback: (err: ErrnoException | null, addresses: SrvRecord[]) => void,
): QueryReqWrap;
export function resolve(
  hostname: string,
  rrtype: "TXT",
  callback: (err: ErrnoException | null, addresses: string[][]) => void,
): QueryReqWrap;
export function resolve(
  hostname: string,
  rrtype: string,
  callback: (
    err: ErrnoException | null,
    addresses:
      | string[]
      | MxRecord[]
      | NaptrRecord[]
      | SoaRecord
      | SrvRecord[]
      | string[][]
      | AnyRecord[],
  ) => void,
): QueryReqWrap;
export function resolve(hostname: string, rrtype: unknown, callback?: unknown) {
  return Resolver.prototype.resolve.bind(getDefaultResolver() as Resolver)(
    hostname,
    rrtype,
    callback,
  );
}

// ERROR CODES
export const NODATA = "ENODATA";
export const FORMERR = "EFORMERR";
export const SERVFAIL = "ESERVFAIL";
export const NOTFOUND = "ENOTFOUND";
export const NOTIMP = "ENOTIMP";
export const REFUSED = "EREFUSED";
export const BADQUERY = "EBADQUERY";
export const BADNAME = "EBADNAME";
export const BADFAMILY = "EBADFAMILY";
export const BADRESP = "EBADRESP";
export const CONNREFUSED = "ECONNREFUSED";
export const TIMEOUT = "ETIMEOUT";
export const EOF = "EOF";
export const FILE = "EFILE";
export const NOMEM = "ENOMEM";
export const DESTRUCTION = "EDESTRUCTION";
export const BADSTR = "EBADSTR";
export const BADFLAGS = "EBADFLAGS";
export const NONAME = "ENONAME";
export const BADHINTS = "EBADHINTS";
export const NOTINITIALIZED = "ENOTINITIALIZED";
export const LOADIPHLPAPI = "ELOADIPHLPAPI";
export const ADDRGETNETWORKPARAMS = "EADDRGETNETWORKPARAMS";
export const CANCELLED = "ECANCELLED";

const promises = {
  ...promisesBase,
  setDefaultResultOrder,
  setServers,

  // ERROR CODES
  NODATA,
  FORMERR,
  SERVFAIL,
  NOTFOUND,
  NOTIMP,
  REFUSED,
  BADQUERY,
  BADNAME,
  BADFAMILY,
  BADRESP,
  CONNREFUSED,
  TIMEOUT,
  EOF,
  FILE,
  NOMEM,
  DESTRUCTION,
  BADSTR,
  BADFLAGS,
  NONAME,
  BADHINTS,
  NOTINITIALIZED,
  LOADIPHLPAPI,
  ADDRGETNETWORKPARAMS,
  CANCELLED,
};

export { ADDRCONFIG, ALL, promises, setDefaultResultOrder, V4MAPPED };

export type {
  AnyAaaaRecord,
  AnyARecord,
  AnyCnameRecord,
  AnyMxRecord,
  AnyNaptrRecord,
  AnyNsRecord,
  AnyPtrRecord,
  AnyRecord,
  AnySoaRecord,
  AnySrvRecord,
  AnyTxtRecord,
  CaaRecord,
  LookupAddress,
  LookupAllOptions,
  LookupOneOptions,
  LookupOptions,
  MxRecord,
  NaptrRecord,
  Records,
  RecordWithTtl,
  ResolveCallback,
  ResolveOptions,
  ResolverOptions,
  ResolveWithTtlOptions,
  SoaRecord,
  SrvRecord,
};

export default {
  ADDRCONFIG,
  ALL,
  V4MAPPED,
  lookup,
  getServers,
  resolveAny,
  resolve4,
  resolve6,
  resolveCaa,
  resolveCname,
  resolveMx,
  resolveNs,
  resolveTxt,
  resolveSrv,
  resolvePtr,
  resolveNaptr,
  resolveSoa,
  resolve,
  Resolver,
  reverse,
  setServers,
  setDefaultResultOrder,
  promises,
  NODATA,
  FORMERR,
  SERVFAIL,
  NOTFOUND,
  NOTIMP,
  REFUSED,
  BADQUERY,
  BADNAME,
  BADFAMILY,
  BADRESP,
  CONNREFUSED,
  TIMEOUT,
  EOF,
  FILE,
  NOMEM,
  DESTRUCTION,
  BADSTR,
  BADFLAGS,
  NONAME,
  BADHINTS,
  NOTINITIALIZED,
  LOADIPHLPAPI,
  ADDRGETNETWORKPARAMS,
  CANCELLED,
};
