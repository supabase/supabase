/*
./scripts/run.sh

#!/usr/bin/env bash

GIT_V_TAG=0.1.1 cargo build --features cli/tracing && \
EDGE_RUNTIME_WORKER_POOL_SIZE=8 \
EDGE_RUNTIME_PORT=9998 RUST_BACKTRACE=full ./target/debug/edge-runtime "$@" start \
    --main-service ./examples/main \
    --event-worker ./examples/event-manager

*/

import http from "k6/http";

import { check, fail } from "k6";
import { Options } from "k6/options";

import { target } from "../config";
import { upload } from "../utils";
import { MSG_CANCELED } from "../constants";

/** @ts-ignore */
import { randomIntBetween } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

export const options: Options = {
  scenarios: {
    ortRustBackend: {
      executor: "constant-vus",
      vus: 12,
      duration: "3m",
    },
  },
};

const GENERATORS = import("../generators");

export async function setup() {
  const pkg = await GENERATORS;
  return {
    url: upload(open("../functions/ort-rust-backend.ts")),
    words: pkg.makeText(1000),
  };
}

type Data = {
  url: string;
  words: string[];
};

export default function (data: Data) {
  const wordIdx = randomIntBetween(0, data.words.length - 1);

  console.debug(`WORD[${wordIdx}]: ${data.words[wordIdx]}`);
  const res = http.post(
    `${target}${data.url}`,
    JSON.stringify({
      "text_for_embedding": data.words[wordIdx],
    }),
  );

  const isOk = check(res, {
    "status is 200": (r) => r.status === 200,
  });

  const isRequestCancelled = check(res, {
    "request cancelled": (r) => {
      const msg = r.json("msg");
      return r.status === 500 && msg === MSG_CANCELED;
    },
  });

  if (!isOk && !isRequestCancelled) {
    console.log(res.body);
    fail("unexpected response");
  }
}
