import { useMutation, type MutateOptions, type UseMutationOptions } from '@tanstack/react-query'
import { useCallback } from 'react'

import { useReplicationClusterId } from '@/state/replication-cluster'

export function useReplicationMutation<
  TData,
  TError,
  TVariables extends { clusterId?: string },
  TContext = unknown,
>(options: UseMutationOptions<TData, TError, TVariables, TContext>) {
  const clusterId = useReplicationClusterId()
  const mutation = useMutation(options)
  const { mutate: mutateWithVariables, mutateAsync: mutateAsyncWithVariables } = mutation
  const mutate = useCallback(
    (variables: TVariables, options?: MutateOptions<TData, TError, TVariables, TContext>) =>
      mutateWithVariables({ ...variables, clusterId: variables.clusterId ?? clusterId }, options),
    [clusterId, mutateWithVariables]
  )
  const mutateAsync = useCallback(
    (variables: TVariables, options?: MutateOptions<TData, TError, TVariables, TContext>) =>
      mutateAsyncWithVariables(
        { ...variables, clusterId: variables.clusterId ?? clusterId },
        options
      ),
    [clusterId, mutateAsyncWithVariables]
  )
  return { ...mutation, mutate, mutateAsync }
}
