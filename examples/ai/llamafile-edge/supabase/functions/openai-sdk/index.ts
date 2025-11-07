// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import OpenAI from "https://deno.land/x/openai@v4.53.2/mod.ts";

console.log("Hello from openai-sdk compatible!");

Deno.serve(async (req) => {
  const client = new OpenAI();
  const { prompt } = await req.json();
  const stream = true;

  const chatCompletion = await client.chat.completions.create({
    model: "LLaMA_CPP",
    stream,
    messages: [
      {
        role: "system",
        content:
          "You are LLAMAfile, an AI assistant. Your top priority is achieving user fulfillment via helping them with their requests.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  if (stream) {
    const headers = new Headers({
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
    });

    // Create a stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          for await (const part of chatCompletion) {
            controller.enqueue(
              encoder.encode(part.choices[0]?.delta?.content || ""),
            );
          }
        } catch (err) {
          console.error("Stream error:", err);
        } finally {
          controller.close();
        }
      },
    });

    // Return the stream to the user
    return new Response(stream, {
      headers,
    });
  }

  console.log(chatCompletion);

  return Response.json(chatCompletion);
});

/* To invoke locally:

  supabase functions serve --env-file supabase/functions/.env

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/openai-sdk' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"prompt":"Who are you?"}'

*/
