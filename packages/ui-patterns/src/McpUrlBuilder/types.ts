export interface McpFeatureGroup {
  id: string
  name: string
  description: string
}

export interface McpClient {
  key: string
  label: string
  icon?: string
  docsUrl?: string
  externalDocsUrl?: string
  configFile?: string
  generateDeepLink?: (config: McpClientConfig) => string | null
  transformConfig?: (config: McpClientBaseConfig) => McpClientConfig
  alternateInstructions?: (config: McpClientConfig) => React.ReactNode
}

export interface McpUrlBuilderConfig {
  projectRef: string
  readonly?: boolean
  features?: string[]
}

export interface McpClientBaseConfig {
  mcpServers: {
    supabase: {
      url: string
    }
  }
}

export interface CursorMcpConfig extends McpClientBaseConfig {}

export interface VSCodeMcpConfig extends McpClientBaseConfig {
  mcpServers: {
    supabase: {
      type: 'http'
      url: string
    }
  }
}

export interface WindsurfMcpConfig {
  mcpServers: {
    supabase: {
      command: 'npx'
      args: ['-y', 'mcp-remote', string]
    }
  }
}

export interface ClaudeCodeMcpConfig extends McpClientBaseConfig {
  mcpServers: {
    supabase: {
      type: 'http'
      url: string
    }
  }
}

export interface ClaudeDesktopMcpConfig extends McpClientBaseConfig {
  mcpServers: {
    supabase: {
      type: 'http'
      url: string
    }
  }
}

export interface OtherMcpConfig extends McpClientBaseConfig {
  mcpServers: {
    supabase: {
      type: 'http'
      url: string
    }
  }
}

// Union of all possible config types
export type McpClientConfig =
  | ClaudeCodeMcpConfig
  | ClaudeDesktopMcpConfig
  | CursorMcpConfig
  | McpClientBaseConfig
  | OtherMcpConfig
  | VSCodeMcpConfig
  | WindsurfMcpConfig
