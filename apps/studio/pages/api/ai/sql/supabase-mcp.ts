import { StreamTransport } from '@supabase/mcp-utils'
import { experimental_createMCPClient as createMCPClient } from 'ai'
import { createSupabaseMcpServer } from '@supabase/mcp-server-supabase'
import { API_URL } from 'lib/constants'

export async function createSupabaseMCPClient({
  accessToken,
  projectRef,
}: {
  accessToken: string
  projectRef: string
}) {
  // Create an in-memory transport pair
  const clientTransport = new StreamTransport()
  const serverTransport = new StreamTransport()
  clientTransport.readable.pipeTo(serverTransport.writable)
  serverTransport.readable.pipeTo(clientTransport.writable)

  // Instantiate the MCP server and connect to its transport
  const apiUrl = API_URL?.replace('/platform', '')
  const server = createSupabaseMcpServer({
    platform: {
      accessToken,
      apiUrl,
    },
    readOnly: true,
  })
  await server.connect(serverTransport)

  // Create the MCP client and connect to its transport
  const client = await createMCPClient({
    name: 'Studio AI Assistant', // Give a more specific name
    transport: clientTransport,
  })

  return client
}
