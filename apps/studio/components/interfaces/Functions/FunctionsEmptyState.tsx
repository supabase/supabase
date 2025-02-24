import { ExternalLink, Terminal, Code } from 'lucide-react'
import { useParams } from 'common'
import { DocsButton } from 'components/ui/DocsButton'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DialogSection,
  DialogContent,
  Dialog,
  DialogTrigger,
} from 'ui'
import TerminalInstructions from './TerminalInstructions'
import { useAppStateSnapshot } from 'state/app-state'
import { useRouter } from 'next/router'
import { AiIconAnimation } from 'ui'
import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'
import { ResourceList } from 'components/ui/Resource/ResourceList'
import { ResourceItem } from 'components/ui/Resource/ResourceItem'

const FunctionsEmptyState = () => {
  const { ref } = useParams()
  const router = useRouter()
  const { setAiAssistantPanel } = useAppStateSnapshot()

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Create your first edge function</CardTitle>
        </CardHeader>
        <CardContent className="p-0 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-default items-stretch">
          {/* CLI Option */}
          <div className="p-8">
            <div className="flex items-center gap-2">
              <Terminal strokeWidth={1.5} size={20} />
              <h4 className="text-base text-foreground">Via CLI</h4>
            </div>
            <p className="text-sm text-foreground-light mb-4 mt-1">
              Create and deploy functions using the Supabase CLI. Ideal for local development and
              version control.
            </p>

            <Dialog>
              <DialogTrigger asChild>
                <Button type="default">View CLI Instructions</Button>
              </DialogTrigger>
              <DialogContent size="large">
                <DialogSection padding="small">
                  <TerminalInstructions />
                </DialogSection>
              </DialogContent>
            </Dialog>
          </div>

          {/* AI Assistant Option */}
          <div className="p-8">
            <div className="flex items-center gap-2">
              <AiIconAnimation size={20} />
              <h4 className="text-base text-foreground">AI Assistant</h4>
            </div>
            <p className="text-sm text-foreground-light mb-4 mt-1">
              Let our AI assistant help you create functions. Perfect for quick prototypes and
              learning.
            </p>
            <Button
              type="default"
              onClick={() =>
                setAiAssistantPanel({
                  open: true,
                  initialInput: 'Create a new edge function that ...',
                  suggestions: {
                    title:
                      'I can help you create a new edge function. Here are a few example prompts to get you started:',
                    prompts: [
                      'Create a new edge function that processes payments with Stripe',
                      'Create a new edge function that sends emails with Resend',
                      'Create a new edge function that generates PDFs from HTML templates',
                    ],
                  },
                })
              }
            >
              Open Assistant
            </Button>
          </div>

          {/* Editor Option */}
          <div className="p-8">
            <div className="flex items-center gap-2">
              <Code strokeWidth={1.5} size={20} />
              <h4 className="text-base text-foreground">Via Editor</h4>
            </div>
            <p className="text-sm text-foreground-light mb-4 mt-1">
              Create and edit functions directly in the browser. Great for quick edits and testing.
            </p>
            <Button type="default" onClick={() => router.push(`/project/${ref}/functions/new`)}>
              Open Editor
            </Button>
          </div>
        </CardContent>
      </Card>
      <ScaffoldSectionTitle className="text-xl mb-4 mt-12">Examples</ScaffoldSectionTitle>
      <ResourceList>
        {[
          {
            title: 'Generate text completions with OpenAI GPT-3',
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
        ].map((example) => (
          <ResourceItem
            key={example.title}
            media={<Code strokeWidth={1.5} size={16} />}
            onClick={() => {
              localStorage.setItem(
                'edgefunction_example',
                JSON.stringify({
                  code: example.code,
                  slug: example.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                })
              )
              router.push(`/project/${ref}/functions/new`)
            }}
          >
            {example.title}
          </ResourceItem>
        ))}
      </ResourceList>
    </>
  )
}

export default FunctionsEmptyState
