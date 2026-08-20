import { useParams } from 'common'
import { Sparkles } from 'lucide-react'
import { useState } from 'react'
import { cn } from 'ui'

import { buildWorkerSnippets, type WorkerSnippetInput } from './workerSnippets'
import CopyButton from '@/components/ui/CopyButton'
import { useProjectSettingsV2Query } from '@/data/config/project-settings-v2-query'

export type WorkerSnippetTab = 'ai' | 'config' | 'cli' | 'curl' | 'js' | 'python'

const TAB_LABEL: Record<WorkerSnippetTab, string> = {
  ai: 'AI Prompt',
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
  /** Frame the whole thing as a recessed, code-editor-style panel. */
  editor?: boolean
  /** Stretch to fill the parent's height; the snippet area scrolls vertically. */
  fillHeight?: boolean
  /** Wrap long lines instead of scrolling horizontally. */
  wrap?: boolean
}

export const WorkerSnippetTabs = ({
  input,
  tabs = ['cli', 'curl'],
  className,
  editor = false,
  fillHeight = false,
  wrap = false,
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
    <div
      className={cn(
        'flex flex-col',
        editor
          ? 'overflow-hidden rounded-lg border border-default bg-surface-75'
          : 'gap-y-2',
        fillHeight && 'h-full min-h-0',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center gap-x-4 border-b border-default',
          editor && 'shrink-0 px-3'
        )}
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            tabIndex={0}
            onClick={() => setActive(tab)}
            className={cn(
              '-mb-px flex items-center gap-1.5 border-b px-0.5 py-2 text-sm transition-colors',
              tab === activeTab
                ? 'border-foreground text-foreground'
                : 'border-transparent text-foreground-lighter hover:text-foreground-light'
            )}
          >
            {tab === 'ai' && <Sparkles size={13} strokeWidth={1.5} />}
            {TAB_LABEL[tab]}
          </button>
        ))}
      </div>

      <div
        className={cn(
          'relative',
          fillHeight && 'min-h-0 flex-1',
          !editor && 'rounded-md border border-default bg-surface-100'
        )}
      >
        <CopyButton
          text={value}
          iconOnly
          variant="text"
          aria-label="Copy snippet"
          className="absolute right-2 top-2 z-10 text-foreground-lighter hover:text-foreground"
        />
        <pre
          className={cn(
            'p-3 pr-10 font-mono text-xs leading-relaxed text-foreground-light',
            fillHeight ? 'absolute inset-0 overflow-auto' : wrap ? '' : 'overflow-x-auto',
            wrap && 'whitespace-pre-wrap break-words'
          )}
        >
          {value}
        </pre>
      </div>
    </div>
  )
}
