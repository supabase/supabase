import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { replicationKeys } from './keys'
import { useRestartPipelineHelper } from './restart-pipeline-helper'
import { useStartPipelineMutation } from './start-pipeline-mutation'
import { PipelineStatusName } from '@/components/interfaces/Database/Replication/Replication.constants'
import { handleError, post } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

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
  pipelineStatusName?: PipelineStatusName
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
  const { mutateAsync: startPipeline } = useStartPipelineMutation()

  return useMutation<RollbackTablesData, ResponseError, RollbackTablesParams>({
    mutationFn: (vars) => rollbackTables(vars),
    async onSuccess(data, variables, context) {
      const { projectRef, pipelineId, pipelineStatusName } = variables
      let action: 'starting' | 'restarting' | 'unknown' = 'unknown'
      let resumeError: Error | null = null

      // Start or restart the pipeline after rollback.
      // Stopped pipelines only need a start (already stopped, no need to stop first).
      try {
        const canStartPipeline = pipelineStatusName === PipelineStatusName.STOPPED
        const canRestartPipeline =
          pipelineStatusName === PipelineStatusName.STARTED ||
          pipelineStatusName === PipelineStatusName.FAILED

        const postRollbackAction = canStartPipeline
          ? 'start'
          : canRestartPipeline
            ? 'restart'
            : 'unknown'

        action =
          postRollbackAction === 'start'
            ? 'starting'
            : postRollbackAction === 'restart'
              ? 'restarting'
              : 'unknown'

        if (postRollbackAction === 'unknown') {
          throw new Error(
            `Cannot apply rollback while pipeline status is ${
              pipelineStatusName || 'unknown'
            }. Retry once the pipeline status is started, failed, or stopped.`
          )
        }

        if (postRollbackAction === 'start') {
          await startPipeline({ projectRef, pipelineId })
        } else {
          await restartPipeline({ projectRef, pipelineId })
        }
      } catch (error: any) {
        resumeError = error instanceof Error ? error : new Error(String(error))
        if (action === 'unknown') {
          toast.error(
            'Rollback completed, but the pipeline state changed before it could be resumed. Refresh the page and try again.'
          )
        } else {
          toast.error(
            `Rollback completed, but failed to ${action} the pipeline: ${resumeError.message}`
          )
        }
      } finally {
        // Always refresh the pipeline + table status after a successful rollback, even if
        // the follow-up pipeline action failed, so the UI does not stay on stale table state.
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: replicationKeys.pipelinesStatus(projectRef, pipelineId),
          }),
          queryClient.invalidateQueries({
            queryKey: replicationKeys.pipelinesReplicationStatus(projectRef, pipelineId),
          }),
        ])
      }

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
