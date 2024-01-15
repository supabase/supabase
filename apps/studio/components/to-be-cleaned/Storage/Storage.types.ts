export interface StorageColumn {
  id: string
  name: string
  status: string
  items: StorageItem[]
  hasMoreItems: boolean
  isLoadingMoreItems: boolean
}

export interface StorageItem {
  id: string | null
  name: string
  type: string
  status: string
  metadata: StorageItemMetadata | null
  isCorrupted: boolean
  created_at: string | null
  updated_at: string | null
  last_accessed_at: string | null
}

export interface StorageItemMetadata {
  cacheControl: string
  contentLength: number
  size: number
  httpStatusCode: number
  eTag: string
  lastModified: string
  mimetype: string
}
