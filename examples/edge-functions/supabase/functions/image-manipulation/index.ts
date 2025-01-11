// This is an example showing how to use Magick WASM to do image manipulations in Edge Functions.
//
import {
  ImageMagick,
  initializeImageMagick,
  MagickFormat,
} from "npm:@imagemagick/magick-wasm@0.0.30";

const wasmBytes = await Deno.readFile(
  new URL(
    "magick.wasm",
    import.meta.resolve("npm:@imagemagick/magick-wasm@0.0.30"),
  ),
);
await initializeImageMagick(
  wasmBytes,
);

Deno.serve(async (req) => {
  const formData = await req.formData();
  const content = await formData.get("file").bytes();

  let result = ImageMagick.read(
    content,
    (img): Uint8Array => {
      // resize the image
      img.resize(500, 300);
      // add a blur of 60x5
      img.blur(60, 5);

      return img.write(
        (data) => data,
      );
    },
  );

  return new Response(
    result,
    { headers: { "Content-Type": "image/png" } },
  );
});


