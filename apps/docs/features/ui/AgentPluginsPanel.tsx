'use client'

import { ExternalLink } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState } from 'react'
import { CodeBlock } from 'ui-patterns/CodeBlock'
import { ClientSelectDropdown } from 'ui-patterns/McpUrlBuilder'

import { PLUGIN_CLIENTS, type PluginClient } from './AgentPluginsPanel.data'

function PluginInstructions({ client }: { client: PluginClient }) {
  if (client.key === 'claude-code') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-foreground-light">
          Install the Supabase plugin from the{' '}
          <a
            href="https://claude.com/plugins/supabase"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-link hover:underline"
          >
            official Anthropic marketplace
          </a>
        </p>
        <CodeBlock
          value={`claude plugin marketplace add anthropics/claude-plugins-official\nclaude plugin install supabase@claude-plugins-official`}
          language="bash"
          focusable={false}
          className="block"
        />
        <p className="text-xs text-foreground-lighter">
          After installing, run <code>/reload-plugins</code> inside Claude Code to activate the
          plugin.
        </p>
        <p className="text-xs text-foreground-lighter">
          Installs with <code>--scope user</code> by default, making it available across all your
          projects. Use <code>--scope project</code> to track it in source control — useful for
          teams where all contributors and cloud agents should follow the same Supabase guidance.
        </p>
      </div>
    )
  }

  if (client.key === 'codex') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Desktop app</h4>
          <p className="text-xs text-foreground-lighter">
            Install the Supabase plugin directly from the{' '}
            <a
              href="https://developers.openai.com/codex/plugins#plugin-directory-in-the-codex-app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-link hover:underline"
            >
              Codex desktop app plugin directory
            </a>
            .
          </p>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-medium">CLI</h4>
          <p className="text-xs text-foreground-lighter">Open the Codex CLI by running</p>
          <CodeBlock value="codex" language="bash" focusable={false} className="block" />
          <p className="text-xs text-foreground-lighter">Inside Codex, type:</p>
          <CodeBlock value="/plugins" language="bash" focusable={false} className="block" />
          <p className="text-xs text-foreground-lighter">
            Search for <strong>Supabase</strong> and select <strong>Install plugin</strong>.
          </p>
        </div>
      </div>
    )
  }

  if (client.key === 'cursor') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-foreground-light">
          In the Cursor desktop or web app, type the following in the chat to install the{' '}
          <a
            href="https://cursor.com/marketplace/supabase"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-link hover:underline"
          >
            Supabase
          </a>{' '}
          plugin from the Cursor plugin marketplace
        </p>
        <CodeBlock
          value="/add-plugin supabase"
          language="bash"
          focusable={false}
          className="block"
        />
      </div>
    )
  }

  if (client.key === 'gemini-cli') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-foreground-light">
          Install the official Supabase extension for Gemini CLI by running the following command in
          your terminal.
        </p>
        <CodeBlock
          value="gemini extensions install https://github.com/supabase-community/supabase-plugin"
          language="bash"
          focusable={false}
          className="block"
        />
        <p className="text-xs text-foreground-lighter">
          You can also find the extension in the{' '}
          <a
            href="https://geminicli.com/extensions/?name=supabase-communitysupabase-plugin"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-link hover:underline"
          >
            Gemini CLI extensions directory
          </a>
          .
        </p>
      </div>
    )
  }

  if (client.key === 'kimi') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-foreground-light">Open Kimi Code by running</p>
        <CodeBlock value="kimi" language="bash" focusable={false} className="block" />
        <p className="text-sm text-foreground-light">
          Then install the Supabase plugin from within the session:
        </p>
        <CodeBlock
          value="/plugins install https://github.com/supabase-community/supabase-plugin"
          language="bash"
          focusable={false}
          className="block"
        />
        <p className="text-xs text-foreground-lighter">
          Confirm the trust prompt to install. Kimi adds the plugin to its native plugin store. Run{' '}
          <code>/plugins</code> at any time to view or reload installed plugins.
        </p>
      </div>
    )
  }

  if (client.key === 'vscode') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-foreground-light">
          Open the Command Palette (<code>Cmd/Ctrl+Shift+P</code>) and run{' '}
          <strong>Chat: Install Plugin From Source</strong>, then paste the Supabase plugin
          repository URL:
        </p>
        <CodeBlock
          value="https://github.com/supabase-community/supabase-plugin"
          language="bash"
          focusable={false}
          className="block"
        />
        <p className="text-xs text-foreground-lighter">
          VS Code auto-detects the vendor-neutral{' '}
          <a
            href="https://github.com/vercel-labs/open-plugin-spec"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-link hover:underline"
          >
            Open Plugin
          </a>{' '}
          manifest in the repo. Review the trust prompt to finish installing.
        </p>
      </div>
    )
  }

  if (client.key === 'github-copilot') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium">From GitHub</h4>
          <p className="text-xs text-foreground-lighter">
            Install the Supabase plugin directly from the{' '}
            <a
              href="https://github.com/supabase-community/supabase-plugin"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-link hover:underline"
            >
              GitHub repository
            </a>
            .
          </p>
          <CodeBlock
            value="copilot plugin install supabase-community/supabase-plugin"
            language="bash"
            focusable={false}
            className="block"
          />
        </div>
      </div>
    )
  }

  return null
}

export function AgentPluginsPanel() {
  const [selectedClientKey, setSelectedClientKey] = useState(PLUGIN_CLIENTS[0].key)
  const { resolvedTheme } = useTheme()

  const theme = (resolvedTheme as 'light' | 'dark') ?? 'light'
  const selectedClient =
    PLUGIN_CLIENTS.find((c) => c.key === selectedClientKey) ?? PLUGIN_CLIENTS[0]

  return (
    <div className="not-prose">
      <ClientSelectDropdown
        theme={theme}
        clients={PLUGIN_CLIENTS}
        selectedClient={selectedClient}
        onClientChange={setSelectedClientKey}
      />
      <div className="mt-4 rounded-lg border border-muted p-4">
        <PluginInstructions client={selectedClient} />
      </div>
      <div className="mt-3 flex flex-col gap-1 text-xs text-foreground-light">
        {selectedClient.docsUrl && (
          <div className="flex items-center gap-2">
            <span>Need help?</span>
            <a
              href={selectedClient.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-link hover:underline inline-flex items-center"
            >
              View {selectedClient.label} extensions docs
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </div>
        )}
        {selectedClient.repoUrl && (
          <a
            href={selectedClient.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-link hover:underline inline-flex items-center"
          >
            Give feedback
            <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        )}
      </div>
    </div>
  )
}
