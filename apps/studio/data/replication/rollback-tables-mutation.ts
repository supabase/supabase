import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { components } from 'api-types'
import { toast } from 'sonner'

import { replicationKeys } from './keys'
import { handleError, post } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type RollbackTablesTarget = components['schemas']['RollbackTablesBody']['target']

type RollbackTablesParams = {
  projectRef: string
  pipelineId: number
  target: RollbackTablesTarget
}

type RollbackTablesResponse = components['schemas']['RollbackTablesResponse_Output']

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
      // Production OpenAPI still includes the retired rollback_type field.
      body: { target } as components['schemas']['RollbackTablesBody'],
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
        queryClient.invalidateQueries(
          {
            queryKey: replicationKeys.pipelinesStatus(projectRef, pipelineId),
          },
          { cancelRefetch: false }
        ),
        queryClient.invalidateQueries(
          {
            queryKey: replicationKeys.pipelinesReplicationStatus(projectRef, pipelineId),
          },
          { cancelRefetch: false }
        ),
      ])
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      // A reset can commit before runtime recreation fails. Refresh both views after errors.
      await Promise.all([
        queryClient.invalidateQueries(
          {
            queryKey: replicationKeys.pipelinesStatus(variables.projectRef, variables.pipelineId),
          },
          { cancelRefetch: false }
        ),
        queryClient.invalidateQueries(
          {
            queryKey: replicationKeys.pipelinesReplicationStatus(
              variables.projectRef,
              variables.pipelineId
            ),
          },
          { cancelRefetch: false }
        ),
      ])

      if (onError === undefined) {
        toast.error(`Failed to restart table replication: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
