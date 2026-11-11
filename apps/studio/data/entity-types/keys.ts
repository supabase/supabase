export const entityTypeKeys = {
  list: (
    projectRef: string | undefined,
    params?: {
      schemas?: string[]
      search?: string
      sort?: 'alphabetical' | 'grouped-alphabetical'
      limit?: number
      filterTypes?: string[]
      excludePartitions?: boolean
      parentId?: number
    }
  ) => ['projects', projectRef, 'entity-types', ...(params ? [params] : [])] as const,
  partitionCount: (projectRef: string | undefined, id: number | undefined) =>
    ['projects', projectRef, 'entity-types', 'partition-count', id] as const,
  partitionInfo: (projectRef: string | undefined, id: number | undefined) =>
    ['projects', projectRef, 'entity-types', 'partition-info', id] as const,
  byIds: (projectRef: string | undefined, ids: number[]) =>
    ['projects', projectRef, 'entity-types', 'by-ids', ...ids] as const,
}
