// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:supabase-js@2";
import { ElevenLabsClient } from "npm:elevenlabs@1.52.0";
import * as hash from "npm:object-hash";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const client = new ElevenLabsClient({
  apiKey: Deno.env.get("ELEVENLABS_API_KEY"),
});

// Upload audio to Supabase Storage in a background task
async function uploadAudioToStorage(
  stream: ReadableStream,
  requestHash: string,
) {
  const { data, error } = await supabase.storage
    .from("audio")
    .upload(`${requestHash}.mp3`, stream, {
      contentType: "audio/mp3",
    });

  console.log("Storage upload result", { data, error });
}

Deno.serve(async (req) => {
  // To secure your function for production, you can for example validate the request origin,
  // or append a user access token and validate it with Supabase Auth.
  console.log("Request origin", req.headers.get("host"));
  const url = new URL(req.url);
  const params = new URLSearchParams(url.search);
  const text = params.get("text");
  const voiceId = params.get("voiceId") ?? "JBFqnCBsd6RMkjVDRZzb";

  const requestHash = hash.MD5({ text, voiceId });
  console.log("Request hash", requestHash);

  // Check storage for existing audio file
  const { data } = await supabase
    .storage
    .from("audio")
    .createSignedUrl(`${requestHash}.mp3`, 60);

  if (data) {
    console.log("Audio file found in storage", data);
    const storageRes = await fetch(data.signedUrl);
    if (storageRes.ok) return storageRes;
  }

  if (!text) {
    return new Response(
      JSON.stringify({ error: "Text parameter is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    console.log("ElevenLabs API call");
    const response = await client.textToSpeech.convertAsStream(voiceId, {
      output_format: "mp3_44100_128",
      model_id: "eleven_multilingual_v2",
      text,
    });

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          controller.enqueue(chunk);
        }
        controller.close();
      },
    });

    // Branch stream to Supabase Storage
    const [browserStream, storageStream] = stream.tee();

    // Upload to Supabase Storage in the background
    EdgeRuntime.waitUntil(uploadAudioToStorage(storageStream, requestHash));

    // Return the streaming response immediately
    return new Response(browserStream, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.log("error", { error });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
