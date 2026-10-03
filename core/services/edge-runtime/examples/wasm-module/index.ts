import { add } from "./add-wasm/pkg/add_wasm.js";

Deno.serve(async (req) => {
  const { a, b } = await req.json();
  const result = add(a, b);

  return Response.json({ result });
});
