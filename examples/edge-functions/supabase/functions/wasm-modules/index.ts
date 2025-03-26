import { add } from "./add-wasm/pkg/add_wasm.js";

Deno.serve(async (req) => {
  const { a, b } = await req.json();
  return new Response(
    JSON.stringify({ result: add(a, b) }),
    { headers: { "Content-Type": "application/json" } },
  );
});
