import { createSupabaseApiPlatform, createSupabaseMcpServer } from '@supabase/mcp-server-supabase'
import { StreamTransport } from '@supabase/mcp-utils'
import { experimental_createMCPClient as createMCPClient } from 'ai'

export async function createSupabaseMCPClient({
  accessToken,
  apiUrl,
  projectId,
}: {
  accessToken: string
  projectId: string
  apiUrl: string
}) {
  // Create an in-memory transport pair
  const clientTransport = new StreamTransport()
  const serverTransport = new StreamTransport()
  clientTransport.readable.pipeTo(serverTransport.writable)
  serverTransport.readable.pipeTo(clientTransport.writable)

  const server = createSupabaseMcpServer({
    platform: createSupabaseApiPlatform({
      accessToken,
      apiUrl,
    }),
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
