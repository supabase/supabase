import { QueryKey } from '@tanstack/react-query'

export const sqlKeys = {
  query: (projectRef: string | undefined, queryKey: QueryKey) =>
    ['projects', projectRef, 'query', ...queryKey] as const,
}
