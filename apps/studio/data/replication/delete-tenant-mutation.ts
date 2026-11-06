import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { replicationKeys } from './keys'
import { useReplicationMutation } from './use-cluster-mutation'
import { del, handleError } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomMutationOptions } from '@/types'

export type DeleteReplicationTenantParams = {
  projectRef: string
  clusterId?: string
}

export async function deleteReplicationTenant(
  { projectRef, clusterId }: DeleteReplicationTenantParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await del('/platform/replication/{ref}/tenants', {
    params: { path: { ref: projectRef }, query: { cluster_id: clusterId } },
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
  UseCustomMutationOptions<DeleteReplicationTenantData, StudioError, DeleteReplicationTenantParams>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useReplicationMutation<
    DeleteReplicationTenantData,
    StudioError,
    DeleteReplicationTenantParams
  >({
    mutationFn: (vars) => deleteReplicationTenant(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: replicationKeys.sources(projectRef, variables.clusterId),
        }),
        queryClient.invalidateQueries({
          queryKey: replicationKeys.destinations(projectRef, variables.clusterId),
        }),
        queryClient.invalidateQueries({
          queryKey: replicationKeys.pipelines(projectRef, variables.clusterId),
        }),
      ])

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to disable Pipelines: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
