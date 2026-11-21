import { generateText } from 'ai'
import { expect, test, vi } from 'vitest'

// End of third-party imports

import { getAIDetails } from '@/lib/ai/ai-details'
import { sanitizeMessagePart } from '@/lib/ai/tools/tool-sanitizer'
import { Route } from '@/routes/api/ai/feedback/rate'
import { getRouteHandler } from '@/tests/lib/server-route'

vi.mock('@/lib/ai/tools/tool-sanitizer', async () => {
  const actual = await vi.importActual<typeof import('@/lib/ai/tools/tool-sanitizer')>(
    '@/lib/ai/tools/tool-sanitizer'
  )
  return {
    sanitizeMessagePart: vi.fn(actual.sanitizeMessagePart),
  }
})

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

vi.mock('ai', async () => {
  const actual = await vi.importActual('ai')
  return {
    ...actual,
    generateText: vi.fn().mockResolvedValue({
      output: {
        category: 'sql_generation',
      },
    }),
    Output: { object: vi.fn() },
  }
})

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

test('rate strips results, tool errors, and restricted SQL outputs before prompting the model', async () => {
  vi.mocked(getAIDetails).mockResolvedValueOnce({
    aiOptInLevel: 'schema',
    hasAccessToAdvanceModel: true,
    orgId: 1,
  } as Awaited<ReturnType<typeof getAIDetails>>)
  vi.mocked(generateText).mockClear()

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
            id: 'msg-1',
            role: 'assistant',
            results: [{ email: 'row-from-results@example.com' }],
            parts: [
              {
                type: 'tool-execute_sql',
                toolCallId: 'call-1',
                state: 'output-available',
                input: { sql: 'select email from users' },
                output: {
                  rows: [{ email: 'row-from-output@example.com' }],
                  optInLevel: 'schema_and_log_and_data',
                },
              },
            ],
          },
          {
            id: 'msg-2',
            role: 'assistant',
            parts: [
              {
                type: 'tool-execute_sql',
                toolCallId: 'call-2',
                state: 'output-error',
                input: { sql: 'insert into users values (1)' },
                errorText: 'duplicate key (email)=(row-from-error@example.com)',
              },
            ],
          },
        ],
        messageId: 'msg-1',
        projectRef: 'test-project',
        orgSlug: 'test-org',
        reason: 'Failed query',
      }),
    }),
  })

  expect(response.status).toBe(200)
  const prompt = vi.mocked(generateText).mock.calls[0]?.[0]?.prompt ?? ''
  expect(prompt).not.toContain('row-from-results@example.com')
  expect(prompt).not.toContain('row-from-output@example.com')
  expect(prompt).not.toContain('row-from-error@example.com')
})
