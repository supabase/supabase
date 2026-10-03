import http from "k6/http";

import { check } from "k6";
import { Options } from "k6/options";

import { target } from "../config";
import { upload } from "../utils";

export const options: Options = {
  scenarios: {
    simple: {
      executor: "constant-vus",
      vus: 12,
      duration: "3m",
    },
  },
};

export function setup() {
  return {
    url: upload(open("../functions/simple.ts")),
  };
}

type Data = {
  url: string;
};

export default function (data: Data) {
  const res = http.get(`${target}${data.url}`);

  check(res, {
    "status is 200": (r) => r.status === 200,
  });
}
