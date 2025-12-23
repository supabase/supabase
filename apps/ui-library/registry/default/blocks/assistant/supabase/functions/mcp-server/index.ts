import { Hono } from 'hono'
import { McpServer, StreamableHttpTransport } from 'mcp-lite'
import { z } from 'zod'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { toolRegistry } from './tools/registry.ts'

// We create two Hono instances:
// 1. `app` is the root handler for the Supabase Edge Function (must match the function name, e.g. /mcp-server)
// 2. `mcpApp` handles the MCP protocol and health endpoints, mounted under the function route
// This pattern is required because Supabase Edge Functions route all requests to /<function-name>/*

const mcp = new McpServer({
  name: 'supabase-assistant-mcp-server',
  version: '1.0.0',
  schemaAdapter: (schema: unknown) => z.toJSONSchema(schema as z.ZodType),
})

// Auth Header Management
// StreamableHttpTransport doesn't expose HTTP request headers to the MCP context (ctx.request.headers is undefined).
// We use a module-level variable to pass the auth header from the Hono handler to MCP middleware.
// This is safe because Supabase Edge Functions process requests sequentially, not concurrently.
// The header is set before processing and cleared in a finally block to prevent leaks.
// Alternative: Use InMemorySessionAdapter with custom session context, but adds unnecessary complexity.
let currentAuthHeader: string | null = null

// Helper function to create authenticated Supabase client
function createAuthenticatedClient(authHeader: string) {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    }
  )
}

// Middleware to inject auth header into MCP context state
mcp.use(async (ctx: any, next: any) => {
  // Try to get auth header from ctx.request.headers (doesn't work with StreamableHttpTransport)
  // Fall back to the stored currentAuthHeader set by the Hono handler
  const authHeader = ctx.request?.headers?.get?.('Authorization') || currentAuthHeader

  if (authHeader) {
    // Make auth header available to all tool handlers via ctx.state
    ctx.state.authHeader = authHeader
  }

  await next()
})

toolRegistry.forEach((tool) => {
  mcp.tool(tool.name, {
    description: tool.description,
    inputSchema: tool.inputSchema,
    handler: async (input: unknown, ctx: any) => {
      const authHeader = ctx.state?.authHeader

      if (!authHeader) {
        return {
          content: [
            {
              type: 'text',
              text: tool.authErrorMessage,
            },
          ],
          isError: true,
        }
      }

      try {
        const supabase = createAuthenticatedClient(authHeader)
        return await tool.run(supabase, input)
      } catch (err) {
        return {
          content: [
            {
              type: 'text',
              text: `Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        }
      }
    },
  })
})

const transport = new StreamableHttpTransport()
const httpHandler = transport.bind(mcp)

const app = new Hono()
const mcpApp = new Hono()

// Handle OPTIONS requests for CORS
mcpApp.use('*', async (c, next) => {
  if (c.req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  await next()
})

mcpApp.get('/', (c) => {
  return c.json({
    message: 'MCP Server on Supabase Edge Functions',
    endpoints: {
      mcp: '/mcp',
      health: '/health',
    },
  })
})

mcpApp.get('/health', (c) => {
  return c.json({
    message: 'Service is up and running',
  })
})

// Handle both POST (for regular MCP requests) and GET (for SSE connections)
const handleMcpRequest = async (c: any) => {
  // Validate Authorization header at the Hono level
  // (StreamableHttpTransport doesn't expose HTTP headers to MCP context)
  const authHeader = c.req.header('Authorization')

  if (!authHeader) {
    return c.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
  }

  // Store auth header so MCP middleware can inject it into ctx.state for tool handlers
  currentAuthHeader = authHeader

  try {
    const response = await httpHandler(c.req.raw)
    return response
  } finally {
    // Clean up auth header after request completes to prevent leaks
    currentAuthHeader = null
  }
}

mcpApp.post('/mcp', handleMcpRequest)
mcpApp.get('/mcp', handleMcpRequest)

// Mount the MCP app at /mcp-server (matches the function name)
app.route('/mcp-server', mcpApp)

export default app
