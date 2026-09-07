import { tool, type UIMessage } from 'ai'
import { MockLanguageModelV4, simulateReadableStream } from 'ai/test'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { defineAgent } from './agent'

const messages: UIMessage[] = [
  { id: 'user', role: 'user', parts: [{ type: 'text', text: 'Help' }] },
]
const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 1, text: 1, reasoning: 0 },
}
function modelWithTool() {
  return new MockLanguageModelV4({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: 'stream-start', warnings: [] },
          { type: 'tool-call', toolCallId: 'call', toolName: 'change', input: '{}' },
          { type: 'finish', finishReason: { unified: 'tool-calls', raw: 'tool-calls' }, usage },
        ],
      }),
    }),
  })
}
async function readStream<T>(stream: ReadableStream<T>) {
  const reader = stream.getReader()
  const chunks: T[] = []
  while (true) {
    const next = await reader.read()
    if (next.done) break
    chunks.push(next.value)
  }
  return chunks
}

describe('agent sessions', () => {
  it('bounds real SDK tool loops and keeps request context out of model instructions', async () => {
    const execute = vi.fn(async () => 'ok')
    const close = vi.fn()
    const load = vi.fn(() => 'private skill body')
    const agent = defineAgent<{ token: string }>({
      name: 'test',
      instructions: 'Help the user.',
      maxSteps: 2,
      tools: () => ({ tools: { change: tool({ inputSchema: z.object({}), execute }) }, close }),
      skills: [{ name: 'sql', description: 'SQL guidance.', load }],
    })
    const session = await agent.prepare({ context: { token: 'private-token' } })
    const model = modelWithTool()
    await readStream((await session.stream({ model, messages })).stream)
    expect(model.doStreamCalls).toHaveLength(2)
    expect(execute).toHaveBeenCalledTimes(2)
    expect(load).not.toHaveBeenCalled()
    expect(JSON.stringify(model.doStreamCalls)).not.toContain('private-token')
    expect(JSON.stringify(model.doStreamCalls)).not.toContain('private skill body')
    expect(JSON.stringify(model.doStreamCalls)).toContain('SQL guidance.')
    // Stream lifetime belongs to the transport, which persists before closing resources.
    expect(close).not.toHaveBeenCalled()
    await session.close()
    await session.close()
    expect(close).toHaveBeenCalledOnce()
    await expect(session.stream({ model, messages })).rejects.toThrow('new agent session')
  })

  it('emits an approval request without executing the tool', async () => {
    const execute = vi.fn()
    const agent = defineAgent({
      name: 'approvals',
      instructions: 'Help.',
      tools: () => ({
        tools: { change: tool({ inputSchema: z.object({}), needsApproval: true, execute }) },
      }),
    })
    const session = await agent.prepare({ context: {} })
    const chunks = await readStream(
      (await session.stream({ model: modelWithTool(), messages })).stream
    )
    expect(chunks).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: 'tool-approval-request' })])
    )
    expect(execute).not.toHaveBeenCalled()
    await session.close()
  })

  it('closes resources on setup collisions and message preparation failures', async () => {
    const close = vi.fn()
    const agent = defineAgent({
      name: 'collision',
      instructions: 'Help.',
      skills: [{ name: 'sql', description: 'SQL.', load: () => '' }],
      tools: () => ({ tools: { load_skill: tool({ inputSchema: z.object({}) }) }, close }),
    })
    await expect(agent.prepare({ context: {} })).rejects.toThrow('Duplicate tool name')
    expect(close).toHaveBeenCalledOnce()
    const failing = defineAgent({
      name: 'preparation',
      instructions: 'Help.',
      tools: () => ({ tools: {}, close }),
      prepareMessages: () => {
        throw new Error('Invalid history')
      },
    })
    const session = await failing.prepare({ context: {} })
    await expect(session.stream({ model: modelWithTool(), messages })).rejects.toThrow(
      'Invalid history'
    )
    await session.close()
    expect(close).toHaveBeenCalledTimes(2)
  })

  it('cleans up after cancellation during discovery and rejects work after close', async () => {
    const abort = new AbortController()
    const close = vi.fn()
    const agent = defineAgent({
      name: 'cancellation',
      instructions: 'Help.',
      tools: async () => {
        abort.abort()
        return { tools: {}, close }
      },
    })
    await expect(agent.prepare({ context: {}, abortSignal: abort.signal })).rejects.toThrow()
    expect(close).toHaveBeenCalledOnce()
    const active = defineAgent({
      name: 'active',
      instructions: 'Help.',
      tools: () => ({ tools: {}, close }),
    })
    const session = await active.prepare({ context: {} })
    await session.close()
    const model = modelWithTool()
    await expect(session.stream({ model, messages })).rejects.toThrow()
    expect(model.doStreamCalls).toHaveLength(0)
  })

  it('passes only prepared messages to context builders and keeps sessions isolated', async () => {
    const contextMessages = vi.fn(() => [])
    const toolContexts: string[] = []
    const agent = defineAgent<{ id: string }>({
      name: 'context',
      instructions: 'Help.',
      tools: ({ id }) => {
        toolContexts.push(id)
        return { tools: {} }
      },
      prepareMessages: () => [],
      contextMessages,
    })
    const first = await agent.prepare({ context: { id: 'one' } })
    const second = await agent.prepare({ context: { id: 'two' } })
    await first.close()
    const model = modelWithTool()
    await readStream((await second.stream({ model, messages })).stream)
    expect(contextMessages).toHaveBeenCalledWith({ id: 'two' }, [])
    expect(toolContexts).toEqual(['one', 'two'])
    await second.close()
  })

  it.each([0, -1, 1.5, Infinity])('rejects invalid step budgets: %s', (maxSteps) => {
    expect(() => defineAgent({ name: 'test', instructions: 'Help.', maxSteps })).toThrow(
      'positive integer'
    )
  })

  it('applies agent permissions to historical results from removed or unknown tools', async () => {
    const historical: UIMessage[] = [
      {
        id: 'history',
        role: 'assistant',
        parts: [
          {
            type: 'dynamic-tool',
            toolName: 'unknown_tool',
            toolCallId: 'unknown',
            state: 'output-available',
            input: {},
            output: 'private-unknown-result',
          },
          {
            type: 'tool-removed_tool',
            toolCallId: 'removed',
            state: 'output-available',
            input: {},
            output: 'private-removed-result',
          },
        ],
      },
      ...messages,
    ]
    const contextMessages = vi.fn(() => [])
    const agent = defineAgent({
      name: 'history',
      instructions: 'Help.',
      maxSteps: 1,
      permissions: { removed_tool: { modelOutput: () => 'redacted' } },
      contextMessages,
    })
    const session = await agent.prepare({ context: {} })
    const model = modelWithTool()
    await readStream((await session.stream({ model, messages: historical })).stream)
    expect(JSON.stringify(model.doStreamCalls)).not.toContain('private-')
    expect(JSON.stringify(contextMessages.mock.calls)).not.toContain('private-')
    expect(historical[0].parts[0]).toMatchObject({ output: 'private-unknown-result' })
    await session.close()
  })

  it('withholds executor errors from the next model step through the real SDK', async () => {
    const agent = defineAgent({
      name: 'private-errors',
      instructions: 'Help.',
      maxSteps: 2,
      permissions: { change: { modelError: () => 'Details withheld' } },
      tools: () => ({
        tools: {
          change: tool({
            inputSchema: z.object({}),
            execute: async (): Promise<string> => {
              throw new Error('private-database-row')
            },
          }),
        },
      }),
    })
    const session = await agent.prepare({ context: {} })
    try {
      const model = modelWithTool()
      const chunks = await readStream((await session.stream({ model, messages })).stream)
      expect(model.doStreamCalls).toHaveLength(2)
      expect(JSON.stringify(model.doStreamCalls[1])).toContain('Details withheld')
      expect(JSON.stringify(model.doStreamCalls)).not.toContain('private-database-row')
      expect(JSON.stringify(chunks)).not.toContain('private-database-row')
    } finally {
      await session.close()
    }
  })

  it('enforces async revoked permissions when a historical tool disappears and redacts stored errors', async () => {
    const historical: UIMessage[] = [
      {
        id: 'old',
        role: 'assistant',
        parts: [
          {
            type: 'tool-removed',
            toolCallId: 'read',
            state: 'output-available',
            input: { account: 'other' },
            output: 'private-row',
          },
          {
            type: 'tool-change',
            toolCallId: 'write',
            state: 'output-error',
            input: {},
            errorText: 'private-error',
          },
        ],
      },
      ...messages,
    ]
    const agent = defineAgent({
      name: 'history',
      instructions: 'Help.',
      maxSteps: 1,
      permissions: {
        removed: { canExecute: async () => false },
        change: { modelError: () => 'Details withheld' },
      },
      tools: () => ({
        tools: { change: tool({ inputSchema: z.object({}), execute: async () => 'ok' }) },
      }),
    })
    const session = await agent.prepare({ context: {} })
    try {
      const model = modelWithTool()
      await readStream((await session.stream({ model, messages: historical })).stream)
      expect(JSON.stringify(model.doStreamCalls)).not.toContain('private-')
      expect(JSON.stringify(model.doStreamCalls)).toContain('Details withheld')
      expect(JSON.stringify(historical)).toContain('private-row')
    } finally {
      await session.close()
    }
  })
})
