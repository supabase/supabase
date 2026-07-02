/** @jsxRuntime automatic */
/** @jsxImportSource mdast-jsx */
import type { Content, Root } from 'mdast'

import { MCP_CLI_COMMANDS } from './clients.data'

/**
 * Per-client setup instructions, authored once as mdast (via the mdast-jsx
 * runtime) so a single source feeds both surfaces:
 *
 * - the dashboard's Connect panel, via the React adapter in
 *   `components/InstructionBlocks.tsx` (mdast -> React), and
 * - the generated markdown docs, via `McpConfigPanel.md.tsx` (mdast -> markdown).
 *
 * Both render the same tree, so the prose can't drift. Editing a client is a
 * content-only change here. This module stays React-free (it emits plain mdast
 * objects), so the Node markdown build can import it.
 */

/** A single mdast node, or a Fragment-produced `root` wrapping several. */
export type McpInstructionContent = Root | Content

export interface InstructionOptions {
  /** Hosted platform (docs) vs self-hosted/local. Switches a few steps. */
  isPlatform: boolean
  /** Resolved MCP server URL, interpolated into command snippets. */
  url: string
}

export interface McpClientInstructions {
  /** Steps shown before the config-file block (e.g. CLI install). */
  primary?: (options: InstructionOptions) => McpInstructionContent
  /** Steps shown after the config-file block (e.g. authentication). */
  alternate?: (options: InstructionOptions) => McpInstructionContent
  /** Inline description shown above a deep-link/connector install. */
  deepLinkDescription?: McpInstructionContent
}

export type McpCalloutVariant = 'warning' | 'note'

/**
 * Reads the callout variant off a blockquote's `data`. Callouts are authored as
 * `<blockquote data={{ callout: 'warning' }}>`; the variant lives in `data`
 * (in-memory only - it does not survive markdown serialization), so each adapter
 * materializes it: the dashboard styles the blockquote, the markdown adapter
 * prefixes a label.
 */
export const calloutVariant = (data: unknown): McpCalloutVariant | undefined =>
  (data as { callout?: McpCalloutVariant } | undefined)?.callout

const GEMINI_EXTENSION_URL = 'https://github.com/supabase-community/gemini-extension'

export const MCP_CLIENT_INSTRUCTIONS: Record<string, McpClientInstructions> = {
  'claude-code': {
    primary: ({ url }) => (
      <>
        <paragraph>Add the MCP server to your project config using the command line:</paragraph>
        <code lang="bash" value={MCP_CLI_COMMANDS['claude-code'].install!(url)} />
      </>
    ),
    alternate: () => (
      <>
        <paragraph>
          After configuring the MCP server, you need to authenticate. In a regular terminal (not the
          IDE extension) run:
        </paragraph>
        <code lang="bash" value={MCP_CLI_COMMANDS['claude-code'].authenticate!} />
        <paragraph>
          Select the "supabase" server, then "Authenticate" to begin the authentication flow.
        </paragraph>
      </>
    ),
  },
  codex: {
    primary: ({ url }) => (
      <>
        <paragraph>Add the Supabase MCP server to Codex:</paragraph>
        <code lang="bash" value={MCP_CLI_COMMANDS['codex'].install!(url)} />
      </>
    ),
    alternate: () => (
      <>
        <paragraph>Authenticate with the MCP server:</paragraph>
        <code lang="bash" value={MCP_CLI_COMMANDS['codex'].authenticate!} />
        <paragraph>
          Finally, run <inlineCode value="/mcp" /> inside Codex to verify authentication.
        </paragraph>
      </>
    ),
  },
  'gemini-cli': {
    primary: ({ isPlatform, url }) => (
      <>
        <blockquote data={{ callout: 'warning' }}>
          <paragraph>
            Ensure you are running Gemini CLI version <inlineCode value="0.20.2" /> or higher.
          </paragraph>
        </blockquote>
        {isPlatform ? (
          <>
            <paragraph>
              Install the Supabase <link url={GEMINI_EXTENSION_URL}>extension</link> for Gemini CLI.
              This bundles the Supabase MCP server connection,{' '}
              <link url="https://github.com/supabase/agent-skills">agent skills</link>, and other
              context.
            </paragraph>
            <code lang="bash" value={`gemini extensions install ${GEMINI_EXTENSION_URL}`} />
            <paragraph>Or add just the MCP server to Gemini CLI:</paragraph>
          </>
        ) : (
          <paragraph>Add the Supabase MCP server to Gemini CLI:</paragraph>
        )}
        <code lang="bash" value={MCP_CLI_COMMANDS['gemini-cli'].install!(url)} />
      </>
    ),
    alternate: () => (
      <>
        <paragraph>
          After installation, start the Gemini CLI and run the following command to authenticate the
          server:
        </paragraph>
        <code lang="bash" value={MCP_CLI_COMMANDS['gemini-cli'].authenticate!} />
      </>
    ),
  },
  'copilot-cli': {
    primary: ({ url }) => (
      <>
        <paragraph>
          Add the MCP server to your GitHub Copilot config using the command line:
        </paragraph>
        <code lang="bash" value={MCP_CLI_COMMANDS['copilot-cli'].install!(url)} />
      </>
    ),
    alternate: () => (
      <>
        <paragraph>After configuring the MCP server, authenticate by running:</paragraph>
        <code lang="bash" value={MCP_CLI_COMMANDS['copilot-cli'].authenticate!} />
        <paragraph>
          Follow the on-screen instructions to complete the authentication flow.
        </paragraph>
      </>
    ),
  },
  antigravity: {
    alternate: () => (
      <>
        <paragraph>
          After saving the config, restart Antigravity. It will prompt you to complete the OAuth
          flow to authenticate with Supabase.
        </paragraph>
        <paragraph>
          To edit the config from within Antigravity, click the <strong>···</strong> menu at the top
          of the Agent pane &gt; <strong>MCP Servers</strong> &gt;{' '}
          <strong>Manage MCP Servers</strong> &gt; <strong>View raw config</strong>. From the Manage
          MCP Servers page you can also <strong>Refresh</strong> server configs and enable/disable
          servers.
        </paragraph>
        <paragraph>
          If you run into authentication issues, open Agent Settings with <strong>Cmd+,</strong>{' '}
          (Mac) or <strong>Ctrl+,</strong> (Windows/Linux), navigate to the{' '}
          <strong>Customizations</strong> tab, and click the <strong>Authenticate</strong> button
          next to the Supabase server.
        </paragraph>
        <image
          url="antigravity-auth"
          alt="Antigravity MCP server settings showing the Authenticate button next to the Supabase server"
        />
      </>
    ),
  },
  windsurf: {
    primary: () => (
      <blockquote data={{ callout: 'warning' }}>
        <paragraph>
          Ensure you are running Windsurf version <inlineCode value="0.1.37" /> or higher.
        </paragraph>
      </blockquote>
    ),
    alternate: () => (
      <paragraph>
        Windsurf does not currently support remote MCP servers over HTTP transport. You need to use
        the mcp-remote package as a proxy.
      </paragraph>
    ),
  },
  goose: {
    primary: ({ url }) => (
      <>
        <paragraph>Start a Goose session with the Supabase extension:</paragraph>
        <code lang="bash" value={MCP_CLI_COMMANDS['goose'].install!(url)} />
      </>
    ),
    alternate: () => (
      <paragraph>
        For more details, see{' '}
        <link url="https://block.github.io/goose/docs/getting-started/using-extensions">
          Using Extensions
        </link>{' '}
        in Goose.
      </paragraph>
    ),
  },
  factory: {
    primary: ({ url }) => (
      <>
        <paragraph>Add Supabase MCP server to Factory:</paragraph>
        <code lang="bash" value={MCP_CLI_COMMANDS['factory'].install!(url)} />
      </>
    ),
    alternate: () => (
      <paragraph>
        Restart Factory or type <inlineCode value="/mcp" /> within droid to complete OAuth
        authentication flow.
      </paragraph>
    ),
  },
  opencode: {
    alternate: () => (
      <>
        <paragraph>
          After adding the configuration, run the following command to authenticate:
        </paragraph>
        <code lang="bash" value={MCP_CLI_COMMANDS['opencode'].authenticate!} />
        <paragraph>
          This will open your browser to complete the OAuth authentication flow.
        </paragraph>
      </>
    ),
  },
  kiro: {
    deepLinkDescription: (
      <paragraph>
        Install the Supabase <link url="https://kiro.dev/docs/powers/">power</link> for Kiro. This
        bundles the Supabase MCP server and steering files for best practices.
      </paragraph>
    ),
  },
}
