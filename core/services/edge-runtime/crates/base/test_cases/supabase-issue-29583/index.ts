// https://github.com/seanmonstar/deno/blob/main/tests/unit_node/http2_test.ts#L115
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import * as http2 from "node:http2";
import { assert, assertEquals } from "jsr:@std/assert";

const clientSession = http2.connect("https://www.example.com");
const req = clientSession.request({
  ":method": "GET",
  ":path": "/",
});
let headers = {};
let status: number | undefined = 0;
let chunk = new Uint8Array();
const endPromise = Promise.withResolvers<void>();
req.on("response", (h) => {
  status = h[":status"];
  headers = h;
});
req.on("data", (c) => {
  chunk = c;
});
req.on("end", () => {
  clientSession.close();
  req.close();
  endPromise.resolve();
});
req.end();
await endPromise.promise;
assert(Object.keys(headers).length > 0);
assertEquals(status, 200);
assert(chunk.length > 0);
assert(clientSession.socket);

export default {
  fetch() {
    return new Response(null);
  },
};
