import { ChevronRight, FileText, Loader2, SquareCode } from 'lucide-react'
import {
  cn,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { CodeBlock } from 'ui-patterns/CodeBlock'

import {
  getCellCodeBlockLanguage,
  getCellLabel,
  getCellMonacoLanguage,
  getCellSourceText,
  getEntryMetadata,
  type NotebookDatabaseContext,
} from './AssistantNotebookPreview.utils'
import {
  ExplorerQueryFooter,
  ExplorerQueryResults,
} from '@/components/interfaces/Explorer/ExplorerQuery'
import { QueryResultRenderer } from '@/components/interfaces/Explorer/QueryEditor/QueryResultRenderer'
import type { QueryResult } from '@/components/interfaces/Explorer/types'
import { DiffEditor } from '@/components/ui/DiffEditor'
import type { NotebookCellDiffEntry } from '@/data/content/notebooks/notebook-operations'
import type { AgentCell, CellWire } from '@/data/content/notebooks/notebook-schema'

export interface AssistantNotebookPreviewCellProps {
  entry: NotebookCellDiffEntry
  isExpanded: boolean
  onExpandedChange: (isExpanded: boolean) => void
  /** Create and run previews omit per-row change glyphs. */
  mode: 'create' | 'update' | 'run'
  result?: QueryResult
  databaseContext: NotebookDatabaseContext
}

/**
 * A single-character gutter marker per change type The glyph is decorative —
 * `changeLabel` carries the same information into the row's accessible name and its tooltip.
 */
const CHANGE_MARKERS = {
  added: { glyph: '+', changeLabel: 'Added', className: 'text-brand-600' },
  removed: { glyph: '−', changeLabel: 'Removed', className: 'text-destructive' },
  replaced: { glyph: '~', changeLabel: 'Replaced', className: 'text-warning-600' },
  moved: { glyph: '↕', changeLabel: 'Moved', className: 'text-foreground-lighter' },
  unchanged: { glyph: '', changeLabel: 'Unchanged', className: '' },
} as const

type ChangeMarker = (typeof CHANGE_MARKERS)[keyof typeof CHANGE_MARKERS]

/** The cell a row is labelled by — for a replacement, the proposed cell rather than the current one. */
function getEntryCell(entry: NotebookCellDiffEntry): CellWire | AgentCell {
  return entry._tag === 'replaced' ? entry.after : entry.cell
}

/** One row of the diff card: a header line that collapses to a single row, plus its content. */
export const AssistantNotebookPreviewCell = ({
  entry,
  isExpanded,
  onExpandedChange,
  mode,
  result,
  databaseContext,
}: AssistantNotebookPreviewCellProps) => {
  const marker = CHANGE_MARKERS[entry._tag]
  const isRemoved = entry._tag === 'removed'
  const cell = getEntryCell(entry)
  const label = getCellLabel(cell)
  const metadata = getEntryMetadata(entry, databaseContext)

  return (
    <Collapsible open={isExpanded} onOpenChange={onExpandedChange}>
      <CollapsibleTrigger
        aria-label={`${marker.changeLabel} ${label}`}
        className="group flex w-full items-center gap-2 bg-muted px-3 py-2 text-left transition-colors hover:bg-accent"
      >
        {mode === 'update' && <ChangeGlyph marker={marker} />}
        <ChevronRight
          size={12}
          className="shrink-0 text-foreground-lighter transition-transform group-data-[state=open]:rotate-90"
        />
        <CellTypeIcon cell={cell} />
        <span
          className={cn(
            'min-w-0 flex-1 truncate text-sm text-foreground',
            isRemoved && 'text-foreground-lighter line-through'
          )}
        >
          {label}
        </span>
        {metadata.status !== 'hidden' ? (
          <span className="min-w-0 max-w-[45%] shrink truncate text-sm text-muted-foreground">
            {metadata.status === 'loading' ? (
              <span className="flex items-center gap-1.5">
                <span className="animate-spin">
                  <Loader2 aria-hidden size={12} />
                </span>
                Loading database…
              </span>
            ) : (
              metadata.text
            )}
          </span>
        ) : null}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t">
          <CellBody entry={entry} />
        </div>
      </CollapsibleContent>
      {result !== undefined && cell._tag !== 'markdown_cell' && (
        <QueryCellResult cell={cell} result={result} />
      )}
    </Collapsible>
  )
}

const QueryCellResult = ({
  cell,
  result,
}: {
  cell: Extract<CellWire | AgentCell, { _tag: 'database_cell' | 'log_cell' }>
  result: QueryResult
}) => {
  const rowCount = result.rows?.length ?? 0
  const rowLimit = cell._tag === 'database_cell' ? cell.row_limit : undefined

  return (
    <>
      <ExplorerQueryResults
        className={cn(
          'border-t',
          rowCount === 0 ? 'min-h-20 items-center justify-center' : 'h-56 overflow-x-auto'
        )}
      >
        <QueryResultRenderer view={cell.view ?? 'table'} result={result} chart={cell.chart} />
      </ExplorerQueryResults>
      <ExplorerQueryFooter className="flex items-center gap-x-2">
        <p>
          {rowCount.toLocaleString()} {rowCount === 1 ? 'row' : 'rows'}
        </p>
        {rowLimit !== undefined && (
          <>
            <p>·</p>
            <p>{rowLimit < 0 ? 'No row limit' : `Limit ${rowLimit} rows`}</p>
          </>
        )}
      </ExplorerQueryFooter>
    </>
  )
}

/**
 * The gutter glyph, with a tooltip naming the change type it stands for. The glyph stays
 * `aria-hidden` — the row's `aria-label` already carries the same word — so the tooltip is a
 * pointer affordance rather than a second announcement.
 */
const ChangeGlyph = ({ marker }: { marker: ChangeMarker }) => {
  const className = cn('w-3 shrink-0 text-center font-mono text-xs leading-none', marker.className)

  // An unchanged cell has no glyph, so there is nothing to explain — render the spacer alone.
  if (!marker.glyph) return <span aria-hidden className={className} />

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span aria-hidden className={className}>
          {marker.glyph}
        </span>
      </TooltipTrigger>
      <TooltipContent side="left">{marker.changeLabel}</TooltipContent>
    </Tooltip>
  )
}

/** Same icons the notebook tab uses for query vs markdown cells. */
const CellTypeIcon = ({ cell }: { cell: CellWire | AgentCell }) => {
  const Icon = cell._tag === 'markdown_cell' ? FileText : SquareCode
  return <Icon aria-hidden size={14} className="shrink-0 text-foreground-muted" />
}

const CellBody = ({ entry }: { entry: NotebookCellDiffEntry }) =>
  entry._tag === 'replaced' ? (
    <ReplacedCellBody before={entry.before} after={entry.after} />
  ) : (
    <CellSource cell={entry.cell} />
  )

const ReplacedCellBody = ({ before, after }: { before: CellWire; after: AgentCell }) => (
  <DiffEditor
    original={getCellSourceText(before)}
    modified={getCellSourceText(after)}
    language={getCellMonacoLanguage(after)}
    height={240}
  />
)

/**
 * The cell's source, always rendered as literal text via `CodeBlock` — agent-authored markdown
 * must never be interpreted into real DOM nodes.
 */
const CellSource = ({ cell }: { cell: CellWire | AgentCell }) => (
  <CodeBlock
    hideCopy
    hideLineNumbers
    language={getCellCodeBlockLanguage(cell)}
    value={getCellSourceText(cell)}
    wrapLongLines
    className="wrap-break-word rounded-none border-0 px-3! py-2! text-xs"
    wrapperClassName="max-w-none"
  />
)
