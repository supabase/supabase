import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createTool as createListFunctionsTool } from './list-functions.server'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import { executeQuery } from '@/lib/api/self-hosted/query'

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  IS_PLATFORM: false,
}))
vi.mock('@/data/sql/execute-sql-mutation', () => ({ executeSql: vi.fn() }))
vi.mock('@/lib/api/self-hosted/query', () => ({ executeQuery: vi.fn() }))

const TOOL_CONTEXT = { toolCallId: 'test', messages: [], context: {} }

const FUNCTION_ROW = {
  id: 1,
  schema: 'public',
  name: 'add',
  language: 'sql',
  definition: 'select a + b',
  complete_statement: 'create function public.add(a int, b int) returns int ...',
  args: [],
  type: 'function',
  argument_types: 'a integer, b integer',
  identity_argument_types: 'a integer, b integer',
  return_type_id: 23,
  return_type: 'integer',
  return_type_relation_id: null,
  is_set_returning_function: false,
  behavior: 'IMMUTABLE',
  security_definer: false,
  config_params: null,
}

describe('ai/tools/list-functions', () => {
  beforeEach(() => {
    vi.mocked(executeSql).mockReset()
    vi.mocked(executeSql).mockResolvedValue({ result: [FUNCTION_ROW] })
  })

  it('filters by schema in SQL, runs through executeQuery, and returns structured rows', async () => {
    const tool = createListFunctionsTool({
      projectRef: 'default',
      connectionString: 'encrypted',
      aiOptInLevel: 'schema',
    })
    if (!tool.execute) throw new Error('execute is undefined')

    const result = await tool.execute({ schemas: ['public'] }, TOOL_CONTEXT)

    const [variables, , , fetcher] = vi.mocked(executeSql).mock.calls[0]
    expect(variables.sql).toContain(`IN ('public')`)
    expect(fetcher).toBe(executeQuery)
    expect(result).toEqual([
      {
        schema: 'public',
        name: 'add',
        argument_types: 'a integer, b integer',
        return_type: 'integer',
        language: 'sql',
        definition: 'select a + b',
      },
    ])
  })
})
