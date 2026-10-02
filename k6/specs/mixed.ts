import http from "k6/http";

import { check } from "k6";
import { Options } from "k6/options";

import { target } from "../config";
import { upload } from "../utils";

export const options: Options = {
  scenarios: {
    gteSmallSimple: {
      executor: "constant-vus",
      vus: 12,
      duration: "3m",
      exec: "gteSmallSimple",
    },
    npmSupabaseJs: {
      executor: "constant-vus",
      vus: 12,
      duration: "3m",
      exec: "npmSupabaseJs",
    },
    simple: {
      executor: "constant-vus",
      vus: 12,
      duration: "3m",
      exec: "simple",
    },
    sleep5000ms: {
      executor: "constant-vus",
      vus: 12,
      duration: "3m",
      exec: "sleep5000ms",
    },
    tmpWrite100mib: {
      executor: "constant-vus",
      vus: 12,
      duration: "3m",
      exec: "tmpWrite100mib",
    },
    transformerFillMask: {
      executor: "constant-vus",
      vus: 12,
      duration: "3m",
      exec: "transformerFillMask",
    },
    wasteCpuTime: {
      executor: "constant-vus",
      vus: 12,
      duration: "3m",
      exec: "wasteCpuTime",
    },
  },
};

export function setup() {
  return {
    url: {
      gteSmallSimple: upload(open("../functions/gte-small-simple.ts")),
      npmSupabaseJs: upload(open("../functions/npm-supabase-js.ts")),
      simple: upload(open("../functions/simple.ts")),
      sleep5000ms: upload(open("../functions/sleep-5000ms.ts")),
      tmpWrite100mib: upload(open("../functions/tmp-write-100mib.ts")),
      transformerFillMask: upload(
        open("../functions/transformer-fill-mask.ts"),
      ),
      wasteCpuTime: upload(open("../functions/waste-cpu-time.ts")),
    },
  };
}

type Data = {
  url: { [_: string]: string };
};

export function gteSmallSimple(data: Data) {
  const res = http.get(`${target}${data.url["gteSmallSimple"]}`);

  check(res, {
    "status is 200": (r) => r.status === 200,
  });
}
export function npmSupabaseJs(data: Data) {
  const res = http.get(`${target}${data.url["npmSupabaseJs"]}`);

  check(res, {
    "status is 200": (r) => r.status === 200,
  });
}
export function simple(data: Data) {
  const res = http.get(`${target}${data.url["simple"]}`);

  check(res, {
    "status is 200": (r) => r.status === 200,
  });
}
export function sleep5000ms(data: Data) {
  const res = http.get(`${target}${data.url["sleep5000ms"]}`);

  check(res, {
    "status is 200": (r) => r.status === 200,
  });
}
export function tmpWrite100mib(data: Data) {
  const res = http.get(`${target}${data.url["tmpWrite100mib"]}`);

  check(res, {
    "status is 200": (r) => r.status === 200,
  });
}
export function transformerFillMask(data: Data) {
  const res = http.get(`${target}${data.url["transformerFillMask"]}`);

  check(res, {
    "status is 200": (r) => r.status === 200,
  });
}
export function wasteCpuTime(data: Data) {
  const res = http.get(`${target}${data.url["wasteCpuTime"]}`);

  check(res, {
    "status is 200": (r) => r.status === 200,
  });
}
