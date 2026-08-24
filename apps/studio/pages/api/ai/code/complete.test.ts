import { createMocks } from 'node-mocks-http'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { handler } from './complete'

const mocks = vi.hoisted(() => ({
  generateText: vi.fn(),
  getModel: vi.fn(),
}))

vi.mock('ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ai')>()
  return { ...actual, generateText: mocks.generateText }
})

vi.mock('@/lib/ai/model', () => ({ getModel: mocks.getModel }))

type CompletionTool = {
  execute?: (
    input: { name: 'logs' },
    options: { toolCallId: string; messages: never[]; context: Record<string, never> }
  ) => Promise<string> | string
}

type GenerateTextOptions = {
  instructions: { content: string }
  tools?: Record<string, CompletionTool>
}

describe('/api/ai/code/complete', () => {
  beforeEach(() => {
    mocks.getModel.mockResolvedValue({
      modelParams: { model: {} },
      error: undefined,
      systemProviderOptions: undefined,
    })
    mocks.generateText.mockResolvedValue({ text: 'select event_message from logs limit 100' })
  })

  it('gives whole-query logs generation the normal assistant logs knowledge tool', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        projectRef: 'default',
        connectionString: null,
        language: 'sql',
        dialect: 'clickhouse',
        intent: 'generate',
        completionMetadata: {
          textBeforeCursor: '',
          textAfterCursor: '',
          prompt: '',
          selection: 'show auth errors',
        },
      },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const options = mocks.generateText.mock.calls[0]?.[0] as GenerateTextOptions
    expect(options.instructions.content).toContain('call load_knowledge with name `logs`')

    const loadKnowledge = options.tools?.load_knowledge
    expect(loadKnowledge).toBeDefined()
    if (!loadKnowledge?.execute) throw new Error('load_knowledge execute is unavailable')

    const knowledge = await loadKnowledge.execute(
      { name: 'logs' },
      { toolCallId: 'test', messages: [], context: {} }
    )
    expect(knowledge).toContain('# Querying Supabase logs')
    expect(knowledge).toContain('query_logs')
    expect(knowledge).toContain('# Supabase logs SQL (ClickHouse)')
  })
})
