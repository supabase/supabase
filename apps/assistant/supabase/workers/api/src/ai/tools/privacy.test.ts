import { safeSql } from '@supabase/pg-meta'
import { describe, expect, it, vi } from 'vitest'

import { ASSISTANT_NO_DATA_PERMISSIONS, projectPermissionLevelSchema } from '../../permissions'
import { prepareMessagesForModel } from '../generate-assistant-response.utils'
import { getProjectTools } from './project-tools'
import { sanitizeMessagePart } from './tool-sanitizer'

const rows = [{ secret: 'customer-data' }]

describe('Assistant project consent', () => {
  it('rejects remote file URLs before the model can download them', () => {
    expect(() =>
      prepareMessagesForModel(
        [
          {
            id: 'u',
            role: 'user',
            parts: [{ type: 'file', mediaType: 'image/png', url: 'http://127.0.0.1/private' }],
          },
        ],
        'disabled'
      )
    ).toThrow('Attach files directly')
  })
  it('redacts historical policy metadata when schema consent is revoked', () => {
    expect(
      sanitizeMessagePart(
        {
          type: 'tool-list_policies',
          toolCallId: 'policies',
          state: 'output-available',
          input: {},
          output: rows,
        },
        'disabled'
      )
    ).toMatchObject({ output: ASSISTANT_NO_DATA_PERMISSIONS })
  })
  it.each(projectPermissionLevelSchema.options)(
    'redacts same-turn and historical SQL for %s',
    async (aiOptInLevel) => {
      const tools = getProjectTools({
        managementApi: { runQuery: vi.fn(async () => rows), deployFunction: vi.fn() },
        aiOptInLevel,
        executeOperation: async (_id, _name, _input, execute) => execute(),
      })
      const sql = tools.execute_sql
      const output = await sql.execute!(
        { sql: 'select 1', isWriteQuery: false, label: 'Test SQL', chartConfig: { view: 'table' } },
        { toolCallId: 'tool', messages: [], context: {} }
      )
      expect(output).toEqual(rows)
      const modelOutput = await sql.toModelOutput!({
        toolCallId: 'tool',
        input: {
          sql: 'select 1',
          isWriteQuery: false,
          label: 'Test SQL',
          chartConfig: { view: 'table' },
        },
        output,
      })
      expect(JSON.stringify(modelOutput)).toContain(
        aiOptInLevel === 'schema_and_log_and_data' ? 'customer-data' : ASSISTANT_NO_DATA_PERMISSIONS
      )
      const part = sanitizeMessagePart(
        {
          type: 'tool-execute_sql',
          state: 'output-available',
          toolCallId: 'tool',
          input: { sql: safeSql`select 1` },
          output: rows,
        },
        aiOptInLevel
      )
      expect(JSON.stringify(part)).toContain(
        aiOptInLevel === 'schema_and_log_and_data' ? 'customer-data' : ASSISTANT_NO_DATA_PERMISSIONS
      )
      expect(sql.needsApproval).toBe(true)
    }
  )
  it('redacts historical MCP logs after a consent downgrade', () => {
    const part = sanitizeMessagePart(
      {
        type: 'dynamic-tool',
        toolName: 'query_logs',
        toolCallId: 't',
        state: 'output-available',
        input: {},
        output: rows,
      },
      'schema'
    )
    expect(JSON.stringify(part)).not.toContain('customer-data')
  })
})
