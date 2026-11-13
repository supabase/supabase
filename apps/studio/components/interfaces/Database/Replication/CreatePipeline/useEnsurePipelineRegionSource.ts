import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useCreateTenantSourceMutation } from '@/data/replication/create-tenant-source-mutation'
import { replicationSourcesQueryOptions } from '@/data/replication/sources-query'
import type { StudioError } from '@/lib/errors/studio-errors'
import { useReplicationClusterId } from '@/state/replication-cluster'

/**
 * Replication is enabled in the default cluster, so another region gets the project's source the
 * first time a pipeline is created there.
 */
export const useEnsurePipelineRegionSource = (projectRef: string | undefined) => {
  const clusterId = useReplicationClusterId()
  const queryClient = useQueryClient()
  const { mutateAsync: createTenantSource, isPending: isCreatingSource } =
    useCreateTenantSourceMutation()

  const ensureRegionSource = async (targetClusterId = clusterId) => {
    if (!projectRef) return false
    try {
      const { sources } = await queryClient.ensureQueryData(
        replicationSourcesQueryOptions({ projectRef, clusterId: targetClusterId })
      )
      if (sources.some((source) => source.name === projectRef)) return true
    } catch (error) {
      toast.error(`Failed to load the pipeline region: ${(error as StudioError).message}`)
      return false
    }
    try {
      await createTenantSource({ projectRef, clusterId: targetClusterId })
      return true
    } catch {
      return false
    }
  }

  return { ensureRegionSource, isCreatingSource }
}
