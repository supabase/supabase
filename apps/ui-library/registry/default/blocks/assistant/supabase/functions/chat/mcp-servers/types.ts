import type { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

export type MCPServerContext = {
  authHeader: string
}

export type MCPServerDefinition = {
  id: string
  name: string
  description?: string
  createTransport: (
    context: MCPServerContext
  ) => Promise<StreamableHTTPClientTransport | null> | StreamableHTTPClientTransport | null
}
