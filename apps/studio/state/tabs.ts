import { proxy } from 'valtio'
import { ReactNode } from 'react'

export type TabType = 'schema' | 'sql' | 'table' | 'view' | 'function'

interface TableMetadata {
  schema: string
  tableId: number
}

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
}

interface TabsState {
  openTabs: string[]
  activeTab: string
  tabsMap: Record<string, Tab>
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
  if (!store.tabsMap[tab.id]) {
    store.openTabs = [...store.openTabs, tab.id]
    store.tabsMap[tab.id] = tab
  }
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
