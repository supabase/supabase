import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { replicationKeys } from './keys'

export type RollbackType = 'individual' | 'full'

type RollbackTableParams = {
  projectRef: string
  pipelineId: number
  tableId: number
  rollbackType: RollbackType
}

type RollbackTableResponse = {
  pipeline_id: number
  table_id: number
  new_state: {
    name: string
    [key: string]: any
  }
}

async function rollbackTableState(
  { projectRef, pipelineId, tableId, rollbackType }: RollbackTableParams,
  signal?: AbortSignal
): Promise<RollbackTableResponse> {
  if (!projectRef) throw new Error('Project reference is required')
  if (!pipelineId) throw new Error('Pipeline ID is required')
  if (!tableId) throw new Error('Table ID is required')
  if (!rollbackType) throw new Error('Rollback type is required')

  const { data, error } = await post(
    '/platform/replication/{ref}/pipelines/{pipeline_id}/rollback-table-state',
    {
      params: { path: { ref: projectRef, pipeline_id: pipelineId } },
      body: { table_id: tableId, rollback_type: rollbackType },
      signal,
    }
  )

  if (error) handleError(error)
  return data
}

type RollbackTableData = Awaited<ReturnType<typeof rollbackTableState>>

export const useRollbackTableMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<RollbackTableData, ResponseError, RollbackTableParams>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<RollbackTableData, ResponseError, RollbackTableParams>(
    (vars) => rollbackTableState(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef, pipelineId } = variables
        await Promise.all([
          queryClient.invalidateQueries(replicationKeys.pipelinesStatus(projectRef, pipelineId)),
          queryClient.invalidateQueries(
            replicationKeys.pipelinesReplicationStatus(projectRef, pipelineId)
          ),
        ])

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to rollback table: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
