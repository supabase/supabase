// Browser stand-in for `@deno/shim-deno`, which `@deno/eszip` pulls in. The real shim touches Node
// builtins (`os`, `fs`, `net`) at import time and crashes in the browser. With no `Deno` global the
// eszip WASM loader skips its Node-only disk cache and fetches the WASM over HTTP instead.
export const Deno = undefined
