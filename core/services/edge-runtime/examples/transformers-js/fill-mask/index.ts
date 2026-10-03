// https://huggingface.co/tasks/fill-mask

import {
  env,
  pipeline,
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";
import SampleInput from "./sample_input.json" with { type: "json" };

// Browser cache is supported by `deno_cache`
// env.useBrowserCache = true; -> Default config

// Ensure we do not use local models
env.allowLocalModels = false;

// using `null` to keep default model,
const pipe = await pipeline("fill-mask", null, { device: "auto" });

type Payload = {
  input: string;
};

Deno.serve(async (req: Request) => {
  //const { input } = await req.json() as Payload;
  const { input } = SampleInput;

  // batch `input[]` inference is also supported
  const output = await pipe(input);

  // use '__snapshot__' to assert results
  return Response.json(output.at(0));
});
