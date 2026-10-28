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
    vi.mocked(executeSql).mockResolvedValue({ result: [TABLE_ROW] })
  })

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
    expect(fetcher).toBe(executeQuery)
    expect(result).toEqual({
      tables: [{ name: 'public.todos', rls_enabled: false, rows: 0 }],
    })
  })

  it('selects columns only when verbose', async () => {
    await run({ schemas: ['public'], verbose: false })
    await run({ schemas: ['public'], verbose: true })

    const [compact, verbose] = vi.mocked(executeSql).mock.calls.map(([variables]) => variables.sql)
    expect(compact).not.toContain('columns as (')
    expect(verbose).toContain('columns as (')
  })
})
