import { describe, it, expect } from 'vitest'
import { prepareMessagesForAPI } from './message-utils'
import type { UIMessage } from 'ai'

describe('prepareMessagesForAPI', () => {
  it('should limit messages to MAX_CHAT_HISTORY (7)', () => {
    const messages: UIMessage[] = Array.from({ length: 10 }, (_, i) => ({
      id: `msg-${i}`,
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i}`,
    }))

    const result = prepareMessagesForAPI(messages)

    expect(result).toHaveLength(7)
    expect(result[0].id).toBe('msg-3')
    expect(result[result.length - 1].id).toBe('msg-9')
  })

  it('should return all messages when less than MAX_CHAT_HISTORY', () => {
    const messages: UIMessage[] = [
      { id: 'msg-1', role: 'user', content: 'Hello' },
      { id: 'msg-2', role: 'assistant', content: 'Hi there' },
    ]

    const result = prepareMessagesForAPI(messages)

    expect(result).toHaveLength(2)
    expect(result).toEqual(messages)
  })

  it('should remove results property from assistant messages', () => {
    const messages: UIMessage[] = [
      { id: 'msg-1', role: 'user', content: 'Hello' },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Response',
        results: [{ type: 'tool-call', toolCallId: 'tool-1' }],
      } as any,
    ]

    const result = prepareMessagesForAPI(messages)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(messages[0])
    expect(result[1].role).toBe('assistant')
    expect(result[1].content).toBe('Response')
    expect((result[1] as any).results).toBeUndefined()
  })

  it('should not remove results from user messages', () => {
    const messages: UIMessage[] = [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        results: [{ type: 'result' }],
      } as any,
      { id: 'msg-2', role: 'assistant', content: 'Hi' },
    ]

    const result = prepareMessagesForAPI(messages)

    expect(result).toHaveLength(2)
    expect((result[0] as any).results).toBeDefined()
  })

  it('should preserve all other properties', () => {
    const messages: UIMessage[] = [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        createdAt: new Date(),
      } as any,
    ]

    const result = prepareMessagesForAPI(messages)

    expect(result[0].id).toBe('msg-1')
    expect(result[0].role).toBe('user')
    expect(result[0].content).toBe('Hello')
    expect((result[0] as any).createdAt).toBeDefined()
  })

  it('should handle empty array', () => {
    const result = prepareMessagesForAPI([])

    expect(result).toHaveLength(0)
    expect(result).toEqual([])
  })

  it('should slice last 7 messages when history exceeds limit', () => {
    const messages: UIMessage[] = Array.from({ length: 10 }, (_, i) => ({
      id: `msg-${i}`,
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i}`,
    }))

    const result = prepareMessagesForAPI(messages)

    // Implementation slices last 7 messages, starting from msg-3 (assistant)
    expect(result[0].role).toBe('assistant')
    expect(result[0].id).toBe('msg-3')
  })
})
