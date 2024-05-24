// AWS SDK issue: https://github.com/aws/aws-sdk-js-v3/issues/6134
// We need to mock the file system for the AWS SDK to work.
import {
  prepareVirtualFile,
} from "https://deno.land/x/mock_file@v1.1.2/mod.ts";

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "npm:@aws-sdk/client-bedrock-runtime";
import { createClient } from "npm:@supabase/supabase-js";
import { decode } from "npm:base64-arraybuffer";

console.log("Hello from Amazon Bedrock!");

Deno.serve(async (req) => {
  prepareVirtualFile("./aws/config");
  prepareVirtualFile("./aws/credentials");

  const client = new BedrockRuntimeClient({
    region: "us-west-2",
    credentials: {
      accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID") ?? "",
      secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY") ?? "",
      sessionToken: Deno.env.get("AWS_SESSION_TOKEN") ?? "",
    },
  });

  const { prompt, seed } = await req.json();
  console.log(prompt);
  const input = {
    contentType: "application/json",
    accept: "*/*",
    modelId: "amazon.titan-image-generator-v1",
    body: JSON.stringify({
      "taskType": "TEXT_IMAGE",
      "textToImageParams": { "text": prompt },
      "imageGenerationConfig": {
        "numberOfImages": 1,
        "quality": "standard",
        "cfgScale": 8.0,
        "height": 512,
        "width": 512,
        "seed": seed ?? 0,
      },
    }),
  };

  const command = new InvokeModelCommand(input);
  const response = await client.send(command);
  console.log(response);

  if (response.$metadata.httpStatusCode === 200) {
    const { body, $metadata } = response;

    const textDecoder = new TextDecoder("utf-8");
    const jsonString = textDecoder.decode(body.buffer);
    const parsedData = JSON.parse(jsonString);
    console.log(parsedData);
    const image = parsedData.images[0];

    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get("SUPABASE_URL")!,
      // Supabase API ANON KEY - env var exported by default.
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: upload, error: uploadError } = await supabaseClient.storage
      .from("images")
      .upload(`${$metadata.requestId ?? ""}.png`, decode(image), {
        contentType: "image/png",
        cacheControl: "3600",
        upsert: false,
      });
    if (!upload) {
      return Response.json(uploadError);
    }
    const { data } = supabaseClient
      .storage
      .from("images")
      .getPublicUrl(upload.path!);
    return Response.json(data);
  }

  return Response.json(response);
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Start with env: `supabase functions serve --env-file supabase/.env`
  3. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/image_gen' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"prompt":"A beautiful picture of a bird"}'
*/
