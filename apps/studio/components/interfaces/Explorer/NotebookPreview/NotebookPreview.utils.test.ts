import { describe, expect, it } from 'vitest'

import {
  formatNotebookDiffSummary,
  formatTimeRange,
  getCellLabel,
  getEntryKey,
  summarizeNotebookDiff,
} from './NotebookPreview.utils'
import type { NotebookCellDiffEntry } from '@/data/content/notebooks/notebook-operations'
import type { AgentCell, CellWire } from '@/data/content/notebooks/notebook-schema'
import { isoDateTimeString } from '@/lib/iso-datetime'

const wireMarkdownCell = (id: string, text = 'hello'): CellWire => ({
  _tag: 'markdown_cell',
  id,
  text,
})

const agentMarkdownCell = (text = 'hello'): AgentCell => ({ _tag: 'markdown_cell', text })

const wireDatabaseCell = (id: string, title?: string): CellWire => ({
  _tag: 'database_cell',
  id,
  title,
  sql: 'select 1',
  row_limit: 100,
})

describe('getEntryKey', () => {
  it('keys unchanged, removed, and moved entries off the cell id', () => {
    expect(getEntryKey({ _tag: 'unchanged', cell: wireMarkdownCell('cell-1') })).toBe('cell-1')
    expect(
      getEntryKey({ _tag: 'removed', cell: wireMarkdownCell('cell-2'), operationIndex: 0 })
    ).toBe('cell-2')
    expect(
      getEntryKey({
        _tag: 'moved',
        cell: wireMarkdownCell('cell-3'),
        fromIndex: 1,
        operationIndex: 0,
      })
    ).toBe('cell-3')
  })

  it('keys added and replaced entries off the operation index', () => {
    expect(getEntryKey({ _tag: 'added', cell: agentMarkdownCell(), operationIndex: 2 })).toBe(
      'op-2'
    )
    expect(
      getEntryKey({
        _tag: 'replaced',
        before: wireMarkdownCell('cell-4'),
        after: agentMarkdownCell(),
        operationIndex: 3,
      })
    ).toBe('op-3')
  })
})

describe('getCellLabel', () => {
  it('labels markdown cells', () => {
    expect(getCellLabel(wireMarkdownCell('cell-1'))).toBe('Markdown cell')
  })

  it('labels query cells with their title', () => {
    expect(getCellLabel(wireDatabaseCell('cell-1', 'Signups'))).toBe('Query: Signups')
  })

  it('falls back to "Untitled query" when a query cell has no title', () => {
    expect(getCellLabel(wireDatabaseCell('cell-1'))).toBe('Query: Untitled query')
  })
})

describe('formatTimeRange', () => {
  it('formats a relative range, pluralizing the unit', () => {
    expect(formatTimeRange({ _tag: 'relative_time_range', unit: 'day', amount: 7 })).toBe(
      'Last 7 days'
    )
  })

  it('does not pluralize a relative range with amount 1', () => {
    expect(formatTimeRange({ _tag: 'relative_time_range', unit: 'hour', amount: 1 })).toBe(
      'Last 1 hour'
    )
  })

  it('formats an absolute range as a start → end pair', () => {
    const formatted = formatTimeRange({
      _tag: 'absolute_time_range',
      start: isoDateTimeString('2026-01-01T00:00:00.000Z')!,
      end: isoDateTimeString('2026-01-02T00:00:00.000Z')!,
    })
    expect(formatted).toContain('→')
    expect(formatted).toContain('2026')
  })
})

describe('summarizeNotebookDiff / formatNotebookDiffSummary', () => {
  it('formats create mode with pluralized cell count', () => {
    const entries: NotebookCellDiffEntry[] = [
      { _tag: 'unchanged', cell: wireMarkdownCell('a') },
      { _tag: 'unchanged', cell: wireMarkdownCell('b') },
    ]

    expect(formatNotebookDiffSummary(summarizeNotebookDiff(entries, 'create'))).toBe('2 cells')
  })

  it('formats create mode singular for a single cell', () => {
    const entries: NotebookCellDiffEntry[] = [{ _tag: 'unchanged', cell: wireMarkdownCell('a') }]

    expect(formatNotebookDiffSummary(summarizeNotebookDiff(entries, 'create'))).toBe('1 cell')
  })

  it('formats update mode with a mix of categories, ignoring unchanged', () => {
    const entries: NotebookCellDiffEntry[] = [
      { _tag: 'unchanged', cell: wireMarkdownCell('a') },
      { _tag: 'added', cell: agentMarkdownCell(), operationIndex: 0 },
      { _tag: 'added', cell: agentMarkdownCell(), operationIndex: 1 },
      { _tag: 'removed', cell: wireMarkdownCell('d'), operationIndex: 2 },
      {
        _tag: 'replaced',
        before: wireMarkdownCell('e'),
        after: agentMarkdownCell(),
        operationIndex: 3,
      },
      { _tag: 'moved', cell: wireMarkdownCell('f'), fromIndex: 0, operationIndex: 4 },
    ]

    expect(formatNotebookDiffSummary(summarizeNotebookDiff(entries, 'update'))).toBe('+2 −1 ~1 ↕1')
  })

  it('omits zero categories from the update summary', () => {
    const entries: NotebookCellDiffEntry[] = [
      { _tag: 'unchanged', cell: wireMarkdownCell('a') },
      { _tag: 'added', cell: agentMarkdownCell(), operationIndex: 0 },
    ]

    expect(formatNotebookDiffSummary(summarizeNotebookDiff(entries, 'update'))).toBe('+1')
  })

  it('falls back to "No changes" when every entry is unchanged', () => {
    const entries: NotebookCellDiffEntry[] = [
      { _tag: 'unchanged', cell: wireMarkdownCell('a') },
      { _tag: 'unchanged', cell: wireMarkdownCell('b') },
    ]

    expect(formatNotebookDiffSummary(summarizeNotebookDiff(entries, 'update'))).toBe('No changes')
  })
})
