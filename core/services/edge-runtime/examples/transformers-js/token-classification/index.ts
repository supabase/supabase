// https://huggingface.co/tasks/token-classification

import {
  env,
  pipeline,
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";
import SampleInput from "./sample_input.json" with { type: "json" };

// Browser cache is supported by `deno_cache`
// env.useBrowserCache = true; -> Default config

// Ensure we do not use local models
env.allowLocalModels = false;

const pipe = await pipeline("token-classification", null, { device: "auto" });

type Payload = {
  input: string;
};

Deno.serve(async (req: Request) => {
  //const { input } = await req.json() as Payload;
  const { input } = SampleInput;

  // batch `input[]` inference is also supported
  const output = await pipe(input);

  return Response.json(output);
});
