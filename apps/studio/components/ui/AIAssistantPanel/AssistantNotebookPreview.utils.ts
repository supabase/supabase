import dayjs from 'dayjs'
import type { CodeBlockLang } from 'ui-patterns/CodeBlock'

import type { NotebookCellDiffEntry } from '@/data/content/notebooks/notebook-operations'
import type { AgentCell, CellWire, TimeRange } from '@/data/content/notebooks/notebook-schema'

/** React key for a diff entry. Added/replaced cells have no `id`, so they key off the operation. */
export function getEntryKey(entry: NotebookCellDiffEntry): string {
  switch (entry._tag) {
    case 'unchanged':
    case 'removed':
    case 'moved':
      return entry.cell.id
    case 'added':
    case 'replaced':
      return `op-${entry.operationIndex}`
  }
}

/**
 * Whether a diff entry starts expanded. Only the entries the user has to actually read to
 * decide — the ones whose content the assistant is proposing — open on their own; unchanged,
 * moved, and removed cells stay as single rows until asked for.
 */
export function isEntryExpandedByDefault(entry: NotebookCellDiffEntry): boolean {
  return entry._tag === 'added' || entry._tag === 'replaced'
}

/** Human label for a collapsed/badge row. */
export function getCellLabel(cell: CellWire | AgentCell): string {
  switch (cell._tag) {
    case 'markdown_cell':
      return 'Markdown cell'
    case 'database_cell':
    case 'log_cell':
      return `Query: ${cell.title ?? 'Untitled query'}`
  }
}

/** The cell's underlying source text, regardless of backend. */
export function getCellSourceText(cell: CellWire | AgentCell): string {
  switch (cell._tag) {
    case 'markdown_cell':
      return cell.text
    case 'database_cell':
    case 'log_cell':
      return cell.sql
  }
}

/** Language for rendering the cell's source via `CodeBlock`. */
export function getCellCodeBlockLanguage(cell: CellWire | AgentCell): CodeBlockLang {
  switch (cell._tag) {
    case 'markdown_cell':
      return 'markdown'
    case 'database_cell':
    case 'log_cell':
      return 'sql'
  }
}

/** Monaco language id for rendering the cell's source via `DiffEditor`. */
export function getCellMonacoLanguage(cell: CellWire | AgentCell): string {
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

/**
 * Plain-text metadata line for a query cell (its source parameters, not its SQL) — `null`
 * when the cell has none. A `replace_cell` can change only this and leave `sql` identical,
 * so it's compared independently of the source text rather than folded into it.
 */
export function getCellMetadataLine(cell: CellWire | AgentCell): string | null {
  switch (cell._tag) {
    case 'markdown_cell':
      return null
    case 'database_cell':
      return cell.database_identifier ? `Database: ${cell.database_identifier}` : null
    case 'log_cell':
      return `Time range: ${formatTimeRange(cell.time_range)}`
  }
}

/** Header metadata for a diff row, including a before → after pair on replacements. */
export function getEntryMetadataLine(entry: NotebookCellDiffEntry): string | null {
  if (entry._tag !== 'replaced') {
    return getCellMetadataLine(entry.cell)
  }

  const beforeMetadata = getCellMetadataLine(entry.before)
  const afterMetadata = getCellMetadataLine(entry.after)
  if (beforeMetadata === afterMetadata) return afterMetadata
  return `${beforeMetadata ?? 'No metadata'} → ${afterMetadata ?? 'No metadata'}`
}

export type NotebookDiffSummary =
  | { mode: 'create'; cellCount: number }
  | { mode: 'update'; counts: { added: number; removed: number; replaced: number; moved: number } }

/** Summarizes a set of diff entries into counts suitable for a header line. */
export function summarizeNotebookDiff(
  entries: NotebookCellDiffEntry[],
  mode: 'create' | 'update'
): NotebookDiffSummary {
  if (mode === 'create') {
    return { mode: 'create', cellCount: entries.length }
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
  if (summary.mode === 'create') {
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
