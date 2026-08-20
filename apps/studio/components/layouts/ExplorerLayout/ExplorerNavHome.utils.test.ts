import { describe, expect, it } from 'vitest'

import { formatRelativeTimeShort, getRecentlyUpdatedItems } from './ExplorerNavHome.utils'
import type { NotebookRow } from '@/data/content/notebooks/notebooks-infinite-query'
import type { ChatSession } from '@/state/ai-assistant-state'

const notebook = (overrides: Partial<NotebookRow> = {}): NotebookRow =>
  ({
    id: 'notebook-1',
    name: 'Signup funnel',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }) as NotebookRow

const chat = (overrides: Partial<ChatSession> = {}): ChatSession =>
  ({
    id: 'chat-1',
    name: 'Investigate errors',
    messages: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  }) as ChatSession

describe('getRecentlyUpdatedItems', () => {
  it('merges notebooks and chats sorted by recency, most recent first', () => {
    const notebooks = [notebook({ id: 'n1', updated_at: '2026-01-01T00:00:00.000Z' })]
    const chats = [chat({ id: 'c1', updatedAt: new Date('2026-02-01T00:00:00.000Z') })]

    expect(getRecentlyUpdatedItems({ notebooks, chats }).map((item) => item.id)).toEqual([
      'c1',
      'n1',
    ])
  })

  it('filters out support chats', () => {
    const chats = [
      chat({
        id: 'support',
        supportMetadata: { isSupportChat: true } as ChatSession['supportMetadata'],
      }),
    ]

    expect(getRecentlyUpdatedItems({ notebooks: [], chats })).toEqual([])
  })

  it('sorts a chat with no updatedAt yet (not hydrated) after everything else', () => {
    const chats = [
      chat({ id: 'rehydrating', updatedAt: undefined as unknown as Date }),
      chat({ id: 'recent', updatedAt: new Date('2026-01-01T00:00:00.000Z') }),
    ]

    expect(getRecentlyUpdatedItems({ notebooks: [], chats }).map((item) => item.id)).toEqual([
      'recent',
      'rehydrating',
    ])
  })

  it('truncates to the given limit', () => {
    const notebooks = Array.from({ length: 10 }, (_, i) =>
      notebook({ id: `n${i}`, updated_at: new Date(2026, 0, i + 1).toISOString() })
    )

    const result = getRecentlyUpdatedItems({ notebooks, chats: [], limit: 3 })

    expect(result).toHaveLength(3)
    expect(result.map((item) => item.id)).toEqual(['n9', 'n8', 'n7'])
  })

  it('defaults to a limit of 5', () => {
    const notebooks = Array.from({ length: 10 }, (_, i) =>
      notebook({ id: `n${i}`, updated_at: new Date(2026, 0, i + 1).toISOString() })
    )

    expect(getRecentlyUpdatedItems({ notebooks, chats: [] })).toHaveLength(5)
  })
})

describe('formatRelativeTimeShort', () => {
  const now = new Date('2026-01-01T12:00:00.000Z').getTime()

  it('shows minutes under an hour', () => {
    const timestamp = now - 12 * 60 * 1000
    expect(formatRelativeTimeShort(timestamp, now)).toBe('12m')
  })

  it('shows "just now" for under a minute', () => {
    const timestamp = now - 30 * 1000
    expect(formatRelativeTimeShort(timestamp, now)).toBe('just now')
  })

  it('shows hours under a day', () => {
    const timestamp = now - 21 * 60 * 60 * 1000
    expect(formatRelativeTimeShort(timestamp, now)).toBe('21h')
  })

  it('shows days beyond a day', () => {
    const timestamp = now - 2 * 24 * 60 * 60 * 1000
    expect(formatRelativeTimeShort(timestamp, now)).toBe('2d')
  })
})
