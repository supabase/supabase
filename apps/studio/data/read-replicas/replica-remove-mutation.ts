import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { post } from 'data/fetchers'
import { ResponseError } from 'types'
import { replicaKeys } from './keys'
import { Database } from './replicas-query'

export type ReadReplicaRemoveVariables = {
  projectRef: string
  identifier: string
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
  if (error) throw error
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
        const { projectRef, identifier } = variables

        // [Joshen] Just FYI, will remove this once API changes to remove the need for optimistic rendering
        queryClient.setQueriesData<any>(replicaKeys.list(projectRef), (old: any) => {
          return old.filter((db: Database) => db.identifier !== identifier)
        })

        setTimeout(async () => {
          await queryClient.invalidateQueries(replicaKeys.list(projectRef))
          await queryClient.invalidateQueries(replicaKeys.loadBalancers(projectRef))
        }, 5000)

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
