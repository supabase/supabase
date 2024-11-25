import { nanoid } from 'nanoid'
import { NextRouter } from 'next/router'
import { ReactNode } from 'react'
import { proxy, subscribe } from 'valtio'
import { addRecentItem } from './recent-items'

export type TabType = 'table' | 'schema' | 'sql' | 'view' | 'function' | 'new'

export interface Tab {
  id: string
  type: TabType
  label?: string
  icon?: ReactNode
  metadata?: {
    schema?: string
    name?: string
    tableId?: number
    sqlId?: string
  }
  isPreview?: boolean
}

interface TabsState {
  activeTab: string | null
  openTabs: string[]
  tabsMap: { [key: string]: Tab }
  previewTabId?: string
}

interface TabsStateMap {
  [ref: string]: TabsState
}

const STORAGE_KEY = 'supabase_studio_tabs'
const getStorageKey = (ref: string) => `${STORAGE_KEY}_${ref}`

const defaultState: TabsState = {
  openTabs: [],
  activeTab: null,
  tabsMap: {},
}

// Store now holds states for multiple refs
export const tabsStore = proxy<TabsStateMap>({})

// Helper to get/create state for a specific ref
export const getTabsStore = (ref: string | undefined): TabsState => {
  if (!ref) return proxy(defaultState)
  if (!tabsStore[ref]) {
    const stored = localStorage.getItem(getStorageKey(ref))
    tabsStore[ref] = proxy(stored ? JSON.parse(stored) : { ...defaultState })
  }
  return tabsStore[ref]
}

// Subscribe to changes for each ref
if (typeof window !== 'undefined') {
  subscribe(tabsStore, () => {
    Object.entries(tabsStore).forEach(([ref, state]) => {
      try {
        localStorage.setItem(getStorageKey(ref), JSON.stringify(state))
      } catch (error) {
        console.error('Failed to save tabs to localStorage:', error)
      }
    })
  })
}

export const addTab = (ref: string | undefined, tab: Tab) => {
  if (!ref) return
  const store = getTabsStore(ref)

  // If tab exists and is active, don't do anything
  if (store.tabsMap[tab.id] && store.activeTab === tab.id) {
    return
  }

  // If tab exists but isn't active, just make it active
  if (store.tabsMap[tab.id]) {
    store.activeTab = tab.id
    if (!tab.isPreview && tab.type !== 'new') {
      addRecentItem(tab)
    }
    return
  }

  // If this tab should be permanent, add it normally
  if (tab.isPreview === false) {
    store.openTabs = [...store.openTabs, tab.id]
    store.tabsMap[tab.id] = tab
    store.activeTab = tab.id
    // Add to recent items when creating permanent tab
    if (tab.type !== 'new') {
      addRecentItem(tab)
    }
    return
  }

  // Remove any existing preview tab
  if (store.previewTabId) {
    store.openTabs = store.openTabs.filter((id) => id !== store.previewTabId)
    delete store.tabsMap[store.previewTabId]
  }

  // Add new preview tab
  store.tabsMap[tab.id] = { ...tab, isPreview: true }
  store.openTabs = [...store.openTabs, tab.id]
  store.previewTabId = tab.id
  store.activeTab = tab.id
}

export const removeTab = (ref: string | undefined, id: string) => {
  const store = getTabsStore(ref)
  const idx = store.openTabs.indexOf(id)
  store.openTabs = store.openTabs.filter((tabId) => tabId !== id)
  delete store.tabsMap[id]

  if (id === store.activeTab) {
    store.activeTab = store.openTabs[idx - 1] || store.openTabs[idx + 1] || null
  }
}

export const reorderTabs = (ref: string | undefined, oldIndex: number, newIndex: number) => {
  if (!ref) return
  const store = getTabsStore(ref)
  const newOpenTabs = [...store.openTabs]
  const [removedTab] = newOpenTabs.splice(oldIndex, 1)
  newOpenTabs.splice(newIndex, 0, removedTab)
  store.openTabs = newOpenTabs
}

export const makeTabPermanent = (ref: string | undefined, tabId: string) => {
  if (!ref) return
  const store = getTabsStore(ref)
  const tab = store.tabsMap[tabId]

  if (tab?.isPreview) {
    tab.isPreview = false
    store.previewTabId = undefined
    // Add to recent items when preview tab becomes permanent
    if (tab.type !== 'new') {
      addRecentItem(tab)
    }
  }
}

export const makeActiveTabPermanent = (ref?: string) => {
  if (!ref) return false
  const store = getTabsStore(ref)

  if (store.activeTab && store.tabsMap[store.activeTab]?.isPreview) {
    makeTabPermanent(ref, store.activeTab)
    return true
  }
  return false
}

export const openNewContentTab = (ref: string) => {
  const store = getTabsStore(ref)
  const tab: Tab = {
    id: `new-${nanoid()}`,
    type: 'new',
    label: 'New',
    metadata: {},
    isPreview: false,
  }

  addTab(ref, tab)
}

export const removeNewTab = (ref: string | undefined) => {
  if (!ref) return
  const store = getTabsStore(ref)
  const newTab = Object.values(store.tabsMap).find((tab) => tab.type === 'new')
  if (newTab) {
    removeTab(ref, newTab.id)
  }
}

export const handleTabNavigation = (ref: string | undefined, id: string, router: NextRouter) => {
  if (!ref) return
  const store = getTabsStore(ref)
  const tab = store.tabsMap[id]
  if (!tab) return

  store.activeTab = id

  // Add to recent items when navigating to a non-preview, non-new tab
  if (!tab.isPreview && tab.type !== 'new') {
    addRecentItem(tab)
  }

  switch (tab.type) {
    case 'sql':
      const schema = (router.query.schema as string) || 'public'
      router.push(`/project/${router.query.ref}/sql/${tab.metadata?.sqlId}?schema=${schema}`)
      break
    case 'table':
      router.push(
        `/project/${router.query.ref}/editor/${tab.metadata?.tableId}?schema=${tab.metadata?.schema}`
      )
      break
    case 'schema':
      router.push(`/project/${router.query.ref}/explorer/schema/${tab.metadata?.schema}`)
      break
    case 'view':
      router.push(
        `/project/${router.query.ref}/explorer/views/${tab.metadata?.schema}/${tab.metadata?.name}`
      )
      break
    case 'function':
      router.push(
        `/project/${router.query.ref}/explorer/functions/${tab.metadata?.schema}/${tab.metadata?.name}`
      )
      break
    case 'new':
      router.push(`/project/${router.query.ref}/explorer/new`)
      break
  }
}

export const handleTabClose = (
  ref: string | undefined,
  id: string,
  router: NextRouter,
  onClose?: (id: string) => void,
  editor?: 'sql' | 'table'
) => {
  if (!ref) return
  const store = getTabsStore(ref)
  // tabs without the one we're closing
  const currentTab = store.tabsMap[id]
  const currentTabs = Object.values(store.tabsMap).filter((tab) => tab.id !== id)
  const nextTabId = currentTabs.filter((tab) => tab.type === editor)[0]?.id

  // console.log('Current Tab:', currentTab)
  // console.log('Current Tabs:', currentTabs)
  // console.log('Next Tab ID:', nextTabId)

  delete store.tabsMap[id]
  if (currentTab) {
    // Update store
    // If the tab being removed is logged in the store, update the open tabs
    store.openTabs = [...currentTabs.map((tab) => tab.id).filter((id) => id !== currentTab.id)]
  }

  if (store.previewTabId) {
    if (store.previewTabId === id) {
      store.previewTabId = undefined
    }
  }

  if (nextTabId) {
    store.activeTab = nextTabId
    handleTabNavigation(ref, nextTabId, router)
  } else {
    // If no tabs of same type, go to the home of the current section
    switch (currentTab.type) {
      case 'sql':
        router.push(`/project/${router.query.ref}/sql`)
        break
      case 'table':
        router.push(`/project/${router.query.ref}/editor`)
        break
      default:
        router.push(`/project/${router.query.ref}/editor`)
    }
  }

  onClose?.(id)
}

export const handleTabDragEnd = (
  ref: string | undefined,
  oldIndex: number,
  newIndex: number,
  tabId: string,
  router: any
) => {
  if (!ref) return
  const store = getTabsStore(ref)
  // Make permanent if needed
  const draggedTab = store.tabsMap[tabId]
  if (draggedTab?.isPreview) {
    makeTabPermanent(ref, tabId)
  }

  // Reorder tabs
  const newOpenTabs = [...store.openTabs]
  newOpenTabs.splice(oldIndex, 1)
  newOpenTabs.splice(newIndex, 0, tabId)

  store.openTabs = newOpenTabs
  store.activeTab = tabId

  // Handle navigation
  handleTabNavigation(ref, tabId, router)
}
type CreateTabIdParams = {
  table: {
    schema: string
    name: string
  }
  sql: {
    id: string
  }
  schema: {
    schema: string
  }
  view: never
  function: never
  new: never
}

export function createTabId<T extends TabType>(type: T, params: CreateTabIdParams[T]): string {
  switch (type) {
    case 'table':
      return `table-${(params as CreateTabIdParams['table']).schema}-${(params as CreateTabIdParams['table']).name}`
    case 'sql':
      return `sql-${(params as CreateTabIdParams['sql']).id}`
    case 'schema':
      return `schema-${(params as CreateTabIdParams['schema']).schema}`
    default:
      return ''
  }
}
