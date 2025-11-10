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
      keywords: string | undefined
      filter: string | undefined
      providers: string[] | undefined
      sort: string | undefined
      order: string | undefined
    }
  ) =>
    [
      'projects',
      projectRef,
      'users-infinite',
      ...(params ? [params].filter(Boolean) : []),
    ] as const,
  usersCount: (
    projectRef: string | undefined,
    params?: {
      keywords: string | undefined
      filter: string | undefined
      providers: string[] | undefined
      forceExactCount?: boolean
      column?: OptimizedSearchColumns
    }
  ) =>
    ['projects', projectRef, 'users-count', ...(params ? [params].filter(Boolean) : [])] as const,

  authConfig: (projectRef: string | undefined) => ['projects', projectRef, 'auth-config'] as const,
  accessToken: () => ['access-token'] as const,
}
