import { describe, expect, test, vi } from 'vitest'

import { toChatResponse } from './chat-stream'

function modelStream(
  parts: Array<{ type: string; [key: string]: unknown }>
): ReadableStream {
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
