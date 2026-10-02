const model = new Supabase.ai.Session("gte-small");

Deno.serve(async (req: Request) => {
  const params = new URL(req.url).searchParams;
  const input = params.get("text");
  const output = await model.run(input, { mean_pool: true, normalize: true });
  return new Response(
    JSON.stringify(
      output,
    ),
    {
      headers: {
        "Content-Type": "application/json",
        "Connection": "keep-alive",
      },
    },
  );
});
