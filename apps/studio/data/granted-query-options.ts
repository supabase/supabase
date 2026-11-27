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
 * Fallback `queryFn` for grant-less observers. Avoids TanStack's dev `No queryFn` error (which
 * fires on `undefined` even when `enabled: false`) while still delegating to a granted observer on
 * invalidation (unlike `skipToken`, which fails if a grant-less observer rendered last).
 */
const fallbackQueryFn: QueryFunction<never, QueryKey> = (context) => {
  const query = context.client.getQueryCache().find({ queryKey: context.queryKey, exact: true })
  const queryFn = query?.observers.find(
    (o) => typeof o.options.queryFn === 'function' && o.options.queryFn !== fallbackQueryFn
  )?.options.queryFn
  if (typeof queryFn === 'function') return queryFn(context)
  return Promise.reject(new Error(`Missing queryFn: '${query?.queryHash}'`))
}

/**
 * Builds query options for a grant-gated query. Without a grant (or other required variables) the
 * factory passes `queryFn: undefined` and this helper forces `enabled: false` with a delegating
 * fallback `queryFn`.
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
    queryFn: queryFn ?? fallbackQueryFn,
    enabled: queryFn ? enabled : false,
  })
  const branded: typeof result & GrantedQueryOptionsBrand = result
  return branded
}
