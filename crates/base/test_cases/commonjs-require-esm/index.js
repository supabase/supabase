const esm = require("./message.mjs");

if (esm.message !== "cjs require esm ok") {
  throw new Error(`unexpected ESM value: ${esm.message}`);
}

Deno.serve(() => new Response(esm.message));
