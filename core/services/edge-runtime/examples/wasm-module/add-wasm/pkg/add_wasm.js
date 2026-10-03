/* @ts-self-types="./add_wasm.d.ts" */

/**
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function add(a, b) {
  const ret = wasm.add(a, b);
  return ret >>> 0;
}

function __wbg_get_imports() {
  const import0 = {
    __proto__: null,
    __wbindgen_init_externref_table: function () {
      const table = wasm.__wbindgen_externrefs;
      const offset = table.grow(4);
      table.set(0, undefined);
      table.set(offset + 0, undefined);
      table.set(offset + 1, null);
      table.set(offset + 2, true);
      table.set(offset + 3, false);
    },
  };
  return {
    __proto__: null,
    "./add_wasm_bg.js": import0,
  };
}

const wasmUrl = new URL("add_wasm_bg.wasm", import.meta.url);
const wasmInstantiated = await WebAssembly.instantiateStreaming(
  fetch(wasmUrl),
  __wbg_get_imports(),
);
const wasm = wasmInstantiated.instance.exports;
wasm.__wbindgen_start();
