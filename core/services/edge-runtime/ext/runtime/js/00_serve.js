import { primordials } from "ext:core/mod.js";

const { ObjectHasOwn } = primordials;

function registerDeclarativeServer(exports) {
  if (ObjectHasOwn(exports, "fetch")) {
    if (typeof exports.fetch !== "function") {
      throw new TypeError(
        "Invalid type for fetch: must be a function with a single or no parameter",
      );
    }
    Deno.serve({
      handler: (req) => {
        return exports.fetch(req);
      },
    });
  }
}

export { registerDeclarativeServer };
