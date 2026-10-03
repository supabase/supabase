import { init } from "https://esm.sh/@dqbd/tiktoken/lite/init";

await init(async (imports) => {
  return WebAssembly.instantiateStreaming(
    fetch("https://esm.sh/@dqbd/tiktoken@1.0.3/lite/tiktoken_bg.wasm"),
    imports,
  );
});

Deno.serve(async () => {
  return new Response(
    JSON.stringify({
      hello: "world",
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
});
