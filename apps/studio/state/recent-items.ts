// Import necessary functions from valtio for state management
import { proxy, subscribe } from 'valtio'
// Import Tab and TabType types for defining recent items
import { Tab, TabType } from './tabs'

// Define the key for storing recent items in localStorage
const RECENT_ITEMS_KEY = 'supabase_recent_items'
// Define the maximum number of recent items to store
const MAX_RECENT_ITEMS = 8

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
interface RecentItemsState {
  items: RecentItem[] // Array of recent items
}

// Default state for recent items
const defaultState: RecentItemsState = {
  items: [], // Initialize with an empty array
}

// Load initial state from localStorage
const loadInitialState = (): RecentItemsState => {
  // Check if running in a browser environment
  if (typeof window === 'undefined') return defaultState

  // Retrieve stored recent items from localStorage
  const stored = localStorage.getItem(RECENT_ITEMS_KEY)
  if (!stored) return defaultState // Return default state if nothing is stored

  try {
    // Parse and return the stored items
    return JSON.parse(stored)
  } catch (error) {
    // Log error if parsing fails
    console.error('Failed to parse recent items from localStorage:', error)
    return defaultState // Return default state on error
  }
}

// Create a proxy store for recent items state
export const recentItemsStore = proxy<RecentItemsState>(loadInitialState())

// Subscribe to changes in the store and save to localStorage
if (typeof window !== 'undefined') {
  // Function to save current state to localStorage
  const saveToStorage = () => {
    try {
      // Save the recent items as a JSON string
      localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(recentItemsStore))
    } catch (error) {
      // Log error if saving fails
      console.error('Failed to save recent items to localStorage:', error)
    }
  }

  // Use a debounced version to avoid too many writes to localStorage
  let timeout: NodeJS.Timeout
  const debouncedSave = () => {
    clearTimeout(timeout) // Clear previous timeout
    timeout = setTimeout(saveToStorage, 1000) // Set new timeout
  }

  // Subscribe to changes in the recent items store
  subscribe(recentItemsStore, () => {
    debouncedSave() // Call the debounced save function on changes
  })
}

// Function to add a recent item
export const addRecentItem = (tab: Tab) => {
  // Check if an item with the same ID already exists
  const existingItem = recentItemsStore.items.find((item) => item.id === tab.id)

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
  recentItemsStore.items = recentItemsStore.items.filter((existingItem) => {
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
  recentItemsStore.items.unshift(recentItem)
}

// Function to clear all recent items
export const clearRecentItems = () => {
  recentItemsStore.items = [] // Set items to an empty array
}

// Function to remove a specific recent item by its ID
export const removeRecentItem = (itemId: string) => {
  recentItemsStore.items = recentItemsStore.items.filter((item) => item.id !== itemId)
}

// Function to remove multiple recent items by their IDs
export const removeRecentItems = (itemIds: string[]) => {
  recentItemsStore.items = recentItemsStore.items.filter((item) => !itemIds.includes(item.id))
}

// Function to remove recent items by their type
export const removeRecentItemsByType = (type: TabType) => {
  recentItemsStore.items = recentItemsStore.items.filter((item) => item.type !== type)
}

// Function to get all recent items
export const getRecentItems = () => {
  return recentItemsStore.items
}

// Function to get recent items by their type
export const getRecentItemsByType = (type: TabType) => {
  return recentItemsStore.items.filter((item) => item.type === type)
}
