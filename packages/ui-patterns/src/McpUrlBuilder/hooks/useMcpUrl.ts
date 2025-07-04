import { useMemo } from 'react'
import type { McpClient, McpClientBaseConfig, McpClientConfig } from '../types'

interface UseMcpUrlOptions {
  projectRef?: string
  baseUrl?: string
  readonly?: boolean
  features?: string[]
  selectedClient?: McpClient
}

interface UseMcpUrlReturn {
  mcpUrl: string
  clientConfig: McpClientConfig
}

export function useMcpUrl({
  projectRef,
  baseUrl = 'https://api.supabase.com/mcp',
  readonly = false,
  features = [],
  selectedClient,
}: UseMcpUrlOptions): UseMcpUrlReturn {
  // Generate the MCP URL based on current configuration
  const mcpUrl = useMemo(() => {
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

    return url.toString()
  }, [baseUrl, projectRef, readonly, features])

  const clientConfig = useMemo((): McpClientConfig => {
    const baseConfig: McpClientBaseConfig = {
      mcpServers: {
        supabase: {
          url: mcpUrl,
        },
      },
    }

    // Apply client-specific transformation if available
    if (selectedClient?.transformConfig) {
      return selectedClient.transformConfig(baseConfig)
    }

    return baseConfig
  }, [mcpUrl, selectedClient])

  return {
    mcpUrl,
    clientConfig,
  }
}
