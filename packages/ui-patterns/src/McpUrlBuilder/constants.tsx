import { CodeBlock } from 'ui/src/components/CodeBlock'
import type {
  ClaudeCodeMcpConfig,
  McpClient,
  McpFeatureGroup,
  VSCodeMcpConfig,
  WindsurfMcpConfig,
} from './types'

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
  ['docs', 'database', 'development'].includes(group.id)
)

export const MCP_CLIENTS: McpClient[] = [
  {
    key: 'cursor',
    label: 'Cursor',
    icon: 'cursor',
    configFile: '.cursor/mcp.json',
    externalDocsUrl: 'https://docs.cursor.com/context/mcp',
    generateDeepLink: (config) => {
      const name = 'supabase'
      const base64Config = Buffer.from(JSON.stringify(config.mcpServers.supabase)).toString(
        'base64'
      )
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
        mcpServers: {
          supabase: {
            type: 'http',
            url: config.mcpServers.supabase.url,
          },
        },
      }
    },
    generateDeepLink: (_config) => {
      const config = _config as VSCodeMcpConfig
      const mcpConfig = { name: 'supabase', ...config.mcpServers.supabase }

      return `vscode:mcp/install?${encodeURIComponent(JSON.stringify(mcpConfig))}`
    },
  },
  {
    key: 'windsurf',
    label: 'Windsurf',
    icon: 'windsurf',
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
    alternateInstructions: () => (
      <p className="text-xs text-foreground-light">
        Windsurf does not currently support remote MCP servers over HTTP transport. You need to use
        the mcp-remote package as a proxy.
      </p>
    ),
  },
  {
    key: 'claude-code',
    label: 'Claude Code',
    icon: 'claude',
    configFile: '~/.claude.json',
    externalDocsUrl: 'https://docs.anthropic.com/en/docs/claude-code/mcp',
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
    alternateInstructions: (_config) => {
      const config = _config as ClaudeCodeMcpConfig
      const command = `claude mcp add --transport http supabase "${config.mcpServers.supabase.url}"`
      return (
        <div className="space-y-2">
          <p className="text-xs text-foreground-light">
            Alternatively, add the MCP server using the command line:
          </p>
          <CodeBlock
            value={command}
            language="bash"
            // This is a no-op but the CodeBlock component is designed to output
            // inline code if no className is given
            className="block"
          />
        </div>
      )
    },
  },
]

export const DEFAULT_MCP_URL_PLATFORM = 'http://localhost:8080/mcp'
export const DEFAULT_MCP_URL_NON_PLATFORM = 'http://localhost:54321/mcp'
