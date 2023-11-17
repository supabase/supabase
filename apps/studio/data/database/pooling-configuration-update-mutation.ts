import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { patch } from 'data/fetchers'
import { ResponseError } from 'types'
import { databaseKeys } from './keys'

export type PoolingConfigurationUpdateVariables = {
  ref: string
  pgbouncer_enabled: boolean
  ignore_startup_parameters: string
  pool_mode: 'transaction' | 'session' | 'statement'
  default_pool_size?: number
  max_client_conn?: number | null
}

export async function updatePoolingConfiguration({
  ref,
  pgbouncer_enabled,
  ignore_startup_parameters,
  pool_mode,
  default_pool_size,
  max_client_conn,
}: PoolingConfigurationUpdateVariables) {
  if (!ref) return console.error('Project ref is required')

  const { data, error } = await patch('/platform/projects/{ref}/config/pgbouncer', {
    params: { path: { ref } },
    body: {
      pgbouncer_enabled,
      default_pool_size,
      ignore_startup_parameters,
      pool_mode,
      max_client_conn,
    },
  })

  if (error) throw error
  return data
}

type PoolingConfigurationUpdateData = Awaited<ReturnType<typeof updatePoolingConfiguration>>

export const usePoolingConfigurationUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    PoolingConfigurationUpdateData,
    ResponseError,
    PoolingConfigurationUpdateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    PoolingConfigurationUpdateData,
    ResponseError,
    PoolingConfigurationUpdateVariables
  >((vars) => updatePoolingConfiguration(vars), {
    async onSuccess(data, variables, context) {
      const { ref } = variables
      await queryClient.invalidateQueries(databaseKeys.poolingConfiguration(ref))
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update pooling configuration: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
