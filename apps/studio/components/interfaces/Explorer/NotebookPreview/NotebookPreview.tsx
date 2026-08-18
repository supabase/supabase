import { NotebookPen } from 'lucide-react'
import { useState } from 'react'
import { Button } from 'ui'

import {
  formatNotebookDiffSummary,
  getEntryKey,
  isEntryExpandedByDefault,
  summarizeNotebookDiff,
} from './NotebookPreview.utils'
import { NotebookPreviewCell } from './NotebookPreviewCell'
import type { NotebookCellDiffEntry } from '@/data/content/notebooks/notebook-operations'

export interface NotebookPreviewProps {
  entries: NotebookCellDiffEntry[]
  mode: 'create' | 'update'
  /** The notebook's name, shown in the card header. Falls back to a generic label. */
  title?: string
}

const VISIBLE_ENTRY_LIMIT = 5

const FALLBACK_TITLE = {
  create: 'New notebook',
  update: 'Notebook changes',
} as const

/**
 * Read-only preview of a proposed notebook create/update, rendered from a pre-computed diff.
 * Pure presentational component: no data fetching, no approval or notebook-editor state — see
 * `deriveNotebookDiff` for how `entries` is produced.
 */
export const NotebookPreview = ({ entries, mode, title }: NotebookPreviewProps) => {
  const [isShowingAllEntries, setIsShowingAllEntries] = useState(false)
  const [expandedOverrides, setExpandedOverrides] = useState<Record<string, boolean>>({})

  const summary = summarizeNotebookDiff(entries, mode)
  const visibleEntries = isShowingAllEntries ? entries : entries.slice(0, VISIBLE_ENTRY_LIMIT)
  const hiddenCount = entries.length - visibleEntries.length

  const isExpanded = (entry: NotebookCellDiffEntry) =>
    expandedOverrides[getEntryKey(entry)] ?? isEntryExpandedByDefault(entry)

  const areAllExpanded = visibleEntries.every(isExpanded)

  const toggleAll = () =>
    setExpandedOverrides(
      Object.fromEntries(entries.map((entry) => [getEntryKey(entry), !areAllExpanded]))
    )

  return (
    <div className="overflow-hidden rounded-md border border-default bg-surface-100">
      <div className="flex items-center gap-2 border-b border-default bg-surface-200 px-3 py-1.5">
        <NotebookPen
          aria-hidden={true}
          size={13}
          strokeWidth={1.5}
          className="shrink-0 text-foreground-lighter"
        />
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
          {title ?? FALLBACK_TITLE[mode]}
        </span>
        <span className="heading-meta shrink-0 text-foreground-light">
          {formatNotebookDiffSummary(summary)}
        </span>
        <Button
          variant="text"
          size="tiny"
          className="-mr-1.5 shrink-0 px-1.5 text-foreground-lighter hover:text-foreground"
          onClick={toggleAll}
        >
          {areAllExpanded ? 'Collapse all' : 'Expand all'}
        </Button>
      </div>
      <div className="divide-y divide-border">
        {visibleEntries.map((entry) => {
          const key = getEntryKey(entry)
          return (
            <NotebookPreviewCell
              key={key}
              entry={entry}
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
  )
}
