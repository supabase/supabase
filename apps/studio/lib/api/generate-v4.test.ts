import { expect, test, vi } from 'vitest'
// End of third-party imports

import generateV4 from '../../pages/api/ai/sql/generate-v4'
import { sanitizeMessagePart } from '../ai/tools/tool-sanitizer'

vi.mock('../ai/tools/tool-sanitizer', () => ({
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
          role: 'assistant',
          parts: [
            {
              type: 'tool-execute_sql',
              state: 'output-available',
              output: 'test output',
            },
          ],
        },
      ],
      projectRef: 'test-project',
      connectionString: 'test-connection',
      orgSlug: 'test-org',
    },
  }

  const mockRes = {
    status: vi.fn(() => mockRes),
    json: vi.fn(() => mockRes),
    setHeader: vi.fn(() => mockRes),
  }

  vi.mock('lib/ai/org-ai-details', () => ({
    getOrgAIDetails: vi.fn().mockResolvedValue({
      aiOptInLevel: 'schema_and_log_and_data',
      isLimited: false,
    }),
  }))

  vi.mock('lib/ai/model', () => ({
    getModel: vi.fn().mockResolvedValue({
      model: {},
      error: null,
      promptProviderOptions: {},
      providerOptions: {},
    }),
  }))

  vi.mock('data/sql/execute-sql-query', () => ({
    executeSql: vi.fn().mockResolvedValue({ result: [] }),
  }))

  vi.mock('lib/ai/tools', () => ({
    getTools: vi.fn().mockResolvedValue({}),
  }))

  vi.mock('ai', () => ({
    streamText: vi.fn().mockReturnValue({
      pipeUIMessageStreamToResponse: vi.fn(),
    }),
    convertToModelMessages: vi.fn((msgs) => msgs),
    stepCountIs: vi.fn(),
  }))

  await generateV4(mockReq as any, mockRes as any)

  expect(sanitizeMessagePart).toHaveBeenCalled()
})
