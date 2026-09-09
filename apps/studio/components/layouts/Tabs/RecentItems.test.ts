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

it('reopens a schema visualizer with its encoded schema', () => {
  expect(
    getRecentItemHref(
      {
        id: 'schema-sales & reports',
        type: 'schema',
        label: 'Schema Visualizer',
        timestamp: 1,
        metadata: { schema: 'sales & reports' },
      },
      'default'
    )
  ).toBe('/project/default/explorer/schema?schema=sales%20%26%20reports')
})
