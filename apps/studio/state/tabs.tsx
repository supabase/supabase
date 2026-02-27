import { useParams } from 'common'
import { partition } from 'lodash'
import { type NextRouter } from 'next/router'
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react'
import { proxy, subscribe, useSnapshot } from 'valtio'

import { buildTableEditorUrl } from '@/components/grid/SupabaseGrid.utils'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'

export const editorEntityTypes = {
  table: ['r', 'v', 'm', 'f', 'p'],
  sql: ['sql'],
}

export type TabType = ENTITY_TYPE | 'sql'

type CreateTabIdParams = {
  r: { id: number }
  v: { id: number }
  m: { id: number }
  f: { id: number }
  p: { id: number }
  sql: { id: string }
  schema: { schema: string }
  view: never
  function: never
  new: never
}

export interface Tab {
  id: string
  type: TabType
  label?: string
  metadata?: {
    schema?: string
    name?: string
    tableId?: number
    sqlId?: string
    scrollTop?: number
  }
  isPreview?: boolean
  createdAt?: Date
  updatedAt?: Date
}

const MAX_RECENT_ITEMS = 8

export interface RecentItem {
  id: string
  type: TabType
  label: string
  timestamp: number
  metadata?: {
    schema?: string
    name?: string
    tableId?: number
    sqlId?: string
  }
}

const RECENT_ITEMS_STORAGE_KEY = 'supabase_recent_items'
const getRecentItemsStorageKey = (ref: string) => `${RECENT_ITEMS_STORAGE_KEY}_${ref}`

function getSavedRecentItems(ref: string): RecentItem[] {
  if (typeof window === 'undefined' || !ref) return []

  const stored = localStorage.getItem(getRecentItemsStorageKey(ref))

  try {
    return JSON.parse(stored ?? '{"items": []}').items
  } catch (error) {
    return []
  }
}

const DEFAULT_TABS_STATE = {
  activeTab: null as string | null,
  openTabs: [] as string[],
  tabsMap: {} as Record<string, Tab>,
  previewTabId: undefined as string | undefined,
  recentItems: [],
}
const TABS_STORAGE_KEY = 'supabase_studio_tabs'
const getTabsStorageKey = (ref: string) => `${TABS_STORAGE_KEY}_${ref}`

function getSavedTabs(ref: string) {
  if (typeof window === 'undefined' || !ref) return DEFAULT_TABS_STATE

  const stored = localStorage.getItem(getTabsStorageKey(ref))

  if (!stored) return DEFAULT_TABS_STATE

  try {
    const parsed = JSON.parse(
      stored ?? JSON.stringify(DEFAULT_TABS_STATE)
    ) as typeof DEFAULT_TABS_STATE

    if (
      !parsed.openTabs ||
      !Array.isArray(parsed.openTabs) ||
      !parsed.tabsMap ||
      typeof parsed.tabsMap !== 'object'
    ) {
      return DEFAULT_TABS_STATE
    }

    return parsed
  } catch (error) {
    return DEFAULT_TABS_STATE
  }
}

function createTabsState(projectRef: string) {
  const recentItems = getSavedRecentItems(projectRef)
  const { openTabs, activeTab, tabsMap, previewTabId } = getSavedTabs(projectRef)

  const store = proxy({
    // RECENT ITEMS
    recentItems,

    addRecentItem: (tab: Tab) => {
      // Check if an item with the same ID already exists
      const existingItem = store.recentItems.find((item) => item.id === tab.id)

      if (existingItem) {
        // If it exists, update its timestamp
        existingItem.timestamp = Date.now()
        return // Exit the function
      }

      // If it doesn't exist, create and add a new item
      const recentItem: RecentItem = {
        id: tab.id, // Set the ID
        type: tab.type, // Set the type
        label: tab.label || 'Untitled', // Set the label or default to 'Untitled'
        timestamp: Date.now(), // Set the current timestamp
        metadata: tab.metadata, // Set the metadata
      }

      // Add the new recent item to the beginning of the list
      store.recentItems.unshift(recentItem)

      // Ensure that there's only up to max of MAX_RECENT_ITEMS items per tab type
      const [itemsOfSameType, itemsOfDifferentType] = partition(store.recentItems, (item) => {
        if (editorEntityTypes.table.includes(item.type)) return item
      })
      store.recentItems = [...itemsOfSameType.slice(0, MAX_RECENT_ITEMS), ...itemsOfDifferentType]
    },
    clearRecentItems: () => {
      store.recentItems = []
    },
    removeRecentItem: (itemId: string) => {
      store.recentItems = store.recentItems.filter((item) => item.id !== itemId)
    },
    removeRecentItems: (itemIds: string[]) => {
      store.recentItems = store.recentItems.filter((item) => !itemIds.includes(item.id))
    },
    removeRecentItemsByType: (type: TabType) => {
      store.recentItems = store.recentItems.filter((item) => item.type !== type)
    },

    getRecentItemsByType: (type: TabType) => {
      return store.recentItems.filter((item) => item.type === type)
    },

    // TABS
    activeTab,
    openTabs,
    tabsMap,
    previewTabId,

    hasTab: (id: string) => {
      return !!store.tabsMap[id]
    },
    addTab: (tab: Tab) => {
      // If tab exists and is active, don't do anything
      if (store.tabsMap[tab.id] && store.activeTab === tab.id) {
        return
      }

      // If tab exists but isn't active, just make it active
      if (store.tabsMap[tab.id]) {
        store.activeTab = tab.id
        if (!tab.isPreview) store.addRecentItem(tab)
        return
      }

      // If this tab should be permanent, add it normally
      if (tab.isPreview === false) {
        store.openTabs = [...store.openTabs, tab.id]
        store.tabsMap[tab.id] = tab
        store.activeTab = tab.id
        // Add to recent items when creating permanent tab
        store.addRecentItem(tab)
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
    },
    updateTab: (id: string, updates: { label?: string; scrollTop?: number }) => {
      if (!!store.tabsMap[id]) {
        if ('label' in updates) {
          store.tabsMap[id].label = updates.label
        }
        if ('scrollTop' in updates && store.tabsMap[id].metadata) {
          store.tabsMap[id].metadata.scrollTop = updates.scrollTop
        }
      }
    },
    // Function to remove a tab from the store
    // this is used for removing tabs from the localstorage state
    // for handling a manual tab removal with a close action, use handleTabClose()
    removeTab: (id: string) => {
      const idx = store.openTabs.indexOf(id)
      store.openTabs = store.openTabs.filter((tabId) => tabId !== id)
      delete store.tabsMap[id]

      // Update active tab if the removed tab was active
      if (id === store.activeTab) {
        store.activeTab = store.openTabs[idx - 1] || store.openTabs[idx + 1] || null
      }
    },

    // Function to remove multiple tabs from the store
    // this is used for removing tabs from the localstorage state
    // for handling a manual tab removal with a close action, use handleTabClose()
    removeTabs: (ids: string[]) => {
      if (!ids.length) return

      ids.forEach((id) => store.removeTab(id))
    },
    reorderTabs: (oldIndex: number, newIndex: number) => {
      const newOpenTabs = [...store.openTabs]
      const [removedTab] = newOpenTabs.splice(oldIndex, 1)
      newOpenTabs.splice(newIndex, 0, removedTab)
      store.openTabs = newOpenTabs
    },
    makeTabActive: (tabId: string) => {
      const tab = store.tabsMap[tabId]
      if (!tab) return
      store.activeTab = tab.id
    },
    makeTabPermanent: (tabId: string) => {
      const tab = store.tabsMap[tabId]

      if (tab?.isPreview) {
        tab.isPreview = false
        store.previewTabId = undefined
        // Add to recent items when preview tab becomes permanent
        store.addRecentItem(tab)
      }
    },
    makeActiveTabPermanent: () => {
      if (store.activeTab && store.tabsMap[store.activeTab]?.isPreview) {
        store.makeTabPermanent(store.activeTab)
        return true
      }
      return false
    },

    // TABS HANDLERS

    handleTabNavigation: (id: string, router: NextRouter) => {
      const tab = store.tabsMap[id]
      if (!tab) return

      store.activeTab = id

      // Add to recent items when navigating to a non-preview, non-new tab
      if (!tab.isPreview) store.addRecentItem(tab)

      switch (tab.type) {
        case 'sql':
          const schema = (router.query.schema as string) || 'public'
          router.push(`/project/${router.query.ref}/sql/${tab.metadata?.sqlId}?schema=${schema}`)
          break
        case 'r':
        case 'v':
        case 'm':
        case 'f':
        case 'p':
          router.push(
            buildTableEditorUrl({
              projectRef: router.query.ref as string,
              tableId: tab.metadata?.tableId!,
              schema: tab.metadata?.schema,
            })
          )
          break
      }
    },
    handleTabClose: ({
      id,
      router,
      editor,
      onClose,
      onClearDashboardHistory,
    }: {
      id: string
      router: NextRouter
      editor?: 'sql' | 'table'
      onClose?: (id: string) => void
      onClearDashboardHistory: () => void
    }) => {
      const tabBeingClosed = store.tabsMap[id]

      const editorTabIds = (
        editor
          ? Object.values(store.tabsMap).filter((tab) =>
              editorEntityTypes[editor]?.includes(tab.type)
            )
          : []
      ).map((tab) => tab.id)
      const tabIndexBeingClosed = editorTabIds.indexOf(id)
      const isLastTabBeingClosed = tabIndexBeingClosed === editorTabIds.length - 1
      const nextTabId =
        editorTabIds.length === 1
          ? undefined
          : isLastTabBeingClosed
            ? editorTabIds[tabIndexBeingClosed - 1]
            : editorTabIds[tabIndexBeingClosed + 1]

      const { [id]: value, ...otherTabs } = store.tabsMap
      store.tabsMap = otherTabs

      if (tabBeingClosed) {
        const updatedOpenTabs = [...store.openTabs].filter((x) => x !== id)
        store.openTabs = updatedOpenTabs
      }

      // Remove the preview tab if it matches the tab being closed
      if (store.previewTabId === id) {
        store.previewTabId = undefined
      }

      // [Joshen] Only navigate away if we're closing the tab that's currently in focus
      if (store.activeTab === id || id === 'new') {
        if (nextTabId) {
          store.activeTab = nextTabId
          store.handleTabNavigation(nextTabId, router)
        } else {
          onClearDashboardHistory()

          // If no tabs of same type, go to the home of the current section
          switch (tabBeingClosed?.type) {
            case 'sql':
              router.push(`/project/${router.query.ref}/sql`)
              break
            case 'r':
            case 'v':
            case 'm':
            case 'f':
            case 'p':
              router.push(`/project/${router.query.ref}/editor`)
              break
            default:
              router.push(`/project/${router.query.ref}/${editor === 'table' ? 'editor' : 'sql'}`)
          }
        }
      }

      onClose?.(id)
    },
    handleTabCloseAll: ({
      editor,
      router,
      onClearDashboardHistory,
    }: {
      editor: 'sql' | 'table'
      router: NextRouter
      onClearDashboardHistory: () => void
    }) => {
      const tabsToClose =
        editor === 'table'
          ? store.openTabs.filter((x) => !x.startsWith('sql'))
          : store.openTabs.filter((x) => x.startsWith('sql'))
      store.removeTabs(tabsToClose)
      onClearDashboardHistory()
      router.push(`/project/${router.query.ref}/${editor === 'table' ? 'editor' : 'sql'}`)
    },
    handleTabDragEnd: (oldIndex: number, newIndex: number, tabId: string, router: NextRouter) => {
      // Make permanent if needed
      const draggedTab = store.tabsMap[tabId]
      if (draggedTab?.isPreview) {
        store.makeTabPermanent(tabId)
      }

      // Reorder tabs
      const newOpenTabs = [...store.openTabs]
      newOpenTabs.splice(oldIndex, 1)
      newOpenTabs.splice(newIndex, 0, tabId)

      store.openTabs = newOpenTabs
      store.activeTab = tabId

      // Handle navigation
      store.handleTabNavigation(tabId, router)
    },
  })

  return store
}

export type TabsState = ReturnType<typeof createTabsState>

export const TabsStateContext = createContext<TabsState>(createTabsState(''))

export const TabsStateContextProvider = ({ children }: PropsWithChildren) => {
  const { ref: projectRef } = useParams()
  const [state, setState] = useState(createTabsState(projectRef ?? ''))

  useEffect(() => {
    if (typeof window !== 'undefined' && !!projectRef) {
      setState(createTabsState(projectRef ?? ''))
    }
  }, [projectRef])

  useEffect(() => {
    if (typeof window !== 'undefined' && projectRef) {
      return subscribe(state, () => {
        localStorage.setItem(
          getTabsStorageKey(projectRef),
          JSON.stringify({
            activeTab: state.activeTab,
            openTabs: state.openTabs,
            tabsMap: state.tabsMap,
            previewTabId: state.previewTabId,
          })
        )
        localStorage.setItem(
          getRecentItemsStorageKey(projectRef),
          JSON.stringify({
            items: state.recentItems,
          })
        )
      })
    }
  }, [projectRef, state])

  return <TabsStateContext.Provider value={state}>{children}</TabsStateContext.Provider>
}

export const useTabsStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) => {
  const state = useContext(TabsStateContext)
  return useSnapshot(state, options)
}

export function createTabId<T extends TabType>(type: T, params: CreateTabIdParams[T]): string {
  switch (type) {
    case 'r':
      return `r-${(params as CreateTabIdParams['r']).id}`
    case 'v':
      return `v-${(params as CreateTabIdParams['v']).id}`
    case 'm':
      return `m-${(params as CreateTabIdParams['m']).id}`
    case 'f':
      return `f-${(params as CreateTabIdParams['f']).id}`
    case 'p':
      return `p-${(params as CreateTabIdParams['p']).id}`
    case 'sql':
      return `sql-${(params as CreateTabIdParams['sql']).id}`
    default:
      return ''
  }
}
