import { safeSql } from '@supabase/pg-meta'
import { pipeUIMessageStreamToResponse, streamText, UIMessage } from 'ai'
import { expect, test, vi } from 'vitest'

import generateV4 from '../../pages/api/ai/sql/generate-v4'
import { ASSISTANT_TIMEOUT_MS } from '@/lib/ai/assistant-timeout'
import { getTools } from '@/lib/ai/tools'
import { sanitizeMessagePart } from '@/lib/ai/tools/tool-sanitizer'

vi.mock('@/lib/ai/tools/tool-sanitizer', () => ({
  sanitizeMessagePart: vi.fn((part) => part),
}))

vi.mock('@/lib/ai/ai-details', () => ({
  getAIDetails: vi.fn().mockResolvedValue({
    aiOptInLevel: 'schema_and_log_and_data',
    hasAccessToAdvanceModel: true,
    region: 'us-east-1',
  }),
}))

vi.mock('@/lib/ai/model', () => ({
  getModel: vi.fn().mockResolvedValue({
    modelParams: { model: {} },
    systemProviderOptions: {},
  }),
}))

vi.mock('@/data/sql/execute-sql-mutation', () => ({
  executeSql: vi.fn().mockResolvedValue({ result: [] }),
}))

vi.mock('@/lib/ai/tools', () => ({
  getTools: vi.fn().mockResolvedValue({}),
}))

vi.mock('ai', async () => {
  const actual = await vi.importActual('ai')
  return {
    ...actual,
    streamText: vi.fn().mockImplementation(() => ({
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue({ type: 'start' })
          controller.close()
        },
      }),
    })),
    // Consume the response, as the real Node response writer does.
    pipeUIMessageStreamToResponse: vi.fn(async ({ stream }) => {
      const chunks: unknown[] = []
      const reader = stream.getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) return chunks
        chunks.push(value)
      }
    }),
  }
})

function createMocks() {
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
              input: { sql: safeSql`SELECT * FROM users` },
              output: [{ id: 1, name: 'test-output' }],
            },
          ],
        },
      ] satisfies UIMessage[],
      projectRef: 'test-project',
      connectionString: 'test-connection',
      orgSlug: 'test-org',
      supportMode: true,
    },
    on: vi.fn(),
  }

  const mockRes = {
    status: vi.fn(() => mockRes),
    json: vi.fn(() => mockRes),
    setHeader: vi.fn(() => mockRes),
    on: vi.fn(),
  }

  return { mockRes, callGenerateV4: () => generateV4(mockReq as any, mockRes as any) }
}

test('generateV4 calls the tool sanitizer', async () => {
  const { mockRes, callGenerateV4 } = createMocks()

  await callGenerateV4()
  expect(pipeUIMessageStreamToResponse).toHaveBeenCalledOnce()
  await vi.mocked(pipeUIMessageStreamToResponse).mock.results[0].value
  expect(mockRes.status).not.toHaveBeenCalledWith(500)

  expect(sanitizeMessagePart).toHaveBeenCalled()
  expect(getTools).toHaveBeenCalledWith(
    expect.objectContaining({
      supportMode: true,
    })
  )
  // The response 'close' event must be wired up so the remote MCP connection
  // opened in getTools is torn down when the stream finishes or the client drops
  expect(mockRes.on).toHaveBeenCalledWith('close', expect.any(Function))
})

test('generateV4 flags a response the deadline stopped and releases the request', async () => {
  vi.mocked(streamText).mockClear()
  vi.mocked(pipeUIMessageStreamToResponse).mockClear()
  vi.mocked(streamText).mockImplementationOnce(
    () =>
      ({
        stream: new ReadableStream({
          start(controller) {
            controller.enqueue({ type: 'start' })
            controller.enqueue({ type: 'abort', reason: 'signal timed out' })
            controller.close()
          },
        }),
      }) as unknown as ReturnType<typeof streamText>
  )
  const { callGenerateV4 } = createMocks()

  await callGenerateV4()
  const chunks = await vi.mocked(pipeUIMessageStreamToResponse).mock.results[0].value

  expect(chunks).toContainEqual({ type: 'message-metadata', messageMetadata: { timedOut: true } })
  const params = vi.mocked(streamText).mock.calls[0][0]
  expect(params.timeout).toEqual({ totalMs: expect.any(Number) })
  const { totalMs } = params.timeout as { totalMs: number }
  expect(totalMs).toBeGreaterThan(0)
  expect(totalMs).toBeLessThanOrEqual(ASSISTANT_TIMEOUT_MS)
  // Ending the stream aborts the request signal, which closes the remote MCP client.
  expect(params.abortSignal?.aborted).toBe(true)
})
