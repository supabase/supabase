// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { createMcpHandler, McpServer } from '@modelcontextprotocol/server'
import { z } from 'zod'

const handler = createMcpHandler(() => {
  const server = new McpServer({ name: 'mcp', version: '0.1.0' })

  server.registerTool(
    'add',
    {
      title: 'Addition Tool',
      description: 'Add two numbers together',
      inputSchema: z.object({ a: z.number(), b: z.number() }),
    },
    ({ a, b }) => ({ content: [{ type: 'text', text: String(a + b) }] })
  )

  return server
})

Deno.serve((req) => handler.fetch(req))
