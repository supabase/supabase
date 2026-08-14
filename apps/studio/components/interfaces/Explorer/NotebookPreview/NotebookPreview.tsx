import { useState } from 'react'
import { Button } from 'ui'

import {
  formatNotebookDiffSummary,
  getEntryKey,
  summarizeNotebookDiff,
} from './NotebookPreview.utils'
import { NotebookPreviewCell } from './NotebookPreviewCell'
import type { NotebookCellDiffEntry } from '@/data/content/notebooks/notebook-operations'

export interface NotebookPreviewProps {
  entries: NotebookCellDiffEntry[]
  mode: 'create' | 'update'
}

// Long notebooks stay skimmable behind a "show more" affordance rather than a fixed scroll
// area, mirroring AdvisorPanelBody's "Show N more issues" pattern.
const VISIBLE_ENTRY_LIMIT = 5

/**
 * Read-only preview of a proposed notebook create/update, rendered from a pre-computed diff.
 * Pure presentational component: no data fetching, no approval or notebook-editor state — see
 * `deriveNotebookDiff` for how `entries` is produced.
 */
export const NotebookPreview = ({ entries, mode }: NotebookPreviewProps) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const summary = summarizeNotebookDiff(entries, mode)
  const visibleEntries = isExpanded ? entries : entries.slice(0, VISIBLE_ENTRY_LIMIT)
  const hiddenCount = entries.length - visibleEntries.length

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-foreground-light font-mono">
        {formatNotebookDiffSummary(summary)}
      </p>
      <div className="flex flex-col gap-1.5">
        {visibleEntries.map((entry) => (
          <NotebookPreviewCell key={getEntryKey(entry)} entry={entry} />
        ))}
      </div>
      {hiddenCount > 0 && (
        <Button variant="text" className="w-full" onClick={() => setIsExpanded(true)}>
          Show {hiddenCount} more cell{hiddenCount === 1 ? '' : 's'}
        </Button>
      )}
    </div>
  )
}
