import {
  queryOptions,
  type QueryFunction,
  type QueryKey,
  type UseQueryOptions,
} from '@tanstack/react-query'

/**
 * Type-only marker (no runtime field) on everything `grantedQueryOptions` returns. The type-aware
 * `fga/no-spread-granted-query-options` lint rule finds it by this property name, so don't rename
 * it without updating `scripts/eslint-rules/fga.cjs`.
 */
export type GrantedQueryOptionsBrand = { readonly __grantedQueryOptions?: true }

/** Caller options for grant-gated factories. The factory owns queryKey/queryFn and gates `enabled`. */
export type GrantedQueryCallerOptions<
  TQueryFnData,
  TError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey' | 'queryFn'>

/**
 * Builds query options for a grant-gated query. Without a grant (or other required variables) the
 * factory passes `queryFn: undefined` and forces `enabled: false`.
 *
 * Not `skipToken`: TanStack keeps one options object per cache entry, overwritten by whichever
 * observer rendered last. With `undefined`, a refetch (e.g. after invalidation) borrows the queryFn
 * from a subscribed observer that has one, so a grant-less observer can't break it for the others.
 */
export function grantedQueryOptions<
  TQueryFnData,
  TError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  {
    queryKey,
    queryFn,
  }: { queryKey: TQueryKey; queryFn: QueryFunction<TQueryFnData, TQueryKey> | undefined },
  {
    enabled = true,
    ...options
  }: GrantedQueryCallerOptions<TQueryFnData, TError, TData, TQueryKey> = {}
) {
  const result = queryOptions<TQueryFnData, TError, TData, TQueryKey>({
    ...options,
    queryKey,
    queryFn,
    enabled: queryFn ? enabled : false,
  })
  const branded: typeof result & GrantedQueryOptionsBrand = result
  return branded
}
