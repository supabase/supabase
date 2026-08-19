import { safeSql, untrustedSql } from '@supabase/pg-meta'
import { describe, expect, it } from 'vitest'

import {
  agentNotebookSchema,
  isDraftId,
  isQueryCell,
  notebookDomainSchema,
  notebookSchema,
  timeRangeSchema,
  toWireWritableNotebook,
  writableNotebookSchema,
} from './notebook-schema'
import { safeSql as safeLogSql, untrustedLogSql } from '@/data/logs/safe-analytics-sql'

const FULL_NOTEBOOK = {
  schema_version: 1 as const,
  cells: [
    {
      _tag: 'markdown_cell' as const,
      _id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      text: '# Signup funnel',
    },
    {
      _tag: 'database_cell' as const,
      _id: 'b1ffcd88-8d1a-4de7-aa5c-5aa8ac270b22',
      sql: 'select * from auth.users limit 100',
      row_limit: 100,
    },
    {
      _tag: 'log_cell' as const,
      _id: 'c2001199-1e2b-4ef8-bb6d-6bb9bd380a33',
      sql: "select timestamp, event_message from edge_logs where source = 'edge_logs' limit 10",
      time_range: {
        _tag: 'relative_time_range' as const,
        unit: 'hour' as const,
        amount: 1,
      },
    },
  ],
}

describe('notebookSchema', () => {
  it('accepts a full three-cell notebook', () => {
    expect(notebookSchema.safeParse(FULL_NOTEBOOK).success).toBe(true)
  })

  it('rejects an unknown cell _tag', () => {
    const result = notebookSchema.safeParse({
      schema_version: 1,
      cells: [{ _tag: 'chart_cell', _id: '1', text: 'hi' }],
    })

    expect(result.success).toBe(false)
  })

  it('rejects a database_cell missing row_limit', () => {
    const result = notebookSchema.safeParse({
      schema_version: 1,
      cells: [{ _tag: 'database_cell', _id: '1', sql: 'select 1' }],
    })

    expect(result.success).toBe(false)
  })

  it('rejects a non-ISO absolute_time_range bound', () => {
    const result = notebookSchema.safeParse({
      schema_version: 1,
      cells: [
        {
          _tag: 'log_cell',
          _id: '1',
          sql: 'select 1',
          time_range: {
            _tag: 'absolute_time_range',
            start: 'not-a-real-date',
            end: '2024-01-02T00:00:00.000Z',
          },
        },
      ],
    })

    expect(result.success).toBe(false)
  })

  it('accepts an absolute_time_range with ISO8601 bounds', () => {
    const result = notebookSchema.safeParse({
      schema_version: 1,
      cells: [
        {
          _tag: 'log_cell',
          _id: '1',
          sql: 'select 1',
          time_range: {
            _tag: 'absolute_time_range',
            start: '2024-01-01T00:00:00.000Z',
            end: '2024-01-02T00:00:00.000Z',
          },
        },
      ],
    })

    expect(result.success).toBe(true)
  })

  it('rejects an invalid relative_time_range unit', () => {
    const result = notebookSchema.safeParse({
      schema_version: 1,
      cells: [
        {
          _tag: 'log_cell',
          _id: '1',
          sql: 'select 1',
          time_range: { _tag: 'relative_time_range', unit: 'fortnight', amount: 1 },
        },
      ],
    })

    expect(result.success).toBe(false)
  })

  it('accepts an optional database_identifier on a database_cell', () => {
    const result = notebookSchema.safeParse({
      schema_version: 1,
      cells: [
        {
          _tag: 'database_cell',
          _id: '1',
          sql: 'select 1',
          row_limit: 100,
          database_identifier: 'replica-1',
        },
      ],
    })

    expect(result.success).toBe(true)
  })

  it('rejects a cell with no _id — the backend always assigns one on save', () => {
    const result = notebookSchema.safeParse({
      schema_version: 1,
      cells: [{ _tag: 'markdown_cell', text: 'hi' }],
    })

    expect(result.success).toBe(false)
  })

  it('keeps a chart configured while the table view is selected', () => {
    const result = notebookSchema.safeParse({
      schema_version: 1,
      cells: [
        {
          _tag: 'database_cell',
          _id: '1',
          sql: 'select 1',
          row_limit: 100,
          view: 'table',
          chart: {
            type: 'bar',
            x_column: 'day',
            y_series: ['signups'],
            cumulative: false,
            show_labels: true,
          },
        },
      ],
    })

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.cells[0]).toMatchObject({ view: 'table', chart: { x_column: 'day' } })
  })
})

describe('timeRangeSchema', () => {
  const logCell = (time_range: unknown) => ({
    schema_version: 1,
    cells: [{ _tag: 'log_cell', _id: '1', sql: 'select 1', time_range }],
  })

  it('rejects a relative_time_range with a non-positive or fractional amount', () => {
    expect(
      timeRangeSchema.safeParse({ _tag: 'relative_time_range', unit: 'hour', amount: 0 }).success
    ).toBe(false)
    expect(
      timeRangeSchema.safeParse({ _tag: 'relative_time_range', unit: 'hour', amount: -1 }).success
    ).toBe(false)
    expect(
      timeRangeSchema.safeParse({ _tag: 'relative_time_range', unit: 'hour', amount: 1.5 }).success
    ).toBe(false)
  })

  it('accepts every relative unit the wire schema allows', () => {
    for (const unit of ['minute', 'hour', 'day', 'week', 'month', 'year']) {
      expect(
        timeRangeSchema.safeParse({ _tag: 'relative_time_range', unit, amount: 2 }).success
      ).toBe(true)
    }
  })

  it('rejects an absolute_time_range that does not move forward in time', () => {
    const equal = timeRangeSchema.safeParse({
      _tag: 'absolute_time_range',
      start: '2025-01-01T00:00:00.000Z',
      end: '2025-01-01T00:00:00.000Z',
    })
    expect(equal.success).toBe(false)
    expect(equal.error?.issues[0].path).toEqual(['end'])

    expect(
      timeRangeSchema.safeParse({
        _tag: 'absolute_time_range',
        start: '2025-01-02T00:00:00.000Z',
        end: '2025-01-01T00:00:00.000Z',
      }).success
    ).toBe(false)

    expect(
      notebookSchema.safeParse(
        logCell({
          _tag: 'absolute_time_range',
          start: '2025-01-02T00:00:00.000Z',
          end: '2025-01-01T00:00:00.000Z',
        })
      ).success
    ).toBe(false)
  })

  it('reports an invalid bound against its own field rather than the ordering rule', () => {
    const result = timeRangeSchema.safeParse({
      _tag: 'absolute_time_range',
      start: 'not-a-date',
      end: '2025-01-01T00:00:00.000Z',
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(1)
    expect(result.error?.issues[0].path).toEqual(['start'])
  })
})

describe('agentNotebookSchema', () => {
  it('accepts cells without ids', () => {
    const result = agentNotebookSchema.safeParse({
      schema_version: 1,
      cells: [
        { _tag: 'markdown_cell', text: 'hello' },
        { _tag: 'database_cell', sql: 'select 1', row_limit: 100 },
      ],
    })

    expect(result.success).toBe(true)
  })

  it('rejects cells that carry an agent-supplied id', () => {
    const result = agentNotebookSchema.safeParse({
      schema_version: 1,
      cells: [{ _tag: 'markdown_cell', id: 'should-not-be-here', text: 'hello' }],
    })

    expect(result.success).toBe(false)
  })
})

describe('writableNotebookSchema', () => {
  it('accepts a notebook where every cell lacks an id (create-shaped)', () => {
    const result = writableNotebookSchema.safeParse({
      schema_version: 1,
      cells: [
        { _tag: 'markdown_cell', text: '# Signup funnel' },
        { _tag: 'database_cell', sql: 'select * from auth.users limit 100', row_limit: 100 },
        {
          _tag: 'log_cell',
          sql: "select timestamp, event_message from edge_logs where source = 'edge_logs' limit 10",
          time_range: { _tag: 'relative_time_range', unit: 'hour', amount: 1 },
        },
      ],
    })

    expect(result.success).toBe(true)
  })

  it('accepts a notebook with a mix of cells with and without an id (update-shaped)', () => {
    const result = writableNotebookSchema.safeParse({
      schema_version: 1,
      cells: [
        {
          _tag: 'database_cell',
          _id: 'b1ffcd88-8d1a-4de7-aa5c-5aa8ac270b22',
          sql: 'select * from auth.users limit 100',
          row_limit: 100,
        },
        {
          _tag: 'log_cell',
          sql: "select timestamp, event_message from edge_logs where source = 'edge_logs' limit 10",
          time_range: { _tag: 'relative_time_range', unit: 'hour', amount: 1 },
        },
      ],
    })

    expect(result.success).toBe(true)
  })

  it('rejects an unknown cell _tag', () => {
    const result = writableNotebookSchema.safeParse({
      schema_version: 1,
      cells: [{ _tag: 'chart_cell', text: 'hi' }],
    })

    expect(result.success).toBe(false)
  })

  it('rejects a database_cell missing row_limit', () => {
    const result = writableNotebookSchema.safeParse({
      schema_version: 1,
      cells: [{ _tag: 'database_cell', sql: 'select 1' }],
    })

    expect(result.success).toBe(false)
  })

  it('rejects an invalid relative_time_range unit', () => {
    const result = writableNotebookSchema.safeParse({
      schema_version: 1,
      cells: [
        {
          _tag: 'log_cell',
          sql: 'select 1',
          time_range: { _tag: 'relative_time_range', unit: 'fortnight', amount: 1 },
        },
      ],
    })

    expect(result.success).toBe(false)
  })
})

describe('isQueryCell', () => {
  it('narrows every runnable cell and excludes content cells', () => {
    const result = notebookDomainSchema.safeParse(FULL_NOTEBOOK)
    expect(result.success).toBe(true)
    if (!result.success) return

    expect(result.data.cells.map(isQueryCell)).toEqual([false, true, true])
    expect(result.data.cells.filter(isQueryCell).map((cell) => cell._tag)).toEqual([
      'database_cell',
      'log_cell',
    ])
  })
})

describe('notebookDomainSchema', () => {
  it('brands database_cell and log_cell sql as unchecked_sql, leaving markdown_cell untouched', () => {
    const result = notebookDomainSchema.safeParse(FULL_NOTEBOOK)

    expect(result.success).toBe(true)
    if (!result.success) return

    const [markdownCell, databaseCell, logCell] = result.data.cells
    expect(markdownCell).toEqual({
      _tag: 'markdown_cell',
      _id: FULL_NOTEBOOK.cells[0]._id,
      text: FULL_NOTEBOOK.cells[0].text,
    })
    expect(databaseCell).toEqual({
      _tag: 'database_cell',
      _id: FULL_NOTEBOOK.cells[1]._id,
      row_limit: 100,
      view: 'table',
      unchecked_sql: untrustedSql('select * from auth.users limit 100'),
    })
    expect(databaseCell).not.toHaveProperty('sql')
    expect(logCell).toMatchObject({
      _tag: 'log_cell',
      unchecked_sql: untrustedLogSql(
        "select timestamp, event_message from edge_logs where source = 'edge_logs' limit 10"
      ),
    })
    expect(logCell).not.toHaveProperty('sql')
  })
})

describe('toWireWritableNotebook', () => {
  it('sends a real id through as _id', () => {
    const wire = toWireWritableNotebook({
      schema_version: 1,
      cells: [{ _tag: 'markdown_cell', _id: 'b1ffcd88-8d1a-4de7-aa5c-5aa8ac270b22', text: 'hi' }],
    })

    expect(wire.cells[0]).toMatchObject({ _id: 'b1ffcd88-8d1a-4de7-aa5c-5aa8ac270b22' })
  })

  it('drops a draft id rather than sending it back as _id', () => {
    expect(isDraftId('draft-b1ffcd88-8d1a-4de7-aa5c-5aa8ac270b22')).toBe(true)

    const wire = toWireWritableNotebook({
      schema_version: 1,
      cells: [
        { _tag: 'markdown_cell', _id: 'draft-b1ffcd88-8d1a-4de7-aa5c-5aa8ac270b22', text: 'hi' },
      ],
    })

    expect(wire.cells[0]).not.toHaveProperty('_id')
  })

  it('leaves a cell with no id at all without an _id', () => {
    const wire = toWireWritableNotebook({
      schema_version: 1,
      cells: [{ _tag: 'markdown_cell', text: 'hi' }],
    })

    expect(wire.cells[0]).not.toHaveProperty('_id')
  })

  it('carries a query cell (database_cell, log_cell) sql through as plain text, never unchecked_sql', () => {
    const wire = toWireWritableNotebook({
      schema_version: 1,
      cells: [
        {
          _tag: 'database_cell',
          _id: 'b1ffcd88-8d1a-4de7-aa5c-5aa8ac270b22',
          sql: safeSql`select 1`,
          row_limit: 100,
        },
        {
          _tag: 'log_cell',
          sql: safeLogSql`select 1`,
          time_range: { _tag: 'relative_time_range', unit: 'hour', amount: 1 },
        },
      ],
    })

    const [databaseCell, logCell] = wire.cells
    expect(databaseCell).toMatchObject({
      _id: 'b1ffcd88-8d1a-4de7-aa5c-5aa8ac270b22',
      sql: 'select 1',
    })
    expect(databaseCell).not.toHaveProperty('unchecked_sql')
    expect(logCell).toMatchObject({ sql: 'select 1' })
    expect(logCell).not.toHaveProperty('_id')
    expect(logCell).not.toHaveProperty('unchecked_sql')
  })
})
