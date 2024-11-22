import { proxy, subscribe } from 'valtio'
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

const STORAGE_KEY = 'supabase_studio_tabs'

const defaultState: TabsState = {
  openTabs: [],
  activeTab: null,
  tabsMap: {},
}

const loadInitialState = (): TabsState => {
  if (typeof window === 'undefined') return defaultState

  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return defaultState

  try {
    return JSON.parse(stored)
  } catch (error) {
    console.error('Failed to parse tabs from localStorage:', error)
    return defaultState
  }
}

export const tabsStore = proxy<TabsState>(loadInitialState())

if (typeof window !== 'undefined') {
  subscribe(tabsStore, () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tabsStore))
    } catch (error) {
      console.error('Failed to save tabs to localStorage:', error)
    }
  })
}

export const getTabsStore = () => tabsStore

export const addTab = (tab: Tab) => {
  // If tab exists and is active, don't do anything
  if (tabsStore.tabsMap[tab.id] && tabsStore.activeTab === tab.id) {
    return
  }

  // If tab exists but isn't active, just make it active
  if (tabsStore.tabsMap[tab.id]) {
    tabsStore.activeTab = tab.id
    // Add to recent items when switching to existing tab
    if (!tab.isPreview && tab.type !== 'new') {
      addRecentItem(tab)
    }
    return
  }

  // If this tab should be permanent, add it normally
  if (tab.isPreview === false) {
    tabsStore.openTabs = [...tabsStore.openTabs, tab.id]
    tabsStore.tabsMap[tab.id] = tab
    tabsStore.activeTab = tab.id
    // Add to recent items when creating permanent tab
    if (tab.type !== 'new') {
      addRecentItem(tab)
    }
    return
  }

  // Remove any existing preview tab
  if (tabsStore.previewTabId) {
    tabsStore.openTabs = tabsStore.openTabs.filter((id) => id !== tabsStore.previewTabId)
    delete tabsStore.tabsMap[tabsStore.previewTabId]
  }

  // Add new preview tab
  tabsStore.tabsMap[tab.id] = { ...tab, isPreview: true }
  tabsStore.openTabs = [...tabsStore.openTabs, tab.id]
  tabsStore.previewTabId = tab.id
  tabsStore.activeTab = tab.id
}

export const removeTab = (id: string) => {
  const idx = tabsStore.openTabs.indexOf(id)
  tabsStore.openTabs = tabsStore.openTabs.filter((tabId) => tabId !== id)
  delete tabsStore.tabsMap[id]

  if (id === tabsStore.activeTab) {
    tabsStore.activeTab = tabsStore.openTabs[idx - 1] || tabsStore.openTabs[idx + 1] || null
  }
}

export const reorderTabs = (oldIndex: number, newIndex: number) => {
  const newOpenTabs = [...tabsStore.openTabs]
  const [removedTab] = newOpenTabs.splice(oldIndex, 1)
  newOpenTabs.splice(newIndex, 0, removedTab)
  tabsStore.openTabs = newOpenTabs
}

export const makeTabPermanent = (tabId: string) => {
  const tab = tabsStore.tabsMap[tabId]

  if (tab?.isPreview) {
    tab.isPreview = false
    tabsStore.previewTabId = undefined
    // Add to recent items when preview tab becomes permanent
    if (tab.type !== 'new') {
      addRecentItem(tab)
    }
  }
}

export const makeActiveTabPermanent = () => {
  if (tabsStore.activeTab && tabsStore.tabsMap[tabsStore.activeTab]?.isPreview) {
    makeTabPermanent(tabsStore.activeTab)
    return true
  }
  return false
}

export const openNewContentTab = () => {
  const tab: Tab = {
    id: `new-${nanoid()}`,
    type: 'new',
    label: 'New',
    metadata: {},
    isPreview: false,
  }

  addTab(tab)
}

export const removeNewTab = () => {
  const newTab = Object.values(tabsStore.tabsMap).find((tab) => tab.type === 'new')
  if (newTab) {
    removeTab(newTab.id)
  }
}

export const handleTabNavigation = (id: string, router: any) => {
  const tab = tabsStore.tabsMap[id]
  if (!tab) return

  tabsStore.activeTab = id

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

export const handleTabClose = (id: string, router: any, onClose?: (id: string) => void) => {
  const currentTab = tabsStore.tabsMap[id]
  const newTabs = tabsStore.openTabs.filter((tabId) => tabId !== id)
  const nextTabId = newTabs[newTabs.length - 1]
  const nextTab = nextTabId ? tabsStore.tabsMap[nextTabId] : null

  // Update store first
  tabsStore.openTabs = newTabs
  tabsStore.activeTab = nextTabId ?? null
  delete tabsStore.tabsMap[id]

  // Then handle navigation based on next tab
  if (nextTab) {
    handleTabNavigation(nextTab.id, router)
  } else {
    router.push(`/project/${router.query.ref}/explorer`)
  }

  onClose?.(id)
}

export const handleTabDragEnd = (
  oldIndex: number,
  newIndex: number,
  tabId: string,
  router: any
) => {
  // Make permanent if needed
  const draggedTab = tabsStore.tabsMap[tabId]
  if (draggedTab?.isPreview) {
    makeTabPermanent(tabId)
  }

  // Reorder tabs
  const newOpenTabs = [...tabsStore.openTabs]
  newOpenTabs.splice(oldIndex, 1)
  newOpenTabs.splice(newIndex, 0, tabId)

  tabsStore.openTabs = newOpenTabs
  tabsStore.activeTab = tabId

  // Handle navigation
  handleTabNavigation(tabId, router)
}
