import { expect, test, vi } from 'vitest'

// End of third-party imports

import { sanitizeMessagePart } from '../ai/tools/tool-sanitizer'
import { Route } from '@/routes/api/ai/feedback/rate'
import { getRouteHandler } from '@/tests/lib/server-route'

vi.mock('../ai/tools/tool-sanitizer', () => ({
  sanitizeMessagePart: vi.fn((part) => part),
}))

vi.mock('@/lib/ai/ai-details', () => ({
  getAIDetails: vi.fn().mockResolvedValue({
    aiOptInLevel: 'schema_and_log_and_data',
    hasAccessToAdvanceModel: true,
    orgId: 1,
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

test('rate calls the tool sanitizer', async () => {
  const response = await getRouteHandler(
    Route,
    'POST'
  )({
    request: new Request('http://localhost/api/ai/feedback/rate', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
      }),
    }),
  })

  expect(response.status).toBe(200)
  expect(sanitizeMessagePart).toHaveBeenCalled()
})
