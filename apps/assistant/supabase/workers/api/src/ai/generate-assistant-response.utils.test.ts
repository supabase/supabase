import type { ToolUIPart, UIMessage } from 'ai'
import { describe, expect, it } from 'vitest'

import { prepareMessagesForModel } from './generate-assistant-response.utils'

function assistantMessage(parts: UIMessage['parts']): UIMessage {
  return { id: 'msg-1', role: 'assistant', parts }
}

function toolPart(overrides: Partial<ToolUIPart>): ToolUIPart {
  return {
    type: 'tool-execute_sql',
    toolCallId: 'call-1',
    state: 'output-available',
    input: {},
    ...overrides,
  } as ToolUIPart
}

describe('prepareMessagesForModel', () => {
  it('filters out a plain output-error tool part', () => {
    const messages = [
      assistantMessage([toolPart({ state: 'output-error', errorText: 'Network error' })]),
    ]

    const result = prepareMessagesForModel(messages, 'schema_and_log_and_data')

    expect(result[0].parts).toEqual([])
  })

  it('still filters out input-streaming, input-available, and approval-requested parts', () => {
    const messages = [
      assistantMessage([
        toolPart({ state: 'input-streaming' }),
        toolPart({ state: 'input-available' }),
        toolPart({ state: 'approval-requested', approval: { id: 'a1' } } as Partial<ToolUIPart>),
      ]),
    ]

    const result = prepareMessagesForModel(messages, 'schema_and_log_and_data')

    expect(result[0].parts).toEqual([])
  })

  it('keeps non-tool parts untouched', () => {
    const messages = [assistantMessage([{ type: 'text', text: 'hello' }])]

    const result = prepareMessagesForModel(messages, 'schema_and_log_and_data')

    expect(result[0].parts).toEqual([{ type: 'text', text: 'hello' }])
  })

  it('trims history to the last 7 messages', () => {
    const messages = Array.from({ length: 9 }, (_, i) =>
      assistantMessage([{ type: 'text', text: `m${i}` }])
    )

    const result = prepareMessagesForModel(messages, 'schema_and_log_and_data')

    expect(result).toHaveLength(7)
    expect(result[0].parts).toEqual([{ type: 'text', text: 'm2' }])
    expect(result[6].parts).toEqual([{ type: 'text', text: 'm8' }])
  })
})
