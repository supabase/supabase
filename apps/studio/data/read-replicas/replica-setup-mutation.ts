import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { replicaKeys } from './keys'
import type { Database } from './replicas-query'

export type Region =
  | 'us-east-1'
  | 'us-west-1'
  | 'us-west-2'
  | 'ap-southeast-1'
  | 'ap-northeast-1'
  | 'ap-northeast-2'
  | 'ap-southeast-2'
  | 'eu-west-1'
  | 'eu-west-2'
  | 'eu-west-3'
  | 'eu-central-1'
  | 'ca-central-1'
  | 'ap-south-1'
  | 'sa-east-1'

export type ReadReplicaSetUpVariables = {
  projectRef: string
  region: Region
  size: string // Not used in API yet, purely for UI atm
}

export async function setUpReadReplica({ projectRef, region }: ReadReplicaSetUpVariables) {
  const { data, error } = await post('/v1/projects/{ref}/read-replicas/setup', {
    params: {
      path: { ref: projectRef },
    },
    body: {
      read_replica_region: region,
    },
  })
  if (error) throw error
  return data
}

type ReadReplicaSetUpData = Awaited<ReturnType<typeof setUpReadReplica>>

export const useReadReplicaSetUpMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ReadReplicaSetUpData, ResponseError, ReadReplicaSetUpVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<ReadReplicaSetUpData, ResponseError, ReadReplicaSetUpVariables>(
    (vars) => setUpReadReplica(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef, region, size } = variables

        // [Joshen] Just FYI, will remove this once API changes to remove the need for optimistic rendering
        queryClient.setQueriesData<any>(replicaKeys.list(projectRef), (old: any) => {
          const scaffoldNewDatabase: Database = {
            db_port: 5432,
            db_name: 'postgres',
            db_user: 'postgres',
            restUrl: '',
            db_host: '',
            connectionString: '',
            identifier: `${projectRef}-rr-${region}-None`,
            size,
            region,
            inserted_at: new Date().toISOString(),
            status: 'COMING_UP',
            cloud_provider: 'AWS',
          }
          return [...old, scaffoldNewDatabase]
        })

        // [Joshen] Wait 30 seconds before checking if the replica actually is coming up
        setTimeout(async () => {
          await queryClient.invalidateQueries(replicaKeys.list(projectRef))
        }, 30000)

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to set up read replica: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
