// Import necessary functions from valtio for state management
import { proxy, subscribe } from 'valtio'
// Import Tab and TabType types for defining recent items
import { Tab, TabType } from './tabs'

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

// Load initial state from localStorage
// const loadInitialState = (ref: string | undefined): RecentItemsState => {
//   // Check if running in a browser environment
//   if (typeof window === 'undefined') return defaultState

//   // Retrieve stored recent items from localStorage
//   const stored = localStorage.getItem(getStorageKey(ref))
//   if (!stored) return defaultState // Return default state if nothing is stored

//   try {
//     // Parse and return the stored items
//     return JSON.parse(stored)
//   } catch (error) {
//     // Log error if parsing fails
//     console.error('Failed to parse recent items from localStorage:', error)
//     return defaultState // Return default state on error
//   }
// }
export const recentItemsStore = proxy<RecentItemsStore>({})

export const getRecentItemsStore = (ref: string | undefined): RecentItems => {
  if (!ref) return proxy(defaultState)
  if (!recentItemsStore[ref]) {
    const stored = localStorage.getItem(getStorageKey(ref))
    recentItemsStore[ref] = proxy(stored ? JSON.parse(stored) : { ...defaultState })
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

// Create a proxy store for recent items state

// Subscribe to changes in the store and save to localStorage
// if (typeof window !== 'undefined') {
//   // Function to save current state to localStorage
//   const saveToStorage = () => {
//     try {
//       // Save the recent items as a JSON string
//       localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(recentItemsStore))
//     } catch (error) {
//       // Log error if saving fails
//       console.error('Failed to save recent items to localStorage:', error)
//     }
//   }

//   // Use a debounced version to avoid too many writes to localStorage
//   let timeout: NodeJS.Timeout
//   const debouncedSave = () => {
//     clearTimeout(timeout) // Clear previous timeout
//     timeout = setTimeout(saveToStorage, 1000) // Set new timeout
//   }

//   // Subscribe to changes in the recent items store
//   subscribe(recentItemsStore, () => {
//     debouncedSave() // Call the debounced save function on changes
//   })
// }

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

  // Remove any existing instance of this item based on type and metadata
  store.items = store.items.filter((existingItem) => {
    if (existingItem.type !== recentItem.type) return true // Keep items of different types

    // Check for duplicates based on type-specific metadata
    switch (recentItem.type) {
      case 'sql':
        return existingItem.metadata?.sqlId !== recentItem.metadata?.sqlId // Check SQL ID
      case 'r':
      case 'v':
      case 'm':
      case 'f':
      case 'p':
        return existingItem.metadata?.tableId !== recentItem.metadata?.tableId // Check Table ID
      case 'schema':
        return existingItem.metadata?.schema !== recentItem.metadata?.schema // Check Schema
      default:
        return true // Keep items of unknown type
    }
  })

  // Add the new recent item to the beginning of the list
  store.items.unshift(recentItem)
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
