// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { StreamableHTTPTransport } from '@hono/mcp'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { Hono } from 'hono'
import { withSupabase } from 'npm:@supabase/server@^1'
import { z } from 'zod'

// Create Hono app
const app = new Hono()

// Create your MCP server
const server = new McpServer({
  name: 'mcp',
  version: '0.1.0',
})

// Register a simple addition tool
server.registerTool(
  'add',
  {
    title: 'Addition Tool',
    description: 'Add two numbers together',
    inputSchema: { a: z.number(), b: z.number() },
  },
  ({ a, b }) => ({
    content: [{ type: 'text', text: String(a + b) }],
  })
)

// Handle MCP requests at the root path
app.all('/', async (c) => {
  const transport = new StreamableHTTPTransport()
  await server.connect(transport)
  return transport.handleRequest(c)
})

// Public endpoint, so deploy with verify_jwt = false.
export default {
  fetch: withSupabase({ auth: 'none' }, app.fetch),
}
