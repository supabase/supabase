import type { McpClient, McpClientConfig } from '../types'

interface GetMcpUrlOptions {
  projectRef?: string
  baseUrl?: string
  readonly?: boolean
  features?: string[]
  selectedClient?: McpClient
}

interface GetMcpUrlReturn {
  mcpUrl: string
  clientConfig: McpClientConfig
}

export function getMcpUrl({
  projectRef,
  baseUrl = 'https://api.supabase.com/mcp',
  readonly = false,
  features = [],
  selectedClient,
}: GetMcpUrlOptions): GetMcpUrlReturn {
  // Generate the MCP URL based on current configuration
  const url = new URL(baseUrl)
  if (projectRef) {
    url.searchParams.set('project_ref', projectRef)
  }
  if (readonly) {
    url.searchParams.set('read_only', 'true')
  }
  if (features.length > 0) {
    url.searchParams.set('features', features.join(','))
  }
  const mcpUrl = url.toString()

  let clientConfig: McpClientConfig = {
    mcpServers: {
      supabase: {
        url: mcpUrl,
      },
    },
  }
  // Apply client-specific transformation if available
  if (selectedClient?.transformConfig) {
    clientConfig = selectedClient.transformConfig(clientConfig)
  }

  return {
    mcpUrl,
    clientConfig,
  }
}
