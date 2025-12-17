import { describe, expect, it, vi } from 'vitest'

import { normalizeUiMessages } from './normalize-ui-messages'

describe('normalizeUiMessages', () => {
  it('drops streaming-only/invalid assistant parts for model input', () => {
    const messages = [
      {
        id: 'user-1',
        role: 'user',
        parts: [{ type: 'text', text: 'Hello' }],
      },
      {
        id: 'assistant-1',
        role: 'assistant',
        parts: [
          { type: 'step-start' },
          { type: 'reasoning' },
          { type: 'tool-rename_chat' },
          { type: 'text', text: 'Hi!' },
        ],
      },
      { id: 'assistant-empty', role: 'assistant', parts: [] },
    ]

    const normalized = normalizeUiMessages(messages, {
      dropReasoningParts: true,
      dropToolStates: ['input-streaming', 'input-available', 'output-error'],
      dropNonTextParts: true,
    })

    expect(normalized).toEqual([
      { id: 'user-1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
      { id: 'assistant-1', role: 'assistant', parts: [{ type: 'text', text: 'Hi!' }] },
    ])
  })

  it('keeps valid tool parts and runs the optional sanitizer', () => {
    const sanitizer = vi.fn((part) => part)
    const messages = [
      {
        id: 'assistant-1',
        role: 'assistant',
        parts: [
          {
            type: 'tool-execute_sql',
            toolCallId: 'call-1',
            state: 'output-available',
            input: { sql: 'select 1' },
            output: [{ ok: true }],
          },
          { type: 'tool-execute_sql', state: 'output-available', output: [{ ok: true }] }, // missing toolCallId
        ],
      },
    ]

    const normalized = normalizeUiMessages(messages, { sanitizePart: sanitizer })

    expect(normalized[0].parts).toHaveLength(1)
    expect((normalized[0].parts[0] as any).toolCallId).toBe('call-1')
    expect(sanitizer).toHaveBeenCalledTimes(1)
  })

  it('keeps well-formed reasoning parts when configured', () => {
    const messages = [
      {
        id: 'assistant-1',
        role: 'assistant',
        parts: [{ type: 'reasoning', state: 'done', text: 'Thinking...' }, { type: 'text', text: 'Ok' }],
      },
    ]

    const normalized = normalizeUiMessages(messages, { dropReasoningParts: false })

    expect(normalized[0].parts[0]).toMatchObject({ type: 'reasoning', state: 'done', text: 'Thinking...' })
  })
})
