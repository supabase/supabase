import type { NextRouter } from 'next/router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createTabsState, type Tab } from './tabs'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'

const fakeRouter = () => ({ query: { ref: 'default' }, push: vi.fn() }) as unknown as NextRouter

const sqlTab = (id: string): Tab => ({
  id: `sql-${id}`,
  type: 'sql',
  label: id,
  isPreview: false,
  metadata: { sqlId: id },
})

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

describe('tabs close handlers', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('runs the registered close handler when a single tab is closed', () => {
    const store = createTabsState('default')
    store.addTab(sqlTab('a'))

    const onClose = vi.fn()
    store.registerTabTypeHandler('sql', { onClose })

    store.handleTabClose({ id: 'sql-a', router: fakeRouter(), onClearDashboardHistory: () => {} })

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onClose.mock.calls[0][0]).toMatchObject({ id: 'sql-a', metadata: { sqlId: 'a' } })
  })

  it('runs the close handler for every tab closed via closeTabs', () => {
    const store = createTabsState('default')
    store.addTab(sqlTab('a'))
    store.addTab(sqlTab('b'))

    const onClose = vi.fn()
    store.registerTabTypeHandler('sql', { onClose })

    store.closeTabs(['sql-a', 'sql-b'])

    expect(onClose).toHaveBeenCalledTimes(2)
    expect(store.openTabs).toHaveLength(0)
  })

  it('does not run close handlers for the low-level removeTab / removeTabs (re-keying, cleanup)', () => {
    const store = createTabsState('default')
    store.addTab(sqlTab('a'))
    store.addTab(sqlTab('b'))

    const onClose = vi.fn()
    store.registerTabTypeHandler('sql', { onClose })

    store.removeTab('sql-a')
    store.removeTabs(['sql-b'])

    expect(onClose).not.toHaveBeenCalled()
  })

  it('only runs the handler for the matching tab type', () => {
    const store = createTabsState('default')
    store.addTab(sqlTab('a'))
    store.addTab({ id: 'r-1', type: ENTITY_TYPE.TABLE, label: 'tasks', isPreview: false })

    const onClose = vi.fn()
    store.registerTabTypeHandler('sql', { onClose })

    store.closeTabs(['sql-a', 'r-1'])

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onClose.mock.calls[0][0]).toMatchObject({ id: 'sql-a' })
  })

  it('returns the confirmation from the handler when any closing tab needs it', () => {
    const store = createTabsState('default')
    store.addTab(sqlTab('clean'))
    store.addTab(sqlTab('dirty'))

    store.registerTabTypeHandler('sql', {
      confirmClose: (tabs) =>
        tabs.some((tab) => tab.metadata?.sqlId === 'dirty')
          ? { title: 'Unsaved changes', description: 'Closing will discard them.' }
          : null,
    })

    expect(store.getCloseConfirmation(['sql-clean'])).toBeNull()
    expect(store.getCloseConfirmation(['sql-clean', 'sql-dirty'])).toEqual({
      title: 'Unsaved changes',
      description: 'Closing will discard them.',
    })
  })

  it('passes the full set of closing tabs to the handler so it owns the copy', () => {
    const store = createTabsState('default')
    store.addTab(sqlTab('a'))
    store.addTab(sqlTab('b'))
    store.addTab(sqlTab('c'))

    // The handler — not the store — decides the wording, e.g. count-aware copy.
    store.registerTabTypeHandler('sql', {
      confirmClose: (tabs) => ({ title: 'Unsaved changes', description: `${tabs.length} tabs` }),
    })

    expect(store.getCloseConfirmation(['sql-a', 'sql-b', 'sql-c'])).toEqual({
      title: 'Unsaved changes',
      description: '3 tabs',
    })
  })

  it('stops running a handler after it is unregistered', () => {
    const store = createTabsState('default')
    store.addTab(sqlTab('a'))

    const onClose = vi.fn()
    const unregister = store.registerTabTypeHandler('sql', { onClose })
    unregister()

    store.closeTabs(['sql-a'])

    expect(onClose).not.toHaveBeenCalled()
  })

  it('exposes a registered status indicator and bumps the registration version', () => {
    const store = createTabsState('default')
    const Indicator = () => null

    expect(store.getTabStatusIndicator('sql')).toBeUndefined()
    const before = store.handlerRegistrationVersion

    const unregister = store.registerTabTypeHandler('sql', { StatusIndicator: Indicator })

    expect(store.getTabStatusIndicator('sql')).toBe(Indicator)
    expect(store.handlerRegistrationVersion).toBeGreaterThan(before)

    const afterRegister = store.handlerRegistrationVersion
    unregister()

    expect(store.getTabStatusIndicator('sql')).toBeUndefined()
    expect(store.handlerRegistrationVersion).toBeGreaterThan(afterRegister)
  })
})
