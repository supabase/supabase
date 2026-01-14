import type { OptimizedSearchColumns } from '@supabase/pg-meta/src/sql/studio/get-users-types'

export const authKeys = {
  user: (projectRef: string | undefined, userId?: string | null) =>
    ['projects', projectRef, 'user', userId] as const,
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
  ) => ['projects', projectRef, 'users-infinite', params].filter(Boolean),
  usersCount: (
    projectRef: string | undefined,
    params?: {
      keywords?: string
      filter?: string
      providers?: string[]
      forceExactCount?: boolean
      column?: OptimizedSearchColumns
    }
  ) => ['projects', projectRef, 'users-count', params].filter(Boolean),

  usersIndexStatuses: (projectRef: string | undefined) =>
    ['projects', projectRef, 'users-index-statuses'] as const,
  indexWorkerStatus: (projectRef: string | undefined) =>
    ['projects', projectRef, 'index-worker-status'] as const,
  authConfig: (projectRef: string | undefined) => ['projects', projectRef, 'auth-config'] as const,
  accessToken: () => ['access-token'] as const,
  overviewMetrics: (projectRef: string | undefined) =>
    ['projects', projectRef, 'auth-overview-metrics'] as const,
}
