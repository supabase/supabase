// https://huggingface.co/tasks/question-answering

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
const pipe = await pipeline("question-answering", null, { device: "auto" });

type Payload = {
  input: string;
  context: string;
};

Deno.serve(async (req: Request) => {
  //const { input, context } = await req.json() as Payload;
  const { input, context } = SampleInput;

  const output = await pipe(input, context);

  // use '__snapshot__' to assert results
  return Response.json(output);
});
