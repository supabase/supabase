import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { replicaKeys } from './keys'

export type ReadReplicaRemoveVariables = {
  projectRef: string
  identifier: string
  invalidateReplicaQueries: boolean
}

export async function removeReadReplica({ projectRef, identifier }: ReadReplicaRemoveVariables) {
  const { data, error } = await post('/v1/projects/{ref}/read-replicas/remove', {
    params: {
      path: { ref: projectRef },
    },
    body: {
      database_identifier: identifier,
    },
  })
  if (error) handleError(error)
  return data
}

type ReadReplicaRemoveData = Awaited<ReturnType<typeof removeReadReplica>>

export const useReadReplicaRemoveMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ReadReplicaRemoveData, ResponseError, ReadReplicaRemoveVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<ReadReplicaRemoveData, ResponseError, ReadReplicaRemoveVariables>(
    (vars) => removeReadReplica(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef, invalidateReplicaQueries } = variables

        if (invalidateReplicaQueries) {
          await Promise.all([
            queryClient.invalidateQueries(replicaKeys.list(projectRef)),
            queryClient.invalidateQueries(replicaKeys.loadBalancers(projectRef)),
          ])
        }

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to remove read replica: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
