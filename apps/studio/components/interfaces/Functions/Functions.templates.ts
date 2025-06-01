export const EDGE_FUNCTION_TEMPLATES = [
  {
    value: 'hello-world',
    name: 'Simple Hello World',
    description: 'Basic function that returns a JSON response',
    content: `// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
interface reqPayload {
  name: string;
}

console.info('server started');

Deno.serve(async (req: Request) => {
  const { name }: reqPayload = await req.json();
  const data = {
    message: \`Hello \${name}!\`,
  };

  return new Response(
    JSON.stringify(data),
    { headers: { 'Content-Type': 'application/json', 'Connection': 'keep-alive' }}
  );
});`,
  },
  {
    value: 'database-access',
    name: 'Supabase Database Access',
    description: 'Example using Supabase client to query your database',
    content: `// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // TODO: Change the table_name to your table
    const { data, error } = await supabase.from('table_name').select('*')

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({ data }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    return new Response(JSON.stringify({ message: err?.message ?? err }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500 
    })
  }
})`,
  },
  {
    value: 'storage-upload',
    name: 'Supabase Storage Upload',
    description: 'Upload files to Supabase Storage',
    content: `// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { randomUUID } from 'node:crypto'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
)

Deno.serve(async (req) => {
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
  if (error) throw error
  return new Response(
    JSON.stringify({ data }),
    { headers: { 'Content-Type': 'application/json' }}
  )
})`,
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
    value: 'openai-completion',
    name: 'OpenAI Text Completion',
    description: 'Generate text completions using OpenAI GPT-3',
    content: `// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { OpenAI } from "npm:openai@4.8.0"

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
})

Deno.serve(async (req)=>{
  const { prompt } = await req.json()
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: prompt
      }
    ]
  })
  return new Response(JSON.stringify({
    text: response.choices[0].message.content
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Connection': 'keep-alive'
    }
  })
})`,
  },
  {
    value: 'stripe-webhook',
    name: 'Stripe Webhook Example',
    description: 'Handle Stripe webhook events securely',
    content: `// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from 'npm:stripe@12.0.0'

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY') as string, {
  // This is needed to use the Fetch API rather than relying on the Node http
  // package.
  apiVersion: '2024-11-20'
})

// This is needed in order to use the Web Crypto API in Deno.
const cryptoProvider = Stripe.createSubtleCryptoProvider()

console.log('Stripe Webhook Function booted!')

Deno.serve(async (request) => {
  const signature = request.headers.get('Stripe-Signature')

  // First step is to verify the event. The .text() method must be used as the
  // verification relies on the raw request body rather than the parsed JSON.
  const body = await request.text()
  let receivedEvent
  try {
    receivedEvent = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')!,
      undefined,
      cryptoProvider
    )
  } catch (err) {
    return new Response(err.message, { status: 400 })
  }
  console.log(\`🔔 Event received: \${receivedEvent.id}\`)
  return new Response(JSON.stringify({ ok: true }), { status: 200 })
});`,
  },
  {
    value: 'resend-email',
    name: 'Send Emails',
    description: 'Send emails using the Resend API',
    content: `// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

Deno.serve(async (req) => {
  const { to, subject, html } = await req.json()
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: \`Bearer \${RESEND_API_KEY}\`,
    },
    body: JSON.stringify({
      from: 'you@example.com',
      to,
      subject,
      html,
    }),
  })
  const data = await res.json()
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  })
})`,
  },
  {
    value: 'image-transform',
    name: 'Image Transformation',
    description: 'Transform images using ImageMagick WASM',
    content: `// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  ImageMagick,
  initializeImageMagick,
} from "npm:@imagemagick/magick-wasm@0.0.30"

await initializeImageMagick()

Deno.serve(async (req) => {
  const formData = await req.formData()
  const file = formData.get('file')
  const content = await file.arrayBuffer()
  const result = await ImageMagick.read(new Uint8Array(content), (img) => {
    img.resize(500, 300)
    img.blur(60, 5)
    return img.write(data => data)
  })
  return new Response(
    result,
    { headers: { 'Content-Type': 'image/png' }}
  )
})`,
  },
  {
    value: 'websocket-server',
    name: 'Websocket Server Example',
    description: 'Create a real-time WebSocket server',
    content: `// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve((req) => {
  const upgrade = req.headers.get("upgrade") || ""
  if (upgrade.toLowerCase() != "websocket") {
    return new Response("request isn't trying to upgrade to websocket.")
  }
  const { socket, response } = Deno.upgradeWebSocket(req)
  socket.onopen = () => {
    console.log("client connected!")
    socket.send('Welcome to Supabase Edge Functions!')
  }
  socket.onmessage = (e) => {
    console.log("client sent message:", e.data)
    socket.send(new Date().toString())
  }
  return response
})`,
  },
]
