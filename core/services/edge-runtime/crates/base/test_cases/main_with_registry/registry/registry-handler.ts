import crypto from "node:crypto";
import assign from "npm:object-assign";

import mock from "./mock.ts";

const PKG_NAME = "@meowmeow/foobar";
const TOKEN = "MeowMeowToken";
const RESPONSE_TEMPLATE = await import("./template.json");

export default async function (prefix: string, req: Request) {
  if (req.method !== "GET") {
    return Response.json({ error: "Method Not Allowed" }, { status: 405 });
  }

  if (!req.headers.get("authorization")) {
    return Response.json({ error: "Missing authorization header" }, {
      status: 403,
    });
  }

  const token = req.headers.get("authorization")?.split(" ", 2);
  const isValidTokenType = token?.[0] === "Bearer";
  const isValidToken = token?.[1] === TOKEN;

  if (!isValidTokenType || !isValidToken) {
    return Response.json({ error: "Incorrect token" }, { status: 403 });
  }

  const url = new URL(req.url);
  const { pathname } = url;

  const moduleName = PKG_NAME.split("/", 2)[1];
  const buf = new Uint8Array(
    await ((await fetch(`data:application/octet;base64,${mock}`))
      .arrayBuffer()),
  );
  const sum = sha1(buf);

  if (
    ucEnc(pathname) === `${prefix}/${softEncode(PKG_NAME)}` ||
    ucEnc(pathname) === `${prefix}/${PKG_NAME}`
  ) {
    return Response.json(
      generatePackageResponse("localhost", prefix, moduleName, sum),
    );
  }

  if (pathname === `${prefix}/${PKG_NAME}/-/${moduleName}-1.0.0.tgz`) {
    return new Response(buf);
  }

  return Response.json({ error: "File Not Found" }, { status: 404 });
}

function ucEnc(str: string) {
  return str.replace(/(%[a-f0-9]{2})/g, function (match) {
    return match.toUpperCase();
  });
}

function softEncode(pkg: string) {
  return encodeURIComponent(pkg).replace(/^%40/, "@");
}

function generatePackageResponse(
  hostname: string,
  prefix: string,
  moduleName: string,
  sum: string,
) {
  const port = Deno.env.get("EDGE_RUNTIME_PORT") || "9998";
  const tpl = assign({}, RESPONSE_TEMPLATE.default, {
    _id: PKG_NAME,
    name: PKG_NAME,
  });

  tpl.versions["1.0.0"] = assign({}, tpl.versions["1.0.0"], {
    _id: PKG_NAME + "@1.0.0",
    name: PKG_NAME,
    dist: assign({}, tpl.versions["1.0.0"].dist, {
      shasum: sum,
      tarball: [
        "http://" + hostname + ":" + port + prefix,
        PKG_NAME,
        "-",
        moduleName + "-1.0.0.tgz",
      ].join("/"),
    }),
  });

  return tpl;
}

function sha1(data: Uint8Array) {
  return crypto.createHash("sha1").update(data).digest("hex");
}
