import { untrustedSql } from '@supabase/pg-meta'
import { describe, expect, it } from 'vitest'

import { findMutatingQueryCells, isMutatingSql } from './ExplorerNotebookTab.utils'
import { type Cell } from '@/data/content/notebooks/notebook-schema'
import { untrustedLogSql } from '@/data/logs/safe-analytics-sql'

describe('isMutatingSql', () => {
  it('returns false for a read-only query', () => {
    expect(isMutatingSql('select * from auth.users')).toBe(false)
  })

  it.each([
    'insert',
    'update',
    'delete',
    'create',
    'alter',
    'drop',
    'truncate',
    'grant',
    'revoke',
    'merge',
  ])('returns true when the SQL starts with %s', (keyword) => {
    expect(isMutatingSql(`${keyword} something`)).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(isMutatingSql('DELETE FROM auth.users')).toBe(true)
  })

  it('returns true when a mutating statement follows a read-only one', () => {
    expect(isMutatingSql('select 1; delete from auth.users')).toBe(true)
  })

  it('ignores mutating keywords inside comments', () => {
    expect(isMutatingSql('-- delete this table later\nselect 1')).toBe(false)
    expect(isMutatingSql('/* create table foo */\nselect 1')).toBe(false)
  })
})

describe('findMutatingQueryCells', () => {
  const readOnlyDatabaseCell: Cell = {
    _tag: 'database_cell',
    _id: 'cell-1',
    title: 'Signups',
    view: 'table',
    unchecked_sql: untrustedSql('select * from auth.users'),
    row_limit: 50,
  }

  const mutatingDatabaseCell: Cell = {
    _tag: 'database_cell',
    _id: 'cell-2',
    title: 'Cleanup',
    view: 'table',
    unchecked_sql: untrustedSql('delete from auth.users where id = 1'),
    row_limit: 50,
  }

  const mutatingLogCell: Cell = {
    _tag: 'log_cell',
    _id: 'cell-3',
    title: 'Edge logs',
    view: 'table',
    unchecked_sql: untrustedLogSql('insert into edge_logs values (1)'),
    time_range: { _tag: 'relative_time_range', unit: 'hour', amount: 1 },
  }

  const markdownCell: Cell = {
    _tag: 'markdown_cell',
    _id: 'cell-4',
    text: 'insert some notes here',
  }

  it('returns an empty array when there are no mutating database cells', () => {
    expect(findMutatingQueryCells([readOnlyDatabaseCell, markdownCell])).toEqual([])
  })

  it('flags mutating database cells with their id and title', () => {
    expect(findMutatingQueryCells([readOnlyDatabaseCell, mutatingDatabaseCell])).toEqual([
      { id: 'cell-2', title: 'Cleanup' },
    ])
  })

  it('excludes log cells even when their SQL looks mutating', () => {
    expect(findMutatingQueryCells([mutatingDatabaseCell, mutatingLogCell])).toEqual([
      { id: 'cell-2', title: 'Cleanup' },
    ])
  })

  it('falls back to "Untitled query" when a mutating cell has no title', () => {
    const untitledCell: Cell = { ...mutatingDatabaseCell, title: undefined }
    expect(findMutatingQueryCells([untitledCell])).toEqual([
      { id: 'cell-2', title: 'Untitled query' },
    ])
  })
})
