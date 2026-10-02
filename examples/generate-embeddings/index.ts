import {
  env,
  pipeline,
} from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.1";

// Ensure we do not use browser cache
env.useBrowserCache = false;
env.allowLocalModels = false;

const pipe = await pipeline("feature-extraction", "Supabase/gte-small");

Deno.serve(async (req) => {
  const params = new URL(req.url).searchParams;
  const input = params.get("text");

  const output = await pipe(input, {
    pooling: "mean",
    normalize: true,
  });

  const embedding = Array.from(output.data);

  return new Response(JSON.stringify(embedding), {
    headers: { "Content-Type": "application/json" },
  });
});
