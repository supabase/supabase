import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { replicationKeys } from './keys'
import { startPipeline } from './start-pipeline-mutation'
import { stopPipeline } from './stop-pipeline-mutation'
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
  { projectRef, pipelineId, target, rollbackType, pipelineStatusName }: RollbackTablesParams,
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

  // Logic for starting the pipeline back up after a successfull rollback
  if (pipelineStatusName) {
    const shouldStartPipelineAfterRollback = [
      PipelineStatusName.STOPPED,
      PipelineStatusName.STARTED,
      PipelineStatusName.FAILED,
    ].includes(pipelineStatusName)

    try {
      if (pipelineStatusName === PipelineStatusName.STOPPED) {
        await startPipeline({ projectRef, pipelineId })
      } else if (
        pipelineStatusName === PipelineStatusName.STARTED ||
        pipelineStatusName === PipelineStatusName.FAILED
      ) {
        await stopPipeline({ projectRef, pipelineId })
        await startPipeline({ projectRef, pipelineId })
      } else {
        // [Joshen] This error sounds misleading as though the rollback failed?
        throw new Error(
          `Cannot apply rollback while pipeline status is ${
            pipelineStatusName || 'unknown'
          }. Retry once the pipeline status is started, failed, or stopped.`
        )
      }
    } catch (error) {
      if (shouldStartPipelineAfterRollback) {
        throw new Error('RESTART_FAILED', { cause: error })
      } else {
        throw new Error('RESTART_SKIPPED')
      }
    }
  }

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

  return useMutation<RollbackTablesData, ResponseError, RollbackTablesParams>({
    mutationFn: (vars) => rollbackTables(vars),
    async onSuccess(data, variables, context) {
      const { projectRef, pipelineId, pipelineStatusName } = variables
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
        if (data.message === 'RESTART_FAILED') {
          const cause = (data as Error).cause
          const causeMessage = cause instanceof Error ? cause.message : undefined
          toast.error(
            `Rollback completed, but failed to start the pipeline${causeMessage ? `: ${causeMessage}` : ''}`
          )
        } else if (data.message === 'RESTART_SKIPPED') {
          toast(
            'Rollback completed, but the pipeline state changed before it could be resumed. Refresh the page and try again.'
          )
        } else {
          toast.error(`Failed to rollback tables: ${data.message}`)
        }
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
