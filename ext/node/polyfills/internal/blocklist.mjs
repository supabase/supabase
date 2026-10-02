// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

import { primordials } from "ext:core/mod.js";
import {
  op_blocklist_add_address,
  op_blocklist_add_range,
  op_blocklist_add_subnet,
  op_blocklist_check,
  op_blocklist_new,
  op_socket_address_get_serialization,
  op_socket_address_parse,
} from "ext:core/ops";

import {
  validateInt32,
  validateObject,
  validatePort,
  validateString,
  validateUint32,
} from "ext:deno_node/internal/validators.mjs";
import { ERR_INVALID_ARG_VALUE } from "ext:deno_node/internal/errors.ts";
import { customInspectSymbol } from "ext:deno_node/internal/util.mjs";
import { inspect } from "ext:deno_node/internal/util/inspect.mjs";

const { Symbol } = primordials;

const internalBlockList = Symbol("blocklist");

class BlockList {
  constructor() {
    this[internalBlockList] = op_blocklist_new();
  }

  [customInspectSymbol](depth, options) {
    if (depth < 0) {
      return this;
    }

    const opts = {
      ...options,
      depth: options.depth == null ? null : options.depth - 1,
    };

    return `BlockList ${
      inspect({
        rules: [], // TODO(satyarohith): provide the actual rules
      }, opts)
    }`;
  }

  addAddress(address, family = "ipv4") {
    if (!SocketAddress.isSocketAddress(address)) {
      validateString(address, "address");
      validateString(family, "family");
      new SocketAddress({
        address,
        family,
      });
    } else {
      address = address.address;
    }
    op_blocklist_add_address(this[internalBlockList], address);
  }

  addRange(start, end, family = "ipv4") {
    if (!SocketAddress.isSocketAddress(start)) {
      validateString(start, "start");
      validateString(family, "family");
      new SocketAddress({
        address: start,
        family,
      });
    } else {
      start = start.address;
    }
    if (!SocketAddress.isSocketAddress(end)) {
      validateString(end, "end");
      validateString(family, "family");
      new SocketAddress({
        address: end,
        family,
      });
    } else {
      end = end.address;
    }
    const ret = op_blocklist_add_range(this[internalBlockList], start, end);
    if (ret === false) {
      throw new ERR_INVALID_ARG_VALUE("start", start, "must come before end");
    }
  }

  addSubnet(network, prefix, family = "ipv4") {
    if (!SocketAddress.isSocketAddress(network)) {
      validateString(network, "network");
      validateString(family, "family");
      new SocketAddress({
        address: network,
        family,
      });
    } else {
      network = network.address;
      family = network.family;
    }
    switch (family) {
      case "ipv4":
        validateInt32(prefix, "prefix", 0, 32);
        break;
      case "ipv6":
        validateInt32(prefix, "prefix", 0, 128);
        break;
    }
    op_blocklist_add_subnet(this[internalBlockList], network, prefix);
  }

  check(address, family = "ipv4") {
    if (!SocketAddress.isSocketAddress(address)) {
      validateString(address, "address");
      validateString(family, "family");
      try {
        new SocketAddress({
          address,
          family,
        });
      } catch {
        // Ignore the error. If it's not a valid address, return false.
        return false;
      }
    } else {
      family = address.family;
      address = address.address;
    }
    try {
      return op_blocklist_check(this[internalBlockList], address, family);
    } catch (_) {
      // Node API expects false as return value if the address is invalid.
      // Example: `blocklist.check("1.1.1.1", "ipv6")` should return false.
      return false;
    }
  }

  get rules() {
    // TODO(satyarohith): return the actual rules
    return [];
  }
}

const kDetail = Symbol("kDetail");

class SocketAddress {
  static isSocketAddress(value) {
    return value?.[kDetail] !== undefined;
  }

  constructor(options = kEmptyObject) {
    validateObject(options, "options");
    let { family = "ipv4" } = options;
    const {
      address = (family === "ipv4" ? "127.0.0.1" : "::"),
      port = 0,
      flowlabel = 0,
    } = options;

    if (typeof family?.toLowerCase === "function") {
      // deno-lint-ignore prefer-primordials
      family = family.toLowerCase();
    }
    switch (family) {
      case "ipv4":
        break;
      case "ipv6":
        break;
      default:
        throw new ERR_INVALID_ARG_VALUE("options.family", options.family);
    }

    validateString(address, "options.address");
    validatePort(port, "options.port");
    validateUint32(flowlabel, "options.flowlabel", false);

    this[kDetail] = {
      address,
      port,
      family,
      flowlabel,
    };
    const useInput = op_socket_address_parse(
      address,
      port,
      family,
    );
    if (!useInput) {
      const { 0: address_, 1: family_ } = op_socket_address_get_serialization();
      this[kDetail].address = address_;
      this[kDetail].family = family_;
    }
  }

  get address() {
    return this[kDetail].address;
  }

  get port() {
    return this[kDetail].port;
  }

  get family() {
    return this[kDetail].family;
  }

  get flowlabel() {
    // TODO(satyarohith): Implement this in Rust.
    // The flow label can be changed internally.
    return this[kDetail].flowlabel;
  }

  toJSON() {
    return {
      address: this.address,
      port: this.port,
      family: this.family,
      flowlabel: this.flowlabel,
    };
  }
}

export { BlockList, SocketAddress };
