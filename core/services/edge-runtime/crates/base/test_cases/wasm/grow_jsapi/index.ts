let mem = new WebAssembly.Memory({
  initial: 1, // 64 KiB
  maximum: 1000, // 65.536 MiB
});

// NOTE: Just defined to prevent the JsRuntime leave from the event loop
Deno.serve(() => {/* do nothing */});

// NOTE(Nyannyacha): Unlike built-in instruction, this expects to detect memory
// overcommit in the next poll (optimized).
mem.grow(999);
console.log(mem.buffer.byteLength); // to prevent optimization
