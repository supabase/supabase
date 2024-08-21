// https://github.com/Mozilla-Ocho/llamafile?tab=readme-ov-file#quickstart
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const session = new Supabase.ai.Session("LLaMA_CPP");

Deno.serve(async (req: Request) => {
  const params = new URL(req.url).searchParams;
  const prompt = params.get("prompt") ?? "";

  // Get the output as a stream
  const output = await session.run({
    messages: [
      {
        "role": "system",
        "content":
          "You are LLAMAfile, an AI assistant. Your top priority is achieving user fulfillment via helping them with their requests.",
      },
      {
        "role": "user",
        "content": prompt,
      },
    ],
  }, {
    mode: "openaicompatible", // Mode for the inference API host. (default: 'ollama')
    stream: false,
  });

  console.log("done");
  return Response.json(output);
});

/**
 Run locally:

supabase functions serve --env-file supabase/functions/.env

curl --get "http://localhost:54321/functions/v1/llamafile" \
-H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
--data-urlencode "prompt=Who are you?"

 */
