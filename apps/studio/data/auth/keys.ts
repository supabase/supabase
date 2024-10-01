export const authKeys = {
  users: (
    projectRef: string | undefined,
    params?: {
      page: number | undefined
      keywords: string | undefined
      filter: string | undefined
    }
  ) => ['auth', projectRef, 'users', ...(params ? [params] : [])] as const,

  usersInfinite: (
    projectRef: string | undefined,
    params?: {
      keywords: string | undefined
      filter: string | undefined
      providers: string[] | undefined
      sort: string | undefined
      order: string | undefined
    }
  ) => ['auth', projectRef, 'users-infinite', ...(params ? [params].filter(Boolean) : [])] as const,
  usersCount: (
    projectRef: string | undefined,
    params?: {
      keywords: string | undefined
      filter: string | undefined
      providers: string[] | undefined
    }
  ) => ['auth', projectRef, 'users-count', ...(params ? [params].filter(Boolean) : [])] as const,

  authConfig: (projectRef: string | undefined) => ['auth', projectRef, 'config'] as const,
  accessToken: () => ['access-token'] as const,
}
