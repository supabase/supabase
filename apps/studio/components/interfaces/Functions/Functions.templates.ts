export const EDGE_FUNCTION_TEMPLATES = [
  {
    value: 'hello-world',
    name: 'Simple Hello World',
    description: 'Basic function that returns a JSON response',
    content: `// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";

interface ReqPayload {
  name: string;
}

console.info("server started");

export default {
  fetch: withSupabase({ auth: ["publishable", "secret"] }, async (req, ctx) => {
    const { name }: ReqPayload = await req.json();

    // Using 'sb_secret_xyz' bypasses RLS — use for privileged operations
    if (ctx.authType === "secret") {
      return Response.json({
        message: \`Hello \${name} admin!\`,
      });
    }

    return Response.json({
      message: \`Hello \${name}!\`,
    });
  }),
};`,
  },
  {
    value: 'database-access',
    name: 'Supabase Database Access',
    description: 'Example using Supabase client to query your database',
    content: `// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";

// This endpoint uses 'user' access, credentials is required.
export default {
  fetch: withSupabase({ auth: "user" }, async (_req, { supabase }) => {
    // TODO: Change the table_name to your table
    const { data, error } = await supabase.from("table_name").select("*");

    if (error) {
      return Response.json(
        { error: error.message },
        { status: 500 },
      );
    }

    return Response.json({ data });
  }),
};`,
  },
  {
    value: 'storage-upload',
    name: 'Supabase Storage Upload',
    description: 'Upload files to Supabase Storage',
    content: `// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";
import { randomUUID } from "node:crypto"

export default {
  fetch: withSupabase({ auth: "publishable" }, async (req, { supabase }) => {
    const formData = await req.formData()
    const file = formData.get('file')

    // TODO: update your-bucket to the bucket you want to write files
    const { data, error } = await supabase
      .storage
      .from('your-bucket')
      .upload(
        \`\${file.name}-\${randomUUID()}\`,
        file,
        { contentType: file.type }
      )

    if (error) {
      return Response.json(
        { error: error.message },
        { status: 500 },
      );
    }

    return Response.json({ data });
  }),
};`,
  },
  {
    value: 'node-api',
    name: 'Node Built-in API Example',
    description: 'Example using Node.js built-in crypto and http modules',
    content: `// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { randomBytes } from "node:crypto";
import { createServer } from "node:http";
import process from "node:process";

const generateRandomString = (length) => {
  const buffer = randomBytes(length);
  return buffer.toString('hex');
};

const randomString = generateRandomString(10);
console.log(randomString);

const server = createServer((req, res) => {
  const message = \`Hello\`;
  res.end(message);
});

server.listen(9999);`,
  },
  {
    value: 'express',
    name: 'Express Server',
    description: 'Example using Express.js for routing',
    content: `// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import express from "npm:express@4.18.2";

const app = express();

// TODO: replace slug with Function's slug
// https://supabase.com/docs/guides/functions/routing?queryGroups=framework&framework=expressjs
app.get(/slug/(.*)/, (req, res) => {
  res.send("Welcome to Supabase");
});

app.listen(8000);`,
  },
  {
    value: 'stream-text-with-ai-sdk',
    name: 'Stream text with AI SDK',
    description: 'Generate and stream text with Vercel AI SDK',
    content: `/*
 * Setup OPENAI_API_KEY secret to get started.
 * For usage with useChat, point transport.api to this endpoint
 * and include your publishable key as ApiKey: <key> in transport.headers.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";
import { createOpenAI } from "npm:@ai-sdk/openai";
import { convertToModelMessages, streamText } from "npm:ai";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Max-Age": "3600",
  Vary: "Access-Control-Request-Headers",
};

class ClientError extends Error {}

const openai = createOpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

const SYSTEM_PROMPT = "You are a helpful AI assistant.";

export default {
  fetch: withSupabase({ auth: "publishable", cors }, async (req, _ctx) => {
    try {
      const body = await req.json().catch(() => {
        throw new ClientError("Invalid JSON payload");
      }) as { messages?: unknown; model?: unknown };

      const { messages, model: modelName } = body;

      if (!Array.isArray(messages)) {
        throw new ClientError("Request must include a messages array");
      }

      const normalizedMessages = await convertToModelMessages(messages);

      const model = openai(
        typeof modelName === "string" ? modelName : "gpt-5.1-chat-latest",
      );

      const result = streamText({
        model,
        messages: normalizedMessages,
        system: SYSTEM_PROMPT,
      });

      return result.toUIMessageStreamResponse({
        sendReasoning: true,
        sendSources: true,
      });
    } catch (err) {
      if (err instanceof ClientError) {
        return Response.json({ error: err.message }, { status: 400 });
      }

      console.error("Assistant chat error:", err);
      return Response.json({
        error: "Failed to process chat request",
        details: err instanceof Error ? err.message : String(err),
      }, { status: 500 });
    }
  }),
};`,
  },
  {
    value: 'generate-recipes-with-ai-sdk',
    name: 'Generate recipes with AI SDK',
    description: 'Generate structured cooking recipes with Vercel AI SDK',
    content: `/*
 * 1) Setup OPENAI_API_KEY secret to get started.
 * 2) Call this endpoint with { prompt, model? } to generate a recipe object matching the schema below.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";
import { createOpenAI } from "npm:@ai-sdk/openai";
import { generateText, Output } from "npm:ai";
import { z } from "npm:zod";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Max-Age": "3600",
  Vary: "Access-Control-Request-Headers",
};

class ClientError extends Error {}

const openai = createOpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

const RecipeSchema = z.object({
  recipe: z.object({
    name: z.string(),
    ingredients: z.array(z.string()),
    steps: z.array(z.string()),
  }),
});

const SYSTEM_PROMPT =
  "You are a recipe generator. Always return a structured recipe matching the given schema.";

export default {
  fetch: withSupabase({ auth: "publishable", cors }, async (req, _ctx) => {
    try {
      const body = await req.json().catch(() => {
        throw new ClientError("Invalid JSON payload");
      }) as {
        model?: unknown;
        prompt?: unknown;
      };

      const { model: modelName, prompt } = body;

      if (typeof prompt !== "string" || !prompt.trim()) {
        throw new ClientError("Request must include a non-empty prompt string");
      }

      const model = openai(
        typeof modelName === "string" ? modelName : "gpt-5.1-chat-latest",
      );

      const result = await generateText({
        model,
        system: SYSTEM_PROMPT,
        prompt,
        output: Output.object({
          schema: RecipeSchema,
        }),
      });

      return Response.json(result.output, { status: 200 });
    } catch (err) {
      if (err instanceof ClientError) {
        return Response.json({ error: err.message }, { status: 400 });
      }

      console.error("generateText error:", err);
      console.error("Assistant chat error:", err);
      return Response.json({
        error: "Failed to process generateText request",
        details: err instanceof Error ? err.message : String(err),
      }, { status: 500 });
    }
  }),
};`,
  },
  {
    value: 'stripe-webhook',
    name: 'Stripe Webhook Example',
    description: 'Handle Stripe webhook events securely',
    content: `// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";
import Stripe from "npm:stripe";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

export default {
  fetch: withSupabase({ auth: "none" }, async (req, { supabaseAdmin }) => {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature")!;

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        sig,
        Deno.env.get("STRIPE_WEBHOOK_SECRET")!,
      );
    } catch {
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }

    /*
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await supabaseAdmin
          .from("orders")
          .update({ status: "paid" })
          .eq("stripe_session_id", session.id);
        break;
      }
    }
    */

    console.log(\`🔔 Event received: \${event.id}\`)
    return Response.json({ received: true });
  }),
};
`,
  },
  {
    value: 'resend-email',
    name: 'Send Emails',
    description: 'Send emails using the Resend API',
    content: `// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

export default {
  fetch: withSupabase({ auth: "user" }, async (req, _ctx) => {
    const { to, subject, html } = await req.json();
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: \`Bearer \${RESEND_API_KEY}\`,
      },
      body: JSON.stringify({
        from: "you@example.com",
        to,
        subject,
        html,
      }),
    });
    const data = await res.json();

    return Response.json(data);
  }),
};`,
  },
  {
    value: 'image-transform',
    name: 'Image Transformation',
    description: 'Transform images using ImageMagick WASM',
    content: `// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";
import {
  ImageMagick,
  initializeImageMagick,
} from "npm:@imagemagick/magick-wasm@0.0.30";

await initializeImageMagick();

export default {
  fetch: withSupabase({ auth: "publishable" }, async (req, _ctx) => {
    const formData = await req.formData();
    const file = formData.get("file");
    const content = await file.arrayBuffer();

    const result = await ImageMagick.read(new Uint8Array(content), (img) => {
      img.resize(500, 300);
      img.blur(60, 5);
      return img.write((data) => data);
    });

    return new Response(
      result,
      { headers: { "Content-Type": "image/png" } },
    );
  }),
};`,
  },
  {
    value: 'websocket-server',
    name: 'WebSocket Server Example',
    description: 'Create a real-time WebSocket server',
    content: `// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";

export default {
  fetch: withSupabase({ auth: "publishable" }, async (req, _ctx) => {
    const upgrade = req.headers.get("upgrade") || "";
    if (upgrade.toLowerCase() != "websocket") {
      return new Response("request isn't trying to upgrade to websocket.");
    }

    const { socket, response } = Deno.upgradeWebSocket(req);

    socket.onopen = () => {
      console.log("client connected!");
      socket.send("Welcome to Supabase Edge Functions!");
    };

    socket.onmessage = (e) => {
      console.log("client sent message:", e.data);
      socket.send(new Date().toString());
    };

    return response;
  }),
};`,
  },
]
