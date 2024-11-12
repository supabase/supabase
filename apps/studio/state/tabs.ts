import { proxy } from 'valtio'
import { ReactNode } from 'react'
import { nanoid } from 'nanoid'

export type TabType = 'table' | 'schema' | 'sql' | 'view' | 'function'

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
    return
  }

  // If this tab should be permanent, add it normally
  if (tab.isPreview === false) {
    store.openTabs = [...store.openTabs, tab.id]
    store.tabsMap[tab.id] = tab
    store.activeTab = tab.id
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
