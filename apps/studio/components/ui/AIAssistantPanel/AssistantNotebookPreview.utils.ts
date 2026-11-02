import dayjs from 'dayjs'
import type { CodeBlockLang } from 'ui-patterns/CodeBlock'

import type {
  NotebookCellDiffEntry,
  OperationResultCell,
} from '@/data/content/notebooks/notebook-operations'
import type { ChartConfig, TimeRange } from '@/data/content/notebooks/notebook-schema'
import type { Database } from '@/data/read-replicas/replicas-query'

type DatabaseDetails = Pick<Database, 'identifier'>

export type NotebookDatabaseContext = { projectRef?: string } & (
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; databasesByIdentifier: ReadonlyMap<string, DatabaseDetails> }
)

export type NotebookDatabaseTarget =
  | { status: 'primary' }
  | { status: 'loading' }
  | { status: 'replica' }
  | { status: 'unknown' }
  | { status: 'error' }

export type NotebookCellFields =
  | { status: 'hidden' }
  | { status: 'loading' }
  | { status: 'ready'; source?: string; view?: string }

export type NotebookCellMetadata =
  | { status: 'hidden' }
  | { status: 'loading' }
  | { status: 'ready'; text: string }

/** React key for a diff entry. Added/replaced cells have no `_id`, so they key off the operation. */
export function getEntryKey(entry: NotebookCellDiffEntry): string {
  switch (entry._tag) {
    case 'unchanged':
    case 'removed':
    case 'moved':
      return entry.cell._id
    case 'added':
    case 'replaced':
      return `op-${entry.operationIndex}`
  }
}

/** Whether any cell needs the database list before its target can be classified. */
export function notebookEntriesNeedDatabaseLookup(
  entries: NotebookCellDiffEntry[],
  projectRef?: string
): boolean {
  return entries.some((entry) => {
    const cells = entry._tag === 'replaced' ? [entry.before, entry.after] : [entry.cell]
    return cells.some(
      (cell) =>
        cell._tag === 'database_cell' &&
        cell.database_identifier !== undefined &&
        cell.database_identifier !== projectRef
    )
  })
}

/** Human label for a collapsed/badge row. */
export function getCellLabel(cell: OperationResultCell): string {
  switch (cell._tag) {
    case 'markdown_cell':
      return 'Markdown cell'
    case 'database_cell':
    case 'log_cell':
      return `Query: ${cell.title ?? 'Untitled query'}`
  }
}

/** The cell's underlying source text, regardless of backend. */
export function getCellSourceText(cell: OperationResultCell): string {
  switch (cell._tag) {
    case 'markdown_cell':
      return cell.text
    case 'database_cell':
    case 'log_cell':
      return cell.sql
  }
}

/** Language for rendering the cell's source via `CodeBlock`. */
export function getCellCodeBlockLanguage(cell: OperationResultCell): CodeBlockLang {
  switch (cell._tag) {
    case 'markdown_cell':
      return 'markdown'
    case 'database_cell':
    case 'log_cell':
      return 'sql'
  }
}

/** Monaco language id for rendering the cell's source via `DiffEditor`. */
export function getCellMonacoLanguage(cell: OperationResultCell): string {
  switch (cell._tag) {
    case 'markdown_cell':
      return 'markdown'
    case 'database_cell':
    case 'log_cell':
      return 'pgsql'
  }
}

/** Formats a `TimeRange` as plain text, e.g. "Last 7 days" or an absolute bound pair. */
export function formatTimeRange(range: TimeRange): string {
  if (range._tag === 'relative_time_range') {
    return `Last ${range.amount} ${range.unit}${range.amount === 1 ? '' : 's'}`
  }

  const format = (value: string) => dayjs(value).format('MMM D, YYYY h:mm A')
  return `${format(range.start)} → ${format(range.end)}`
}

export function resolveNotebookDatabaseTarget(
  identifier: string | undefined,
  context: NotebookDatabaseContext
): NotebookDatabaseTarget {
  if (identifier === undefined || identifier === context.projectRef) return { status: 'primary' }
  if (context.status === 'loading') return { status: 'loading' }
  if (context.status === 'error') return { status: 'error' }

  const database = context.databasesByIdentifier.get(identifier)
  if (database === undefined) return { status: 'unknown' }
  if (database.identifier === context.projectRef) return { status: 'primary' }

  return { status: 'replica' }
}

function formatDatabaseTarget(target: Exclude<NotebookDatabaseTarget, { status: 'loading' }>) {
  switch (target.status) {
    case 'primary':
      return 'Database: Primary'
    case 'replica':
      return 'Database: Replica'
    case 'unknown':
      return 'Database: Unknown'
    case 'error':
      return 'Database unavailable'
  }
}

function formatChartConfig(chart: ChartConfig): string {
  const parts = [chart.type, `x: ${chart.x_column}`, `y: ${chart.y_series.join(', ')}`]
  if (chart.cumulative) parts.push('cumulative')
  if (chart.scale !== 'linear') parts.push(chart.scale)
  if (chart.show_labels) parts.push('labels')
  return parts.join(', ')
}

function formatCellView(
  cell: Extract<OperationResultCell, { _tag: 'database_cell' | 'log_cell' }>
): string {
  if ((cell.view ?? 'table') !== 'chart') return 'Table'
  return `Chart (${cell.chart !== undefined ? formatChartConfig(cell.chart) : 'unconfigured'})`
}

export function getCellMetadata(
  cell: OperationResultCell,
  databaseContext: NotebookDatabaseContext
): NotebookCellFields {
  switch (cell._tag) {
    case 'markdown_cell':
      return { status: 'hidden' }
    case 'database_cell': {
      const target = resolveNotebookDatabaseTarget(cell.database_identifier, databaseContext)
      if (target.status === 'loading') return { status: 'loading' }

      return { status: 'ready', source: formatDatabaseTarget(target), view: formatCellView(cell) }
    }
    case 'log_cell':
      return {
        status: 'ready',
        source: `Time range: ${formatTimeRange(cell.time_range)}`,
        view: formatCellView(cell),
      }
  }
}

/** Joins a cell's fields into display text, dropping the view when it's just the default table. */
function formatCellFieldsText(fields: { source?: string; view?: string }): string {
  return [fields.source, fields.view === 'Table' ? undefined : fields.view]
    .filter((part): part is string => part !== undefined)
    .join(' · ')
}

/** A field that's identical before and after carries no information about what changed, so it's dropped. */
function diffField(before: string | undefined, after: string | undefined): string | undefined {
  if (before === after) return undefined
  return `${before ?? 'Not configured'} → ${after ?? 'Not configured'}`
}

/** Header metadata for a diff row. On a replacement, only the fields that actually changed are shown. */
export function getEntryMetadata(
  entry: NotebookCellDiffEntry,
  databaseContext: NotebookDatabaseContext
): NotebookCellMetadata {
  if (entry._tag !== 'replaced') {
    const fields = getCellMetadata(entry.cell, databaseContext)
    if (fields.status !== 'ready') return fields

    const text = formatCellFieldsText(fields)
    return text === '' ? { status: 'hidden' } : { status: 'ready', text }
  }

  const before = getCellMetadata(entry.before, databaseContext)
  const after = getCellMetadata(entry.after, databaseContext)
  if (before.status === 'loading' || after.status === 'loading') return { status: 'loading' }

  const beforeSource = before.status === 'ready' ? before.source : undefined
  const afterSource = after.status === 'ready' ? after.source : undefined
  const beforeView = before.status === 'ready' ? before.view : undefined
  const afterView = after.status === 'ready' ? after.view : undefined

  const parts = [diffField(beforeSource, afterSource), diffField(beforeView, afterView)].filter(
    (part): part is string => part !== undefined
  )

  return parts.length > 0 ? { status: 'ready', text: parts.join(' · ') } : { status: 'hidden' }
}

export type NotebookDiffSummary =
  | { mode: 'create'; cellCount: number }
  | { mode: 'run'; cellCount: number }
  | { mode: 'update'; counts: { added: number; removed: number; replaced: number; moved: number } }

/** Summarizes a set of diff entries into counts suitable for a header line. */
export function summarizeNotebookDiff(
  entries: NotebookCellDiffEntry[],
  mode: 'create' | 'update' | 'run'
): NotebookDiffSummary {
  if (mode === 'create' || mode === 'run') {
    return { mode, cellCount: entries.length }
  }

  const counts = { added: 0, removed: 0, replaced: 0, moved: 0 }
  for (const entry of entries) {
    switch (entry._tag) {
      case 'added':
        counts.added++
        break
      case 'removed':
        counts.removed++
        break
      case 'replaced':
        counts.replaced++
        break
      case 'moved':
        counts.moved++
        break
      case 'unchanged':
        break
    }
  }

  return { mode: 'update', counts }
}

/** Formats a `NotebookDiffSummary` into the header string. */
export function formatNotebookDiffSummary(summary: NotebookDiffSummary): string {
  if (summary.mode === 'create' || summary.mode === 'run') {
    const { cellCount } = summary
    return `${cellCount} cell${cellCount === 1 ? '' : 's'}`
  }

  const { added, removed, replaced, moved } = summary.counts
  const parts: string[] = []
  if (added > 0) parts.push(`+${added}`)
  if (removed > 0) parts.push(`−${removed}`)
  if (replaced > 0) parts.push(`~${replaced}`)
  if (moved > 0) parts.push(`↕${moved}`)

  return parts.length > 0 ? parts.join(' ') : 'No changes'
}
