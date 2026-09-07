import type { UIMessage } from 'ai'
import { describe, expect, it, vi } from 'vitest'

import {
  startAgentRun,
  type AgentPersistence,
  type AgentRunOutcome,
  type AgentToolOperation,
} from './persistence'
import { createAgentStreamResponse, type StreamResult } from './stream'

const incoming: UIMessage[] = [
  { id: 'incoming', role: 'user', parts: [{ type: 'text', text: 'New message' }] },
]
const canonical: UIMessage[] = [
  { id: 'stored', role: 'user', parts: [{ type: 'text', text: 'Canonical history' }] },
  ...incoming,
]
const context = { tenant: 'company:division/team', identity: Symbol('application principal') }
const state = { claim: Symbol('claimed run'), revision: { opaque: 'revision-token' } }

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function operation(): AgentToolOperation {
  return {
    toolCallId: 'application-call-id',
    name: 'change',
    input: { scope: 'owned' },
    execute: vi.fn(async () => 'external side effect'),
  }
}

function adapter(
  overrides: Partial<AgentPersistence<typeof context, typeof state>> = {}
): AgentPersistence<typeof context, typeof state> {
  return {
    startRun: vi.fn(() => ({ state, messages: canonical })),
    finishRun: vi.fn(),
    ...overrides,
  }
}

describe('startAgentRun', () => {
  it('awaits the application claim and returns canonical history with opaque context and state', async () => {
    const claimed = deferred<{ state: typeof state; messages: UIMessage[] }>()
    const persistence = adapter({ startRun: vi.fn(() => claimed.promise) })
    let started = false
    const pending = startAgentRun({
      persistence,
      context,
      messages: incoming,
      trigger: 'application-approval-response',
    }).then((run) => {
      started = true
      return run
    })
    await Promise.resolve()
    expect(started).toBe(false)
    expect(persistence.startRun).toHaveBeenCalledExactlyOnceWith(context, {
      messages: incoming,
      trigger: 'application-approval-response',
    })
    claimed.resolve({ state, messages: canonical })
    const run = await pending
    expect(run.state).toBe(state)
    expect(run.messages).toBe(canonical)
    expect(run.messages).not.toBe(incoming)
    await run.finish({ status: 'cancelled' })
    expect(persistence.finishRun).toHaveBeenCalledExactlyOnceWith(context, state, {
      status: 'cancelled',
    })
  })

  it.each(['throw', 'reject'] as const)('propagates claim failures by %s', async (mode) => {
    const failure = new Error('Application denied this turn')
    const persistence = adapter({
      startRun: () => {
        if (mode === 'throw') throw failure
        return Promise.reject(failure)
      },
      executeTool: vi.fn(),
    })
    await expect(startAgentRun({ persistence, context, messages: incoming })).rejects.toBe(failure)
    expect(persistence.finishRun).not.toHaveBeenCalled()
    expect(persistence.executeTool).not.toHaveBeenCalled()
  })

  it('delegates tool claims and cached outputs without invoking the side effect itself', async () => {
    const failure = new Error('Application denied this operation')
    const executeTool = vi
      .fn()
      .mockResolvedValueOnce('cached result')
      .mockRejectedValueOnce(failure)
    const persistence = adapter({ executeTool })
    const run = await startAgentRun({ persistence, context, messages: incoming })
    const call = operation()
    expect(await run.executeTool(call)).toBe('cached result')
    expect(executeTool).toHaveBeenCalledExactlyOnceWith(context, state, call)
    expect(call.execute).not.toHaveBeenCalled()
    await expect(run.executeTool(call)).rejects.toBe(failure)
    expect(call.execute).not.toHaveBeenCalled()
  })

  it('fails closed when the application has not configured execution persistence', async () => {
    const run = await startAgentRun({ persistence: adapter(), context, messages: incoming })
    const call = operation()
    await expect(run.executeTool(call)).rejects.toThrow(
      'Tool execution persistence is not configured.'
    )
    expect(call.execute).not.toHaveBeenCalled()
  })

  it.each(['completed', 'failed'] as const)(
    'persists only the first concurrent finish outcome, starting with %s',
    async (status) => {
      const saved = deferred<void>()
      const persistence = adapter({
        finishRun: vi.fn(() => saved.promise),
        executeTool: vi.fn(),
      })
      const run = await startAgentRun({ persistence, context, messages: incoming })
      const outcome = { status }
      const first = run.finish(outcome)
      const second = run.finish({ status: status === 'completed' ? 'failed' : 'completed' })
      expect(first).toBe(second)
      const call = operation()
      await expect(run.executeTool(call)).rejects.toThrow('This agent run is no longer active.')
      expect(persistence.finishRun).toHaveBeenCalledExactlyOnceWith(context, state, outcome)
      saved.resolve()
      await Promise.all([first, second])
      await run.finish({ status: 'cancelled' })
      await expect(run.executeTool(call)).rejects.toThrow('This agent run is no longer active.')
      expect(persistence.finishRun).toHaveBeenCalledOnce()
      expect(persistence.executeTool).not.toHaveBeenCalled()
      expect(call.execute).not.toHaveBeenCalled()
    }
  )

  it('permits failure settlement after a rejected save while keeping tool execution closed', async () => {
    const save = deferred<void>()
    const failure = new Error('Application persistence unavailable')
    const finishRun = vi
      .fn()
      .mockImplementationOnce(() => save.promise)
      .mockResolvedValue(undefined)
    const persistence = adapter({ finishRun, executeTool: vi.fn() })
    const run = await startAgentRun({ persistence, context, messages: incoming })
    const first = run.finish({ status: 'completed' })
    const overlapping = run.finish({ status: 'failed' })
    expect(overlapping).toBe(first)
    const rejected = expect(first).rejects.toBe(failure)
    save.reject(failure)
    await rejected
    const call = operation()
    await expect(run.executeTool(call)).rejects.toThrow('This agent run is no longer active.')
    await run.finish({ status: 'failed' })
    await run.finish({ status: 'completed' })
    expect(finishRun.mock.calls.map((call) => call[2])).toEqual([
      { status: 'completed' },
      { status: 'failed' },
    ])
    expect(persistence.executeTool).not.toHaveBeenCalled()
    expect(call.execute).not.toHaveBeenCalled()
  })

  it('settles a real SDK stream as failed after saving its completed response rejects', async () => {
    const failure = new Error('Application response save failed')
    const outcomes: AgentRunOutcome[] = []
    const persistence = adapter({
      finishRun: vi.fn((_context, _state, outcome) => {
        outcomes.push(outcome)
        if (outcomes.length === 1) throw failure
      }),
    })
    const run = await startAgentRun({ persistence, context, messages: incoming })
    type Part = StreamResult['stream'] extends ReadableStream<infer P> ? P : never
    const result: StreamResult = {
      stream: new ReadableStream<Part>({
        start(controller) {
          controller.enqueue({ type: 'start' })
          controller.enqueue({ type: 'text-start', id: 'text' })
          controller.enqueue({ type: 'text-delta', id: 'text', text: 'Answer' })
          controller.enqueue({ type: 'text-end', id: 'text' })
          controller.enqueue({
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
          })
          controller.close()
        },
      }),
    }
    const response = await createAgentStreamResponse(result, {
      originalMessages: run.messages,
      onFinish: ({ responseMessage, status }) => run.finish({ responseMessage, status }),
      onSettled: ({ status }) => run.finish({ status }),
    })
    await expect(response.text()).rejects.toBe(failure)
    expect(outcomes).toEqual([
      {
        status: 'completed',
        responseMessage: expect.objectContaining({
          role: 'assistant',
          parts: [{ type: 'text', text: 'Answer', state: 'done' }],
        }),
      },
      { status: 'failed' },
    ])
    await run.finish({ status: 'cancelled' })
    expect(persistence.finishRun).toHaveBeenCalledTimes(2)
  })
})
