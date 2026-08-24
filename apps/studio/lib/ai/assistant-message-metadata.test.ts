import type { UIMessage } from 'ai'
import { describe, expect, it } from 'vitest'

import {
  assistantMessageMetadataSchema,
  messagesIncludeLogsSnippets,
} from '@/lib/ai/assistant-message-metadata'

function userMessage(id: string, text: string, metadata?: unknown): UIMessage {
  return { id, role: 'user', parts: [{ type: 'text', text }], metadata } as UIMessage
}

function assistantMessage(id: string, text: string): UIMessage {
  return { id, role: 'assistant', parts: [{ type: 'text', text }] } as UIMessage
}

describe('assistantMessageMetadataSchema', () => {
  // safeValidateUIMessages applies this schema to EVERY message's metadata, so a
  // message with none (i.e. every message written before this field existed) has to
  // pass — otherwise an existing conversation 400s on its next turn.
  it('accepts a message with no metadata', () => {
    expect(assistantMessageMetadataSchema.safeParse(undefined).success).toBe(true)
  })

  it('accepts metadata flagging attached logs queries', () => {
    const result = assistantMessageMetadataSchema.safeParse({ containsLogsSnippets: true })
    expect(result.success).toBe(true)
    expect(result.data?.containsLogsSnippets).toBe(true)
  })

  it('rejects a non-boolean flag', () => {
    expect(assistantMessageMetadataSchema.safeParse({ containsLogsSnippets: 'yes' }).success).toBe(
      false
    )
  })
})

describe('messagesIncludeLogsSnippets', () => {
  it('detects a message that attached a logs query', () => {
    expect(
      messagesIncludeLogsSnippets([
        userMessage('1', 'show me 500s', { containsLogsSnippets: true }),
      ])
    ).toBe(true)
  })

  it('stays true once any earlier message attached a logs query', () => {
    expect(
      messagesIncludeLogsSnippets([
        userMessage('1', 'show me 500s', { containsLogsSnippets: true }),
        assistantMessage('2', 'select ...'),
        userMessage('3', 'now count my users', { containsLogsSnippets: false }),
      ])
    ).toBe(true)
  })

  it('is false for a conversation that only attached database queries', () => {
    expect(
      messagesIncludeLogsSnippets([
        userMessage('1', 'count my users', { containsLogsSnippets: false }),
        assistantMessage('2', 'select ...'),
      ])
    ).toBe(false)
  })

  it('is false when no message carries metadata', () => {
    expect(messagesIncludeLogsSnippets([userMessage('1', 'hello')])).toBe(false)
    expect(messagesIncludeLogsSnippets([userMessage('1', 'hello', {})])).toBe(false)
    expect(messagesIncludeLogsSnippets([])).toBe(false)
  })

  // Only the user states which query they attached; an assistant message must not be
  // able to talk the server into a different dialect.
  it('ignores metadata on assistant messages', () => {
    const assistantWithMetadata = {
      id: '1',
      role: 'assistant',
      parts: [{ type: 'text', text: 'hi' }],
      metadata: { containsLogsSnippets: true },
    } as UIMessage
    expect(messagesIncludeLogsSnippets([assistantWithMetadata])).toBe(false)
  })

  it('is false rather than throwing on malformed persisted metadata', () => {
    expect(
      messagesIncludeLogsSnippets([userMessage('1', 'hi', { containsLogsSnippets: 'yes' })])
    ).toBe(false)
    expect(messagesIncludeLogsSnippets([userMessage('1', 'hi', 'not an object')])).toBe(false)
  })
})
