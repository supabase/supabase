import { describe, expect, it } from 'vitest'

import { getRecentItemHref } from './RecentItems'

describe('getRecentItemHref', () => {
  it('builds chat and notebook Explorer URLs from their IDs', () => {
    expect(
      getRecentItemHref(
        {
          id: 'chat-chat-1',
          type: 'chat',
          label: 'Chat',
          timestamp: 1,
          metadata: { chatId: 'chat-1' },
        },
        'default'
      )
    ).toBe('/project/default/explorer/chat/chat-1')

    expect(
      getRecentItemHref(
        {
          id: 'notebook-notebook-1',
          type: 'notebook',
          label: 'Notebook',
          timestamp: 1,
          metadata: { notebookId: 'notebook-1' },
        },
        'default'
      )
    ).toBe('/project/default/explorer/notebook/notebook-1')
  })
})
