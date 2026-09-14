import { useParams } from 'common'
import { FileCode, Sparkles, Terminal, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { cn } from 'ui'

import {
  buildComputeInstanceSnippets,
  type ComputeInstanceSnippetInput,
} from './computeInstanceSnippets'
import CopyButton from '@/components/ui/CopyButton'
import { useProjectSettingsV2Query } from '@/data/config/project-settings-v2-query'

export type ComputeInstanceSnippetTab = 'ai' | 'config' | 'cli' | 'curl' | 'js' | 'python'

export const COMPUTE_INSTANCE_CALL_TABS = [
  'curl',
  'js',
  'python',
] as const satisfies readonly ComputeInstanceSnippetTab[]

const TAB_LABEL: Record<ComputeInstanceSnippetTab, string> = {
  ai: 'AI Prompt',
  config: 'config.toml',
  cli: 'CLI',
  curl: 'cURL',
  js: 'JavaScript',
  python: 'Python',
}

const TAB_ICON: Record<ComputeInstanceSnippetTab, LucideIcon> = {
  ai: Sparkles,
  config: FileCode,
  cli: Terminal,
  curl: Terminal,
  js: FileCode,
  python: FileCode,
}

interface ComputeInstanceSnippetTabsProps {
  input: Omit<ComputeInstanceSnippetInput, 'endpoint' | 'protocol'>
  tabs?: readonly [ComputeInstanceSnippetTab, ...ComputeInstanceSnippetTab[]]
  className?: string
}

export const ComputeInstanceSnippetTabs = ({
  input,
  tabs = ['cli'],
  className,
}: ComputeInstanceSnippetTabsProps) => {
  const { ref } = useParams()
  const [active, setActive] = useState<ComputeInstanceSnippetTab>(tabs[0])

  const { data: settings } = useProjectSettingsV2Query({ projectRef: ref }, { enabled: !!ref })
  const snippets = buildComputeInstanceSnippets({
    ...input,
    endpoint: settings?.app_config?.endpoint,
    protocol: settings?.app_config?.protocol,
  })
  const snippetByTab: Record<ComputeInstanceSnippetTab, string> = {
    ai: snippets.aiPrompt,
    config: snippets.configToml,
    cli: snippets.cli,
    curl: snippets.curl,
    js: snippets.javascript,
    python: snippets.python,
  }
  const activeTab = tabs.includes(active) ? active : tabs[0]
  const value = snippetByTab[activeTab]

  return (
    <div className={cn('flex flex-col gap-y-2', className)}>
      <div className="flex items-center gap-x-4 border-b border-default">
        {tabs.map((tab) => {
          const Icon = TAB_ICON[tab]
          return (
            <button
              key={tab}
              type="button"
              tabIndex={0}
              onClick={() => setActive(tab)}
              className={cn(
                '-mb-px flex items-center gap-1.5 border-b px-0.5 py-1.5 text-sm transition-colors',
                tab === activeTab
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-foreground-lighter hover:text-foreground-light'
              )}
            >
              <Icon size={14} strokeWidth={1.5} />
              {TAB_LABEL[tab]}
            </button>
          )
        })}
      </div>

      <div className="relative rounded-md border border-default bg-surface-100">
        <CopyButton
          text={value}
          iconOnly
          variant="text"
          aria-label="Copy snippet"
          className="absolute right-2 top-2 text-foreground-lighter hover:text-foreground"
        />
        {activeTab === 'ai' ? (
          <p className="overflow-x-auto whitespace-pre-wrap p-3 pr-10 text-sm leading-relaxed text-foreground-light">
            {value}
          </p>
        ) : (
          <pre className="overflow-x-auto p-3 pr-10 font-mono text-xs leading-relaxed text-foreground-light">
            {value}
          </pre>
        )}
      </div>
    </div>
  )
}
