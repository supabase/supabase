'use client'

import { Bot, Check, ChevronDown, ExternalLink } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState } from 'react'
import {
  Button,
  cn,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
} from 'ui'
import { CodeBlock } from 'ui-patterns/CodeBlock'
import { ConnectionIcon } from 'ui-patterns/McpUrlBuilder'

interface PluginClient {
  key: string
  label: string
  icon?: string
  hasDistinctDarkIcon?: boolean
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

function ClientDropdown({
  theme,
  selectedClient,
  onClientChange,
}: {
  theme: 'light' | 'dark'
  selectedClient: PluginClient
  onClientChange: (key: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
      <div className="flex">
        <span className="flex items-center text-foreground-lighter px-3 rounded-lg rounded-r-none text-xs border border-button border-r-0">
          Client
        </span>
        <PopoverTrigger_Shadcn_ asChild>
          <Button
            size="small"
            type="default"
            className="gap-0 rounded-l-none"
            iconRight={
              <ChevronDown
                strokeWidth={1.5}
                className={cn('transition-transform duration-200', open && 'rotate-180')}
              />
            }
          >
            <div className="flex items-center gap-2">
              {selectedClient.icon ? (
                <ConnectionIcon
                  connection={selectedClient.icon}
                  theme={theme}
                  hasDistinctDarkIcon={selectedClient.hasDistinctDarkIcon}
                />
              ) : (
                <Bot size={12} aria-hidden />
              )}
              {selectedClient.label}
            </div>
          </Button>
        </PopoverTrigger_Shadcn_>
      </div>
      <PopoverContent_Shadcn_ className="mt-0 p-0 max-w-48" side="bottom" align="start">
        <Command_Shadcn_>
          <CommandInput_Shadcn_ placeholder="Search..." />
          <CommandList_Shadcn_>
            <CommandEmpty_Shadcn_>No results found.</CommandEmpty_Shadcn_>
            <CommandGroup_Shadcn_>
              {PLUGIN_CLIENTS.map((client) => (
                <CommandItem_Shadcn_
                  key={client.key}
                  value={client.key}
                  onSelect={() => {
                    onClientChange(client.key)
                    setOpen(false)
                  }}
                  className="flex gap-2 items-center"
                >
                  {client.icon ? (
                    <ConnectionIcon
                      connection={client.icon}
                      theme={theme}
                      hasDistinctDarkIcon={client.hasDistinctDarkIcon}
                    />
                  ) : (
                    <Bot size={12} aria-hidden />
                  )}
                  {client.label}
                  <Check
                    size={15}
                    aria-label={client.key === selectedClient.key ? 'selected' : undefined}
                    className={cn(
                      'ml-auto',
                      client.key === selectedClient.key ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem_Shadcn_>
              ))}
            </CommandGroup_Shadcn_>
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

function PluginInstructions({ client }: { client: PluginClient }) {
  if (client.key === 'claude-code') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-foreground-light">
          Add the Supabase{' '}
          <a
            href="https://skills.sh"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-link hover:underline"
          >
            agent skills
          </a>{' '}
          marketplace, then install the plugin from the{' '}
          <a
            href="https://claude.com/plugins"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-link hover:underline"
          >
            official Anthropic marketplace
          </a>
          :
        </p>
        <CodeBlock
          value={`claude plugin marketplace add supabase/agent-skills\nclaude plugin install supabase@claude-plugins-official`}
          language="bash"
          focusable={false}
          className="block"
        />
        <p className="text-xs text-foreground-lighter">
          After installing, run <code>/reload-plugins</code> inside Claude Code to activate the
          plugin.
        </p>
      </div>
    )
  }

  if (client.key === 'codex') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-foreground-light">
          Start Codex and open the plugin browser with <code>/plugins</code>. Search for Supabase
          and select <strong>Install plugin</strong>.
        </p>
        <CodeBlock value="codex" language="bash" focusable={false} className="block" />
        <p className="text-xs text-foreground-lighter">
          Then type <code>/plugins</code> inside Codex and search for Supabase. Some plugins ask you
          to authenticate during install; others wait until first use.
        </p>
      </div>
    )
  }

  if (client.key === 'cursor') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-foreground-light">
          Run the following command inside Cursor&apos;s chat to install the Supabase plugin from
          the{' '}
          <a
            href="https://cursor.com/marketplace/supabase"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-link hover:underline"
          >
            Cursor marketplace
          </a>
          :
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
          Install the Supabase extension for Gemini CLI:
        </p>
        <CodeBlock
          value="gemini extensions install https://github.com/supabase-community/gemini-extension"
          language="bash"
          focusable={false}
          className="block"
        />
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
      <ClientDropdown
        theme={theme}
        selectedClient={selectedClient}
        onClientChange={setSelectedClientKey}
      />
      <div className="mt-4 rounded-lg border border-muted p-4">
        <PluginInstructions client={selectedClient} />
      </div>
      <div className="mt-2 flex gap-4">
        {selectedClient.docsUrl && (
          <a
            href={selectedClient.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-foreground-lighter hover:text-foreground-light transition-colors"
          >
            <ExternalLink size={10} />
            {selectedClient.label} plugin docs
          </a>
        )}
        {selectedClient.repoUrl && (
          <a
            href={selectedClient.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-foreground-lighter hover:text-foreground-light transition-colors"
          >
            <ExternalLink size={10} />
            Plugin repository
          </a>
        )}
      </div>
    </div>
  )
}
