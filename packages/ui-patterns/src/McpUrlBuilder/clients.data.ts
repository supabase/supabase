import type {
  AntigravityMcpConfig,
  ClaudeCodeMcpConfig,
  CodexMcpConfig,
  CopilotMcpConfig,
  FactoryMcpConfig,
  GeminiMcpConfig,
  GooseMcpConfig,
  KimiMcpConfig,
  McpClientBaseConfig,
  McpClientConfig,
  McpClientDeepLinkOptions,
  McpFeatureGroup,
  OpenCodeMcpConfig,
  VSCodeMcpConfig,
  WindsurfMcpConfig,
} from './types'
import { getMcpUrl } from './types'

export const FEATURE_GROUPS_PLATFORM: McpFeatureGroup[] = [
  {
    id: 'docs',
    name: 'Documentation',
    description: 'Access Supabase documentation and guides',
  },
  {
    id: 'account',
    name: 'Account',
    description: 'Manage account settings and preferences',
  },
  {
    id: 'database',
    name: 'Database',
    description: 'Query and manage database schema and data',
  },
  {
    id: 'debugging',
    name: 'Debugging',
    description: 'Debug and troubleshoot issues',
  },
  {
    id: 'development',
    name: 'Development',
    description: 'Development tools and utilities',
  },
  {
    id: 'functions',
    name: 'Functions',
    description: 'Manage and deploy Edge Functions',
  },
  {
    id: 'branching',
    name: 'Branching',
    description: 'Manage database branches',
  },
  {
    id: 'storage',
    name: 'Storage',
    description: 'Manage files and storage buckets',
  },
]

export const FEATURE_GROUPS_NON_PLATFORM = FEATURE_GROUPS_PLATFORM.filter((group) =>
  ['docs', 'database', 'development', 'debugging'].includes(group.id)
)

/** React-free subset of McpClient - safe for Node/build scripts. */
export interface McpClientData {
  key: string
  label: string
  icon?: string
  /** When true, use -icon-dark.svg in dark theme; otherwise the same -icon.svg is used for both themes. */
  hasDistinctDarkIcon?: boolean
  configFile?: string
  externalDocsUrl?: string
  transformConfig?: (config: McpClientBaseConfig) => McpClientConfig
  generateDeepLink?: (config: McpClientConfig, options?: McpClientDeepLinkOptions) => string | null
}

/** All MCP clients - React-free data only (no JSX fields). */
export const MCP_CLIENT_DATA: McpClientData[] = [
  {
    key: 'claude-code',
    label: 'Claude Code',
    icon: 'claude',
    configFile: '.mcp.json',
    externalDocsUrl: 'https://code.claude.com/docs/en/mcp',
    transformConfig: (config): ClaudeCodeMcpConfig => {
      return {
        mcpServers: {
          supabase: {
            type: 'http',
            url: config.mcpServers.supabase.url,
          },
        },
      }
    },
  },
  {
    key: 'cursor',
    label: 'Cursor',
    icon: 'cursor',
    hasDistinctDarkIcon: true,
    configFile: '.cursor/mcp.json',
    externalDocsUrl: 'https://docs.cursor.com/context/mcp',
    generateDeepLink: (config) => {
      const name = 'supabase'
      const mcpUrl = getMcpUrl(config)
      const serverConfig = {
        url: mcpUrl,
      }
      const base64Config = btoa(JSON.stringify(serverConfig))
      return `cursor://anysphere.cursor-deeplink/mcp/install?name=${name}&config=${encodeURIComponent(base64Config)}`
    },
  },
  {
    key: 'vscode',
    label: 'VS Code',
    icon: 'vscode',
    configFile: '.vscode/mcp.json',
    externalDocsUrl: 'https://code.visualstudio.com/docs/copilot/chat/mcp-servers',
    transformConfig: (config): VSCodeMcpConfig => {
      return {
        servers: {
          supabase: {
            type: 'http',
            url: config.mcpServers.supabase.url,
          },
        },
      }
    },
    generateDeepLink: (_config) => {
      const config = _config as VSCodeMcpConfig
      const mcpConfig = { name: 'supabase', ...config.servers.supabase }

      return `vscode:mcp/install?${encodeURIComponent(JSON.stringify(mcpConfig))}`
    },
  },
  {
    key: 'codex',
    label: 'Codex',
    icon: 'openai',
    hasDistinctDarkIcon: true,
    configFile: '~/.codex/config.toml',
    externalDocsUrl: 'https://developers.openai.com/codex/mcp/',
    transformConfig: (config): CodexMcpConfig => {
      return {
        mcp_servers: {
          supabase: {
            url: config.mcpServers.supabase.url,
          },
        },
      }
    },
  },
  {
    key: 'kimi',
    label: 'Kimi Code',
    icon: 'kimi',
    hasDistinctDarkIcon: true,
    configFile: '.kimi-code/mcp.json',
    externalDocsUrl: 'https://www.kimi.com/code/docs/en/kimi-code-cli/customization/mcp.html',
    transformConfig: (config): KimiMcpConfig => {
      return {
        mcpServers: {
          supabase: {
            transport: 'http',
            url: config.mcpServers.supabase.url,
          },
        },
      }
    },
  },
  {
    key: 'gemini-cli',
    label: 'Gemini CLI',
    icon: 'gemini-cli',
    configFile: '.gemini/settings.json',
    externalDocsUrl: 'https://geminicli.com/docs/tools/mcp-server/',
    transformConfig: (config): GeminiMcpConfig => {
      return {
        mcpServers: {
          supabase: {
            httpUrl: config.mcpServers.supabase.url,
          },
        },
      }
    },
  },
  {
    key: 'copilot-cli',
    label: 'GitHub Copilot',
    icon: 'copilot',
    hasDistinctDarkIcon: true,
    configFile: '~/.copilot/mcp-config.json',
    externalDocsUrl:
      'https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers',
    transformConfig: (config): CopilotMcpConfig => {
      return {
        mcpServers: {
          supabase: {
            type: 'http',
            url: config.mcpServers.supabase.url,
          },
        },
      }
    },
  },
  {
    key: 'antigravity',
    label: 'Antigravity',
    icon: 'antigravity',
    configFile: '~/.gemini/antigravity/mcp_config.json',
    externalDocsUrl: 'https://antigravity.google/docs/mcp',
    transformConfig: (config): AntigravityMcpConfig => {
      return {
        mcpServers: {
          supabase: {
            serverUrl: config.mcpServers.supabase.url,
          },
        },
      }
    },
  },
  {
    key: 'windsurf',
    label: 'Windsurf',
    icon: 'windsurf',
    hasDistinctDarkIcon: true,
    configFile: '~/.codeium/windsurf/mcp_config.json',
    externalDocsUrl: '',
    transformConfig: (config): WindsurfMcpConfig => {
      return {
        mcpServers: {
          supabase: {
            command: 'npx',
            args: ['-y', 'mcp-remote', config.mcpServers.supabase.url],
          },
        },
      }
    },
  },
  {
    key: 'goose',
    label: 'Goose',
    icon: 'goose',
    hasDistinctDarkIcon: true,
    configFile: '~/.config/goose/config.yaml',
    externalDocsUrl: 'https://block.github.io/goose/docs/category/getting-started',
    transformConfig: (config): GooseMcpConfig => {
      return {
        extensions: {
          supabase: {
            available_tools: [],
            bundled: null,
            description:
              'Connect your Supabase projects to AI assistants. Manage tables, query data, deploy Edge Functions, and interact with your Supabase backend directly from your MCP client.',
            enabled: true,
            env_keys: [],
            envs: {},
            headers: {},
            name: 'Supabase',
            timeout: 300,
            type: 'streamable_http',
            uri: config.mcpServers.supabase.url,
          },
        },
      }
    },
    generateDeepLink: (config) => {
      const name = 'supabase'
      const mcpUrl = getMcpUrl(config)
      return `goose://extension?type=streamable_http&url=${encodeURIComponent(mcpUrl)}&id=supabase&name=${name}&description=${encodeURIComponent('Connect your Supabase projects to AI assistants. Manage tables, query data, deploy Edge Functions, and interact with your Supabase backend directly from your MCP client.')}`
    },
  },
  {
    key: 'factory',
    label: 'Factory',
    icon: 'factory',
    hasDistinctDarkIcon: true,
    configFile: '~/.factory/mcp.json',
    externalDocsUrl: 'https://docs.factory.ai/cli/configuration/mcp.md',
    transformConfig: (config): FactoryMcpConfig => {
      return {
        mcpServers: {
          supabase: {
            type: 'http',
            url: config.mcpServers.supabase.url,
          },
        },
      }
    },
  },
  {
    key: 'opencode',
    label: 'OpenCode',
    icon: 'opencode',
    hasDistinctDarkIcon: true,
    configFile: '~/.config/opencode/opencode.json',
    externalDocsUrl: 'https://opencode.ai/docs/mcp-servers/',
    transformConfig: (config): OpenCodeMcpConfig => {
      const mcpUrl = getMcpUrl(config)
      return {
        $schema: 'https://opencode.ai/config.json',
        mcp: {
          supabase: {
            type: 'remote',
            url: mcpUrl,
            enabled: true,
          },
        },
      }
    },
  },
  {
    key: 'kiro',
    label: 'Kiro',
    icon: 'kiro',
    configFile: '~/.kiro/settings/mcp.json',
    externalDocsUrl: 'https://kiro.dev/docs/mcp/',
    generateDeepLink: (_config, options) => {
      const power = options?.isPlatform ? 'supabase-hosted' : 'supabase-local'
      return `https://kiro.dev/launch/powers/${power}`
    },
  },
  {
    key: 'claude-ai',
    label: 'Claude.ai',
    icon: 'claude',
    externalDocsUrl: 'https://claude.com/docs/connectors/overview',
    generateDeepLink: () =>
      'https://claude.ai/directory/connectors/11ca66fc-1e98-49d5-ab9b-7cb4672a8f10',
  },
  {
    key: 'chatgpt',
    label: 'ChatGPT',
    icon: 'openai',
    hasDistinctDarkIcon: true,
    externalDocsUrl: 'https://chatgpt.com/features/apps/',
    generateDeepLink: () =>
      'https://chatgpt.com/apps/supabase/asdk_app_69d3e5ee6a708191baa733f7b8931995',
  },
]

/** Terminal commands for clients that can be configured via CLI. */
export interface McpCliCommands {
  /** Builds the install command for a given MCP server URL. */
  install?: (url: string) => string
  /** Command to authenticate the configured server. */
  authenticate?: string
}

/**
 * CLI install/auth commands keyed by client key. Single source of truth shared
 * by the dashboard's Connect panel and the generated markdown docs, so the two
 * never drift. Clients absent here are configured via file only.
 */
export const MCP_CLI_COMMANDS: Record<string, McpCliCommands> = {
  'claude-code': {
    install: (url) => `claude mcp add --scope project --transport http supabase "${url}"`,
    authenticate: 'claude /mcp',
  },
  codex: {
    install: (url) => `codex mcp add supabase --url "${url}"`,
    authenticate: 'codex mcp login supabase',
  },
  'gemini-cli': {
    install: (url) => `gemini mcp add -t http supabase "${url}"`,
    authenticate: '/mcp auth supabase',
  },
  'copilot-cli': {
    install: (url) => `copilot mcp add --transport http supabase "${url}"`,
    authenticate: 'copilot -i /mcp',
  },
  goose: {
    install: (url) => `goose session --with-streamable-http-extension "${url}"`,
  },
  factory: {
    install: (url) => `droid mcp add supabase "${url}" --type http`,
  },
  opencode: {
    authenticate: 'opencode mcp auth supabase',
  },
}

export const MCP_CLIENT_GROUPS = [
  {
    heading: 'AI Agent CLI',
    keys: ['claude-code', 'codex', 'gemini-cli', 'copilot-cli', 'opencode', 'factory'],
  },
  {
    heading: 'Web Clients',
    keys: ['claude-ai', 'chatgpt', 'goose'],
  },
  {
    heading: 'IDE',
    keys: ['cursor', 'vscode', 'antigravity', 'kiro', 'windsurf', 'kimi'],
  },
] as const

export const DEFAULT_MCP_URL_PLATFORM = 'http://localhost:8080/mcp'
export const DEFAULT_MCP_URL_NON_PLATFORM = 'http://localhost:54321/mcp'

/**
 * Production hosted MCP server URL. The dashboard resolves the hosted URL
 * per-environment via `NEXT_PUBLIC_MCP_URL`; this is the canonical value the
 * docs document (and what to fall back to in production).
 */
export const HOSTED_MCP_URL = 'https://mcp.supabase.com/mcp'
