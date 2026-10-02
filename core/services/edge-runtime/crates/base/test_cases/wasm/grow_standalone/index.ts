/*
WAT sample
    (module
        (memory 1)
        (export "memory" (memory 0))

        (func $grow (export "grow") (param $x i32) (result i32)
            (memory.grow (local.get $x))
                drop
                memory.size
            )
        )
    )
*/
let wasm;

let buf = Deno.readFileSync("grow.wasm") as Uint8Array;
let mod = new WebAssembly.Module(buf);
let imports = { wbg: {} };
let instance = new WebAssembly.Instance(mod, imports);

wasm = instance.exports;

function grow(param: number): number {
  return wasm.grow(param);
}

// NOTE: Just defined to prevent the JsRuntime leave from the event loop
Deno.serve(() => {/* do nothing */});

// NOTE(Nyannyacha): This memory overcommit uses the built-in instruction so in
// edge-runtime side cannot install a trap for this allocation directly without
// patching the V8 codebase. Therefore, we should have to use fixed-time
// window-based tracing here.
grow(
  350, // 350 pages ~= 22.9376 Mib
);
console.log(wasm.memory.buffer.byteLength); // to prevent optimization
