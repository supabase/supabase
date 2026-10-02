// https://huggingface.co/tasks/feature-extraction

import {
  env,
  pipeline,
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";
import SampleInput from "./sample_input.json" with { type: "json" };

// Browser cache is supported by `deno_cache`
// env.useBrowserCache = true; -> Default config

// Ensure we do not use local models
env.allowLocalModels = false;

const pipe = await pipeline("feature-extraction", "supabase/gte-small", {
  device: "auto",
}); // 384 dims model

type Payload = {
  inputs: string[];
};

Deno.serve(async (req: Request) => {
  //const { inputs } = await req.json() as Payload;
  const { inputs } = SampleInput;
  const output = await pipe(inputs, { pooling: "mean", normalize: true });

  // use 'output.tolist()' to extract JS array

  // use '__snapshot__' to assert results
  return Response.json(output.data);
});
