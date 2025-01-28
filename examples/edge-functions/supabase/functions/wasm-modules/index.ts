const wasmBuffer = await Deno.readFile(
  new URL("./add-wasm/pkg/add_wasm_bg.wasm", import.meta.url),
);

const { instance } = await WebAssembly.instantiate(
  wasmBuffer,
);
const { add } = instance.exports;

Deno.serve(async (req) => {
  const { a, b } = await req.json();
  return new Response(
    JSON.stringify({ result: add(a, b) }),
    { headers: { "Content-Type": "application/json" } },
  );
});
