import type { OptimizedSearchColumns } from '@supabase/pg-meta/src/sql/studio/get-users-types'

export const authKeys = {
  users: (
    projectRef: string | undefined,
    params?: {
      page: number | undefined
      keywords: string | undefined
      filter: string | undefined
    }
  ) => ['projects', projectRef, 'users', ...(params ? [params] : [])] as const,

  usersQuery: (
    projectRef: string | undefined,
    params?: {
      query: string
      startAt: string
    }
  ) => ['projects', projectRef, 'users-query', ...(params ? [params] : [])] as const,

  usersInfinite: (
    projectRef: string | undefined,
    params?: {
      keywords?: string
      filter?: string
      providers?: string[]
      sort?: string
      order?: string
      column?: OptimizedSearchColumns
    }
  ) => ['projects', projectRef, 'users-infinite', params] as const,
  usersCount: (
    projectRef: string | undefined,
    params?: {
      keywords?: string
      filter?: string
      providers?: string[]
      forceExactCount?: boolean
      column?: OptimizedSearchColumns
    }
  ) => ['projects', projectRef, 'users-count', params] as const,

  usersIndexStatuses: (projectRef: string | undefined) =>
    ['projects', projectRef, 'users-index-statuses'] as const,
  indexWorkerStatus: (projectRef: string | undefined) =>
    ['projects', projectRef, 'index-worker-status'] as const,
  authConfig: (projectRef: string | undefined) => ['projects', projectRef, 'auth-config'] as const,
  accessToken: () => ['access-token'] as const,
  overviewMetrics: (projectRef: string | undefined) =>
    ['projects', projectRef, 'auth-overview-metrics'] as const,
}
