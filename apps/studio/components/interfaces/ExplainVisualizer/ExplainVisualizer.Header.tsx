import { ArrowUp, Eye, Code, HelpCircle } from 'lucide-react'

import { useFlag } from 'common'
import { AiIconAnimation, Button } from 'ui'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { buildExplainPrompt } from './ExplainVisualizer.ai'
import type { QueryPlanRow } from './ExplainVisualizer.types'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

export interface ExplainSummary {
  totalTime: number
  hasSeqScan: boolean
  hasIndexScan: boolean
}

export interface ExplainHeaderProps {
  mode: 'visual' | 'raw'
  onToggleMode: () => void
  summary?: ExplainSummary
  id?: string
  rows?: readonly QueryPlanRow[]
}

export function ExplainHeader({ mode, onToggleMode, summary, id, rows }: ExplainHeaderProps) {
  const isVisual = mode === 'visual'

  const snapV2 = useSqlEditorV2StateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()
  const aiSnap = useAiAssistantStateSnapshot()

  const handleExplainWithAI = () => {
    if (!id) return
    const snippet = snapV2.snippets[id]?.snippet
    if (!snippet?.content?.sql) return

    const { query, prompt } = buildExplainPrompt({
      sql: snippet.content.sql,
      explainPlanRows: (rows as QueryPlanRow[]) ?? [],
    })

    openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
    aiSnap.newChat({
      sqlSnippets: [
        {
          label: 'Query',
          content: query,
        },
      ],
      initialMessage: prompt,
    })
  }

  const hasSummaryStats =
    isVisual && summary && (summary.totalTime > 0 || (summary.hasSeqScan && !summary.hasIndexScan))

  return (
    <div className="bg-surface-100 border-b px-4 py-3 flex flex-col gap-3 text-xs">
      {/* Title row */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-foreground">Query Execution Plan</h3>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle
                size="14"
                strokeWidth={2}
                className="text-foreground-lighter hover:text-foreground-light transition-colors cursor-help"
              />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs p-4">
              <h3 className="text-xs font-medium mb-2">How to read</h3>
              <p className="text-foreground-light text-xs">
                Start at the bottom where data is read from tables, then follow upward as each step
                processes the results.
              </p>

              {isVisual && (
                <>
                  <h3 className="text-xs font-medium mt-4 mb-2">Key</h3>
                  <div className="flex flex-col gap-1 text-foreground-light">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-warning" />
                      <span>Seq Scan (slow)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand" />
                      <span>Index Scan (fast)</span>
                    </div>
                  </div>
                </>
              )}
            </TooltipContent>
          </Tooltip>
          {/* Summary stats - only show in visual mode when we have the data */}
          {hasSummaryStats && (
            <div className="flex items-center gap-4 flex-wrap">
              {summary.totalTime > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-foreground-muted">/</span>
                  <span className="text-foreground-light">Total time</span>
                  <span className="font-medium text-foreground">
                    {summary.totalTime.toFixed(2)}ms
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {id && rows && (
            <Button
              type="default"
              size="tiny"
              icon={<AiIconAnimation size={14} />}
              onClick={handleExplainWithAI}
            >
              Explain with AI
            </Button>
          )}
          <Button
            type="default"
            size="tiny"
            icon={isVisual ? <Code size={14} /> : <Eye size={14} />}
            onClick={onToggleMode}
          >
            {isVisual ? 'Raw' : 'Visual'}
          </Button>
        </div>
      </div>
    </div>
  )
}
