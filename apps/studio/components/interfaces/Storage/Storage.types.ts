import type { PolicyFormField } from 'components/interfaces/Auth/Policies/Policies.types'
import { STORAGE_ROW_STATUS, STORAGE_ROW_TYPES } from './Storage.constants'

export interface StoragePolicyFormField extends PolicyFormField {
  allowedOperations: string[]
}

export interface BucketUpdatePayload {
  public?: boolean
  file_size_limit?: number | null
  allowed_mime_types?: string[] | null
}

export interface BucketCreatePayload extends BucketUpdatePayload {
  id: string
  name?: string
}

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
  created_at: string | null
  updated_at: string | null
  last_accessed_at: string | null
  // UI specific properties, not from API
  isCorrupted: boolean
  path?: string
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
