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

import {
  validateBoolean,
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
  isLookupOptions,
  Resolver as CallbackResolver,
  validateHints,
} from "ext:deno_node/internal/dns/utils.ts";
import type {
  LookupAddress,
  LookupAllOptions,
  LookupOneOptions,
  LookupOptions,
  Records,
  ResolveOptions,
  ResolveWithTtlOptions,
} from "ext:deno_node/internal/dns/utils.ts";
import {
  dnsException,
  ERR_INVALID_ARG_TYPE,
  ERR_INVALID_ARG_VALUE,
} from "ext:deno_node/internal/errors.ts";
import {
  ChannelWrapQuery,
  getaddrinfo,
  GetAddrInfoReqWrap,
  QueryReqWrap,
} from "ext:deno_node/internal_binding/cares_wrap.ts";
import { toASCII } from "node:punycode";

function onlookup(
  this: GetAddrInfoReqWrap,
  err: number | null,
  addresses: string[],
) {
  if (err) {
    this.reject(dnsException(err, "getaddrinfo", this.hostname));
    return;
  }

  const family = this.family || isIP(addresses[0]);
  this.resolve({ address: addresses[0], family });
}

function onlookupall(
  this: GetAddrInfoReqWrap,
  err: number | null,
  addresses: string[],
) {
  if (err) {
    this.reject(dnsException(err, "getaddrinfo", this.hostname));

    return;
  }

  const family = this.family;
  const parsedAddresses = [];

  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i];
    parsedAddresses[i] = {
      address,
      family: family ? family : isIP(address),
    };
  }

  this.resolve(parsedAddresses);
}

function createLookupPromise(
  family: number,
  hostname: string,
  all: boolean,
  hints: number,
  verbatim: boolean,
): Promise<void | LookupAddress | LookupAddress[]> {
  return new Promise((resolve, reject) => {
    if (!hostname) {
      emitInvalidHostnameWarning(hostname);
      resolve(all ? [] : { address: null, family: family === 6 ? 6 : 4 });

      return;
    }

    const matchedFamily = isIP(hostname);

    if (matchedFamily !== 0) {
      const result = { address: hostname, family: matchedFamily };
      resolve(all ? [result] : result);

      return;
    }

    const req = new GetAddrInfoReqWrap();

    req.family = family;
    req.hostname = hostname;
    req.oncomplete = all ? onlookupall : onlookup;
    req.resolve = resolve;
    req.reject = reject;

    const err = getaddrinfo(req, toASCII(hostname), family, hints, verbatim);

    if (err) {
      reject(dnsException(err, "getaddrinfo", hostname));
    }
  });
}

const validFamilies = [0, 4, 6];

export function lookup(
  hostname: string,
  family: number,
): Promise<void | LookupAddress | LookupAddress[]>;
export function lookup(
  hostname: string,
  options: LookupOneOptions,
): Promise<void | LookupAddress | LookupAddress[]>;
export function lookup(
  hostname: string,
  options: LookupAllOptions,
): Promise<void | LookupAddress | LookupAddress[]>;
export function lookup(
  hostname: string,
  options: LookupOptions,
): Promise<void | LookupAddress | LookupAddress[]>;
export function lookup(
  hostname: string,
  options: unknown,
): Promise<void | LookupAddress | LookupAddress[]> {
  let hints = 0;
  let family = 0;
  let all = false;
  let verbatim = getDefaultVerbatim();

  // Parse arguments
  if (hostname) {
    validateString(hostname, "hostname");
  }

  if (isFamily(options)) {
    validateOneOf(options, "family", validFamilies);
    family = options;
  } else if (!isLookupOptions(options)) {
    throw new ERR_INVALID_ARG_TYPE("options", ["integer", "object"], options);
  } else {
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

  return createLookupPromise(family, hostname, all, hints, verbatim);
}

function onresolve(
  this: QueryReqWrap,
  err: number,
  records: Records,
  ttls?: number[],
) {
  if (err) {
    this.reject(dnsException(err, this.bindingName, this.hostname));

    return;
  }

  const parsedRecords = ttls && this.ttl
    ? (records as string[]).map((address: string, index: number) => ({
      address,
      ttl: ttls[index],
    }))
    : records;

  this.resolve(parsedRecords);
}

function createResolverPromise(
  resolver: Resolver,
  bindingName: keyof ChannelWrapQuery,
  hostname: string,
  ttl: boolean,
) {
  return new Promise((resolve, reject) => {
    const req = new QueryReqWrap();

    req.bindingName = bindingName;
    req.hostname = hostname;
    req.oncomplete = onresolve;
    req.resolve = resolve;
    req.reject = reject;
    req.ttl = ttl;

    const err = resolver._handle[bindingName](req, toASCII(hostname));

    if (err) {
      reject(dnsException(err, bindingName, hostname));
    }
  });
}

function resolver(bindingName: keyof ChannelWrapQuery) {
  function query(
    this: Resolver,
    name: string,
    options?: unknown,
  ) {
    validateString(name, "name");

    const ttl = !!(options && (options as ResolveOptions).ttl);

    return createResolverPromise(this, bindingName, name, ttl);
  }

  Object.defineProperty(query, "name", { value: bindingName });

  return query;
}

const resolveMap = Object.create(null);

class Resolver extends CallbackResolver {
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
  rrtype?: string,
) {
  let resolver;

  if (typeof hostname !== "string") {
    throw new ERR_INVALID_ARG_TYPE("name", "string", hostname);
  }

  if (rrtype !== undefined) {
    validateString(rrtype, "rrtype");

    resolver = resolveMap[rrtype];

    if (typeof resolver !== "function") {
      throw new ERR_INVALID_ARG_VALUE("rrtype", rrtype);
    }
  } else {
    resolver = resolveMap.A;
  }

  return Reflect.apply(resolver, this, [hostname]);
}

// The Node implementation uses `bindDefaultResolver` to set the follow methods
// on `module.exports` bound to the current `defaultResolver`. We don't have
// the same ability in ESM but can simulate this (at some cost) by explicitly
// exporting these methods which dynamically bind to the default resolver when
// called.

export function getServers(): string[] {
  return Resolver.prototype.getServers.bind(getDefaultResolver())();
}

export function resolveAny(
  hostname: string,
) {
  return Resolver.prototype.resolveAny.bind(getDefaultResolver() as Resolver)(
    hostname,
  );
}

export function resolve4(
  hostname: string,
): Promise<void>;
export function resolve4(
  hostname: string,
  options: ResolveWithTtlOptions,
): Promise<void>;
export function resolve4(
  hostname: string,
  options: ResolveOptions,
): Promise<void>;
export function resolve4(hostname: string, options?: unknown) {
  return Resolver.prototype.resolve4.bind(getDefaultResolver() as Resolver)(
    hostname,
    options,
  );
}

export function resolve6(hostname: string): Promise<void>;
export function resolve6(
  hostname: string,
  options: ResolveWithTtlOptions,
): Promise<void>;
export function resolve6(
  hostname: string,
  options: ResolveOptions,
): Promise<void>;
export function resolve6(hostname: string, options?: unknown) {
  return Resolver.prototype.resolve6.bind(getDefaultResolver() as Resolver)(
    hostname,
    options,
  );
}

export function resolveCaa(
  hostname: string,
) {
  return Resolver.prototype.resolveCaa.bind(getDefaultResolver() as Resolver)(
    hostname,
  );
}

export function resolveCname(
  hostname: string,
) {
  return Resolver.prototype.resolveCname.bind(getDefaultResolver() as Resolver)(
    hostname,
  );
}

export function resolveMx(
  hostname: string,
) {
  return Resolver.prototype.resolveMx.bind(getDefaultResolver() as Resolver)(
    hostname,
  );
}

export function resolveNs(hostname: string) {
  return Resolver.prototype.resolveNs.bind(getDefaultResolver() as Resolver)(
    hostname,
  );
}

export function resolveTxt(hostname: string) {
  return Resolver.prototype.resolveTxt.bind(getDefaultResolver() as Resolver)(
    hostname,
  );
}

export function resolveSrv(hostname: string) {
  return Resolver.prototype.resolveSrv.bind(getDefaultResolver() as Resolver)(
    hostname,
  );
}

export function resolvePtr(hostname: string) {
  return Resolver.prototype.resolvePtr.bind(getDefaultResolver() as Resolver)(
    hostname,
  );
}

export function resolveNaptr(hostname: string) {
  return Resolver.prototype.resolveNaptr.bind(getDefaultResolver() as Resolver)(
    hostname,
  );
}

export function resolveSoa(hostname: string) {
  return Resolver.prototype.resolveSoa.bind(getDefaultResolver() as Resolver)(
    hostname,
  );
}

export function reverse(ip: string) {
  return Resolver.prototype.reverse.bind(getDefaultResolver() as Resolver)(
    ip,
  );
}

export function resolve(
  hostname: string,
): Promise<void>;
export function resolve(
  hostname: string,
  rrtype: "A",
): Promise<void>;
export function resolve(
  hostname: string,
  rrtype: "AAAA",
): Promise<void>;
export function resolve(
  hostname: string,
  rrtype: "ANY",
): Promise<void>;
export function resolve(
  hostname: string,
  rrtype: "CNAME",
): Promise<void>;
export function resolve(
  hostname: string,
  rrtype: "MX",
): Promise<void>;
export function resolve(
  hostname: string,
  rrtype: "NAPTR",
): Promise<void>;
export function resolve(
  hostname: string,
  rrtype: "NS",
): Promise<void>;
export function resolve(
  hostname: string,
  rrtype: "PTR",
): Promise<void>;
export function resolve(
  hostname: string,
  rrtype: "SOA",
): Promise<void>;
export function resolve(
  hostname: string,
  rrtype: "SRV",
): Promise<void>;
export function resolve(
  hostname: string,
  rrtype: "TXT",
): Promise<void>;
export function resolve(
  hostname: string,
  rrtype: string,
): Promise<void>;
export function resolve(hostname: string, rrtype?: string) {
  return Resolver.prototype.resolve.bind(getDefaultResolver() as Resolver)(
    hostname,
    rrtype,
  );
}

export { Resolver };

export default {
  lookup,
  Resolver,
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
  reverse,
};
