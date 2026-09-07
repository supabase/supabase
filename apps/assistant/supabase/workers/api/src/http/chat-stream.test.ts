import { McpConnectionError } from '@supabase/agent-runtime/mcp'
import { describe, expect, test, vi } from 'vitest'

import { toChatResponse } from './chat-stream'
import { assistantStreamFixtures } from './fixtures/assistant-streams'

function modelStream(parts: Array<{ type: string; [key: string]: unknown }>): ReadableStream {
  return new ReadableStream({
    start(controller) {
      for (const part of parts) {
        controller.enqueue(part)
      }
      controller.close()
    },
  })
}

describe('toChatResponse', () => {
  test('turns MCP authorization failures into Studio reconnect errors and settles the run', async () => {
    const onFinish = vi.fn()
    const onSettled = vi.fn()
    const response = await toChatResponse(
      {
        stream: modelStream([
          { type: 'start' },
          { type: 'tool-call', toolCallId: 'docs', toolName: 'search_docs', input: {} },
          {
            type: 'tool-error',
            toolCallId: 'docs',
            toolName: 'search_docs',
            input: {},
            error: new McpConnectionError('authorization_required', 'supabase-assistant'),
          },
          { type: 'text-start', id: 'late' },
          { type: 'text-delta', id: 'late', text: 'Should not continue' },
          { type: 'text-end', id: 'late' },
          { type: 'finish', finishReason: 'stop' },
        ]),
      },
      { originalMessages: [], onFinish, onSettled }
    )
    const body = await response.text()
    expect(body).toContain('"type":"error"')
    expect(body).toContain('oauth_required')
    expect(body).not.toContain('Should not continue')
    expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed' }))
    expect(onSettled).toHaveBeenCalledExactlyOnceWith({ status: 'failed' })
  })

  test('streams UI message SSE events, not only [DONE]', async () => {
    const onFinish = vi.fn()
    const response = await toChatResponse(
      {
        stream: modelStream([
          { type: 'start' },
          { type: 'text-start', id: 'text_1' },
          { type: 'text-delta', id: 'text_1', text: 'Hello' },
          { type: 'text-end', id: 'text_1' },
          { type: 'finish', finishReason: 'stop' },
        ]) as never,
      },
      { originalMessages: [], onFinish }
    )

    expect(response.headers.get('content-type')).toContain('text/event-stream')
    expect(response.headers.get('x-vercel-ai-ui-message-stream')).toBe('v1')
    expect(response.headers.get('content-encoding')).toBe('none')

    const body = await response.text()
    expect(body).toContain('"type":"start"')
    expect(body).toContain('"type":"text-delta"')
    expect(body).toContain('"delta":"Hello"')
    expect(body).toContain('data: {"type":"finish"')
    expect(body).toContain('data: [DONE]')
    expect(body.trim().split('\n\n').length).toBeGreaterThan(1)
  })
})

describe('Studio wire contract', () => {
  test.each(assistantStreamFixtures)('$name', async ({ parts, expected }) => {
    const onFinish = vi.fn()
    const onSettled = vi.fn()
    const response = await toChatResponse(
      {
        stream: modelStream([
          { type: 'start' },
          ...parts,
          { type: 'finish', finishReason: 'stop' },
        ]) as never,
      },
      { revision: 3, originalMessages: [], onFinish, onSettled }
    )
    const body = await response.text()
    expected.forEach((value) => expect(body).toContain(value))
    expect(body).toContain('data: [DONE]')
    expect(response.headers.get('x-assistant-revision')).toBe('3')
    expect(onFinish).toHaveBeenCalledOnce()
    expect(onSettled).toHaveBeenCalledOnce()
  })
  test('persists the response before publishing finish and cleans up after client cancellation', async () => {
    let saved = false
    const onSettled = vi.fn()
    const response = await toChatResponse(
      {
        stream: modelStream([
          { type: 'start' },
          { type: 'text-start', id: 't' },
          { type: 'text-delta', id: 't', text: 'Hello' },
          { type: 'text-end', id: 't' },
          { type: 'finish', finishReason: 'stop' },
        ]) as never,
      },
      {
        originalMessages: [],
        onFinish: async () => {
          await Promise.resolve()
          saved = true
        },
        onSettled,
      }
    )
    const reader = response.body!.getReader()
    while (true) {
      const chunk = await reader.read()
      if (chunk.done) break
      if (new TextDecoder().decode(chunk.value).includes('"type":"finish"'))
        expect(saved).toBe(true)
    }
    expect(onSettled).toHaveBeenCalledOnce()
    const disconnected = await toChatResponse(
      {
        stream: modelStream([{ type: 'start' }, { type: 'finish', finishReason: 'stop' }]) as never,
      },
      { originalMessages: [], onFinish: vi.fn(), onSettled }
    )
    void disconnected.body!.cancel()
    await vi.waitFor(() => expect(onSettled).toHaveBeenCalledTimes(2))
  })
})
