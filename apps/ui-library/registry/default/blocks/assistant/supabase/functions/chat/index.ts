import { openai } from '@ai-sdk/openai'
import { streamText, type CoreMessage } from 'ai'
import { corsHeaders } from '../_shared/cors.ts'

type ChatRequestBody = {
  messages?: CoreMessage[]
  model?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let body: ChatRequestBody
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!body.messages || !Array.isArray(body.messages)) {
    return new Response(JSON.stringify({ error: 'Request must include a messages array' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const modelId = body.model && typeof body.model === 'string' ? body.model : 'gpt-4o'

  try {
    const result = await streamText({
      model: openai(modelId),
      messages: body.messages,
      system: 'You are a helpful AI assistant.',
    })

    return result.toTextStreamResponse({ headers: corsHeaders })
  } catch (error) {
    console.error('Assistant chat error:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
