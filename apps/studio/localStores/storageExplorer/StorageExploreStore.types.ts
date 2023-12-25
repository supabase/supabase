// [Joshen] This file isn't being used at the moment but its to prepare type files when we refactor
// storage dashboard and use typescript for it

export interface ExplorerColumn {
  id: string
  name: string
  items: ExplorerItem[]
  status?: 'READY' | 'LOADING'

  // New variables to support infinite scrolling
  hasMoreItems: boolean
  isLoadingMoreItems: boolean
}

export interface ExplorerItem {
  id?: string
  name: string
  type: 'FILE' | 'FOLDER'
  status: 'READY' | 'LOADING' | 'EDITING'
  metadata?: ItemMetadata
  updated_at?: string
  last_accessed_at?: string
  created_at?: string
}

export interface ItemMetadata {
  cacheControl: string
  mimetype: string
  size: number
}
