const session = new Supabase.ai.Session("llama2");

Deno.serve(async (req: Request) => {
  const params = new URL(req.url).searchParams;
  const prompt = params.get("prompt");
  const output = await session.run(prompt, { stream: true });

  let response = "";
  for await (const part of output) {
    response += part.response;
  }
  return new Response(
    JSON.stringify(
      response,
    ),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
});

/* To invoke locally:
Ollama Test:

curl --get "http://localhost:9998/supa-ai-ollama" \
--data-urlencode "prompt=write a short rap song about Supabase, the Postgres Developer platform, as sung by Nicki Minaj" \
-H "Authorization: $ANON_KEY"

*/
