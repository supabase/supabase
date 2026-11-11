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
    }
  ) => ['projects', projectRef, 'entity-types', ...(params ? [params] : [])] as const,
  partitionCount: (projectRef: string | undefined, id: number | undefined) =>
    ['projects', projectRef, 'entity-types', 'partition-count', id] as const,
}
