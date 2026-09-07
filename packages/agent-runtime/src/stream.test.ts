import { describe, expect, it, vi } from 'vitest'

import { createAgentStreamResponse, type StreamResult } from './stream'

type StreamPart = StreamResult['stream'] extends ReadableStream<infer Part> ? Part : never

const finish: StreamPart = {
  type: 'finish',
  finishReason: 'stop',
  rawFinishReason: undefined,
  totalUsage: {
    inputTokens: 1,
    outputTokens: 1,
    totalTokens: 2,
    inputTokenDetails: { noCacheTokens: 1, cacheReadTokens: 0, cacheWriteTokens: 0 },
    outputTokenDetails: { textTokens: 1, reasoningTokens: 0 },
  },
}

function modelResult(parts: StreamPart[] = []): StreamResult {
  return {
    stream: new ReadableStream<StreamPart>({
      start(controller) {
        for (const part of [{ type: 'start' } satisfies StreamPart, ...parts, finish]) {
          controller.enqueue(part)
        }
        controller.close()
      },
    }),
  }
}

function textResult(): StreamResult {
  return modelResult([
    { type: 'text-start', id: 'text' },
    { type: 'text-delta', id: 'text', text: 'Hello' },
    { type: 'text-end', id: 'text' },
  ])
}

function deferred() {
  let resolve: () => void = () => {}
  const promise = new Promise<void>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

describe('createAgentStreamResponse', () => {
  it('streams AI SDK events with generic headers and preserves application headers', async () => {
    const onFinish = vi.fn()
    const response = await createAgentStreamResponse(textResult(), {
      originalMessages: [],
      headers: { 'x-run-id': 'run-1' },
      onFinish,
    })

    expect(response.headers.get('content-type')).toContain('text/event-stream')
    expect(response.headers.get('content-encoding')).toBe('none')
    expect(response.headers.get('x-vercel-ai-ui-message-stream')).toBe('v1')
    expect(response.headers.get('x-run-id')).toBe('run-1')
    expect([...response.headers.keys()].some((name) => name.startsWith('x-assistant'))).toBe(false)
    const body = await response.text()
    expect(body).toContain('"type":"start"')
    expect(body).toContain('"delta":"Hello"')
    expect(body).toContain('"type":"finish"')
    expect(body).toContain('data: [DONE]')
    expect(onFinish).toHaveBeenCalledWith(
      expect.objectContaining({
        responseMessage: expect.objectContaining({
          role: 'assistant',
          parts: expect.arrayContaining([expect.objectContaining({ type: 'text', text: 'Hello' })]),
        }),
      })
    )
  })

  it('hides internal model errors by default and supports an application error formatter', async () => {
    const error = new Error('Private provider credential: secret-value')
    const defaults = await createAgentStreamResponse(modelResult([{ type: 'error', error }]), {
      originalMessages: [],
      onFinish: vi.fn(),
    })
    const body = await defaults.text()
    expect(body).toContain('Unable to generate a response. Try again.')
    expect(body).not.toContain('secret-value')

    const onError = vi.fn(() => 'The model is unavailable.')
    const customized = await createAgentStreamResponse(modelResult([{ type: 'error', error }]), {
      originalMessages: [],
      onError,
      onFinish: vi.fn(),
    })
    expect(await customized.text()).toContain('The model is unavailable.')
    expect(onError).toHaveBeenCalledWith(error)
  })

  it('waits for persistence and settlement before publishing finish', async () => {
    const persistence = deferred()
    let hasPersisted = false
    let hasPublishedFinish = false
    const onFinish = vi.fn(async () => {
      await persistence.promise
      hasPersisted = true
    })
    const onSettled = vi.fn(async () => {
      expect(hasPersisted).toBe(true)
    })
    const response = await createAgentStreamResponse(textResult(), {
      originalMessages: [],
      onFinish,
      onSettled,
    })
    const reading = (async () => {
      const reader = response.body!.getReader()
      while (true) {
        const chunk = await reader.read()
        if (chunk.done) break
        if (new TextDecoder().decode(chunk.value).includes('"type":"finish"')) {
          hasPublishedFinish = true
          expect(hasPersisted).toBe(true)
          expect(onSettled).toHaveBeenCalledOnce()
        }
      }
    })()

    try {
      await vi.waitFor(() => expect(onFinish).toHaveBeenCalledOnce())
      expect(hasPublishedFinish).toBe(false)
      expect(onSettled).not.toHaveBeenCalled()
    } finally {
      persistence.resolve()
    }
    await reading
    expect(hasPublishedFinish).toBe(true)
    expect(onSettled).toHaveBeenCalledOnce()
    expect(onSettled).toHaveBeenCalledWith({ status: 'completed' })
  })

  it('continues persistence and settles after the client cancels its response', async () => {
    const persistence = deferred()
    const onFinish = vi.fn(() => persistence.promise)
    const onSettled = vi.fn(async () => {})
    const response = await createAgentStreamResponse(textResult(), {
      originalMessages: [],
      onFinish,
      onSettled,
    })
    const cancelled = response.body!.cancel('Client disconnected')
    try {
      await vi.waitFor(() => expect(onFinish).toHaveBeenCalledOnce())
      expect(onSettled).not.toHaveBeenCalled()
    } finally {
      persistence.resolve()
    }
    await cancelled
    await vi.waitFor(() => expect(onSettled).toHaveBeenCalledOnce())
  })

  it('fails the response and settles resources when persistence rejects', async () => {
    const failure = new Error('Persistence failed')
    const onFinish = vi.fn(async () => {
      throw failure
    })
    const onSettled = vi.fn(async () => {})
    const response = await createAgentStreamResponse(textResult(), {
      originalMessages: [],
      onFinish,
      onSettled,
    })

    await expect(response.text()).rejects.toBe(failure)
    expect(onFinish).toHaveBeenCalledOnce()
    expect(onSettled).toHaveBeenCalled()
    expect(onSettled).toHaveBeenCalledWith({ status: 'failed' })
  })

  it('records a provider error as failed even when the model emits a finish event', async () => {
    const onFinish = vi.fn()
    const onSettled = vi.fn(async () => {})
    const response = await createAgentStreamResponse(
      modelResult([{ type: 'error', error: new Error('Provider failed') }]),
      { originalMessages: [], onFinish, onSettled }
    )
    await response.text()
    expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed' }))
    expect(onSettled).toHaveBeenCalledExactlyOnceWith({ status: 'failed' })
  })

  it('does not repeat a failed settlement callback', async () => {
    const failure = new Error('Unable to release run')
    const onSettled = vi.fn(async () => {
      throw failure
    })
    const response = await createAgentStreamResponse(textResult(), {
      originalMessages: [],
      onFinish: vi.fn(),
      onSettled,
    })
    await expect(response.text()).rejects.toBe(failure)
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('records model cancellation separately from a provider failure', async () => {
    const onFinish = vi.fn()
    const onSettled = vi.fn(async () => {})
    const response = await createAgentStreamResponse(modelResult([{ type: 'abort' }]), {
      originalMessages: [],
      onFinish,
      onSettled,
    })
    await response.text()
    expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({ status: 'cancelled' }))
    expect(onSettled).toHaveBeenCalledExactlyOnceWith({ status: 'cancelled' })
  })

  it('allows a failed tool to recover and request another approval', async () => {
    const onFinish = vi.fn()
    const onSettled = vi.fn(async () => {})
    const nextCall = {
      type: 'tool-call' as const,
      toolCallId: 'second',
      toolName: 'change',
      input: {},
    }
    const response = await createAgentStreamResponse(
      modelResult([
        { type: 'tool-call', toolCallId: 'first', toolName: 'change', input: {} },
        {
          type: 'tool-error',
          toolCallId: 'first',
          toolName: 'change',
          input: {},
          error: new Error('Retry with a different input'),
        },
        nextCall,
        { type: 'tool-approval-request', approvalId: 'approval', toolCall: nextCall },
      ]),
      { originalMessages: [], onFinish, onSettled }
    )
    await response.text()
    expect(onFinish).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
        responseMessage: expect.objectContaining({
          parts: expect.arrayContaining([
            expect.objectContaining({ state: 'approval-requested', toolCallId: 'second' }),
          ]),
        }),
      })
    )
    expect(onSettled).toHaveBeenCalledExactlyOnceWith({ status: 'completed' })
  })
})
