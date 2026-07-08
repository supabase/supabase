import { beforeEach, describe, expect, it } from 'vitest'

import { createTabsState } from './tabs'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'

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

  const addSqlTab = (store: ReturnType<typeof createTabsState>, id: string, isPreview = false) => {
    store.addTab({
      id: `sql-${id}`,
      type: 'sql',
      label: `Snippet ${id}`,
      metadata: { sqlId: id, name: `Snippet ${id}` },
      isPreview,
    })
  }

  it('removes deleted snippet tabs and reassigns the active tab', () => {
    const store = createTabsState('default')

    addSqlTab(store, 'a')
    addSqlTab(store, 'b')
    addSqlTab(store, 'c')
    expect(store.activeTab).toBe('sql-c')

    store.removeTabs(['sql-c', 'sql-b'])

    expect(store.openTabs).toEqual(['sql-a'])
    expect(store.tabsMap['sql-b']).toBeUndefined()
    expect(store.tabsMap['sql-c']).toBeUndefined()
    expect(store.activeTab).toBe('sql-a')
  })

  it('clears the active tab when the last tab is removed', () => {
    const store = createTabsState('default')

    addSqlTab(store, 'a')
    store.removeTab('sql-a')

    expect(store.openTabs).toEqual([])
    expect(store.activeTab).toBeNull()
  })

  it('clears previewTabId when the preview tab is removed', () => {
    const store = createTabsState('default')

    addSqlTab(store, 'a')
    addSqlTab(store, 'b', true)
    expect(store.previewTabId).toBe('sql-b')

    store.removeTab('sql-b')

    expect(store.previewTabId).toBeUndefined()
    expect(store.openTabs).toEqual(['sql-a'])
  })

  it('keeps previewTabId when a non-preview tab is removed', () => {
    const store = createTabsState('default')

    addSqlTab(store, 'a')
    addSqlTab(store, 'b', true)

    store.removeTab('sql-a')

    expect(store.previewTabId).toBe('sql-b')
    expect(store.openTabs).toEqual(['sql-b'])
  })
})
