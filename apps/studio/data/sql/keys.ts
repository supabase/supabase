import type { QueryKey } from '@tanstack/react-query'

export const sqlKeys = {
  query: (projectRef: string | undefined, queryKey: QueryKey) =>
    ['projects', projectRef, 'query', ...queryKey] as const,
  editableResult: (projectRef: string | undefined, args: unknown) =>
    ['projects', projectRef, 'query-result-editing', args] as const,
  resultRow: (projectRef: string | undefined, args: unknown) =>
    ['projects', projectRef, 'query-result-row', args] as const,
}
