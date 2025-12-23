import { experimental_createMCPClient as createMCPClient } from '@ai-sdk/mcp'
import { openai } from '@ai-sdk/openai'
import { convertToModelMessages, stepCountIs, streamText } from 'ai'
import { corsHeaders } from '../_shared/cors.ts'
import { mcpServerRegistry } from './mcp-servers/registry.ts'
import { systemPrompt } from './prompt.ts'
import { renderTools } from './render-tools.ts'

type ChatRequestBody = {
  messages?: unknown[]
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

  const modelId = body.model && typeof body.model === 'string' ? body.model : 'gpt-5-mini'

  let normalizedMessages
  try {
    normalizedMessages = convertToModelMessages(body.messages as any)
  } catch (conversionError) {
    console.error('Assistant chat message normalization error:', conversionError)
    return new Response(JSON.stringify({ error: 'Invalid message format' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Create MCP clients from registry definitions
  let tools = { ...renderTools }
  const mcpClients: Array<{ id: string; client: Awaited<ReturnType<typeof createMCPClient>> }> = []

  try {
    for (const server of mcpServerRegistry) {
      try {
        const transport = await server.createTransport({ authHeader })
        if (!transport) continue

        const client = await createMCPClient({ transport })
        mcpClients.push({ id: server.id, client })

        const remoteTools = await client.tools()
        tools = { ...tools, ...remoteTools }
      } catch (serverError) {
        console.error(`Failed to initialize MCP server "${server.id}":`, serverError)
      }
    }
  } catch (mcpError) {
    console.error('Unexpected MCP registry initialization error:', mcpError)
  }

  const closeMcpClients = async () => {
    await Promise.all(
      mcpClients.map(async ({ client }) => {
        try {
          await client.close()
        } catch (closeError) {
          console.error('Error closing MCP client:', closeError)
        }
      })
    )
  }

  try {
    const result = await streamText({
      model: openai(modelId),
      messages: normalizedMessages,
      stopWhen: stepCountIs(5),
      system: systemPrompt,
      tools,
      onFinish: async () => {
        await closeMcpClients()
      },
    })

    return result.toUIMessageStreamResponse({
      headers: corsHeaders,
      sendReasoning: true,
      sendSources: true,
    })
  } catch (error) {
    console.error('Assistant chat error:', error)

    await closeMcpClients()

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
