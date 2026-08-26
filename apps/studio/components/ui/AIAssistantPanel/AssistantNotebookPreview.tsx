import { NotebookText } from 'lucide-react'
import { useState } from 'react'
import { Button, cn } from 'ui'

import {
  formatNotebookDiffSummary,
  getEntryKey,
  summarizeNotebookDiff,
} from './AssistantNotebookPreview.utils'
import { AssistantNotebookPreviewCell } from './AssistantNotebookPreviewCell'
import {
  ExplorerToolbar,
  ExplorerToolbarActions,
  ExplorerToolbarIcon,
  ExplorerToolbarTitle,
} from '@/components/interfaces/Explorer/ExplorerToolbar'
import type { QueryResult } from '@/components/interfaces/Explorer/types'
import type { NotebookCellDiffEntry } from '@/data/content/notebooks/notebook-operations'

export interface AssistantNotebookPreviewProps {
  entries: NotebookCellDiffEntry[]
  mode: 'create' | 'update' | 'run'
  /** The notebook's name, shown in the toolbar. Falls back to a generic label. */
  title?: string
  /** Query results keyed by persisted cell id. */
  results?: Record<string, QueryResult>
  className?: string
}

const VISIBLE_ENTRY_LIMIT = 5

const FALLBACK_TITLE = {
  create: 'New notebook',
  update: 'Notebook changes',
  run: 'Notebook run',
} as const

/**
 * Read-only minified notebook for assistant create/update proposals and notebook runs.
 * Composes the same Explorer toolbar and query-result surfaces as notebook tabs; the
 * surrounding `Confirm` card owns the frame. Pure presentational: no data fetching,
 * approval, or notebook-editor state — callers adapt those concerns into entries/results.
 */
export const AssistantNotebookPreview = ({
  entries,
  mode,
  title,
  results,
  className,
}: AssistantNotebookPreviewProps) => {
  const [isShowingAllEntries, setIsShowingAllEntries] = useState(false)
  const [expandedOverrides, setExpandedOverrides] = useState<Record<string, boolean>>({})

  const summary = summarizeNotebookDiff(entries, mode)
  const visibleEntries = isShowingAllEntries ? entries : entries.slice(0, VISIBLE_ENTRY_LIMIT)
  const hiddenCount = entries.length - visibleEntries.length
  const hasResults = results !== undefined

  const isExpanded = (entry: NotebookCellDiffEntry) =>
    expandedOverrides[getEntryKey(entry)] === true

  return (
    <div className={cn('flex w-full min-w-0 max-w-6xl mx-auto flex-col', className)}>
      <ExplorerToolbar aria-label="Notebook toolbar">
        <ExplorerToolbarIcon>
          <NotebookText />
        </ExplorerToolbarIcon>
        <ExplorerToolbarTitle>{title ?? FALLBACK_TITLE[mode]}</ExplorerToolbarTitle>
        <ExplorerToolbarActions>
          <span className="shrink-0 text-sm text-muted-foreground">
            {formatNotebookDiffSummary(summary)}
          </span>
        </ExplorerToolbarActions>
      </ExplorerToolbar>
      <div className="p-2">
        <div
          className={cn(
            hasResults ? 'flex flex-col gap-2' : 'overflow-hidden rounded-md border bg-surface-100'
          )}
        >
          <div className={cn(hasResults ? 'contents' : 'divide-y divide-border')}>
            {visibleEntries.map((entry) => {
              const key = getEntryKey(entry)
              return (
                <div
                  key={key}
                  className={cn(hasResults && 'overflow-hidden rounded-md border bg-surface-100')}
                >
                  <AssistantNotebookPreviewCell
                    entry={entry}
                    mode={mode}
                    result={results?.[key]}
                    isExpanded={isExpanded(entry)}
                    onExpandedChange={(open) =>
                      setExpandedOverrides((prev) => ({ ...prev, [key]: open }))
                    }
                  />
                </div>
              )
            })}
          </div>
          {hiddenCount > 0 && (
            <Button
              variant="text"
              size="tiny"
              className={cn(
                'w-full text-foreground-light',
                !hasResults && 'rounded-none border-0 border-t border-default'
              )}
              onClick={() => setIsShowingAllEntries(true)}
            >
              Show {hiddenCount} more cell{hiddenCount === 1 ? '' : 's'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
