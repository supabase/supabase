import { atomWithStorage } from 'jotai/utils'

export type TabType = 'schema' | 'sql' | 'table' | 'view' | 'function'

interface TableMetadata {
  schema: string
  tableId: number // This is the numeric ID used in the URL
}

export interface Tab {
  id: string
  type: TabType
  label: string
  icon?: React.ReactNode
  metadata?: {
    schema?: string
    name?: string
    tableId?: number // Add this for table IDs
    sqlId?: string // Add this for SQL snippets
  }
}

interface TabsState {
  openTabs: string[]
  activeTab: string | null
  tabsMap: Record<string, Tab>
}

const defaultState: TabsState = {
  openTabs: [],
  activeTab: null,
  tabsMap: {},
}

// Store map to keep track of created atoms
const tabsStoreMap = new Map<string, ReturnType<typeof atomWithStorage<TabsState>>>()

// Helper to get or create atom for a specific key
export const getTabsStore = (key: string) => {
  if (!tabsStoreMap.has(key)) {
    tabsStoreMap.set(key, atomWithStorage<TabsState>(`supabase_${key}_tabs`, defaultState))
  }
  return tabsStoreMap.get(key)!
}

// Add helper function to manage tabs
export const addTab = (
  setTabsState: (update: (prev: TabsState) => TabsState) => void,
  newTab: Tab
) => {
  setTabsState((prev) => {
    // Check if tab already exists
    if (prev.openTabs.includes(newTab.id)) {
      // If it exists, just make it active
      return {
        ...prev,
        activeTab: newTab.id,
      }
    }

    // If it doesn't exist, add it and make it active
    return {
      ...prev,
      openTabs: [...prev.openTabs, newTab.id],
      activeTab: newTab.id,
      tabsMap: {
        ...prev.tabsMap,
        [newTab.id]: newTab,
      },
    }
  })
}
