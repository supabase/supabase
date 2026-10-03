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
// - https://github.com/nodejs/node/blob/master/src/cares_wrap.cc
// - https://github.com/nodejs/node/blob/master/src/cares_wrap.h

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import type { ErrnoException } from "ext:deno_node/internal/errors.ts";
import { isIPv4 } from "ext:deno_node/internal/net.ts";
import { codeMap } from "ext:deno_node/internal_binding/uv.ts";
import {
  AsyncWrap,
  providerType,
} from "ext:deno_node/internal_binding/async_wrap.ts";
import { ares_strerror } from "ext:deno_node/internal_binding/ares.ts";
import { notImplemented } from "ext:deno_node/_utils.ts";
import { isWindows } from "ext:deno_node/_util/os.ts";

interface LookupAddress {
  address: string;
  family: number;
}

export class GetAddrInfoReqWrap extends AsyncWrap {
  family!: number;
  hostname!: string;

  callback!: (
    err: ErrnoException | null,
    addressOrAddresses?: string | LookupAddress[] | null,
    family?: number,
  ) => void;
  resolve!: (addressOrAddresses: LookupAddress | LookupAddress[]) => void;
  reject!: (err: ErrnoException | null) => void;
  oncomplete!: (err: number | null, addresses: string[]) => void;

  constructor() {
    super(providerType.GETADDRINFOREQWRAP);
  }
}

export function getaddrinfo(
  req: GetAddrInfoReqWrap,
  hostname: string,
  family: number,
  _hints: number,
  verbatim: boolean,
): number {
  let addresses: string[] = [];

  // TODO(cmorten): use hints
  // REF: https://nodejs.org/api/dns.html#dns_supported_getaddrinfo_flags

  const recordTypes: ("A" | "AAAA")[] = [];

  if (family === 0 || family === 4) {
    recordTypes.push("A");
  }
  if (family === 0 || family === 6) {
    recordTypes.push("AAAA");
  }

  (async () => {
    await Promise.allSettled(
      recordTypes.map((recordType) =>
        Deno.resolveDns(hostname, recordType).then((records) => {
          records.forEach((record) => addresses.push(record));
        })
      ),
    );

    const error = addresses.length ? 0 : codeMap.get("EAI_NODATA")!;

    // TODO(cmorten): needs work
    // REF: https://github.com/nodejs/node/blob/master/src/cares_wrap.cc#L1444
    if (!verbatim) {
      addresses.sort((a: string, b: string): number => {
        if (isIPv4(a)) {
          return -1;
        } else if (isIPv4(b)) {
          return 1;
        }

        return 0;
      });
    }

    // TODO(@bartlomieju): Forces IPv4 as a workaround for Deno not
    // aligning with Node on implicit binding on Windows
    // REF: https://github.com/denoland/deno/issues/10762
    if (isWindows && hostname === "localhost") {
      addresses = addresses.filter((address) => isIPv4(address));
    }

    req.oncomplete(error, addresses);
  })();

  return 0;
}

export class QueryReqWrap extends AsyncWrap {
  bindingName!: string;
  hostname!: string;
  ttl!: boolean;

  callback!: (
    err: ErrnoException | null,
    // deno-lint-ignore no-explicit-any
    records?: any,
  ) => void;
  // deno-lint-ignore no-explicit-any
  resolve!: (records: any) => void;
  reject!: (err: ErrnoException | null) => void;
  oncomplete!: (
    err: number,
    // deno-lint-ignore no-explicit-any
    records: any,
    ttls?: number[],
  ) => void;

  constructor() {
    super(providerType.QUERYWRAP);
  }
}

export interface ChannelWrapQuery {
  queryAny(req: QueryReqWrap, name: string): number;
  queryA(req: QueryReqWrap, name: string): number;
  queryAaaa(req: QueryReqWrap, name: string): number;
  queryCaa(req: QueryReqWrap, name: string): number;
  queryCname(req: QueryReqWrap, name: string): number;
  queryMx(req: QueryReqWrap, name: string): number;
  queryNs(req: QueryReqWrap, name: string): number;
  queryTxt(req: QueryReqWrap, name: string): number;
  querySrv(req: QueryReqWrap, name: string): number;
  queryPtr(req: QueryReqWrap, name: string): number;
  queryNaptr(req: QueryReqWrap, name: string): number;
  querySoa(req: QueryReqWrap, name: string): number;
  getHostByAddr(req: QueryReqWrap, name: string): number;
}

function fqdnToHostname(fqdn: string): string {
  return fqdn.replace(/\.$/, "");
}

function compressIPv6(address: string): string {
  const formatted = address.replace(/\b(?:0+:){2,}/, ":");
  const finalAddress = formatted
    .split(":")
    .map((octet) => {
      if (octet.match(/^\d+\.\d+\.\d+\.\d+$/)) {
        // decimal
        return Number(octet.replaceAll(".", "")).toString(16);
      }

      return octet.replace(/\b0+/g, "");
    })
    .join(":");

  return finalAddress;
}

export class ChannelWrap extends AsyncWrap implements ChannelWrapQuery {
  #servers: [string, number][] = [];
  #timeout: number;
  #tries: number;

  constructor(timeout: number, tries: number) {
    super(providerType.DNSCHANNEL);

    this.#timeout = timeout;
    this.#tries = tries;
  }

  async #query(query: string, recordType: Deno.RecordType) {
    // TODO(@bartlomieju): TTL logic.

    let code: number;
    let ret: Awaited<ReturnType<typeof Deno.resolveDns>>;

    if (this.#servers.length) {
      for (const [ipAddr, port] of this.#servers) {
        const resolveOptions = {
          nameServer: {
            ipAddr,
            port,
          },
        };

        ({ code, ret } = await this.#resolve(
          query,
          recordType,
          resolveOptions,
        ));

        if (code === 0 || code === codeMap.get("EAI_NODATA")!) {
          break;
        }
      }
    } else {
      ({ code, ret } = await this.#resolve(query, recordType));
    }

    return { code: code!, ret: ret! };
  }

  async #resolve(
    query: string,
    recordType: Deno.RecordType,
    resolveOptions?: Deno.ResolveDnsOptions,
  ): Promise<{
    code: number;
    ret: Awaited<ReturnType<typeof Deno.resolveDns>>;
  }> {
    let ret: Awaited<ReturnType<typeof Deno.resolveDns>> = [];
    let code = 0;

    try {
      ret = await Deno.resolveDns(query, recordType, resolveOptions);
    } catch (e) {
      if (e instanceof Deno.errors.NotFound) {
        code = codeMap.get("EAI_NODATA")!;
      } else {
        // TODO(cmorten): map errors to appropriate error codes.
        code = codeMap.get("UNKNOWN")!;
      }
    }

    return { code, ret };
  }

  queryAny(req: QueryReqWrap, name: string): number {
    // TODO(@bartlomieju): implemented temporary measure to allow limited usage of
    // `resolveAny` like APIs.
    //
    // Ideally we move to using the "ANY" / "*" DNS query in future
    // REF: https://github.com/denoland/deno/issues/14492
    (async () => {
      const records: { type: Deno.RecordType; [key: string]: unknown }[] = [];

      await Promise.allSettled([
        this.#query(name, "A").then(({ ret }) => {
          ret.forEach((record) => records.push({ type: "A", address: record }));
        }),
        this.#query(name, "AAAA").then(({ ret }) => {
          (ret as string[]).forEach((record) =>
            records.push({ type: "AAAA", address: compressIPv6(record) })
          );
        }),
        this.#query(name, "CAA").then(({ ret }) => {
          (ret as Deno.CaaRecord[]).forEach(({ critical, tag, value }) =>
            records.push({
              type: "CAA",
              [tag]: value,
              critical: +critical && 128,
            })
          );
        }),
        this.#query(name, "CNAME").then(({ ret }) => {
          ret.forEach((record) =>
            records.push({ type: "CNAME", value: record })
          );
        }),
        this.#query(name, "MX").then(({ ret }) => {
          (ret as Deno.MxRecord[]).forEach(({ preference, exchange }) =>
            records.push({
              type: "MX",
              priority: preference,
              exchange: fqdnToHostname(exchange),
            })
          );
        }),
        this.#query(name, "NAPTR").then(({ ret }) => {
          (ret as Deno.NaptrRecord[]).forEach(
            ({ order, preference, flags, services, regexp, replacement }) =>
              records.push({
                type: "NAPTR",
                order,
                preference,
                flags,
                service: services,
                regexp,
                replacement,
              }),
          );
        }),
        this.#query(name, "NS").then(({ ret }) => {
          (ret as string[]).forEach((record) =>
            records.push({ type: "NS", value: fqdnToHostname(record) })
          );
        }),
        this.#query(name, "PTR").then(({ ret }) => {
          (ret as string[]).forEach((record) =>
            records.push({ type: "PTR", value: fqdnToHostname(record) })
          );
        }),
        this.#query(name, "SOA").then(({ ret }) => {
          (ret as Deno.SoaRecord[]).forEach(
            ({ mname, rname, serial, refresh, retry, expire, minimum }) =>
              records.push({
                type: "SOA",
                nsname: fqdnToHostname(mname),
                hostmaster: fqdnToHostname(rname),
                serial,
                refresh,
                retry,
                expire,
                minttl: minimum,
              }),
          );
        }),
        this.#query(name, "SRV").then(({ ret }) => {
          (ret as Deno.SrvRecord[]).forEach(
            ({ priority, weight, port, target }) =>
              records.push({
                type: "SRV",
                priority,
                weight,
                port,
                name: target,
              }),
          );
        }),
        this.#query(name, "TXT").then(({ ret }) => {
          ret.forEach((record) =>
            records.push({ type: "TXT", entries: record })
          );
        }),
      ]);

      const err = records.length ? 0 : codeMap.get("EAI_NODATA")!;

      req.oncomplete(err, records);
    })();

    return 0;
  }

  queryA(req: QueryReqWrap, name: string): number {
    this.#query(name, "A").then(({ code, ret }) => {
      req.oncomplete(code, ret);
    });

    return 0;
  }

  queryAaaa(req: QueryReqWrap, name: string): number {
    this.#query(name, "AAAA").then(({ code, ret }) => {
      const records = (ret as string[]).map((record) => compressIPv6(record));

      req.oncomplete(code, records);
    });

    return 0;
  }

  queryCaa(req: QueryReqWrap, name: string): number {
    this.#query(name, "CAA").then(({ code, ret }) => {
      const records = (ret as Deno.CaaRecord[]).map(
        ({ critical, tag, value }) => ({
          [tag]: value,
          critical: +critical && 128,
        }),
      );

      req.oncomplete(code, records);
    });

    return 0;
  }

  queryCname(req: QueryReqWrap, name: string): number {
    this.#query(name, "CNAME").then(({ code, ret }) => {
      req.oncomplete(code, ret);
    });

    return 0;
  }

  queryMx(req: QueryReqWrap, name: string): number {
    this.#query(name, "MX").then(({ code, ret }) => {
      const records = (ret as Deno.MxRecord[]).map(
        ({ preference, exchange }) => ({
          priority: preference,
          exchange: fqdnToHostname(exchange),
        }),
      );

      req.oncomplete(code, records);
    });

    return 0;
  }

  queryNaptr(req: QueryReqWrap, name: string): number {
    this.#query(name, "NAPTR").then(({ code, ret }) => {
      const records = (ret as Deno.NaptrRecord[]).map(
        ({ order, preference, flags, services, regexp, replacement }) => ({
          flags,
          service: services,
          regexp,
          replacement,
          order,
          preference,
        }),
      );

      req.oncomplete(code, records);
    });

    return 0;
  }

  queryNs(req: QueryReqWrap, name: string): number {
    this.#query(name, "NS").then(({ code, ret }) => {
      const records = (ret as string[]).map((record) => fqdnToHostname(record));

      req.oncomplete(code, records);
    });

    return 0;
  }

  queryPtr(req: QueryReqWrap, name: string): number {
    this.#query(name, "PTR").then(({ code, ret }) => {
      const records = (ret as string[]).map((record) => fqdnToHostname(record));

      req.oncomplete(code, records);
    });

    return 0;
  }

  querySoa(req: QueryReqWrap, name: string): number {
    this.#query(name, "SOA").then(({ code, ret }) => {
      let record = {};

      if (ret.length) {
        const { mname, rname, serial, refresh, retry, expire, minimum } =
          ret[0] as Deno.SoaRecord;

        record = {
          nsname: fqdnToHostname(mname),
          hostmaster: fqdnToHostname(rname),
          serial,
          refresh,
          retry,
          expire,
          minttl: minimum,
        };
      }

      req.oncomplete(code, record);
    });

    return 0;
  }

  querySrv(req: QueryReqWrap, name: string): number {
    this.#query(name, "SRV").then(({ code, ret }) => {
      const records = (ret as Deno.SrvRecord[]).map(
        ({ priority, weight, port, target }) => ({
          priority,
          weight,
          port,
          name: target,
        }),
      );

      req.oncomplete(code, records);
    });

    return 0;
  }

  queryTxt(req: QueryReqWrap, name: string): number {
    this.#query(name, "TXT").then(({ code, ret }) => {
      req.oncomplete(code, ret);
    });

    return 0;
  }

  getHostByAddr(_req: QueryReqWrap, _name: string): number {
    // TODO(@bartlomieju): https://github.com/denoland/deno/issues/14432
    notImplemented("cares.ChannelWrap.prototype.getHostByAddr");
  }

  getServers(): [string, number][] {
    return this.#servers;
  }

  setServers(servers: string | [number, string, number][]): number {
    if (typeof servers === "string") {
      const tuples: [string, number][] = [];

      for (let i = 0; i < servers.length; i += 2) {
        tuples.push([servers[i], parseInt(servers[i + 1])]);
      }

      this.#servers = tuples;
    } else {
      this.#servers = servers.map(([_ipVersion, ip, port]) => [ip, port]);
    }

    return 0;
  }

  setLocalAddress(_addr0: string, _addr1?: string) {
    notImplemented("cares.ChannelWrap.prototype.setLocalAddress");
  }

  cancel() {
    notImplemented("cares.ChannelWrap.prototype.cancel");
  }
}

const DNS_ESETSRVPENDING = -1000;
const EMSG_ESETSRVPENDING = "There are pending queries.";

export function strerror(code: number) {
  return code === DNS_ESETSRVPENDING
    ? EMSG_ESETSRVPENDING
    : ares_strerror(code);
}
