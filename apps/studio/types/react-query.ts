import type {
  DefaultError,
  QueryKey,
  UseInfiniteQueryOptions,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query'

export type UseCustomQueryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey'>

type CustomMutationCallback<TCallback extends (...args: never[]) => unknown> = (
  dataOrError: Parameters<TCallback>[0],
  variables: Parameters<TCallback>[1],
  optimisticContext: Parameters<TCallback>[2]
) => ReturnType<TCallback>

// Studio mutation hooks forward the optimistic result as their third argument.
// Their custom callbacks retain that contract separately from the SDK's mutation context.
export type UseCustomMutationOptions<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
> = Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'onSuccess' | 'onError'> & {
  onSuccess?: CustomMutationCallback<
    NonNullable<UseMutationOptions<TData, TError, TVariables, TContext>['onSuccess']>
  >
  onError?: CustomMutationCallback<
    NonNullable<UseMutationOptions<TData, TError, TVariables, TContext>['onError']>
  >
}

export type UseCustomInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = Omit<
  UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
  'queryKey' | 'getNextPageParam' | 'initialPageParam'
>
