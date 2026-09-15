import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'

import {
  formatNotebookDiffSummary,
  formatTimeRange,
  getCellLabel,
  getCellMetadata,
  getEntryKey,
  getEntryMetadata,
  notebookEntriesNeedDatabaseLookup,
  resolveNotebookDatabaseTarget,
  summarizeNotebookDiff,
  type NotebookDatabaseContext,
} from './AssistantNotebookPreview.utils'
import type { NotebookCellDiffEntry } from '@/data/content/notebooks/notebook-operations'
import type { AgentCell, CellWire } from '@/data/content/notebooks/notebook-schema'
import { isoDateTimeString } from '@/lib/iso-datetime'

const wireMarkdownCell = (id: string, text = 'hello'): CellWire => ({
  _tag: 'markdown_cell',
  _id: id,
  text,
})

const agentMarkdownCell = (text = 'hello'): AgentCell => ({ _tag: 'markdown_cell', text })

const wireDatabaseCell = (id: string, title?: string, database_identifier?: string): CellWire => ({
  _tag: 'database_cell',
  _id: id,
  title,
  sql: 'select 1',
  row_limit: 100,
  database_identifier,
})

const wireLogCell = (id: string): CellWire => ({
  _tag: 'log_cell',
  _id: id,
  sql: 'select 1',
  time_range: { _tag: 'relative_time_range', unit: 'day', amount: 7 },
})

const agentDatabaseCell = (database_identifier?: string): AgentCell => ({
  _tag: 'database_cell',
  sql: 'select 1',
  row_limit: 100,
  database_identifier,
})

const chartDatabaseCell = (id: string, ySeries: string[]): CellWire => ({
  _tag: 'database_cell',
  _id: id,
  sql: 'select 1',
  row_limit: 100,
  view: 'chart',
  chart: {
    type: 'bar',
    x_column: 'day',
    y_series: ySeries,
    cumulative: false,
    scale: 'linear',
    show_labels: false,
  },
})

const agentChartDatabaseCell = (ySeries: string[], database_identifier?: string): AgentCell => ({
  _tag: 'database_cell',
  sql: 'select 1',
  row_limit: 100,
  database_identifier,
  view: 'chart',
  chart: {
    type: 'bar',
    x_column: 'day',
    y_series: ySeries,
    cumulative: false,
    scale: 'linear',
    show_labels: false,
  },
})

const successfulDatabaseContext = (
  databases: Array<{ identifier: string; region: string }> = []
): NotebookDatabaseContext => ({
  status: 'success',
  projectRef: 'project-1',
  databasesByIdentifier: new Map(databases.map((database) => [database.identifier, database])),
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
    const start = isoDateTimeString('2026-01-01T13:00:00.000Z')!
    const end = isoDateTimeString('2026-01-02T09:30:00.000Z')!

    const formatted = formatTimeRange({ _tag: 'absolute_time_range', start, end })

    // Bounds are asserted via dayjs rather than a hardcoded string so this doesn't depend on
    // the test runner's local timezone (formatTimeRange formats in local time).
    const expectedBound = (value: string) => dayjs(value).format('MMM D, YYYY h:mm A')
    expect(formatted).toBe(`${expectedBound(start)} → ${expectedBound(end)}`)
  })
})

describe('resolveNotebookDatabaseTarget', () => {
  it('resolves an omitted identifier as primary without waiting for databases', () => {
    expect(
      resolveNotebookDatabaseTarget(undefined, { status: 'loading', projectRef: 'project-1' })
    ).toEqual({ status: 'primary' })
  })

  it('resolves the project ref as primary without waiting for databases', () => {
    expect(
      resolveNotebookDatabaseTarget('project-1', {
        status: 'loading',
        projectRef: 'project-1',
      })
    ).toEqual({ status: 'primary' })
  })

  it('still resolves the loaded database matching the project ref as primary', () => {
    expect(
      resolveNotebookDatabaseTarget(
        'project-1',
        successfulDatabaseContext([{ identifier: 'project-1', region: 'us-east-1' }])
      )
    ).toEqual({ status: 'primary' })
  })

  it('keeps another identifier loading until databases resolve', () => {
    expect(
      resolveNotebookDatabaseTarget('replica-3', {
        status: 'loading',
        projectRef: 'project-1',
      })
    ).toEqual({ status: 'loading' })
  })

  it('resolves a matching loaded database as a replica', () => {
    expect(
      resolveNotebookDatabaseTarget(
        'replica-3',
        successfulDatabaseContext([{ identifier: 'replica-3', region: 'us-east-1' }])
      )
    ).toEqual({ status: 'replica' })
  })

  it('does not call an identifier absent from the loaded database list a replica', () => {
    expect(resolveNotebookDatabaseTarget('replica-3', successfulDatabaseContext())).toEqual({
      status: 'unknown',
    })
  })

  it('preserves database lookup errors', () => {
    expect(
      resolveNotebookDatabaseTarget('replica-3', {
        status: 'error',
        projectRef: 'project-1',
      })
    ).toEqual({ status: 'error' })
  })
})

describe('notebookEntriesNeedDatabaseLookup', () => {
  it('skips lookup for implicit and explicit primary cells', () => {
    const entries: NotebookCellDiffEntry[] = [
      { _tag: 'unchanged', cell: wireDatabaseCell('cell-1') },
      { _tag: 'unchanged', cell: wireDatabaseCell('cell-2', undefined, 'project-1') },
    ]

    expect(notebookEntriesNeedDatabaseLookup(entries, 'project-1')).toBe(false)
  })

  it('requires lookup when either side of a replacement has another identifier', () => {
    const entries: NotebookCellDiffEntry[] = [
      {
        _tag: 'replaced',
        before: wireDatabaseCell('cell-1'),
        after: agentDatabaseCell('replica-3'),
        operationIndex: 0,
      },
    ]

    expect(notebookEntriesNeedDatabaseLookup(entries, 'project-1')).toBe(true)
  })
})

describe('getCellMetadata', () => {
  it('hides metadata for markdown cells', () => {
    expect(getCellMetadata(wireMarkdownCell('cell-1'), successfulDatabaseContext())).toEqual({
      status: 'hidden',
    })
  })

  it('labels an implicit primary database and table view', () => {
    expect(getCellMetadata(wireDatabaseCell('cell-1'), successfulDatabaseContext())).toEqual({
      status: 'ready',
      source: 'Database: Primary',
      view: 'Table',
    })
  })

  it('labels a resolved replica descriptively', () => {
    expect(
      getCellMetadata(
        wireDatabaseCell('cell-1', 'Signups', 'replica-3'),
        successfulDatabaseContext([{ identifier: 'replica-3', region: 'us-east-1' }])
      )
    ).toEqual({
      status: 'ready',
      source: 'Database: Replica',
      view: 'Table',
    })
  })

  it('returns a loading state rather than guessing another identifier is a replica', () => {
    expect(
      getCellMetadata(wireDatabaseCell('cell-1', 'Signups', 'replica-3'), {
        status: 'loading',
        projectRef: 'project-1',
      })
    ).toEqual({ status: 'loading' })
  })

  it('labels a missing loaded identifier as unknown', () => {
    expect(
      getCellMetadata(
        wireDatabaseCell('cell-1', 'Signups', 'missing-database'),
        successfulDatabaseContext()
      )
    ).toEqual({ status: 'ready', source: 'Database: Unknown', view: 'Table' })
  })

  it('labels a log cell with its formatted time range', () => {
    expect(getCellMetadata(wireLogCell('cell-1'), successfulDatabaseContext())).toEqual({
      status: 'ready',
      source: 'Time range: Last 7 days',
      view: 'Table',
    })
  })

  it('reports the chart summary as the view field for a chart-view database cell', () => {
    expect(
      getCellMetadata(chartDatabaseCell('cell-1', ['signups']), successfulDatabaseContext())
    ).toEqual({
      status: 'ready',
      source: 'Database: Primary',
      view: 'Chart (bar, x: day, y: signups)',
    })
  })
})

describe('getEntryMetadata', () => {
  it('uses the cell metadata for non-replaced entries', () => {
    expect(
      getEntryMetadata(
        {
          _tag: 'unchanged',
          cell: wireDatabaseCell('cell-1', 'Signups', 'replica-3'),
        },
        successfulDatabaseContext([{ identifier: 'replica-3', region: 'us-east-1' }])
      )
    ).toEqual({
      status: 'ready',
      text: 'Database: Replica',
    })
  })

  it('returns a before → after pair when a replacement changes only metadata', () => {
    expect(
      getEntryMetadata(
        {
          _tag: 'replaced',
          before: wireDatabaseCell('cell-1', 'Signups'),
          after: agentDatabaseCell('replica-3'),
          operationIndex: 0,
        },
        successfulDatabaseContext([{ identifier: 'replica-3', region: 'us-east-1' }])
      )
    ).toEqual({
      status: 'ready',
      text: 'Database: Primary → Database: Replica',
    })
  })

  it('returns a loading state when either side still needs database data', () => {
    expect(
      getEntryMetadata(
        {
          _tag: 'replaced',
          before: wireDatabaseCell('cell-1', 'Signups'),
          after: agentDatabaseCell('replica-3'),
          operationIndex: 0,
        },
        { status: 'loading', projectRef: 'project-1' }
      )
    ).toEqual({ status: 'loading' })
  })

  it('hides metadata entirely when a replacement changes neither the database nor the view', () => {
    expect(
      getEntryMetadata(
        {
          _tag: 'replaced',
          before: wireDatabaseCell('cell-1', 'Signups'),
          after: agentDatabaseCell(),
          operationIndex: 0,
        },
        successfulDatabaseContext()
      )
    ).toEqual({ status: 'hidden' })
  })

  it('surfaces only the view change from table to chart, omitting the unchanged database', () => {
    expect(
      getEntryMetadata(
        {
          _tag: 'replaced',
          before: wireDatabaseCell('cell-1'),
          after: agentChartDatabaseCell(['signups']),
          operationIndex: 0,
        },
        successfulDatabaseContext()
      )
    ).toEqual({
      status: 'ready',
      text: 'Table → Chart (bar, x: day, y: signups)',
    })
  })

  it('surfaces only a chart parameter change, omitting the unchanged database', () => {
    expect(
      getEntryMetadata(
        {
          _tag: 'replaced',
          before: chartDatabaseCell('cell-1', ['signups']),
          after: agentChartDatabaseCell(['active_users']),
          operationIndex: 0,
        },
        successfulDatabaseContext()
      )
    ).toEqual({
      status: 'ready',
      text: 'Chart (bar, x: day, y: signups) → Chart (bar, x: day, y: active_users)',
    })
  })

  it('surfaces only a database change, omitting the unchanged view', () => {
    expect(
      getEntryMetadata(
        {
          _tag: 'replaced',
          before: chartDatabaseCell('cell-1', ['signups']),
          after: agentChartDatabaseCell(['signups'], 'replica-3'),
          operationIndex: 0,
        },
        successfulDatabaseContext([{ identifier: 'replica-3', region: 'us-east-1' }])
      )
    ).toEqual({
      status: 'ready',
      text: 'Database: Primary → Database: Replica',
    })
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
