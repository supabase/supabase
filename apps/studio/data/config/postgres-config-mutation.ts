import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { configKeys } from './keys'
import { handleError, put } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type PostgresConfigurationUpdateVariables = {
  projectRef: string
  payload: {
    log_connections: boolean
    log_disconnections: boolean
  }
}

export async function updatePostgresConfiguration({
  projectRef,
  payload,
}: PostgresConfigurationUpdateVariables) {
  const { data, error } = await put('/v1/projects/{ref}/config/database/postgres', {
    params: { path: { ref: projectRef } },
    body: payload,
  })

  if (error) handleError(error)
  return data
}

type PostgresConfigurationUpdateData = Awaited<ReturnType<typeof updatePostgresConfiguration>>

export const usePostgresConfigurationUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    PostgresConfigurationUpdateData,
    ResponseError,
    PostgresConfigurationUpdateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    PostgresConfigurationUpdateData,
    ResponseError,
    PostgresConfigurationUpdateVariables
  >({
    mutationFn: (vars) => updatePostgresConfiguration(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({
        queryKey: configKeys.postgresConfig(projectRef),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update postgres configuration: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
