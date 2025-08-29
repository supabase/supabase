import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { components } from 'data/api'
import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { databaseKeys } from './keys'

export type PgbouncerConfigurationUpdateVariables = {
  ref: string
  slug: string
} & Pick<
  components['schemas']['UpdatePgbouncerConfigBody'],
  'default_pool_size' | 'max_client_conn' | 'ignore_startup_parameters'
>

export async function updatePgbouncerConfiguration({
  slug,
  ref,
  default_pool_size,
  max_client_conn,
  ignore_startup_parameters,
}: PgbouncerConfigurationUpdateVariables) {
  if (!slug) return console.error('Organization slug is required')
  if (!ref) return console.error('Project ref is required')

  const { data, error } = await patch('/platform/organizations/{slug}/projects/{ref}/config/pgbouncer', {
    params: {
      path: {
        slug: slug,
        ref: ref,
      },
    },
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
      const { ref, slug } = variables
      await queryClient.invalidateQueries(databaseKeys.pgbouncerConfig(slug, ref))
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
