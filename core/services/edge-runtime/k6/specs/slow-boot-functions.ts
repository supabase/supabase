import http from "k6/http";

import { check } from "k6";
import { Options } from "k6/options";

import { target } from "../config";
import { upload } from "../utils";

export const options: Options = {
  noConnectionReuse: true,
  scenarios: {
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
      simple: upload(open("../functions/simple.ts")),
      sleep5000ms: upload(open("../functions/sleep-5000ms.ts")),
      wasteCpuTime: upload(open("../functions/waste-cpu-time.ts")),
    },
  };
}

type Data = {
  url: { [name: string]: string };
};

export function simple(data: Data) {
  const res = http.get(`${target}${data.url["simple"]}`);
  const passed = check(res, { "simple 200": (r) => r.status === 200 });
  if (!passed) {
    console.log("simple", JSON.stringify(res));
  }
}
export function sleep5000ms(data: Data) {
  const res = http.get(`${target}${data.url["sleep5000ms"]}`);
  const passed = check(res, { "sleep 200": (r) => r.status === 200 });
  if (!passed) {
    console.log("sleep", JSON.stringify(res));
  }
}
export function wasteCpuTime(data: Data) {
  const res = http.get(`${target}${data.url["wasteCpuTime"]}`);
  const passed = check(res, { "wasteCpuTime 200": (r) => r.status === 200 });
  if (!passed) {
    console.log("wasteCpuTime", JSON.stringify(res));
  }
}
