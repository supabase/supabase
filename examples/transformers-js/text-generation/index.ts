// https://huggingface.co/tasks/text-generation

import {
  env,
  pipeline,
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.1";
import SampleInput from "./sample_input.json" with { type: "json" };

// Browser cache is supported by `deno_cache`
// env.useBrowserCache = true; -> Default config

// Ensure we do not use local models
env.allowLocalModels = false;

// There's a little bug in pipeline that can't resolve the model name by itself
// So we need to explicit pass it
const pipe = await pipeline(
  "text-generation",
  "Xenova/gpt2",
  { device: "auto", model_file_name: "decoder_model_merged_quantized" },
);

type Payload = {
  input: string;
};

Deno.serve(async (req: Request) => {
  //const { input } = await req.json() as Payload;
  const { input } = SampleInput;

  const output = await pipe(input, {
    max_new_tokens: 10,
    top_k: 0,
    do_sample: false,
  });

  return new Response(output.at(0)?.generated_text);
});
