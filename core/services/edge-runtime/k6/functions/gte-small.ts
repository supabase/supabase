const session = new Supabase.ai.Session("gte-small");

Deno.serve(async (req) => {
  const payload = await req.json();
  const text_for_embedding = payload.text_for_embedding;

  // Generate embedding
  const embedding = await session.run(text_for_embedding, {
    mean_pool: true,
    normalize: true,
  });

  return Response.json({
    length: embedding.length,
  });
});
