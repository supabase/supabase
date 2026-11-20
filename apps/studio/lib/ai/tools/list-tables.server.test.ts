import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createTool as createListTablesTool } from './list-tables.server'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import { executeQuery } from '@/lib/api/self-hosted/query'

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  IS_PLATFORM: false,
}))
vi.mock('@/data/sql/execute-sql-mutation', () => ({ executeSql: vi.fn() }))
vi.mock('@/lib/api/self-hosted/query', () => ({ executeQuery: vi.fn() }))

const TOOL_CONTEXT = { toolCallId: 'test', messages: [], context: {} }

const TABLE_ROW = {
  id: 1,
  schema: 'public',
  name: 'todos',
  rls_enabled: false,
  rls_forced: false,
  replica_identity: 'DEFAULT',
  bytes: 0,
  size: '0 bytes',
  live_rows_estimate: 0,
  dead_rows_estimate: 0,
  comment: null,
  primary_keys: [],
  relationships: [],
}

describe('ai/tools/list-tables (self-hosted)', () => {
  beforeEach(() => {
    vi.mocked(executeSql).mockReset()
    vi.mocked(executeSql).mockImplementation(async ({ sql }) => ({
      result: relkindOf(sql) === 'table' ? [TABLE_ROW] : [],
    }))
  })

  function relkindOf(sql: string) {
    if (/relkind\s*=\s*'v'/i.test(sql)) return 'view'
    if (/relkind\s*=\s*'m'/i.test(sql)) return 'materialized_view'
    if (/relkind\s*=\s*'f'/i.test(sql)) return 'foreign_table'
    return 'table'
  }

  function run(input: { schemas: string[]; verbose: boolean }) {
    const tool = createListTablesTool({
      projectRef: 'default',
      connectionString: 'encrypted',
      aiOptInLevel: 'schema',
    })
    if (!tool.execute) throw new Error('execute is undefined')
    return tool.execute(input, TOOL_CONTEXT)
  }

  it('filters by schema in SQL, runs through executeQuery, and maps the rows', async () => {
    const result = await run({ schemas: ['public'], verbose: false })

    const [variables, , , fetcher] = vi.mocked(executeSql).mock.calls[0]
    expect(variables.sql).toContain(`IN ('public')`)
    vi.mocked(executeQuery).mockResolvedValue({ data: [], error: undefined })
    await expect(fetcher?.({ query: 'select 1' })).resolves.toEqual({ data: [] })
    expect(executeQuery).toHaveBeenCalledWith({ query: 'select 1' })
    expect(result).toEqual({
      tables: [{ name: 'public.todos', rls_enabled: false, rows: 0 }],
    })
  })

  it('selects columns only when verbose', async () => {
    await run({ schemas: ['public'], verbose: false })
    await run({ schemas: ['public'], verbose: true })

    const [compact, verbose] = vi
      .mocked(executeSql)
      .mock.calls.map(([variables]) => variables.sql)
      .filter((sql) => relkindOf(sql) === 'table')
    expect(compact).not.toContain('columns as (')
    expect(verbose).toContain('columns as (')
  })
  it('runs all four relation queries, each filtered by schema', async () => {
    await run({ schemas: ['public'], verbose: false })

    const queries = vi.mocked(executeSql).mock.calls.map(([variables]) => variables.sql)
    expect(queries.map(relkindOf).sort()).toEqual([
      'foreign_table',
      'materialized_view',
      'table',
      'view',
    ])
    for (const sql of queries) expect(sql).toContain(`IN ('public')`)
  })

  it('includes views, materialized views, and foreign tables with their type', async () => {
    vi.mocked(executeSql).mockImplementation(async ({ sql }) => {
      switch (relkindOf(sql)) {
        case 'view':
          return {
            result: [{ id: 2, schema: 'public', name: 'v', is_updatable: true, comment: null }],
          }
        case 'materialized_view':
          return {
            result: [
              { id: 3, schema: 'public', name: 'mv', is_populated: true, comment: 'cached' },
            ],
          }
        case 'foreign_table':
          return {
            result: [
              {
                id: 4,
                schema: 'public',
                name: 'ft',
                comment: null,
                foreign_server_name: 's',
                foreign_data_wrapper_name: 'w',
                foreign_data_wrapper_handler: 'h',
              },
            ],
          }
        default:
          return { result: [TABLE_ROW] }
      }
    })

    const result = await run({ schemas: ['public'], verbose: false })

    expect(result).toEqual({
      tables: [
        { name: 'public.todos', rls_enabled: false, rows: 0 },
        { name: 'public.v', type: 'view', rls_enabled: false, rows: null },
        {
          name: 'public.mv',
          type: 'materialized_view',
          rls_enabled: false,
          rows: null,
          comment: 'cached',
        },
        { name: 'public.ft', type: 'foreign_table', rls_enabled: false, rows: null },
      ],
    })
  })

  it('includes view columns when verbose', async () => {
    vi.mocked(executeSql).mockImplementation(async ({ sql }) => ({
      result:
        relkindOf(sql) === 'view'
          ? [
              {
                id: 2,
                schema: 'public',
                name: 'v',
                is_updatable: false,
                comment: null,
                columns: [
                  {
                    id: '2.1',
                    table_id: 2,
                    schema: 'public',
                    table: 'v',
                    name: 'id',
                    ordinal_position: 1,
                    data_type: 'bigint',
                    format: 'int8',
                    is_identity: false,
                    identity_generation: null,
                    is_generated: false,
                    is_nullable: true,
                    is_updatable: false,
                    is_unique: false,
                    check: null,
                    default_value: null,
                    enums: [],
                    comment: null,
                  },
                ],
              },
            ]
          : [],
    }))

    const result = await run({ schemas: ['public'], verbose: true })

    expect(result).toEqual({
      tables: [
        {
          name: 'public.v',
          type: 'view',
          rls_enabled: false,
          rows: null,
          columns: [
            {
              name: 'id',
              data_type: 'bigint',
              format: 'int8',
              options: ['nullable'],
            },
          ],
          primary_keys: [],
        },
      ],
    })
  })
})
