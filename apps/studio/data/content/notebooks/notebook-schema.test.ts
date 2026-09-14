import { untrustedSql } from '@supabase/pg-meta'
import { describe, expect, it } from 'vitest'

import {
  agentNotebookSchema,
  notebookDomainSchema,
  notebookSchema,
  writableNotebookSchema,
} from './notebook-schema'
import { untrustedLogSql } from '@/data/logs/safe-analytics-sql'

const FULL_NOTEBOOK = {
  schema_version: 1 as const,
  cells: [
    {
      _tag: 'markdown_cell' as const,
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      text: '# Signup funnel',
    },
    {
      _tag: 'database_cell' as const,
      id: 'b1ffcd88-8d1a-4de7-aa5c-5aa8ac270b22',
      sql: 'select * from auth.users limit 100',
      row_limit: 100,
    },
    {
      _tag: 'log_cell' as const,
      id: 'c2001199-1e2b-4ef8-bb6d-6bb9bd380a33',
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
      cells: [{ _tag: 'chart_cell', id: '1', text: 'hi' }],
    })

    expect(result.success).toBe(false)
  })

  it('rejects a database_cell missing row_limit', () => {
    const result = notebookSchema.safeParse({
      schema_version: 1,
      cells: [{ _tag: 'database_cell', id: '1', sql: 'select 1' }],
    })

    expect(result.success).toBe(false)
  })

  it('rejects a non-ISO absolute_time_range bound', () => {
    const result = notebookSchema.safeParse({
      schema_version: 1,
      cells: [
        {
          _tag: 'log_cell',
          id: '1',
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
          id: '1',
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
          id: '1',
          sql: 'select 1',
          time_range: { _tag: 'relative_time_range', unit: 'fortnight', amount: 1 },
        },
      ],
    })

    expect(result.success).toBe(false)
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
          id: 'b1ffcd88-8d1a-4de7-aa5c-5aa8ac270b22',
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

describe('notebookDomainSchema', () => {
  it('brands database_cell and log_cell sql as unchecked_sql, leaving markdown_cell untouched', () => {
    const result = notebookDomainSchema.safeParse(FULL_NOTEBOOK)

    expect(result.success).toBe(true)
    if (!result.success) return

    const [markdownCell, databaseCell, logCell] = result.data.cells
    expect(markdownCell).toEqual(FULL_NOTEBOOK.cells[0])
    expect(databaseCell).toEqual({
      _tag: 'database_cell',
      id: FULL_NOTEBOOK.cells[1].id,
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
