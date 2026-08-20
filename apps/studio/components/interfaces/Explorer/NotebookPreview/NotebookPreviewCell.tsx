import { ChevronRight } from 'lucide-react'
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
  getCellMetadataLine,
  getCellMonacoLanguage,
  getCellSourceText,
} from './NotebookPreview.utils'
import { DiffEditor } from '@/components/ui/DiffEditor'
import type { NotebookCellDiffEntry } from '@/data/content/notebooks/notebook-operations'
import type { AgentCell, CellWire } from '@/data/content/notebooks/notebook-schema'

export interface NotebookPreviewCellProps {
  entry: NotebookCellDiffEntry
  isExpanded: boolean
  onExpandedChange: (isExpanded: boolean) => void
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
export const NotebookPreviewCell = ({
  entry,
  isExpanded,
  onExpandedChange,
}: NotebookPreviewCellProps) => {
  const marker = CHANGE_MARKERS[entry._tag]
  const isRemoved = entry._tag === 'removed'
  const label = getCellLabel(getEntryCell(entry))

  return (
    <Collapsible open={isExpanded} onOpenChange={onExpandedChange}>
      <CollapsibleTrigger
        aria-label={`${marker.changeLabel} ${label}`}
        className="group flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-surface-200"
      >
        <ChangeGlyph marker={marker} />
        <ChevronRight
          size={12}
          className="shrink-0 text-foreground-lighter transition-transform group-data-[state=open]:rotate-90"
        />
        <span
          className={cn(
            'truncate text-sm text-foreground-light',
            isRemoved && 'text-foreground-lighter line-through'
          )}
        >
          {label}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col gap-1.5 px-3 pb-2.5">
          <CellBody entry={entry} />
        </div>
      </CollapsibleContent>
    </Collapsible>
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

const CellBody = ({ entry }: { entry: NotebookCellDiffEntry }) =>
  entry._tag === 'replaced' ? (
    <ReplacedCellBody before={entry.before} after={entry.after} />
  ) : (
    <>
      <CellSource cell={entry.cell} />
      <MetadataLine text={getCellMetadataLine(entry.cell)} />
    </>
  )

/**
 * A `replace_cell` can change only the source parameters (`database_identifier`,
 * `time_range`) and leave `sql`/`text` identical — the `DiffEditor` above would then show no
 * change at all, so the metadata is compared independently and rendered as its own
 * before → after line whenever it differs.
 */
const ReplacedCellBody = ({ before, after }: { before: CellWire; after: AgentCell }) => {
  const beforeMetadata = getCellMetadataLine(before)
  const afterMetadata = getCellMetadataLine(after)

  return (
    <>
      <DiffEditor
        original={getCellSourceText(before)}
        modified={getCellSourceText(after)}
        language={getCellMonacoLanguage(after)}
        height={240}
      />
      {beforeMetadata !== afterMetadata ? (
        <MetadataLine
          text={`${beforeMetadata ?? 'No metadata'} → ${afterMetadata ?? 'No metadata'}`}
        />
      ) : (
        <MetadataLine text={afterMetadata} />
      )}
    </>
  )
}

/**
 * The cell's source, always rendered as literal text via `CodeBlock` — agent-authored markdown
 * must never be interpreted into real DOM nodes.
 */
const CellSource = ({ cell }: { cell: CellWire | AgentCell }) => (
  <CodeBlock
    hideCopy
    language={getCellCodeBlockLanguage(cell)}
    value={getCellSourceText(cell)}
    hideLineNumbers
    wrapLongLines
    className="wrap-break-word rounded-none border-0 p-0 text-xs"
  />
)

/** A plain-text metadata line for a query cell — never rendered as a link or attribute. */
const MetadataLine = ({ text }: { text: string | null }) =>
  text ? <p className="text-xs text-foreground-lighter">{text}</p> : null
