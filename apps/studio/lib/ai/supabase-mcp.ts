import { createSupabaseMcpServer } from '@supabase/mcp-server-supabase'
import { createSupabaseApiPlatform } from '@supabase/mcp-server-supabase/platform/api'
import { StreamTransport } from '@supabase/mcp-utils'
import { experimental_createMCPClient as createMCPClient } from 'ai'

import { API_URL } from 'lib/constants'

export async function createSupabaseMCPClient({
  accessToken,
  projectId,
}: {
  accessToken: string
  projectId: string
}) {
  // Create an in-memory transport pair
  const clientTransport = new StreamTransport()
  const serverTransport = new StreamTransport()
  clientTransport.readable.pipeTo(serverTransport.writable)
  serverTransport.readable.pipeTo(clientTransport.writable)

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
