import { assertAlmostEquals, assertEquals } from "jsr:@std/assert";
import {
  env,
  pipeline,
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.1";

import { round6 } from "../util.ts";

// Browser cache is supported by `deno_cache`
// env.useBrowserCache = true; -> Default config

// Ensure we do not use local models
env.allowLocalModels = false;

const pipe = await pipeline("feature-extraction", "supabase/gte-small", {
  device: "auto",
}); // 384 dims model

Deno.serve(async (req: Request) => {
  const input = [
    "This framework generates embeddings for each input sentence",
    "Sentences are passed as a list of string.",
    "The quick brown fox jumps over the lazy dog.",
  ];

  const output = await pipe(input, { pooling: "mean", normalize: true });
  const snapshot = await req.json();

  if (!snapshot) {
    return Response.json(output.data, { status: 201 });
  }

  assertEquals(output.size, 3 * 384);
  assertEquals(output.dims.length, 2);

  for (const [idx, expected] of Object.entries(snapshot)) {
    assertAlmostEquals(round6(output.data[idx]), expected);
  }

  return new Response();
});
