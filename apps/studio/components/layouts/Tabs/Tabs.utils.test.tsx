import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { useSqlEditorTabsCleanup } from './Tabs.utils'
import { sqlEditorState } from '@/state/sql-editor/sql-editor-state'
import { createTabsState, TabsStateContext, type Tab } from '@/state/tabs'
import { seedSnippet } from '@/tests/lib/sql-editor-test-utils'

const dbTab = (id: string): Tab => ({
  id: `sql-${id}`,
  type: 'sql',
  label: id,
  isPreview: false,
  metadata: { sqlId: id, sqlSource: 'database' },
})

const logsTab = (id: string): Tab => ({
  id: `sql-${id}`,
  type: 'sql',
  label: id,
  isPreview: false,
  metadata: { sqlId: id, sqlSource: 'logs' },
})

function renderCleanup(store: ReturnType<typeof createTabsState>) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <TabsStateContext.Provider value={store}>{children}</TabsStateContext.Provider>
  )
  return renderHook(() => useSqlEditorTabsCleanup(), { wrapper }).result.current
}

describe('useSqlEditorTabsCleanup', () => {
  afterEach(() => {
    for (const key of Object.keys(sqlEditorState.snippets)) delete sqlEditorState.snippets[key]
  })

  it('keeps the tab of a locally-created snippet that has not been persisted yet', () => {
    const store = createTabsState('default')
    store.addTab(dbTab('existing'))
    store.addTab(dbTab('brand-new'))

    // A snippet created by typing in a new tab: it lives in the local store with
    // a never-persisted status, but the server-fetched snippet list can't know
    // about it yet.
    seedSnippet({ id: 'brand-new', name: 'Untitled query', sql: 'select 1;' })

    const cleanup = renderCleanup(store)
    act(() => cleanup({ snippets: [{ id: 'existing', type: 'sql', name: 'existing' }] }))

    expect(store.tabsMap['sql-brand-new']).toBeDefined()
    expect(store.openTabs).toContain('sql-brand-new')
    expect(store.activeTab).toEqual('sql-brand-new')
  })

  it('prunes tabs for deleted snippets (database and logs) while keeping live ones', () => {
    const store = createTabsState('default')
    store.addTab(dbTab('db-stale'))
    store.addTab(logsTab('logs-stale'))
    store.addTab(logsTab('logs-live'))

    const cleanup = renderCleanup(store)

    // The caller passes both `sql` and `log_sql` snippets it knows to be live; only
    // `logs-live` is present, so the two stale tabs are pruned and it is kept.
    act(() => cleanup({ snippets: [{ id: 'logs-live', type: 'log_sql', name: 'logs-live' }] }))

    expect(store.openTabs).toEqual(['sql-logs-live'])
    expect(store.tabsMap['sql-db-stale']).toBeUndefined()
    expect(store.tabsMap['sql-logs-stale']).toBeUndefined()
    expect(store.tabsMap['sql-logs-live']).toBeDefined()
  })

  it('keeps a logs tab that still exists in the snippet list', () => {
    const store = createTabsState('default')
    store.addTab(logsTab('logs'))

    const cleanup = renderCleanup(store)
    act(() => cleanup({ snippets: [{ id: 'logs', type: 'log_sql', name: 'logs' }] }))

    expect(store.openTabs).toEqual(['sql-logs'])
  })

  it('preserves logs tabs when logs snippets are not authoritative (canPruneLogsTabs false)', () => {
    const store = createTabsState('default')
    store.addTab(dbTab('db-stale'))
    store.addTab(logsTab('logs'))

    const cleanup = renderCleanup(store)
    // Logs section disabled / query errored: no logs snippets passed, and logs tabs
    // must not be pruned — but stale database tabs still are.
    act(() => cleanup({ snippets: [], canPruneLogsTabs: false }))

    expect(store.openTabs).toEqual(['sql-logs'])
    expect(store.tabsMap['sql-db-stale']).toBeUndefined()

    // Recent items carry their own logs-source condition, so assert them separately.
    const recentIds = store.recentItems.map((item) => item.id)
    expect(recentIds).toContain('sql-logs')
    expect(recentIds).not.toContain('sql-db-stale')
  })

  it('prunes recent items for deleted logs snippets while keeping live ones', () => {
    const store = createTabsState('default')
    store.addTab(logsTab('logs-stale'))
    store.addTab(logsTab('logs-live'))

    const cleanup = renderCleanup(store)
    act(() => cleanup({ snippets: [{ id: 'logs-live', type: 'log_sql', name: 'logs-live' }] }))

    const recentIds = store.recentItems.map((item) => item.id)
    expect(recentIds).toContain('sql-logs-live')
    expect(recentIds).not.toContain('sql-logs-stale')
  })
})
