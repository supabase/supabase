import { STORAGE_ROW_STATUS, STORAGE_ROW_TYPES } from './Storage.constants'

export interface StorageColumn {
  id: string | null
  name: string
  status: string
  items: StorageItem[]
  hasMoreItems?: boolean
  isLoadingMoreItems?: boolean
}

export interface StorageItem {
  id: string | null
  name: string
  type: STORAGE_ROW_TYPES
  status: STORAGE_ROW_STATUS
  metadata: StorageItemMetadata | null
  isCorrupted: boolean
  created_at: string | null
  updated_at: string | null
  last_accessed_at: string | null
}

export type StorageItemWithColumn = StorageItem & { columnIndex: number }

export interface StorageItemMetadata {
  cacheControl: string
  contentLength: number
  size: number
  httpStatusCode: number
  eTag: string
  lastModified: string
  mimetype: string
}
