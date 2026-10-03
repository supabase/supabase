const model = new Supabase.ai.Session("gte-small");
const output = await model.run("meowmeow", {
  mean_pool: true,
  normalize: true,
});

Deno.serve((_req) => Response.json(output));
