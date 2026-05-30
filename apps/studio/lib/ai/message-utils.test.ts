import type { UIMessage } from 'ai'
import { describe, expect, it } from 'vitest'

import { prepareMessagesForAPI } from './message-utils'

describe('prepareMessagesForAPI', () => {
  it('should limit messages to last 7 entries', () => {
    const messages: UIMessage[] = Array.from({ length: 10 }, (_, i) => ({
      id: `msg-${i}`,
      role: 'user',
      parts: [{ type: 'text', text: `Message ${i}` }],
    }))

    const result = prepareMessagesForAPI(messages)

    expect(result).toHaveLength(7)
    expect(result[0].parts[0]).toEqual({ type: 'text', text: 'Message 3' })
    expect(result[6].parts[0]).toEqual({ type: 'text', text: 'Message 9' })
  })

  it('should remove results property from assistant messages', () => {
    const messages = [
      {
        id: 'msg-1',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Response' }],
        results: { data: 'some data' },
      },
    ] as Array<UIMessage & { results?: unknown }>

    const result = prepareMessagesForAPI(messages)

    expect(result).toHaveLength(1)
    expect(result[0]).not.toHaveProperty('results')
    expect(result[0].parts[0]).toEqual({ type: 'text', text: 'Response' })
  })

  it('should preserve messages without results', () => {
    const messages: UIMessage[] = [
      {
        id: 'msg-1',
        role: 'user',
        parts: [{ type: 'text', text: 'Question' }],
      },
      {
        id: 'msg-2',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Answer' }],
      },
    ]

    const result = prepareMessagesForAPI(messages)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(messages[0])
    expect(result[1]).toEqual(messages[1])
  })

  it('should handle empty array', () => {
    const messages: UIMessage[] = []

    const result = prepareMessagesForAPI(messages)

    expect(result).toHaveLength(0)
    expect(result).toEqual([])
  })

  it('should handle array with fewer than 7 messages', () => {
    const messages: UIMessage[] = [
      { id: 'msg-1', role: 'user', parts: [{ type: 'text', text: 'Message 1' }] },
      { id: 'msg-2', role: 'assistant', parts: [{ type: 'text', text: 'Message 2' }] },
      { id: 'msg-3', role: 'user', parts: [{ type: 'text', text: 'Message 3' }] },
    ]

    const result = prepareMessagesForAPI(messages)

    expect(result).toHaveLength(3)
    expect(result).toEqual(messages)
  })

  it('should handle array with exactly 7 messages', () => {
    const messages: UIMessage[] = Array.from({ length: 7 }, (_, i) => ({
      id: `msg-${i}`,
      role: i % 2 === 0 ? 'user' : 'assistant',
      parts: [{ type: 'text', text: `Message ${i}` }],
    }))

    const result = prepareMessagesForAPI(messages)

    expect(result).toHaveLength(7)
    expect(result).toEqual(messages)
  })

  it('should only remove results from assistant messages, not user messages', () => {
    const messages = [
      {
        id: 'msg-1',
        role: 'user',
        parts: [{ type: 'text', text: 'Question' }],
        results: { data: 'user data' },
      },
      {
        id: 'msg-2',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Answer' }],
        results: { data: 'assistant data' },
      },
    ] as Array<UIMessage & { results?: unknown }>

    const result = prepareMessagesForAPI(messages)

    expect(result).toHaveLength(2)
    // User message keeps results (not removed by the function)
    expect((result[0] as any).results).toEqual({ data: 'user data' })
    // Assistant message has results removed
    expect(result[1]).not.toHaveProperty('results')
  })

  it('should handle mixed messages with and without results', () => {
    const messages = [
      {
        id: 'msg-1',
        role: 'assistant',
        parts: [{ type: 'text', text: 'First' }],
        results: { data: 'data1' },
      },
      {
        id: 'msg-2',
        role: 'user',
        parts: [{ type: 'text', text: 'Second' }],
      },
      {
        id: 'msg-3',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Third' }],
      },
      {
        id: 'msg-4',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Fourth' }],
        results: { data: 'data2' },
      },
    ] as Array<UIMessage & { results?: unknown }>

    const result = prepareMessagesForAPI(messages)

    expect(result).toHaveLength(4)
    expect(result[0]).not.toHaveProperty('results')
    expect(result[1]).toEqual(messages[1])
    expect(result[2]).toEqual(messages[2])
    expect(result[3]).not.toHaveProperty('results')
  })
})
