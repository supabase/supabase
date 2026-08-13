import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { cn, copyToClipboard } from 'ui'

import { buildWorkerSnippets, type WorkerSnippetInput } from './workerSnippets'

export type WorkerSnippetTab = 'ai' | 'config' | 'cli' | 'curl' | 'js' | 'python'

const TAB_LABEL: Record<WorkerSnippetTab, string> = {
  ai: 'AI',
  config: 'config.toml',
  cli: 'CLI',
  curl: 'cURL',
  js: 'JavaScript',
  python: 'Python',
}

interface WorkerSnippetTabsProps {
  input: WorkerSnippetInput
  tabs?: WorkerSnippetTab[]
  className?: string
}

/**
 * Renders a subset of the deploy artifacts (AI prompt, config.toml, CLI, curl)
 * as a small tabbed code block that updates live from the create-worker form.
 */
export const WorkerSnippetTabs = ({
  input,
  tabs = ['cli', 'curl'],
  className,
}: WorkerSnippetTabsProps) => {
  const [active, setActive] = useState<WorkerSnippetTab>(tabs[0])
  const [isCopied, setIsCopied] = useState(false)

  const snippets = buildWorkerSnippets(input)
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

  const handleCopy = () => {
    setIsCopied(true)
    copyToClipboard(value)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <div className={cn('flex flex-col gap-y-2', className)}>
      <div className="flex items-center gap-x-4 border-b border-default">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
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
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy snippet"
          className="absolute right-2 top-2 rounded p-1 text-foreground-lighter transition-colors hover:bg-surface-200 hover:text-foreground"
        >
          {isCopied ? <Check size={14} className="text-brand" /> : <Copy size={14} />}
        </button>
        <pre className="overflow-x-auto p-3 pr-10 font-mono text-xs leading-relaxed text-foreground-light">
          {value}
        </pre>
      </div>
    </div>
  )
}
