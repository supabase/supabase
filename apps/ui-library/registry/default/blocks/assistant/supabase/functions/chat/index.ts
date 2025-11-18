import { experimental_createMCPClient as createMCPClient } from '@ai-sdk/mcp'
import { openai } from '@ai-sdk/openai'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { convertToModelMessages, stepCountIs, streamText } from 'ai'
import { corsHeaders } from '../_shared/cors.ts'
import { systemPrompt } from './prompt.ts'

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

  const modelId = body.model && typeof body.model === 'string' ? body.model : 'gpt-4o'

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

  // Create MCP client to connect to our MCP server
  let mcpClient
  let tools = {}

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const mcpServerUrl = `${supabaseUrl}/functions/v1/mcp-server/mcp`

    // Use StreamableHTTPClientTransport for compatibility with mcp-lite's StreamableHttpTransport
    const transport = new StreamableHTTPClientTransport(new URL(mcpServerUrl), {
      requestInit: {
        headers: {
          Authorization: authHeader,
        },
      },
    })

    mcpClient = await createMCPClient({
      transport,
    })

    // Get available tools from the MCP server
    tools = await mcpClient.tools()
  } catch (mcpError) {
    console.error('MCP client initialization error:', mcpError)
    // Continue without MCP tools if initialization fails
  }

  try {
    const result = await streamText({
      model: openai(modelId),
      messages: normalizedMessages,
      stopWhen: stepCountIs(5),
      system: systemPrompt,
      tools,
      onFinish: async () => {
        // Close the MCP client when the stream is complete
        if (mcpClient) {
          await mcpClient.close()
        }
      },
    })

    return result.toUIMessageStreamResponse({
      headers: corsHeaders,
      sendReasoning: true,
      sendSources: true,
    })
  } catch (error) {
    console.error('Assistant chat error:', error)

    // Ensure MCP client is closed even on error
    if (mcpClient) {
      try {
        await mcpClient.close()
      } catch (closeError) {
        console.error('Error closing MCP client:', closeError)
      }
    }

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
