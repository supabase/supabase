// Minimal stand-in for data/granted-query-options.ts used by the typed lint rule tests.
import { queryOptions } from '@tanstack/react-query'

export type GrantedQueryOptionsBrand = { readonly __grantedQueryOptions?: true }

export function grantedQueryOptions<T>(
  {
    queryKey,
    queryFn,
  }: { queryKey: readonly (string | undefined)[]; queryFn: (() => Promise<T>) | undefined },
  { enabled = true }: { enabled?: boolean } = {}
) {
  const result = queryOptions({ queryKey, queryFn, enabled: queryFn ? enabled : false })
  const branded: typeof result & GrantedQueryOptionsBrand = result
  return branded
}

export const apiKeysQueryOptions = (
  { projectRef, grant }: { projectRef?: string; grant?: object },
  options?: { enabled?: boolean }
) =>
  grantedQueryOptions(
    {
      queryKey: ['api-keys', projectRef],
      queryFn: projectRef && grant ? async () => [] as string[] : undefined,
    },
    options
  )

export const plainQueryOptions = ({ projectRef }: { projectRef?: string }) =>
  queryOptions({ queryKey: ['plain', projectRef], queryFn: async () => [] as string[] })
