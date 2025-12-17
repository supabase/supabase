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
    on: vi.fn(),
    body: {
      message: {
        id: 'user-msg-1',
        role: 'user',
        parts: [{ type: 'text', text: 'Hello' }],
      },
      chatId: '00000000-0000-0000-0000-000000000000',
      projectRef: 'test-project',
      connectionString: 'test-connection',
      orgSlug: 'test-org',
    },
  }

  const mockRes = {
    status: vi.fn(() => mockRes),
    json: vi.fn(() => mockRes),
    setHeader: vi.fn(() => mockRes),
    writeHead: vi.fn(() => mockRes),
    write: vi.fn(() => true),
    end: vi.fn(() => mockRes),
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

  vi.mock('data/agents/agent-messages-query', () => ({
    getAgentMessages: vi.fn().mockResolvedValue([
      {
        id: 'assistant-tool-msg-1',
        role: 'assistant',
        parts: [
          {
            type: 'tool-execute_sql',
            toolCallId: 'call-123',
            state: 'output-available',
            input: { sql: 'select 1', label: 'Test', chartConfig: { view: 'table' }, isWriteQuery: false },
            output: [{ ok: true }],
          },
        ],
      },
    ]),
  }))

  vi.mock('data/agents/agent-messages-create-mutation', () => ({
    createAgentMessages: vi.fn().mockResolvedValue({}),
  }))

  vi.mock('lib/ai/tools', () => ({
    getTools: vi.fn().mockResolvedValue({}),
  }))

  vi.mock('ai', () => ({
    createUIMessageStream: vi.fn().mockImplementation(({ execute, onFinish }) => {
      const mockWriter = {
        write: vi.fn(),
        merge: vi.fn(),
      }
      // Execute the stream handler
      execute({ writer: mockWriter })
      // Call onFinish with mock response message
      onFinish?.({ messages: [], responseMessage: null })
      // Return a mock ReadableStream
      return new ReadableStream({
        start(controller) {
          controller.close()
        },
      })
    }),
    createUIMessageStreamResponse: vi.fn().mockReturnValue({
      status: 200,
      headers: new Headers(),
      body: null,
    }),
    streamText: vi.fn().mockReturnValue({
      toUIMessageStream: vi.fn().mockReturnValue(
        new ReadableStream({
          start(controller) {
            controller.close()
          },
        })
      ),
      consumeStream: vi.fn(),
    }),
    convertToModelMessages: vi.fn((msgs) => msgs),
    stepCountIs: vi.fn(),
    generateId: vi.fn(() => 'msg-test'),
    TypeValidationError: class TypeValidationError extends Error {},
  }))

  await generateV4(mockReq as any, mockRes as any)

  expect(sanitizeMessagePart).toHaveBeenCalled()
})
