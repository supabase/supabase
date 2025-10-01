import { CodeBlock } from 'ui/src/components/CodeBlock'
import type {
  ClaudeCodeMcpConfig,
  McpClient,
  McpFeatureGroup,
  OtherMcpConfig,
  VSCodeMcpConfig,
  WindsurfMcpConfig,
} from './types'

export const FEATURE_GROUPS: McpFeatureGroup[] = [
  {
    id: 'docs',
    name: 'Documentation',
    description: 'Access project documentation and guides',
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
  {
    key: 'other',
    label: 'Other',
    transformConfig: (config): OtherMcpConfig => {
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
      return (
        <p className="text-xs text-foreground-light">
          These generic MCP settings may work with other MCP clients, but there are no guarantees,
          due to differences between clients. Refer to your specific client docs for where to input
          the configuration.
        </p>
      )
    },
  },
]

export const MCP_URL = process.env.NEXT_PUBLIC_MCP_URL ?? 'http://localhost:8080/mcp'
