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
