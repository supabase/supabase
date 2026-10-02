import { add } from "./add-wasm/pkg/add_wasm.js";

Deno.serve(async (req) => {
  const result = add(1, 2);

  return new Response(`${result}`, { status: 200 }); // result: 3
});
