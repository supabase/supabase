import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { replicationKeys } from './keys'
import { useReplicationMutation } from './use-cluster-mutation'
import { handleError, post } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomMutationOptions } from '@/types'

export type CreateTenantSourceParams = {
  projectRef: string
  clusterId?: string
}

async function createTenantSource(
  { projectRef, clusterId }: CreateTenantSourceParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await post('/platform/replication/{ref}/tenants-sources', {
    params: { path: { ref: projectRef }, query: { cluster_id: clusterId } },
    signal,
  })
  if (error) {
    handleError(error)
  }

  return data
}

type CreateTenantSourceData = Awaited<ReturnType<typeof createTenantSource>>

export const useCreateTenantSourceMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<CreateTenantSourceData, StudioError, CreateTenantSourceParams>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useReplicationMutation<CreateTenantSourceData, StudioError, CreateTenantSourceParams>({
    mutationFn: (vars) => createTenantSource(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({
        queryKey: replicationKeys.sources(projectRef, variables.clusterId),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to create tenant or source: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
