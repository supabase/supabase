import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createTool as createListPoliciesTool } from './list-policies.server'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import { executeQuery } from '@/lib/api/self-hosted/query'

const state = vi.hoisted(() => ({ isPlatform: true }))

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  const mocked = { ...actual }
  Object.defineProperty(mocked, 'IS_PLATFORM', { get: () => state.isPlatform, enumerable: true })
  return mocked
})
vi.mock('@/data/sql/execute-sql-mutation', () => ({
  executeSql: vi.fn(),
}))
vi.mock('@/lib/api/self-hosted/query', () => ({ executeQuery: vi.fn() }))

const TOOL_CONTEXT = { toolCallId: 'test', messages: [], context: {} }

describe('ai/tools/list-policies', () => {
  beforeEach(() => {
    state.isPlatform = true
    vi.mocked(executeSql).mockReset()
    vi.mocked(executeSql).mockResolvedValue({
      result: [
        {
          id: 1,
          schema: 'public',
          table: 'todos',
          table_id: 2,
          name: 'Users can read own rows',
          action: 'PERMISSIVE',
          roles: ['authenticated'],
          command: 'SELECT',
          definition: '(auth.uid() = user_id)',
          check: null,
        },
      ],
    })
  })

  it('forwards the Authorization header to executeSql', async () => {
    const tool = createListPoliciesTool({
      projectRef: 'abcdefghijklmnopqrst',
      connectionString: 'encrypted',
      authorization: 'Bearer token',
      aiOptInLevel: 'schema',
    })
    if (!tool.execute) throw new Error('execute is undefined')

    const result = await tool.execute({ schemas: ['public'] }, TOOL_CONTEXT)

    expect(executeSql).toHaveBeenCalledWith(
      expect.objectContaining({
        projectRef: 'abcdefghijklmnopqrst',
        connectionString: 'encrypted',
      }),
      undefined,
      { Authorization: 'Bearer token' },
      undefined
    )
    expect(result).toContain('Policy Name: "Users can read own rows"')
  })

  it('omits headers when no authorization is provided', async () => {
    const tool = createListPoliciesTool({
      projectRef: 'abcdefghijklmnopqrst',
      connectionString: 'encrypted',
      aiOptInLevel: 'schema',
    })
    if (!tool.execute) throw new Error('execute is undefined')

    await tool.execute({ schemas: ['public'] }, TOOL_CONTEXT)

    expect(executeSql).toHaveBeenCalledWith(expect.any(Object), undefined, undefined, undefined)
  })

  it('filters by the requested schemas in SQL and runs through executeQuery when self-hosted', async () => {
    state.isPlatform = false
    const tool = createListPoliciesTool({
      projectRef: 'default',
      connectionString: 'encrypted',
      aiOptInLevel: 'schema',
    })
    if (!tool.execute) throw new Error('execute is undefined')

    await tool.execute({ schemas: ['public', 'app'] }, TOOL_CONTEXT)

    const [variables, , , fetcher] = vi.mocked(executeSql).mock.calls[0]
    expect(variables.sql).toContain(`IN ('public','app')`)
    vi.mocked(executeQuery).mockResolvedValue({ data: [], error: undefined })
    await expect(fetcher?.({ query: 'select 1' })).resolves.toEqual({ data: [] })
    expect(executeQuery).toHaveBeenCalledWith({ query: 'select 1' })
  })
})
