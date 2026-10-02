import {
  Gravity,
  ImageMagick,
  initializeImageMagick,
  MagickColors,
  MagickFormat,
  MagickGeometry,
} from "npm:@imagemagick/magick-wasm@0.0.30";

import {
  env,
  pipeline,
  RawImage,
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.1";

const wasmBytes = await Deno.readFile(
  new URL(
    "magick.wasm",
    import.meta.resolve("npm:@imagemagick/magick-wasm@0.0.30"),
  ),
);

await initializeImageMagick(
  wasmBytes,
);

// May need to increase the worker memory limit
const pipe = await pipeline(
  "image-feature-extraction",
  "Xenova/clip-vit-base-patch32",
  {
    device: "auto",
  },
);

// Ensure we do not use browser cache
env.useBrowserCache = false;
env.allowLocalModels = false;

export async function fetchImage(url: string) {
  const imageRes = await fetch(new URL(url));
  const imageBlob = await imageRes.blob();
  const buffer = await imageBlob.arrayBuffer();

  return new Uint8Array(buffer);
}

Deno.serve(async (request) => {
  const { image_url } = await request.json();
  const imageFile = await fetchImage(image_url);

  const image = ImageMagick.read(imageFile, (img) => {
    const { width, height } = pipe.processor.feature_extractor.crop_size;

    // We need to resize to fit model dims
    // https://legacy.imagemagick.org/Usage/resize/#space_fill
    img.resize(new MagickGeometry(width, height));
    img.extent(
      new MagickGeometry(width, height),
      Gravity.Center,
      MagickColors.Transparent,
    );

    return img
      .write(
        MagickFormat.Rgba,
        (buffer) => ({
          buffer,
          width: img.width,
          height: img.height,
          channels: img.channels.length,
        }),
      );
  });

  const imageInput = new RawImage(
    image.buffer,
    image.width,
    image.height,
    image.channels,
  );

  // Disable pre-processor transformations
  pipe.processor.feature_extractor.do_resize = false;
  pipe.processor.feature_extractor.do_center_crop = false;

  const output = await pipe(imageInput);

  return Response.json({ output });
});
