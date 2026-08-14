import { useState, type ReactNode } from 'react'
import { Badge, Button, cn } from 'ui'
import { CodeBlock, type CodeBlockLang } from 'ui-patterns/CodeBlock'

import {
  formatTimeRange,
  getCellCodeBlockLanguage,
  getCellLabel,
  getCellMonacoLanguage,
  getCellSourceText,
} from './NotebookPreview.utils'
import { DiffEditor } from '@/components/ui/DiffEditor'
import type { NotebookCellDiffEntry } from '@/data/content/notebooks/notebook-operations'
import type { AgentCell, CellWire } from '@/data/content/notebooks/notebook-schema'

export interface NotebookPreviewCellProps {
  entry: NotebookCellDiffEntry
}

/** Renders a single diff entry, dispatching on its tag. */
export const NotebookPreviewCell = ({ entry }: NotebookPreviewCellProps) => {
  switch (entry._tag) {
    case 'unchanged':
      return <CollapsedRow label={getCellLabel(entry.cell)} />
    case 'removed':
      return (
        <CollapsedRow
          label={getCellLabel(entry.cell)}
          strikethrough
          badge={{ variant: 'destructive', label: 'Removed' }}
        />
      )
    case 'moved':
      return (
        <CollapsedRow
          label={getCellLabel(entry.cell)}
          badge={{ variant: 'secondary', label: 'Moved' }}
        />
      )
    case 'added':
      return <AddedCell cell={entry.cell} />
    case 'replaced':
      return <ReplacedCell before={entry.before} after={entry.after} />
  }
}

interface CollapsedRowProps {
  label: string
  strikethrough?: boolean
  badge?: { variant: 'destructive' | 'secondary'; label: string }
}

/** A single muted row with no content — used for unchanged, removed, and moved entries. */
const CollapsedRow = ({ label, strikethrough, badge }: CollapsedRowProps) => (
  <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-foreground-light">
    {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
    <span className={cn('truncate', strikethrough && 'line-through text-foreground-lighter')}>
      {label}
    </span>
  </div>
)

interface ContentCellProps {
  badge: { variant: 'success' | 'warning'; label: string }
  label: string
  children: ReactNode
}

/** Shared frame for entries that show full cell content — added and replaced cells. */
const ContentCell = ({ badge, label, children }: ContentCellProps) => (
  <div className="flex flex-col gap-2 px-3 py-2 border rounded-md bg-surface-75">
    <div className="flex items-center gap-2 text-sm">
      <Badge variant={badge.variant}>{badge.label}</Badge>
      <span className="text-foreground truncate">{label}</span>
    </div>
    {children}
  </div>
)

const AddedCell = ({ cell }: { cell: AgentCell }) => (
  <ContentCell badge={{ variant: 'success', label: 'Added' }} label={getCellLabel(cell)}>
    <ExpandableCodeBlock
      language={getCellCodeBlockLanguage(cell)}
      value={getCellSourceText(cell)}
    />
    <CellMetadata cell={cell} />
  </ContentCell>
)

const ReplacedCell = ({ before, after }: { before: CellWire; after: AgentCell }) => (
  <ContentCell badge={{ variant: 'warning', label: 'Replaced' }} label={getCellLabel(after)}>
    <DiffEditor
      original={getCellSourceText(before)}
      modified={getCellSourceText(after)}
      language={getCellMonacoLanguage(after)}
      height={240}
    />
  </ContentCell>
)

/** Plain-text metadata lines for query cells — never rendered as a link or attribute. */
const CellMetadata = ({ cell }: { cell: AgentCell }) => {
  if (cell._tag === 'database_cell' && cell.database_identifier) {
    return <p className="text-xs text-foreground-lighter">Database: {cell.database_identifier}</p>
  }
  if (cell._tag === 'log_cell') {
    return (
      <p className="text-xs text-foreground-lighter">
        Time range: {formatTimeRange(cell.time_range)}
      </p>
    )
  }
  return null
}

interface ExpandableCodeBlockProps {
  language: CodeBlockLang
  value: string
}

/**
 * `CodeBlock` clipped to a fixed height with a "Show more/less" toggle. `CodeBlock`'s
 * wrapper already scrolls (`overflow-auto`), so clipping just changes what's visible.
 */
const ExpandableCodeBlock = ({ language, value }: ExpandableCodeBlockProps) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div>
      <CodeBlock
        language={language}
        value={value}
        hideLineNumbers
        className="text-xs"
        wrapperClassName={cn(!isExpanded && 'max-h-56')}
      />
      <Button
        variant="text"
        size="tiny"
        className="mt-1"
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        {isExpanded ? 'Show less' : 'Show more'}
      </Button>
    </div>
  )
}
