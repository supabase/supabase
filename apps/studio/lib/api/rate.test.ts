import { expect, test, vi } from 'vitest'

// End of third-party imports

import rate from '../../pages/api/ai/feedback/rate'
import { sanitizeMessagePart } from '../ai/tools/tool-sanitizer'

vi.mock('../ai/tools/tool-sanitizer', () => ({
  sanitizeMessagePart: vi.fn((part) => part),
}))

test('rate calls the tool sanitizer', async () => {
  const mockReq = {
    method: 'POST',
    headers: {
      authorization: 'Bearer test-token',
    },
    body: {
      rating: 'negative',
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
      messageId: 'test-message-id',
      projectRef: 'test-project',
      orgSlug: 'test-org',
      reason: 'The response was not helpful',
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
    }),
  }))

  vi.mock('ai', () => ({
    generateText: vi.fn().mockResolvedValue({
      output: {
        category: 'sql_generation',
      },
    }),
    Output: { object: vi.fn() },
  }))

  vi.mock('@/components/ui/AIAssistantPanel/Message.utils', () => ({
    rateMessageResponseSchema: {},
  }))

  await rate(mockReq as any, mockRes as any)

  expect(sanitizeMessagePart).toHaveBeenCalled()
})
