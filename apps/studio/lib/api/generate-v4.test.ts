import { safeSql } from '@supabase/pg-meta'
import { streamText, UIMessage } from 'ai'
import { expect, test, vi } from 'vitest'

import { ASSISTANT_TIMEOUT_MS } from '@/lib/ai/assistant-timeout'
import { getTools } from '@/lib/ai/tools'
import { sanitizeMessagePart } from '@/lib/ai/tools/tool-sanitizer'
import { Route } from '@/routes/api/ai/sql/generate-v4'
import { getRouteHandler } from '@/tests/lib/server-route'

vi.mock('@/lib/ai/tools/tool-sanitizer', () => ({
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
    // Braintrust reads this property to check whether `ai` is a language model.
    // Vitest throws if the mock omits it.
    specificationVersion: undefined,
    streamText: vi.fn().mockImplementation(() => ({
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue({ type: 'start' })
          controller.close()
        },
      }),
    })),
  }
})

async function readSseChunks(response: Response): Promise<unknown[]> {
  const text = await response.text()
  const chunks: unknown[] = []
  for (const line of text.split('\n')) {
    if (!line.startsWith('data: ')) continue
    const payload = line.slice('data: '.length)
    if (payload === '[DONE]') continue
    chunks.push(JSON.parse(payload))
  }
  return chunks
}

function createRequest() {
  const clientConnection = new AbortController()
  const request = new Request('http://localhost/api/ai/sql/generate-v4', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer test-token',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
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
    }),
    signal: clientConnection.signal,
  })

  return {
    disconnectClient: () => clientConnection.abort(),
    callGenerateV4: () => getRouteHandler(Route, 'POST')({ request }),
  }
}

test('generateV4 calls the tool sanitizer and aborts MCP tools on client disconnect', async () => {
  vi.mocked(getTools).mockClear()
  // Keep the stream open so only the client disconnect can release the request.
  vi.mocked(streamText).mockImplementationOnce(
    () =>
      ({
        stream: new ReadableStream({
          start() {},
        }),
      }) as unknown as ReturnType<typeof streamText>
  )
  const { disconnectClient, callGenerateV4 } = createRequest()

  const response = await callGenerateV4()
  expect(response.status).toBe(200)
  expect(response.headers.get('content-encoding')).toBe('none')

  expect(sanitizeMessagePart).toHaveBeenCalled()
  expect(getTools).toHaveBeenCalledWith(
    expect.objectContaining({
      supportMode: true,
    })
  )
  // A client disconnect must tear down the remote MCP connection opened in getTools
  const { signal } = vi.mocked(getTools).mock.calls[0][0]
  expect(signal?.aborted).toBe(false)
  disconnectClient()
  expect(signal?.aborted).toBe(true)
  await response.body?.cancel()
})

test('generateV4 streams a tool result that continues the previous assistant message', async () => {
  vi.mocked(streamText).mockClear()
  // After an approval, streamText runs the approved tool first and streams its result into the
  // assistant message the client already has, so the tool call never appears in this stream.
  vi.mocked(streamText).mockImplementationOnce(
    () =>
      ({
        stream: new ReadableStream({
          start(controller) {
            controller.enqueue({ type: 'start' })
            controller.enqueue({
              type: 'tool-result',
              toolCallId: 'test-tool-call-id',
              toolName: 'render_page',
              input: {},
              output: { status: 'ready' },
            })
            controller.close()
          },
        }),
      }) as unknown as ReturnType<typeof streamText>
  )
  const { callGenerateV4 } = createRequest()

  const response = await callGenerateV4()
  const chunks = await readSseChunks(response)

  expect(chunks).toContainEqual(
    expect.objectContaining({ type: 'tool-output-available', toolCallId: 'test-tool-call-id' })
  )
})

test('generateV4 flags a response the deadline stopped and releases the request', async () => {
  vi.mocked(streamText).mockClear()
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
  const { callGenerateV4 } = createRequest()

  const response = await callGenerateV4()
  const chunks = await readSseChunks(response)

  expect(chunks).toContainEqual({ type: 'message-metadata', messageMetadata: { timedOut: true } })
  const params = vi.mocked(streamText).mock.calls[0][0]
  expect(params.timeout).toEqual({ totalMs: expect.any(Number) })
  const { totalMs } = params.timeout as { totalMs: number }
  expect(totalMs).toBeGreaterThan(0)
  expect(totalMs).toBeLessThanOrEqual(ASSISTANT_TIMEOUT_MS)
  // Ending the stream aborts the request signal, which closes the remote MCP client.
  await vi.waitFor(() => expect(params.abortSignal?.aborted).toBe(true))
})
