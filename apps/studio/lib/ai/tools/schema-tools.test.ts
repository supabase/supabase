import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getSchemaTools } from './schema-tools'
import { executeSql } from '@/data/sql/execute-sql-mutation'

vi.mock('@/data/sql/execute-sql-mutation', () => ({
  executeSql: vi.fn(),
}))

const TOOL_CONTEXT = { toolCallId: 'test', messages: [], context: {} }

describe('ai/tools/schema-tools list_policies', () => {
  beforeEach(() => {
    vi.mocked(executeSql).mockReset()
    vi.mocked(executeSql).mockResolvedValue({
      result: [
        {
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
    const tools = getSchemaTools({
      projectRef: 'abcdefghijklmnopqrst',
      connectionString: 'encrypted',
      authorization: 'Bearer token',
    })
    if (!tools.list_policies.execute) throw new Error('execute is undefined')

    const result = await tools.list_policies.execute({ schemas: ['public'] }, TOOL_CONTEXT)

    expect(executeSql).toHaveBeenCalledWith(
      expect.objectContaining({
        projectRef: 'abcdefghijklmnopqrst',
        connectionString: 'encrypted',
      }),
      undefined,
      { Authorization: 'Bearer token' }
    )
    expect(result).toContain('Policy Name: "Users can read own rows"')
  })

  it('omits headers when no authorization is provided', async () => {
    const tools = getSchemaTools({
      projectRef: 'abcdefghijklmnopqrst',
      connectionString: 'encrypted',
    })
    if (!tools.list_policies.execute) throw new Error('execute is undefined')

    await tools.list_policies.execute({ schemas: ['public'] }, TOOL_CONTEXT)

    expect(executeSql).toHaveBeenCalledWith(expect.any(Object), undefined, undefined)
  })
})
