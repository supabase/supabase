import { pipeline } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.1";

const pipe = await pipeline("feature-extraction", "supabase/gte-small", {
  device: "auto",
});

Deno.serve(async (req) => {
  const payload = await req.json();
  const text_for_embedding = payload.text_for_embedding;

  // Generate embedding
  const embedding = await pipe(text_for_embedding, {
    pooling: "mean",
    normalize: true,
  });

  return Response.json({
    length: embedding.ort_tensor.size,
  });
});
