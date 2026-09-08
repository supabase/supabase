import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { replicationKeys } from './keys'
import { handleError, post } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type RollbackTablesTarget =
  | { type: 'single_table'; table_id: number }
  | { type: 'all_tables' }
  | { type: 'all_errored_tables' }

type RollbackTablesParams = {
  projectRef: string
  pipelineId: number
  target: RollbackTablesTarget
}

type RolledBackTable = {
  table_id: number
  new_state: {
    name: string
    [key: string]: unknown
  }
}

type RollbackTablesResponse = {
  pipeline_id: number
  tables: RolledBackTable[]
}

async function rollbackTables(
  { projectRef, pipelineId, target }: RollbackTablesParams,
  signal?: AbortSignal
): Promise<RollbackTablesResponse> {
  if (!projectRef) throw new Error('Project reference is required')
  if (!pipelineId) throw new Error('Pipeline ID is required')

  const { data, error } = await post(
    '/platform/replication/{ref}/pipelines/{pipeline_id}/rollback-tables',
    {
      params: { path: { ref: projectRef, pipeline_id: pipelineId } },
      body: { target },
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

  return useMutation<RollbackTablesData, ResponseError, RollbackTablesParams>({
    mutationFn: (vars) => rollbackTables(vars),
    async onSuccess(data, variables, context) {
      const { projectRef, pipelineId } = variables
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
        toast.error(`Failed to restart table replication: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
