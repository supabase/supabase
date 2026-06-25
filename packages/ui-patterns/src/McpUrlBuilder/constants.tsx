import Image from 'next/image'
import { CodeBlock } from 'ui-patterns/CodeBlock'

import antigravityAuthenticateScreenshot from './assets/antigravity-authenticate-screenshot.png'
import { MCP_CLI_COMMANDS, MCP_CLIENT_DATA } from './clients.data'
import type { ClaudeCodeMcpConfig, CopilotMcpConfig, McpClient } from './types'
import { getMcpUrl } from './types'

export {
  DEFAULT_MCP_URL_NON_PLATFORM,
  DEFAULT_MCP_URL_PLATFORM,
  FEATURE_GROUPS_NON_PLATFORM,
  FEATURE_GROUPS_PLATFORM,
  MCP_CLIENT_GROUPS,
} from './clients.data'

/** JSX-only fields keyed by client key. Only clients that HAD these fields. */
const CLIENT_UI: Record<
  string,
  Pick<McpClient, 'primaryInstructions' | 'alternateInstructions' | 'deepLinkDescription'>
> = {
  'claude-code': {
    primaryInstructions: (_config, onCopy) => {
      const config = _config as ClaudeCodeMcpConfig
      const command = MCP_CLI_COMMANDS['claude-code'].install!(config.mcpServers.supabase.url)
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
          value={MCP_CLI_COMMANDS['claude-code'].authenticate}
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
  codex: {
    primaryInstructions: (config, onCopy) => {
      const mcpUrl = getMcpUrl(config)
      const command = MCP_CLI_COMMANDS['codex'].install!(mcpUrl)
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
    alternateInstructions: (_config, onCopy) => (
      <div className="space-y-2">
        <p className="text-xs text-foreground-light">Authenticate with the MCP server:</p>
        <CodeBlock
          value={MCP_CLI_COMMANDS['codex'].authenticate}
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
  'gemini-cli': {
    primaryInstructions: (config, onCopy, options) => {
      const mcpUrl = getMcpUrl(config)
      const mcpCommand = MCP_CLI_COMMANDS['gemini-cli'].install!(mcpUrl)
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
    alternateInstructions: (_config, onCopy) => {
      return (
        <div className="space-y-2">
          <p className="text-xs text-foreground-light">
            After installation, start the Gemini CLI and run the following command to authenticate
            the server:
          </p>
          <CodeBlock
            value={MCP_CLI_COMMANDS['gemini-cli'].authenticate}
            language="bash"
            focusable={false}
            className="block"
            onCopyCallback={() => onCopy('command')}
          />
        </div>
      )
    },
  },
  'copilot-cli': {
    primaryInstructions: (_config, onCopy) => {
      const config = _config as CopilotMcpConfig
      const command = MCP_CLI_COMMANDS['copilot-cli'].install!(config.mcpServers.supabase.url)
      return (
        <div className="space-y-2">
          <p className="text-xs text-foreground-light">
            Add the MCP server to your GitHub Copilot config using the command line:
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
    alternateInstructions: (_config, onCopy) => (
      <div className="space-y-2">
        <p className="text-xs text-foreground-light">
          After configuring the MCP server, authenticate by running:
        </p>
        <CodeBlock
          value={MCP_CLI_COMMANDS['copilot-cli'].authenticate}
          language="bash"
          focusable={false}
          className="block"
          onCopyCallback={() => onCopy('command')}
        />
        <p className="text-xs text-foreground-light">
          Follow the on-screen instructions to complete the authentication flow.
        </p>
      </div>
    ),
  },
  antigravity: {
    alternateInstructions: (_config, _onCopy) => (
      <div className="space-y-2">
        <p className="text-xs text-foreground-light">
          After saving the config, restart Antigravity. It will prompt you to complete the OAuth
          flow to authenticate with Supabase.
        </p>
        <p className="text-xs text-foreground-light">
          To edit the config from within Antigravity, click the <strong>···</strong> menu at the top
          of the Agent pane &gt; <strong>MCP Servers</strong> &gt;{' '}
          <strong>Manage MCP Servers</strong> &gt; <strong>View raw config</strong>. From the Manage
          MCP Servers page you can also <strong>Refresh</strong> server configs and enable/disable
          servers.
        </p>
        <p className="text-xs text-foreground-light">
          If you run into authentication issues, open Agent Settings with <strong>Cmd+,</strong>{' '}
          (Mac) or <strong>Ctrl+,</strong> (Windows/Linux), navigate to the{' '}
          <strong>Customizations</strong> tab, and click the <strong>Authenticate</strong> button
          next to the Supabase server.
        </p>
        <Image
          src={antigravityAuthenticateScreenshot}
          alt="Antigravity MCP server settings showing the Authenticate button next to the Supabase server"
          width={1316}
          height={258}
          className="rounded border border-muted w-full"
        />
      </div>
    ),
  },
  windsurf: {
    primaryInstructions: (_config, _onCopy) => (
      <p className="text-xs text-warning">
        Ensure you are running Windsurf version <code>0.1.37</code> or higher.
      </p>
    ),
    alternateInstructions: (_config, _onCopy) => (
      <p className="text-xs text-foreground-light">
        Windsurf does not currently support remote MCP servers over HTTP transport. You need to use
        the mcp-remote package as a proxy.
      </p>
    ),
  },
  goose: {
    primaryInstructions: (config, onCopy) => {
      const mcpUrl = getMcpUrl(config)
      const command = MCP_CLI_COMMANDS['goose'].install!(mcpUrl)
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
    alternateInstructions: (_config, _onCopy) => (
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
  factory: {
    primaryInstructions: (config, onCopy) => {
      const mcpUrl = getMcpUrl(config)
      const command = MCP_CLI_COMMANDS['factory'].install!(mcpUrl)
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
    alternateInstructions: (_config, _onCopy) => (
      <div className="space-y-2">
        <p className="text-xs text-foreground-light">
          Restart Factory or type <code>/mcp</code> within droid to complete OAuth authentication
          flow.
        </p>
      </div>
    ),
  },
  opencode: {
    alternateInstructions: (_config, onCopy) => (
      <div className="space-y-2">
        <p className="text-xs text-foreground-light">
          After adding the configuration, run the following command to authenticate:
        </p>
        <CodeBlock
          value={MCP_CLI_COMMANDS['opencode'].authenticate}
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
  kiro: {
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
}

/** Only set hasDistinctDarkIcon: true when the client has a separate -icon-dark.svg that looks different. Otherwise the same -icon.svg is used for both themes. */
export const MCP_CLIENTS: McpClient[] = MCP_CLIENT_DATA.map((data) => ({
  ...data,
  ...CLIENT_UI[data.key],
}))
