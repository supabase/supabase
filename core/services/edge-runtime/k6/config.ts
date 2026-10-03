const env = __ENV !== void 0 ? __ENV : process.env;

if (env == void 0) {
  throw new Error("unsupported environment");
}

const target = env["K6_TARGET"] ?? "http://127.0.0.1:9998";
const profile = env["K6_RUN_PROFILE"] ?? "performance";

export { profile, target };
