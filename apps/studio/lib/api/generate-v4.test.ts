import { UIMessage } from 'ai'
import { expect, test, vi } from 'vitest'

import generateV4 from '../../pages/api/ai/sql/generate-v4'
import { sanitizeMessagePart } from '@/lib/ai/tools/tool-sanitizer'

vi.mock('@/lib/ai/tools/tool-sanitizer', () => ({
  sanitizeMessagePart: vi.fn((part) => part),
}))

test('generateV4 calls the tool sanitizer', async () => {
  const mockReq = {
    method: 'POST',
    headers: {
      authorization: 'Bearer test-token',
    },
    body: {
      messages: [
        {
          id: 'test-msg-id',
          role: 'assistant',
          parts: [
            {
              type: 'tool-execute_sql',
              state: 'output-available',
              toolCallId: 'test-tool-call-id',
              input: { sql: 'SELECT * FROM users' },
              output: [{ id: 1, name: 'test-output' }],
            },
          ],
        },
      ] satisfies UIMessage[],
      projectRef: 'test-project',
      connectionString: 'test-connection',
      orgSlug: 'test-org',
    },
    on: vi.fn(),
  }

  const mockRes = {
    status: vi.fn(() => mockRes),
    json: vi.fn(() => mockRes),
    setHeader: vi.fn(() => mockRes),
  }

  vi.mock('@/lib/ai/ai-details', () => ({
    getOrgAIDetails: vi.fn().mockResolvedValue({
      aiOptInLevel: 'schema_and_log_and_data',
      hasAccessToAdvanceModel: true,
      isDpaSigned: false,
    }),
    getProjectAIDetails: vi.fn().mockResolvedValue({
      region: 'us-east-1',
      isSensitive: false,
    }),
  }))

  vi.mock('@/lib/ai/model', () => ({
    getModel: vi.fn().mockResolvedValue({
      modelParams: { model: {} },
      promptProviderOptions: {},
    }),
  }))

  vi.mock('@/data/sql/execute-sql-query', () => ({
    executeSql: vi.fn().mockResolvedValue({ result: [] }),
  }))

  vi.mock('@/lib/ai/tools', () => ({
    getTools: vi.fn().mockResolvedValue({}),
  }))

  vi.mock('ai', async () => {
    const actual = await vi.importActual('ai')
    return {
      ...actual,
      streamText: vi.fn().mockReturnValue({
        pipeUIMessageStreamToResponse: vi.fn(),
      }),
    }
  })

  await generateV4(mockReq as any, mockRes as any)

  expect(sanitizeMessagePart).toHaveBeenCalled()
})
