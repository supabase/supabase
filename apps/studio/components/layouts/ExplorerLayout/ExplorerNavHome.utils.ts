import dayjs from 'dayjs'

import type { NotebookRow } from '@/data/content/notebooks/notebooks-infinite-query'
import type { ChatSession } from '@/state/ai-assistant-state'

export const RECENTLY_UPDATED_ITEMS_LIMIT = 5

export interface RecentlyUpdatedItem {
  id: string
  type: 'notebook' | 'chat'
  label: string
  updatedAt: number
}

/**
 * Merges notebooks and chats into one recency-sorted list. Chats can reach here before
 * their persisted state has hydrated (no `updatedAt` yet), so those sort last rather than
 * throwing or floating to the top.
 */
export function getRecentlyUpdatedItems({
  notebooks,
  chats,
  limit = RECENTLY_UPDATED_ITEMS_LIMIT,
}: {
  notebooks: NotebookRow[]
  chats: ChatSession[]
  limit?: number
}): RecentlyUpdatedItem[] {
  const notebookItems: RecentlyUpdatedItem[] = notebooks.map((notebook) => ({
    id: notebook.id,
    type: 'notebook',
    label: notebook.name,
    updatedAt: new Date(notebook.updated_at).getTime(),
  }))

  const chatItems: RecentlyUpdatedItem[] = chats
    .filter((chat) => !chat.supportMetadata?.isSupportChat)
    .map((chat) => ({
      id: chat.id,
      type: 'chat',
      label: chat.name,
      updatedAt: chat.updatedAt?.getTime() ?? 0,
    }))

  return [...notebookItems, ...chatItems]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, limit)
}

/** Compact relative time (`12m`, `21h`, `2d`) for the narrow recent-items row. */
export function formatRelativeTimeShort(timestamp: number, now: number = Date.now()): string {
  const diffMinutes = dayjs(now).diff(timestamp, 'minute')
  if (diffMinutes < 1) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes}m`

  const diffHours = dayjs(now).diff(timestamp, 'hour')
  if (diffHours < 24) return `${diffHours}h`

  const diffDays = dayjs(now).diff(timestamp, 'day')
  return `${diffDays}d`
}
