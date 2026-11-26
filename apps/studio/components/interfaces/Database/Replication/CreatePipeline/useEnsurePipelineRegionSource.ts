import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { classifyError } from '@/data/error-classification'
import { useCreateTenantSourceMutation } from '@/data/replication/create-tenant-source-mutation'
import { replicationSourcesQueryOptions } from '@/data/replication/sources-query'
import type { StudioError } from '@/lib/errors/studio-errors'

/** Ensures a project's source exists before creating a pipeline in another region. */
export const useEnsurePipelineRegionSource = (projectRef: string | undefined) => {
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
        const sourceOptions = {
          ...replicationSourcesQueryOptions({ projectRef, clusterId: targetClusterId }),
          staleTime: 0,
        }
        const { sources } = await queryClient.fetchQuery(sourceOptions)
        if (!sources.some((source) => source.name === projectRef)) {
          await createTenantSource({ projectRef, clusterId: targetClusterId })
          await queryClient.fetchQuery(sourceOptions)
        }
      } catch (error) {
        throw classifyError(error)
      }
    },
  })

  const ensureRegionSource = useCallback(
    async (targetClusterId: string | undefined) => {
      try {
        await mutateAsync(targetClusterId)
        return true
      } catch {
        return false
      }
    },
    [mutateAsync]
  )

  return { ensureRegionSource, isCreatingSource: isPending, error, reset }
}
