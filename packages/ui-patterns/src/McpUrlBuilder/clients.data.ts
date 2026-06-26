import type {
  AntigravityMcpConfig,
  ClaudeCodeMcpConfig,
  CodexMcpConfig,
  CopilotMcpConfig,
  FactoryMcpConfig,
  GeminiMcpConfig,
  GooseMcpConfig,
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
    install: (url) => `gemini mcp add -t http supabase ${url}`,
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
    install: (url) => `droid mcp add supabase ${url} --type http`,
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
    keys: ['cursor', 'vscode', 'antigravity', 'kiro', 'windsurf'],
  },
] as const

/**
 * Portable content model for per-client setup instructions.
 *
 * Instruction prose used to live twice - as React JSX in `constants.tsx` (for
 * the dashboard's Connect panel) and re-authored as mdast in the markdown docs.
 * Expressing it as data instead lets both surfaces render from one source, so
 * they can't drift. The React and markdown renderers are thin adapters over
 * these blocks; adding or editing a client means editing data only.
 */
export type McpInline =
  | string
  | { code: string }
  | { strong: string }
  | { link: string; href: string }

export interface McpTextBlock {
  type: 'text'
  content: McpInline[]
}
/** A copyable shell command. `value` may depend on the resolved MCP server URL. */
export interface McpCommandBlock {
  type: 'command'
  value: string | ((url: string) => string)
}
export interface McpCalloutBlock {
  type: 'callout'
  variant: 'warning' | 'note'
  content: McpInline[]
}
/** A purely illustrative screenshot. Rendered by the dashboard; omitted from
 * markdown (the surrounding text already conveys the steps). `asset` keys into
 * the renderer's image map so this stays free of bundler-specific imports. */
export interface McpImageBlock {
  type: 'image'
  asset: string
  alt: string
}
export type McpBlock = McpTextBlock | McpCommandBlock | McpCalloutBlock | McpImageBlock

export interface McpClientInstructions {
  /** Steps shown before the config-file block (e.g. CLI install). */
  primary?: (options: { isPlatform: boolean }) => McpBlock[]
  /** Steps shown after the config-file block (e.g. authentication). */
  alternate?: (options: { isPlatform: boolean }) => McpBlock[]
  /** Inline description shown above a deep-link/connector install. */
  deepLinkDescription?: McpInline[]
}

const text = (...content: McpInline[]): McpTextBlock => ({ type: 'text', content })
const command = (value: McpCommandBlock['value']): McpCommandBlock => ({ type: 'command', value })
const warning = (...content: McpInline[]): McpCalloutBlock => ({
  type: 'callout',
  variant: 'warning',
  content,
})

const GEMINI_EXTENSION_URL = 'https://github.com/supabase-community/gemini-extension'

/**
 * Per-client setup instructions as portable content. Shared by the dashboard's
 * Connect panel and the generated markdown docs. Clients absent here are
 * configured via their config file (and/or deep link) only.
 */
export const MCP_CLIENT_INSTRUCTIONS: Record<string, McpClientInstructions> = {
  'claude-code': {
    primary: () => [
      text('Add the MCP server to your project config using the command line:'),
      command(MCP_CLI_COMMANDS['claude-code'].install!),
    ],
    alternate: () => [
      text(
        'After configuring the MCP server, you need to authenticate. In a regular terminal (not the IDE extension) run:'
      ),
      command(MCP_CLI_COMMANDS['claude-code'].authenticate!),
      text('Select the "supabase" server, then "Authenticate" to begin the authentication flow.'),
    ],
  },
  codex: {
    primary: () => [
      text('Add the Supabase MCP server to Codex:'),
      command(MCP_CLI_COMMANDS['codex'].install!),
    ],
    alternate: () => [
      text('Authenticate with the MCP server:'),
      command(MCP_CLI_COMMANDS['codex'].authenticate!),
      text('Finally, run ', { code: '/mcp' }, ' inside Codex to verify authentication.'),
    ],
  },
  'gemini-cli': {
    primary: ({ isPlatform }) => [
      warning('Ensure you are running Gemini CLI version ', { code: '0.20.2' }, ' or higher.'),
      ...(isPlatform
        ? [
            text(
              'Install the Supabase ',
              { link: 'extension', href: GEMINI_EXTENSION_URL },
              ' for Gemini CLI. This bundles the Supabase MCP server connection, ',
              { link: 'agent skills', href: 'https://github.com/supabase/agent-skills' },
              ', and other context.'
            ),
            command(`gemini extensions install ${GEMINI_EXTENSION_URL}`),
            text('Or add just the MCP server to Gemini CLI:'),
          ]
        : [text('Add the Supabase MCP server to Gemini CLI:')]),
      command(MCP_CLI_COMMANDS['gemini-cli'].install!),
    ],
    alternate: () => [
      text(
        'After installation, start the Gemini CLI and run the following command to authenticate the server:'
      ),
      command(MCP_CLI_COMMANDS['gemini-cli'].authenticate!),
    ],
  },
  'copilot-cli': {
    primary: () => [
      text('Add the MCP server to your GitHub Copilot config using the command line:'),
      command(MCP_CLI_COMMANDS['copilot-cli'].install!),
    ],
    alternate: () => [
      text('After configuring the MCP server, authenticate by running:'),
      command(MCP_CLI_COMMANDS['copilot-cli'].authenticate!),
      text('Follow the on-screen instructions to complete the authentication flow.'),
    ],
  },
  antigravity: {
    alternate: () => [
      text(
        'After saving the config, restart Antigravity. It will prompt you to complete the OAuth flow to authenticate with Supabase.'
      ),
      text(
        'To edit the config from within Antigravity, click the ',
        { strong: '···' },
        ' menu at the top of the Agent pane > ',
        { strong: 'MCP Servers' },
        ' > ',
        { strong: 'Manage MCP Servers' },
        ' > ',
        { strong: 'View raw config' },
        '. From the Manage MCP Servers page you can also ',
        { strong: 'Refresh' },
        ' server configs and enable/disable servers.'
      ),
      text(
        'If you run into authentication issues, open Agent Settings with ',
        { strong: 'Cmd+,' },
        ' (Mac) or ',
        { strong: 'Ctrl+,' },
        ' (Windows/Linux), navigate to the ',
        { strong: 'Customizations' },
        ' tab, and click the ',
        { strong: 'Authenticate' },
        ' button next to the Supabase server.'
      ),
      {
        type: 'image',
        asset: 'antigravity-auth',
        alt: 'Antigravity MCP server settings showing the Authenticate button next to the Supabase server',
      },
    ],
  },
  windsurf: {
    primary: () => [
      warning('Ensure you are running Windsurf version ', { code: '0.1.37' }, ' or higher.'),
    ],
    alternate: () => [
      text(
        'Windsurf does not currently support remote MCP servers over HTTP transport. You need to use the mcp-remote package as a proxy.'
      ),
    ],
  },
  goose: {
    primary: () => [
      text('Start a Goose session with the Supabase extension:'),
      command(MCP_CLI_COMMANDS['goose'].install!),
    ],
    alternate: () => [
      text(
        'For more details, see ',
        {
          link: 'Using Extensions',
          href: 'https://block.github.io/goose/docs/getting-started/using-extensions',
        },
        ' in Goose.'
      ),
    ],
  },
  factory: {
    primary: () => [
      text('Add Supabase MCP server to Factory:'),
      command(MCP_CLI_COMMANDS['factory'].install!),
    ],
    alternate: () => [
      text(
        'Restart Factory or type ',
        { code: '/mcp' },
        ' within droid to complete OAuth authentication flow.'
      ),
    ],
  },
  opencode: {
    alternate: () => [
      text('After adding the configuration, run the following command to authenticate:'),
      command(MCP_CLI_COMMANDS['opencode'].authenticate!),
      text('This will open your browser to complete the OAuth authentication flow.'),
    ],
  },
  kiro: {
    deepLinkDescription: [
      'Install the Supabase ',
      { link: 'power', href: 'https://kiro.dev/docs/powers/' },
      ' for Kiro. This bundles the Supabase MCP server and steering files for best practices.',
    ],
  },
}

export const DEFAULT_MCP_URL_PLATFORM = 'http://localhost:8080/mcp'
export const DEFAULT_MCP_URL_NON_PLATFORM = 'http://localhost:54321/mcp'

/**
 * Production hosted MCP server URL. The dashboard resolves the hosted URL
 * per-environment via `NEXT_PUBLIC_MCP_URL`; this is the canonical value the
 * docs document (and what to fall back to in production).
 */
export const HOSTED_MCP_URL = 'https://mcp.supabase.com/mcp'
