// --static "examples/**/*.md"

import isEven from "npm:is-even";
import { sum } from "./some-import.ts";

console.log("Hello A");
globalThis.isTenEven = isEven(10);

console.log(Deno.version);
let val = sum(1, 2);
console.log(Deno.cwd());
console.log(Deno.readFileSync("../postgres-on-the-edge/README.md"));

Deno.serve(async () => {
  return new Response(
    JSON.stringify({ hello: "world" }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
