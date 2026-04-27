import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { replicationKeys } from './keys'
import { del, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type DeleteReplicationTenantParams = {
  projectRef: string
}

export async function deleteReplicationTenant(
  { projectRef }: DeleteReplicationTenantParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await del('/platform/replication/{ref}/tenants', {
    params: { path: { ref: projectRef } },
    signal,
  })
  if (error) handleError(error)

  return data
}

type DeleteReplicationTenantData = Awaited<ReturnType<typeof deleteReplicationTenant>>

export const useDeleteReplicationTenantMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    DeleteReplicationTenantData,
    ResponseError,
    DeleteReplicationTenantParams
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DeleteReplicationTenantData, ResponseError, DeleteReplicationTenantParams>({
    mutationFn: (vars) => deleteReplicationTenant(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: replicationKeys.sources(projectRef) }),
        queryClient.invalidateQueries({ queryKey: replicationKeys.destinations(projectRef) }),
        queryClient.invalidateQueries({ queryKey: replicationKeys.pipelines(projectRef) }),
      ])

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to disable external replication: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
