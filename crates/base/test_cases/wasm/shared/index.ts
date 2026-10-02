/*
// meow_20mib.rs

use std::hint::black_box;

use wasm_bindgen::prelude::*;

// NOTE: 20 MiB of embedded dummy text.
// This will be included in the `data section` of the output.
const BIG_TEXT: &str = include_str!("./big.txt");

#[wasm_bindgen]
pub fn big_meow() -> String {
    // NOTE: Assignment should be performed here because `wasm_bindgen`
    // considers it unsound to return a type with a lifetime.
    return BIG_TEXT.to_string();
}

#[wasm_bindgen]
pub fn use_grow() -> String {
    let x = black_box(String::from(BIG_TEXT));
    return x;
}
*/

/*
WAT sample
...
    (memory (;0;) 337)
    (global (;0;) (mut i32) (i32.const 1048576))
    (export "memory" (memory 0))
    (export "big_meow" (func 16))
    (export "use_grow" (func 13))
    (export "__wbindgen_add_to_stack_pointer" (func 34))
    (export "__wbindgen_free" (func 26))
*/
let wasm;

let cachedUint8Memory0: Uint8Array | null = null;
let cachedInt32Memory0: Int32Array | null = null;
const cachedTextDecoder = new TextDecoder("utf-8", {
  ignoreBOM: true,
  fatal: true,
});

function getUint8Memory0() {
  if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
    cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
  }
  return cachedUint8Memory0;
}

function getInt32Memory0() {
  if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
    cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
  }
  return cachedInt32Memory0;
}

function getStringFromWasm0(ptr, len): string {
  ptr = ptr >>> 0;
  return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

/**
 * @returns {string}
 */
export function big_meow() {
  let deferred1_0;
  let deferred1_1;
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
    wasm.big_meow(retptr);
    var r0 = getInt32Memory0()[retptr / 4 + 0];
    var r1 = getInt32Memory0()[retptr / 4 + 1];
    deferred1_0 = r0;
    deferred1_1 = r1;
    return getStringFromWasm0(r0, r1);
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
    wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
  }
}

/**
 * @returns {string}
 */
export function use_grow() {
  let deferred1_0;
  let deferred1_1;
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
    wasm.use_grow(retptr);
    var r0 = getInt32Memory0()[retptr / 4 + 0];
    var r1 = getInt32Memory0()[retptr / 4 + 1];
    deferred1_0 = r0;
    deferred1_1 = r1;
    return getStringFromWasm0(r0, r1);
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
    wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
  }
}

export default function init() {
  // 20985134 bytes ~= 21M (in file system)
  let buf = Deno.readFileSync(
    import.meta.dirname + "/20mib.wasm",
  ) as Uint8Array;
  let mod = new WebAssembly.Module(buf);
  let imports = { wbg: {} };
  let instance = new WebAssembly.Instance(mod, imports);

  wasm = instance.exports;
}
