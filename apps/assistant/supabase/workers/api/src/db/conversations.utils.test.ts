import { describe, expect, test } from 'vitest'
import type { UIMessage } from 'ai'

import { dedupeMessagesById, messagesToPersistAfterChat } from './conversations.utils'

function msg(id: string, role: UIMessage['role'] = 'assistant', text = id): UIMessage {
  return { id, role, parts: [{ type: 'text', text }] }
}

describe('dedupeMessagesById', () => {
  test('returns an empty list unchanged', () => {
    expect(dedupeMessagesById([])).toEqual([])
  })

  test('keeps unique ids in order', () => {
    expect(dedupeMessagesById([msg('a'), msg('b')])).toEqual([msg('a'), msg('b')])
  })

  test('keeps the last row when the same id appears twice', () => {
    expect(dedupeMessagesById([msg('a', 'assistant', 'first'), msg('a', 'assistant', 'second')])).toEqual([
      msg('a', 'assistant', 'second'),
    ])
  })

  test('dedupes empty-string ids', () => {
    expect(dedupeMessagesById([msg('', 'assistant', 'old'), msg('', 'assistant', 'new')])).toEqual([
      msg('', 'assistant', 'new'),
    ])
  })
})

describe('messagesToPersistAfterChat', () => {
  test('always stores the response message', () => {
    const response = msg('asst-2')
    expect(
      messagesToPersistAfterChat({
        originalIds: new Set(['user-1', 'asst-1']),
        messages: [msg('user-1', 'user'), msg('asst-1'), msg('user-2', 'user'), response],
        responseMessage: response,
      })
    ).toEqual([msg('user-2', 'user'), response])
  })

  test('does not re-upsert historical assistants', () => {
    const response = msg('asst-2')
    expect(
      messagesToPersistAfterChat({
        originalIds: new Set(['user-1', 'asst-1', 'user-2']),
        messages: [msg('user-1', 'user'), msg('asst-1'), msg('user-2', 'user'), response],
        responseMessage: response,
      })
    ).toEqual([response])
  })

  test('stores a continuation that reuses an original assistant id', () => {
    const response = msg('asst-1', 'assistant', 'updated')
    expect(
      messagesToPersistAfterChat({
        originalIds: new Set(['user-1', 'asst-1']),
        messages: [msg('user-1', 'user'), response],
        responseMessage: response,
      })
    ).toEqual([response])
  })

  test('does not send the same id twice when the reply also appears in messages', () => {
    const response = msg('asst-2', 'assistant', 'final')
    expect(
      messagesToPersistAfterChat({
        originalIds: new Set(['user-1']),
        messages: [msg('user-1', 'user'), msg('asst-2', 'assistant', 'partial'), response],
        responseMessage: response,
      })
    ).toEqual([msg('asst-2', 'assistant', 'final')])
  })

  test('collapsing blank ids from missing generateMessageId yields one row', () => {
    const response = msg('', 'assistant', 'new')
    expect(
      messagesToPersistAfterChat({
        originalIds: new Set(['user-1', '']),
        messages: [msg('user-1', 'user'), msg('', 'assistant', 'old'), msg('user-2', 'user'), response],
        responseMessage: response,
      })
    ).toEqual([msg('user-2', 'user'), msg('', 'assistant', 'new')])
  })
})
