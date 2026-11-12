// @vitest-environment node
import type { ModelMessage } from 'ai'
import { MockLanguageModelV3 } from 'ai/test'
import { describe, expect, it } from 'vitest'

import { resolveModel, runModelStep } from './model'

const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 1, text: 1, reasoning: 0 },
}

const tools = [
  {
    name: 'show_query_block',
    description: 'Run a read-only query and show it inline',
    inputSchema: {
      type: 'object',
      properties: { project_id: { type: 'string' }, sql: { type: 'string' } },
      required: ['project_id', 'sql'],
    },
  },
]

describe('host model step', () => {
  it('returns tool calls for the browser to run, then accepts their results on the next step', async () => {
    // The browser runs tools between steps because some live in mounted views.
    const calls: unknown[] = []
    const model = new MockLanguageModelV3({
      doGenerate: async (options) => {
        calls.push(options.prompt)
        return calls.length === 1
          ? {
              content: [
                {
                  type: 'tool-call',
                  toolCallId: 'call-1',
                  toolName: 'show_query_block',
                  input: JSON.stringify({ project_id: 'ref', sql: 'select 1' }),
                },
              ],
              finishReason: { unified: 'tool-calls', raw: undefined },
              usage,
              warnings: [],
            }
          : {
              content: [{ type: 'text', text: 'Opened the query block.' }],
              finishReason: { unified: 'stop', raw: undefined },
              usage,
              warnings: [],
            }
      },
    })

    const messages: ModelMessage[] = [{ role: 'user', content: 'Show me one row' }]
    const first = await runModelStep({ mcpUrl: '' }, { messages, tools }, model)
    expect(first.toolCalls).toEqual([
      {
        toolCallId: 'call-1',
        toolName: 'show_query_block',
        input: { project_id: 'ref', sql: 'select 1' },
      },
    ])

    // The same message shapes HostApp appends: the step's messages, then tool results.
    messages.push(...first.messages, {
      role: 'tool',
      content: [
        {
          type: 'tool-result',
          toolCallId: 'call-1',
          toolName: 'show_query_block',
          output: {
            type: 'json',
            value: { content: [{ type: 'text', text: 'Opened SQL results (1 rows).' }] },
          },
        },
      ],
    })
    const second = await runModelStep({ mcpUrl: '' }, { messages, tools }, model)
    expect(second).toMatchObject({ text: 'Opened the query block.', toolCalls: [] })
    expect(JSON.stringify(calls[1])).toContain('Opened SQL results (1 rows).')
  })

  it('names the setting to fix when no usable model is configured', () => {
    expect(() => resolveModel({ mcpUrl: '' })).toThrow('HOST_MODEL')
    expect(() => resolveModel({ mcpUrl: '', model: 'llama' })).toThrow('<provider>:<model>')
    expect(() => resolveModel({ mcpUrl: '', model: 'gemini:pro' })).toThrow(
      'Unknown model provider'
    )
    expect(() => resolveModel({ mcpUrl: '', model: 'openai-compatible:qwen' })).toThrow(
      'HOST_MODEL_BASE_URL'
    )
  })
})
