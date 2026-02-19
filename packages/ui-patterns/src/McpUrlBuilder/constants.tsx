import { CodeBlock } from 'ui/src/components/CodeBlock'

import type {
  ClaudeCodeMcpConfig,
  CodexMcpConfig,
  FactoryMcpConfig,
  GeminiMcpConfig,
  GooseMcpConfig,
  McpClient,
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

export const MCP_CLIENTS: McpClient[] = [
  {
    key: 'cursor',
    label: 'Cursor',
    icon: 'cursor',
    configFile: '.cursor/mcp.json',
    externalDocsUrl: 'https://docs.cursor.com/context/mcp',
    generateDeepLink: (config) => {
      const name = 'supabase'
      const mcpUrl = getMcpUrl(config)
      const serverConfig = {
        url: mcpUrl,
      }
      const base64Config = Buffer.from(JSON.stringify(serverConfig)).toString('base64')
      return `cursor://anysphere.cursor-deeplink/mcp/install?name=${name}&config=${encodeURIComponent(base64Config)}`
    },
  },
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
    primaryInstructions: (_config, onCopy) => {
      const config = _config as ClaudeCodeMcpConfig
      const command = `claude mcp add --scope project --transport http supabase "${config.mcpServers.supabase.url}"`
      return (
        <div className="space-y-2">
          <p className="text-xs text-foreground-light">
            Add the MCP server to your project config using the command line:
          </p>
          <CodeBlock
            value={command}
            language="bash"
            focusable={false}
            // This is a no-op but the CodeBlock component is designed to output
            // inline code if no className is given
            className="block"
            onCopyCallback={() => onCopy('command')}
          />
        </div>
      )
    },
    alternateInstructions: (_config, onCopy) => (
      <div className="space-y-2">
        <p className="text-xs text-foreground-light">
          After configuring the MCP server, you need to authenticate. In a regular terminal (not the
          IDE extension) run:
        </p>
        <CodeBlock
          value="claude /mcp"
          language="bash"
          focusable={false}
          className="block"
          onCopyCallback={() => onCopy('command')}
        />
        <p className="text-xs text-foreground-light">
          Select the "supabase" server, then "Authenticate" to begin the authentication flow.
        </p>
      </div>
    ),
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
    primaryInstructions: (config, onCopy) => {
      const mcpUrl = getMcpUrl(config)
      const command = `codex mcp add supabase --url ${mcpUrl}`
      return (
        <div className="space-y-2">
          <p className="text-xs text-foreground-light">Add the Supabase MCP server to Codex:</p>
          <CodeBlock
            value={command}
            language="bash"
            focusable={false}
            className="block"
            onCopyCallback={() => onCopy('command')}
          />
        </div>
      )
    },
    alternateInstructions: (config, onCopy) => (
      <div className="space-y-2">
        <p className="text-xs text-foreground-light">
          After adding the server, enable remote MCP client support by adding this to your{' '}
          <code>~/.codex/config.toml</code>:
        </p>
        <CodeBlock
          value={`[features]\nrmcp_client = true`}
          focusable={false}
          className="block"
          onCopyCallback={() => onCopy('config')}
        />
        <p className="text-xs text-foreground-light">Then authenticate:</p>
        <CodeBlock
          value="codex mcp login supabase"
          language="bash"
          focusable={false}
          className="block"
          onCopyCallback={() => onCopy('command')}
        />
        <p className="text-xs text-foreground-light">
          Finally, run <code>/mcp</code> inside Codex to verify authentication.
        </p>
      </div>
    ),
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
    primaryInstructions: (config, onCopy, options) => {
      const mcpUrl = getMcpUrl(config)
      const mcpCommand = `gemini mcp add -t http supabase ${mcpUrl}`
      return (
        <div className="space-y-2">
          <p className="text-xs text-warning">
            Ensure you are running Gemini CLI version <code>0.20.2</code> or higher.
          </p>
          {options?.isPlatform && (
            <>
              <p className="text-xs text-foreground-light">
                Install the Supabase{' '}
                <a
                  href="https://github.com/supabase-community/gemini-extension"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-link hover:underline"
                >
                  extension
                </a>{' '}
                for Gemini CLI. This bundles the Supabase MCP server connection,{' '}
                <a
                  href="https://github.com/supabase/agent-skills"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-link hover:underline"
                >
                  agent skills
                </a>
                , and other context.
              </p>
              <CodeBlock
                value="gemini extensions install https://github.com/supabase-community/gemini-extension"
                language="bash"
                focusable={false}
                className="block"
                onCopyCallback={() => onCopy('command')}
              />
              <p className="text-xs text-foreground-light">
                Or add just the MCP server to Gemini CLI:
              </p>
            </>
          )}
          {!options?.isPlatform && (
            <p className="text-xs text-foreground-light">
              Add the Supabase MCP server to Gemini CLI:
            </p>
          )}
          <CodeBlock
            value={mcpCommand}
            language="bash"
            focusable={false}
            className="block"
            onCopyCallback={() => onCopy('command')}
          />
        </div>
      )
    },
    alternateInstructions: (config, onCopy) => {
      return (
        <div className="space-y-2">
          <p className="text-xs text-foreground-light">
            After installation, start the Gemini CLI and run the following command to authenticate
            the server:
          </p>
          <CodeBlock
            value="/mcp auth supabase"
            language="bash"
            focusable={false}
            className="block"
            onCopyCallback={() => onCopy('command')}
          />
        </div>
      )
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
    primaryInstructions: (config, onCopy) => (
      <p className="text-xs text-warning">
        Ensure you are running Windsurf version <code>0.1.37</code> or higher.
      </p>
    ),
    alternateInstructions: (config, onCopy) => (
      <p className="text-xs text-foreground-light">
        Windsurf does not currently support remote MCP servers over HTTP transport. You need to use
        the mcp-remote package as a proxy.
      </p>
    ),
  },
  {
    key: 'goose',
    label: 'Goose',
    icon: 'goose',
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
    primaryInstructions: (config, onCopy) => {
      const mcpUrl = getMcpUrl(config)
      const command = `goose session --with-streamable-http-extension "${mcpUrl}"`
      return (
        <div className="space-y-2">
          <p className="text-xs text-foreground-light">
            Start a Goose session with the Supabase extension:
          </p>
          <CodeBlock
            value={command}
            language="bash"
            focusable={false}
            className="block"
            onCopyCallback={() => onCopy('command')}
          />
        </div>
      )
    },
    alternateInstructions: (config, onCopy) => (
      <div className="space-y-2">
        <p className="text-xs text-foreground-light">
          For more details, see{' '}
          <a
            href="https://block.github.io/goose/docs/getting-started/using-extensions"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand underline"
          >
            Using Extensions
          </a>{' '}
          in Goose.
        </p>
      </div>
    ),
  },
  {
    key: 'factory',
    label: 'Factory',
    icon: 'factory',
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
    primaryInstructions: (config, onCopy) => {
      const mcpUrl = getMcpUrl(config)
      const command = `droid mcp add supabase ${mcpUrl} --type http`
      return (
        <div className="space-y-2">
          <p className="text-xs text-foreground-light">Add Supabase MCP server to Factory:</p>
          <CodeBlock
            value={command}
            language="bash"
            focusable={false}
            className="block"
            onCopyCallback={() => onCopy('command')}
          />
        </div>
      )
    },
    alternateInstructions: (config, onCopy) => (
      <div className="space-y-2">
        <p className="text-xs text-foreground-light">
          Restart Factory or type <code>/mcp</code> within droid to complete OAuth authentication
          flow.
        </p>
      </div>
    ),
  },
  {
    key: 'opencode',
    label: 'OpenCode',
    icon: 'opencode',
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
    alternateInstructions: (config, onCopy) => (
      <div className="space-y-2">
        <p className="text-xs text-foreground-light">
          After adding the configuration, run the following command to authenticate:
        </p>
        <CodeBlock
          value="opencode mcp auth supabase"
          language="bash"
          focusable={false}
          className="block"
          onCopyCallback={() => onCopy('command')}
        />
        <p className="text-xs text-foreground-light">
          This will open your browser to complete the OAuth authentication flow.
        </p>
      </div>
    ),
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
    deepLinkDescription: (
      <>
        Install the Supabase{' '}
        <a
          href="https://kiro.dev/docs/powers/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-link hover:underline"
        >
          power
        </a>{' '}
        for Kiro. This bundles the Supabase MCP server and steering files for best practices.
      </>
    ),
  },
]

export const DEFAULT_MCP_URL_PLATFORM = 'http://localhost:8080/mcp'
export const DEFAULT_MCP_URL_NON_PLATFORM = 'http://localhost:54321/mcp'
