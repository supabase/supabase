import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { AiAssistantDropdown } from 'components/ui/AiAssistantDropdown'
import { Check, ChevronDown, Copy, X as XIcon } from 'lucide-react'
import { useMemo } from 'react'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

import type { LogData, QueryType } from './Logs.types'
import { buildLogsPrompt } from './Logs.utils'

interface MultiSelectActionBarProps {
  selectedRows: Set<string>
  selectedRowsData: LogData[]
  copiedFormat: 'json' | 'markdown' | null
  onCopy: (format: 'json' | 'markdown') => void
  onClear: () => void
  queryType?: QueryType
  sqlQuery?: string
}

export function MultiSelectActionBar({
  selectedRows,
  selectedRowsData,
  copiedFormat,
  onCopy,
  onClear,
  queryType,
  sqlQuery,
}: MultiSelectActionBarProps) {
  const { openSidebar } = useSidebarManagerSnapshot()
  const aiSnap = useAiAssistantStateSnapshot()

  function handleOpenAiAssistant() {
    const prompt = buildLogsPrompt(selectedRowsData, queryType, sqlQuery)
    openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
    aiSnap.newChat({ initialMessage: prompt })
  }
  const count = selectedRows.size
  if (count === 0) return null

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 border-b bg-surface-200 text-sm sticky top-0 z-10"
      style={{ height: 40 }}
    >
      <span className="text-foreground-light font-mono text-xs">
        {count} row{count !== 1 ? 's' : ''} selected
      </span>

      <div className="flex items-center gap-1 ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="default"
              size="tiny"
              icon={copiedFormat ? <Check size={12} className="text-brand" /> : <Copy size={12} />}
              iconRight={<ChevronDown size={11} />}
            >
              {copiedFormat ? 'Copied!' : 'Copy'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onCopy('json')} className="gap-2 text-xs">
              <Copy size={13} />
              Copy as JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCopy('markdown')} className="gap-2 text-xs">
              <Copy size={13} />
              Copy as Markdown
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AiAssistantDropdown
          label="Explain with AI"
          buildPrompt={() => buildLogsPrompt(selectedRowsData, queryType, sqlQuery)}
          onOpenAssistant={handleOpenAiAssistant}
          telemetrySource="log_explorer"
        />

        <Button
          type="text"
          size="tiny"
          icon={<XIcon size={12} />}
          onClick={onClear}
          title="Clear selection"
          className="text-foreground-lighter px-1.5 hover:text-foreground"
        />
      </div>
    </div>
  )
}
