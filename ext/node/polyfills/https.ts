// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { notImplemented } from "ext:deno_node/_utils.ts";
import { urlToHttpOptions } from "ext:deno_node/internal/url.ts";
import {
  ClientRequest,
  IncomingMessageForClient as IncomingMessage,
  type RequestOptions,
} from "node:http";
import { Agent as HttpAgent } from "node:_http_agent";
import { createHttpClient } from "ext:deno_fetch/22_http_client.js";
import { type ServerHandler, ServerImpl as HttpServer } from "node:http";
import { validateObject } from "ext:deno_node/internal/validators.mjs";
import { kEmptyObject } from "ext:deno_node/internal/util.mjs";
import { Buffer } from "node:buffer";

export class Server extends HttpServer {
  constructor(opts, requestListener?: ServerHandler) {
    if (typeof opts === "function") {
      requestListener = opts;
      opts = kEmptyObject;
    } else if (opts == null) {
      opts = kEmptyObject;
    } else {
      validateObject(opts, "options");
    }

    if (opts.cert && Array.isArray(opts.cert)) {
      notImplemented("https.Server.opts.cert array type");
    }

    if (opts.key && Array.isArray(opts.key)) {
      notImplemented("https.Server.opts.key array type");
    }

    super(opts, requestListener);
  }

  _additionalServeOptions() {
    return {
      cert: this._opts.cert instanceof Buffer
        ? this._opts.cert.toString()
        : this._opts.cert,
      key: this._opts.key instanceof Buffer
        ? this._opts.key.toString()
        : this._opts.key,
    };
  }

  _encrypted = true;
}
export function createServer(opts, requestListener?: ServerHandler) {
  return new Server(opts, requestListener);
}

interface HttpsRequestOptions extends RequestOptions {
  _: unknown;
}

// Store additional root CAs.
// undefined means NODE_EXTRA_CA_CERTS is not checked yet.
// null means there's no additional root CAs.
let caCerts: string[] | undefined | null;

/** Makes a request to an https server. */
export function get(
  url: string | URL,
  cb?: (res: IncomingMessage) => void,
): HttpsClientRequest;
export function get(
  opts: HttpsRequestOptions,
  cb?: (res: IncomingMessage) => void,
): HttpsClientRequest;
export function get(
  url: string | URL,
  opts: HttpsRequestOptions,
  cb?: (res: IncomingMessage) => void,
): HttpsClientRequest;
// deno-lint-ignore no-explicit-any
export function get(...args: any[]) {
  const req = request(args[0], args[1], args[2]);
  req.end();
  return req;
}

export class Agent extends HttpAgent {
  constructor(options) {
    super(options);
    this.defaultPort = 443;
    this.protocol = "https:";
    this.maxCachedSessions = this.options.maxCachedSessions;
    if (this.maxCachedSessions === undefined) {
      this.maxCachedSessions = 100;
    }

    this._sessionCache = {
      map: {},
      list: [],
    };
  }
}

export const globalAgent = new Agent({
  keepAlive: true,
  scheduling: "lifo",
  timeout: 5000,
});

/** HttpsClientRequest class loosely follows http.ClientRequest class API. */
class HttpsClientRequest extends ClientRequest {
  override _encrypted: true;
  override defaultProtocol = "https:";
  override _getClient(): Deno.HttpClient | undefined {
    if (caCerts === null) {
      return undefined;
    }
    if (caCerts !== undefined) {
      return createHttpClient({ caCerts, http2: false });
    }
    // const status = await Deno.permissions.query({
    //   name: "env",
    //   variable: "NODE_EXTRA_CA_CERTS",
    // });
    // if (status.state !== "granted") {
    //   caCerts = null;
    //   return undefined;
    // }
    const certFilename = Deno.env.get("NODE_EXTRA_CA_CERTS");
    if (!certFilename) {
      caCerts = null;
      return undefined;
    }
    const caCert = Deno.readTextFileSync(certFilename);
    caCerts = [caCert];
    return createHttpClient({ caCerts, http2: false });
  }
}

/** Makes a request to an https server. */
export function request(
  url: string | URL,
  cb?: (res: IncomingMessage) => void,
): HttpsClientRequest;
export function request(
  opts: HttpsRequestOptions,
  cb?: (res: IncomingMessage) => void,
): HttpsClientRequest;
export function request(
  url: string | URL,
  opts: HttpsRequestOptions,
  cb?: (res: IncomingMessage) => void,
): HttpsClientRequest;
// deno-lint-ignore no-explicit-any
export function request(...args: any[]) {
  let options = {};

  if (typeof args[0] === "string") {
    const urlStr = args.shift();
    options = urlToHttpOptions(new URL(urlStr));
  } else if (args[0] instanceof URL) {
    options = urlToHttpOptions(args.shift());
  }

  if (args[0] && typeof args[0] !== "function") {
    Object.assign(options, args.shift());
  }

  options._defaultAgent = globalAgent;
  args.unshift(options);

  return new HttpsClientRequest(args[0], args[1]);
}
export default {
  Agent,
  Server,
  createServer,
  get,
  globalAgent,
  request,
};
