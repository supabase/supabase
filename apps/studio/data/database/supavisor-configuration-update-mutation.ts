import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { components } from 'data/api'
import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { databaseKeys } from './keys'

type SupavisorConfigurationUpdateVariables = {
  ref: string
} & components['schemas']['UpdateSupavisorConfigBody']

export async function updateSupavisorConfiguration({
  ref,
  default_pool_size,
}: SupavisorConfigurationUpdateVariables) {
  if (!ref) return console.error('Project ref is required')

  const { data, error } = await patch('/platform/projects/{ref}/config/supavisor', {
    params: { path: { ref } },
    body: { default_pool_size },
  })

  if (error) handleError(error)
  return data
}

type SupavisorConfigurationUpdateData = Awaited<ReturnType<typeof updateSupavisorConfiguration>>

export const useSupavisorConfigurationUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    SupavisorConfigurationUpdateData,
    ResponseError,
    SupavisorConfigurationUpdateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    SupavisorConfigurationUpdateData,
    ResponseError,
    SupavisorConfigurationUpdateVariables
  >((vars) => updateSupavisorConfiguration(vars), {
    async onSuccess(data, variables, context) {
      const { ref } = variables
      await queryClient.invalidateQueries(databaseKeys.poolingConfiguration(ref))
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update Shared Pooler configuration: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
