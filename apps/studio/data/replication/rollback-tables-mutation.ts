import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { replicationKeys } from './keys'
import { useRestartPipelineHelper } from './restart-pipeline-helper'

export type RollbackType = 'individual' | 'full'

export type RollbackTablesTarget =
  | { type: 'single_table'; table_id: number }
  | { type: 'all_tables' }
  | { type: 'all_errored_tables' }

type RollbackTablesParams = {
  projectRef: string
  pipelineId: number
  target: RollbackTablesTarget
  rollbackType: RollbackType
}

type RolledBackTable = {
  table_id: number
  new_state: {
    name: string
    [key: string]: any
  }
}

type RollbackTablesResponse = {
  pipeline_id: number
  tables: RolledBackTable[]
}

async function rollbackTables(
  { projectRef, pipelineId, target, rollbackType }: RollbackTablesParams,
  signal?: AbortSignal
): Promise<RollbackTablesResponse> {
  if (!projectRef) throw new Error('Project reference is required')
  if (!pipelineId) throw new Error('Pipeline ID is required')
  if (!rollbackType) throw new Error('Rollback type is required')

  const { data, error } = await post(
    '/platform/replication/{ref}/pipelines/{pipeline_id}/rollback-tables',
    {
      params: { path: { ref: projectRef, pipeline_id: pipelineId } },
      body: { target, rollback_type: rollbackType },
      signal,
    }
  )

  if (error) handleError(error)
  return data
}

type RollbackTablesData = Awaited<ReturnType<typeof rollbackTables>>

export const useRollbackTablesMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<RollbackTablesData, ResponseError, RollbackTablesParams>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  const { restartPipeline } = useRestartPipelineHelper()

  return useMutation<RollbackTablesData, ResponseError, RollbackTablesParams>({
    mutationFn: (vars) => rollbackTables(vars),
    async onSuccess(data, variables, context) {
      const { projectRef, pipelineId } = variables

      // Restart the pipeline (stop + start)
      try {
        await restartPipeline({ projectRef, pipelineId })
      } catch (error: any) {
        toast.error(`Rollback succeeded but failed to restart pipeline: ${error.message}`)
        throw error
      }

      // Invalidate queries after restart to get the latest state
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: replicationKeys.pipelinesStatus(projectRef, pipelineId),
        }),
        queryClient.invalidateQueries({
          queryKey: replicationKeys.pipelinesReplicationStatus(projectRef, pipelineId),
        }),
      ])

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to rollback tables: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
