import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { toast } from 'sonner'

import { classifyError } from '@/data/error-classification'
import { useCreateTenantSourceMutation } from '@/data/replication/create-tenant-source-mutation'
import { replicationSourcesQueryOptions } from '@/data/replication/sources-query'
import type { StudioError } from '@/lib/errors/studio-errors'
import { useReplicationClusterId } from '@/state/replication-cluster'

/** Ensures a project's source exists before creating a pipeline in another region. */
export const useEnsurePipelineRegionSource = (projectRef: string | undefined) => {
  const clusterId = useReplicationClusterId()
  const queryClient = useQueryClient()
  const { mutateAsync: createTenantSource } = useCreateTenantSourceMutation({ onError: () => {} })
  const { mutateAsync, isPending, error, reset } = useMutation<
    void,
    StudioError,
    string | undefined
  >({
    mutationFn: async (targetClusterId) => {
      try {
        if (!projectRef) throw new Error('projectRef is required')
        const { sources } = await queryClient.ensureQueryData(
          replicationSourcesQueryOptions({ projectRef, clusterId: targetClusterId })
        )
        if (!sources.some((source) => source.name === projectRef)) {
          await createTenantSource({ projectRef, clusterId: targetClusterId })
        }
      } catch (error) {
        throw classifyError(error)
      }
    },
    onError: (error) => toast.error(`Failed to prepare pipeline region: ${error.message}`),
  })

  const ensureRegionSource = useCallback(
    async (targetClusterId = clusterId) => {
      try {
        await mutateAsync(targetClusterId)
        return true
      } catch {
        return false
      }
    },
    [clusterId, mutateAsync]
  )

  return { ensureRegionSource, isCreatingSource: isPending, error, reset }
}
