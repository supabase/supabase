import * as _meow from "npm:@imagemagick/magick-wasm@0.0.30";

const url = import.meta.resolve("npm:@imagemagick/magick-wasm@0.0.30");

export default {
  async fetch() {
    const text = await (await fetch(url)).text();
    return new Response(text);
  },
};
