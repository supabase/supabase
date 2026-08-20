import { useParams } from 'common'
import { useState } from 'react'
import { cn } from 'ui'

import { buildWorkerSnippets, type WorkerSnippetInput } from './workerSnippets'
import CopyButton from '@/components/ui/CopyButton'
import { useProjectSettingsV2Query } from '@/data/config/project-settings-v2-query'

export type WorkerSnippetTab = 'config' | 'cli' | 'curl' | 'js' | 'python'

const TAB_LABEL: Record<WorkerSnippetTab, string> = {
  config: 'config.toml',
  cli: 'CLI',
  curl: 'cURL',
  js: 'JavaScript',
  python: 'Python',
}

interface WorkerSnippetTabsProps {
  input: Omit<WorkerSnippetInput, 'endpoint' | 'protocol'>
  tabs?: WorkerSnippetTab[]
  className?: string
}

export const WorkerSnippetTabs = ({
  input,
  tabs = ['cli', 'curl'],
  className,
}: WorkerSnippetTabsProps) => {
  const { ref } = useParams()
  const [active, setActive] = useState<WorkerSnippetTab>(tabs[0])

  const { data: settings } = useProjectSettingsV2Query({ projectRef: ref }, { enabled: !!ref })
  const snippets = buildWorkerSnippets({
    ...input,
    endpoint: settings?.app_config?.endpoint,
    protocol: settings?.app_config?.protocol,
  })
  const snippetByTab: Record<WorkerSnippetTab, string> = {
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
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            tabIndex={0}
            onClick={() => setActive(tab)}
            className={cn(
              '-mb-px border-b px-0.5 py-1.5 text-sm transition-colors',
              tab === activeTab
                ? 'border-foreground text-foreground'
                : 'border-transparent text-foreground-lighter hover:text-foreground-light'
            )}
          >
            {TAB_LABEL[tab]}
          </button>
        ))}
      </div>

      <div className="relative rounded-md border border-default bg-surface-100">
        <CopyButton
          text={value}
          iconOnly
          variant="text"
          aria-label="Copy snippet"
          className="absolute right-2 top-2 text-foreground-lighter hover:text-foreground"
        />
        <pre className="overflow-x-auto p-3 pr-10 font-mono text-xs leading-relaxed text-foreground-light">
          {value}
        </pre>
      </div>
    </div>
  )
}
