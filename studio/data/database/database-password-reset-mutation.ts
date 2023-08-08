import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { patch } from 'data/fetchers'
import { ResponseError } from 'types'

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

  if (error) throw error
  return data
}

type DatabasePasswordResetData = Awaited<ReturnType<typeof resetDatabasePassword>>

export const useDatabasePasswordResetMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabasePasswordResetData, ResponseError, DatabasePasswordResetVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<DatabasePasswordResetData, ResponseError, DatabasePasswordResetVariables>(
    (vars) => resetDatabasePassword(vars),
    {
      async onSuccess(data, variables, context) {
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
    }
  )
}
