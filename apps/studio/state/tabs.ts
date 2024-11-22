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

export const handleTabNavigation = (id: string, router: NextRouter) => {
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

export const handleTabClose = (
  id: string,
  router: NextRouter,
  onClose?: (id: string) => void,
  editor?: 'sql' | 'table'
) => {
  // tabs without the one we're closing
  const currentTab = tabsStore.tabsMap[id]
  const currentTabs = Object.values(tabsStore.tabsMap).filter((tab) => tab.id !== id)
  const nextTabId = currentTabs.filter((tab) => tab.type === editor)[0]?.id

  // console.log('Current Tab:', currentTab)
  // console.log('Current Tabs:', currentTabs)
  // console.log('Next Tab ID:', nextTabId)

  delete tabsStore.tabsMap[id]
  if (currentTab) {
    // Update store
    // If the tab being removed is logged in the store, update the open tabs
    tabsStore.openTabs = [...currentTabs.map((tab) => tab.id).filter((id) => id !== currentTab.id)]
  }

  if (nextTabId) {
    tabsStore.activeTab = nextTabId
    handleTabNavigation(nextTabId, router)
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
