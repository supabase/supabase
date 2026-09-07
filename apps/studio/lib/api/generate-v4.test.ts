import { once } from 'node:events'
import { Writable } from 'node:stream'
import { safeSql } from '@supabase/pg-meta'
import { UIMessage } from 'ai'
import { expect, test, vi } from 'vitest'

import generateV4 from '../../pages/api/ai/sql/generate-v4'
import { getTools } from '@/lib/ai/tools'
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

  let output = ''
  const mockRes = Object.assign(
    new Writable({
      write(chunk, _encoding, callback) {
        output += chunk.toString()
        callback()
      },
    }),
    {
      status: vi.fn(() => mockRes),
      json: vi.fn(() => mockRes),
      setHeader: vi.fn(() => mockRes),
      writeHead: vi.fn(() => mockRes),
    }
  )
  const onSpy = vi.spyOn(mockRes, 'on')
  const finished = once(mockRes, 'finish')

  vi.mock('@/lib/ai/ai-details', () => ({
    getAIDetails: vi.fn().mockResolvedValue({
      aiOptInLevel: 'schema_and_log_and_data',
      hasAccessToAdvanceModel: true,
      hasHipaaAddon: false,
      region: 'us-east-1',
      isSensitive: false,
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
      streamText: vi.fn().mockReturnValue({
        stream: new ReadableStream({
          start(controller) {
            for (const part of [
              { type: 'start' },
              { type: 'text-start', id: 'text' },
              { type: 'text-delta', id: 'text', text: 'Hello' },
              { type: 'text-end', id: 'text' },
              { type: 'finish', finishReason: 'stop' },
            ])
              controller.enqueue(part)
            controller.close()
          },
        }),
      }),
    }
  })

  await generateV4(mockReq as any, mockRes as any)

  await finished
  expect(output).toContain('Hello')
  expect(output).toContain('data: [DONE]')
  expect(mockRes.status).not.toHaveBeenCalledWith(500)
  expect(sanitizeMessagePart).toHaveBeenCalled()
  expect(getTools).toHaveBeenCalledWith(
    expect.objectContaining({
      supportMode: true,
    })
  )
  // The response 'close' event must be wired up so the remote MCP connection
  // opened in getTools is torn down when the stream finishes or the client drops
  expect(onSpy).toHaveBeenCalledWith('close', expect.any(Function))
})
