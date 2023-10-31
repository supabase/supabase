import { serve } from "https://deno.land/std@0.197.0/http/server.ts";

const hfToken = Deno.env.get("HUGGINGFACE_TOKEN") ?? "";
const openaiApiKey = Deno.env.get("OPEN_AI") ?? "";

console.log("Single Edge function for OPENAI and HuggingFace!");

serve(async (req) => {
  const payload = await req.json();
  const url = new URL(req.url);
  const command = url.pathname.split("/").pop();
  try {
    const generatedText = command === "openai"
      ? await getGeneratedTextFromHuggingFace(payload)
      : await getGeneratedTextFromChatGPT(payload);
    return new Response(JSON.stringify(generatedText), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function getGeneratedTextFromHuggingFace(payload) {
  const huggingfaceUrl = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1";
  const bodyContent = `[INST] ${payload.text} [/INST]`;
  const huggingfaceResponse = await fetch(huggingfaceUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${hfToken}`,
    },
    body: JSON.stringify({ "inputs": bodyContent }),
  });
  const huggingfaceData = await huggingfaceResponse.json();
  if (huggingfaceData.error) {
    console.error(huggingfaceData.error);
    throw new Error(huggingfaceData.error.message);
  }
  return huggingfaceData[0].generated_text.split("[/INST]")[1] || huggingfaceData[0].generated_text;
}

async function getGeneratedTextFromChatGPT(payload) {
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${openaiApiKey}`,
  };
  const openaiUrl = "https://api.openai.com/v1/chat/completions";
  const bodyContent = {
    "model": "gpt-3.5-turbo",
    "messages": [
      {
        "role": "system",
        "content": `You are a detail-oriented, helpful, and eager to please assistant.`
      },
      {
        "role": "user",
        "content": payload.text
      }
    ]
  };
  const openaiResponse = await fetch(openaiUrl, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(bodyContent),
  });
  const openaiData = await openaiResponse.json();
  if (openaiData.error) {
    console.error(openaiData.error);
    throw new Error(openaiData.error.message);
  }
  return openaiData.choices[0].message.content.trim();
}
