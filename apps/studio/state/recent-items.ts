import { proxy, subscribe } from 'valtio'
import { Tab, TabType } from './tabs'

const RECENT_ITEMS_KEY = 'supabase_recent_items'
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

interface RecentItemsState {
  items: RecentItem[]
}

const defaultState: RecentItemsState = {
  items: [],
}

// Load initial state from localStorage
const loadInitialState = (): RecentItemsState => {
  if (typeof window === 'undefined') return defaultState

  const stored = localStorage.getItem(RECENT_ITEMS_KEY)
  if (!stored) return defaultState

  try {
    return JSON.parse(stored)
  } catch (error) {
    console.error('Failed to parse recent items from localStorage:', error)
    return defaultState
  }
}

export const recentItemsStore = proxy<RecentItemsState>(loadInitialState())

// Subscribe to changes and save to localStorage
if (typeof window !== 'undefined') {
  const saveToStorage = () => {
    try {
      localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(recentItemsStore))
    } catch (error) {
      console.error('Failed to save recent items to localStorage:', error)
    }
  }

  // Use a debounced version to avoid too many writes
  let timeout: NodeJS.Timeout
  const debouncedSave = () => {
    clearTimeout(timeout)
    timeout = setTimeout(saveToStorage, 1000)
  }

  // Subscribe to changes using valtio's subscribe
  subscribe(recentItemsStore, () => {
    debouncedSave()
  })
}

export const addRecentItem = (tab: Tab) => {
  const recentItem: RecentItem = {
    id: tab.id,
    type: tab.type,
    label: tab.label || 'Untitled',
    timestamp: Date.now(),
    metadata: tab.metadata,
  }

  // Remove any existing instance of this item (based on type and metadata)
  recentItemsStore.items = recentItemsStore.items.filter((existingItem) => {
    if (existingItem.type !== recentItem.type) return true

    switch (recentItem.type) {
      case 'sql':
        return existingItem.metadata?.sqlId !== recentItem.metadata?.sqlId
      case 'table':
        return existingItem.metadata?.tableId !== recentItem.metadata?.tableId
      case 'schema':
        return existingItem.metadata?.schema !== recentItem.metadata?.schema
      case 'view':
        return !(
          existingItem.metadata?.schema === recentItem.metadata?.schema &&
          existingItem.metadata?.name === recentItem.metadata?.name
        )
      case 'function':
        return !(
          existingItem.metadata?.schema === recentItem.metadata?.schema &&
          existingItem.metadata?.name === recentItem.metadata?.name
        )
      default:
        return true
    }
  })

  // Add new item at the start
  recentItemsStore.items = [recentItem, ...recentItemsStore.items].slice(0, MAX_RECENT_ITEMS)
}

export const clearRecentItems = () => {
  recentItemsStore.items = []
}

export const removeRecentItem = (itemId: string) => {
  recentItemsStore.items = recentItemsStore.items.filter((item) => item.id !== itemId)
}

export const getRecentItems = () => {
  return recentItemsStore.items
}

export const getRecentItemsByType = (type: TabType) => {
  return recentItemsStore.items.filter((item) => item.type === type)
}
