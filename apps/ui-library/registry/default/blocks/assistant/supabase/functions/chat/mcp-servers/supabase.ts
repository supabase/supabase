import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import type { MCPServerDefinition } from './types.ts'

export const supabaseMcpServer: MCPServerDefinition = {
  id: 'supabase-edge',
  name: 'Supabase Edge MCP Server',
  description: 'Local MCP server that provides Supabase task tools.',
  createTransport: ({ authHeader }) => {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    if (!supabaseUrl) {
      console.warn('SUPABASE_URL is not configured. Skipping Supabase MCP server registration.')
      return null
    }

    const normalizedUrl = supabaseUrl.replace(/\/$/, '')
    const mcpServerUrl = `${normalizedUrl}/functions/v1/mcp-server/mcp`

    return new StreamableHTTPClientTransport(new URL(mcpServerUrl), {
      requestInit: {
        headers: {
          Authorization: authHeader,
        },
      },
    })
  },
}
