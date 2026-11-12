import { describe, expect, it, vi } from 'vitest'

import { fakeDataPort, testTable } from '../test-utils'
import { entityId, executeQuery, isTableQuery, parseTableSelect, tableSql } from './query-model'

const entity = { schema: 'odd"schema', name: "people's data" }
const logWindow = {
  iso_timestamp_start: '2026-10-23T00:00:00.000Z',
  iso_timestamp_end: '2026-10-23T01:00:00.000Z',
}

describe('generated table queries', () => {
  it('quote identifiers so odd schema and table names cannot change the SQL', () => {
    expect(tableSql(entity)).toBe('select * from "odd""schema"."people\'s data";')
    expect(isTableQuery(tableSql(entity), entity)).toBe(true)
    // Anything appended to the generated query makes it ordinary SQL again.
    expect(isTableQuery(tableSql(entity) + ' delete from users;', entity)).toBe(false)
  })

  it('give each table its own tab id, even when names contain dots', () => {
    expect(entityId({ schema: 'a.b', name: 'c' })).not.toBe(entityId({ schema: 'a', name: 'b.c' }))
  })
})

describe('executeQuery', () => {
  it('reads untouched table queries through the table transport to keep exact values', async () => {
    const table = testTable({ name: entity.name, schema: entity.schema })
    const readTable = vi.fn().mockResolvedValue({
      rows: [{ id: '9007199254740993' }],
      table,
      hasMore: true,
    })
    const data = fakeDataPort({ readTable })

    const result = await executeQuery(data, 'project', tableSql(entity), entity, 50, 25)

    expect(readTable).toHaveBeenCalledWith({
      project_id: 'project',
      schema: entity.schema,
      table: entity.name,
      offset: 50,
      limit: 25,
    })
    // int8 values stay strings so they do not lose precision.
    expect(result.rows[0].id).toBe('9007199254740993')
    expect(result.table).toBe(table)
    expect(result).toMatchObject({ paginated: true, hasMore: true, offset: 50 })
  })

  it('runs edited SQL as a read-only result, even in a tab opened from a table', async () => {
    // A tab's original table binding must never grant edit access to unrelated results.
    const executeSql = vi.fn().mockResolvedValue([{ count: 1 }])
    const data = fakeDataPort({ executeSql })

    const result = await executeQuery(data, 'project', 'select count(*) from users', entity, 50, 25)

    expect(executeSql).toHaveBeenCalledWith({
      project_id: 'project',
      query: 'select count(*) from users',
    })
    expect(result.table).toBeUndefined()
    expect(result.offset).toBe(0)
    expect(result.rows).toEqual([{ count: 1 }])
  })

  it('caps custom results at 1,000 rows and says it did', async () => {
    const rows = Array.from({ length: 1001 }, (_, n) => ({ n }))
    const data = fakeDataPort({ executeSql: vi.fn().mockResolvedValue(rows) })

    const result = await executeQuery(data, 'project', 'select n from records', undefined, 0, 50)

    expect(result.rows).toHaveLength(1000)
    expect(result.truncated).toBe(true)
  })

  it('shows permission errors from the SQL tool rather than swallowing them', async () => {
    const data = fakeDataPort({
      executeSql: vi.fn().mockRejectedValue(new Error('Permission denied')),
    })

    await expect(
      executeQuery(data, 'project', 'select n from records', undefined, 0, 50)
    ).rejects.toThrow('Permission denied')
  })

  it('runs log drafts through query_logs with a bounded window and no row editing', async () => {
    const queryLogs = vi.fn().mockResolvedValue([{ event_message: 'hello' }])
    const data = fakeDataPort({ queryLogs })

    const result = await executeQuery(
      data,
      'project',
      'select * from logs limit 10',
      undefined,
      0,
      50,
      'logs'
    )

    const [input] = queryLogs.mock.calls[0]
    expect(input).toMatchObject({ project_id: 'project', sql: 'select * from logs limit 10' })
    expect(Date.parse(input.iso_timestamp_end) - Date.parse(input.iso_timestamp_start)).toBe(
      86_400_000
    )
    expect(result.table).toBeUndefined()
    expect(result.rows).toEqual([{ event_message: 'hello' }])
  })

  it('reruns log queries against the window they were opened with', async () => {
    // A chart of last night's errors must show the same hours every time it reruns.
    const queryLogs = vi.fn().mockResolvedValue([{ timestamp: '2026-10-23T00:00:00Z' }])
    const data = fakeDataPort({ queryLogs })
    const sql = 'select timestamp, error_rate from logs limit 10'

    for (let n = 0; n < 2; n++) {
      const result = await executeQuery(data, 'project', sql, entity, 0, 50, 'logs', logWindow)
      expect(result.table).toBeUndefined()
      expect(queryLogs).toHaveBeenLastCalledWith({ project_id: 'project', sql, ...logWindow })
    }
    expect(queryLogs).toHaveBeenCalledTimes(2)
  })

  it('resolves a typed full-row SELECT through search_path and keeps it editable within its LIMIT', async () => {
    const table = testTable({ schema: 'private', name: 'agent_memories' })
    const rows = [{ id: '9007199254740993', label: 'Remember this' }]
    const executeSql = vi.fn().mockResolvedValue([{ schema: 'private', name: 'agent_memories' }])
    const readTable = vi.fn().mockResolvedValue({ table, rows, hasMore: true })
    const sql = 'select * from agent_memories limit 10'

    const result = await executeQuery(
      fakeDataPort({ executeSql, readTable }),
      'project',
      sql,
      undefined,
      0,
      50
    )

    expect(executeSql.mock.calls[0][0].query).toContain("pg_catalog.to_regclass(E'agent_memories')")
    expect(readTable).toHaveBeenCalledWith({
      project_id: 'project',
      schema: 'private',
      table: 'agent_memories',
      offset: 0,
      limit: 10,
    })
    expect(result).toMatchObject({
      rows,
      table,
      sql,
      limit: 10,
      hasMore: false,
      paginated: false,
    })
  })

  it('pages relative to the SQL OFFSET and stops at the transport bound', async () => {
    const readTable = vi.fn().mockResolvedValue({ table: testTable(), rows: [], hasMore: true })
    const data = fakeDataPort({
      executeSql: vi.fn().mockResolvedValue([{ schema: 'public', name: 'memories' }]),
      readTable,
    })

    const result = await executeQuery(
      data,
      'project',
      'select * from memories offset 9990',
      undefined,
      0,
      25
    )

    expect(readTable).toHaveBeenLastCalledWith(expect.objectContaining({ offset: 9990, limit: 25 }))
    expect(result).toMatchObject({ offset: 0, paginated: true, hasMore: false })
  })

  it('never pages beyond an explicit SQL LIMIT', async () => {
    const readTable = vi.fn().mockResolvedValue({ table: testTable(), rows: [], hasMore: true })
    const data = fakeDataPort({
      executeSql: vi.fn().mockResolvedValue([{ schema: 'public', name: 'memories' }]),
      readTable,
    })

    const result = await executeQuery(
      data,
      'project',
      'select * from memories limit 80 offset 10',
      undefined,
      50,
      50
    )

    expect(readTable).toHaveBeenLastCalledWith(expect.objectContaining({ offset: 60, limit: 30 }))
    expect(result).toMatchObject({ offset: 50, limit: 30, paginated: true, hasMore: false })
  })

  it.each([
    ['the relation is a view', 'view'],
    ['table metadata is denied', 'metadata'],
    ['the table transport fails', 'transport'],
  ])('still runs the original SQL when %s', async (_, reason) => {
    const executeSql = vi.fn()
    const readTable = vi.fn().mockRejectedValue(new Error('Unavailable'))
    if (reason === 'view') executeSql.mockResolvedValueOnce([])
    if (reason === 'metadata') executeSql.mockRejectedValueOnce(new Error('Metadata denied'))
    if (reason === 'transport')
      executeSql.mockResolvedValueOnce([{ schema: 'public', name: 'memories' }])
    executeSql.mockResolvedValueOnce([{ id: 1 }])
    const sql = 'select * from memories limit 10'

    const result = await executeQuery(
      fakeDataPort({ executeSql, readTable }),
      'project',
      sql,
      undefined,
      0,
      50
    )

    expect(executeSql).toHaveBeenLastCalledWith({ project_id: 'project', query: sql })
    expect(result.rows).toEqual([{ id: 1 }])
    expect(result.table).toBeUndefined()
  })

  it('passes the relation to Postgres as escaped data, not SQL', async () => {
    const executeSql = vi.fn().mockResolvedValue([])

    await executeQuery(
      fakeDataPort({ executeSql }),
      'project',
      'select * from "some\\one\'s table" limit 10',
      undefined,
      0,
      50
    )

    expect(executeSql.mock.calls[0][0].query).toContain("to_regclass(E'\"some\\\\one''s table\"')")
  })

  it('surfaces errors from a generated table query instead of falling back', async () => {
    const data = fakeDataPort({ readTable: vi.fn().mockRejectedValue(new Error('No access')) })

    await expect(executeQuery(data, 'project', tableSql(entity), entity, 0, 50)).rejects.toThrow(
      'No access'
    )
  })
})

describe('parseTableSelect', () => {
  it.each([
    ['select * from agent_memories limit 10', 'agent_memories', 10, 0],
    [
      ' SELECT * FROM "My Schema" . "Memory" LIMIT 25 OFFSET 10; ',
      '"My Schema" . "Memory"',
      25,
      10,
    ],
    [
      'select * from "odd""schema"."people\'s data";',
      '"odd""schema"."people\'s data"',
      undefined,
      0,
    ],
  ])('recognizes the full-row table read %s', (sql, relation, limit, offset) => {
    expect(parseTableSelect(sql)).toEqual({ relation, limit, offset })
  })

  it.each([
    'select * from memories; delete from memories;',
    'select * from memories join users using (id)',
    'select count(*) from memories',
    'select id as content from memories',
    'select * from memories where id = 1',
    'select * from memories union select * from users',
    'with memories as (select * from users) select * from memories',
    'select * from memories limit 0',
    'select * from memories limit 9007199254740992',
    'select * from memories offset 10001',
    'select * from memories order by id desc',
    'select * from memories for update',
  ])('does not offer row editing for %s', (sql) => {
    // Only reads the table transport can represent exactly may become editable.
    expect(parseTableSelect(sql)).toBeUndefined()
  })
})
