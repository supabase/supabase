import { untrustedSql } from '@supabase/pg-meta'
import { describe, expect, it } from 'vitest'

import { findQueryCellsMatchingSql, isMutatingSql } from './ExplorerNotebookTab.utils'
import { checkDestructiveQuery } from '@/components/interfaces/SQLEditor/SQLEditor.utils'
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
  const matchMutatingQueries = (
    cells: readonly Cell[],
    getLiveSql?: (cellId: string) => string | undefined
  ) =>
    findQueryCellsMatchingSql({
      cells,
      getLiveSql,
      matchers: { mutatingQueries: isMutatingSql },
    }).mutatingQueries

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
    expect(matchMutatingQueries([readOnlyDatabaseCell, markdownCell])).toEqual([])
  })

  it('flags mutating database cells with their id and title', () => {
    expect(matchMutatingQueries([readOnlyDatabaseCell, mutatingDatabaseCell])).toEqual([
      { id: 'cell-2', title: 'Cleanup' },
    ])
  })

  it('excludes log cells even when their SQL looks mutating', () => {
    expect(matchMutatingQueries([mutatingDatabaseCell, mutatingLogCell])).toEqual([
      { id: 'cell-2', title: 'Cleanup' },
    ])
  })

  it('falls back to "Untitled query" when a mutating cell has no title', () => {
    const untitledCell: Cell = { ...mutatingDatabaseCell, title: undefined }
    expect(matchMutatingQueries([untitledCell])).toEqual([
      { id: 'cell-2', title: 'Untitled query' },
    ])
  })

  it('flags a cell whose live SQL mutates even though the stored SQL is read-only', () => {
    const getLiveSql = (cellId: string) =>
      cellId === 'cell-1' ? 'delete from auth.users' : undefined

    expect(matchMutatingQueries([readOnlyDatabaseCell, mutatingDatabaseCell], getLiveSql)).toEqual([
      { id: 'cell-1', title: 'Signups' },
      { id: 'cell-2', title: 'Cleanup' },
    ])
  })

  it('flags a cell whose stored SQL mutates even when its live SQL looks read-only', () => {
    const getLiveSql = (cellId: string) =>
      cellId === 'cell-2' ? 'select * from auth.users' : undefined

    expect(matchMutatingQueries([readOnlyDatabaseCell, mutatingDatabaseCell], getLiveSql)).toEqual([
      { id: 'cell-2', title: 'Cleanup' },
    ])
  })

  it('falls back to the stored SQL when the live getter has nothing for a cell', () => {
    const getLiveSql = () => undefined

    expect(matchMutatingQueries([readOnlyDatabaseCell, mutatingDatabaseCell], getLiveSql)).toEqual([
      { id: 'cell-2', title: 'Cleanup' },
    ])
  })
})

describe('findQueryCellsMatchingSql', () => {
  const readOnlyCell: Cell = {
    _tag: 'database_cell',
    _id: 'cell-1',
    title: 'Signups',
    view: 'table',
    unchecked_sql: untrustedSql('select * from auth.users'),
    row_limit: 50,
  }
  const destructiveCell: Cell = {
    _tag: 'database_cell',
    _id: 'cell-2',
    title: 'Drop users',
    view: 'table',
    unchecked_sql: untrustedSql('select 1; drop table users'),
    row_limit: 50,
  }

  it('returns only cells containing destructive SQL', () => {
    expect(
      findQueryCellsMatchingSql({
        cells: [readOnlyCell, destructiveCell],
        matchers: {
          destructiveQueries: checkDestructiveQuery,
          mutatingQueries: isMutatingSql,
        },
      })
    ).toEqual({
      destructiveQueries: [{ id: 'cell-2', title: 'Drop users' }],
      mutatingQueries: [{ id: 'cell-2', title: 'Drop users' }],
    })
  })

  it('ignores destructive SQL inside comments', () => {
    const commentedCell: Cell = {
      ...readOnlyCell,
      unchecked_sql: untrustedSql('-- drop table users\nselect 1'),
    }

    expect(
      findQueryCellsMatchingSql({
        cells: [commentedCell],
        matchers: { destructiveQueries: checkDestructiveQuery },
      }).destructiveQueries
    ).toEqual([])
  })

  it('uses live SQL when it adds a destructive operation', () => {
    expect(
      findQueryCellsMatchingSql({
        cells: [readOnlyCell],
        getLiveSql: () => 'truncate table users',
        matchers: { destructiveQueries: checkDestructiveQuery },
      }).destructiveQueries
    ).toEqual([{ id: 'cell-1', title: 'Signups' }])
  })
})
