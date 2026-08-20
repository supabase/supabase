import { NotebookText } from 'lucide-react'
import { useState } from 'react'
import { Button, cn } from 'ui'

import {
  formatNotebookDiffSummary,
  getEntryKey,
  isEntryExpandedByDefault,
  summarizeNotebookDiff,
} from './AssistantNotebookPreview.utils'
import { AssistantNotebookPreviewCell } from './AssistantNotebookPreviewCell'
import {
  ExplorerToolbar,
  ExplorerToolbarActions,
  ExplorerToolbarIcon,
  ExplorerToolbarTitle,
} from '@/components/interfaces/Explorer/ExplorerToolbar'
import type { NotebookCellDiffEntry } from '@/data/content/notebooks/notebook-operations'

export interface AssistantNotebookPreviewProps {
  entries: NotebookCellDiffEntry[]
  mode: 'create' | 'update'
  /** The notebook's name, shown in the toolbar. Falls back to a generic label. */
  title?: string
  className?: string
}

const VISIBLE_ENTRY_LIMIT = 5

const FALLBACK_TITLE = {
  create: 'New notebook',
  update: 'Notebook changes',
} as const

/**
 * Read-only minified notebook for assistant create/update previews. Composes the same
 * Explorer toolbar as notebook tabs; the surrounding `Confirm` card owns the frame.
 * Pure presentational: no data fetching, no approval or notebook-editor state — see
 * `deriveNotebookDiff` for how `entries` is produced.
 */
export const AssistantNotebookPreview = ({
  entries,
  mode,
  title,
  className,
}: AssistantNotebookPreviewProps) => {
  const [isShowingAllEntries, setIsShowingAllEntries] = useState(false)
  const [expandedOverrides, setExpandedOverrides] = useState<Record<string, boolean>>({})

  const summary = summarizeNotebookDiff(entries, mode)
  const visibleEntries = isShowingAllEntries ? entries : entries.slice(0, VISIBLE_ENTRY_LIMIT)
  const hiddenCount = entries.length - visibleEntries.length

  const isExpanded = (entry: NotebookCellDiffEntry) =>
    expandedOverrides[getEntryKey(entry)] ?? isEntryExpandedByDefault(entry)

  return (
    <div className={cn('flex min-w-0 flex-col', className)}>
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
        <div className="overflow-hidden rounded-md border bg-surface-100">
          <div className="divide-y divide-border">
            {visibleEntries.map((entry) => {
              const key = getEntryKey(entry)
              return (
                <AssistantNotebookPreviewCell
                  key={key}
                  entry={entry}
                  mode={mode}
                  isExpanded={isExpanded(entry)}
                  onExpandedChange={(open) =>
                    setExpandedOverrides((prev) => ({ ...prev, [key]: open }))
                  }
                />
              )
            })}
          </div>
          {hiddenCount > 0 && (
            <Button
              variant="text"
              size="tiny"
              className="w-full rounded-none border-0 border-t border-default text-foreground-light"
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
