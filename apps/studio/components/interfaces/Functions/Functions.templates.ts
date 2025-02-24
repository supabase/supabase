export const EDGE_FUNCTION_TEMPLATES = [
  {
    title: 'Simple Hello World',
    slug: 'hello-world',
    code: `// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

console.info('server started');

Deno.serve(async (req: Request) => {
  const data = {
    message: 'Hello from Supabase Edge Functions!',
  };

  return new Response(
    JSON.stringify(data),
    { headers: { 'Content-Type': 'application/json', 'Connection': 'keep-alive' }}
  );
});`,
  },
  {
    title: 'Generate text completions with OpenAI GPT-3',
    slug: 'openai-completion',
    code: `// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Configuration, OpenAIApi } from 'npm:openai@3.3.0'

const openAi = new OpenAIApi(
  new Configuration({
    apiKey: Deno.env.get('OPENAI_API_KEY')
  })
)

Deno.serve(async (req) => {
  const { prompt } = await req.json()
  const completion = await openAi.createCompletion({
    model: 'text-davinci-003',
    prompt,
    max_tokens: 200
  })

  return new Response(
    JSON.stringify({ text: completion.data.choices[0].text }),
    { headers: { 'Content-Type': 'application/json' }}
  )
})`,
  },
  {
    title: 'Handle Stripe webhook events securely',
    slug: 'stripe-webhook',
    code: `// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from 'npm:stripe@12.0.0'

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY')!)
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')!

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')

  try {
    const event = stripe.webhooks.constructEvent(
      await req.text(),
      signature!,
      endpointSecret
    )

    switch (event.type) {
      case 'payment_intent.succeeded':
        // Handle successful payment
        break
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }), 
      { status: 400 }
    )
  }
})`,
  },
  {
    title: 'Send emails using the Resend API',
    slug: 'resend-email',
    code: `// Setup type definitions for built-in Supabase Runtime APIs
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
    title: 'Query your database directly via Edge Functions',
    slug: 'database-query',
    code: `// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { 
      global: { 
        headers: { Authorization: req.headers.get('Authorization')! }
      }
    }
  )

  const { data, error } = await supabase
    .from('your_table')
    .select('*')

  if (error) throw error

  return new Response(
    JSON.stringify({ data }),
    { headers: { 'Content-Type': 'application/json' }}
  )
})`,
  },
  {
    title: 'Transform images using ImageMagick WASM',
    slug: 'image-transform',
    code: `// Setup type definitions for built-in Supabase Runtime APIs
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
    title: 'Build a Slash Command Discord Bot',
    slug: 'discord-bot',
    code: `// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { verifyDiscordRequest } from './_shared/discord.ts'

Deno.serve(async (req) => {
  const { valid } = await verifyDiscordRequest(req)
  if (!valid) {
    return new Response('Invalid request', { status: 401 })
  }

  const message = await req.json()

  if (message.type === 1) {
    return new Response(
      JSON.stringify({ type: 1 }),
      { headers: { 'Content-Type': 'application/json' }}
    )
  }

  return new Response(
    JSON.stringify({
      type: 4,
      data: { content: 'Hello from Supabase Edge Functions!' }
    }),
    { headers: { 'Content-Type': 'application/json' }}
  )
})`,
  },
  {
    title: 'Create a real-time WebSocket server',
    slug: 'websocket-server',
    code: `// Setup type definitions for built-in Supabase Runtime APIs
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
  {
    title: 'Upload files to Supabase Storage',
    slug: 'storage-upload',
    code: `// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
)

Deno.serve(async (req) => {
  const formData = await req.formData()
  const file = formData.get('file')

  const { data, error } = await supabase
    .storage
    .from('your-bucket')
    .upload(
      \`files/\${crypto.randomUUID()}\`,
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
]
