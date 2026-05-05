'use client'

import { ExternalLink } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState } from 'react'
import { CodeBlock } from 'ui-patterns/CodeBlock'
import { ClientSelectDropdown, type McpClient } from 'ui-patterns/McpUrlBuilder'

interface PluginClient extends McpClient {
  repoUrl?: string
  docsUrl?: string
}

const PLUGIN_CLIENTS: PluginClient[] = [
  {
    key: 'claude-code',
    label: 'Claude Code',
    icon: 'claude',
    repoUrl: 'https://github.com/supabase-community/supabase-plugin',
    docsUrl: 'https://code.claude.com/docs/en/discover-plugins',
  },
  {
    key: 'codex',
    label: 'Codex',
    icon: 'openai',
    hasDistinctDarkIcon: true,
    repoUrl: 'https://github.com/supabase-community/codex-plugin',
    docsUrl: 'https://developers.openai.com/codex/plugins',
  },
  {
    key: 'cursor',
    label: 'Cursor',
    icon: 'cursor',
    repoUrl: 'https://github.com/supabase-community/cursor-plugin',
    docsUrl: 'https://cursor.com/docs/plugins',
  },
  {
    key: 'gemini-cli',
    label: 'Gemini CLI',
    icon: 'gemini-cli',
    repoUrl: 'https://github.com/supabase-community/gemini-extension',
    docsUrl: 'https://geminicli.com/docs/extensions/',
  },
]

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
          value="gemini extensions install https://github.com/supabase-community/gemini-extension"
          language="bash"
          focusable={false}
          className="block"
        />
        <p className="text-xs text-foreground-lighter">
          You can also find the extension in the{' '}
          <a
            href="https://geminicli.com/extensions/?name=supabase-communitygemini-extension"
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
