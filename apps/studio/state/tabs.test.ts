import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createTabId, createTabsState, isSqlEditorTab } from './tabs'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'

const createRouter = () =>
  ({
    query: { ref: 'default' },
    push: vi.fn(),
  }) as any

describe('tabs recent items', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('refreshes an existing recent item label when the tab is re-added', () => {
    const store = createTabsState('default')

    store.addRecentItem({
      id: 'r-1',
      type: ENTITY_TYPE.TABLE,
      label: 'tasks',
      metadata: {
        schema: 'public',
        name: 'tasks',
        tableId: 1,
      },
    })

    store.addRecentItem({
      id: 'r-1',
      type: ENTITY_TYPE.TABLE,
      label: 'routines',
      metadata: {
        schema: 'public',
        name: 'routines',
        tableId: 1,
      },
    })

    expect(store.recentItems).toHaveLength(1)
    expect(store.recentItems[0].label).toBe('routines')
    expect(store.recentItems[0].metadata?.name).toBe('routines')
  })

  it('keeps recent items aligned when an open tab label changes', () => {
    const store = createTabsState('default')

    store.addTab({
      id: 'r-1',
      type: ENTITY_TYPE.TABLE,
      label: 'tasks',
      metadata: {
        schema: 'public',
        name: 'tasks',
        tableId: 1,
      },
      isPreview: false,
    })

    store.updateTab('r-1', { label: 'routines' })

    expect(store.tabsMap['r-1'].label).toBe('routines')
    expect(store.recentItems[0].label).toBe('routines')
    expect(store.recentItems[0].metadata?.name).toBe('routines')
  })
})

describe('tabs removal', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('activates the next visible tab when the first tab is removed', () => {
    const store = createTabsState('default')

    store.addTab({ id: 'sql-a', type: 'sql', metadata: { sqlId: 'a' }, isPreview: false })
    store.addTab({ id: 'sql-b', type: 'sql', metadata: { sqlId: 'b' }, isPreview: false })
    store.addTab({ id: 'sql-c', type: 'sql', metadata: { sqlId: 'c' }, isPreview: false })
    store.makeTabActive('sql-a')

    store.removeTab('sql-a')

    expect(store.activeTab).toBe('sql-b')
  })

  it('does not share mutable default tabs between store instances', () => {
    const firstStore = createTabsState('first')
    const secondStore = createTabsState('second')

    firstStore.addTab({
      id: 'sql-a',
      type: 'sql',
      metadata: { sqlId: 'a' },
      isPreview: false,
    })

    expect(secondStore.openTabs).toEqual([])
    expect(secondStore.tabsMap).toEqual({})
  })

  it('clears the preview marker when a preview tab is removed', () => {
    const store = createTabsState('default')

    store.addTab({ id: 'sql-preview', type: 'sql', metadata: { sqlId: 'preview' } })
    store.removeTab('sql-preview')

    expect(store.previewTabId).toBeUndefined()
  })

  it('navigates to the neighbor from the visible tab order when closing an active tab', () => {
    const store = createTabsState('default')
    const router = createRouter()

    store.addTab({ id: 'sql-a', type: 'sql', metadata: { sqlId: 'a' }, isPreview: false })
    store.addTab({ id: 'sql-b', type: 'sql', metadata: { sqlId: 'b' }, isPreview: false })
    store.addTab({ id: 'sql-c', type: 'sql', metadata: { sqlId: 'c' }, isPreview: false })
    store.reorderTabs(2, 0)
    store.makeTabActive('sql-b')

    store.handleTabClose({
      id: 'sql-b',
      router,
      editor: 'sql',
      onClearDashboardHistory: vi.fn(),
    })

    expect(store.activeTab).toBe('sql-a')
    expect(router.push).toHaveBeenCalledWith('/project/default/sql/a?schema=public')
  })

  it('treats chat tabs as SQL editor tabs', () => {
    const store = createTabsState('default')
    const chatTabId = createTabId('chat', { id: 'chat-a' })

    store.addTab({
      id: chatTabId,
      type: 'chat',
      metadata: { chatId: 'chat-a' },
      isPreview: false,
    })

    expect(chatTabId).toBe('chat-chat-a')
    expect(isSqlEditorTab(chatTabId, store.tabsMap)).toBe(true)
    expect(isSqlEditorTab('chat-chat-a')).toBe(true)
  })

  it('navigates to chat routes for chat tabs', () => {
    const store = createTabsState('default')
    const router = createRouter()

    store.addTab({
      id: 'chat-a',
      type: 'chat',
      metadata: { chatId: 'a' },
      isPreview: false,
    })

    store.handleTabNavigation('chat-a', router)

    expect(router.push).toHaveBeenCalledWith('/project/default/sql/chats/a')
  })

  it('navigates to the neighboring SQL Explorer tab when closing an active chat tab', () => {
    const store = createTabsState('default')
    const router = createRouter()

    store.addTab({ id: 'sql-a', type: 'sql', metadata: { sqlId: 'a' }, isPreview: false })
    store.addTab({
      id: 'chat-b',
      type: 'chat',
      metadata: { chatId: 'b' },
      isPreview: false,
    })
    store.addTab({ id: 'sql-c', type: 'sql', metadata: { sqlId: 'c' }, isPreview: false })
    store.makeTabActive('chat-b')

    store.handleTabClose({
      id: 'chat-b',
      router,
      editor: 'sql',
      onClearDashboardHistory: vi.fn(),
    })

    expect(store.activeTab).toBe('sql-c')
    expect(router.push).toHaveBeenCalledWith('/project/default/sql/c?schema=public')
  })
})
