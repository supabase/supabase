import { tool } from 'ai'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { ASSISTANT_NO_DATA_PERMISSIONS, projectPermissionLevelSchema } from '../permissions'
import { assistantAgent } from './agent'

const { discover, execute } = vi.hoisted(() => ({ discover: vi.fn(), execute: vi.fn() }))
vi.mock('./tools', () => ({ getTools: discover }))

describe('Assistant framework policy integration', () => {
  it.each(projectPermissionLevelSchema.options)(
    'projects SQL results for %s through agent permissions',
    async (aiOptInLevel) => {
      execute.mockResolvedValue([{ secret: 'private rows' }])
      discover.mockResolvedValue({
        tools: {
          execute_sql: tool({ inputSchema: z.object({}), execute }),
          unregistered_tool: tool({ inputSchema: z.object({}), execute }),
        },
      })
      const session = await assistantAgent.prepare({
        context: {
          projectRef: 'project',
          oauthToken: 'token',
          executeOperation: vi.fn(),
          aiOptInLevel,
          managementApi: { runQuery: vi.fn(), deployFunction: vi.fn() },
        },
      })
      try {
        expect(session.tools.unregistered_tool).toBeUndefined()
        expect(session.tools.load_knowledge).toBeDefined()
        expect(session.tools.execute_sql.needsApproval).toBe(true)
        const output = await session.tools.execute_sql.execute!(
          {},
          {
            toolCallId: 'sql',
            messages: [],
            context: undefined,
          }
        )
        expect(output).toEqual([{ secret: 'private rows' }])
        const modelOutput = await session.tools.execute_sql.toModelOutput!({
          input: {},
          output,
          toolCallId: 'sql',
        })
        expect(JSON.stringify(modelOutput)).toContain(
          aiOptInLevel === 'schema_and_log_and_data'
            ? 'private rows'
            : ASSISTANT_NO_DATA_PERMISSIONS
        )
        execute.mockRejectedValueOnce(new Error('Failing row: private-error-row'))
        await expect(
          session.tools.execute_sql.execute!(
            {},
            {
              toolCallId: 'failed-sql',
              messages: [],
              context: undefined,
            }
          )
        ).rejects.toThrow(
          aiOptInLevel === 'schema_and_log_and_data'
            ? 'private-error-row'
            : 'Database error details are withheld'
        )
      } finally {
        await session.close()
      }
    }
  )

  it('hides support tools outside support mode even if a factory supplies them', async () => {
    discover.mockResolvedValue({
      tools: {
        escalate_to_human: tool({ inputSchema: z.object({}), execute }),
      },
    })
    for (const supportMode of [false, true]) {
      const session = await assistantAgent.prepare({
        context: {
          projectRef: 'project',
          oauthToken: 'token',
          executeOperation: vi.fn(),
          aiOptInLevel: 'disabled',
          supportMode,
          managementApi: { runQuery: vi.fn(), deployFunction: vi.fn() },
        },
      })
      try {
        expect(Object.hasOwn(session.tools, 'escalate_to_human')).toBe(supportMode)
      } finally {
        await session.close()
      }
    }
  })
})
