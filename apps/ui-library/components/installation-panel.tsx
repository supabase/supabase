'use client'

import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'ui'

import type { PackageManager } from '@/lib/install-command'

interface InstallationPanelProps {
  title: string
  pagePath: string
  commands: Partial<Record<PackageManager, string>>
}

export function InstallationPanel({ title, pagePath, commands }: InstallationPanelProps) {
  const packageManagers = Object.keys(commands) as PackageManager[]
  const [tab, setTab] = useState<PackageManager | 'prompt'>(packageManagers[0])
  const [packageManager, setPackageManager] = useState<PackageManager>(packageManagers[0])
  const [copied, setCopied] = useState(false)
  const command = commands[packageManager] ?? ''
  const pageUrl =
    typeof window === 'undefined' ? pagePath : new URL(pagePath, window.location.origin).href
  const prompt = `Help me install ${title} from the Supabase UI Library in my project. Read ${pageUrl} for the full setup instructions. Run these commands from my project directory:\n\n${command}\n\nCheck my existing project structure and reuse any Supabase client setup that is already in place.`
  const content = tab === 'prompt' ? prompt : (commands[tab] ?? '')

  useEffect(() => {
    if (!copied) return
    const timeout = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timeout)
  }, [copied])

  async function copy() {
    await navigator.clipboard.writeText(content)
    setCopied(true)
  }

  function selectTab(value: string) {
    if (value !== 'prompt') setPackageManager(value as PackageManager)
    setTab(value as PackageManager | 'prompt')
  }

  return (
    <Tabs value={tab} onValueChange={selectTab}>
      <div className="overflow-hidden rounded-b-xl border border-t-0 bg-background">
        <div className="flex items-center justify-between border-b px-3">
          <TabsList aria-label="Installation options" className="gap-0">
            {packageManagers.map((manager) => (
              <TabsTrigger
                key={manager}
                value={manager}
                className="px-3 py-3 text-xs data-[state=active]:border-brand"
              >
                {manager}
              </TabsTrigger>
            ))}
            <TabsTrigger
              value="prompt"
              className="px-3 py-3 text-xs data-[state=active]:border-brand"
            >
              Prompt
            </TabsTrigger>
          </TabsList>
          <button
            type="button"
            tabIndex={0}
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-foreground-light hover:bg-surface-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {copied ? <Check className="size-3.5 text-brand" /> : <Copy className="size-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        {packageManagers.map((manager) => (
          <TabsContent key={manager} value={manager} className="m-0 p-5">
            <pre className="min-w-0 flex-1 overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs leading-6 text-foreground">
              <code>{commands[manager]}</code>
            </pre>
          </TabsContent>
        ))}
        <TabsContent value="prompt" className="m-0 p-5">
          <p className="whitespace-pre-line font-mono text-xs leading-6 text-foreground-light">
            {prompt}
          </p>
        </TabsContent>
      </div>
    </Tabs>
  )
}
