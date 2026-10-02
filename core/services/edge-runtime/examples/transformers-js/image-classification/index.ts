// https://huggingface.co/tasks/image-classification

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
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";

import SampleInput from "./sample_input.json" with { type: "json" };

const wasmBytes = await Deno.readFile(
  new URL(
    "magick.wasm",
    import.meta.resolve("npm:@imagemagick/magick-wasm@0.0.30"),
  ),
);

await initializeImageMagick(
  wasmBytes,
);

// Browser cache is supported by `deno_cache`
// env.useBrowserCache = true; -> Default config

// Ensure we do not use local models
env.allowLocalModels = false;

const pipe = await pipeline(
  "image-classification",
  "Xenova/vit-base-patch16-224",
  {
    device: "auto",
  },
);

const preprocessor = (img) => {
  const { width, height } = pipe.processor.image_processor.size;

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
};

export async function fetchImage(url: string) {
  const imageRes = await fetch(new URL(url));
  const imageBlob = await imageRes.blob();
  const buffer = await imageBlob.arrayBuffer();

  return new Uint8Array(buffer);
}

type Payload = {
  imageUrl: string;
};

Deno.serve(async (req: Request) => {
  //const { imageUrl } = await req.json() as Payload;
  const { imageUrl } = SampleInput;

  const imageFile = await fetchImage(imageUrl);

  // Disable default pre-processor transformations
  pipe.processor.image_processor.do_resize = false;
  pipe.processor.image_processor.do_center_crop = false;

  // Apply custom processor backend by ImageMagick
  const image = ImageMagick.read(imageFile, preprocessor);

  const imageInput = new RawImage(
    image.buffer,
    image.width,
    image.height,
    image.channels,
  );

  const output = await pipe(imageInput);

  // use '__snapshot__' to assert results
  return Response.json(output);
});
