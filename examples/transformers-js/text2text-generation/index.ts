// https://huggingface.co/tasks/text-generation#text-to-text-generation-models

import {
  env,
  pipeline,
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.1";
import SampleInput from "./sample_input.json" with { type: "json" };

// Browser cache is supported by `deno_cache`
// env.useBrowserCache = true; -> Default config

// Ensure we do not use local models
env.allowLocalModels = false;

const pipe = await pipeline("text2text-generation", null, { device: "auto" });

type Payload = {
  input: string;
};

Deno.serve(async (req: Request) => {
  //const { input } = await req.json() as Payload;
  const { input } = SampleInput;

  const output = await pipe(input, {
    top_k: 0,
    do_sample: false,
  });

  return new Response(output.at(0)?.generated_text);
});
