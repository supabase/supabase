import http from "k6/http";

import { check } from "k6";
import { Options } from "k6/options";

import { target } from "../config";
import { MSG_CANCELED } from "../constants";
import { upload } from "../utils";

/** @ts-ignore */
import { randomIntBetween } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

const MB = 1048576;

const dummyBinary = new Uint8Array(randomIntBetween(25 * MB, 35 * MB));
const dummyFile = http.file(dummyBinary, "dummy", "application/octet-stream");

export const options: Options = {
  noConnectionReuse: true,
  stages: [
    {
      duration: "30s",
      target: 3,
    },
    {
      duration: "1m",
      target: 10,
    },
    {
      duration: "1m",
      target: 12,
    },
    {
      duration: "30s",
      target: 0,
    },
  ],
};

export function setup() {
  return {
    url: upload(open("../functions/may-upload-failure.ts")),
  };
}

type Data = {
  url: string;
};

export default function (data: Data) {
  const res = http.post(
    `${target}${data.url}`,
    {
      "file": dummyFile,
    },
    {
      timeout: "3m",
    },
  );

  check(res, {
    "status is 200 or 500 (operation canceled)": (r) => {
      if (r.status === 200 || r.status === 413) {
        return true;
      }

      if (r.status !== 500) {
        return false;
      }

      let m = r.json();

      if (
        !m || typeof m !== "object" || !("msg" in m) ||
        m["msg"] !== MSG_CANCELED
      ) {
        return false;
      }

      return true;
    },
  });
}
