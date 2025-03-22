import { partition } from 'lodash'
import { proxy, subscribe } from 'valtio'
import { editorEntityTypes, Tab, TabType } from './tabs'

/**
 * [TODO REFACTOR] Joshen: JFYI this differs from the way that we usually write our stores
 * where we have contexts and such - ideally we need to refactor this for consistency
 * and the main benefit from our usual way of writing stores is that we do not need to pass
 * in the project ref to all the functions, as the stores are written to be scoped to the project
 *
 * So do not use this as reference for writing new valtio stores - refer to database-selector instead
 */

// Define the key for storing recent items in localStorage
const RECENT_ITEMS_KEY = 'supabase_recent_items'
// Define the maximum number of recent items to store
const MAX_RECENT_ITEMS = 8

const getStorageKey = (ref: string) => `${RECENT_ITEMS_KEY}_${ref}`

// Define the structure of a recent item
export interface RecentItem {
  id: string // Unique identifier for the item
  type: TabType // Type of the tab (e.g., sql, table)
  label: string // Label for the item
  timestamp: number // Timestamp of when the item was added
  metadata?: {
    // Optional metadata associated with the item
    schema?: string // Schema name (if applicable)
    name?: string // Name of the item (if applicable)
    tableId?: number // Table ID (if applicable)
    sqlId?: string // SQL ID (if applicable)
  }
}

// Define the structure of the recent items state
interface RecentItems {
  items: RecentItem[] // Each project just has an array of items
}

interface RecentItemsStore {
  [key: string]: RecentItems // Removed | undefined since we always initialize it
}

const defaultState: RecentItems = {
  items: [],
}

export const recentItemsStore = proxy<RecentItemsStore>({})

export const getRecentItemsStore = (ref: string | undefined): RecentItems => {
  if (!ref) return proxy(defaultState)
  if (!recentItemsStore[ref]) {
    const stored = localStorage.getItem(getStorageKey(ref))
    console.debug('[Recent Items] Loading stored items:', stored)

    try {
      const parsed = stored ? JSON.parse(stored) : defaultState
      // Validate the shape of the data
      if (!parsed.items || !Array.isArray(parsed.items)) {
        console.warn('[Recent Items] Invalid stored data, using default')
        recentItemsStore[ref] = proxy({ ...defaultState })
      } else {
        recentItemsStore[ref] = proxy(parsed)
      }
    } catch (error) {
      console.error('[Recent Items] Failed to parse stored items:', error)
      recentItemsStore[ref] = proxy({ ...defaultState })
    }
  }

  return recentItemsStore[ref]
}

// Subscribe to changes for each ref and save to localStorage
if (typeof window !== 'undefined') {
  subscribe(recentItemsStore, () => {
    Object.entries(recentItemsStore).forEach(([ref, state]) => {
      try {
        localStorage.setItem(getStorageKey(ref), JSON.stringify(state))
      } catch (error) {
        console.error('Failed to save recent items to localStorage:', error)
      }
    })
  })
}

// Function to add a recent item
export const addRecentItem = (ref: string | undefined, tab: Tab) => {
  if (!ref) return
  const store = getRecentItemsStore(ref)
  // Check if an item with the same ID already exists
  const existingItem = store.items.find((item) => item.id === tab.id)

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
  store.items.unshift(recentItem)

  // Ensure that there's only up to max of MAX_RECENT_ITEMS items per tab type
  const [itemsOfSameType, itemsOfDifferentType] = partition(store.items, (item) => {
    if (editorEntityTypes.table.includes(item.type)) return item
  })
  store.items = [...itemsOfSameType.slice(0, MAX_RECENT_ITEMS), ...itemsOfDifferentType]
}

// Function to clear all recent items
export const clearRecentItems = (ref: string | undefined) => {
  if (!ref) return
  const store = getRecentItemsStore(ref)
  store.items = [] // Set items to an empty array
}

// Function to remove a specific recent item by its ID
export const removeRecentItem = (ref: string | undefined, itemId: string) => {
  if (!ref) return
  const store = getRecentItemsStore(ref)
  store.items = store.items.filter((item) => item.id !== itemId)
}

// Function to remove multiple recent items by their IDs
export const removeRecentItems = (ref: string | undefined, itemIds: string[]) => {
  if (!ref) return
  const store = getRecentItemsStore(ref)
  store.items = store.items.filter((item) => !itemIds.includes(item.id))
}

// Function to remove recent items by their type
export const removeRecentItemsByType = (ref: string | undefined, type: TabType) => {
  if (!ref) return
  const store = getRecentItemsStore(ref)
  store.items = store.items.filter((item) => item.type !== type)
}

// Function to get all recent items
export const getRecentItems = (ref: string | undefined) => {
  if (!ref) return
  const store = getRecentItemsStore(ref)
  return store.items
}

// Function to get recent items by their type
export const getRecentItemsByType = (ref: string | undefined, type: TabType) => {
  if (!ref) return
  const store = getRecentItemsStore(ref)
  return store.items.filter((item) => item.type === type)
}
