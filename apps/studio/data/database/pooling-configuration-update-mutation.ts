import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import type { components } from 'data/api'
import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { databaseKeys } from './keys'

export type PoolingConfigurationUpdateVariables = {
  ref: string
} & components['schemas']['UpdateSupavisorConfigBody']

export async function updatePoolingConfiguration({
  ref,
  pool_mode,
  default_pool_size,
}: PoolingConfigurationUpdateVariables) {
  if (!ref) return console.error('Project ref is required')

  const { data, error } = await patch('/platform/projects/{ref}/config/supavisor', {
    params: { path: { ref } },
    body: { default_pool_size, pool_mode },
  })

  if (error) handleError(error)
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
