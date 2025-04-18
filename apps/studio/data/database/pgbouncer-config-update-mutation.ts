import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { components } from 'data/api'
import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { databaseKeys } from './keys'

export type PgbouncerConfigurationUpdateVariables = {
  ref: string
} & Pick<
  components['schemas']['UpdatePgbouncerConfigBody'],
  'default_pool_size' | 'max_client_conn' | 'ignore_startup_parameters'
>

export async function updatePgbouncerConfiguration({
  ref,
  default_pool_size,
  max_client_conn,
  ignore_startup_parameters,
}: PgbouncerConfigurationUpdateVariables) {
  if (!ref) return console.error('Project ref is required')

  const { data, error } = await patch('/platform/projects/{ref}/config/pgbouncer', {
    params: { path: { ref } },
    body: {
      default_pool_size,
      max_client_conn,
      ignore_startup_parameters,
    },
  })

  if (error) handleError(error)
  return data
}

type PgbouncerConfigurationUpdateData = Awaited<ReturnType<typeof updatePgbouncerConfiguration>>

export const usePgbouncerConfigurationUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    PgbouncerConfigurationUpdateData,
    ResponseError,
    PgbouncerConfigurationUpdateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    PgbouncerConfigurationUpdateData,
    ResponseError,
    PgbouncerConfigurationUpdateVariables
  >((vars) => updatePgbouncerConfiguration(vars), {
    async onSuccess(data, variables, context) {
      const { ref } = variables
      await queryClient.invalidateQueries(databaseKeys.pgbouncerConfig(ref))
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update PgBouncer configuration: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
