/**
 *
 * This is temporary until we resolve how to properly construct markdown
 * alternatives into these complex components. Ideally not duplicating the
 * content but extrapolating correctly its parts.
 */
export const McpConfigPanel = (): string => {
  return `The hosted Supabase MCP server is available at \`https://mcp.supabase.com/mcp\`. If you're developing locally with the Supabase CLI, use \`http://localhost:54321/mcp\` instead.

Find your client below and add the configuration shown. You can scope the server by appending URL query parameters: \`?project_ref=<id>\` to limit it to a single project, \`?read_only=true\` to allow only read queries, and \`?features=database,docs\` to enable specific tool groups.

#### AI Agent CLI

**Claude Code**

Add the MCP server to your project config using the command line:

\`\`\`bash
claude mcp add --scope project --transport http supabase "https://mcp.supabase.com/mcp"
\`\`\`

Alternatively, add this configuration to \`.mcp.json\`:

\`\`\`json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp"
    }
  }
}
\`\`\`

After configuring the MCP server, you need to authenticate. In a regular terminal (not the IDE extension) run:

\`\`\`bash
claude /mcp
\`\`\`

Select the "supabase" server, then "Authenticate" to begin the authentication flow.

**Codex**

Add the Supabase MCP server to Codex:

\`\`\`bash
codex mcp add supabase --url "https://mcp.supabase.com/mcp"
\`\`\`

Alternatively, add this configuration to \`~/.codex/config.toml\`:

\`\`\`toml
[mcp_servers.supabase]
url = "https://mcp.supabase.com/mcp"
\`\`\`

Authenticate with the MCP server:

\`\`\`bash
codex mcp login supabase
\`\`\`

Finally, run \`/mcp\` inside Codex to verify authentication.

**Gemini CLI**

> **Warning:** Ensure you are running Gemini CLI version \`0.20.2\` or higher.

Install the Supabase [extension](https://github.com/supabase-community/gemini-extension) for Gemini CLI. This bundles the Supabase MCP server connection, [agent skills](https://github.com/supabase/agent-skills), and other context.

\`\`\`bash
gemini extensions install https://github.com/supabase-community/gemini-extension
\`\`\`

Or add just the MCP server to Gemini CLI:

\`\`\`bash
gemini mcp add -t http supabase "https://mcp.supabase.com/mcp"
\`\`\`

Alternatively, add this configuration to \`.gemini/settings.json\`:

\`\`\`json
{
  "mcpServers": {
    "supabase": {
      "httpUrl": "https://mcp.supabase.com/mcp"
    }
  }
}
\`\`\`

After installation, start the Gemini CLI and run the following command to authenticate the server:

\`\`\`bash
/mcp auth supabase
\`\`\`

**GitHub Copilot**

Add the MCP server to your GitHub Copilot config using the command line:

\`\`\`bash
copilot mcp add --transport http supabase "https://mcp.supabase.com/mcp"
\`\`\`

Alternatively, add this configuration to \`~/.copilot/mcp-config.json\`:

\`\`\`json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp"
    }
  }
}
\`\`\`

After configuring the MCP server, authenticate by running:

\`\`\`bash
copilot -i /mcp
\`\`\`

Follow the on-screen instructions to complete the authentication flow.

**OpenCode**

Add this configuration to \`~/.config/opencode/opencode.json\`:

\`\`\`json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "supabase": {
      "type": "remote",
      "url": "https://mcp.supabase.com/mcp",
      "enabled": true
    }
  }
}
\`\`\`

After adding the configuration, run the following command to authenticate:

\`\`\`bash
opencode mcp auth supabase
\`\`\`

This will open your browser to complete the OAuth authentication flow.

**Factory**

Add Supabase MCP server to Factory:

\`\`\`bash
droid mcp add supabase "https://mcp.supabase.com/mcp" --type http
\`\`\`

Alternatively, add this configuration to \`~/.factory/mcp.json\`:

\`\`\`json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp"
    }
  }
}
\`\`\`

Restart Factory or type \`/mcp\` within droid to complete OAuth authentication flow.

#### Web Clients

**Claude.ai**

Available as a connector. Install it from the [Claude.ai directory](https://claude.com/docs/connectors/overview).

**ChatGPT**

Available as a connector. Install it from the [ChatGPT directory](https://chatgpt.com/features/apps/).

**Goose**

Start a Goose session with the Supabase extension:

\`\`\`bash
goose session --with-streamable-http-extension "https://mcp.supabase.com/mcp"
\`\`\`

Alternatively, add this configuration to \`~/.config/goose/config.yaml\`:

\`\`\`yaml
extensions:
  supabase:
    available_tools: []
    bundled: null
    description: 'Connect your Supabase projects to AI assistants. Manage tables, query data, deploy Edge Functions, and interact with your Supabase backend directly from your MCP client.'
    enabled: true
    env_keys: []
    envs: {}
    headers: {}
    name: Supabase
    timeout: 300
    type: streamable_http
    uri: 'https://mcp.supabase.com/mcp'
\`\`\`

For more details, see [Using Extensions](https://block.github.io/goose/docs/getting-started/using-extensions) in Goose.

#### IDE

**Cursor**

Add this configuration to \`.cursor/mcp.json\`:

\`\`\`json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp"
    }
  }
}
\`\`\`

**VS Code**

Add this configuration to \`.vscode/mcp.json\`:

\`\`\`json
{
  "servers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp"
    }
  }
}
\`\`\`

**Antigravity**

Add this configuration to \`~/.gemini/antigravity/mcp_config.json\`:

\`\`\`json
{
  "mcpServers": {
    "supabase": {
      "serverUrl": "https://mcp.supabase.com/mcp"
    }
  }
}
\`\`\`

After saving the config, restart Antigravity. It will prompt you to complete the OAuth flow to authenticate with Supabase.

To edit the config from within Antigravity, click the **···** menu at the top of the Agent pane > **MCP Servers** > **Manage MCP Servers** > **View raw config**. From the Manage MCP Servers page you can also **Refresh** server configs and enable/disable servers.

If you run into authentication issues, open Agent Settings with **Cmd+,** (Mac) or **Ctrl+,** (Windows/Linux), navigate to the **Customizations** tab, and click the **Authenticate** button next to the Supabase server.

**Kiro**

Install the Supabase [power](https://kiro.dev/docs/powers/) for Kiro. This bundles the Supabase MCP server and steering files for best practices.

Add this configuration to \`~/.kiro/settings/mcp.json\`:

\`\`\`json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp"
    }
  }
}
\`\`\`

**Windsurf**

> **Warning:** Ensure you are running Windsurf version \`0.1.37\` or higher.

Alternatively, add this configuration to \`~/.codeium/windsurf/mcp_config.json\`:

\`\`\`json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.supabase.com/mcp"
      ]
    }
  }
}
\`\`\`

Windsurf does not currently support remote MCP servers over HTTP transport. You need to use the mcp-remote package as a proxy.

**Authentication**

Some MCP clients automatically prompt you to log in during setup, while others require manual authentication steps. Either way, a browser window opens where you log in to your Supabase account and grant the MCP client access to your organization.

A personal access token (PAT) was previously required, but is no longer needed.
`
}
