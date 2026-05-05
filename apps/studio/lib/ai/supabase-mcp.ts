import { createMCPClient } from '@ai-sdk/mcp'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory'
import { createSupabaseMcpServer } from '@supabase/mcp-server-supabase'
import { createSupabaseApiPlatform } from '@supabase/mcp-server-supabase/platform/api'

import { API_URL } from '@/lib/constants'

export async function createSupabaseMCPClient({
  accessToken,
  projectId,
}: {
  accessToken: string
  projectId: string
}) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()

  // Instantiate the MCP server and connect to its transport
  const apiUrl = API_URL?.replace('/platform', '')
  const server = createSupabaseMcpServer({
    platform: createSupabaseApiPlatform({
      accessToken,
      apiUrl,
    }),
    contentApiUrl: process.env.NEXT_PUBLIC_CONTENT_API_URL,
    projectId,
    readOnly: true,
  })
  await server.connect(serverTransport)

  // Create the MCP client and connect to its transport
  const client = await createMCPClient({
    name: 'supabase-studio',
    transport: clientTransport,
  })

  return client
}
