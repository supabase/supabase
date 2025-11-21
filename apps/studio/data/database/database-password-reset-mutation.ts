import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, patch } from 'data/fetchers'
import { projectKeys } from 'data/projects/keys'
import type { ResponseError, UseCustomMutationOptions } from 'types'

export type DatabasePasswordResetVariables = {
  ref: string
  password: string
}

export async function resetDatabasePassword({ ref, password }: DatabasePasswordResetVariables) {
  if (!ref) return console.error('Project ref is required')

  const { data, error } = await patch('/platform/projects/{ref}/db-password', {
    params: { path: { ref } },
    body: { password },
  })

  if (error) handleError(error)
  return data
}

type DatabasePasswordResetData = Awaited<ReturnType<typeof resetDatabasePassword>>

export const useDatabasePasswordResetMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    DatabasePasswordResetData,
    ResponseError,
    DatabasePasswordResetVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabasePasswordResetData, ResponseError, DatabasePasswordResetVariables>({
    mutationFn: (vars) => resetDatabasePassword(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.ref) })

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to reset database password: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
