import { proxy } from 'valtio'
import { ReactNode } from 'react'
import { nanoid } from 'nanoid'
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

type TabStore = ReturnType<typeof proxy<TabsState>>

const defaultState: TabsState = {
  openTabs: [],
  activeTab: null,
  tabsMap: {},
}

const tabsStoreMap = new Map<string, TabStore>()

export const getTabsStore = (key: string): TabStore => {
  if (!tabsStoreMap.has(key)) {
    tabsStoreMap.set(key, proxy<TabsState>(defaultState))
  }
  return tabsStoreMap.get(key)!
}

export const addTab = (storeKey: string, tab: Tab) => {
  const store = getTabsStore(storeKey)

  // If tab exists and is active, don't do anything
  if (store.tabsMap[tab.id] && store.activeTab === tab.id) {
    return
  }

  // If tab exists but isn't active, just make it active
  if (store.tabsMap[tab.id]) {
    store.activeTab = tab.id
    // Add to recent items when switching to existing tab
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

export const removeTab = (storeKey: string, id: string) => {
  const store = getTabsStore(storeKey)
  const idx = store.openTabs.indexOf(id)
  store.openTabs = store.openTabs.filter((tabId) => tabId !== id)
  delete store.tabsMap[id]

  if (id === store.activeTab) {
    store.activeTab = store.openTabs[idx - 1] || store.openTabs[idx + 1] || null
  }
}

export const reorderTabs = (storeKey: string, oldIndex: number, newIndex: number) => {
  const newOpenTabs = [...getTabsStore(storeKey).openTabs]
  const [removedTab] = newOpenTabs.splice(oldIndex, 1)
  newOpenTabs.splice(newIndex, 0, removedTab)
  getTabsStore(storeKey).openTabs = newOpenTabs
}

export const makeTabPermanent = (storeKey: string, tabId: string) => {
  const store = getTabsStore(storeKey)
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

export const makeActiveTabPermanent = (storeKey: string) => {
  const store = getTabsStore(storeKey)
  if (store.activeTab && store.tabsMap[store.activeTab]?.isPreview) {
    makeTabPermanent(storeKey, store.activeTab)
    return true
  }
  return false
}

export const openNewContentTab = (storeKey: string) => {
  const tab: Tab = {
    id: `new-${nanoid()}`,
    type: 'new',
    label: 'New',
    metadata: {},
    isPreview: false,
  }

  addTab(storeKey, tab)
}

export const removeNewTab = (storeKey: string) => {
  const store = getTabsStore(storeKey)
  const newTab = Object.values(store.tabsMap).find((tab) => tab.type === 'new')
  if (newTab) {
    removeTab(storeKey, newTab.id)
  }
}

export const handleTabNavigation = (storeKey: string, id: string, router: any) => {
  const store = getTabsStore(storeKey)
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
  storeKey: string,
  id: string,
  router: any,
  onClose?: (id: string) => void
) => {
  const store = getTabsStore(storeKey)
  const currentTab = store.tabsMap[id]
  const newTabs = store.openTabs.filter((tabId) => tabId !== id)
  const nextTabId = newTabs[newTabs.length - 1]
  const nextTab = nextTabId ? store.tabsMap[nextTabId] : null

  // Update store first
  store.openTabs = newTabs
  store.activeTab = nextTabId ?? null
  delete store.tabsMap[id]

  // Then handle navigation based on next tab
  if (nextTab) {
    handleTabNavigation(storeKey, nextTab.id, router)
  } else {
    router.push(`/project/${router.query.ref}/explorer`)
  }

  onClose?.(id)
}

export const handleTabDragEnd = (
  storeKey: string,
  oldIndex: number,
  newIndex: number,
  tabId: string,
  router: any
) => {
  const store = getTabsStore(storeKey)

  // Make permanent if needed
  const draggedTab = store.tabsMap[tabId]
  if (draggedTab?.isPreview) {
    makeTabPermanent(storeKey, tabId)
  }

  // Reorder tabs
  const newOpenTabs = [...store.openTabs]
  newOpenTabs.splice(oldIndex, 1)
  newOpenTabs.splice(newIndex, 0, tabId)

  store.openTabs = newOpenTabs
  store.activeTab = tabId

  // Handle navigation
  handleTabNavigation(storeKey, tabId, router)
}
