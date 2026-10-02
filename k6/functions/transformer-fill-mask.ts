import {
  env,
  pipeline,
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.1";

env.allowLocalModels = false;

const pipe = await pipeline("fill-mask", null, { device: "auto" });
const input = "[MASK] is the capital of England.";
const output = await pipe(input);

Deno.serve(() => Response.json(output));
