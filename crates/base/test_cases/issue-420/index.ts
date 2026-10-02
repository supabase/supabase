import * as _meow from "npm:@imagemagick/magick-wasm@0.0.30";

export default {
  fetch() {
    return new Response(
      import.meta.resolve("npm:@imagemagick/magick-wasm@0.0.30"),
    );
  },
};
